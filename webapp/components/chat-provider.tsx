"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  reasoning?: string;
  toolCalls?: ToolCallInfo[];
  timestamp: number;
}

export interface ToolCallInfo {
  toolName: string;
  args: Record<string, unknown>;
  result?: unknown;
  status: "running" | "done" | "error";
}

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
}

export interface ContextUsage {
  currentTokens: number;
  tokenLimit: number;
  systemTokens: number;
  conversationTokens: number;
  toolDefinitionsTokens: number;
  messagesLength: number;
  percent: number;
}

export interface ModelOption {
  id: string;
  name: string;
  supportsReasoning: boolean;
  reasoningLevels: string[];
  defaultReasoning?: string;
}

interface ChatState {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  sessionId: string;
  setSessionId: (id: string) => void;
  messages: ChatMessage[];
  isStreaming: boolean;
  tokenUsage: TokenUsage;
  contextUsage: ContextUsage;
  model: string;
  setModel: (model: string) => void;
  reasoningEffort: string;
  setReasoningEffort: (level: string) => void;
  availableModels: ModelOption[];
  currentModelInfo: ModelOption | null;
  sendMessage: (prompt: string) => Promise<void>;
  abortGeneration: () => Promise<void>;
  clearMessages: () => void;
  openWithPrompt: (prompt: string) => void;
}

const ChatContext = createContext<ChatState | null>(null);

export function useChatState() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChatState must be used within ChatProvider");
  return ctx;
}

