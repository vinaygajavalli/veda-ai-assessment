import type { Difficulty } from "@veda/shared";

const STYLES: Record<Difficulty, string> = {
  easy: "text-easy bg-easy-bg",
  moderate: "text-moderate bg-moderate-bg",
  hard: "text-hard bg-hard-bg",
};

export function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${STYLES[difficulty]}`}
    >
      {difficulty}
    </span>
  );
}
