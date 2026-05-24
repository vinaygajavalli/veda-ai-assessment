import type { Job } from "bullmq";
import { QuestionPaperSchema } from "@veda/shared";
import { AssignmentModel } from "../models/assignment.js";
import { renderPaperPdf } from "../pdf/render.js";

export interface PdfJobData {
  assignmentId: string;
}

export async function processPdf(job: Job<PdfJobData>): Promise<{ path: string }> {
  const { assignmentId } = job.data;

  const doc = await AssignmentModel.findById(assignmentId);
  if (!doc) throw new Error(`Assignment ${assignmentId} not found`);

  const paper = QuestionPaperSchema.parse(doc.paper);
  const path = await renderPaperPdf(assignmentId, paper);
  return { path };
}
