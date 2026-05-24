"use client";

import { create } from "zustand";
import type { Assignment } from "@veda/shared";
import { listAssignments, deleteAssignment } from "@/lib/api";

interface ListState {
  items: Assignment[];
  loading: boolean;
  error: string | null;
  load: () => Promise<void>;
  remove: (id: string) => Promise<void>;
}

export const useAssignmentsListStore = create<ListState>((set, get) => ({
  items: [],
  loading: false,
  error: null,

  async load() {
    set({ loading: true, error: null });
    try {
      const items = await listAssignments();
      set({ items, loading: false });
    } catch (err) {
      set({
        loading: false,
        error: err instanceof Error ? err.message : "Failed to load",
      });
    }
  },

  async remove(id) {
    // Optimistic removal.
    const prev = get().items;
    set({ items: prev.filter((a) => a.id !== id) });
    try {
      await deleteAssignment(id);
    } catch {
      set({ items: prev }); // revert on failure
    }
  },
}));
