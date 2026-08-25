"use client";

import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

/**
 * A 1–10 slider where EVERY number has its own everyday word — so whatever a
 * woman taps, she instantly sees what it means ("7 = Decent").
 * Tick marks + tappable numbers + a live meaning pill.
 */
export function MilestoneSlider({
  label,
  icon: Icon,
  value,
  onChange,
  words,
  colorClass,
}: {
  label: string;
  icon: LucideIcon;
  value: number;
  onChange: (v: number) => void;
  /** exactly 10 words, index 0 = value 1 */
  words: string[];
  colorClass?: string;
}) {
  const pct = (n: number) => ((n - 1) / 9) * 100;
  const v = value || 5;
  const tone =
    v <= 3
      ? "bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300"
      : v <= 6
        ? "bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300"
        : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300";

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-2">
        <label className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Icon className={cn("h-4 w-4", colorClass)} aria-hidden />
          {label}
        </label>
        <span
          className="min-w-8 rounded-full bg-primary/10 px-2 py-0.5 text-center text-sm font-bold tabular-nums text-primary"
          aria-live="polite"
        >
          {v}
        </span>
      </div>

      <Slider
        value={[v]}
        min={1}
        max={10}
        step={1}
        onValueChange={(x) => onChange(x[0])}
        aria-label={`${label} out of 10`}
      />

      {/* Tick marks on the line */}
      <div className="relative mt-1 h-1.5" aria-hidden>
        {Array.from({ length: 10 }, (_, i) => (
          <span
            key={i}
            className={cn("absolute top-0 h-1.5 w-px", i + 1 === v ? "bg-primary" : "bg-border")}
            style={{ left: `${pct(i + 1)}%` }}
          />
        ))}
      </div>

      {/* Tappable numbers 1–10 */}
      <div className="relative mt-0.5 h-7">
        {Array.from({ length: 10 }, (_, i) => {
          const n = i + 1;
          return (
            <button
              key={n}
              type="button"
              onClick={() => onChange(n)}
              className={cn(
                "absolute -translate-x-1/2 rounded px-1.5 py-1 text-[11px] tabular-nums transition-colors hover:text-foreground",
                n === v ? "font-bold text-primary" : "text-muted-foreground/70"
              )}
              style={{ left: `${pct(n)}%` }}
              aria-label={`Set ${label} to ${n}`}
              aria-pressed={n === v}
            >
              {n}
            </button>
          );
        })}
      </div>

      {/* Live meaning: what the chosen number means, in plain words */}
      <p className="mt-1 text-center" aria-live="polite">
        <span
          className={cn(
            "inline-block rounded-full px-3.5 py-1 text-sm font-semibold",
            tone
          )}
        >
          {v} = {words[v - 1]}
        </span>
      </p>
    </div>
  );
}

export const WORDS = {
  sleep: [
    "Nightmarish",
    "Barely slept",
    "Very bad",
    "Poor",
    "Broken",
    "So-so",
    "Decent",
    "Good",
    "Restful",
    "Deep & easy",
  ],
  mood: [
    "Fragile",
    "On edge",
    "Low",
    "Touchy",
    "Up & down",
    "Coping",
    "Steady-ish",
    "Good",
    "Calm & clear",
    "Wonderful",
  ],
  energy: [
    "Flat",
    "Drained",
    "Heavy",
    "Sluggish",
    "Coping",
    "Okay",
    "Charged-ish",
    "Strong",
    "Buzzing",
    "Fully alive",
  ],
} as const;
