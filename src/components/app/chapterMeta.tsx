"use client";

import {
  Moon,
  Flame,
  Scale,
  Brain,
  Sparkles,
  Bone,
  BatteryLow,
  HeartPulse,
  Heart,
  Droplets,
  Sun,
  Wind,
  Pill,
  Layers,
  FlaskConical,
  ShieldAlert,
  Tag,
  BookOpen,
  MessagesSquare,
  type LucideIcon,
} from "lucide-react";

export interface ChapterStyle {
  icon: LucideIcon;
  /** soft chip background + readable text */
  chip: string;
  /** icon tile colors */
  tile: string;
  /** accent text */
  text: string;
  /** gradient bar */
  bar: string;
}

const STYLES: Record<string, ChapterStyle> = {
  "wake-up": {
    icon: Moon,
    chip: "bg-purple-100/80 text-purple-900 dark:bg-purple-950/60 dark:text-purple-200",
    tile: "bg-purple-600 text-white",
    text: "text-purple-700 dark:text-purple-300",
    bar: "from-purple-500 to-purple-700",
  },
  rage: {
    icon: Flame,
    chip: "bg-rose-100/80 text-rose-900 dark:bg-rose-950/60 dark:text-rose-200",
    tile: "bg-rose-600 text-white",
    text: "text-rose-700 dark:text-rose-300",
    bar: "from-rose-500 to-rose-700",
  },
  belly: {
    icon: Scale,
    chip: "bg-amber-100/80 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200",
    tile: "bg-amber-600 text-white",
    text: "text-amber-700 dark:text-amber-300",
    bar: "from-amber-500 to-amber-600",
  },
  "brain-fog": {
    icon: Brain,
    chip: "bg-stone-200/80 text-stone-800 dark:bg-stone-800/80 dark:text-stone-200",
    tile: "bg-stone-600 text-white",
    text: "text-stone-600 dark:text-stone-300",
    bar: "from-stone-400 to-stone-600",
  },
  "hair-loss": {
    icon: Sparkles,
    chip: "bg-emerald-100/80 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-200",
    tile: "bg-emerald-600 text-white",
    text: "text-emerald-700 dark:text-emerald-300",
    bar: "from-emerald-500 to-emerald-700",
  },
  joints: {
    icon: Bone,
    chip: "bg-orange-100/80 text-orange-900 dark:bg-orange-950/60 dark:text-orange-200",
    tile: "bg-orange-600 text-white",
    text: "text-orange-700 dark:text-orange-300",
    bar: "from-orange-500 to-orange-600",
  },
  fatigue: {
    icon: BatteryLow,
    chip: "bg-yellow-100/80 text-yellow-900 dark:bg-yellow-950/60 dark:text-yellow-200",
    tile: "bg-yellow-600 text-white",
    text: "text-yellow-700 dark:text-yellow-300",
    bar: "from-yellow-500 to-yellow-600",
  },
  palpitations: {
    icon: HeartPulse,
    chip: "bg-red-100/80 text-red-900 dark:bg-red-950/60 dark:text-red-200",
    tile: "bg-red-600 text-white",
    text: "text-red-700 dark:text-red-300",
    bar: "from-red-500 to-red-700",
  },
  libido: {
    icon: Heart,
    chip: "bg-pink-100/80 text-pink-900 dark:bg-pink-950/60 dark:text-pink-200",
    tile: "bg-pink-600 text-white",
    text: "text-pink-700 dark:text-pink-300",
    bar: "from-pink-500 to-pink-600",
  },
  periods: {
    icon: Droplets,
    chip: "bg-fuchsia-100/80 text-fuchsia-900 dark:bg-fuchsia-950/60 dark:text-fuchsia-200",
    tile: "bg-fuchsia-700 text-white",
    text: "text-fuchsia-700 dark:text-fuchsia-300",
    bar: "from-fuchsia-500 to-fuchsia-700",
  },
  "acne-skin": {
    icon: Sun,
    chip: "bg-orange-100/80 text-orange-900 dark:bg-orange-950/60 dark:text-orange-200",
    tile: "bg-orange-500 text-white",
    text: "text-orange-600 dark:text-orange-300",
    bar: "from-orange-400 to-orange-500",
  },
  bloating: {
    icon: Wind,
    chip: "bg-lime-100/80 text-lime-900 dark:bg-lime-950/60 dark:text-lime-200",
    tile: "bg-lime-700 text-white",
    text: "text-lime-700 dark:text-lime-300",
    bar: "from-lime-500 to-lime-700",
  },
  hrt: {
    icon: Pill,
    chip: "bg-purple-100/80 text-purple-900 dark:bg-purple-950/60 dark:text-purple-200",
    tile: "bg-purple-700 text-white",
    text: "text-purple-700 dark:text-purple-300",
    bar: "from-purple-600 to-purple-800",
  },
  stacking: {
    icon: Layers,
    chip: "bg-emerald-100/80 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-200",
    tile: "bg-emerald-700 text-white",
    text: "text-emerald-700 dark:text-emerald-300",
    bar: "from-emerald-600 to-emerald-800",
  },
  "lab-cheatsheet": {
    icon: FlaskConical,
    chip: "bg-teal-100/80 text-teal-900 dark:bg-teal-950/60 dark:text-teal-200",
    tile: "bg-teal-700 text-white",
    text: "text-teal-700 dark:text-teal-300",
    bar: "from-teal-500 to-teal-700",
  },
  "supplement-matrix": {
    icon: ShieldAlert,
    chip: "bg-red-100/80 text-red-900 dark:bg-red-950/60 dark:text-red-200",
    tile: "bg-red-700 text-white",
    text: "text-red-700 dark:text-red-300",
    bar: "from-red-600 to-red-800",
  },
  "supplement-label": {
    icon: Tag,
    chip: "bg-amber-100/80 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200",
    tile: "bg-amber-700 text-white",
    text: "text-amber-700 dark:text-amber-300",
    bar: "from-amber-600 to-amber-700",
  },
  "source-stack": {
    icon: BookOpen,
    chip: "bg-stone-200/80 text-stone-800 dark:bg-stone-800/80 dark:text-stone-200",
    tile: "bg-stone-700 text-white",
    text: "text-stone-700 dark:text-stone-300",
    bar: "from-stone-500 to-stone-700",
  },
  "doctor-scripts": {
    icon: MessagesSquare,
    chip: "bg-rose-100/80 text-rose-900 dark:bg-rose-950/60 dark:text-rose-200",
    tile: "bg-rose-700 text-white",
    text: "text-rose-700 dark:text-rose-300",
    bar: "from-rose-600 to-rose-800",
  },
};

export function chapterStyle(slug: string): ChapterStyle {
  return (
    STYLES[slug] ?? {
      icon: Sparkles,
      chip: "bg-muted text-foreground",
      tile: "bg-primary text-primary-foreground",
      text: "text-primary",
      bar: "from-primary to-primary/70",
    }
  );
}
