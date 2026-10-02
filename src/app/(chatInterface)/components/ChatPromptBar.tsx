import { PromptBar } from "@/components/PromptBar";

export default function ChatPromptBar({
  onSend,
}: {
  onSend?: (message: string) => void;
}) {
  return (
    <div className="w-full">
      <PromptBar
        placeholder=""
        onSend={onSend ? (text) => onSend(text) : undefined}
      />
    </div>
  );
}
