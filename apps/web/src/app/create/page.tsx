"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { UploadCloud, Plus, X, Minus, ArrowLeft, ArrowRight } from "lucide-react";
import {
  QUESTION_TYPES,
  QUESTION_TYPE_LABELS,
  type QuestionType,
} from "@veda/shared";
import { createAssignment } from "@/lib/api";

const QuestionSpecForm = z.object({
  type: z.enum(QUESTION_TYPES),
  count: z.coerce.number().int().positive().max(50),
  marksPerQuestion: z.coerce.number().int().positive().max(100),
});

const FormSchema = z.object({
  title: z.string().trim().min(3, "At least 3 characters"),
  subject: z.string().trim().min(2, "Subject is required"),
  gradeLevel: z.string().trim().min(1, "Grade / class is required"),
  dueDate: z
    .string()
    .min(1, "Pick a due date")
    .refine((v) => new Date(v).getTime() > Date.now(), "Must be in the future"),
  questionSpecs: z.array(QuestionSpecForm).min(1, "Add at least one question type"),
  additionalInstructions: z.string().max(2000).optional(),
});

type FormValues = z.input<typeof FormSchema>;

const field =
  "w-full rounded-xl border border-line bg-card px-3.5 py-2.5 text-ink outline-none transition focus:border-accent";

