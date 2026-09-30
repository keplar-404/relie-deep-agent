"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ImageLightbox } from "@/components/primitives/ImageLightbox";

/* ─────────────────────────────────────────────────────────
 * TOOL CHIPS
 * An agent run as compact rows: tool calls with inline
 * chips, then file-diff chips summarizing the edits.
 * Hover a row to reveal its chevron; every row expands
 * to show what the tool actually did.
 * ───────────────────────────────────────────────────────── */

const STEP_MS = 700;

const Icons: Record<string, React.ReactNode> = {
  think: <path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8z" />,
  write: (
    <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 3a2.8 2.8 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5z" />
    </g>
  ),
  run: (
    <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 17l6-5-6-5M12 19h8" />
    </g>
  ),
  read: (
    <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
    </g>
  ),
};

export type ToolDetailLine = { text: string; tone?: "add" };

export type ToolStep = {
  icon: string;
  label: string;
  chip: string;
  mono: boolean;
  detailMono: boolean;
  detail: ToolDetailLine[];
  /** Optional images shown as 60×60 thumbnails in the expanded detail. Click to open lightbox. */
  images?: string[];
};

export type ToolDiff = { file: string; add: number; del: number };

export type ToolDiffLine = { text: string; tone: "add" | "del" | "ctx" };

export type ToolChipsLabels = {
  header: string;
  more: string;
};

const DEFAULT_LABELS: ToolChipsLabels = {
  header: "4 tool calls, 2 messages",
  more: "+2 more",
};

const ROWS: ToolStep[] = [
  {
    icon: "think",
    label: "Thinking",
    chip: "Planning the churn schedule…",
    mono: false,
    detailMono: false,
    detail: [
      { text: "Weekend demand carries pistachio, so it churns first." },
      { text: "Batch capacity leaves two evening freezer windows." },
    ],
  },
  {
    icon: "write",
    label: "Write 204 lines",
    chip: "ChurnSchedule.tsx",
    mono: true,
    detailMono: true,
    detail: [
      { text: "+ const windows = slots.filter((s) => s.temp <= -12)", tone: "add" },
      { text: '+ return schedule(windows, { hero: "pistachio" })', tone: "add" },
    ],
  },
  {
    icon: "run",
    label: "Rebuild and verify",
    chip: "npm run freeze",
    mono: true,
    detailMono: true,
    detail: [{ text: "✓ built in 1.2s" }, { text: "✓ 34 checks passed" }],
  },
  {
    icon: "read",
    label: "Read image",
    chip: "flavor-chart.png",
    mono: true,
    detailMono: false,
    detail: [
      { text: "1280 × 720 · line chart, three summers." },
      { text: "Mint chip trends up 12% through July." },
    ],
  },
];

const DIFFS: ToolDiff[] = [
  { file: "flavors.css", add: 13, del: 0 },
  { file: "ChurnSchedule.tsx", add: 74, del: 41 },
  { file: "menu.ts", add: 8, del: 2 },
];

/* hovering a file chip opens its diff — green added, red removed */
const DIFF_LINES: Record<string, ToolDiffLine[]> = {
  "flavors.css": [
    { text: ".scoop-card {", tone: "ctx" },
    { text: "  gap: 14px;", tone: "del" },
    { text: "  gap: 12px;", tone: "add" },
    { text: "  container-type: inline-size;", tone: "add" },
    { text: "}", tone: "ctx" },
  ],
  "ChurnSchedule.tsx": [
    { text: "const slots = coldSlots(week);", tone: "ctx" },
    { text: "const windows = slots;", tone: "del" },
    { text: "const windows = slots.filter(", tone: "add" },
    { text: "  (s) => s.temp <= -12,", tone: "add" },
    { text: ");", tone: "add" },
  ],
  "menu.ts": [
    { text: 'export const hero = "mint-chip";', tone: "del" },
    { text: 'export const hero = "pistachio";', tone: "add" },
  ],
};

