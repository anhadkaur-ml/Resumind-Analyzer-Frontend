"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  api,
  clearStoredSession,
  getApiErrorMessage,
  isUnauthorized,
} from "../../../../lib/api";

type SavedAnswer = {
  id: number;
  question_index: number;
  question: string;
  answer: string;
  score: number;
  feedback: string;
  evaluation_source: "groq" | "local";
};
type InterviewSession = {
  id: number;
  interview_type: string;
  target_role: string;
  experience_level: string;
  questions: string[];
  question_source: "groq" | "fallback";
  current_index: number;
  status: "in_progress" | "completed";
  overall_score: number | null;
  final_feedback: string;
  result_summary: {
    category_scores?: Record<string, number>;
    strengths?: string[];
    improvements?: string[];
    recommendations?: string[];
    answered_count?: number;
    skipped_count?: number;
    total_questions?: number;
  };
  answers: SavedAnswer[];
};

const labels: Record<string, string> = {
  behavioral: "Behavioral",
  role_specific: "Role-specific",
  technical: "Technical",
  hr_screening: "HR screening",
};

export default function InterviewPracticeSessionPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [session, setSession] = useState<InterviewSession | null>(null);
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get<InterviewSession>(`/api/interviews/sessions/${id}/`)
      .then(({ data }) => setSession(data))
      .catch((requestError) => {
        if (isUnauthorized(requestError)) {
          clearStoredSession();
          router.replace("/");
          return;
        }
        setError(
          getApiErrorMessage(
            requestError,
            "This interview session could not be loaded.",
          ),
        );
      })
      .finally(() => setLoading(false));
  }, [id, router]);

  async function submitAnswer() {
    if (!answer.trim() || !session) return;
    setSubmitting(true);
    setError("");
    try {
      // Every answer is evaluated and persisted by Django before advancing.
      const { data } = await api.post<InterviewSession>(
        `/api/interviews/sessions/${session.id}/answer/`,
        { answer: answer.trim() },
      );
      setSession(data);
      setAnswer("");
    } catch (requestError) {
      setError(
        getApiErrorMessage(requestError, "Your answer could not be saved."),
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function skipQuestion() {
    if (!session || submitting) return;
    setSubmitting(true);
    setError("");
    try {
      const { data } = await api.post<InterviewSession>(
        `/api/interviews/sessions/${session.id}/skip/`,
      );
      setSession(data);
      setAnswer("");
    } catch (requestError) {
      setError(
        getApiErrorMessage(requestError, "The question could not be skipped."),
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function endInterview() {
    if (
      !session ||
      !window.confirm(
        "End this interview now? Your submitted answers will remain saved.",
      )
    )
      return;
    setSubmitting(true);
    setError("");
    try {
      const { data } = await api.post<InterviewSession>(
        `/api/interviews/sessions/${session.id}/end/`,
      );
      setSession(data);
    } catch (requestError) {
      setError(
        getApiErrorMessage(requestError, "The interview could not be ended."),
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function retryInterview() {
    if (!session || submitting) return;
    setSubmitting(true);
    setError("");
    try {
      const { data } = await api.post<{ id: number }>("/api/interviews/sessions/", { interview_type: session.interview_type, target_role: session.target_role, experience_level: session.experience_level });
      router.push(`/employee/interview-practice/${data.id}`);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "A new interview could not be started."));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading)
    return (
      <main className="grid min-h-screen place-items-center bg-slate-50 text-sm text-slate-500">
        Loading your interview...
      </main>
    );
  if (!session)
    return (
      <main className="grid min-h-screen place-items-center bg-slate-50">
        <div className="text-center">
          <p className="text-sm text-red-600">{error}</p>
          <Link
            className="mt-4 inline-block text-sm font-bold text-blue-700"
            href="/employee/interview-practice"
          >
            Return to Interview Practice
          </Link>
        </div>
      </main>
    );

  const completed = session.status === "completed";
  const question = session.questions[session.current_index];
  return (
  const result = session.result_summary ?? {};
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <header className="border-b border-slate-200 bg-white px-5 py-4 sm:px-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-blue-700">
                Resumind Interview Practice
              </p>
              <span
                className={`rounded-full px-2 py-1 text-[8px] font-bold ${session.question_source === "groq" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}
              >
                {session.question_source === "groq"
                  ? "AI-generated questions"
                  : "Fallback questions"}
              </span>
            </div>
            <h1 className="mt-1 text-xl font-bold">
              {labels[session.interview_type]} interview · {session.target_role}
            </h1>
            <p className="mt-1 text-xs text-slate-500">
              {session.experience_level}
            </p>
          </div>
          {completed ? (
            <Link
              href="/employee/interview-practice"
              className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600"
            >
              Back to history
            </Link>
          ) : (
            <button
              type="button"
              disabled={submitting}
              onClick={() => void endInterview()}
              className="rounded-lg border border-red-200 px-4 py-2 text-xs font-bold text-red-600 disabled:opacity-50"
            >
              End interview
            </button>
          )}
        </div>
      </header>
      <div className="mx-auto max-w-6xl p-5 sm:p-8">
        {completed ? (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600">
              Interview completed
            </p>
            <div className="mt-2 flex items-end gap-2">
              <strong className="text-5xl text-blue-700">
                {session.overall_score}
              </strong>
              <span className="pb-1 text-sm text-slate-400">/100</span>
            </div>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-600">
              {session.final_feedback}
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {Object.entries(result.category_scores ?? { answer_quality: session.overall_score ?? 0, completion: 0, confidence: session.overall_score ?? 0 }).map(([name, score]) => (
                <div key={name} className="rounded-xl bg-slate-50 p-4">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">{name.replaceAll("_", " ")}</span>
                  <strong className="mt-2 block text-2xl text-blue-700">{score}<small className="text-[10px] text-slate-400">/100</small></strong>
                </div>
              ))}
            </div>
            <div className="mt-6 grid gap-4 lg:grid-cols-3">
              <ResultList title="Strengths" tone="green" items={result.strengths ?? ["Your submitted answers created a useful practice baseline."]} />
              <ResultList title="Areas to improve" tone="amber" items={result.improvements ?? ["Add clearer examples and measurable results to each answer."]} />
              <ResultList title="Recommendations" tone="blue" items={result.recommendations ?? ["Repeat the interview using the STAR answer structure."]} />
            </div>
            <div className="mt-6 flex flex-col gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div><strong className="block text-xs">Session summary</strong><span className="mt-1 block text-[10px] text-slate-600">Answered {result.answered_count ?? session.answers.filter((item) => item.answer).length} · Skipped {result.skipped_count ?? session.answers.filter((item) => !item.answer).length} · Total {result.total_questions ?? session.questions.length}</span></div>
              <button type="button" onClick={() => void retryInterview()} disabled={submitting} className="h-10 rounded-lg bg-blue-700 px-5 text-xs font-bold text-white disabled:opacity-50">{submitting ? "Preparing..." : "Retry interview"}</button>
            </div>
            <h2 className="mt-8 text-lg font-bold">Answer feedback</h2>
            <div className="mt-4 space-y-3">
              {session.answers.map((item) => (
                <article
                  key={item.id}
                  className="rounded-xl border border-slate-200 p-4"
                >
                  <div className="flex justify-between gap-4">
                    <strong className="text-sm">
                      {item.question_index + 1}. {item.question}
                    </strong>
                    <b className="text-blue-700">{item.score}/100</b>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-slate-600">
                    {item.feedback}
                  </p>
                  <span className="mt-2 inline-flex rounded-full bg-slate-50 px-2 py-1 text-[8px] font-semibold text-slate-500">
                    {item.evaluation_source === "groq"
                      ? "AI evaluation"
                      : "Local evaluation"}
                  </span>
                </article>
              ))}
            </div>
          </section>
        ) : (
          <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <span>
                  Question {session.current_index + 1} of{" "}
                  {session.questions.length}
                </span>
                <span>
                  {Math.round(
                    (session.current_index / session.questions.length) * 100,
                  )}
                  % complete
                </span>
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full bg-blue-700"
                  style={{
                    width: `${(session.current_index / session.questions.length) * 100}%`,
                  }}
                />
              </div>
              <h2 className="mt-8 text-2xl font-bold leading-9">{question}</h2>
              <label className="mt-7 block">
                <span className="text-xs font-bold">Your answer</span>
                <textarea
                  value={answer}
                  onChange={(event) => setAnswer(event.target.value)}
                  className="mt-2 h-56 w-full resize-none rounded-xl border border-slate-200 p-4 text-sm leading-6 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                  placeholder="Give a clear example, explain what you did, and describe the result..."
                />
              </label>
              {error && (
                <p className="mt-3 text-xs font-semibold text-red-600">
                  {error}
                </p>
              )}
              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-xs text-slate-400">
                  {answer.trim().split(/\s+/).filter(Boolean).length} words
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => void skipQuestion()}
                    disabled={submitting}
                    className="h-11 rounded-lg border border-slate-200 px-5 text-xs font-bold text-slate-600 disabled:opacity-50"
                  >
                    Skip question
                  </button>
                  <button
                    type="button"
                    onClick={() => void submitAnswer()}
                    disabled={!answer.trim() || submitting}
                    className="h-11 rounded-lg bg-blue-700 px-6 text-xs font-bold text-white disabled:bg-slate-300"
                  >
                    {submitting
                      ? "Saving..."
                      : session.current_index === session.questions.length - 1
                        ? "Finish interview"
                        : "Submit & continue"}
                  </button>
                </div>
              </div>
            </section>
            <aside className="h-fit rounded-2xl bg-slate-950 p-6 text-white">
              <p className="text-[10px] font-bold uppercase tracking-wider text-blue-300">
                Answer framework
              </p>
              {[
                ["S", "Situation", "Set the context"],
                ["T", "Task", "Explain your responsibility"],
                ["A", "Action", "Describe what you did"],
                ["R", "Result", "Share the outcome"],
              ].map(([letter, title, detail]) => (
                <div key={letter} className="mt-5 flex gap-3">
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-blue-700 text-xs font-bold">
                    {letter}
                  </span>
                  <div>
                    <strong className="block text-xs">{title}</strong>
                    <span className="text-[10px] text-slate-400">{detail}</span>
                  </div>
                </div>
              ))}
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}

function ResultList({ title, items, tone }: { title: string; items: string[]; tone: "green" | "amber" | "blue" }) {
  const styles = { green: "border-emerald-100 bg-emerald-50 text-emerald-800", amber: "border-amber-100 bg-amber-50 text-amber-800", blue: "border-blue-100 bg-blue-50 text-blue-800" };
  return <section className={`rounded-xl border p-4 ${styles[tone]}`}>
    <h2 className="text-xs font-bold">{title}</h2>
    <ul className="mt-3 space-y-2">{items.map((item) => <li key={item} className="flex gap-2 text-[10px] leading-4"><span>•</span><span>{item}</span></li>)}</ul>
  </section>;
}
