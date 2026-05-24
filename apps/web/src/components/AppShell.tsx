"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutGrid,
  Users,
  FileText,
  Sparkles,
  Library,
  Settings,
  Plus,
} from "lucide-react";
import { TopNav } from "./TopNav";
import { useAssignmentsListStore } from "@/store/list";

const NAV = [
  { href: "/", label: "Home", icon: LayoutGrid, match: (p: string) => p === "/" },
  { href: "/assignments", label: "My Groups", icon: Users, match: () => false },
  {
    href: "/assignments",
    label: "Assignments",
    icon: FileText,
    match: (p: string) => p.startsWith("/assignments") || p.startsWith("/papers"),
    badge: true,
  },
  { href: "/assignments", label: "AI Teacher's Toolkit", icon: Sparkles, match: () => false },
  { href: "/assignments", label: "My Library", icon: Library, match: () => false },
];

const MOBILE_NAV = [
  { href: "/", label: "Home", icon: LayoutGrid, match: (p: string) => p === "/" },
  {
    href: "/assignments",
    label: "Assignments",
    icon: FileText,
    match: (p: string) => p.startsWith("/assignments") || p.startsWith("/papers"),
  },
  { href: "/assignments", label: "Library", icon: Library, match: () => false },
  { href: "/create", label: "AI Toolkit", icon: Sparkles, match: () => false },
];

function Logo() {
  return (
    <div className="flex items-center gap-2">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-white">
        <span className="font-extrabold">V</span>
      </div>
      <span className="text-xl font-extrabold tracking-tight">VedaAI</span>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "/";
  const router = useRouter();
  const count = useAssignmentsListStore((s) => s.items.length);

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <aside className="no-print sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-line bg-card p-4 lg:flex">
        <div className="px-2 py-3">
          <Logo />
        </div>

        <button
          onClick={() => router.push("/create")}
          className="mt-4 flex items-center justify-center gap-2 rounded-xl border-2 border-accent bg-accent-dark py-3 font-semibold text-white transition hover:opacity-90"
        >
          <Sparkles size={16} className="text-accent" />
          Create Assignment
        </button>

        <nav className="mt-6 flex flex-1 flex-col gap-1">
          {NAV.map((item, i) => {
            const active = item.match(pathname);
            const Icon = item.icon;
            return (
              <Link
                key={`${item.label}-${i}`}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  active
                    ? "bg-bg text-ink"
                    : "text-muted hover:bg-bg hover:text-ink"
                }`}
              >
                <Icon size={18} />
                <span className="flex-1">{item.label}</span>
                {item.badge && count > 0 && (
                  <span className="rounded-full bg-accent px-2 py-0.5 text-[11px] font-bold text-white">
                    {count}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto flex flex-col gap-2">
          <Link
            href="/assignments"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted transition hover:bg-bg hover:text-ink"
          >
            <Settings size={18} />
            Settings
          </Link>
          <div className="flex items-center gap-3 rounded-xl border border-line p-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/15 text-sm font-bold text-accent">
              D
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold">Delhi Public School</div>
              <div className="text-xs text-faint">Bokaro Steel City</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex min-w-0 flex-1 flex-col pb-20 lg:pb-0">
        {/* Mobile top bar */}
        <header className="no-print sticky top-0 z-10 flex items-center justify-between border-b border-line bg-card px-4 py-3 lg:hidden">
          <Logo />
        </header>

        {/* Desktop top bar */}
        <TopNav />

        <main className="min-w-0 flex-1">{children}</main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="no-print fixed bottom-0 left-0 right-0 z-20 flex items-center justify-around border-t border-line bg-card px-2 py-2 shadow-nav lg:hidden">
        {MOBILE_NAV.map((item, i) => {
          const active = item.match(pathname);
          const Icon = item.icon;
          return (
            <Link
              key={`${item.label}-${i}`}
              href={item.href}
              className={`flex flex-col items-center gap-1 rounded-lg px-3 py-1.5 text-[11px] font-medium ${
                active ? "text-accent" : "text-faint"
              }`}
            >
              <Icon size={20} />
              {item.label}
            </Link>
          );
        })}
        <button
          onClick={() => router.push("/create")}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-accent text-white shadow-card"
          aria-label="Create assignment"
        >
          <Plus size={22} />
        </button>
      </nav>
    </div>
  );
}
