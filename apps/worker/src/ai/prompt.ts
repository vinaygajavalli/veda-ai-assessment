import {
  QUESTION_TYPE_LABELS,
  totalRequestedMarks,
  type AssignmentInput,
} from "@veda/shared";

export const SYSTEM_PROMPT = [
  "You are an experienced exam-setter who writes clear, fair, curriculum-aligned question papers.",
  "Rules you must follow:",
  "- Group questions into labelled sections (A, B, C, ...). Group by question type where it makes sense.",
  "- Every question needs: a difficulty (easy | moderate | hard), marks, a stable id like 'A1', 'A2', 'B1', and a concise model answer (the 'answer' field) suitable for an answer key.",
  "- For multiple-choice questions, provide 4 plausible options, make exactly one correct, and set the answer to the correct option text.",
  "- Distribute difficulty sensibly across each section; do not make everything one difficulty.",
  "- The sum of all question marks MUST equal the requested total marks exactly.",
  "- Choose a sensible exam duration in minutes for the workload.",
  "- Return the result ONLY as a JSON object matching the required schema. No prose, no markdown, no code fences.",
].join("\n");

export function buildUserPrompt(input: AssignmentInput): string {
  const total = totalRequestedMarks(input);

  const specLines = input.questionSpecs
    .map(
      (s) =>
        `- ${s.count} × ${QUESTION_TYPE_LABELS[s.type]} (type code: "${s.type}"), ${s.marksPerQuestion} marks each = ${s.count * s.marksPerQuestion} marks`,
    )
    .join("\n");

  const parts: string[] = [
    `Create a question paper with these exact specifications.`,
    ``,
    `Title: ${input.title}`,
    `Subject: ${input.subject}`,
    `Grade / class level: ${input.gradeLevel}`,
    `Total marks (must match exactly): ${total}`,
    ``,
    `Question requirements:`,
    specLines,
  ];

  if (input.additionalInstructions) {
    parts.push("", `Additional instructions from the teacher:`, input.additionalInstructions);
  }

  if (input.sourceText) {
    parts.push(
      "",
      `Base the questions on the following source material. Do not ask anything that cannot be answered from general knowledge of the subject plus this material:`,
      "<source_material>",
      input.sourceText.slice(0, 20_000),
      "</source_material>",
    );
  }

  return parts.join("\n");
}
