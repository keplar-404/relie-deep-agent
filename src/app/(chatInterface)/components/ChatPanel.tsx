"use client";

import ChatPromptBar from "./ChatPromptBar";
import UserChatBubble from "./UserChatBubble";

export default function ChatPanel() {
  return (
    <div className="flex flex-col justify-end h-full w-full p-3 bg-background">
      <UserChatBubble message="askdjfhkasdfjhskdfhsudh sjdfhkkf hksdhfkshdkj fskdfhkashdfhlsdhfkjshk fsj fklhsdkjfhksdhfkjhsojf iujsehfiuheuotrhtgushthskdh fishdf slkdhfihe tgseh tuhs gfakfhiashdfgsd" />

      <UserChatBubble message="hello" />
      <UserChatBubble message="hello" />
      <UserChatBubble message="hello" />
      <UserChatBubble message="hello" />
      <UserChatBubble message="hello" />
      <UserChatBubble message="hello" />

      <ChatPromptBar />
    </div>
  );
}
