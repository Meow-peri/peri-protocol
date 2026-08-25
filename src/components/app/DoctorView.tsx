"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import type { DoctorVisit } from "@/types";
import { SYMPTOM_CHAPTERS, doctorScripts, getChapter } from "@/data/chapters";
import { chapterStyle } from "./chapterMeta";
import { cn } from "@/lib/utils";
import { Plus, Trash2, Pencil, Printer, MessagesSquare, FileText } from "lucide-react";

const EMPTY: Omit<DoctorVisit, "id"> = {
  appointmentDate: "",
  clinician: "",
  chapter: "",
  symptom1: "",
  symptom2: "",
  symptom3: "",
  timingPattern: "",
  script: "",
  questions: "",
  decisions: "",
};

export function DoctorView() {
  const { toast } = useToast();
  const [visits, setVisits] = useState<DoctorVisit[] | null>(null);
  const [editing, setEditing] = useState<DoctorVisit | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<DoctorVisit | null>(null);

  const load = () =>
    fetch("/api/doctor-visits")
      .then((r) => r.json())
      .then((d) => setVisits(Array.isArray(d) ? d : []))
      .catch(() => setVisits([]));

  useEffect(() => {
    load();
  }, []);

  const del = async (id: string) => {
    await fetch(`/api/doctor-visits/${id}`, { method: "DELETE" });
    setVisits((v) => (v ?? []).filter((x) => x.id !== id));
    setDeleting(null);
    toast({ title: "Prep sheet deleted" });
  };

  return (
    <div className="mx-auto w-full max-w-4xl px-4 pb-24 pt-6 md:pb-10">
      <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            Bring this with you
          </p>
          <h1 className="mt-1 font-playfair text-3xl font-bold text-foreground">Doctor visit prep</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Your pattern, your script, and your questions — written down before the appointment, so
            nothing gets lost in a ten-minute visit.
          </p>
        </div>
        <Button onClick={() => setCreating(true)} className="gap-1.5">
          <Plus className="h-4 w-4" aria-hidden /> New prep sheet
        </Button>
      </header>

      {visits === null ? (
        <p className="py-10 text-center text-sm text-muted-foreground">Loading…</p>
      ) : visits.length === 0 ? (
        <Card className="border-dashed shadow-none">
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <FileText className="h-8 w-8 text-muted-foreground/50" aria-hidden />
            <p className="max-w-sm text-sm text-muted-foreground">
              No prep sheets yet. Create one before your next appointment — pick your symptom
              chapter, your top three symptoms, and the script you want to use.
            </p>
            <Button variant="outline" onClick={() => setCreating(true)} className="gap-1.5">
              <Plus className="h-4 w-4" aria-hidden /> Create your first sheet
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {visits.map((v) => {
            const chapter = v.chapter ? getChapter(v.chapter) : undefined;
            const style = chapter ? chapterStyle(chapter.slug) : null;
            return (
              <Card key={v.id} className="flex flex-col shadow-sm">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-base">
                        {v.appointmentDate
                          ? new Date(v.appointmentDate).toLocaleDateString("en-US", {
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })
                          : "Date not set"}
                      </CardTitle>
                      <p className="text-xs text-muted-foreground">
                        {v.clinician || "Clinician not noted"}
                      </p>
                    </div>
                    {chapter && style ? (
                      <Badge variant="outline" className={cn("shrink-0 border-transparent", style.chip)}>
                        <style.icon className="mr-1 h-3 w-3" aria-hidden />
                        {chapter.title}
                      </Badge>
                    ) : null}
                  </div>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col gap-3">
                  <div className="flex-1 space-y-1.5 text-sm">
                    {[v.symptom1, v.symptom2, v.symptom3].filter(Boolean).map((s, i) => (
                      <p key={i} className="flex gap-2 text-foreground/90">
                        <span className="font-semibold text-primary">{i + 1}.</span> {s}
                      </p>
                    ))}
                    {v.script ? (
                      <p className="mt-2 rounded-lg border border-primary/20 bg-primary/5 p-2.5 text-xs italic leading-relaxed">
                        “{v.script}”
                      </p>
                    ) : null}
                    {v.decisions ? (
                      <p className="mt-2 text-xs text-muted-foreground">
                        <span className="font-semibold">Agreed:</span> {v.decisions}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex justify-end gap-1 border-t border-border/60 pt-2">
                    <Button variant="ghost" size="icon" onClick={() => window.print()} aria-label="Print prep sheet" title="Print">
                      <Printer className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setEditing(v)} aria-label="Edit prep sheet" title="Edit">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleting(v)} aria-label="Delete prep sheet" title="Delete" className="text-destructive hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <PrepDialog
        open={creating || !!editing}
        initial={editing ?? undefined}
        onClose={() => {
          setCreating(false);
          setEditing(null);
        }}
        onSaved={() => {
          setCreating(false);
          setEditing(null);
          load();
        }}
      />

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this prep sheet?</AlertDialogTitle>
            <AlertDialogDescription>
              This can&apos;t be undone. Consider printing or saving your notes first.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep it</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleting && del(deleting.id)}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function PrepDialog({
  open,
  initial,
  onClose,
  onSaved,
}: {
  open: boolean;
  initial?: DoctorVisit;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { toast } = useToast();
  const [form, setForm] = useState({ ...EMPTY });
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof EMPTY) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    if (open) {
      setForm(
        initial
          ? {
              appointmentDate: initial.appointmentDate ?? "",
              clinician: initial.clinician ?? "",
              chapter: initial.chapter ?? "",
              symptom1: initial.symptom1 ?? "",
              symptom2: initial.symptom2 ?? "",
              symptom3: initial.symptom3 ?? "",
              timingPattern: initial.timingPattern ?? "",
              script: initial.script ?? "",
              questions: initial.questions ?? "",
              decisions: initial.decisions ?? "",
            }
          : { ...EMPTY }
      );
    }
  }, [open, initial]);

  const chapter = form.chapter ? getChapter(form.chapter) : undefined;
  const scripts = useMemo(() => (chapter ? doctorScripts(chapter) : []), [chapter]);

  const save = async () => {
    setBusy(true);
    try {
      const url = initial ? `/api/doctor-visits/${initial.id}` : "/api/doctor-visits";
      const res = await fetch(url, {
        method: initial ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      toast({ title: initial ? "Prep sheet updated" : "Prep sheet saved" });
      onSaved();
    } catch {
      toast({ title: "Couldn't save", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[88vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-playfair">Doctor visit prep sheet</DialogTitle>
          <DialogDescription>
            Write it down now so you don&apos;t have to remember it in the room.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="appt-date">Appointment date</Label>
              <Input id="appt-date" type="date" value={form.appointmentDate} onChange={(e) => set("appointmentDate")(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="clinician">Clinician</Label>
              <Input id="clinician" value={form.clinician} onChange={(e) => set("clinician")(e.target.value)} placeholder="Dr. …" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>The symptom chapter I&apos;m using</Label>
            <Select
              value={form.chapter || "none"}
              onValueChange={(v) => set("chapter")(v === "none" ? "" : v)}
            >
              <SelectTrigger aria-label="Symptom chapter">
                <SelectValue placeholder="Choose the chapter that fits" />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                <SelectItem value="none">No chapter — general visit</SelectItem>
                {SYMPTOM_CHAPTERS.map((c) => (
                  <SelectItem key={c.slug} value={c.slug}>
                    {c.number <= 12 ? `Ch. ${c.number} · ` : ""}
                    {c.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3 rounded-xl border border-border bg-muted/40 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              My top three symptoms
            </p>
            {(["symptom1", "symptom2", "symptom3"] as const).map((k, i) => (
              <div key={k} className="flex items-center gap-2">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                  {i + 1}
                </span>
                <Input value={form[k]} onChange={(e) => set(k)(e.target.value)} placeholder={i === 0 ? "Most bothering me…" : ""} />
              </div>
            ))}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="timing">The timing or pattern I noticed</Label>
            <Textarea
              id="timing"
              rows={2}
              value={form.timingPattern}
              onChange={(e) => set("timingPattern")(e.target.value)}
              placeholder="e.g. only in the week before my period; started when my cycle changed; worse after poor sleep"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="script">The exact script I want to use</Label>
            <Textarea
              id="script"
              rows={2}
              value={form.script}
              onChange={(e) => set("script")(e.target.value)}
              placeholder="Write it word for word — you don't have to improvise."
            />
            {scripts.length ? (
              <div className="space-y-1.5 pt-1">
                <p className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
                  <MessagesSquare className="h-3 w-3" aria-hidden /> From the “{chapter?.title}” chapter — tap to use:
                </p>
                {scripts.slice(0, 3).map((s, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => set("script")(s)}
                    className="block w-full rounded-lg border border-primary/25 bg-primary/5 p-2 text-left text-xs italic leading-relaxed text-foreground/90 hover:bg-primary/10"
                  >
                    {s}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="questions">My 2–3 questions</Label>
            <Textarea id="questions" rows={2} value={form.questions} onChange={(e) => set("questions")(e.target.value)} placeholder="1. … 2. … 3. …" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="decisions">Decisions, tests, or follow-up agreed</Label>
            <Textarea id="decisions" rows={2} value={form.decisions} onChange={(e) => set("decisions")(e.target.value)} placeholder="Fill in after the visit so your own records stay complete." />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
            <Button onClick={save} disabled={busy}>
              {busy ? "Saving…" : initial ? "Update sheet" : "Save sheet"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
