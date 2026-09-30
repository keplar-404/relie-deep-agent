import type { ToolStep, ToolDiff } from "@/components/ToolChips";

export const TOOL_STEPS: ToolStep[] = [
  {
    icon: "read",
    label: "Read route handler",
    chip: "api/products/route.ts",
    mono: true,
    detailMono: true,
    detail: [
      { text: "Missing cache headers, N+1 query on variants" },
      { text: "No pagination, returns all 4 200 rows" },
    ],
  },
  {
    icon: "read",
    label: "Read latency chart",
    chip: "profiler-output.png",
    mono: true,
    detailMono: false,
    images: [
      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 120'%3E%3Crect width='120' height='120' fill='%230f172a'/%3E%3Cpolyline points='10,100 30,80 50,85 70,40 90,55 110,20' fill='none' stroke='%2338bdf8' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'/%3E%3Cline x1='10' y1='108' x2='110' y2='108' stroke='%231e293b' stroke-width='1'/%3E%3Ctext x='10' y='15' font-size='10' fill='%2394a3b8' font-family='monospace'%3Ep95 ms%3C/text%3E%3C/svg%3E",
      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 120'%3E%3Crect width='120' height='120' fill='%230f172a'/%3E%3Ccircle cx='60' cy='65' r='38' fill='none' stroke='%231e293b' stroke-width='2'/%3E%3Cpath d='M60 65 L60 27 A38 38 0 1 1 22.7 84 Z' fill='%2338bdf8' opacity='.85'/%3E%3Cpath d='M60 65 L22.7 84 A38 38 0 0 1 60 27 Z' fill='%23818cf8' opacity='.85'/%3E%3Ctext x='10' y='15' font-size='10' fill='%2394a3b8' font-family='monospace'%3EDB vs Net%3C/text%3E%3C/svg%3E",
      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 120'%3E%3Crect width='120' height='120' fill='%230f172a'/%3E%3Crect x='10' y='60' width='18' height='45' fill='%2338bdf8' rx='2'/%3E%3Crect x='34' y='30' width='18' height='75' fill='%23f87171' rx='2'/%3E%3Crect x='58' y='75' width='18' height='30' fill='%2334d399' rx='2'/%3E%3Crect x='82' y='20' width='18' height='85' fill='%23fb923c' rx='2'/%3E%3Cline x1='8' y1='108' x2='112' y2='108' stroke='%231e293b' stroke-width='1'/%3E%3Ctext x='10' y='15' font-size='10' fill='%2394a3b8' font-family='monospace'%3ERoutes%3C/text%3E%3C/svg%3E",
    ],
    detail: [
      { text: "1280×720 · p95 latency spikes on /products" },
      { text: "DB query accounts for 78% of response time" },
    ],
  },
  {
    icon: "write",
    label: "Write optimized handler",
    chip: "api/products/route.ts",
    mono: true,
    detailMono: true,
    detail: [
      { text: "+ const cached = await redis.get(cacheKey)", tone: "add" },
      { text: "+ return NextResponse.json(cached, { headers })", tone: "add" },
    ],
  },
  {
    icon: "run",
    label: "Run benchmark",
    chip: "pnpm bench:api",
    mono: true,
    detailMono: true,
    detail: [{ text: "✓ p95 latency: 1840 ms → 94 ms" }, { text: "✓ All 8 routes pass threshold" }],
  },
];

export const TOOL_DIFFS: ToolDiff[] = [
  { file: "api/products/route.ts", add: 31, del: 14 },
  { file: "lib/cache.ts", add: 28, del: 0 },
  { file: "middleware.ts", add: 12, del: 4 },
];

export const CODE_LINES = [
  "import { redis } from '@/lib/cache';",
  "import { db } from '@/lib/db';",
  "",
  "export async function GET(req: Request) {",
  "  const cacheKey = `products:${new URL(req.url).search}`;",
  "  const cached = await redis.get(cacheKey);",
  "  if (cached) return Response.json(cached);",
  "",
  "  const products = await db.product.findMany({",
  "    take: 50, include: { variants: true },",
  "  });",
  "  await redis.set(cacheKey, products, { ex: 60 });",
  "  return Response.json(products);",
  "}",
];
