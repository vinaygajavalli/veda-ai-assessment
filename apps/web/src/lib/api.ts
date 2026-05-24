import type { Assignment } from "@veda/shared";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

/** Payload mirrors AssignmentInput minus the file (sent separately) and sourceText. */
export interface CreateAssignmentPayload {
  title: string;
  subject: string;
  gradeLevel: string;
  dueDate: string; // ISO with offset
  questionSpecs: { type: string; count: number; marksPerQuestion: number }[];
  additionalInstructions: string;
}

export async function createAssignment(
  payload: CreateAssignmentPayload,
  file?: File | null,
): Promise<{ assignmentId: string }> {
  const form = new FormData();
  form.append("payload", JSON.stringify(payload));
  if (file) form.append("file", file);

  const res = await fetch(`${API_BASE}/api/assignments`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) {
    const detail = await res.json().catch(() => ({}));
    throw new Error(detail?.issues?.[0]?.message ?? "Failed to create assignment");
  }
  return res.json();
}

export async function listAssignments(): Promise<Assignment[]> {
  const res = await fetch(`${API_BASE}/api/assignments`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load assignments");
  return res.json();
}

export async function getAssignment(id: string): Promise<Assignment> {
  const res = await fetch(`${API_BASE}/api/assignments/${id}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Assignment not found");
  return res.json();
}

export async function regenerateAssignment(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/assignments/${id}/regenerate`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Failed to regenerate");
}

export async function deleteAssignment(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/assignments/${id}`, {
    method: "DELETE",
  });
  if (!res.ok && res.status !== 204) throw new Error("Failed to delete");
}

export function pdfUrl(id: string): string {
  return `${API_BASE}/api/assignments/${id}/pdf`;
}
