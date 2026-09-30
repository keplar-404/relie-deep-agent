"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { Icon } from "./icons";
import { MODELS, type Model } from "./types";

interface ModelMenuProps {
  model: Model;
  left: number;
  bottom: number;
  onSelect: (model: Model) => void;
  models?: Model[];
}

export function ModelMenu({ model, left, bottom, onSelect, models = MODELS }: ModelMenuProps) {
  const [modelBox, setModelBox] = useState<{ top: number; height: number } | null>(null);
  const [hovered, setHovered] = useState<number | null>(null);
  const rowRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const selectedIndex = models.findIndex((m) => m.key === model.key);

  useLayoutEffect(() => {
    const target = rowRefs.current[hovered ?? selectedIndex];
    if (target) {
      setModelBox({ top: target.offsetTop, height: target.offsetHeight });
    }
  }, [hovered, selectedIndex]);

  return (
    <div
      onMouseLeave={() => setHovered(null)}
      className="absolute z-20 w-48 rounded-xl border border-border/80 bg-popover/95 backdrop-blur-md p-1.5 shadow-xl"
      style={{
        left,
        bottom,
        animation: "pop-in 180ms cubic-bezier(0.23,1,0.32,1) both",
        transformOrigin: "bottom left",
      }}
    >
      {/* Gliding highlight */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-1.5 rounded-lg bg-accent/80"
        style={{
          top: modelBox?.top ?? 0,
          height: modelBox?.height ?? 0,
          opacity: modelBox && hovered !== null ? 1 : 0,
          transition:
            "top 200ms cubic-bezier(0.23,1,0.32,1), height 200ms cubic-bezier(0.23,1,0.32,1), opacity 150ms ease",
        }}
      />

      <div className="flex flex-col gap-0.5">
        {models.map((m, i) => (
          <button
            key={m.key}
            type="button"
            ref={(el) => {
              rowRefs.current[i] = el;
            }}
            onMouseDown={(e) => e.preventDefault()}
            onMouseEnter={() => setHovered(i)}
            onClick={() => onSelect(m)}
            className="relative z-10 flex h-8 w-full items-center gap-2 rounded-lg px-2.5 text-left cursor-pointer transition-colors"
          >
            <span className="min-w-0 flex-1 truncate text-xs font-medium text-foreground">
              {m.name}
            </span>
            <span className="shrink-0 text-[10px] text-muted-foreground/80 bg-muted/60 px-1.5 py-0.5 rounded-sm">
              {m.tag}
            </span>
            <span
              className={`shrink-0 text-foreground transition-opacity ${
                m.key === model.key ? "opacity-100" : "opacity-0"
              }`}
            >
              <Icon size={12} strokeWidth={2.5}>
                <path d="M20 6L9 17l-5-5" />
              </Icon>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
