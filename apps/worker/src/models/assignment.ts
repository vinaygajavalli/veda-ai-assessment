import { Schema, model, type InferSchemaType, type HydratedDocument } from "mongoose";

/**
 * The worker keeps its own thin model bound to the same `assignments`
 * collection. This keeps the worker independently deployable (it never imports
 * the API package). Validation of `input`/`paper` is handled by Zod, so they
 * are stored as flexible sub-documents.
 */
const AssignmentSchema = new Schema(
  {
    status: {
      type: String,
      enum: ["queued", "processing", "completed", "failed"],
      default: "queued",
    },
    input: { type: Schema.Types.Mixed, required: true },
    paper: { type: Schema.Types.Mixed, default: null },
    error: { type: String, default: null },
  },
  { timestamps: true },
);

export type AssignmentDoc = HydratedDocument<InferSchemaType<typeof AssignmentSchema>>;

export const AssignmentModel = model("Assignment", AssignmentSchema);
