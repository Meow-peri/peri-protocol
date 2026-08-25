"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { SYMPTOM_CHAPTERS, type Chapter } from "@/data/chapters";
import { cn } from "@/lib/utils";
import { chapterStyle } from "./chapterMeta";
import { Search, ShieldAlert } from "lucide-react";

export function ChaptersView({ onOpen }: { onOpen: (chapter: Chapter) => void }) {
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return SYMPTOM_CHAPTERS;
    return SYMPTOM_CHAPTERS.filter(
      (c) =>
        c.title.toLowerCase().includes(t) ||
        c.tagline.toLowerCase().includes(t) ||
        c.slug.includes(t)
    );
  }, [q]);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 pb-24 pt-6 md:pb-10">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
          Pick your pattern
        </p>
        <h1 className="mt-1 font-playfair text-3xl font-bold text-foreground">
          What&apos;s hardest today?
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Open the chapter for the symptom making today hardest. Read its{" "}
          <span className="font-semibold text-destructive">Safety Gate</span> first, then use Do This
          Now, the 48-Hour Fix, or the longer plans. You never have to read this book cover to cover.
        </p>
      </header>

      <div className="relative mt-5 max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search symptoms — sleep, rage, fog, hair…"
          className="pl-9"
          aria-label="Search chapters"
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((c) => {
          const style = chapterStyle(c.slug);
          return (
            <button
              key={c.slug}
              type="button"
              onClick={() => onOpen(c)}
              className="group relative overflow-hidden rounded-2xl border border-border bg-card p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring"
            >
              <div className={cn("absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r opacity-70", style.bar)} />
              <div className="flex items-start justify-between gap-3">
                <div className={cn("flex h-11 w-11 items-center justify-center rounded-xl", style.tile)}>
                  <style.icon className="h-5.5 w-5.5 h-6 w-6" aria-hidden />
                </div>
                <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                  {c.number <= 12 ? `Ch. ${c.number}` : "HRT"}
                </span>
              </div>
              <h2 className="mt-3 font-playfair text-lg font-semibold leading-snug text-foreground">
                {c.title}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">{c.tagline}</p>
              <span className={cn("mt-3 inline-flex items-center gap-1 text-xs font-medium", style.text)}>
                Safety Gate first
                <ShieldAlert className="h-3.5 w-3.5" aria-hidden />
              </span>
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <p className="mt-10 text-center text-sm text-muted-foreground">
          No chapter matches “{q}”. Try “sleep”, “mood”, “hair”, or “periods”.
        </p>
      ) : null}
    </div>
  );
}
