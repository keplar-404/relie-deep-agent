export type Source = {
  key: string;
  name: string;
  desc: string;
  glyph?: string;
  brand?: string;
  attach?: boolean;
  connect?: boolean;
};

export type Command = {
  key: string;
  name: string;
  desc: string;
};

export type Model = {
  key: string;
  name: string;
  tag: string;
};

export type AttachedFile = {
  id: string;
  name: string;
  size?: number;
  type?: string;
  url?: string;
  state?: "idle" | "uploading" | "processing" | "error" | "done";
  rawFile?: File;
};

export function parseToken(draft: string) {
  const match = /(^|\s)([@/])([\w-]*)$/.exec(draft);
  if (!match) return null;
  return { kind: match[2] === "@" ? ("at" as const) : ("slash" as const), query: match[3].toLowerCase(), start: match.index + match[1].length };
}

export const SOURCES: Source[] = [
  { key: "attach", name: "Add photos & files", desc: "Upload from your computer", glyph: "clip", attach: true },
  { key: "codebase", name: "Codebase Files", desc: "Project files & schemas", glyph: "layers" },
  { key: "metrics", name: "API & Performance", desc: "Latency, traces, queries", glyph: "chart" },
  { key: "web", name: "Web search", desc: "Real-time docs and info", glyph: "globe" },
  { key: "github", name: "Git Repository", desc: "Branches, PRs, diffs", glyph: "layers" },
  { key: "slack", name: "Slack", desc: "Read and manage Slack", brand: "slack" },
  { key: "gmail", name: "Gmail", desc: "Read and manage Gmail", brand: "gmail", connect: true },
];

export const COMMANDS: Command[] = [
  { key: "plan", name: "/plan", desc: "Plan optimization steps" },
  { key: "bench", name: "/bench", desc: "Run benchmark test suite" },
  { key: "audit", name: "/audit", desc: "Analyze API latency & queries" },
  { key: "refactor", name: "/refactor", desc: "Refactor slow route handlers" },
  { key: "code", name: "/code", desc: "Inspect and edit frontend code" },
];

export const MODELS: Model[] = [
  { key: "claude-3-7-sonnet", name: "Claude 3.7 Sonnet", tag: "Flagship" },
  { key: "claude-3-5-sonnet", name: "Claude 3.5 Sonnet", tag: "Fast" },
  { key: "gpt-4o", name: "GPT-4o", tag: "General" },
];

export type PromptBarProps = {
  variant?: "Rounded" | "Pill" | string;
  placeholder?: string;
  autoFocus?: boolean;
  value?: string;
  defaultValue?: string;
  onValueChange?: (val: string) => void;
  onSend?: (text: string, attachments?: AttachedFile[], model?: Model) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  className?: string;
  composerClassName?: string;
  inputClassName?: string;
  models?: Model[];
  model?: Model | string;
  defaultModel?: Model | string;
  onModelChange?: (model: Model) => void;
  hideModelPicker?: boolean;
  sources?: Source[];
  commands?: Command[];
  hideAttachments?: boolean;
  hideDictation?: boolean;
  onDictation?: (text: string) => void;
  attachments?: (string | AttachedFile)[];
  onAttachmentsChange?: (files: AttachedFile[]) => void;
  acceptedFileTypes?: string;
  maxFileSize?: number;
  maxFiles?: number;
  onFileError?: (error: string) => void;
  disabled?: boolean;
  loading?: boolean;
};
