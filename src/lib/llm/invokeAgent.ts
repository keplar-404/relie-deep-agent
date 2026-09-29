import { agent, createAgent } from "@/lib/agent";

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
  model?: string,
  threadId?: string,
) {
  const activeAgent = model ? createAgent(model) : agent;
  const configurable: Record<string, unknown> = { sandBoxId };
  if (threadId) {
    configurable.thread_id = threadId;
  }

  const result = await activeAgent.invoke(
    { messages: [{ role: "user", content }] },
    { configurable },
  );
  return result.messages[result.messages.length - 1].content;
}
