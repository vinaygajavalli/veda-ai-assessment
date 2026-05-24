"use client";

import { Download } from "lucide-react";
import type { QuestionPaper as Paper } from "@veda/shared";
import { DifficultyBadge } from "./DifficultyBadge";
import { StudentInfo } from "./StudentInfo";

export function QuestionPaper({
  paper,
  pdfHref,
}: {
  paper: Paper;
  pdfHref?: string;
}) {
  return (
    <div className="mx-auto max-w-3xl overflow-hidden rounded-2xl border border-line bg-card shadow-card">
      {/* Dark AI-response banner (matches Figma) */}
      <div className="no-print bg-accent-dark px-6 py-5 text-white">
        <p className="text-sm font-medium leading-relaxed">
          Certainly! Here are a customized Question Paper for your{" "}
          <span className="font-semibold">{paper.gradeLevel}</span>{" "}
          <span className="font-semibold">{paper.subject}</span> classes:
        </p>
        {pdfHref && (
          <a
            href={pdfHref}
            className="mt-3 inline-flex items-center gap-2 rounded-lg bg-white/10 px-3.5 py-2 text-sm font-medium backdrop-blur transition hover:bg-white/20"
          >
            <Download size={15} /> Download as PDF
          </a>
        )}
      </div>

      {/* The paper itself */}
      <article className="print-sheet p-6 sm:p-10">
        {/* Header — school name, then subject/class */}
        <header className="text-center">
          <h1 className="text-2xl font-bold leading-tight sm:text-[26px]">
            {paper.schoolName}
          </h1>
          <p className="mt-2 font-medium">Subject: {paper.subject}</p>
          <p className="font-medium">Class: {paper.gradeLevel}</p>
        </header>

        <div className="mt-5 flex justify-between border-t border-line pt-4 text-sm">
          <span>Time Allowed: {paper.durationMinutes} minutes</span>
          <span>Maximum Marks: {paper.totalMarks}</span>
        </div>

        <p className="mt-3 text-sm text-muted">
          All questions are compulsory unless stated otherwise.
        </p>

        {/* Student info */}
        <div className="mt-5 border-b border-line pb-5">
          <StudentInfo />
        </div>

        {/* General instructions */}
        <section className="my-6 rounded-xl border border-line bg-bg/60 px-5 py-4">
          <h2 className="mb-2 font-bold">General Instructions</h2>
          <ul className="list-disc space-y-1 pl-5 text-sm text-muted">
            {paper.generalInstructions.map((instruction, i) => (
              <li key={i}>{instruction}</li>
            ))}
          </ul>
        </section>

        {/* Sections */}
        <div className="space-y-9">
          {paper.sections.map((section) => (
            <section key={section.label}>
              <h2 className="text-center text-lg font-bold">Section {section.label}</h2>
              <div className="mb-3 mt-2">
                <h3 className="font-semibold">{section.title}</h3>
                <p className="text-sm italic text-muted">{section.instruction}</p>
              </div>

              <ol className="space-y-4">
                {section.questions.map((q, idx) => (
                  <li key={q.id} className="flex flex-col gap-2">
                    <div className="flex items-start gap-3">
                      <span className="min-w-[1.5rem] font-medium">{idx + 1}.</span>
                      <p className="flex-1 leading-relaxed">{q.text}</p>
                      <span className="flex shrink-0 items-center gap-2 pt-0.5">
                        <DifficultyBadge difficulty={q.difficulty} />
                        <span className="whitespace-nowrap text-sm font-semibold">
                          [{q.marks}]
                        </span>
                      </span>
                    </div>
                    {q.options && q.options.length > 0 && (
                      <ol className="ml-8 list-[upper-alpha] space-y-1 pl-5 text-ink/90">
                        {q.options.map((opt, i) => (
                          <li key={i}>{opt}</li>
                        ))}
                      </ol>
                    )}
                  </li>
                ))}
              </ol>
            </section>
          ))}
        </div>

        <p className="mt-8 text-center text-sm font-semibold">End of Question Paper</p>

        {/* Answer Key */}
        <section className="mt-8 border-t border-line pt-6">
          <h2 className="mb-4 font-bold">Answer Key:</h2>
          <div className="space-y-5">
            {paper.sections.map((section) => (
              <div key={`ans-${section.label}`}>
                <h3 className="mb-2 text-sm font-semibold text-muted">
                  Section {section.label}
                </h3>
                <ol className="list-decimal space-y-2 pl-6 text-sm">
                  {section.questions.map((q) => (
                    <li key={`ans-${q.id}`} className="leading-relaxed text-ink/90">
                      {q.answer}
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        </section>
      </article>
    </div>
  );
}
