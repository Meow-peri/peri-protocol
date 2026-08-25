"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import type { LabResult } from "@/types";
import { LAB_GROUPS } from "@/data/chapters";
import { formatPretty, toISODate } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { Check, Plus, Trash2, FlaskConical, Info } from "lucide-react";

export function LabsView() {
  const { toast } = useToast();
  const [labs, setLabs] = useState<LabResult[] | null>(null);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  // draft per test name
  const [drafts, setDrafts] = useState<Record<string, { result: string; range: string; date: string; note: string }>>({});
  const [customName, setCustomName] = useState("");

  const load = () =>
    fetch("/api/labs")
      .then((r) => r.json())
      .then((d) => setLabs(Array.isArray(d) ? d : []))
      .catch(() => setLabs([]));

  useEffect(() => {
    load();
  }, []);

  const byTest = useMemo(() => {
    const map = new Map<string, LabResult[]>();
    for (const l of labs ?? []) {
      const list = map.get(l.test) ?? [];
      list.push(l);
      map.set(l.test, list);
    }
    return map;
  }, [labs]);

  const latest = (test: string) => {
    const list = byTest.get(test);
    if (!list?.length) return null;
    return list.sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""))[0];
  };

  const save = async (test: string, draft: { result: string; range: string; date: string; note: string }) => {
    setSavingKey(test);
    try {
      const res = await fetch("/api/labs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          test,
          result: draft.result,
          referenceRange: draft.range,
          date: draft.date || null,
          note: draft.note,
        }),
      });
      if (!res.ok) throw new Error();
      setDrafts((d) => ({ ...d, [test]: { result: "", range: "", date: "", note: "" } }));
      await load();
      toast({ title: "Result logged", description: test });
    } catch {
      toast({ title: "Couldn't save result", variant: "destructive" });
    } finally {
      setSavingKey(null);
    }
  };

  const del = async (id: string) => {
    await fetch(`/api/labs/${id}`, { method: "DELETE" });
    setLabs((l) => (l ?? []).filter((x) => x.id !== id));
  };

  const draftFor = (test: string) => drafts[test] ?? { result: "", range: "", date: "", note: "" };
  const setDraft = (test: string, patch: Partial<{ result: string; range: string; date: string; note: string }>) =>
    setDrafts((d) => ({ ...d, [test]: { ...draftFor(test), ...patch } }));

  const allTests = useMemo(() => {
    const standard = LAB_GROUPS.flatMap((g) => g.tests);
    const extra = (labs ?? []).map((l) => l.test).filter((t) => !standard.includes(t));
    return [...standard, ...Array.from(new Set(extra))];
  }, [labs]);

  return (
    <div className="mx-auto w-full max-w-4xl px-4 pb-24 pt-6 md:pb-10">
      <header className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
          Use clinician-selected tests only
        </p>
        <h1 className="mt-1 font-playfair text-3xl font-bold text-foreground">Lab results log</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          You do not need every test listed. Record only tests your clinician orders, and interpret
          each result with the laboratory range, your history, and your symptoms.
        </p>
      </header>

      <Card className="mb-6 border-teal-600/25 bg-teal-50/50 dark:bg-teal-950/20 shadow-sm">
        <CardContent className="flex gap-3 p-4">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-teal-700 dark:text-teal-400" aria-hidden />
          <p className="text-sm leading-relaxed text-foreground/85">
            Ranges vary between labs — always copy the reference range printed on <em>your</em>{" "}
            report, and keep questions for your clinician. See the Toolkit for the full lab-test
            cheat sheet from Appendix A.
          </p>
        </CardContent>
      </Card>

      {LAB_GROUPS.map((group) => (
        <section key={group.group} className="mb-6">
          <h2 className="mb-2 flex items-center gap-2 font-playfair text-lg font-bold text-foreground">
            <FlaskConical className="h-4.5 w-4.5 h-5 w-5 text-primary" aria-hidden />
            {group.group}
          </h2>
          <div className="space-y-3">
            {group.tests.map((test) => (
              <TestRow
                key={test}
                test={test}
                entries={byTest.get(test) ?? []}
                current={latest(test)}
                draft={draftFor(test)}
                onDraft={(p) => setDraft(test, p)}
                onSave={() => save(test, draftFor(test))}
                saving={savingKey === test}
                onDelete={del}
              />
            ))}
          </div>
        </section>
      ))}

      {/* Custom tests from user data */}
      {(() => {
        const custom = allTests.filter((t) => !LAB_GROUPS.some((g) => g.tests.includes(t)));
        if (!custom.length) return null;
        return (
          <section className="mb-6">
            <h2 className="mb-2 font-playfair text-lg font-bold text-foreground">Other tests you track</h2>
            <div className="space-y-3">
              {custom.map((test) => (
                <TestRow
                  key={test}
                  test={test}
                  entries={byTest.get(test) ?? []}
                  current={latest(test)}
                  draft={draftFor(test)}
                  onDraft={(p) => setDraft(test, p)}
                  onSave={() => save(test, draftFor(test))}
                  saving={savingKey === test}
                  onDelete={del}
                />
              ))}
            </div>
          </section>
        );
      })()}

      {/* Add custom test */}
      <Card className="shadow-sm">
        <CardContent className="p-4">
          <Label htmlFor="custom-test" className="text-sm font-medium">
            Your clinician ordered something else?
          </Label>
          <div className="mt-2 flex gap-2">
            <Input
              id="custom-test"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="e.g. Fasting insulin"
              onKeyDown={(e) => {
                if (e.key === "Enter" && customName.trim()) {
                  save(customName.trim(), { result: "", range: "", date: toISODate(new Date()), note: "" });
                  setCustomName("");
                }
              }}
            />
            <Button
              variant="outline"
              disabled={!customName.trim()}
              onClick={() => {
                save(customName.trim(), { result: "", range: "", date: toISODate(new Date()), note: "" });
                setCustomName("");
              }}
              className="shrink-0 gap-1"
            >
              <Plus className="h-4 w-4" aria-hidden /> Add test
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function TestRow({
  test,
  entries,
  current,
  draft,
  onDraft,
  onSave,
  saving,
  onDelete,
}: {
  test: string;
  entries: LabResult[];
  current: LabResult | null;
  draft: { result: string; range: string; date: string; note: string };
  onDraft: (patch: Partial<{ result: string; range: string; date: string; note: string }>) => void;
  onSave: () => void;
  saving: boolean;
  onDelete: (id: string) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const hasHistory = entries.length > 1;

  return (
    <div className="rounded-xl border border-border bg-card p-3 shadow-sm">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <span className="min-w-40 flex-1 text-sm font-semibold text-foreground">{test}</span>
        <span
          className={cn(
            "rounded-lg px-2.5 py-1 text-sm font-bold tabular-nums",
            current?.result
              ? "bg-primary/10 text-primary"
              : "bg-muted text-muted-foreground/60"
          )}
        >
          {current?.result || "—"}
        </span>
        <span className="max-w-40 truncate text-xs text-muted-foreground" title={current?.referenceRange ?? ""}>
          {current?.referenceRange ? `ref: ${current.referenceRange}` : "no range set"}
        </span>
        <span className="text-xs text-muted-foreground">
          {current?.date ? formatPretty(new Date(current.date)) : ""}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setOpen((o) => !o)}
          className="ml-auto shrink-0"
        >
          {open ? "Close" : current?.result ? "New result" : "Log result"}
        </Button>
      </div>

      {current?.note ? (
        <p className="mt-2 rounded-lg bg-muted/50 px-2.5 py-1.5 text-xs text-muted-foreground">
          {current.note}
        </p>
      ) : null}

      {open ? (
        <div className="mt-3 grid gap-2 border-t border-border/60 pt-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1">
            <Label htmlFor={`${test}-result`} className="text-xs text-muted-foreground">My result</Label>
            <Input id={`${test}-result`} value={draft.result} onChange={(e) => onDraft({ result: e.target.value })} placeholder="value" />
          </div>
          <div className="space-y-1">
            <Label htmlFor={`${test}-range`} className="text-xs text-muted-foreground">Reference range</Label>
            <Input id={`${test}-range`} value={draft.range} onChange={(e) => onDraft({ range: e.target.value })} placeholder="from your report" />
          </div>
          <div className="space-y-1">
            <Label htmlFor={`${test}-date`} className="text-xs text-muted-foreground">Date</Label>
            <Input id={`${test}-date`} type="date" value={draft.date} onChange={(e) => onDraft({ date: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label htmlFor={`${test}-note`} className="text-xs text-muted-foreground">Flag / note</Label>
            <Input id={`${test}-note`} value={draft.note} onChange={(e) => onDraft({ note: e.target.value })} placeholder="e.g. recheck in 3 months" />
          </div>
          <div className="sm:col-span-2 lg:col-span-4">
            <Button size="sm" onClick={onSave} disabled={saving} className="gap-1.5">
              <Check className="h-4 w-4" aria-hidden /> {saving ? "Saving…" : "Save this result"}
            </Button>
          </div>
        </div>
      ) : null}

      {hasHistory ? (
        <div className="mt-3 border-t border-border/60 pt-2">
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            History
          </p>
          <ul className="space-y-1">
            {entries
              .filter((e) => e.id !== current?.id)
              .sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""))
              .map((e) => (
                <li key={e.id} className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="w-20 shrink-0">{e.date ? formatPretty(new Date(e.date)) : "—"}</span>
                  <span className="font-semibold text-foreground/80">{e.result || "—"}</span>
                  <span className="flex-1 truncate">{e.note ?? ""}</span>
                  <button
                    type="button"
                    onClick={() => onDelete(e.id)}
                    className="shrink-0 text-muted-foreground/50 transition-colors hover:text-destructive"
                    aria-label={`Delete ${test} result from ${e.date}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
