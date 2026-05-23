import { NextResponse } from "next/server";
import { getClient } from "@/lib/copilot";
import { getStorytellerTools } from "@/lib/storyteller-tools";
import { getSystemPrompt } from "@/lib/storyteller-prompt";
import { approveAll } from "@github/copilot-sdk";

export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5 minutes for long chapter writes

// Store active sessions server-side
const sessions = new Map<string, ReturnType<Awaited<ReturnType<typeof getClient>>["createSession"]>>();

async function getOrCreateSession(
  sessionId: string,
  model: string,
  reasoningEffort?: string
) {
  if (sessions.has(sessionId)) {
    return await sessions.get(sessionId)!;
  }

  const client = await getClient();

  // Only pass reasoningEffort for models that support it
  const supportsReasoning = model.startsWith("gpt-") || model.includes("o1") || model.includes("o3");

  const sessionPromise = client.createSession({
    model,
    sessionId,
    ...(supportsReasoning && reasoningEffort && {
      reasoningEffort: reasoningEffort as "low" | "medium" | "high",
    }),
    streaming: true,
    tools: getStorytellerTools(),
    systemMessage: {
      content: getSystemPrompt(),
    },
    onPermissionRequest: approveAll,
  });

  sessions.set(sessionId, sessionPromise);
  return await sessionPromise;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      sessionId,
      prompt,
      model = "gpt-4o",
      reasoningEffort,
    } = body as {
      sessionId: string;
      prompt: string;
      model?: string;
      reasoningEffort?: string;
    };

    if (!sessionId || !prompt) {
      return NextResponse.json(
        { error: "sessionId and prompt required" },
        { status: 400 }
      );
    }

    const session = await getOrCreateSession(sessionId, model, reasoningEffort);

    // Set up SSE stream
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        function send(event: string, data: unknown) {
          controller.enqueue(
            encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
          );
        }

        const unsubs: Array<() => void> = [];

        unsubs.push(
          session.on("assistant.message_delta", (e) => {
            send("delta", { content: e.data.deltaContent });
          })
        );

        unsubs.push(
          session.on("assistant.reasoning_delta", (e) => {
            send("reasoning_delta", { content: e.data.deltaContent });
          })
        );

        unsubs.push(
          session.on("assistant.message", (e) => {
            send("message", { content: e.data.content });
          })
        );

        unsubs.push(
          session.on("assistant.reasoning", (e) => {
            send("reasoning", { content: e.data.content });
          })
        );

        // Track tool call IDs to tool names
        const toolCallMap = new Map<string, string>();

        unsubs.push(
          session.on("tool.execution_start", (e) => {
            toolCallMap.set(e.data.toolCallId, e.data.toolName);
            send("tool_start", {
              toolName: e.data.toolName,
              args: e.data.arguments || {},
            });
          })
        );

        unsubs.push(
          session.on("tool.execution_complete", (e) => {
            const toolName = toolCallMap.get(e.data.toolCallId) || "unknown";
            send("tool_complete", {
              toolName,
              result: e.data.result?.content || (e.data.error ? `Error: ${e.data.error.code}` : "Done"),
            });
          })
        );

        unsubs.push(
          session.on("assistant.usage", (e) => {
            send("token_usage", {
              inputTokens: e.data.inputTokens || 0,
              outputTokens: e.data.outputTokens || 0,
              model: e.data.model,
            });
          })
        );

        unsubs.push(
          session.on("session.usage_info", (e) => {
            send("context_usage", {
              currentTokens: e.data.currentTokens,
              tokenLimit: e.data.tokenLimit,
              systemTokens: e.data.systemTokens || 0,
              conversationTokens: e.data.conversationTokens || 0,
              toolDefinitionsTokens: e.data.toolDefinitionsTokens || 0,
              messagesLength: e.data.messagesLength,
            });
          })
        );

        unsubs.push(
          session.on("session.idle", () => {
            send("idle", {});
            // Cleanup listeners after idle
            unsubs.forEach((u) => u());
            controller.close();
          })
        );

        // Send the message
        try {
          await session.send({ prompt });
        } catch (e) {
          send("error", { message: String(e) });
          unsubs.forEach((u) => u());
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (e) {
    const err = e as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// Abort current generation
export async function DELETE(request: Request) {
  try {
    const { sessionId } = await request.json();
    const session = sessions.has(sessionId) ? await sessions.get(sessionId) : null;
    if (session) {
      await session.abort();
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
