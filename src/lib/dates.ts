"use client";

// Date helpers — all local-time based, ISO YYYY-MM-DD keys.

export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function todayISO(): string {
  return toISODate(new Date());
}

/** Monday of the week containing d. */
export function mondayOf(d: Date): Date {
  const copy = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const day = (copy.getDay() + 6) % 7; // Mon=0..Sun=6
  copy.setDate(copy.getDate() - day);
  return copy;
}

export function addDays(d: Date, n: number): Date {
  const copy = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  copy.setDate(copy.getDate() + n);
  return copy;
}

export function weekDates(monday: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DAYS_LONG = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];
const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export function dayShort(d: Date): string {
  return DAYS[(d.getDay() + 6) % 7];
}
export function dayLong(d: Date): string {
  return DAYS_LONG[(d.getDay() + 6) % 7];
}
export function monthShort(d: Date): string {
  return MONTHS[d.getMonth()];
}
export function formatPretty(d: Date): string {
  return `${MONTHS[d.getMonth()]} ${d.getDate()}`;
}
export function formatRange(monday: Date): string {
  const sun = addDays(monday, 6);
  if (monday.getMonth() === sun.getMonth()) {
    return `${monthShort(monday)} ${monday.getDate()} – ${sun.getDate()}`;
  }
  return `${formatPretty(monday)} – ${formatPretty(sun)}`;
}

export function greeting(): string {
  const h = new Date().getHours();
  if (h < 5) return "Still awake";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

/** Consecutive days with an entry, ending today or yesterday. */
export function streak(dates: Set<string>): number {
  let count = 0;
  let cursor = new Date();
  const t = todayISO();
  const y = toISODate(addDays(new Date(), -1));
  if (!dates.has(t) && !dates.has(y)) return 0;
  if (!dates.has(t)) cursor = addDays(cursor, -1);
  while (dates.has(toISODate(cursor))) {
    count += 1;
    cursor = addDays(cursor, -1);
  }
  return count;
}
