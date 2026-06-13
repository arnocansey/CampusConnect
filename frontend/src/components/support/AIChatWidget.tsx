"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { MessageCircle, X, Send, Trash2, Sparkles, Bot, User } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const QUICK_REPLIES = [
  "How do I list an item on the marketplace?",
  "What hostels are near UCC campus?",
  "How do I join a study group?",
  "How do I upload lecture notes?",
];

export function AIChatWidget() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Load suggestions
  useEffect(() => {
    const loadSuggestions = async () => {
      try {
        const token = localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");
        const res = await fetch("/api/ai/suggestions", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success) setSuggestions(data.data);
      } catch {
        setSuggestions(QUICK_REPLIES);
      }
    };
    if (isOpen) loadSuggestions();
  }, [isOpen]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isStreaming) return;

      const userMessage: Message = {
        role: "user",
        content: text.trim(),
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setInput("");
      setIsStreaming(true);
      setShowSuggestions(false);

      const assistantMessage: Message = {
        role: "assistant",
        content: "",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);

      try {
        const token = localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");
        abortRef.current = new AbortController();

        const response = await fetch("/api/ai/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ message: text.trim() }),
          signal: abortRef.current.signal,
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || "Failed to get response");
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error("No response stream");

        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.done) break;
                if (data.content) {
                  setMessages((prev) => {
                    const updated = [...prev];
                    const last = updated[updated.length - 1];
                    if (last.role === "assistant") {
                      last.content += data.content;
                    }
                    return [...updated];
                  });
                }
              } catch {}
            }
          }
        }
      } catch (error: any) {
        if (error.name === "AbortError") return;

        setMessages((prev) => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last.role === "assistant") {
            last.content = "Sorry, I encountered an error. Please try again.";
          }
          return [...updated];
        });
      } finally {
        setIsStreaming(false);
        abortRef.current = null;
      }
    },
    [isStreaming]
  );

  const clearChat = async () => {
    try {
      const token = localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");
      await fetch("/api/ai/history", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {}
    setMessages([]);
    setShowSuggestions(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  if (!user) return null;

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-24 md:bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-all duration-300 hover:scale-110 ${
          isOpen
            ? "bg-gray-800 dark:bg-gray-700 rotate-0"
            : "bg-gradient-to-br from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
        }`}
        aria-label={isOpen ? "Close chat" : "Open AI assistant"}
      >
        {isOpen ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <MessageCircle className="w-6 h-6 text-white" />
        )}
        {!isOpen && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white dark:border-gray-900 animate-pulse" />
        )}
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-40 md:bottom-24 right-6 z-50 w-[350px] sm:w-[400px] max-w-[calc(100vw-3rem)] h-[500px] max-h-[calc(100vh-14rem)] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden transition-all duration-300">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-4 py-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-white font-semibold text-sm">CampusConnect AI</h3>
                <p className="text-white/70 text-xs">
                  {isStreaming ? "Typing..." : "Ask me anything"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {messages.length > 0 && (
                <button
                  onClick={clearChat}
                  className="p-2 hover:bg-white/20 rounded-full transition"
                  title="Clear chat"
                >
                  <Trash2 className="w-4 h-4 text-white" />
                </button>
              )}
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && showSuggestions && (
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-tl-sm px-4 py-3">
                    <p className="text-sm text-gray-800 dark:text-gray-200">
                      Hi {user.fullName?.split(" ")[0] || "there"}! I&apos;m your CampusConnect assistant. How can I help you today?
                    </p>
                  </div>
                </div>

                <div className="ml-11 space-y-2">
                  {(suggestions.length > 0 ? suggestions : QUICK_REPLIES).slice(0, 4).map((s, i) => (
                    <button
                      key={i}
                      onClick={() => sendMessage(s)}
                      className="w-full text-left px-3 py-2 text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/50 transition border border-blue-100 dark:border-blue-800"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={`flex items-start gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    msg.role === "assistant"
                      ? "bg-gradient-to-br from-blue-500 to-purple-600"
                      : "bg-gray-200 dark:bg-gray-700"
                  }`}
                >
                  {msg.role === "assistant" ? (
                    <Bot className="w-4 h-4 text-white" />
                  ) : (
                    <User className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                  )}
                </div>
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                    msg.role === "assistant"
                      ? "bg-gray-100 dark:bg-gray-800 rounded-tl-sm"
                      : "bg-blue-500 text-white rounded-tr-sm"
                  }`}
                >
                  <p
                    className={`text-sm whitespace-pre-wrap break-words ${
                      msg.role === "assistant" ? "text-gray-800 dark:text-gray-200" : ""
                    }`}
                  >
                    {msg.content || (
                      <span className="inline-flex gap-1">
                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                      </span>
                    )}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-gray-100 dark:border-gray-800 shrink-0">
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about campus life or the app..."
                rows={1}
                className="flex-1 resize-none rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 max-h-24"
                style={{ minHeight: "40px" }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = "auto";
                  target.style.height = Math.min(target.scrollHeight, 96) + "px";
                }}
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || isStreaming}
                className="p-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 dark:disabled:bg-gray-700 transition text-white shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1.5 text-center">
              AI can make mistakes. Verify important info.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
