export default function UserChatBubble(props: { message: String }) {
  return (
    <div className="flex flex-col items-end gap-1.5 max-w-full">
      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground px-1">
        <span>You</span>
      </div>

      <div className="max-w-[85%] rounded-2xl rounded-tr-xs bg-primary px-3.5 py-2.5 text-[12px] leading-relaxed text-primary-foreground shadow-xs whitespace-pre-wrap">
        {props.message}
      </div>
    </div>
  );
}