export function ToolChips({
  steps = ROWS,
  diffs = DIFFS,
  diffLines = DIFF_LINES,
  labels,
  className,
  onOpenChange,
  onToggleRow,
}: {
  /** Accepted for gallery/registry parity; ToolChips has no visual variants. */
  variant?: string;
  steps?: ToolStep[];
  diffs?: ToolDiff[];
  diffLines?: Record<string, ToolDiffLine[]>;
  labels?: Partial<ToolChipsLabels>;
  className?: string;
  onOpenChange?: (open: boolean) => void;
  onToggleRow?: (label: string, open: boolean) => void;
} = {}) {
  const copy = { ...DEFAULT_LABELS, ...labels };
  const [step, setStep] = useState(0);
  const [open, setOpen] = useState(true);
  const [openRows, setOpenRows] = useState<Set<string>>(new Set());
  const [showAllDiffs, setShowAllDiffs] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState<{ src: string; name: string } | null>(null);
  /* Rendered in a body portal so animated/translated reply wrappers cannot
   * redefine the fixed-position coordinate system. */
  const [preview, setPreview] = useState<{
    file: string;
    x: number;
    top?: number;
    bottom?: number;
  } | null>(null);

  const openPreview = (file: string) => (event: React.SyntheticEvent) => {
    const rect = (event.currentTarget as Element)
      .closest("[data-diffchip]")!
      .getBoundingClientRect();
    const previewHeight = 38 + (diffLines[file]?.length ?? 0) * 19;
    const fitsBelow = rect.bottom + 6 + previewHeight <= window.innerHeight - 12;
    setPreview({
      file,
      x: Math.max(12, Math.min(rect.left, window.innerWidth - 300)),
      ...(fitsBelow
        ? { top: rect.bottom + 6 }
        : { bottom: window.innerHeight - rect.top + 6 }),
    });
  };

  const closePreview = (file: string) => () =>
    setPreview((current) => (current?.file === file ? null : current));

  const total = steps.length + 1; // rows, then diff chips

  useEffect(() => {
    if (step >= total) return;
    const t = setTimeout(() => setStep((s) => s + 1), STEP_MS);
    return () => clearTimeout(t);
  }, [step, total]);

  const toggleRow = (label: string) =>
    setOpenRows((current) => {
      const next = new Set(current);
      if (next.has(label)) {
        next.delete(label);
      } else {
        next.add(label);
      }
      onToggleRow?.(label, next.has(label));
      return next;
    });

  return (
    <div className={`min-h-[220px] w-full max-w-80 pb-1${className ? ` ${className}` : ""}`}>
      {/* collapsed run header */}
      <button
        type="button"
        aria-expanded={open}
        onClick={() =>
          setOpen((current) => {
            onOpenChange?.(!current);
            return !current;
          })
        }
        className="-mx-1.5 flex w-fit items-center gap-1.5 rounded-md px-1.5 py-1 text-[12.5px] text-muted-foreground transition-colors duration-100 hover:bg-accent cursor-pointer"
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="transition-transform duration-200"
          style={{ transform: open ? "rotate(0deg)" : "rotate(-90deg)" }}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
        <span className="tabular-nums">{copy.header}</span>
      </button>

      {/* tool call rows */}
      <div
        className="grid transition-[grid-template-rows,opacity] duration-300"
        style={{ gridTemplateRows: open ? "1fr" : "0fr", opacity: open ? 1 : 0 }}
      >
        {/* -mx-1 + px-1.5 keeps content at the same x while giving the
            row hover pills room inside this overflow-hidden clip box */}
        <div className="-mx-1 overflow-hidden px-1.5 pb-1">
          <div className="mt-1.5 flex flex-col gap-1">
            {steps.slice(0, step).map((row) => {
              const rowOpen = openRows.has(row.label);
              return (
                <div
                  key={row.label}
                  style={{ animation: "fade-up 300ms cubic-bezier(0.23,1,0.32,1) both" }}
                >
                  <button
                    type="button"
                    aria-expanded={rowOpen}
                    onClick={() => toggleRow(row.label)}
                    className="group/row -mx-[3px] flex h-7 w-[calc(100%+6px)] min-w-0 items-center gap-2 rounded-md px-[3px] text-left transition-colors duration-100 hover:bg-accent cursor-pointer"
                  >
                    <span className="relative flex size-4 shrink-0 items-center justify-center text-muted-foreground">
                      <svg
                        width="13"
                        height="13"
                        viewBox="0 0 24 24"
                        fill={row.icon === "think" ? "currentColor" : "none"}
                        stroke="currentColor"
                        className={`transition-opacity duration-100 group-hover/row:opacity-0 ${
                          rowOpen ? "opacity-0" : ""
                        }`}
                      >
                        {Icons[row.icon]}
                      </svg>
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className={`absolute transition-[opacity,transform] duration-150 group-hover/row:opacity-100 ${
                          rowOpen ? "opacity-100" : "opacity-0"
                        }`}
                        style={{ transform: rowOpen ? "rotate(0deg)" : "rotate(-90deg)" }}
                      >
                        <path d="M6 9l6 6 6-6" />
                      </svg>
                    </span>
                    <span className="shrink-0 text-[12.5px] font-medium text-foreground">
                      {row.label}
                    </span>
                    <span
                      className={`inline-flex h-5.5 min-w-0 flex-1 cursor-pointer items-center truncate rounded-md border border-border bg-secondary/70 px-1.5
                        text-[11.5px] text-muted-foreground shadow-xs transition-colors duration-100 hover:bg-accent
                        ${row.mono ? "font-mono" : ""}`}
                    >
                      {row.chip}
                    </span>
                  </button>

                  {/* expanded detail */}
                  <div
                    className="grid transition-[grid-template-rows,opacity] duration-300"
                    style={{
                      gridTemplateRows: rowOpen ? "1fr" : "0fr",
                      opacity: rowOpen ? 1 : 0,
                      transitionTimingFunction: "cubic-bezier(0.23, 1, 0.32, 1)",
                    }}
                  >
                    <div className="min-h-0 overflow-hidden">
                      <div className="mt-0.5 mb-1 ml-2 flex flex-col gap-0.5 border-l border-border py-0.5 pl-3.5">
                        {/* image thumbnails */}
                        {((row.images?.length ?? 0) > 0 || /\.(png|jpg|jpeg|gif|webp)$/i.test(row.chip)) && (
                          <div className="mb-2 flex flex-wrap gap-1.5">
                            {(row.images ?? ["/placeholder-chart.svg"]).map((src, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => setLightboxSrc({ src, name: row.images ? `image-${idx + 1}` : row.chip })}
                                className="size-[60px] shrink-0 overflow-hidden rounded-lg border border-border/60 bg-muted/40 cursor-pointer transition-all hover:scale-105 hover:shadow-md hover:border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                                aria-label={`View ${row.chip} image ${idx + 1}`}
                              >
                                {src.startsWith("data:") || src.startsWith("http") || src.startsWith("/") ? (
                                  <img src={src} alt={row.chip} className="size-full object-cover" />
                                ) : (
                                  <svg viewBox="0 0 60 60" className="size-full">
                                    <polyline points="5,50 18,28 30,35 42,12 54,20" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" />
                                    <line x1="5" y1="55" x2="55" y2="55" stroke="var(--border)" strokeWidth="1" />
                                  </svg>
                                )}
                              </button>
                            ))}
                          </div>
                        )}
                        {row.detail.map((line, idx) => (
                          <span
                            key={idx}
                            className={`truncate text-[11.5px] leading-[1.6] ${
                              row.detailMono ? "font-mono" : ""
                            } ${line.tone === "add" ? "text-emerald-500" : "text-muted-foreground"}`}
                          >
                            {line.text}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* file-diff chips */}
          {step >= total && (() => {
            const visible = showAllDiffs ? diffs : diffs.slice(0, 1);
            const hiddenCount = diffs.length - visible.length;
            return (
              <div className="mt-2.5 flex max-w-full flex-wrap gap-1.5 border-t border-border pt-2.5">
                {visible.map((d, i) => (
                  <span
                    key={d.file}
                    data-diffchip
                    className="relative"
                    onMouseEnter={openPreview(d.file)}
                    onMouseLeave={closePreview(d.file)}
                  >
                    <button
                      type="button"
                      aria-expanded={preview?.file === d.file}
                      aria-label={`Show diff for ${d.file}`}
                      onFocus={openPreview(d.file)}
                      onBlur={closePreview(d.file)}
                      className="inline-flex h-7 max-w-full items-center gap-2 rounded-md border border-border
                        bg-card px-2 font-mono text-[11.5px] text-foreground shadow-xs
                        transition-colors duration-100 hover:bg-muted cursor-pointer"
                      style={{ animation: `pop-in 250ms cubic-bezier(0.23,1,0.32,1) ${i * 80}ms both` }}
                    >
                      <span className="min-w-0 truncate">{d.file}</span>
                      <span className="shrink-0 text-emerald-500 tabular-nums">+{d.add}</span>
                      {d.del > 0 && <span className="shrink-0 text-destructive tabular-nums">−{d.del}</span>}
                    </button>
                  </span>
                ))}
                {hiddenCount > 0 ? (
                  <button
                    type="button"
                    onClick={() => setShowAllDiffs(true)}
                    className="inline-flex h-7 items-center rounded-md border border-dashed border-border px-2 font-mono text-[11.5px] text-muted-foreground transition-colors hover:border-border hover:bg-muted hover:text-foreground cursor-pointer"
                    style={{ animation: `fade-in 300ms ease-out ${visible.length * 80}ms both` }}
                  >
                    +{hiddenCount} more
                  </button>
                ) : diffs.length > 1 ? (
                  <button
                    type="button"
                    onClick={() => setShowAllDiffs(false)}
                    className="inline-flex h-7 items-center rounded-md px-1.5 font-mono text-[11.5px] text-muted-foreground/70 transition-colors hover:text-foreground cursor-pointer"
                  >
                    show less
                  </button>
                ) : null}
              </div>
            );
          })()}
        </div>
      </div>

      {preview &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed z-50 w-72 overflow-hidden rounded-xl border border-border bg-card shadow-xl"
            style={{
              left: preview.x,
              top: preview.top,
              bottom: preview.bottom,
              animation: "pop-in 160ms cubic-bezier(0.23,1,0.32,1) both",
              transformOrigin: preview.top === undefined ? "bottom left" : "top left",
            }}
          >
            <div className="flex items-center justify-between border-b border-border px-2.5 py-1.5 font-mono text-[11px] bg-secondary/40">
              <span className="min-w-0 truncate text-muted-foreground">{preview.file}</span>
              <span className="shrink-0 tabular-nums">
                <span className="text-emerald-500">
                  +{diffs.find((diff) => diff.file === preview.file)?.add}
                </span>
                {(diffs.find((diff) => diff.file === preview.file)?.del ?? 0) > 0 && (
                  <span className="text-destructive">
                    {" "}
                    −{diffs.find((diff) => diff.file === preview.file)?.del}
                  </span>
                )}
              </span>
            </div>
            <div className="py-1 font-mono text-[11px] leading-[1.8]">
              {(diffLines[preview.file] ?? []).map((line, index) => (
                <div
                  key={index}
                  className={`flex gap-2 px-2.5 whitespace-pre ${
                    line.tone === "add"
                      ? "bg-emerald-500/10 text-emerald-500 dark:bg-emerald-500/15"
                      : line.tone === "del"
                        ? "bg-destructive/10 text-destructive dark:bg-destructive/15"
                        : "text-muted-foreground"
                  }`}
                >
                  <span className="w-3 shrink-0 select-none">
                    {line.tone === "add" ? "+" : line.tone === "del" ? "−" : " "}
                  </span>
                  <span className="min-w-0 truncate">{line.text}</span>
                </div>
              ))}
            </div>
          </div>,
          document.body,
        )}
      <ImageLightbox
        src={lightboxSrc?.src ?? null}
        name={lightboxSrc?.name}
        onClose={() => setLightboxSrc(null)}
      />
    </div>
  );
}

export default ToolChips;
