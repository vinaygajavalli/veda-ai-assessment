import { GoogleGenAI } from "@google/genai";
import { zodToJsonSchema } from "zod-to-json-schema";
import {
  QuestionPaperSchema,
  type AssignmentInput,
  type QuestionPaper,
} from "@veda/shared";
import { env } from "../env.js";
import { SYSTEM_PROMPT, buildUserPrompt } from "./prompt.js";

const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });

/**
 * Gemini's structured-output mode accepts a JSON Schema directly. We derive it
 * from the SAME Zod schema we validate against, so the model's output contract
 * and the runtime contract cannot drift apart. `$refStrategy: "none"` inlines
 * definitions so the schema is self-contained.
 */
const RESPONSE_SCHEMA = zodToJsonSchema(QuestionPaperSchema, {
  $refStrategy: "none",
  target: "jsonSchema7",
});

/** The institution shown on the paper header (matches the product's school context). */
const SCHOOL_NAME = "Delhi Public School, Sector-4, Bokaro";

/**
 * Recompute totalMarks from the actual questions so the paper is internally
 * consistent regardless of any arithmetic slip in the model output, and stamp
 * the school name (not model-generated).
 */
function reconcile(paper: QuestionPaper): QuestionPaper {
  const totalMarks = paper.sections.reduce(
    (sum, section) => sum + section.questions.reduce((s, q) => s + q.marks, 0),
    0,
  );
  return { ...paper, totalMarks, schoolName: SCHOOL_NAME };
}

/** Parse Gemini's JSON text response, tolerating stray code fences. */
function parseJsonText(text: string): unknown {
  const cleaned = text.replace(/```json/gi, "").replace(/```/g, "").trim();
  return JSON.parse(cleaned);
}

async function callGemini(prompt: string): Promise<string> {
  const result = await ai.models.generateContent({
    model: env.GEMINI_MODEL,
    contents: prompt,
    config: {
      systemInstruction: SYSTEM_PROMPT,
      responseMimeType: "application/json",
      responseSchema: RESPONSE_SCHEMA as Record<string, unknown>,
      maxOutputTokens: 8000,
    },
  });
  const text = result.text;
  if (!text) throw new Error("Gemini returned an empty response");
  return text;
}

export interface GenerateOptions {
  onProgress?: (progress: number, message: string) => Promise<void> | void;
}

export async function generatePaper(
  input: AssignmentInput,
  opts: GenerateOptions = {},
): Promise<QuestionPaper> {
  const { onProgress } = opts;
  await onProgress?.(15, "Building structured prompt");

  const userPrompt = buildUserPrompt(input);

  await onProgress?.(35, "Asking the model to draft the paper");
  const firstText = await callGemini(userPrompt);

  await onProgress?.(70, "Validating generated structure");
  const firstParse = QuestionPaperSchema.safeParse(parseJsonText(firstText));
  if (firstParse.success) {
    return reconcile(firstParse.data);
  }

  // One repair attempt: feed the validation errors back and ask again.
  await onProgress?.(80, "Refining the paper");
  const repairPrompt = [
    userPrompt,
    "",
    "Your previous response failed validation with these issues:",
    JSON.stringify(firstParse.error.issues, null, 2),
    "",
    "Return a corrected question paper that fixes every issue. JSON only.",
  ].join("\n");

  const repairText = await callGemini(repairPrompt);

  await onProgress?.(92, "Validating refined structure");
  // Throws (and the job retries) if the model still can't produce valid output.
  const paper = QuestionPaperSchema.parse(parseJsonText(repairText));
  return reconcile(paper);
}
