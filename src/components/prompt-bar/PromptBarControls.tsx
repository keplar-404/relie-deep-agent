"use client";

import { cn } from "cn";
import { Icon } from "./icons";
import type { Model } from "./types";

interface PromptBarControlsProps {
  hideAttachments?: boolean;
  hideModelPicker?: boolean;
  hideDictation?: boolean;
  disabled?: boolean;
  plusOpen: boolean;
  onPlusToggle: () => void;
  model: Model;
  modelBtnRef: React.RefObject<HTMLButtonElement | null>;
  onModelToggle: () => void;
  listening: boolean;
  onDictationToggle: () => void;
  canSend: boolean;
  isSendDisabled: boolean;
  mounted: boolean;
  loading?: boolean;
  onSend: () => void;
}

export function PromptBarControls({
  hideAttachments, hideModelPicker, hideDictation, disabled, plusOpen, onPlusToggle,
  model, modelBtnRef, onModelToggle, listening, onDictationToggle,
  canSend, isSendDisabled, mounted, loading, onSend,
}: PromptBarControlsProps) {
  return (
    <div className="flex items-center justify-between pt-0.5">
      <div className="flex items-center gap-1.5">
        {!hideAttachments && (
          <button type="button" aria-label="Add sources" disabled={disabled} onClick={onPlusToggle} className={cn("flex size-7 shrink-0 items-center justify-center text-muted-foreground hover:bg-accent hover:text-foreground rounded-lg cursor-pointer transition-colors", plusOpen && "bg-accent text-foreground")}>
            <Icon size={15} strokeWidth={2}><path d="M12 5v14M5 12h14" /></Icon>
          </button>
        )}
        {!hideModelPicker && (
          <button ref={modelBtnRef} type="button" disabled={disabled} onClick={onModelToggle} className="flex h-7 shrink-0 items-center gap-1 px-2 text-[11px] font-medium text-muted-foreground hover:bg-accent hover:text-foreground rounded-lg cursor-pointer transition-colors">
            <span>{model.name}</span><Icon size={10} strokeWidth={2.4}><path d="M6 9l6 6 6-6" /></Icon>
          </button>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        {!hideDictation && (
          <button type="button" aria-label={listening ? "Stop dictation" : "Start dictation"} disabled={disabled} onClick={onDictationToggle} className={cn("flex size-7 shrink-0 items-center justify-center rounded-lg cursor-pointer transition-colors", listening ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-accent hover:text-foreground")}>
            {listening ? <span className="flex h-3.5 items-center gap-[2.5px]">{[0, 1, 2].map((i) => <span key={i} className="w-[2.5px] rounded-full bg-current" style={{ height: "100%", animation: `eq-bounce 900ms ease-in-out ${i * 150}ms infinite` }} />)}</span> : <Icon size={15} strokeWidth={2}><g><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v3" /></g></Icon>}
          </button>
        )}
        <button type="button" aria-label="Send" disabled={isSendDisabled} suppressHydrationWarning onClick={onSend} className={cn("flex size-7 shrink-0 items-center justify-center rounded-lg transition-all", mounted && canSend ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-2xs cursor-pointer" : "bg-muted text-muted-foreground/40 cursor-not-allowed")}>
          {loading ? <span className="size-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" /> : <Icon size={14} strokeWidth={2.4}><path d="M12 19V5M5 12l7-7 7 7" /></Icon>}
        </button>
      </div>
    </div>
  );
}
