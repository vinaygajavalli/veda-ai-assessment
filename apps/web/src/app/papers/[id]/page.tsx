"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { RefreshCw, Printer, ArrowLeft } from "lucide-react";
import { useAssignmentStore } from "@/store/assignment";
import { subscribeToAssignment } from "@/lib/socket";
import { pdfUrl } from "@/lib/api";
import { QuestionPaper } from "@/components/QuestionPaper";
import { GenerationStatus } from "@/components/GenerationStatus";

export default function PaperPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const { assignment, progress, error, load, applyProgress, regenerate, reset } =
    useAssignmentStore();

  useEffect(() => {
    if (!id) return;
    void load(id);

    const unsubscribe = subscribeToAssignment(id, (event) => {
      void applyProgress(event);
    });

    const interval = setInterval(() => {
      const status = useAssignmentStore.getState().assignment?.status;
      if (status === "completed" || status === "failed") {
        clearInterval(interval);
        return;
      }
      void load(id);
    }, 3500);

    return () => {
      unsubscribe();
      clearInterval(interval);
      reset();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const isReady = assignment?.status === "completed" && assignment.paper;

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-8">
      <div className="no-print mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-sm font-medium text-muted hover:text-accent"
        >
          <ArrowLeft size={16} /> Back to assignments
        </Link>

        {isReady && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => regenerate(id)}
              className="flex items-center gap-1.5 rounded-full border border-line px-4 py-2 text-sm font-semibold hover:border-accent"
            >
              <RefreshCw size={15} /> Regenerate
            </button>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 rounded-full bg-accent-dark px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
            >
              <Printer size={15} /> Print
            </button>
          </div>
        )}
      </div>

      {isReady && assignment.paper ? (
        <QuestionPaper paper={assignment.paper} pdfHref={pdfUrl(id)} />
      ) : (
        <GenerationStatus progress={progress} error={error} />
      )}
    </div>
  );
}
