"use client";

import { useState } from "react";

/* ─────────────────────────────────────────────────────────
 * FILTER TABLE
 * Status chips directly filter the task table.
 * ───────────────────────────────────────────────────────── */

export type Status = "todo" | "progress" | "done";

export type TableRow = { task: string; date: string; status: Status; owner: string };

export type FilterTableLabels = {
  columns: { task: string; date: string; status: string; owner: string };
};

const FILTER_KEYS: { key: "all" | Status; label: string; dot?: string }[] = [
  { key: "all", label: "All" },
  { key: "todo", label: "To do", dot: "#f59e0b" },
  { key: "progress", label: "In Progress", dot: "#0284c7" },
  { key: "done", label: "Completed", dot: "#10b981" },
];

const ROWS: TableRow[] = [
  { task: "Restock mango sorbet", date: "Dec 03", status: "todo", owner: "Mango Moon Gelato" },
  { task: "Churn black sesame", date: "Sep 22", status: "progress", owner: "Kumo Creamery" },
  { task: "Print summer menu", date: "Jan 02", status: "todo", owner: "Coral Coast Sorbet" },
  { task: "Taste-test batch 42", date: "Nov 08", status: "progress", owner: "Maple Orbit" },
  { task: "Order waffle cones", date: "Apr 14", status: "done", owner: "Aurora Scoops" },
];

const LABELS: FilterTableLabels = {
  columns: { task: "Task name", date: "Date", status: "Status", owner: "Advisor" },
};

const PILLS: Record<Status, { label: string; cls: string }> = {
  todo: {
    label: "To do",
    cls: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/25",
  },
  progress: {
    label: "In Progress",
    cls: "bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/25",
  },
  done: {
    label: "Completed",
    cls: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/25",
  },
};

export type FilterTableProps = {
  rows?: TableRow[];
  labels?: FilterTableLabels;
  variant?: string;
  /** Extra classes on the outer container. */
  className?: string;
  /** Fired when the active filter changes. */
  onFilter?: (key: "all" | Status) => void;
};

export function FilterTable({
  rows = ROWS,
  labels = LABELS,
  className,
  onFilter,
}: FilterTableProps = {}) {
  const [filter, setFilter] = useState<"all" | Status>("all");

  // Derive counts from the actual rows so they stay correct with custom data
  const filters = FILTER_KEYS.map((f) => ({
    ...f,
    count: f.key === "all" ? rows.length : rows.filter((r) => r.status === f.key).length,
  }));

  return (
    <div className={`w-full${className ? ` ${className}` : ""}`}>
      {/* filter chips */}
      <div
        className="-mx-1 mb-1 flex items-center gap-1 overflow-x-auto px-1 py-1"
        style={{ scrollbarWidth: "none" }}
      >
        {filters.map((f) => {
          const active = filter === f.key;
          return (
            <button
              key={f.key}
              type="button"
              aria-pressed={active}
              onClick={() => { setFilter(f.key); onFilter?.(f.key); }}
              className={`flex h-[26px] shrink-0 items-center gap-1.5 rounded-full px-2.5 text-[12px]
                font-medium transition-[background-color,box-shadow,color] duration-200
                ${
                  active
                    ? "border border-border bg-card text-foreground shadow-xs"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                }`}
            >
              {f.dot && <span className="size-1.5 rounded-full" style={{ background: f.dot }} />}
              {f.label}
              <span
                className={`rounded-[4px] px-1 text-[10.5px] tabular-nums
                  ${active ? "bg-secondary text-muted-foreground" : "text-muted-foreground/70"}`}
              >
                {f.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* table */}
      <div
        aria-label="Scrollable task table"
        className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm"
        role="region"
        tabIndex={0}
        style={{ scrollbarWidth: "none" }}
      >
        <div className="min-w-0 w-full overflow-x-auto" style={{ scrollbarWidth: "none" }}>
          <div className="grid grid-cols-[minmax(0,1.3fr)_minmax(0,0.6fr)_minmax(0,0.95fr)_minmax(0,0.9fr)] border-b border-border/80 text-[12.5px] font-medium text-muted-foreground">
            <span className="border-r border-border/80 px-3 py-2">{labels.columns.task}</span>
            <span className="border-r border-border/80 px-3 py-2">{labels.columns.date}</span>
            <span className="border-r border-border/80 px-3 py-2">{labels.columns.status}</span>
            <span className="px-3 py-2">{labels.columns.owner}</span>
          </div>
          {rows.map((row) => {
            const shown = filter === "all" || row.status === filter;
            const pill = PILLS[row.status];
            return (
              <div
                key={row.task}
                className="grid transition-[grid-template-rows,opacity] duration-300"
                style={{
                  gridTemplateRows: shown ? "1fr" : "0fr",
                  opacity: shown ? 1 : 0,
                  transitionTimingFunction: "cubic-bezier(0.23, 1, 0.32, 1)",
                }}
              >
                <div className="overflow-hidden">
                  <div
                    className="grid grid-cols-[minmax(0,1.3fr)_minmax(0,0.6fr)_minmax(0,0.95fr)_minmax(0,0.9fr)] border-b
                      border-border/80 text-[13px] transition-colors duration-100 hover:bg-accent/50"
                  >
                    <span className="flex min-w-0 items-center border-r border-border/80 px-3 py-2">
                      <span className="truncate font-medium text-foreground">{row.task}</span>
                    </span>
                    <span className="flex items-center whitespace-nowrap border-r border-border/80 px-3 py-2 text-muted-foreground tabular-nums">
                      {row.date}
                    </span>
                    <span className="flex items-center border-r border-border/80 px-3 py-2">
                      <span
                        className={`inline-flex h-[23px] shrink-0 items-center whitespace-nowrap rounded-[8px] border px-[7px]
                          text-[13px] font-medium ${pill.cls}`}
                      >
                        {pill.label}
                      </span>
                    </span>
                    <span className="flex min-w-0 items-center px-3 py-2 text-muted-foreground">
                      <span className="truncate">{row.owner}</span>
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default FilterTable;
