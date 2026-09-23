import { NextRequest } from "next/server";
import { z } from "zod";
import { AIMessageChunk, ToolMessage } from "langchain";
import { currentUser } from "@/lib/auth";
import { agent, ensureCheckpointerReady } from "@/lib/agent";
import { createChatMessage } from "@/lib/db/action/chatHistory";
import { createLlmExecutions } from "@/lib/db/action/llmExecution";

const bodySchema = z.object({
  // projectId is used as the LangGraph thread_id — isolates checkpointed
  // graph state per project. Docs require thread_id in configurable.
  projectId: z.uuid(),
  message: z.union([
    z.string().min(1),
    z.tuple([
      z.object({ type: z.literal("text"), text: z.string().min(1) }),
      z.object({
        type: z.enum(["image", "file"]),
        url: z.url(),
        mimeType: z.enum([
          "application/pdf",
          "image/png",
          "image/jpeg",
          "image/webp",
          "image/gif",
          "image/svg+xml",
        ]),
      }),
    ]),
  ]),
});

interface PendingToolCall {
  id?: string;
  name: string;
  args: string;
}

interface ExecutionRecord {
  type: string;
  toolName?: string;
  input?: unknown;
  output?: unknown;
  sequence: number;
}

export async function POST(req: NextRequest) {
  // 1. Auth
  const user = await currentUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Validate body
  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { projectId, message } = parsed.data;

  try {
    // 3. Save user message to DB
    await createChatMessage({
      projectId,
      userId: user.id,
      role: "user",
      content: typeof message === "string" ? message : message[0].text,
      attachments: [],
    });

    // 4. Ensure checkpointer tables exist (idempotent, runs once per process)
    await ensureCheckpointerReady();

    // 5. Stream agent output in natural arrival order
    //    streamMode: "messages" gives AIMessageChunk and ToolMessage in the order LLM produces them
    const agentStream = await agent.stream(
      { messages: [{ role: "user", content: message }] },
      { streamMode: "messages", configurable: { thread_id: projectId } },
    );

    let reasoningBuffer = "";
    const pendingToolCalls = new Map<number, PendingToolCall>();
    const executions: ExecutionRecord[] = [];
    let seq = 0;

    for await (const chunk of agentStream) {
      const [msg, metadata] = chunk;
      if (metadata?.lcSource === "summarization") continue;

      // Handle AIMessageChunk (reasoning text or tool call chunks)
      if (AIMessageChunk.isInstance(msg)) {
        if (msg.tool_call_chunks && msg.tool_call_chunks.length > 0) {
          for (const tc of msg.tool_call_chunks) {
            const index = tc.index ?? 0;
            if (tc.name) {
              // New tool call starts — flush accumulated reasoning first
              if (reasoningBuffer.trim()) {
                executions.push({
                  type: "reasoning",
                  output: { text: reasoningBuffer },
                  sequence: seq++,
                });
                reasoningBuffer = "";
              }
              pendingToolCalls.set(index, {
                id: tc.id,
                name: tc.name,
                args: tc.args ?? "",
              });
            } else if (tc.args) {
              const pending = pendingToolCalls.get(index);
              if (pending) {
                pending.args += tc.args;
                if (!pending.id && tc.id) pending.id = tc.id;
              }
            }
          }
        } else {
          const text = msg.text;
          const reasoningContent =
            typeof msg.additional_kwargs?.reasoning_content === "string"
              ? msg.additional_kwargs.reasoning_content
              : typeof msg.additional_kwargs?.reasoning === "string"
                ? msg.additional_kwargs.reasoning
                : "";
          if (text) {
            reasoningBuffer += text;
          } else if (reasoningContent) {
            reasoningBuffer += reasoningContent;
          }
        }
      }

      // Handle ToolMessage (tool execution finished)
      if (ToolMessage.isInstance(msg)) {
        let foundKey: number | undefined;
        let matchedCall: PendingToolCall | undefined;

        for (const [index, pending] of pendingToolCalls) {
          if ((pending.id && pending.id === msg.tool_call_id) || pending.name === msg.name) {
            foundKey = index;
            matchedCall = pending;
            break;
          }
        }

        const toolName = msg.name ?? matchedCall?.name ?? "tool";

        if (matchedCall) {
          let parsedInput: unknown = matchedCall.args;
          try {
            parsedInput = JSON.parse(matchedCall.args);
          } catch {
            parsedInput = matchedCall.args;
          }

          executions.push({
            type: "tool_call",
            toolName: matchedCall.name,
            input: parsedInput,
            sequence: seq++,
          });

          if (foundKey !== undefined) {
            pendingToolCalls.delete(foundKey);
          }
        }

        executions.push({
          type: "tool_done",
          toolName,
          output: { text: msg.text },
          sequence: seq++,
        });
      }
    }

    // 6. Remaining buffer is final response text
    const finalText = reasoningBuffer.trim();

    // 7. Save assistant message first to satisfy foreign key constraint on chatHistoryId
    const assistantMsg = await createChatMessage({
      projectId,
      userId: user.id,
      role: "assistant",
      content: finalText || "",
      attachments: [],
    });

    // 8. Save all executions in batch linked to assistant message
    if (executions.length > 0) {
      await createLlmExecutions(
        executions.map((e) => ({
          chatHistoryId: assistantMsg.id,
          projectId,
          sequence: e.sequence,
          type: e.type,
          toolName: e.toolName,
          input: e.input,
          output: e.output,
        })),
      );
    }

    return Response.json({ ok: true });
  } catch (error) {
    console.error("[POST /api/v1/agent error]:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: 500 },
    );
  }
}
