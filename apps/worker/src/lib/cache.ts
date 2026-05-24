import { createHash } from "node:crypto";
import {
  QuestionPaperSchema,
  type AssignmentInput,
  type QuestionPaper,
} from "@veda/shared";
import { redis } from "./redis.js";
import { env } from "../env.js";

/**
 * Hash only the fields that determine the questions (not title/dueDate), so
 * re-running the same request — or a "regenerate" with identical inputs —
 * can reuse a cached paper instead of calling the model again.
 */
function cacheKey(input: AssignmentInput): string {
  const material = JSON.stringify({
    subject: input.subject,
    gradeLevel: input.gradeLevel,
    questionSpecs: input.questionSpecs,
    additionalInstructions: input.additionalInstructions,
    sourceText: input.sourceText,
    model: env.GEMINI_MODEL,
  });
  return `gen:cache:${createHash("sha256").update(material).digest("hex")}`;
}

export async function getCachedPaper(
  input: AssignmentInput,
): Promise<QuestionPaper | null> {
  const raw = await redis.get(cacheKey(input));
  if (!raw) return null;
  const parsed = QuestionPaperSchema.safeParse(JSON.parse(raw));
  return parsed.success ? parsed.data : null;
}

export async function setCachedPaper(
  input: AssignmentInput,
  paper: QuestionPaper,
): Promise<void> {
  await redis.set(cacheKey(input), JSON.stringify(paper), "EX", env.GENERATION_CACHE_TTL);
}
