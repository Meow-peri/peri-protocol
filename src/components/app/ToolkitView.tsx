"use client";

import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { APPENDICES, STACKING_CHAPTER, type Chapter } from "@/data/chapters";
import { Blocks } from "./Blocks";
import { chapterStyle } from "./chapterMeta";
import { cn } from "@/lib/utils";
import { ChevronRight, Layers } from "lucide-react";

export function ToolkitView() {
  const [open, setOpen] = useState<Chapter | null>(null);
  const [lightbox, setLightbox] = useState<{ src: string; alt: string } | null>(null);

  // Close this appendix dialog when a cross-chapter link inside it is used
  useEffect(() => {
    const h = (e: MouseEvent) => {
      const el = (e.target as HTMLElement).closest("[data-nav]");
      if (el && !(el.getAttribute("data-nav") || "").startsWith("@")) setOpen(null);
    };
    document.addEventListener("click", h);
    return () => document.removeEventListener("click", h);
  }, []);

  const items = useMemo(
    () => [...APPENDICES, STACKING_CHAPTER].filter(Boolean) as Chapter[],
    []
  );

  return (
    <div className="mx-auto w-full max-w-5xl px-4 pb-24 pt-6 md:pb-10">
      <header className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
          The reference shelf
        </p>
        <h1 className="mt-1 font-playfair text-3xl font-bold text-foreground">Toolkit</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          The book&apos;s appendices — lab tests decoded, supplement interactions, label reading,
          sources, and the exact words to use when a doctor dismisses you.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        {items.map((c) => {
          const style = chapterStyle(c.slug);
          return (
            <button
              key={c.slug}
              type="button"
              onClick={() => setOpen(c)}
              className="group relative overflow-hidden rounded-2xl border border-border bg-card p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring"
            >
              <div className={cn("absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r opacity-70", style.bar)} />
              <div className="flex items-start gap-3">
                <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl", style.tile)}>
                  <style.icon className="h-6 w-6" aria-hidden />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="font-playfair text-base font-semibold leading-snug text-foreground">
                    {c.title}
                  </h2>
                  <p className="mt-0.5 text-sm text-muted-foreground">{c.tagline}</p>
                </div>
                <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" aria-hidden />
              </div>
            </button>
          );
        })}
      </div>

      {/* Protocol stacking intro card */}
      <div className="mt-8 rounded-2xl border border-emerald-600/25 bg-emerald-50/50 p-5 dark:bg-emerald-950/20">
        <div className="flex items-start gap-3">
          <Layers className="mt-0.5 h-6 w-6 shrink-0 text-emerald-700 dark:text-emerald-400" aria-hidden />
          <div>
            <h2 className="font-playfair text-lg font-bold text-foreground">
              Stacking protocols safely
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              Managing three symptoms at once? The book&apos;s rule: change one thing at a time, keep
              the foundation shared (sleep rhythm, blood sugar, steady meals), and read every Safety
              Gate before stacking anything. Open “Protocol Stacking in Practice” above for the full
              guide.
            </p>
          </div>
        </div>
      </div>

      <Dialog open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent className="max-h-[88vh] max-w-2xl overflow-y-auto">
          {open ? (
            <>
              <DialogHeader>
                <DialogTitle className="font-playfair pr-6">{open.title}</DialogTitle>
                <DialogDescription>{open.tagline}</DialogDescription>
              </DialogHeader>
              <div className="space-y-2">
                {open.sections.map((s, i) => (
                  <section
                    key={i}
                    id={s.anchor ? `a-${s.anchor}` : undefined}
                    className="scroll-mt-32"
                  >
                    {s.title && s.title !== open.title ? (
                      <h3 className="mb-1 mt-4 font-playfair text-base font-semibold text-foreground first:mt-0">
                        {s.title}
                      </h3>
                    ) : null}
                    <Blocks
                      blocks={s.blocks}
                      storageKey={`${open.slug}:sec${i}`}
                      onImage={(src, alt) => setLightbox({ src, alt })}
                    />
                  </section>
                ))}
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={!!lightbox} onOpenChange={(o) => !o && setLightbox(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="sr-only">Illustration</DialogTitle>
            <DialogDescription>{lightbox?.alt}</DialogDescription>
          </DialogHeader>
          {lightbox ? (
             
            <img src={lightbox.src} alt={lightbox.alt} className="w-full rounded-lg" />
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
