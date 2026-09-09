"use client";

import { FormEvent, useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";

import { api, getApiErrorMessage } from "../../lib/api";

type Message = {
  id: number;
  sender: "assistant" | "user";
  text: string;
};

type StoredMessage = {
  // Shape returned by Django's chat-history endpoint.
  id: number;
  role: "assistant" | "user";
  content: string;
};

const quickPrompts = [
  "Summarize my resume",
  "Show my strongest skills",
  "Suggest improvements",
] as const;

function welcomeMessage(reportName: string): Message {
  return {
    id: 1,
    sender: "assistant",
    text: `I’m ready to answer questions about ${reportName}. What would you like to review?`,
  };
}

export function EmployeeAiAssistant({ reportId, reportName }: { reportId: number; reportName: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [messages, setMessages] = useState<Message[]>([welcomeMessage(reportName)]);

  useEffect(() => {
    let cancelled = false;
    // Reset local state when the user moves to a different resume report.
    setMessages([welcomeMessage(reportName)]);
    setInput("");
    setIsOpen(false);
    setIsLoadingHistory(true);
    // Restore the permanent conversation saved for this report and employee.
    api.get<{ results: StoredMessage[] }>(`/api/resumes/ask-ai/history/${reportId}/`)
      .then(({ data }) => {
        if (cancelled) return;
        const saved = data.results.map((message) => ({ id: message.id + 1, sender: message.role, text: message.content }));
        setMessages([welcomeMessage(reportName), ...saved]);
      })
      .catch(() => undefined)
      .finally(() => { if (!cancelled) setIsLoadingHistory(false); });
    return () => { cancelled = true; };
  }, [reportId, reportName]);

  async function addConversation(question: string) {
    const cleanQuestion = question.trim();
    if (!cleanQuestion || isSending) return;
    setMessages((current) => [...current, { id: Date.now(), sender: "user", text: cleanQuestion }]);
    setInput("");
    setIsSending(true);
    try {
      const { data } = await api.post<{ answer: string }>("/api/resumes/ask-ai/", {
        question: cleanQuestion,
        analysis_id: reportId,
      });
      setMessages((current) => [...current, { id: Date.now() + 1, sender: "assistant", text: data.answer }]);
    } catch (error) {
      setMessages((current) => [...current, {
        id: Date.now() + 1,
        sender: "assistant",
        text: getApiErrorMessage(error, "I could not connect to the resume coach. Please try again."),
      }]);
    } finally {
      setIsSending(false);
    }
  }

  function submitMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void addConversation(input);
  }

  async function clearHistory() {
    // Clearing calls Django so the messages stay deleted after a page refresh.
    if (!window.confirm(`Clear the saved conversation for ${reportName}?`)) return;
    await api.delete(`/api/resumes/ask-ai/history/${reportId}/`);
    setMessages([welcomeMessage(reportName)]);
  }

  return (
    <>
      {isOpen && <div className="fixed inset-0 z-50 flex justify-end">
        <button type="button" aria-label="Close AI Assistant" onClick={() => setIsOpen(false)} className="absolute inset-0 bg-slate-950/25 backdrop-blur-[1px]" />
        <section
          aria-label="Employee AI Resume Coach"
          className="relative flex h-full w-full flex-col overflow-hidden border-l border-slate-200 bg-white shadow-[-20px_0_60px_rgba(15,23,42,0.18)] sm:w-1/2 sm:min-w-[520px]"
        >
          <header className="flex items-center justify-between bg-gradient-to-r from-blue-700 to-indigo-700 px-5 py-5 text-white">
            <div className="flex items-center gap-3">
              <span className="relative grid size-10 place-items-center rounded-xl bg-white/15">
                <BotIcon />
                <span className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-blue-700 bg-emerald-400" />
              </span>
              <div>
                <strong className="block text-sm">AI Resume Coach</strong>
                <span className="block max-w-64 truncate text-[11px] text-blue-100">Discussing · {reportName}</span>
              </div>
            </div>
            <div className="flex items-center gap-2"><button type="button" onClick={() => void clearHistory()} className="rounded-lg px-2.5 py-1.5 text-[10px] font-semibold text-blue-100 transition hover:bg-white/15 hover:text-white">Clear chat</button><button
                type="button"
                onClick={() => setIsOpen(false)}
                className="grid size-8 place-items-center rounded-lg text-blue-100 transition hover:bg-white/15 hover:text-white"
                aria-label="Close AI Assistant"
              >
                <CloseIcon />
              </button></div>
          </header>

          <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50 px-5 py-6">
            {isLoadingHistory && <p className="text-center text-[10px] font-semibold text-slate-400">Loading saved conversation…</p>}
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[90%] rounded-2xl px-4 py-3 text-xs leading-5 shadow-sm sm:max-w-[82%] ${
                    message.sender === "user"
                      ? "rounded-br-md bg-blue-700 text-white"
                      : "rounded-bl-md border border-slate-200 bg-white text-slate-700"
                  }`}
                >
                  {message.sender === "assistant" ? (
                    <ReactMarkdown
                      components={{
                        h1: ({ children }) => <h3 className="mb-2 mt-3 text-sm font-bold first:mt-0">{children}</h3>,
                        h2: ({ children }) => <h3 className="mb-2 mt-3 text-sm font-bold first:mt-0">{children}</h3>,
                        h3: ({ children }) => <h3 className="mb-1.5 mt-3 text-xs font-bold first:mt-0">{children}</h3>,
                        p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                        ul: ({ children }) => <ul className="mb-2 list-disc space-y-1 pl-5 last:mb-0">{children}</ul>,
                        ol: ({ children }) => <ol className="mb-2 list-decimal space-y-1 pl-5 last:mb-0">{children}</ol>,
                        li: ({ children }) => <li className="pl-0.5">{children}</li>,
                        strong: ({ children }) => <strong className="font-bold text-slate-950">{children}</strong>,
                      }}
                    >
                      {message.text}
                    </ReactMarkdown>
                  ) : message.text}
                </div>
              </div>
            ))}
            {isSending && <div className="flex justify-start"><p className="rounded-2xl rounded-bl-md border border-slate-200 bg-white px-4 py-3 text-xs text-slate-500 shadow-sm">Thinking…</p></div>}
          </div>

          <div className="border-t border-slate-200 bg-white p-5">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
              Quick questions
            </p>
            <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
              {quickPrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => void addConversation(prompt)}
                  disabled={isSending}
                  className="shrink-0 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-[11px] font-semibold text-blue-700 transition hover:bg-blue-100"
                >
                  {prompt}
                </button>
              ))}
            </div>

            <form onSubmit={submitMessage} className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-2 focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-100">
              <input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                disabled={isSending}
                placeholder="Ask about this report..."
                className="min-w-0 flex-1 bg-transparent px-2 text-xs outline-none placeholder:text-slate-400"
                aria-label="Message AI Resume Coach"
              />
              <button
                type="submit"
                disabled={isSending || !input.trim()}
                className="grid size-9 shrink-0 place-items-center rounded-xl bg-blue-700 text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                aria-label="Send message"
              >
                <SendIcon />
              </button>
            </form>
            <p className="mt-2 text-center text-[9px] text-slate-400">
              AI suggestions can make mistakes · Review before applying
            </p>
          </div>
        </section>
      </div>}
      {!isOpen && <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex h-9 items-center gap-2 rounded-lg bg-blue-700 px-3 text-white shadow-sm shadow-blue-900/15 transition hover:bg-blue-800"
        aria-label="Open AI Resume Coach"
      >
        <span className="grid size-6 place-items-center"><BotIcon /></span>
        <strong className="text-[10px]">Ask AI</strong>
      </button>}
    </>
  );
}

function BotIcon() {
  return (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="4" y="7" width="16" height="13" rx="3" />
      <path d="M12 3v4M8 12h.01M16 12h.01M8 16h8" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <path d="m6 6 12 12M18 6 6 18" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m22 2-7 20-4-9-9-4Z" />
      <path d="M22 2 11 13" />
    </svg>
  );
}
