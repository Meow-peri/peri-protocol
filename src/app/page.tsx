"use client";

import { useEffect, useState } from "react";
import { CalendarCheck, BookOpen, LayoutGrid, Stethoscope, FlaskConical, Wrench, type LucideIcon } from "lucide-react";
import type { Chapter } from "@/data/chapters";
import { getChapter } from "@/data/chapters";
import { ChapterDetail } from "@/components/app/ChapterDetail";
import { ChaptersView } from "@/components/app/ChaptersView";
import { TodayView } from "@/components/app/TodayView";
import { TrackerView } from "@/components/app/TrackerView";
import { DoctorView } from "@/components/app/DoctorView";
import { LabsView } from "@/components/app/LabsView";
import { ToolkitView } from "@/components/app/ToolkitView";
import { ThemeToggle } from "@/components/app/ThemeToggle";
import { cn } from "@/lib/utils";

type TabId = "today" | "chapters" | "tracker" | "doctor" | "labs" | "toolkit";

const TABS: { id: TabId; label: string; icon: LucideIcon }[] = [
  { id: "today", label: "Today", icon: CalendarCheck },
  { id: "chapters", label: "Chapters", icon: LayoutGrid },
  { id: "tracker", label: "Tracker", icon: BookOpen },
  { id: "doctor", label: "Doctor", icon: Stethoscope },
  { id: "labs", label: "Labs", icon: FlaskConical },
  { id: "toolkit", label: "Toolkit", icon: Wrench },
];

export default function Home() {
  const [tab, setTab] = useState<TabId>("today");
  const [chapter, setChapter] = useState<Chapter | null>(null);

  const openChapter = (c: Chapter) => {
    setChapter(c);
    setTab("chapters");
    window.dispatchEvent(new Event("peri-chapter-opened"));
  };

  const selectTab = (t: TabId) => {
    setTab(t);
    if (t !== "chapters") setChapter(null);
  };

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [tab, chapter?.slug]);

  // Global handler for in-content book links ([[text|target]] markers):
  // '@anchor' → smooth-scroll to that section within the chapter
  // 'slug'    → open that chapter / appendix
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const el = (e.target as HTMLElement).closest("[data-nav]");
      if (!el) return;
      e.preventDefault();
      const target = el.getAttribute("data-nav") || "";
      if (target.startsWith("@")) {
        const doScroll = () => {
          const dest = document.getElementById(`a-${target.slice(1)}`);
          if (!dest) return;
          dest.scrollIntoView({ behavior: "smooth", block: "start" });
          dest.classList.add("nav-flash");
          setTimeout(() => dest.classList.remove("nav-flash"), 1800);
        };
        const dest = document.getElementById(`a-${target.slice(1)}`);
        if (!dest || dest.querySelector("[data-science='true']") || dest.hasAttribute("data-science")) {
          // target sits in a collapsed Science section — open it, then scroll
          window.dispatchEvent(new Event("peri-open-science"));
          setTimeout(doScroll, dest ? 350 : 600);
        } else {
          doScroll();
        }
      } else {
        const ch = getChapter(target);
        if (ch) {
          openChapter(ch);
        }
      }
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="flex flex-1">
        {/* Desktop sidebar */}
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-border bg-sidebar px-4 py-6 lg:flex">
          <div className="mb-8 flex items-center gap-3 px-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-purple-700 font-playfair text-lg font-bold text-white shadow-sm">
              P
            </span>
            <div>
              <p className="font-playfair text-lg font-bold leading-none text-foreground">Peri Protocol</p>
              <p className="mt-1 text-[11px] uppercase tracking-wider text-muted-foreground">
                Companion &amp; tracker
              </p>
            </div>
          </div>
          <nav aria-label="Main" className="flex-1 space-y-1">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => selectTab(t.id)}
                aria-current={tab === t.id ? "page" : undefined}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  tab === t.id
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <t.icon className="h-4.5 w-4.5 h-5 w-5" aria-hidden />
                {t.label}
              </button>
            ))}
          </nav>
          <div className="mb-3 flex justify-end">
            <ThemeToggle />
          </div>
          <p className="rounded-xl bg-muted/60 p-3 text-[11px] leading-relaxed text-muted-foreground">
            Support tool only — not medical advice. Check symptoms, tests, supplements, and treatment
            decisions with a qualified clinician. In an emergency, call local services.
          </p>
        </aside>

        {/* Main column */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Mobile top bar */}
          <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-background/90 px-4 py-3 backdrop-blur lg:hidden">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-purple-700 font-playfair text-base font-bold text-white">
              P
            </span>
            <div>
              <p className="font-playfair text-base font-bold leading-none text-foreground">Peri Protocol</p>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Perimenopause companion
              </p>
            </div>
            <div className="ml-auto">
              <ThemeToggle />
            </div>
          </header>

          <main className="min-w-0 flex-1">
            {tab === "today" ? <TodayView onOpenChapter={openChapter} /> : null}
            {tab === "chapters" ? (
              chapter ? (
                <ChapterDetail chapter={chapter} onBack={() => setChapter(null)} />
              ) : (
                <ChaptersView onOpen={openChapter} />
              )
            ) : null}
            {tab === "tracker" ? <TrackerView /> : null}
            {tab === "doctor" ? <DoctorView /> : null}
            {tab === "labs" ? <LabsView /> : null}
            {tab === "toolkit" ? <ToolkitView /> : null}
          </main>

          {/* Footer */}
          <footer className="mt-auto border-t border-border bg-card px-4 py-3">
            <p className="mx-auto max-w-3xl text-center text-[11px] leading-relaxed text-muted-foreground">
              Based on <em>Perimenopause Protocol Deluxe</em> by Knox Ray. Support material only —
              always check symptoms, tests, medicines, supplements, and treatment decisions with a
              qualified clinician. Call local emergency services when a Safety Gate applies.
            </p>
          </footer>
        </div>
      </div>

      {/* Mobile bottom tabs */}
      <nav
        aria-label="Main navigation"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
      >
        <div className="grid grid-cols-6">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => selectTab(t.id)}
              aria-current={tab === t.id ? "page" : undefined}
              className={cn(
                "flex min-h-[3.25rem] flex-col items-center justify-center gap-0.5 px-1 py-1.5 text-[10px] font-medium transition-colors",
                tab === t.id ? "text-primary" : "text-muted-foreground"
              )}
            >
              <t.icon className="h-5 w-5" aria-hidden />
              {t.label}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
