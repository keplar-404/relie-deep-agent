"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { Icon, GLYPHS, BRANDS } from "./icons";
import { SOURCES, type Source, type Command } from "./types";

interface MentionMenuProps {
  menu: "at" | "slash";
  query: string;
  rows: (Source | Command)[];
  active: number;
  setActive: (idx: number) => void;
  onPick: (row: Source | Command) => void;
}

export function MentionMenu({
  menu,
  query,
  rows,
  active,
  setActive,
  onPick,
}: MentionMenuProps) {
  const [rowBox, setRowBox] = useState<{ top: number; height: number } | null>(null);
  const rowRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useLayoutEffect(() => {
    const target = rowRefs.current[active];
    if (target) {
      setRowBox({ top: target.offsetTop, height: target.offsetHeight });
      target.scrollIntoView({ block: "nearest" });
    }
  }, [active, rows.length]);

  return (
    <div
      className="absolute inset-x-0 bottom-full z-30 mb-2 rounded-xl border border-border bg-popover/95 backdrop-blur-md p-1.5 shadow-xl"
      style={{
        animation: "pop-in 180ms cubic-bezier(0.23,1,0.32,1) both",
        transformOrigin: "bottom center",
      }}
    >
      {/* Gliding highlight following active row */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-1.5 rounded-lg bg-accent"
        style={{
          top: rowBox?.top ?? 0,
          height: rowBox?.height ?? 0,
          opacity: rowBox && rows.length > 0 ? 1 : 0,
          transition:
            "top 180ms cubic-bezier(0.23,1,0.32,1), height 180ms cubic-bezier(0.23,1,0.32,1), opacity 150ms ease",
        }}
      />

      <div className="max-h-60 overflow-y-auto scrollbar-none flex flex-col gap-0.5">
        {rows.map((row, i) => {
          const source = menu === "at" ? SOURCES.find((s) => s.key === row.key) : undefined;
          return (
            <button
              key={row.key}
              type="button"
              ref={(el) => {
                rowRefs.current[i] = el;
              }}
              onMouseDown={(e) => e.preventDefault()}
              onMouseEnter={() => setActive(i)}
              onClick={() => onPick(row)}
              className="relative z-10 flex h-9 w-full items-center gap-2.5 rounded-lg px-2.5 text-left cursor-pointer transition-colors"
            >
              {source && (
                <span className="flex size-5 shrink-0 items-center justify-center text-muted-foreground">
                  {source.brand ? BRANDS[source.brand] : <Icon size={14}>{GLYPHS[source.glyph ?? "clip"]}</Icon>}
                </span>
              )}
              <span className="shrink-0 text-xs font-medium text-foreground">
                {row.name}
              </span>
              <span className="min-w-0 flex-1 truncate text-[11px] text-muted-foreground">
                {row.desc}
              </span>
            </button>
          );
        })}

        {rows.length === 0 && (
          <div className="flex h-9 items-center px-3 text-xs text-muted-foreground">
            No matches for “{query}”
          </div>
        )}
      </div>

      <div className="mt-1 border-t border-border/50 px-2.5 pt-1.5 pb-0.5 text-[10px] text-muted-foreground">
        {menu === "at" ? "Type to search project sources & files" : "Type to search slash commands"}
      </div>
    </div>
  );
}
