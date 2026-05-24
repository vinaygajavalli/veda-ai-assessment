"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MoreVertical } from "lucide-react";
import type { Assignment } from "@veda/shared";

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB").replace(/\//g, "-");
}

export function AssignmentCard({
  assignment,
  onDelete,
}: {
  assignment: Assignment;
  onDelete: (id: string) => void;
}) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  const open = () => router.push(`/papers/${assignment.id}`);

  return (
    <div className="group relative rounded-2xl border border-line bg-card p-5 shadow-card transition hover:border-accent/40">
      <div className="flex items-start justify-between gap-2">
        <button onClick={open} className="text-left">
          <h3 className="text-lg font-bold text-ink underline decoration-2 underline-offset-4">
            {assignment.input.title}
          </h3>
        </button>

        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="rounded-md p-1 text-faint hover:bg-bg hover:text-ink"
            aria-label="Options"
          >
            <MoreVertical size={18} />
          </button>
          {menuOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setMenuOpen(false)}
              />
              <div className="absolute right-0 z-20 mt-1 w-44 overflow-hidden rounded-2xl border border-line bg-card shadow-card">
                <button
                  onClick={open}
                  className="block w-full px-4 py-3 text-left text-sm hover:bg-bg"
                >
                  View Assignment
                </button>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onDelete(assignment.id);
                  }}
                  className="block w-full px-4 py-3 text-left text-sm font-medium text-hard hover:bg-hard-bg"
                >
                  Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="mt-10 flex items-center justify-between text-sm">
        <span className="text-muted">
          <span className="font-bold text-ink">Assigned on</span> :{" "}
          {fmtDate(assignment.createdAt)}
        </span>
        <span className="text-muted">
          <span className="font-bold text-ink">Due</span> :{" "}
          {fmtDate(assignment.input.dueDate)}
        </span>
      </div>
    </div>
  );
}
