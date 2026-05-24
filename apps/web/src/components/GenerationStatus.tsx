"use client";

import { Sparkles, AlertTriangle } from "lucide-react";
import type { ProgressEvent } from "@veda/shared";

export function GenerationStatus({
  progress,
  error,
}: {
  progress: ProgressEvent | null;
  error: string | null;
}) {
  const pct = progress?.progress ?? 5;
  const message = error ?? progress?.message ?? "Queued for generation";
  const failed = Boolean(error) || progress?.status === "failed";

  return (
    <div className="mx-auto max-w-xl rounded-2xl border border-line bg-card p-10 text-center shadow-card">
      <div className="mb-5 flex justify-center">
        <div
          className={`flex h-14 w-14 items-center justify-center rounded-full ${
            failed ? "bg-hard-bg text-hard" : "bg-accent/10 text-accent"
          }`}
        >
          {failed ? <AlertTriangle size={26} /> : <Sparkles size={26} />}
        </div>
      </div>

      <div className="mb-5 text-xl font-bold">
        {failed ? "Generation failed" : "Crafting your question paper"}
      </div>

      <div className="h-2 w-full overflow-hidden rounded-full bg-bg">
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${
            failed ? "bg-hard" : "bg-accent"
          }`}
          style={{ width: `${failed ? 100 : pct}%` }}
        />
      </div>

      <p className={`mt-4 text-sm ${failed ? "text-hard" : "text-muted"}`}>{message}</p>

      {!failed && (
        <p className="mt-2 text-xs text-faint">
          A background worker is generating and validating each section.
        </p>
      )}
    </div>
  );
}
