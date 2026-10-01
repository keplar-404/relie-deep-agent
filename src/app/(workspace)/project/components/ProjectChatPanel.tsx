"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { ChevronLeftIcon, SparklesIcon, RotateCcwIcon, PaperclipIcon, CheckCircle2Icon, ExternalLinkIcon, MonitorIcon } from "lucide-react";
import { ModeToggle } from "@/app/(app)/components/ModeToggle";
import { PromptBar, type AttachedFile, type Model } from "@/components/PromptBar";

interface AttachedFilePreview {
  name: string;
  size?: number;
  url?: string;
}

interface ScreenshotItem {
  label: "desktop" | "laptop" | "tablet" | "mobile" | string;
  width: number;
  height: number;
  url: string;
}

interface GeneratedAsset {
  name: string;
  url: string;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  attachments?: AttachedFilePreview[];
  screenshots?: ScreenshotItem[];
  generatedImages?: GeneratedAsset[];
  modelTag?: string;
  workflow?: string;
  tools?: string[];
  timestamp: string;
}

const SUGGESTIONS = [
  "Analyze API performance and optimize bottlenecks",
  "Implement Redis cache layer for slow routes",
  "Audit endpoint latencies and database queries",
  "Run the automated test suite and benchmarks",
];

interface ProjectChatPanelProps {
  projectName?: string;
  projectId?: string;
}

