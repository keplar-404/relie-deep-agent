import type { ThinkingRow } from "@/components/ThinkingState";
import type { TableRow } from "@/components/FilterTable";
import type { TaskRow } from "@/components/TaskRows";
import type { StreamingToken, StreamingSource } from "@/components/StreamingText";

export { TOOL_STEPS, TOOL_DIFFS, CODE_LINES } from "./flowToolsData";

export const PLAN_ROWS: ThinkingRow[] = [
  { primary: "Reading project structure and config" },
  { primary: "Profiling endpoint response times", secondary: "8 routes" },
  { primary: "Identifying slow queries and bottlenecks" },
  { primary: "Drafting optimized handler logic" },
];

export const SEARCH_ROWS: ThinkingRow[] = [
  { primary: "Node.js caching best practices", secondary: "nodejs.org", href: "https://nodejs.org/en/docs" },
  { primary: "Database query optimisation", secondary: "planetscale.com", href: "https://planetscale.com/blog" },
  { primary: "HTTP response compression", secondary: "web.dev", href: "https://web.dev/performance" },
];

export const METRICS_ROWS: TableRow[] = [
  { task: "GET /api/products", date: "Sep 28", status: "todo", owner: "1840 ms" },
  { task: "POST /api/orders", date: "Sep 28", status: "progress", owner: "620 ms" },
  { task: "GET /api/users/me", date: "Sep 25", status: "done", owner: "48 ms" },
  { task: "GET /api/analytics", date: "Sep 20", status: "progress", owner: "3200 ms" },
  { task: "GET /api/search", date: "Sep 18", status: "todo", owner: "890 ms" },
];

export const TASK_DEMO_ROWS: TaskRow[] = [
  {
    key: "cache",
    label: "Redis cache layer added",
    amount: "3 routes",
    status: "done",
    details: [
      { label: "Cache hit rate", meta: "94 %" },
      { label: "Average TTL", meta: "60 s" },
    ],
  },
  {
    key: "perf",
    label: "Response time improvements",
    amount: "8 endpoints",
    status: "done",
    details: [
      { label: "/api/products p95", meta: "1840 → 94 ms" },
      { label: "/api/analytics p95", meta: "3200 → 210 ms" },
    ],
  },
  {
    key: "ci",
    label: "Benchmark suite passing",
    amount: "0 regressions",
    status: "done",
    details: [
      { label: "Routes tested", meta: "8 / 8" },
      { label: "Threshold breaches", meta: "0" },
    ],
  },
];

export const STREAM_TOKENS: StreamingToken[] = [
  ..."Your API performance has been significantly improved."
    .split(" ")
    .map((text) => ({ text })),
  { text: "", cite: true },
  ..."The products endpoint dropped from 1840 ms to 94 ms with Redis caching. All 8 routes now pass the 500 ms p95 threshold."
    .split(" ")
    .map((text) => ({ text })),
];

export const STREAM_SOURCES: StreamingSource[] = [
  {
    name: "Node.js Docs",
    domain: "nodejs.org",
    href: "https://nodejs.org/en/docs",
    image:
      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='16' fill='%23339933'/%3E%3Ctext x='32' y='44' text-anchor='middle' font-size='28' font-family='monospace' fill='white'%3E%7B%7D%3C/text%3E%3C/svg%3E",
  },
  {
    name: "Web Performance",
    domain: "web.dev",
    href: "https://web.dev/performance",
    image:
      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='16' fill='%231a73e8'/%3E%3Cpolygon points='32,14 48,46 16,46' fill='%23fff'/%3E%3C/svg%3E",
  },
];

export const FOLLOW_UPS = [
  "Run a full load test at 1 000 concurrent users",
  "Add cache invalidation on order creation",
  "Profile the /api/search endpoint next",
];
