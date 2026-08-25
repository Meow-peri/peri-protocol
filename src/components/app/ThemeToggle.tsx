"use client";

import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Theme toggle that renders both icons and lets CSS (.dark) pick which shows —
 * avoids hydration mismatches entirely.
 */
export function ThemeToggle({ className }: { className?: string }) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className={className}
      aria-label="Toggle color theme"
      title="Toggle color theme"
      onClick={() => {
        const isDark = document.documentElement.classList.contains("dark");
        document.documentElement.classList.toggle("dark", !isDark);
        try {
          localStorage.setItem("theme", isDark ? "light" : "dark");
        } catch {
          /* ignore */
        }
      }}
    >
      <Sun className="hidden h-5 w-5 dark:block" aria-hidden />
      <Moon className="block h-5 w-5 dark:hidden" aria-hidden />
    </Button>
  );
}
