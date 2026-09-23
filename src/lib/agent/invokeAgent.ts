import { agent } from "@/lib/agent";

export function invokeAgent(
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
  // thread_id = projectId — checkpointer uses this to save/resume graph state per project.
  // Docs: "you must specify a thread_id as part of the configurable portion of the config"
  threadId: string,
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      function send(event: object) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(event)}\n\n`),
        );
      }

      try {
        const stream = await agent.streamEvents(
          { messages: [{ role: "user", content }] },
          {
            version: "v3",
            configurable: { thread_id: threadId },
          },
        );

        await Promise.all([
          // 1. Message tokens (reasoning + final text)
          (async () => {
            for await (const message of stream.messages) {
              const text = await message.text;
              if (text) send({ type: "token", text });
            }
          })(),

          // 2. Tool calls
          (async () => {
            for await (const call of stream.toolCalls) {
              send({ type: "tool_call", name: call.name, input: call.input });
              const status = await call.status;
              if (status === "finished") {
                send({ type: "tool_done", name: call.name, output: String(await call.output) });
              } else if (status === "error") {
                send({ type: "tool_error", name: call.name, error: String(await call.error) });
              }
            }
          })(),
        ]);

        await stream.output;
        send({ type: "done" });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: "error", message })}\n\n`),
        );
      } finally {
        controller.close();
      }
    },
  });
}

