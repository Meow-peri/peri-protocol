"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Line, LineChart, XAxis, YAxis } from "recharts";
import type { DailyEntry, WeeklyNote } from "@/types";
import {
  addDays,
  dayShort,
  formatRange,
  mondayOf,
  toISODate,
  todayISO,
} from "@/lib/dates";
import { cn } from "@/lib/utils";
import { MilestoneSlider, WORDS } from "./MilestoneSlider";
import { ChevronLeft, ChevronRight, Moon, Smile, Zap, PencilLine } from "lucide-react";

const cellTone = (v: number | null) => {
  if (v === null) return "bg-muted/40 text-muted-foreground/50";
  if (v >= 8) return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300";
  if (v >= 5) return "bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300";
  return "bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300";
};

export function TrackerView() {
  const { toast } = useToast();
  const [entries, setEntries] = useState<Record<string, DailyEntry>>({});
  const [notes, setNotes] = useState<Record<string, WeeklyNote>>({});
  const [loading, setLoading] = useState(true);
  const [weekOffset, setWeekOffset] = useState(0);
  const [editing, setEditing] = useState<string | null>(null);

  const monday = useMemo(
    () => addDays(mondayOf(new Date()), weekOffset * 7),
    [weekOffset]
  );
  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(monday, i)),
    [monday]
  );
  const weekKey = toISODate(monday);

  useEffect(() => {
    Promise.all([
      fetch("/api/entries").then((r) => r.json()),
      fetch("/api/weekly").then((r) => r.json()),
    ])
      .then(([e, w]: [DailyEntry[], WeeklyNote[]]) => {
        setEntries(Object.fromEntries((Array.isArray(e) ? e : []).map((x) => [x.date, x])));
        setNotes(Object.fromEntries((Array.isArray(w) ? w : []).map((x) => [x.weekStart, x])));
      })
      .catch(() => {
        setEntries({});
        setNotes({});
      })
      .finally(() => setLoading(false));
  }, []);

  const note = notes[weekKey];

  const saveDay = useCallback(
    async (entry: Partial<DailyEntry> & { date: string }) => {
      const res = await fetch("/api/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(entry),
      });
      if (!res.ok) {
        toast({ title: "Couldn't save", variant: "destructive" });
        return;
      }
      const saved: DailyEntry = await res.json();
      setEntries((prev) => ({ ...prev, [saved.date]: saved }));
    },
    [toast]
  );

  const saveWeek = useCallback(
    async (mainSymptom: string, pattern: string) => {
      const res = await fetch("/api/weekly", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weekStart: weekKey, mainSymptom, pattern }),
      });
      if (!res.ok) {
        toast({ title: "Couldn't save note", variant: "destructive" });
        return;
      }
      const saved: WeeklyNote = await res.json();
      setNotes((prev) => ({ ...prev, [saved.weekStart]: saved }));
      toast({ title: "Weekly pattern saved", description: "Bring this to your clinician if it persists." });
    },
    [weekKey, toast]
  );

  // Chart data: last 28 days that have entries
  const chartData = useMemo(() => {
    const list = Object.values(entries)
      .filter((e) => e.sleepQuality || e.mood || e.energy)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-28);
    return list.map((e) => ({
      date: `${dayShort(new Date(e.date))} ${new Date(e.date).getDate()}`,
      sleep: e.sleepQuality,
      mood: e.mood,
      energy: e.energy,
    }));
  }, [entries]);

  const chartConfig = {
    sleep: { label: "Sleep", color: "var(--chart-4)" },
    mood: { label: "Mood", color: "var(--chart-1)" },
    energy: { label: "Energy", color: "var(--chart-5)" },
  } satisfies ChartConfig;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 pb-24 pt-6 md:pb-10">
      <header className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
          Two minutes a day
        </p>
        <h1 className="mt-1 font-playfair text-3xl font-bold text-foreground">Weekly tracker</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          The same grid as the paper tracker — sleep, mood, energy, symptoms, actions. Tap any cell
          to fill it in. Bring a persistent pattern to your clinician.
        </p>
      </header>

      {/* Week switcher */}
      <div className="flex items-center justify-between gap-2 rounded-xl border border-border bg-card p-2 shadow-sm">
        <Button variant="ghost" size="icon" onClick={() => setWeekOffset((w) => w - 1)} aria-label="Previous week">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="text-center">
          <p className="text-sm font-semibold text-foreground">{formatRange(monday)}</p>
          <p className="text-[11px] text-muted-foreground">
            {weekOffset === 0 ? "This week" : weekOffset === -1 ? "Last week" : weekOffset === 1 ? "Next week" : `${Math.abs(weekOffset)} weeks ${weekOffset < 0 ? "ago" : "ahead"}`}
          </p>
        </div>
        <div className="flex items-center gap-1">
          {weekOffset !== 0 ? (
            <Button variant="ghost" size="sm" onClick={() => setWeekOffset(0)} className="text-xs">
              Today
            </Button>
          ) : null}
          <Button variant="ghost" size="icon" onClick={() => setWeekOffset((w) => w + 1)} aria-label="Next week">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* The grid */}
      <Card className="mt-4 overflow-hidden shadow-sm">
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full min-w-[44rem] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="sticky left-0 z-10 min-w-28 bg-muted/40 px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground backdrop-blur">
                  Track
                </th>
                {days.map((d) => (
                  <th key={toISODate(d)} className="px-2 py-2.5 text-center">
                    <div className={cn("text-xs font-semibold", toISODate(d) === todayISO() ? "text-primary" : "text-foreground")}>
                      {dayShort(d)}
                    </div>
                    <div className="text-[10px] text-muted-foreground">{d.getDate()}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(
                [
                  { key: "sleepQuality", label: "Sleep quality", icon: Moon, hint: "1–10" },
                  { key: "mood", label: "Mood", icon: Smile, hint: "1–10" },
                  { key: "energy", label: "Energy", icon: Zap, hint: "1–10" },
                ] as const
              ).map((metric) => (
                <tr key={metric.key} className="border-b border-border/60">
                  <th className="sticky left-0 z-10 bg-card px-3 py-2 text-left">
                    <span className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                      <metric.icon className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
                      {metric.label}
                      <span className="text-[10px] font-normal text-muted-foreground">{metric.hint}</span>
                    </span>
                  </th>
                  {days.map((d) => {
                    const iso = toISODate(d);
                    const v = entries[iso]?.[metric.key] ?? null;
                    return (
                      <td key={iso} className="px-1.5 py-1.5 text-center">
                        <button
                          type="button"
                          onClick={() => setEditing(iso)}
                          className={cn(
                            "h-9 w-full min-w-9 rounded-lg text-sm font-semibold tabular-nums transition-transform hover:scale-105",
                            cellTone(v)
                          )}
                          aria-label={`${metric.label} on ${iso}: ${v ?? "not set"}`}
                        >
                          {v ?? "·"}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
              {(
                [
                  { key: "symptoms", label: "Symptoms", hint: "a few words" },
                  { key: "actions", label: "Actions taken", hint: "a few words" },
                ] as const
              ).map((field) => (
                <tr key={field.key} className="border-b border-border/60 last:border-0">
                  <th className="sticky left-0 z-10 bg-card px-3 py-2 text-left">
                    <span className="block text-xs font-medium text-foreground">{field.label}</span>
                    <span className="text-[10px] font-normal text-muted-foreground">{field.hint}</span>
                  </th>
                  {days.map((d) => {
                    const iso = toISODate(d);
                    const v = entries[iso]?.[field.key];
                    return (
                      <td key={iso} className="px-1.5 py-1.5">
                        <button
                          type="button"
                          onClick={() => setEditing(iso)}
                          className="h-9 w-full truncate rounded-lg border border-border/70 bg-muted/30 px-2 text-left text-xs text-foreground/90 transition-colors hover:border-primary/40 hover:bg-primary/5"
                          aria-label={`${field.label} on ${iso}: ${v ?? "empty"}`}
                        >
                          {v || <PencilLine className="ml-auto h-3 w-3 text-muted-foreground/40" />}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Weekly pattern note */}
      <WeekNoteCard
        key={weekKey}
        initialMain={note?.mainSymptom ?? ""}
        initialPattern={note?.pattern ?? ""}
        onSave={saveWeek}
      />

      {/* Trends */}
      <Card className="mt-6 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Patterns over time</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Loading your history…</p>
          ) : chartData.length < 2 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Check in on at least two days and your pattern lines will appear here.
            </p>
          ) : (
            <ChartContainer config={chartConfig} className="h-64 w-full">
              <LineChart data={chartData} margin={{ top: 8, right: 12, bottom: 0, left: -18 }}>
                <XAxis dataKey="date" tickLine={false} axisLine={false} fontSize={11} interval="preserveStartEnd" />
                <YAxis domain={[1, 10]} tickLine={false} axisLine={false} fontSize={11} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line dataKey="sleep" stroke="var(--color-sleep)" strokeWidth={2} dot={false} connectNulls />
                <Line dataKey="mood" stroke="var(--color-mood)" strokeWidth={2} dot={false} connectNulls />
                <Line dataKey="energy" stroke="var(--color-energy)" strokeWidth={2} dot={false} connectNulls />
              </LineChart>
            </ChartContainer>
          )}
          <p className="mt-3 rounded-lg bg-muted/50 p-3 text-xs leading-relaxed text-muted-foreground">
            Bring this page to your clinician if a pattern is persistent, severe, changing, or
            affecting daily life.
          </p>
        </CardContent>
      </Card>

      {/* Day editor dialog */}
      <DayEditor
        date={editing}
        entry={editing ? entries[editing] : undefined}
        onClose={() => setEditing(null)}
        onSave={saveDay}
      />
    </div>
  );
}

function WeekNoteCard({
  initialMain,
  initialPattern,
  onSave,
}: {
  initialMain: string;
  initialPattern: string;
  onSave: (main: string, pattern: string) => Promise<void>;
}) {
  const [main, setMain] = useState(initialMain);
  const [pattern, setPattern] = useState(initialPattern);
  const [busy, setBusy] = useState(false);

  return (
    <Card className="mt-6 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Pattern I noticed this week</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1.5">
          <label htmlFor="main-symptom" className="text-sm font-medium text-foreground">
            Main symptom this week
          </label>
          <Input
            id="main-symptom"
            value={main}
            onChange={(e) => setMain(e.target.value)}
            placeholder="e.g. 3 a.m. wake-ups, 4 nights"
            maxLength={80}
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="pattern" className="text-sm font-medium text-foreground">
            The pattern I noticed
          </label>
          <Textarea
            id="pattern"
            value={pattern}
            onChange={(e) => setPattern(e.target.value)}
            placeholder="e.g. worse after wine; better on mornings I got outside; rage spikes in the week before my period"
            rows={3}
            maxLength={400}
          />
        </div>
        <Button
          size="sm"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              await onSave(main, pattern);
            } finally {
              setBusy(false);
            }
          }}
        >
          {busy ? "Saving…" : "Save weekly note"}
        </Button>
      </CardContent>
    </Card>
  );
}

function DayEditor({
  date,
  entry,
  onClose,
  onSave,
}: {
  date: string | null;
  entry?: DailyEntry;
  onClose: () => void;
  onSave: (entry: Partial<DailyEntry> & { date: string }) => Promise<void>;
}) {
  const [sleep, setSleep] = useState(entry?.sleepQuality ?? 5);
  const [mood, setMood] = useState(entry?.mood ?? 5);
  const [energy, setEnergy] = useState(entry?.energy ?? 5);
  const [symptoms, setSymptoms] = useState(entry?.symptoms ?? "");
  const [actions, setActions] = useState(entry?.actions ?? "");
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setSleep(entry?.sleepQuality ?? 5);
    setMood(entry?.mood ?? 5);
    setEnergy(entry?.energy ?? 5);
    setSymptoms(entry?.symptoms ?? "");
    setActions(entry?.actions ?? "");
    setReady(true);
    return () => setReady(false);
  }, [date, entry?.sleepQuality, entry?.mood, entry?.energy, entry?.symptoms, entry?.actions]);

  if (!date || !ready) return null;
  const d = new Date(date);

  return (
    <Dialog open={!!date} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className="font-playfair">
            {d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-5">
          <MilestoneSlider label="Sleep quality" icon={Moon} value={sleep} onChange={setSleep} words={[...WORDS.sleep]} colorClass="text-purple-600" />
          <MilestoneSlider label="Mood" icon={Smile} value={mood} onChange={setMood} words={[...WORDS.mood]} colorClass="text-rose-600" />
          <MilestoneSlider label="Energy" icon={Zap} value={energy} onChange={setEnergy} words={[...WORDS.energy]} colorClass="text-amber-600" />
          <div className="space-y-1.5">
            <label htmlFor="ed-symptoms" className="text-sm font-medium">Symptoms</label>
            <Input id="ed-symptoms" value={symptoms} onChange={(e) => setSymptoms(e.target.value)} placeholder="a few words" maxLength={120} />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="ed-actions" className="text-sm font-medium">Actions taken</label>
            <Input id="ed-actions" value={actions} onChange={(e) => setActions(e.target.value)} placeholder="a few words" maxLength={120} />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
            <Button
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  await onSave({ date, sleepQuality: sleep, mood, energy, symptoms, actions });
                  onClose();
                } finally {
                  setBusy(false);
                }
              }}
            >
              {busy ? "Saving…" : "Save day"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
