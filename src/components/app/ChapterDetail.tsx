"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronLeft, ShieldAlert, Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Chapter, Section } from "@/data/chapters";
import { firstImage, doctorScripts } from "@/data/chapters";
import { Blocks, InlineText, useChecks } from "./Blocks";
import { chapterStyle } from "./chapterMeta";

const SECTION_LABELS: Record<string, string> = {
  general: "Overview",
  patterns: "Pick your pattern",
  safety: "Safety Gate",
  "is-this-you": "Is this you?",
  "do-now": "Do this now",
  fix48: "48-hour fix",
  week7: "First 7 days",
  reset30: "30-day reset",
  doctor: "Say this to your doctor",
  science: "The science",
  troubleshooting: "If it isn't working",
};

function prettySectionTitle(s: Section): string {
  return SECTION_LABELS[s.kind] ?? s.title;
}

export function ChapterDetail({
  chapter,
  onBack,
}: {
  chapter: Chapter;
  onBack: () => void;
}) {
  const style = chapterStyle(chapter.slug);
  const hero = useMemo(() => firstImage(chapter), [chapter]);
  const scripts = useMemo(() => doctorScripts(chapter), [chapter]);
  const [lightbox, setLightbox] = useState<{ src: string; alt: string } | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  // Science sections start collapsed; auto-open when a book link targets them
  const [scienceOpen, setScienceOpen] = useState(false);
  useEffect(() => {
    const open = () => setScienceOpen(true);
    const reset = () => setScienceOpen(false);
    window.addEventListener("peri-open-science", open);
    window.addEventListener("peri-chapter-opened", reset);
    return () => {
      window.removeEventListener("peri-open-science", open);
      window.removeEventListener("peri-chapter-opened", reset);
    };
  }, []);

  const safety = chapter.sections.find((s) => s.kind === "safety");
  const others = chapter.sections.filter((s) => s.kind !== "safety" && s.kind !== "general");
  const overview = chapter.sections.filter((s) => s.kind === "general");
  const secId = (s: (typeof chapter.sections)[number], i: number) =>
    s.anchor ? `a-${s.anchor}` : `sec-${i}`;

  const copyScript = (text: string) => {
    navigator.clipboard?.writeText(text).then(
      () => {
        setCopied(text);
        setTimeout(() => setCopied(null), 1800);
      },
      () => {}
    );
  };

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-24 pt-4 md:pb-10">
      <Button variant="ghost" size="sm" onClick={onBack} className="mb-4 -ml-2 gap-1 text-muted-foreground">
        <ChevronLeft className="h-4 w-4" /> All chapters
      </Button>

      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-card">
        <div className={cn("h-2 w-full bg-gradient-to-r", style.bar)} />
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start">
          <div className={cn("flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl shadow-sm", style.tile)}>
            <style.icon className="h-7 w-7" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={cn("border-transparent text-[11px] font-semibold", style.chip)}>
                {chapter.number <= 12 ? `Chapter ${chapter.number}` : chapter.number === 13 ? "Special Chapter" : "Guide"}
              </Badge>
            </div>
            <h1 className="mt-1.5 font-playfair text-2xl font-bold leading-tight text-foreground sm:text-3xl">
              {chapter.title}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">{chapter.tagline}</p>
          </div>
        </div>
        {hero ? (
          <div className="border-t border-border bg-muted/40">
            <img
              src={hero}
              alt={`${chapter.title} illustration`}
              className="aspect-[3/2] w-full object-cover object-center"
            />
          </div>
        ) : null}
      </div>

      {/* Quick nav chips */}
      <nav aria-label="Section navigation" className="sticky top-[3.25rem] z-20 -mx-4 mt-4 bg-background/90 px-4 py-2 backdrop-blur">
        <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <a href="#safety" className="shrink-0 rounded-full border border-destructive/40 bg-destructive/10 px-3 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/20">
            Safety Gate first
          </a>
          {others.map((s, i) => (
            <a
              key={i}
              href={`#${secId(s, i)}`}
              className="shrink-0 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
            >
              {prettySectionTitle(s)}
            </a>
          ))}
        </div>
      </nav>

      {/* Safety gate — always first */}
      {safety ? (
        <section id="safety" className="mt-4 scroll-mt-28">
          <div className="rounded-2xl border-2 border-destructive/40 bg-destructive/5 p-5">
            <div className="mb-2 flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-destructive" aria-hidden />
              <h2 className="font-playfair text-lg font-bold text-destructive">
                Safety Gate — read this first
              </h2>
            </div>
            <SafetyBlocks chapter={chapter} section={safety} />
          </div>
        </section>
      ) : null}

      {/* Overview / validation */}
      {overview.map((s, i) => (
        <section key={i} id={s.anchor ? `a-${s.anchor}` : undefined} className="mt-6 scroll-mt-32">
          <Blocks blocks={s.blocks} storageKey={`${chapter.slug}:general:${i}`} onImage={(src, alt) => setLightbox({ src, alt })} />
        </section>
      ))}

      {/* All other sections */}
      {others.map((s, i) => (
        <section key={i} id={secId(s, i)} className="mt-8 scroll-mt-32">
          <SectionBody
            section={s}
            chapter={chapter}
            scripts={s.kind === "doctor" ? scripts : []}
            copied={copied}
            onCopy={copyScript}
            onImage={(src, alt) => setLightbox({ src, alt })}
            scienceOpen={scienceOpen}
            onScienceOpenChange={setScienceOpen}
          />
        </section>
      ))}

      <p className="mt-10 rounded-xl bg-muted/60 p-4 text-xs leading-relaxed text-muted-foreground">
        Support material only — this chapter offers general education, not personal medical advice.
        Always check symptoms, tests, medicines, supplements, and treatment decisions with a qualified
        clinician, and seek urgent care when a Safety Gate warning applies.
      </p>

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

function SafetyBlocks({ chapter, section }: { chapter: Chapter; section: Section }) {
  const key = `${chapter.slug}:safety`;
  const checked = useChecks(section.blocks.map((_, i) => `${key}:${i}`));
  const anyChecked = section.blocks.some(
    (b) => b.type === "checklist" && b.items.some((it) => checked[it])
  );
  return (
    <>
      {anyChecked ? (
        <Alert variant="destructive" className="mb-4">
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle>Stop — get medical help first</AlertTitle>
          <AlertDescription className="text-destructive/90">
            You checked a warning sign. Do not try this chapter&apos;s protocol. Contact your clinician
            or local emergency services as described in the book.
          </AlertDescription>
        </Alert>
      ) : null}
      <Blocks blocks={section.blocks} storageKey={key} />
    </>
  );
}

function SectionBody({
  section,
  chapter,
  scripts,
  copied,
  onCopy,
  onImage,
  scienceOpen,
  onScienceOpenChange,
}: {
  section: Section;
  chapter: Chapter;
  scripts: string[];
  copied: string | null;
  onCopy: (t: string) => void;
  onImage: (src: string, alt: string) => void;
  scienceOpen: boolean;
  onScienceOpenChange: (v: boolean) => void;
}) {
  const style = chapterStyle(chapter.slug);
  const isScience = section.kind === "science";
  const open = isScience ? scienceOpen : true;

  const header = (
    <div className="mb-3 flex items-center justify-between gap-2">
      <h2 className="font-playfair text-xl font-bold text-foreground">{prettySectionTitle(section)}</h2>
      <span className={cn("rounded-full px-2.5 py-0.5 text-[11px] font-semibold", style.chip)}>
        {section.kind === "do-now"
          ? "Right now"
          : section.kind === "fix48"
            ? "Next 2 days"
            : section.kind === "week7"
              ? "Build a routine"
              : section.kind === "reset30"
                ? "Longer game"
                : section.kind === "doctor"
                  ? "Advocate"
                  : section.kind === "science"
                    ? "Optional"
                    : ""}
      </span>
    </div>
  );

  const body = (
    <>
      {scripts.length ? (
        <div className="mb-4 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Tap to copy a script
          </p>
          {scripts.map((s, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onCopy(s)}
              className="flex w-full items-start gap-2 rounded-lg border border-primary/25 bg-primary/5 p-3 text-left text-sm italic leading-relaxed text-foreground/90 transition-colors hover:bg-primary/10"
            >
              <InlineText text={s} className="flex-1" />
              {copied === s ? (
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
              ) : (
                <Copy className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
              )}
            </button>
          ))}
        </div>
      ) : null}
      <Blocks blocks={section.blocks} storageKey={`${chapter.slug}:${section.kind}`} onImage={onImage} />
    </>
  );

  if (isScience) {
    return (
      <Collapsible open={open} onOpenChange={onScienceOpenChange}>
        <div className="rounded-2xl border border-purple-300/40 bg-purple-50/40 p-5 dark:border-purple-900/50 dark:bg-purple-950/20" data-science="true">
          <CollapsibleTrigger className="w-full text-left">
            {header}
            <p className="-mt-2 mb-1 text-xs text-muted-foreground">
              {open ? "Tap to collapse" : "Optional — open when you're curious. Explained simply."}
            </p>
          </CollapsibleTrigger>
          <CollapsibleContent>{body}</CollapsibleContent>
        </div>
      </Collapsible>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      {header}
      {body}
    </div>
  );
}
