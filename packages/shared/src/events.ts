import { z } from "zod";
import { JobStatusSchema } from "./schemas";
/**
 * Real-time channel contract. The API runs the socket server; clients join a
 * room named `assignment:<id>` and receive progress as the worker advances.
 */

export const SOCKET_EVENTS = {
  /** Client -> server: start listening for a given assignment's updates. */
  SUBSCRIBE: "assignment:subscribe",
  /** Server -> client: status / progress changed. */
  PROGRESS: "assignment:progress",
} as const;

export function assignmentRoom(assignmentId: string): string {
  return `assignment:${assignmentId}`;
}

export const ProgressEventSchema = z.object({
  assignmentId: z.string(),
  status: JobStatusSchema,
  /** 0–100, best-effort. */
  progress: z.number().min(0).max(100),
  /** Human-readable step, e.g. "Drafting Section A". */
  message: z.string(),
  error: z.string().nullable().optional(),
});
export type ProgressEvent = z.infer<typeof ProgressEventSchema>;
