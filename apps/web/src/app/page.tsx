"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Plus, FileX2, Filter } from "lucide-react";
import { useAssignmentsListStore } from "@/store/list";
import { AssignmentCard } from "@/components/AssignmentCard";

export default function DashboardPage() {
  const router = useRouter();
  const { items, loading, load, remove } = useAssignmentsListStore();
  const [query, setQuery] = useState("");

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((a) => a.input.title.toLowerCase().includes(q));
  }, [items, query]);

  const isEmpty = !loading && items.length === 0;

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-8 sm:py-8">
      <div className="mb-6 flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full bg-easy" />
        <div>
          <h1 className="text-2xl font-bold">Assignments</h1>
          <p className="text-sm text-muted">Manage and create assignments for your classes.</p>
        </div>
      </div>

      {isEmpty ? (
        <EmptyState onCreate={() => router.push("/create")} />
      ) : (
        <>
          {/* Filter + Search row */}
          <div className="mb-5 flex items-center justify-between gap-3">
            <button className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium text-muted hover:text-ink">
              <Filter size={16} /> Filter By
            </button>
            <div className="relative w-full sm:w-80">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search Assignment"
                className="w-full rounded-full border border-line bg-card py-2.5 pl-9 pr-4 text-sm outline-none focus:border-accent"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {filtered.map((a) => (
              <AssignmentCard key={a.id} assignment={a} onDelete={remove} />
            ))}
          </div>

          {filtered.length === 0 && (
            <p className="py-12 text-center text-muted">No assignments match that search.</p>
          )}

          <button
            onClick={() => router.push("/create")}
            className="no-print fixed bottom-8 left-1/2 hidden -translate-x-1/2 items-center gap-2 rounded-full bg-accent-dark px-6 py-3 font-semibold text-white shadow-card transition hover:opacity-90 lg:flex"
          >
            <Plus size={18} /> Create Assignment
          </button>
        </>
      )}
    </div>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-line bg-card/60 px-6 py-20 text-center">
      <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-bg">
        <FileX2 size={40} className="text-faint" />
      </div>
      <h2 className="text-xl font-bold">No assignments yet</h2>
      <p className="mt-2 max-w-md text-sm text-muted">
        Create your first assignment to start collecting and grading student submissions.
        You can set up rubrics, define marking criteria, and let AI assist with grading.
      </p>
      <button
        onClick={onCreate}
        className="mt-6 flex items-center gap-2 rounded-full bg-accent-dark px-6 py-3 font-semibold text-white transition hover:opacity-90"
      >
        <Plus size={18} /> Create Your First Assignment
      </button>
    </div>
  );
}