export default function CreatePage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      title: "",
      subject: "",
      gradeLevel: "",
      dueDate: "",
      additionalInstructions: "",
      questionSpecs: [{ type: "mcq", count: 4, marksPerQuestion: 1 }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "questionSpecs" });
  const specs = watch("questionSpecs") ?? [];
  const totalQuestions = specs.reduce((s, x) => s + (Number(x.count) || 0), 0);
  const totalMarks = specs.reduce(
    (s, x) => s + (Number(x.count) || 0) * (Number(x.marksPerQuestion) || 0),
    0,
  );

  function pickFile(f: File | null) {
    setFile(f);
  }

  async function onSubmit(values: FormValues) {
    setSubmitError(null);
    try {
      const parsed = FormSchema.parse(values);
      const { assignmentId } = await createAssignment(
        {
          title: parsed.title,
          subject: parsed.subject,
          gradeLevel: parsed.gradeLevel,
          dueDate: new Date(parsed.dueDate).toISOString(),
          questionSpecs: parsed.questionSpecs,
          additionalInstructions: parsed.additionalInstructions ?? "",
        },
        file,
      );
      router.push(`/papers/${assignmentId}`);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-8 sm:py-8">
      <div className="mb-6 flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full bg-easy" />
        <div>
          <h1 className="text-2xl font-bold">Create Assignment</h1>
          <p className="text-sm text-muted">Set up a new assignment for your students.</p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-7 rounded-2xl border border-line bg-card p-5 shadow-card sm:p-7"
      >
        <div>
          <h2 className="font-bold">Assignment Details</h2>
          <p className="text-sm text-muted">Basic information about your assignment.</p>
        </div>

        {/* Drop zone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            pickFile(e.dataTransfer.files?.[0] ?? null);
          }}
          className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-10 text-center transition ${
            dragOver ? "border-accent bg-accent/5" : "border-line"
          }`}
        >
          <UploadCloud size={28} className="mb-2 text-faint" />
          <p className="text-sm font-medium">
            {file ? file.name : "Choose a file or drag & drop it here"}
          </p>
          <p className="mt-1 text-xs text-faint">JPEG, PNG, PDF, up to 10MB</p>
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.txt,text/plain,application/pdf"
            onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="mt-4 rounded-lg border border-line bg-card px-4 py-2 text-sm font-medium hover:border-accent"
          >
            Browse Files
          </button>
          {file && (
            <button
              type="button"
              onClick={() => {
                pickFile(null);
                if (fileRef.current) fileRef.current.value = "";
              }}
              className="mt-2 text-xs text-hard hover:underline"
            >
              Remove file
            </button>
          )}
        </div>
        <p className="-mt-3 text-center text-xs text-faint">
          Upload images of your preferred document/image
        </p>

        {/* Basics */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Assignment title" error={errors.title?.message}>
            <input className={field} placeholder="Quiz on Electricity" {...register("title")} />
          </Field>
          <Field label="Subject" error={errors.subject?.message}>
            <input className={field} placeholder="Science" {...register("subject")} />
          </Field>
          <Field label="Grade / class" error={errors.gradeLevel?.message}>
            <input className={field} placeholder="Class 8" {...register("gradeLevel")} />
          </Field>
          <Field label="Due Date" error={errors.dueDate?.message}>
            <input type="datetime-local" className={field} {...register("dueDate")} />
          </Field>
        </div>

        {/* Question types with steppers */}
        <div>
          <div className="mb-3 grid grid-cols-[1fr_auto_auto] items-center gap-3">
            <span className="text-sm font-semibold">Question Type</span>
            <span className="w-28 text-center text-sm font-semibold">No. of Questions</span>
            <span className="w-24 text-center text-sm font-semibold">Marks</span>
          </div>

          <div className="space-y-3">
            {fields.map((f, index) => (
              <div
                key={f.id}
                className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-3"
              >
                <select className={field} {...register(`questionSpecs.${index}.type`)}>
                  {QUESTION_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {QUESTION_TYPE_LABELS[t as QuestionType]}
                    </option>
                  ))}
                </select>

                <Controller
                  control={control}
                  name={`questionSpecs.${index}.count`}
                  render={({ field: f2 }) => (
                    <Stepper
                      value={Number(f2.value) || 0}
                      onChange={(v) => f2.onChange(v)}
                    />
                  )}
                />
                <Controller
                  control={control}
                  name={`questionSpecs.${index}.marksPerQuestion`}
                  render={({ field: f2 }) => (
                    <Stepper
                      value={Number(f2.value) || 0}
                      onChange={(v) => f2.onChange(v)}
                    />
                  )}
                />

                <button
                  type="button"
                  onClick={() => remove(index)}
                  disabled={fields.length === 1}
                  className="rounded-lg p-2 text-faint hover:text-hard disabled:opacity-30"
                  aria-label="Remove question type"
                >
                  <X size={18} />
                </button>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => append({ type: "short_answer", count: 3, marksPerQuestion: 2 })}
            className="mt-3 flex items-center gap-1.5 text-sm font-semibold text-accent hover:underline"
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent text-white">
              <Plus size={13} />
            </span>
            Add Question Type
          </button>

          <div className="mt-4 text-right text-sm">
            <div>
              Total Questions: <span className="font-bold">{totalQuestions}</span>
            </div>
            <div>
              Total Marks: <span className="font-bold">{totalMarks}</span>
            </div>
          </div>
        </div>

        {/* Additional info */}
        <Field
          label="Additional Information (For better output)"
          error={errors.additionalInstructions?.message}
        >
          <textarea
            rows={3}
            className={field}
            placeholder="e.g. Generate a question paper for 3 hour exam duration…"
            {...register("additionalInstructions")}
          />
        </Field>

        {submitError && <p className="text-sm text-hard">{submitError}</p>}

        {/* Footer actions */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="flex items-center gap-1.5 rounded-full border border-line px-5 py-2.5 text-sm font-semibold hover:border-accent"
          >
            <ArrowLeft size={16} /> Previous
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-1.5 rounded-full bg-accent-dark px-6 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
          >
            {isSubmitting ? "Generating…" : "Next"} <ArrowRight size={16} />
          </button>
        </div>
      </form>
    </div>
  );
}

function Stepper({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex w-28 items-center justify-between rounded-xl border border-line px-2 py-1.5">
      <button
        type="button"
        onClick={() => onChange(Math.max(1, value - 1))}
        className="flex h-6 w-6 items-center justify-center rounded-md text-muted hover:bg-bg"
        aria-label="Decrease"
      >
        <Minus size={14} />
      </button>
      <span className="min-w-[1.5rem] text-center text-sm font-semibold">{value}</span>
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        className="flex h-6 w-6 items-center justify-center rounded-md text-muted hover:bg-bg"
        aria-label="Increase"
      >
        <Plus size={14} />
      </button>
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-ink">{label}</span>
      {children}
      {error && <span className="mt-1 block text-xs text-hard">{error}</span>}
    </label>
  );
}
