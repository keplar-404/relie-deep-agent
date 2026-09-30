"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { cn } from "cn";
import { MentionMenu } from "./MentionMenu";
import { ModelMenu } from "./ModelMenu";
import { AttachmentList } from "./AttachmentList";
import { PromptBarControls } from "./PromptBarControls";
import { useGlimm } from "./useGlimm";
import { validateFiles, fileToAttachedFile, DEFAULT_ACCEPTED_TYPES, DEFAULT_MAX_FILE_SIZE, DEFAULT_MAX_FILES } from "./fileValidation";
import { SOURCES, COMMANDS, MODELS, parseToken, type Model, type Source, type Command, type AttachedFile, type PromptBarProps } from "./types";

export function PromptBar({
  variant = "Rounded", placeholder, autoFocus, value, defaultValue = "", onValueChange, onSend, onKeyDown,
  className, composerClassName, inputClassName, models = MODELS, model: controlledModel, defaultModel,
  onModelChange, hideModelPicker = false, sources = SOURCES, commands = COMMANDS, hideAttachments = false,
  hideDictation = false, onDictation, attachments: controlledFiles, onAttachmentsChange,
  acceptedFileTypes = DEFAULT_ACCEPTED_TYPES, maxFileSize = DEFAULT_MAX_FILE_SIZE, maxFiles = DEFAULT_MAX_FILES, onFileError,
  disabled = false, loading = false,
}: PromptBarProps) {
  const pill = variant === "Pill";
  const [internalDraft, setInternalDraft] = useState(defaultValue);
  const draft = value !== undefined ? value : internalDraft;

  const [mounted, setMounted] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [plusOpen, setPlusOpen] = useState(false);
  const [modelOpen, setModelOpen] = useState(false);

  const initModel = useMemo(
    () => models.find((m) => m.key === (defaultModel || (typeof controlledModel === "string" ? controlledModel : controlledModel?.key))) || models[0],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );
  const [internalModel, setInternalModel] = useState<Model>(initModel);
  const currentModel = (typeof controlledModel === "string" ? models.find((m) => m.key === controlledModel) : controlledModel) || internalModel;

  const [internalFiles, setInternalFiles] = useState<AttachedFile[]>([]);
  // Stable files reference - avoid remapping on every render
  const files: AttachedFile[] = useMemo(() => {
    const source = controlledFiles ?? internalFiles;
    return source.map((f, i) => (typeof f === "string" ? { id: `f-${i}`, name: f } : f));
  }, [controlledFiles, internalFiles]);

  const [fileError, setFileError] = useState<string | null>(null);
  const [active, setActive] = useState(0);
  const [listening, setListening] = useState(false);
  const [menuPos, setMenuPos] = useState({ left: 0, bottom: 0 });

  const { canvasRef, celebrate } = useGlimm();
  const anchorRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const modelBtnRef = useRef<HTMLButtonElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Keep a ref to files so callbacks don't close over stale values
  const filesRef = useRef(files);
  filesRef.current = files;

  const token = dismissed ? null : parseToken(draft);
  const menu = plusOpen ? "at" : token?.kind ?? null;
  const query = plusOpen ? "" : token?.query ?? "";
  const rows = useMemo(() =>
    menu === "at" ? sources.filter((s) => s.name.toLowerCase().includes(query))
    : menu === "slash" ? commands.filter((c) => c.name.slice(1).startsWith(query))
    : [],
    [menu, query, sources, commands]
  );

  // Stable setFiles that reads current files via ref
  const setFiles = useCallback((updater: (prev: AttachedFile[]) => AttachedFile[]) => {
    if (controlledFiles === undefined) {
      setInternalFiles((prev) => {
        const next = updater(prev);
        onAttachmentsChange?.(next);
        return next;
      });
    } else {
      const next = updater(filesRef.current);
      onAttachmentsChange?.(next);
    }
  }, [controlledFiles, onAttachmentsChange]);

  useEffect(() => {
    setMounted(true);
    if (autoFocus) inputRef.current?.focus();
    const close = (e: PointerEvent) => {
      if (!(e.target as Element).closest("[data-promptbar]")) {
        setPlusOpen(false);
        setModelOpen(false);
        setDismissed(true);
      }
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [autoFocus]);

  useEffect(() => {
    if (!fileError) return;
    const t = setTimeout(() => setFileError(null), 4000);
    return () => clearTimeout(t);
  }, [fileError]);

  useLayoutEffect(() => {
    if (!modelOpen || !anchorRef.current || !modelBtnRef.current) return;
    const a = anchorRef.current.getBoundingClientRect();
    const t = modelBtnRef.current.getBoundingClientRect();
    setMenuPos({ left: Math.max(0, Math.min(t.left - a.left, a.width - 200)), bottom: a.bottom - t.top + 8 });
  }, [modelOpen]);

  useLayoutEffect(() => {
    if (!inputRef.current) return;
    inputRef.current.style.height = "0px";
    inputRef.current.style.height = `${Math.min(Math.max(inputRef.current.scrollHeight, 28), 140)}px`;
  }, [draft]);

  useEffect(() => {
    if (!listening) return;
    const t = setTimeout(() => {
      const voiceText = "Compare products to last week";
      const current = inputRef.current?.value ?? "";
      const next = current ? `${current.trimEnd()} ${voiceText}` : voiceText;
      setInternalDraft(next);
      onValueChange?.(next);
      onDictation?.(voiceText);
      setListening(false);
      inputRef.current?.focus();
    }, 2200);
    return () => clearTimeout(t);
  }, [listening, onDictation, onValueChange]);

  const setDraft = useCallback((val: string) => {
    setInternalDraft(val);
    onValueChange?.(val);
    setDismissed(false);
  }, [onValueChange]);

  const handleFiles = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    const { validFiles, errors } = validateFiles(e.target.files, {
      acceptedTypes: acceptedFileTypes, maxFileSize, maxFiles, currentCount: filesRef.current.length,
    });
    if (errors.length > 0) {
      const msg = errors.join(" ");
      setFileError(msg);
      onFileError?.(msg);
    } else {
      setFileError(null);
    }
    if (validFiles.length > 0) setFiles((p) => [...p, ...validFiles.map(fileToAttachedFile)]);
    e.target.value = "";
  }, [acceptedFileTypes, maxFileSize, maxFiles, setFiles, onFileError]);

  const handleRemoveFile = useCallback((index: number) => {
    const file = filesRef.current[index];
    if (file?.url?.startsWith("blob:")) URL.revokeObjectURL(file.url);
    setFiles((p) => p.filter((_, j) => j !== index));
  }, [setFiles]);

  const pick = useCallback((row: Source | Command) => {
    if ("attach" in row && row.attach) {
      fileInputRef.current?.click();
    } else {
      const t = dismissed ? null : parseToken(draft);
      setDraft(`${t ? draft.slice(0, t.start) : draft}${menu === "at" ? "@" : ""}${row.name} `);
    }
    setPlusOpen(false);
    setDismissed(false);
    inputRef.current?.focus();
  }, [dismissed, draft, menu, setDraft]);

  const handleModelSelect = useCallback((m: Model) => {
    setInternalModel(m);
    onModelChange?.(m);
    setModelOpen(false);
    if (m.key === "claude-3-7-sonnet" || m.tag === "Flagship") celebrate();
    inputRef.current?.focus();
  }, [onModelChange, celebrate]);

  const canSend = !disabled && !loading && (draft.trim().length > 0 || files.length > 0);
  const isSendDisabled = !mounted || !canSend;

  const send = useCallback(() => {
    if (!canSend) return;
    onSend?.(draft.trim(), filesRef.current, currentModel);
    filesRef.current.forEach((f) => { if (f.url?.startsWith("blob:")) URL.revokeObjectURL(f.url); });
    setDraft("");
    setFiles(() => []);
    setPlusOpen(false);
    setModelOpen(false);
    setDismissed(false);
  }, [canSend, onSend, draft, currentModel, setDraft, setFiles]);

  return (
    <div data-promptbar className={cn("w-full", className)}>
      <input type="file" ref={fileInputRef} accept={acceptedFileTypes} onChange={handleFiles} multiple className="hidden" />
      <div ref={anchorRef} className="relative">
        {menu && <MentionMenu menu={menu} query={query} rows={rows} active={active} setActive={setActive} onPick={pick} />}
        {modelOpen && !hideModelPicker && <ModelMenu model={currentModel} models={models} left={menuPos.left} bottom={menuPos.bottom} onSelect={handleModelSelect} />}
        <div className={cn(
          "relative isolate flex flex-col gap-2 rounded-xl border border-border bg-card p-2.5 shadow-xs transition-colors focus-within:border-primary/60",
          pill && "rounded-2xl",
          disabled && "opacity-60 pointer-events-none",
          composerClassName
        )}>
          <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 h-full w-full" style={{ borderRadius: "inherit" }} />
          <AttachmentList files={files} onRemove={handleRemoveFile} error={fileError} onClearError={() => setFileError(null)} />

          <textarea
            ref={inputRef} rows={1} value={draft} disabled={disabled} spellCheck={false}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              onKeyDown?.(e);
              if (e.defaultPrevented) return;
              if (menu && rows.length > 0) {
                if (e.key === "ArrowDown" || e.key === "ArrowUp") {
                  e.preventDefault();
                  setActive((c) => (c + (e.key === "ArrowDown" ? 1 : rows.length - 1)) % rows.length);
                  return;
                }
                if ((e.key === "Enter" && !e.shiftKey) || e.key === "Tab") {
                  e.preventDefault();
                  pick(rows[active]);
                  return;
                }
              }
              if (e.key === "Escape") { e.preventDefault(); setDismissed(true); setPlusOpen(false); setModelOpen(false); return; }
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); send(); }
            }}
            placeholder={listening ? "Listening…" : placeholder ?? "Ask Relie AI to update your store, inspect code, or run tasks…"}
            className={cn("min-w-0 w-full resize-none bg-transparent px-1 py-0.5 text-xs text-foreground placeholder:text-muted-foreground/60 outline-none leading-relaxed", inputClassName)}
          />

          <PromptBarControls
            hideAttachments={hideAttachments} hideModelPicker={hideModelPicker} hideDictation={hideDictation}
            disabled={disabled} plusOpen={plusOpen} onPlusToggle={() => { setModelOpen(false); setPlusOpen((p) => !p); inputRef.current?.focus(); }}
            model={currentModel} modelBtnRef={modelBtnRef} onModelToggle={() => { setPlusOpen(false); setModelOpen((m) => !m); }}
            listening={listening} onDictationToggle={() => setListening((l) => !l)}
            canSend={canSend} isSendDisabled={isSendDisabled} mounted={mounted} loading={loading} onSend={send}
          />
        </div>
      </div>
    </div>
  );
}