const STORAGE_KEY = "storyteller-chat";

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export function ChatProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpenRaw] = useState(false);
  const [sessionId, setSessionIdRaw] = useState(() => generateId());
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [tokenUsage, setTokenUsage] = useState<TokenUsage>({
    inputTokens: 0,
    outputTokens: 0,
  });
  const [contextUsage, setContextUsage] = useState<ContextUsage>({
    currentTokens: 0,
    tokenLimit: 1,
    systemTokens: 0,
    conversationTokens: 0,
    toolDefinitionsTokens: 0,
    messagesLength: 0,
    percent: 0,
  });
  const [model, setModelRaw] = useState("claude-opus-4.6-1m");
  const [reasoningEffort, setReasoningEffortRaw] = useState("medium");
  const [availableModels, setAvailableModels] = useState<ModelOption[]>([]);
  const [pendingPrompt, setPendingPrompt] = useState<string | null>(null);

  // Fetch available models
  useEffect(() => {
    fetch("/api/chat/models")
      .then((r) => r.json())
      .then((data) => {
        if (data.models?.length > 0) {
          setAvailableModels(data.models);
          // If current model isn't in the list, switch to first available
          const ids = data.models.map((m: ModelOption) => m.id);
          setModelRaw((prev) => (ids.includes(prev) ? prev : data.models[0].id));
        }
      })
      .catch(() => {});
  }, []);

  // Load persisted state
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        if (data.sessionId) setSessionIdRaw(data.sessionId);
        if (data.model) setModelRaw(data.model);
        if (data.reasoningEffort) setReasoningEffortRaw(data.reasoningEffort);
        if (data.messages) setMessages(data.messages);
      }
    } catch {}
  }, []);

  // Persist state
  const persist = useCallback(
    (overrides?: Partial<{ sessionId: string; model: string; reasoningEffort: string; messages: ChatMessage[] }>) => {
      const data = {
        sessionId: overrides?.sessionId ?? sessionId,
        model: overrides?.model ?? model,
        reasoningEffort: overrides?.reasoningEffort ?? reasoningEffort,
        messages: overrides?.messages ?? messages,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    },
    [sessionId, model, reasoningEffort, messages]
  );

  useEffect(() => {
    persist();
  }, [persist]);

  const setIsOpen = useCallback((open: boolean) => {
    setIsOpenRaw(open);
  }, []);

  const setSessionId = useCallback(
    (id: string) => {
      setSessionIdRaw(id);
      setMessages([]);
      persist({ sessionId: id, messages: [] });
    },
    [persist]
  );

  const setModel = useCallback(
    (m: string) => {
      setModelRaw(m);
      // New model = new session (model is set at session creation time)
      const newId = generateId();
      setSessionIdRaw(newId);
      setMessages([]);
      setTokenUsage({ inputTokens: 0, outputTokens: 0 });
      persist({ model: m, sessionId: newId, messages: [] });
    },
    [persist]
  );

  const setReasoningEffort = useCallback(
    (r: string) => {
      setReasoningEffortRaw(r);
      persist({ reasoningEffort: r });
    },
    [persist]
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    const newId = generateId();
    setSessionIdRaw(newId);
    persist({ sessionId: newId, messages: [] });
  }, [persist]);

  const sendMessage = useCallback(
    async (prompt: string) => {
      if (isStreaming) return;

      const userMsg: ChatMessage = {
        id: generateId(),
        role: "user",
        content: prompt,
        timestamp: Date.now(),
      };

      const assistantMsg: ChatMessage = {
        id: generateId(),
        role: "assistant",
        content: "",
        reasoning: "",
        toolCalls: [],
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, userMsg, assistantMsg]);
      setIsStreaming(true);

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId,
            prompt,
            model,
            reasoningEffort,
          }),
        });

        if (!res.ok) {
          const err = await res.json();
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsg.id
                ? { ...m, content: `Error: ${err.error || "Request failed"}` }
                : m
            )
          );
          setIsStreaming(false);
          return;
        }

        const reader = res.body?.getReader();
        if (!reader) {
          setIsStreaming(false);
          return;
        }

        const decoder = new TextDecoder();
        let buffer = "";
        let currentEventType = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.startsWith("event: ")) {
              currentEventType = line.substring(7).trim();
            } else if (line.startsWith("data: ") && currentEventType) {
              const eventType = currentEventType;
              currentEventType = ""; // Reset after consuming
              try {
                const data = JSON.parse(line.substring(6));
                setMessages((prev) =>
                  prev.map((m) => {
                    if (m.id !== assistantMsg.id) return m;

                    switch (eventType) {
                      case "delta":
                        return { ...m, content: m.content + data.content };
                      case "reasoning_delta":
                        return {
                          ...m,
                          reasoning: (m.reasoning || "") + data.content,
                        };
                      case "message":
                        return { ...m, content: data.content };
                      case "reasoning":
                        return { ...m, reasoning: data.content };
                      case "tool_start":
                        return {
                          ...m,
                          toolCalls: [
                            ...(m.toolCalls || []),
                            {
                              toolName: data.toolName,
                              args: data.args,
                              status: "running" as const,
                            },
                          ],
                        };
                      case "tool_complete": {
                        const updated = (m.toolCalls || []).map((tc) =>
                          tc.toolName === data.toolName &&
                          tc.status === "running"
                            ? {
                                ...tc,
                                result: data.result,
                                status: "done" as const,
                              }
                            : tc
                        );
                        return { ...m, toolCalls: updated };
                      }
                      case "token_usage":
                        setTokenUsage({
                          inputTokens: data.inputTokens,
                          outputTokens: data.outputTokens,
                        });
                        return m;
                      case "context_usage":
                        setContextUsage({
                          currentTokens: data.currentTokens,
                          tokenLimit: data.tokenLimit,
                          systemTokens: data.systemTokens,
                          conversationTokens: data.conversationTokens,
                          toolDefinitionsTokens: data.toolDefinitionsTokens,
                          messagesLength: data.messagesLength,
                          percent: Math.round((data.currentTokens / data.tokenLimit) * 100),
                        });
                        return m;
                      case "error":
                        return {
                          ...m,
                          content:
                            m.content + `\n\nError: ${data.message}`,
                        };
                      default:
                        return m;
                    }
                  })
                );
              } catch {}
            }
          }
        }
      } catch (e) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsg.id
              ? { ...m, content: `Connection error: ${String(e)}` }
              : m
          )
        );
      }

      setIsStreaming(false);
    },
    [isStreaming, sessionId, model, reasoningEffort]
  );

  const abortGeneration = useCallback(async () => {
    try {
      await fetch("/api/chat", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
    } catch {}
    setIsStreaming(false);
  }, [sessionId]);

  const openWithPrompt = useCallback(
    (prompt: string) => {
      setIsOpenRaw(true);
      // Defer sending to next tick so panel is open
      setPendingPrompt(prompt);
    },
    []
  );

  // Handle pending prompt
  useEffect(() => {
    if (pendingPrompt && isOpen && !isStreaming) {
      const p = pendingPrompt;
      setPendingPrompt(null);
      sendMessage(p);
    }
  }, [pendingPrompt, isOpen, isStreaming, sendMessage]);

  const currentModelInfo = availableModels.find((m) => m.id === model) || null;

  return (
    <ChatContext.Provider
      value={{
        isOpen,
        setIsOpen,
        sessionId,
        setSessionId,
        messages,
        isStreaming,
        tokenUsage,
        contextUsage,
        model,
        setModel,
        reasoningEffort,
        setReasoningEffort,
        availableModels,
        currentModelInfo,
        sendMessage,
        abortGeneration,
        clearMessages,
        openWithPrompt,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}
