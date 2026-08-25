import raw from "./content.json";

// ---------- Content model (parsed from the EPUB) ----------

export type Block =
  | { type: "heading"; level: number; text: string }
  | { type: "para"; text: string }
  | { type: "quote"; text: string }
  | { type: "list"; ordered: boolean; items: string[] }
  | { type: "checklist"; ordered: boolean; items: string[] }
  | { type: "card"; variant: string; label: string; text: string }
  | { type: "image"; src: string; alt: string }
  | { type: "table"; rows: string[][] }
  | { type: "subsection"; id: string; title: string; blocks: Block[] };

export type SectionKind =
  | "general"
  | "patterns"
  | "safety"
  | "is-this-you"
  | "do-now"
  | "fix48"
  | "week7"
  | "reset30"
  | "doctor"
  | "science"
  | "troubleshooting";

export interface Section {
  kind: SectionKind;
  title: string;
  anchor?: string;
  blocks: Block[];
}

export interface Chapter {
  file: string;
  number: number;
  slug: string;
  tagline: string;
  icon: string;
  title: string;
  fullTitle: string;
  sections: Section[];
}

export const chapters = (raw as { chapters: Chapter[] }).chapters;

/** The 12 symptom chapters + the HRT chapter (the book's core). */
export const SYMPTOM_CHAPTERS = chapters.filter((c) => c.number <= 13);

/** Protocol Stacking guide. */
export const STACKING_CHAPTER = chapters.find((c) => c.slug === "stacking");

/** The 5 appendices (lab cheat sheet, supplement matrix, label guide, sources, doctor scripts). */
export const APPENDICES = chapters.filter((c) => c.number >= 15);

export function getChapter(slug: string): Chapter | undefined {
  return chapters.find((c) => c.slug === slug);
}

export function getSections(chapter: Chapter, kind: SectionKind): Section[] {
  return chapter.sections.filter((s) => s.kind === kind);
}

export function firstImage(chapter: Chapter): string | null {
  for (const s of chapter.sections) {
    for (const b of s.blocks) {
      if (b.type === "image") return b.src;
    }
  }
  return null;
}

/** Pull the quoted "say this" scripts out of a chapter's doctor section. */
export function doctorScripts(chapter: Chapter): string[] {
  const scripts: string[] = [];
  const push = (text: string) => {
    const cleaned = text.replace(/\*\*/g, "");
    const matches = cleaned.match(/“[^”]{15,400}”/g);
    if (matches) scripts.push(...matches);
  };
  for (const s of getSections(chapter, "doctor")) {
    // Prefer blockquotes — the book puts the exact scripts there
    for (const b of s.blocks) {
      if (b.type === "quote") push(b.text);
    }
    // Fallback: quoted sentences inside paragraphs/cards
    if (!scripts.length) {
      for (const b of s.blocks) {
        if (b.type === "para" || b.type === "card") push(b.text);
      }
    }
  }
  return scripts.slice(0, 3);
}

// ---------- Lab test groups (from the Companion Tracker PDF) ----------

export const LAB_GROUPS: { group: string; tests: string[] }[] = [
  { group: "Thyroid", tests: ["TSH", "Free T4", "TPO antibodies"] },
  { group: "Blood & Iron", tests: ["CBC", "Ferritin and iron studies"] },
  {
    group: "Nutrients",
    tests: ["Vitamin B12 and folate", "Vitamin D (25-OH)"],
  },
  { group: "Metabolic", tests: ["HbA1c or fasting glucose"] },
  {
    group: "Hormones",
    tests: ["FSH", "Estradiol", "Androgen testing (testosterone / DHEA-S)"],
  },
  {
    group: "Other / Inflammatory",
    tests: ["Pregnancy test", "CRP / ESR / RF / anti-CCP / ANA"],
  },
];
