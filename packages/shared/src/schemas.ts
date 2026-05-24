import { z } from "zod";

/**
 * The contract between every part of the system.
 *
 * - The form validates the user's request against `AssignmentInputSchema`.
 * - The worker forces Claude to emit JSON matching `QuestionPaperSchema`
 *   (via tool-use) and then re-validates it here before persisting.
 * - The web app renders strictly from `QuestionPaper`, never from raw model text.
 */

/* ------------------------------------------------------------------ */
/* Enums                                                              */
/* ------------------------------------------------------------------ */

export const QUESTION_TYPES = [
  "mcq",
  "short_answer",
  "long_answer",
  "true_false",
  "fill_in_the_blank",
] as const;
export const QuestionTypeSchema = z.enum(QUESTION_TYPES);
export type QuestionType = z.infer<typeof QuestionTypeSchema>;

export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  mcq: "Multiple Choice",
  short_answer: "Short Answer",
  long_answer: "Long Answer",
  true_false: "True / False",
  fill_in_the_blank: "Fill in the Blank",
};

export const DIFFICULTIES = ["easy", "moderate", "hard"] as const;
export const DifficultySchema = z.enum(DIFFICULTIES);
export type Difficulty = z.infer<typeof DifficultySchema>;

export const JOB_STATUSES = [
  "queued",
  "processing",
  "completed",
  "failed",
] as const;
export const JobStatusSchema = z.enum(JOB_STATUSES);
export type JobStatus = z.infer<typeof JobStatusSchema>;

/* ------------------------------------------------------------------ */
/* Input: what the teacher submits                                    */
/* ------------------------------------------------------------------ */

export const QuestionSpecSchema = z.object({
  type: QuestionTypeSchema,
  /** How many questions of this type to generate. */
  count: z.number().int().positive().max(50),
  /** Marks per question of this type. */
  marksPerQuestion: z.number().int().positive().max(100),
});
export type QuestionSpec = z.infer<typeof QuestionSpecSchema>;

export const AssignmentInputSchema = z.object({
  title: z.string().trim().min(3, "Title must be at least 3 characters").max(200),
  subject: z.string().trim().min(2, "Subject is required").max(120),
  gradeLevel: z.string().trim().min(1, "Grade / class is required").max(60),
  /** ISO date string; must be in the future. */
  dueDate: z
    .string()
    .datetime({ offset: true })
    .refine((d) => new Date(d).getTime() > Date.now(), {
      message: "Due date must be in the future",
    }),
  /** At least one question type must be requested. */
  questionSpecs: z
    .array(QuestionSpecSchema)
    .min(1, "Add at least one question type"),
  additionalInstructions: z.string().trim().max(2000).optional().default(""),
  /**
   * Text extracted from an optional uploaded PDF / text file, used as
   * source material. The file itself is parsed server-side; only the text
   * travels through the pipeline.
   */
  sourceText: z.string().max(50_000).optional().default(""),
});
export type AssignmentInput = z.infer<typeof AssignmentInputSchema>;

/** Convenience: total marks across all requested specs. */
export function totalRequestedMarks(input: Pick<AssignmentInput, "questionSpecs">): number {
  return input.questionSpecs.reduce(
    (sum, s) => sum + s.count * s.marksPerQuestion,
    0,
  );
}

/* ------------------------------------------------------------------ */
/* Output: the structured question paper Claude must produce          */
/* ------------------------------------------------------------------ */

export const GeneratedQuestionSchema = z.object({
  /** Stable id within the paper, e.g. "A1". */
  id: z.string().min(1),
  type: QuestionTypeSchema,
  text: z.string().min(1),
  difficulty: DifficultySchema,
  marks: z.number().int().positive(),
  /** Present for MCQs; 2–6 options. */
  options: z.array(z.string().min(1)).min(2).max(6).optional(),
  /** Model answer / marking guidance, shown in the Answer Key section. */
  answer: z.string().min(1),
});
export type GeneratedQuestion = z.infer<typeof GeneratedQuestionSchema>;

export const PaperSectionSchema = z.object({
  /** Section label, e.g. "A", "B". */
  label: z.string().min(1).max(4),
  title: z.string().min(1),
  instruction: z.string().min(1),
  questions: z.array(GeneratedQuestionSchema).min(1),
});
export type PaperSection = z.infer<typeof PaperSectionSchema>;

export const QuestionPaperSchema = z.object({
  title: z.string().min(1),
  /** School/institution name shown as the paper's main heading. */
  schoolName: z.string().min(1).default("Delhi Public School, Sector-4, Bokaro"),
  subject: z.string().min(1),
  gradeLevel: z.string().min(1),
  durationMinutes: z.number().int().positive(),
  totalMarks: z.number().int().positive(),
  generalInstructions: z.array(z.string().min(1)).min(1),
  sections: z.array(PaperSectionSchema).min(1),
});
export type QuestionPaper = z.infer<typeof QuestionPaperSchema>;

/* ------------------------------------------------------------------ */
/* Persisted assignment (what the API returns)                        */
/* ------------------------------------------------------------------ */

export const AssignmentSchema = z.object({
  id: z.string(),
  status: JobStatusSchema,
  input: AssignmentInputSchema,
  paper: QuestionPaperSchema.nullable(),
  error: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Assignment = z.infer<typeof AssignmentSchema>;
