import { agent } from "@/lib/agent";

export async function invokeAgent(
  content:
    | string
    | [
        { type: "text"; text: string },
        {
          type: "image" | "file";
          url: string;
          mimeType:
            | "application/pdf"
            | "image/png"
            | "image/jpeg"
            | "image/webp"
            | "image/gif"
            | "image/svg+xml";
        },
      ],
  sandBoxId: string,
) {
  const result = await agent.invoke(
    { messages: [{ role: "user", content }] },
    { configurable: { sandBoxId } },
  );
  return result.messages[result.messages.length - 1].content;
}