export function ProjectChatPanel({ projectName, projectId }: ProjectChatPanelProps) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Load existing chat history from Neon DB on project mount
  useEffect(() => {
    if (!projectId) return;

    fetch(`/api/v1/chat-history?projectId=${projectId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (Array.isArray(data?.messages) && data.messages.length > 0) {
          const loaded: ChatMessage[] = data.messages.map((m: any) => {
            const rawAtts = Array.isArray(m.attachments) ? m.attachments : [];
            const generatedFromAtts = rawAtts
              .filter(
                (a: any) =>
                  a.type === "image" &&
                  !["desktop", "laptop", "tablet", "mobile"].some((lbl) =>
                    a.name?.toLowerCase().startsWith(lbl)
                  )
              )
              .map((a: any) => ({ name: a.name || "generated-asset.png", url: a.url }));

            return {
              id: m.id,
              role: m.role,
              text: m.content || "",
              attachments: rawAtts,
              screenshots: Array.isArray(m.screenshots) ? m.screenshots : [],
              generatedImages:
                Array.isArray(m.generatedImages) && m.generatedImages.length > 0
                  ? m.generatedImages
                  : generatedFromAtts,
              modelTag: m.model,
              workflow: m.workflow,
              tools: Array.isArray(m.tools) ? m.tools : [],
              timestamp: new Date(m.createdAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              }),
            };
          });
          setMessages(loaded);
        }
      })
      .catch((err) => {
        console.error("Failed to load chat history:", err);
      });
  }, [projectId]);

  const handleSend = async (text: string, rawAttachments?: unknown, selectedModel?: Model) => {
    const cleanText = text.trim();
    const rawFiles: AttachedFile[] = Array.isArray(rawAttachments) ? (rawAttachments as AttachedFile[]) : [];

    if (!cleanText && rawFiles.length === 0) return;

    const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const userMsgId = `user-${Date.now()}`;

    // Upload any file attachments with rawFile to S3
    const uploadedUrls: string[] = [];
    const filesForDisplay: AttachedFilePreview[] = [];

    for (const f of rawFiles) {
      if (f.url) {
        uploadedUrls.push(f.url);
        filesForDisplay.push({ name: f.name, size: f.size, url: f.url });
      } else if (f.rawFile) {
        try {
          const fd = new FormData();
          fd.append("file", f.rawFile);
          const uploadRes = await fetch("/api/v1/fileupload", { method: "POST", body: fd });
          if (uploadRes.ok) {
            const data = await uploadRes.json();
            const s3Url = data.urls?.[0];
            if (s3Url) {
              uploadedUrls.push(s3Url);
              filesForDisplay.push({ name: f.name, size: f.size, url: s3Url });
            }
          }
        } catch (err) {
          console.error("Failed to upload attachment:", err);
        }
      }
    }

    const userMessage: ChatMessage = {
      id: userMsgId,
      role: "user",
      text: cleanText,
      attachments: filesForDisplay,
      timestamp: time,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/v1/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          message: cleanText,
          fileUrls: uploadedUrls,
          model: selectedModel?.key || "auto",
        }),
      });

      const data = await res.json();

      if (res.ok && data.ok) {
        const assistantMessage: ChatMessage = {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          text: data.response || "Task completed successfully.",
          screenshots: data.screenshots || [],
          generatedImages: data.generatedImages || [],
          modelTag: data.model,
          workflow: data.workflow,
          tools: data.tools || [],
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        const errorMsg = data?.error || "An error occurred while executing the agent workflow.";
        setMessages((prev) => [
          ...prev,
          {
            id: `assistant-err-${Date.now()}`,
            role: "assistant",
            text: `⚠️ **Error**: ${typeof errorMsg === "string" ? errorMsg : JSON.stringify(errorMsg)}`,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          },
        ]);
      }
    } catch (err: any) {
      console.error("Agent execution failed:", err);
      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-err-${Date.now()}`,
          role: "assistant",
          text: `⚠️ **Network Error**: Unable to reach agent service. (${err?.message || err})`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setMessages([]);
    setInput("");
  };

  return (
    <div className="flex flex-col h-full w-full bg-background overflow-hidden">
      {/* Chat Header */}
      <header className="flex h-12 shrink-0 items-center justify-between px-3 border-b border-border/40 bg-card/40">
        <div className="flex items-center gap-2 min-w-0">
          <Link
            href="/projects"
            className="flex items-center justify-center size-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer shrink-0"
            title="Back to Projects"
          >
            <ChevronLeftIcon className="size-4" />
          </Link>
          <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-xs">
            <SparklesIcon className="size-3.5" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-semibold text-foreground leading-tight truncate">
              {projectName || "Relie AI Agent"}
            </span>
            <span className="text-[10px] text-muted-foreground">Deep Agent Workspace</span>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {messages.length > 0 && (
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground px-2 py-1 rounded-md hover:bg-muted transition-colors cursor-pointer mr-1"
              title="Reset conversation"
            >
              <RotateCcwIcon className="size-3" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          )}
          <ModeToggle />
        </div>
      </header>

      {/* Messages Stream - completely hiding ugly native scrollbars while preserving smooth scroll */}
      <div className="flex-1 overflow-y-auto p-4 scrollbar-none no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {messages.length === 0 ? (
          /* Empty / Welcome Hero State - nicely centered without exceeding container height */
          <div className="flex flex-col items-center justify-center min-h-full max-w-sm mx-auto text-center py-4">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-3 shadow-xs">
              <SparklesIcon className="size-5" />
            </div>
            <h2 className="text-sm font-semibold text-foreground mb-1">
              Deep Agent Chat
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed mb-6">
              Ask Relie AI to inspect code, profile slow endpoints, generate route handlers, or run benchmarks.
            </p>

            {/* Quick Suggestions */}
            <div className="grid grid-cols-1 gap-2 w-full">
              {SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => handleSend(suggestion)}
                  className="text-left p-2.5 rounded-lg border border-border/50 bg-card/60 hover:bg-card hover:border-border transition-colors text-[11px] text-muted-foreground hover:text-foreground cursor-pointer shadow-2xs"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Populated Messages Stream */}
            {messages.map((message) => {
              if (message.role === "user") {
                return (
                  <div key={message.id} className="flex flex-col items-end gap-1.5 max-w-full">
                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground px-1">
                      <span>You</span>
                      <span>•</span>
                      <span>{message.timestamp}</span>
                    </div>

                    {/* User Bubble */}
                    <div className="max-w-[85%] rounded-2xl rounded-tr-xs bg-primary px-3.5 py-2.5 text-[12px] leading-relaxed text-primary-foreground shadow-xs">
                      {message.text}

                      {/* Attached files preview */}
                      {message.attachments && message.attachments.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-primary-foreground/20 flex flex-wrap gap-1.5">
                          {message.attachments.map((att, i) => (
                            <span
                              key={i}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary-foreground/15 text-[10px] text-primary-foreground font-mono"
                            >
                              <PaperclipIcon className="size-2.5" />
                              <span className="truncate max-w-35">{att.name}</span>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              }

              // Assistant Turn
              return (
                <div key={message.id} className="flex flex-col items-start gap-2 max-w-full animate-in fade-in duration-200">
                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground px-1 select-none">
                    <div className="flex size-4.5 items-center justify-center rounded-md bg-primary text-primary-foreground font-bold text-[9px] shadow-xs">
                      R
                    </div>
                    <span className="font-medium text-foreground/80">Relie AI</span>
                    {message.modelTag && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-muted text-muted-foreground font-mono">
                        {message.modelTag.split("/").pop()}
                      </span>
                    )}
                    {message.workflow && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-primary/10 text-primary font-semibold uppercase">
                        {message.workflow}
                      </span>
                    )}
                    <span>•</span>
                    <span>{message.timestamp}</span>
                  </div>

                  {/* Assistant Message Bubble */}
                  <div className="max-w-[92%] rounded-2xl rounded-tl-xs bg-card border border-border/70 px-4 py-3 text-[12px] leading-relaxed text-foreground shadow-2xs space-y-3">
                    <div className="whitespace-pre-wrap leading-relaxed">{message.text}</div>

                    {/* Tools utilized tag list */}
                    {message.tools && message.tools.length > 0 && (
                      <div className="pt-2 border-t border-border/40 flex flex-wrap items-center gap-1">
                        <span className="text-[10px] text-muted-foreground mr-1">Tools:</span>
                        {message.tools.map((t, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-muted/60 text-[10px] text-muted-foreground font-mono"
                          >
                            <CheckCircle2Icon className="size-2.5 text-primary" />
                            {t}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Responsive Visual Verification Screenshots */}
                    {message.screenshots && message.screenshots.length > 0 && (
                      <div className="pt-3 border-t border-border/40 space-y-2">
                        <div className="flex items-center gap-1 text-[11px] font-semibold text-foreground">
                          <MonitorIcon className="size-3.5 text-primary" />
                          <span>Visual Verification Screenshots ({message.screenshots.length})</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {message.screenshots.map((s, idx) => (
                            <a
                              key={idx}
                              href={s.url}
                              target="_blank"
                              rel="noreferrer"
                              className="group relative block overflow-hidden rounded-lg border border-border/60 bg-muted/20 hover:border-primary/50 transition-all"
                            >
                              <img
                                src={s.url}
                                alt={`Viewport ${s.label}`}
                                className="w-full h-24 object-cover object-top transition-transform group-hover:scale-102"
                              />
                              <div className="flex items-center justify-between px-2 py-1 bg-background/90 text-[10px] text-muted-foreground">
                                <span className="capitalize font-medium">{s.label}</span>
                                <ExternalLinkIcon className="size-2.5 opacity-60 group-hover:opacity-100" />
                              </div>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                    {/* Generated AI Visual Assets */}
                    {message.generatedImages && message.generatedImages.length > 0 && (
                      <div className="pt-3 border-t border-border/40 space-y-2">
                        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-foreground">
                          <SparklesIcon className="size-3.5 text-primary" />
                          <span>Generated Visual Assets ({message.generatedImages.length})</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {message.generatedImages.map((img, idx) => (
                            <a
                              key={idx}
                              href={img.url}
                              target="_blank"
                              rel="noreferrer"
                              className="group relative block overflow-hidden rounded-lg border border-border/60 bg-muted/20 hover:border-primary/50 transition-all shadow-xs"
                            >
                              <img
                                src={img.url}
                                alt={img.name}
                                className="w-full h-28 object-cover transition-transform group-hover:scale-102"
                              />
                              <div className="flex items-center justify-between px-2 py-1.5 bg-background/90 text-[10px] text-muted-foreground border-t border-border/40">
                                <span className="truncate font-medium max-w-30">{img.name}</span>
                                <ExternalLinkIcon className="size-2.5 opacity-60 group-hover:opacity-100" />
                              </div>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Active Loading / Reasoning State */}
            {isLoading && (
              <div className="flex flex-col items-start gap-2 max-w-full animate-in fade-in duration-200">
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground px-1 select-none">
                  <div className="flex size-4.5 items-center justify-center rounded-md bg-primary text-primary-foreground font-bold text-[9px] shadow-xs">
                    R
                  </div>
                  <span className="font-medium text-foreground/80">Relie AI</span>
                  <span>•</span>
                  <span>Reasoning & executing tools...</span>
                </div>
                <div className="flex items-center gap-3 rounded-2xl rounded-tl-xs bg-card border border-border/70 px-4 py-3 text-[12px] text-muted-foreground shadow-2xs">
                  <div className="size-3.5 animate-spin rounded-full border-2 border-primary border-t-transparent shrink-0" />
                  <span>Inspecting code and running sandbox verification...</span>
                </div>
              </div>
            )}

            <div ref={scrollRef} className="h-2" />
          </div>
        )}
      </div>

      {/* Chat Input Footer using PromptBar */}
      <footer className="p-3 border-t border-border/40 bg-background/95">
        <PromptBar
          value={input}
          onValueChange={setInput}
          onSend={(text, files, model) => handleSend(text, files, model)}
          placeholder="Ask Relie AI to inspect code, build features, or run benchmarks…"
        />
      </footer>
    </div>
  );
}
