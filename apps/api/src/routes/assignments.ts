import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";
import { Router } from "express";
import multer from "multer";
// Import the implementation directly to avoid pdf-parse's debug self-test on the index module.
import pdfParse from "pdf-parse/lib/pdf-parse.js";
import { AssignmentInputSchema } from "@veda/shared";
import { AssignmentModel, toAssignment } from "../models/assignment.js";
import { generationQueue, pdfQueue, pdfQueueEvents } from "../lib/queue.js";
import { asyncHandler } from "../middleware/error.js";

export const assignmentsRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});

/** Extract plain text from an uploaded PDF or text file. */
async function extractText(file: Express.Multer.File): Promise<string> {
  if (file.mimetype === "application/pdf") {
    const parsed = await pdfParse(file.buffer);
    return parsed.text.trim();
  }
  // Treat everything else as UTF-8 text.
  return file.buffer.toString("utf-8").trim();
}

/** Queue a generation job using the assignmentId as a stable jobId. */
async function enqueue(assignmentId: string): Promise<void> {
  await generationQueue.add(
    "generate",
    { assignmentId },
    { jobId: assignmentId },
  );
}

/**
 * POST /api/assignments
 * multipart/form-data:
 *   - payload: JSON string of AssignmentInput (without sourceText)
 *   - file:    optional PDF / text file
 */
assignmentsRouter.post(
  "/assignments",
  upload.single("file"),
  asyncHandler(async (req, res) => {
    const rawPayload = req.body?.payload;
    if (typeof rawPayload !== "string") {
      res.status(400).json({ error: "MissingPayload" });
      return;
    }

    const sourceText = req.file ? await extractText(req.file) : "";
    const parsed = JSON.parse(rawPayload);

    // Validate the merged input — throws ZodError -> 400 via error middleware.
    const input = AssignmentInputSchema.parse({ ...parsed, sourceText });

    const doc = await AssignmentModel.create({ status: "queued", input });
    await enqueue(doc.id);

    res.status(202).json({ assignmentId: doc.id, status: "queued" });
  }),
);

/** GET /api/assignments — list all, newest first (for the dashboard). */
assignmentsRouter.get(
  "/assignments",
  asyncHandler(async (_req, res) => {
    const docs = await AssignmentModel.find()
      .sort({ createdAt: -1 })
      .limit(100);
    res.json(docs.map(toAssignment));
  }),
);

/** GET /api/assignments/:id */
assignmentsRouter.get(
  "/assignments/:id",
  asyncHandler(async (req, res) => {
    const doc = await AssignmentModel.findById(req.params.id);
    if (!doc) {
      res.status(404).json({ error: "NotFound" });
      return;
    }
    res.json(toAssignment(doc));
  }),
);

/** POST /api/assignments/:id/regenerate — re-run generation for the same input. */
assignmentsRouter.post(
  "/assignments/:id/regenerate",
  asyncHandler(async (req, res) => {
    const doc = await AssignmentModel.findById(req.params.id);
    if (!doc) {
      res.status(404).json({ error: "NotFound" });
      return;
    }
    doc.status = "queued";
    doc.paper = null;
    doc.error = null;
    await doc.save();

    // Remove any previous job with this id, then re-add.
    await generationQueue.remove(doc.id).catch(() => undefined);
    await enqueue(doc.id);

    res.status(202).json({ assignmentId: doc.id, status: "queued" });
  }),
);

/** DELETE /api/assignments/:id — remove an assignment (list page menu action). */
assignmentsRouter.delete(
  "/assignments/:id",
  asyncHandler(async (req, res) => {
    const id = req.params.id as string;
    const doc = await AssignmentModel.findByIdAndDelete(id);
    if (!doc) {
      res.status(404).json({ error: "NotFound" });
      return;
    }
    await generationQueue.remove(id).catch(() => undefined);
    res.status(204).end();
  }),
);

/**
 * GET /api/assignments/:id/pdf
 * Enqueues a PDF render job (BullMQ), waits for it to finish, then streams
 * the generated A4 PDF. Returns 409 if the paper isn't ready yet.
 */
assignmentsRouter.get(
  "/assignments/:id/pdf",
  asyncHandler(async (req, res) => {
    const id = req.params.id as string;
    const doc = await AssignmentModel.findById(id);
    if (!doc) {
      res.status(404).json({ error: "NotFound" });
      return;
    }
    if (doc.status !== "completed" || !doc.paper) {
      res.status(409).json({ error: "PaperNotReady" });
      return;
    }

    const job = await pdfQueue.add(
      "render",
      { assignmentId: id },
      { jobId: `pdf:${id}:${Date.now()}` },
    );

    try {
      const result = (await job.waitUntilFinished(pdfQueueEvents, 60_000)) as {
        path: string;
      };
      await stat(result.path);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${path.basename(result.path)}"`,
      );
      createReadStream(result.path).pipe(res);
    } catch {
      res
        .status(503)
        .json({ error: "PdfRenderFailed", message: "Could not render PDF" });
    }
  }),
);
