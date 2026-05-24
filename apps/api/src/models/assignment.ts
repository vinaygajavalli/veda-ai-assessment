import { Schema, model, type InferSchemaType, type HydratedDocument } from "mongoose";
import type { Assignment, AssignmentInput, JobStatus, QuestionPaper } from "@veda/shared";

/**
 * Input and paper are validated by Zod at the boundaries, so they are stored
 * as flexible sub-documents here rather than re-declared field-by-field.
 */
const AssignmentSchema = new Schema(
  {
    status: {
      type: String,
      enum: ["queued", "processing", "completed", "failed"],
      default: "queued",
      index: true,
    },
    input: { type: Schema.Types.Mixed, required: true },
    paper: { type: Schema.Types.Mixed, default: null },
    error: { type: String, default: null },
  },
  { timestamps: true },
);

export type AssignmentDoc = HydratedDocument<
  InferSchemaType<typeof AssignmentSchema> & { createdAt: Date; updatedAt: Date }
>;

export const AssignmentModel = model("Assignment", AssignmentSchema);

/** Map a Mongoose document to the wire/shared `Assignment` shape. */
export function toAssignment(doc: AssignmentDoc): Assignment {
  return {
    id: doc.id,
    status: doc.status as JobStatus,
    input: doc.input as AssignmentInput,
    paper: (doc.paper ?? null) as QuestionPaper | null,
    error: doc.error ?? null,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}
