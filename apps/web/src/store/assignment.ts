"use client";

import { create } from "zustand";
import type { Assignment, ProgressEvent } from "@veda/shared";
import { getAssignment, regenerateAssignment } from "@/lib/api";

interface AssignmentState {
  assignment: Assignment | null;
  progress: ProgressEvent | null;
  loading: boolean;
  error: string | null;

  load: (id: string) => Promise<void>;
  applyProgress: (event: ProgressEvent) => Promise<void>;
  regenerate: (id: string) => Promise<void>;
  reset: () => void;
}

export const useAssignmentStore = create<AssignmentState>((set, get) => ({
  assignment: null,
  progress: null,
  loading: false,
  error: null,

  async load(id) {
    set({ loading: true, error: null });
    try {
      const assignment = await getAssignment(id);
      set({ assignment, loading: false });
    } catch (err) {
      set({
        loading: false,
        error: err instanceof Error ? err.message : "Failed to load",
      });
    }
  },

  async applyProgress(event) {
    set({ progress: event });
    if (event.status === "completed") {
      // The paper now exists in Mongo — refetch to render it.
      await get().load(event.assignmentId);
    } else if (event.status === "failed") {
      set({ error: event.error ?? "Generation failed" });
    }
  },

  async regenerate(id) {
    set({
      error: null,
      progress: { assignmentId: id, status: "queued", progress: 0, message: "Re-queuing" },
    });
    await regenerateAssignment(id);
    // Optimistically reflect the queued state until the worker reports back.
    set((s) => ({
      assignment: s.assignment
        ? { ...s.assignment, status: "queued", paper: null }
        : s.assignment,
    }));
  },

  reset() {
    set({ assignment: null, progress: null, loading: false, error: null });
  },
}));
