"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, Bell, ChevronDown, LayoutGrid } from "lucide-react";

export function TopNav({ label = "Assignment" }: { label?: string }) {
  const router = useRouter();
  return (
    <header className="no-print sticky top-0 z-10 hidden items-center justify-between border-b border-line bg-card px-6 py-3 lg:flex">
      <div className="flex items-center gap-3 text-muted">
        <button
          onClick={() => router.back()}
          className="rounded-md p-1 hover:bg-bg hover:text-ink"
          aria-label="Back"
        >
          <ArrowLeft size={18} />
        </button>
        <LayoutGrid size={15} />
        <span className="text-sm font-medium">{label}</span>
      </div>

      <div className="flex items-center gap-4">
        <button className="relative rounded-full p-1.5 hover:bg-bg" aria-label="Notifications">
          <Bell size={18} className="text-muted" />
          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-accent" />
        </button>
        <button className="flex items-center gap-2 rounded-full border border-line py-1 pl-1 pr-2.5 hover:border-accent/40">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent/15 text-xs font-bold text-accent">
            JD
          </span>
          <span className="text-sm font-medium">John Doe</span>
          <ChevronDown size={15} className="text-faint" />
        </button>
      </div>
    </header>
  );
}
