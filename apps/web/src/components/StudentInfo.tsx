"use client";

function Field({ label }: { label: string }) {
  return (
    <label className="flex flex-1 items-baseline gap-2 text-sm text-ink">
      <span className="whitespace-nowrap font-medium">{label}</span>
      <input className="exam-line w-full" aria-label={label} />
    </label>
  );
}

export function StudentInfo() {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:gap-8">
      <Field label="Name" />
      <Field label="Roll No." />
      <Field label="Section" />
    </div>
  );
}
