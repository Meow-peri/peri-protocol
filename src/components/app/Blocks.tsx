"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import type { Block } from "@/data/chapters";

// ---------- Inline markdown-lite (**bold**, *italic*, [[text|nav-target]]) ----------

export function InlineText({ text, className }: { text: string; className?: string }) {
  const parts = text.split(
    /(\*\*[^*]+\*\*|\*[^*]+\*|\[\[[^\]|]+\|[^\]]+\]\]|\n)/g
  );
  return (
    <span className={className}>
      {parts.map((p, i) => {
        if (p === "\n") return <br key={i} />;
        if (p.startsWith("**") && p.endsWith("**"))
          return (
            <strong key={i} className="font-semibold text-foreground">
              {p.slice(2, -2)}
            </strong>
          );
        if (p.startsWith("*") && p.endsWith("*"))
          return (
            <em key={i} className="italic">
              {p.slice(1, -1)}
            </em>
          );
        const nav = p.match(/^\[\[([^\]|]+)\|([^\]]+)\]\]$/);
        if (nav)
          return (
            <a
              key={i}
              href="#"
              className="navlink"
              data-nav={nav[2]}
              onClick={(e) => e.preventDefault()}
            >
              {nav[1]}
            </a>
          );
        return <span key={i}>{p}</span>;
      })}
    </span>
  );
}

// ---------- Interactive checklist with localStorage persistence ----------

function loadKey(key: string): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(`peri-check:${key}`) ?? "{}");
  } catch {
    return {};
  }
}

export function useChecklist(key: string) {
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  useEffect(() => {
    const reload = () => setChecked(loadKey(key));
    reload();
    window.addEventListener("peri-check-updated", reload);
    return () => window.removeEventListener("peri-check-updated", reload);
  }, [key]);
  const toggle = (item: string) => {
    setChecked((prev) => {
      const next = { ...prev, [item]: !prev[item] };
      try {
        localStorage.setItem(`peri-check:${key}`, JSON.stringify(next));
        window.dispatchEvent(new Event("peri-check-updated"));
      } catch {
        /* ignore */
      }
      return next;
    });
  };
  return { checked, toggle };
}

/** Merge the checked-state of several storage keys (read-only). */
export function useChecks(keys: string[]) {
  const [all, setAll] = useState<Record<string, boolean>>({});
  const id = keys.join("|");
  useEffect(() => {
    const list = id.split("|");
    const reload = () => {
      const merged: Record<string, boolean> = {};
      for (const k of list) Object.assign(merged, loadKey(k));
      setAll(merged);
    };
    reload();
    window.addEventListener("peri-check-updated", reload);
    return () => window.removeEventListener("peri-check-updated", reload);
  }, [id]);
  return all;
}

function CheckList({
  items,
  storageKey,
  tone = "default",
}: {
  items: string[];
  storageKey: string;
  tone?: "default" | "danger";
}) {
  const { checked, toggle } = useChecklist(storageKey);
  return (
    <ul className="my-3 space-y-2.5">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-3">
          <Checkbox
            id={`${storageKey}-${i}`}
            checked={!!checked[item]}
            onCheckedChange={() => toggle(item)}
            className={cn("mt-0.5", tone === "danger" && "data-[state=checked]:bg-destructive data-[state=checked]:border-destructive")}
            aria-label={item.replace(/\*/g, "")}
          />
          <label
            htmlFor={`${storageKey}-${i}`}
            className={cn(
              "text-sm leading-relaxed cursor-pointer",
              checked[item] ? "text-muted-foreground line-through decoration-muted-foreground/50" : "text-foreground/90"
            )}
          >
            <InlineText text={item} />
          </label>
        </li>
      ))}
    </ul>
  );
}

// ---------- Callout cards ----------

const CARD_STYLES: Record<string, { wrap: string; label: string }> = {
  caution: {
    wrap: "border-destructive/30 bg-destructive/5 rounded-xl p-4",
    label: "bg-destructive/10 text-destructive",
  },
  action: {
    wrap: "border-primary/25 bg-primary/5 rounded-xl p-4",
    label: "bg-primary/10 text-primary",
  },
  info: {
    wrap: "border-border bg-muted/60 rounded-xl p-4",
    label: "bg-foreground/5 text-foreground/70",
  },
  validation: {
    wrap: "border-emerald-600/25 bg-emerald-50/70 dark:bg-emerald-950/30 rounded-xl p-4",
    label: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  },
  science: {
    wrap: "border-purple-400/30 bg-purple-50/60 dark:bg-purple-950/30 rounded-xl p-4",
    label: "bg-purple-500/10 text-purple-700 dark:text-purple-400",
  },
};

