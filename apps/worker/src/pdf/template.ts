import { QUESTION_TYPE_LABELS, type QuestionPaper } from "@veda/shared";

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

const DIFFICULTY_COLOR: Record<string, string> = {
  easy: "#2f7d54",
  moderate: "#b7791f",
  hard: "#b03a3a",
};

export function paperHtml(paper: QuestionPaper): string {
  const sections = paper.sections
    .map((section) => {
      const questions = section.questions
        .map((q) => {
          const options =
            q.options && q.options.length
              ? `<ol class="opts">${q.options
                  .map((o) => `<li>${esc(o)}</li>`)
                  .join("")}</ol>`
              : "";
          return `
            <li class="q">
              <div class="q-head">
                <span class="q-id">${esc(q.id)}</span>
                <span class="q-text">${esc(q.text)}</span>
                <span class="q-meta">
                  <span class="badge" style="--c:${DIFFICULTY_COLOR[q.difficulty]}">${q.difficulty}</span>
                  <span class="marks">[${q.marks}]</span>
                </span>
              </div>
              ${options}
            </li>`;
        })
        .join("");
      return `
        <section class="section">
          <header class="section-head">
            <h2>Section ${esc(section.label)} — ${esc(section.title)}</h2>
            <p class="instruction">${esc(section.instruction)}</p>
          </header>
          <ol class="q-list">${questions}</ol>
        </section>`;
    })
    .join("");

  const generalInstructions = paper.generalInstructions
    .map((i) => `<li>${esc(i)}</li>`)
    .join("");

  const answerKey = paper.sections
    .map((section) => {
      const answers = section.questions
        .map(
          (q) =>
            `<li class="ans"><span class="q-id">${esc(q.id)}</span><span>${esc(q.answer)}</span></li>`,
        )
        .join("");
      return `<div class="ans-section"><h3>Section ${esc(section.label)}</h3><ol class="ans-list">${answers}</ol></div>`;
    })
    .join("");

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<style>
  @page { size: A4; margin: 18mm 16mm; }
  * { box-sizing: border-box; }
  body {
    font-family: Georgia, "Times New Roman", serif;
    color: #1a1a1a;
    font-size: 11.5pt;
    line-height: 1.5;
    margin: 0;
  }
  .paper-head { text-align: center; border-bottom: 2px solid #1a1a1a; padding-bottom: 12px; margin-bottom: 16px; }
  .paper-head h1 { font-size: 18pt; margin: 0 0 4px; letter-spacing: 0.3px; }
  .paper-head .sub { font-size: 11pt; color: #444; }
  .meta-row { display: flex; justify-content: space-between; font-size: 10.5pt; margin-top: 8px; }
  .student { display: flex; gap: 24px; margin: 14px 0 18px; font-size: 10.5pt; }
  .student .line { flex: 1; }
  .student .underline { border-bottom: 1px solid #999; min-height: 18px; margin-top: 2px; }
  .general { background: #faf7f0; border: 1px solid #e7dfcf; padding: 10px 14px 10px 28px; margin-bottom: 20px; }
  .general h3 { margin: 0 0 6px; font-size: 11pt; }
  .section { margin-bottom: 22px; page-break-inside: avoid; }
  .section-head h2 { font-size: 13pt; margin: 0 0 2px; border-bottom: 1px solid #ccc; padding-bottom: 4px; }
  .section-head .instruction { font-style: italic; color: #555; font-size: 10pt; margin: 4px 0 10px; }
  .q-list { list-style: none; padding: 0; margin: 0; }
  .q { margin-bottom: 12px; page-break-inside: avoid; }
  .q-head { display: flex; gap: 8px; align-items: baseline; }
  .q-id { font-weight: bold; min-width: 26px; }
  .q-text { flex: 1; }
  .q-meta { white-space: nowrap; }
  .marks { font-weight: bold; margin-left: 6px; }
  .badge {
    font-family: Arial, sans-serif; font-size: 8pt; text-transform: uppercase;
    letter-spacing: 0.4px; color: var(--c); border: 1px solid var(--c);
    border-radius: 999px; padding: 1px 7px;
  }
  .opts { margin: 6px 0 0 34px; padding: 0; }
  .opts li { margin: 2px 0; }
  ol.opts { list-style: upper-alpha; }
  .answer-key { margin-top: 28px; border-top: 2px solid #1a1a1a; padding-top: 14px; page-break-before: auto; }
  .answer-key h2 { font-size: 13pt; margin: 0 0 10px; }
  .ans-section { margin-bottom: 12px; page-break-inside: avoid; }
  .ans-section h3 { font-size: 10.5pt; color: #555; margin: 0 0 4px; }
  .ans-list { list-style: none; padding: 0; margin: 0; }
  .ans { display: flex; gap: 8px; margin-bottom: 4px; font-size: 10pt; }
</style>
</head>
<body>
  <div class="paper-head">
    <h1>${esc(paper.schoolName)}</h1>
    <div class="sub">Subject: ${esc(paper.subject)}</div>
    <div class="sub">Class: ${esc(paper.gradeLevel)}</div>
    <div class="meta-row">
      <span>Time Allowed: ${paper.durationMinutes} minutes</span>
      <span>Maximum Marks: ${paper.totalMarks}</span>
    </div>
  </div>

  <div class="student">
    <div class="line">Name<div class="underline"></div></div>
    <div class="line">Roll No.<div class="underline"></div></div>
    <div class="line">Section<div class="underline"></div></div>
  </div>

  <div class="general">
    <h3>General Instructions</h3>
    <ul>${generalInstructions}</ul>
  </div>

  ${sections}

  <section class="answer-key">
    <h2>Answer Key</h2>
    ${answerKey}
  </section>
</body>
</html>`;
}

// Re-exported so the template stays the single source for type labels if extended.
export { QUESTION_TYPE_LABELS };
