import type { Job } from "bullmq";
import { type ProgressEvent } from "@veda/shared";
import { AssignmentModel } from "../models/assignment.js";
import { generatePaper } from "../ai/generate.js";
import { getCachedPaper, setCachedPaper } from "../lib/cache.js";

export interface GenerationJobData {
  assignmentId: string;
}

export async function processGeneration(job: Job<GenerationJobData>): Promise<void> {
  const { assignmentId } = job.data;

  const report = (progress: number, message: string) => {
    const event: ProgressEvent = {
      assignmentId,
      status: "processing",
      progress,
      message,
    };
    return job.updateProgress(event);
  };

  const doc = await AssignmentModel.findById(assignmentId);
  if (!doc) throw new Error(`Assignment ${assignmentId} not found`);

  try {
    doc.status = "processing";
    await doc.save();
    await report(5, "Starting generation");

    const input = doc.input as Parameters<typeof generatePaper>[0];

    // Cache fast-path: identical inputs reuse a prior paper, no LLM call.
    const cached = await getCachedPaper(input);
    const paper = cached
      ? (await report(60, "Reusing cached paper"), cached)
      : await generatePaper(input, { onProgress: report });

    if (!cached) await setCachedPaper(input, paper);

    doc.paper = paper;
    doc.status = "completed";
    doc.error = null;
    await doc.save();
    await report(100, "Question paper ready");
  } catch (err) {
    const message = err instanceof Error ? err.message : "Generation failed";
    doc.status = "failed";
    doc.error = message;
    await doc.save();
    throw err; // surfaces to BullMQ -> QueueEvents 'failed' -> websocket
  }
}