function CardBlock({
  variant,
  label,
  text,
}: {
  variant: string;
  label: string;
  text: string;
}) {
  const style = CARD_STYLES[variant] ?? CARD_STYLES.info;
  return (
    <div className={cn("my-3 border", style.wrap)}>
      {label ? (
        <span
          className={cn(
            "inline-block mb-2 rounded-full px-2.5 py-0.5 text-[11px] font-bold tracking-widest uppercase",
            style.label
          )}
        >
          {label}
        </span>
      ) : null}
      <p className="text-sm leading-relaxed text-foreground/90">
        <InlineText text={text} />
      </p>
    </div>
  );
}

// ---------- Block renderer ----------

export function Blocks({
  blocks,
  storageKey,
  onImage,
}: {
  blocks: Block[];
  storageKey: string;
  onImage?: (src: string, alt: string) => void;
}) {
  return (
    <>
      {blocks.map((b, i) => (
        <BlockView key={i} block={b} index={i} storageKey={storageKey} onImage={onImage} />
      ))}
    </>
  );
}

function BlockView({
  block,
  index,
  storageKey,
  onImage,
}: {
  block: Block;
  index: number;
  storageKey: string;
  onImage?: (src: string, alt: string) => void;
}) {
  switch (block.type) {
    case "heading": {
      const Tag = block.level <= 3 ? "h4" : "h5";
      return (
        <Tag
          className={cn(
            "font-playfair scroll-mt-40 text-lg font-semibold text-foreground",
            block.level > 3 && "text-base"
          )}
        >
          <InlineText text={block.text} />
        </Tag>
      );
    }
    case "para":
      return (
        <p className="my-3 text-sm leading-relaxed text-foreground/90">
          <InlineText text={block.text} />
        </p>
      );
    case "quote":
      return (
        <blockquote className="my-3 border-l-2 border-primary/40 pl-4 text-sm italic leading-relaxed text-muted-foreground">
          <InlineText text={block.text} />
        </blockquote>
      );
    case "list":
      return block.ordered ? (
        <ol className="my-3 ml-5 list-decimal space-y-2">
          {block.items.map((it, i) => (
            <li key={i} className="text-sm leading-relaxed text-foreground/90">
              <InlineText text={it} />
            </li>
          ))}
        </ol>
      ) : (
        <ul className="my-3 ml-5 list-disc space-y-2">
          {block.items.map((it, i) => (
            <li key={i} className="text-sm leading-relaxed text-foreground/90">
              <InlineText text={it} />
            </li>
          ))}
        </ul>
      );
    case "checklist":
      return (
        <CheckList items={block.items} storageKey={`${storageKey}:${index}`} />
      );
    case "card":
      return <CardBlock variant={block.variant} label={block.label} text={block.text} />;
    case "image":
      return (
        <button
          type="button"
          onClick={() => onImage?.(block.src, block.alt)}
          className="my-4 block w-full overflow-hidden rounded-xl border border-border bg-muted/40"
          aria-label={block.alt || "Enlarge illustration"}
        >
          <img
            src={block.src}
            alt={block.alt}
            className="aspect-[3/2] w-full object-cover object-center"
            loading="lazy"
          />
        </button>
      );
    case "table":
      return (
        <div className="my-4 overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[32rem] text-sm">
            <tbody>
              {block.rows.map((row, r) => (
                <tr key={r} className={r === 0 ? "bg-muted/60 font-medium" : "border-t border-border"}>
                  {row.map((cell, c) => (
                    <td key={c} className="px-3 py-2 align-top text-foreground/90">
                      <InlineText text={cell} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case "subsection":
      return (
        <div
          id={block.id ? `a-${block.id}` : undefined}
          className="my-4 scroll-mt-32 rounded-xl border border-border bg-card/60 p-4"
        >
          {block.title ? (
            <h4 className="mb-1 font-playfair text-base font-semibold text-foreground">
              <InlineText text={block.title} />
            </h4>
          ) : null}
          <Blocks blocks={block.blocks} storageKey={`${storageKey}:s${index}`} onImage={onImage} />
        </div>
      );
    default:
      return null;
  }
}

export function SectionHeader({
  children,
  right,
}: {
  children: ReactNode;
  right?: ReactNode;
}) {
  return (
    <div className="mb-2 mt-8 flex items-center justify-between gap-3 first:mt-0">
      <h3 className="font-playfair text-xl font-bold tracking-tight text-foreground">
        {children}
      </h3>
      {right}
    </div>
  );
}
