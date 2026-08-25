"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import type { DailyEntry } from "@/types";
import { SYMPTOM_CHAPTERS, type Chapter } from "@/data/chapters";
import { addDays, formatPretty, greeting, streak, toISODate, todayISO } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { chapterStyle } from "./chapterMeta";
import { MilestoneSlider, WORDS } from "./MilestoneSlider";
import { Flame, Moon, Smile, Sun, Zap, ArrowRight, CalendarCheck } from "lucide-react";

const QUICK_SYMPTOMS = [
  "3 a.m. wake-up",
  "rage / irritable",
  "brain fog",
  "exhausted",
  "bloated",
  "joint pain",
  "hot flash",
  "heavy bleeding",
  "headache",
  "anxious",
];
const QUICK_ACTIONS = [
  "morning daylight",
  "carb + protein pairing",
  "no caffeine after 2pm",
  "skipped alcohol",
  "walked 20 min",
  "magnesium",
  "slept 8 h",
  "strength training",
];

export function TodayView({ onOpenChapter }: { onOpenChapter: (c: Chapter) => void }) {
  const { toast } = useToast();
  const [entries, setEntries] = useState<DailyEntry[] | null>(null);
  const [saving, setSaving] = useState(false);
  const today = todayISO();
  const [sleep, setSleep] = useState(5);
  const [mood, setMood] = useState(5);
  const [energy, setEnergy] = useState(5);
  const [symptoms, setSymptoms] = useState("");
  const [actions, setActions] = useState("");
  const [savedToday, setSavedToday] = useState(false);

  useEffect(() => {
    fetch("/api/entries")
      .then((r) => r.json())
      .then((data: DailyEntry[]) => {
        if (Array.isArray(data)) {
          setEntries(data);
          const t = data.find((e) => e.date === todayISO());
          if (t) {
            setSleep(t.sleepQuality ?? 5);
            setMood(t.mood ?? 5);
            setEnergy(t.energy ?? 5);
            setSymptoms(t.symptoms ?? "");
            setActions(t.actions ?? "");
            setSavedToday(true);
          }
        } else {
          setEntries([]);
        }
      })
      .catch(() => setEntries([]));
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: today,
          sleepQuality: sleep,
          mood,
          energy,
          symptoms,
          actions,
        }),
      });
      if (!res.ok) throw new Error();
      const saved: DailyEntry = await res.json();
      setEntries((prev) => {
        const list = (prev ?? []).filter((e) => e.date !== saved.date);
        return [...list, saved].sort((a, b) => a.date.localeCompare(b.date));
      });
      setSavedToday(true);
      toast({
        title: "Check-in saved",
        description: "Two minutes a day is all this asks of you.",
      });
    } catch {
      toast({ title: "Couldn't save", description: "Please try again.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const stats = useMemo(() => {
    if (!entries) return null;
    const dates = new Set(entries.map((e) => e.date));
    const last7 = Array.from({ length: 7 }, (_, i) => toISODate(addDays(new Date(), -i)));
    const week = entries.filter((e) => last7.includes(e.date));
    const avg = (pick: (e: DailyEntry) => number | null) => {
      const vals = week.map(pick).filter((v): v is number => v !== null);
      return vals.length ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1) : "–";
    };
    return {
      streak: streak(dates),
      weekCount: week.length,
      avgSleep: avg((e) => e.sleepQuality),
      avgMood: avg((e) => e.mood),
      avgEnergy: avg((e) => e.energy),
    };
  }, [entries]);

  const quickChapters = useMemo(
    () => [
      SYMPTOM_CHAPTERS.find((c) => c.slug === "wake-up")!,
      SYMPTOM_CHAPTERS.find((c) => c.slug === "rage")!,
      SYMPTOM_CHAPTERS.find((c) => c.slug === "brain-fog")!,
      SYMPTOM_CHAPTERS.find((c) => c.slug === "fatigue")!,
      SYMPTOM_CHAPTERS.find((c) => c.slug === "periods")!,
      SYMPTOM_CHAPTERS.find((c) => c.slug === "hrt")!,
    ],
    []
  );

  const now = new Date();

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-24 pt-6 md:pb-10">
      <header className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
          {greeting()} · {formatPretty(now)}
        </p>
        <h1 className="mt-1 font-playfair text-3xl font-bold text-foreground">
          How are you, really?
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          One number, a few words, two minutes. More detail is not required — noticing patterns is
          the whole point.
        </p>
      </header>

      {/* Check-in card */}
      <Card className="border-primary/20 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarCheck className="h-5 w-5 text-primary" aria-hidden />
            Today&apos;s check-in
            {savedToday ? (
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                saved
              </span>
            ) : null}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-8 sm:grid-cols-3">
            <MilestoneSlider label="Sleep quality" icon={Moon} value={sleep} onChange={setSleep} words={[...WORDS.sleep]} colorClass="text-purple-600" />
            <MilestoneSlider label="Mood" icon={Smile} value={mood} onChange={setMood} words={[...WORDS.mood]} colorClass="text-rose-600" />
            <MilestoneSlider label="Energy" icon={Zap} value={energy} onChange={setEnergy} words={[...WORDS.energy]} colorClass="text-amber-600" />
          </div>

          <div className="space-y-2">
            <label htmlFor="symptoms" className="text-sm font-medium text-foreground">
              Symptoms — a few words
            </label>
            <Input
              id="symptoms"
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              placeholder="woke at 3 a.m., irritable by evening…"
              maxLength={120}
            />
            <div className="flex flex-wrap gap-1.5 pt-1">
              {QUICK_SYMPTOMS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() =>
                    setSymptoms((p) => (p ? (p.includes(s) ? p : `${p}, ${s}`) : s))
                  }
                  className="rounded-full border border-border bg-muted/50 px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                >
                  + {s}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="actions" className="text-sm font-medium text-foreground">
              Actions taken — a few words
            </label>
            <Input
              id="actions"
              value={actions}
              onChange={(e) => setActions(e.target.value)}
              placeholder="morning walk, magnesium, no wine…"
              maxLength={120}
            />
            <div className="flex flex-wrap gap-1.5 pt-1">
              {QUICK_ACTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() =>
                    setActions((p) => (p ? (p.includes(s) ? p : `${p}, ${s}`) : s))
                  }
                  className="rounded-full border border-border bg-muted/50 px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                >
                  + {s}
                </button>
              ))}
            </div>
          </div>

          <Button onClick={save} disabled={saving} className="w-full sm:w-auto" size="lg">
            {saving ? "Saving…" : savedToday ? "Update today" : "Save check-in"}
          </Button>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          icon={<Flame className="h-4 w-4 text-primary" aria-hidden />}
          label="Day streak"
          value={stats ? String(stats.streak) : undefined}
        />
        <StatCard
          icon={<CalendarCheck className="h-4 w-4 text-primary" aria-hidden />}
          label="This week"
          value={stats ? `${stats.weekCount}/7` : undefined}
        />
        <StatCard
          icon={<Moon className="h-4 w-4 text-purple-600" aria-hidden />}
          label="Avg sleep ·7d"
          value={stats ? stats.avgSleep : undefined}
        />
        <StatCard
          icon={<Smile className="h-4 w-4 text-rose-600" aria-hidden />}
          label="Avg mood ·7d"
          value={stats ? stats.avgMood : undefined}
        />
      </div>

      {/* Quick chapter access */}
      <section className="mt-8">
        <h2 className="font-playfair text-xl font-bold text-foreground">Need help right now?</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Go straight to the symptom that&apos;s worst tonight. Safety Gate first.
        </p>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {quickChapters.map((c) => {
            const style = chapterStyle(c.slug);
            return (
              <button
                key={c.slug}
                type="button"
                onClick={() => onOpenChapter(c)}
                className="group flex items-center gap-3 rounded-xl border border-border bg-card p-3 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
              >
                <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", style.tile)}>
                  <style.icon className="h-4.5 w-4.5 h-5 w-5" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-foreground">{c.title}</span>
                  <span className="block truncate text-xs text-muted-foreground">{c.tagline}</span>
                </span>
                <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" aria-hidden />
              </button>
            );
          })}
        </div>
      </section>

      {/* Daily nudge from the book's philosophy */}
      <Card className="mt-8 border-border bg-gradient-to-br from-primary/5 via-card to-purple-500/5">
        <CardContent className="flex gap-3 p-5">
          <Sun className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" aria-hidden />
          <div>
            <p className="font-playfair text-base italic leading-relaxed text-foreground/90">
              “You&apos;re not imagining this. You&apos;re not failing. And you don&apos;t have to
              figure it out alone.”
            </p>
            <p className="mt-2 text-xs text-muted-foreground">— Knox, Perimenopause Protocol Deluxe</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | undefined;
}) {
  return (
    <Card className="shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          {icon}
          <span className="text-[11px] font-medium uppercase tracking-wide">{label}</span>
        </div>
        {value === undefined ? (
          <Skeleton className="mt-2 h-7 w-12" />
        ) : (
          <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">{value}</p>
        )}
      </CardContent>
    </Card>
  );
}
