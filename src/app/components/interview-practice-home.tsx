"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api, clearStoredSession, getApiErrorMessage, isUnauthorized } from "../../lib/api";

type InterviewType = "behavioral" | "role_specific" | "technical" | "hr_screening";
type SessionPayload = { interview_type: InterviewType; target_role: string; experience_level: string };
type InterviewSession = SessionPayload & {
  id: number;
  current_index: number;
  questions: string[];
  status: "in_progress" | "completed";
  overall_score: number | null;
  created_at: string;
};

const quickPractices: Array<SessionPayload & { title: string; detail: string; duration: string; icon: string }> = [
  { title: "Behavioral warm-up", detail: "Practice one clear STAR response", duration: "5 min", icon: "💬", interview_type: "behavioral", target_role: "General professional", experience_level: "Mid-level (3–5 years)" },
  { title: "Technical sprint", detail: "Sharpen problem-solving answers", duration: "10 min", icon: "</>", interview_type: "technical", target_role: "Software Engineer", experience_level: "Mid-level (3–5 years)" },
  { title: "HR screening", detail: "Prepare your introduction and goals", duration: "8 min", icon: "HR", interview_type: "hr_screening", target_role: "General professional", experience_level: "Entry level (0–2 years)" },
];

const interviewTypes: Array<{ label: string; value: InterviewType; detail: string }> = [
  { label: "Behavioral", value: "behavioral", detail: "Experience and workplace situations" },
  { label: "Role-specific", value: "role_specific", detail: "Questions tailored to your target role" },
  { label: "Technical", value: "technical", detail: "Skills and problem-solving questions" },
  { label: "HR screening", value: "hr_screening", detail: "Introduction, goals and culture fit" },
];

const targetRoles = ["Software Engineer", "Frontend Developer", "Backend Developer", "Full Stack Developer", "Python Developer", "Data Analyst", "Data Scientist", "Machine Learning Engineer", "DevOps Engineer", "UI/UX Designer", "Product Designer", "Product Manager", "Business Analyst", "HR Executive"];

export function InterviewPracticeHome() {
  const router = useRouter();
  const [type, setType] = useState<InterviewType>("behavioral");
  const [role, setRole] = useState("Product Designer");
  const [customRole, setCustomRole] = useState("");
  const [experience, setExperience] = useState("Mid-level (3–5 years)");
  const [busyKey, setBusyKey] = useState("");
  const [error, setError] = useState("");
  const [sessions, setSessions] = useState<InterviewSession[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState("");

  useEffect(() => {
    async function loadSessions() {
      try {
        const { data } = await api.get<InterviewSession[]>("/api/interviews/sessions/");
        setSessions(data);
      } catch (requestError) {
        if (isUnauthorized(requestError)) {
          clearStoredSession();
          router.replace("/");
          return;
        }
        setHistoryError(getApiErrorMessage(requestError, "Recent practice sessions could not be loaded."));
      } finally {
        setHistoryLoading(false);
      }
    }
    void loadSessions();
  }, [router]);

  async function createSession(payload: SessionPayload, key: string) {
    setBusyKey(key);
    setError("");
    try {
      const { data } = await api.post<{ id: number }>("/api/interviews/sessions/", payload);
      router.push(`/employee/interview-practice/${data.id}`);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "The interview could not be started. Please try again."));
    } finally {
      setBusyKey("");
    }
  }

  function startCustomSession() {
    const selectedRole = role === "Other" ? customRole.trim() : role;
    if (!selectedRole) return;
    void createSession({ interview_type: type, target_role: selectedRole, experience_level: experience }, "custom");
  }

  return (
    <div className="space-y-5">
      <section>
        <div className="flex items-end justify-between gap-4">
          <div><p className="text-[9px] font-bold uppercase tracking-[0.16em] text-blue-600">Quick Practice</p><h2 className="mt-1 text-lg font-bold">Start with one click</h2><p className="mt-1 text-[10px] text-slate-500">Choose a focused practice session using ready-made settings.</p></div>
          <span className="hidden text-[9px] font-semibold text-slate-400 sm:block">Questions are generated when you begin</span>
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          {quickPractices.map((practice) => {
            const key = `quick-${practice.interview_type}`;
            return <button key={practice.title} type="button" disabled={Boolean(busyKey)} onClick={() => void createSession(practice, key)} className="group flex min-h-28 items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md disabled:cursor-wait disabled:opacity-60"><span className="grid size-11 shrink-0 place-items-center rounded-xl bg-blue-50 text-xs font-black text-blue-700 group-hover:bg-blue-700 group-hover:text-white">{practice.icon}</span><span className="min-w-0 flex-1"><strong className="block text-xs">{practice.title}</strong><small className="mt-1 block text-[9px] leading-4 text-slate-500">{practice.detail}</small><span className="mt-2 inline-flex rounded-full bg-slate-100 px-2 py-1 text-[8px] font-bold text-slate-500">{busyKey === key ? "Preparing…" : practice.duration}</span></span><span className="text-lg text-slate-300 group-hover:text-blue-700">›</span></button>;
          })}
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1fr_340px]">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
          <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-blue-600">Custom session</p><h2 className="mt-1 text-xl font-bold">Set up your interview</h2><p className="mt-1 text-[10px] text-slate-500">Choose the format, role and experience level for tailored questions.</p>
          <fieldset className="mt-6"><legend className="text-[10px] font-bold text-slate-700">Interview type</legend><div className="mt-3 grid gap-3 sm:grid-cols-2">{interviewTypes.map((item) => <button key={item.value} type="button" onClick={() => setType(item.value)} aria-pressed={type === item.value} className={`rounded-xl border p-4 text-left transition ${type === item.value ? "border-blue-600 bg-blue-50 ring-2 ring-blue-100" : "border-slate-200 hover:border-blue-200"}`}><strong className="block text-[11px]">{item.label}</strong><small className="mt-1 block text-[9px] text-slate-500">{item.detail}</small></button>)}</div></fieldset>
          <div className="mt-6 grid gap-5 sm:grid-cols-2"><label><span className="text-[10px] font-bold text-slate-700">Target role</span><select value={role} onChange={(event) => setRole(event.target.value)} className="mt-2 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs outline-none focus:border-blue-400">{targetRoles.map((targetRole) => <option key={targetRole}>{targetRole}</option>)}<option>Other</option></select>{role === "Other" && <input value={customRole} onChange={(event) => setCustomRole(event.target.value)} placeholder="Enter your target role" className="mt-2 h-11 w-full rounded-lg border border-slate-200 px-3 text-xs outline-none focus:border-blue-400" />}</label><label><span className="text-[10px] font-bold text-slate-700">Experience level</span><select value={experience} onChange={(event) => setExperience(event.target.value)} className="mt-2 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs outline-none focus:border-blue-400"><option>Entry level (0–2 years)</option><option>Mid-level (3–5 years)</option><option>Senior (6–9 years)</option><option>Lead / Manager (10+ years)</option></select></label></div>
          <div className="mt-7 flex flex-col gap-4 rounded-xl bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between"><div><strong className="block text-[11px]">Ready to begin?</strong><p className="mt-1 text-[9px] text-slate-500">8 questions · Approximately 20 minutes</p></div><button type="button" disabled={Boolean(busyKey) || (role === "Other" && !customRole.trim())} onClick={startCustomSession} className="h-11 rounded-lg bg-blue-700 px-6 text-xs font-bold text-white shadow-md hover:bg-blue-800 disabled:bg-slate-300">{busyKey === "custom" ? "Preparing questions…" : "Start interview"}</button></div>
          {error && <p role="alert" className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-[10px] font-semibold text-red-700">{error}</p>}
        </div>
        <aside className="h-fit rounded-2xl bg-slate-950 p-6 text-white shadow-sm"><p className="text-[9px] font-bold uppercase tracking-wider text-blue-300">How it works</p><h2 className="mt-2 text-lg font-bold">Focused practice, useful feedback</h2><div className="mt-5 space-y-5">{[["1", "Choose a session", "Use Quick Practice or customize it."], ["2", "Answer each question", "Structure responses with the STAR method."], ["3", "Review your feedback", "See scores and clear improvement tips."]].map(([number, title, detail]) => <div key={number} className="flex gap-3"><span className="grid size-8 shrink-0 place-items-center rounded-lg bg-blue-700 text-xs font-bold">{number}</span><div><strong className="block text-xs">{title}</strong><p className="mt-1 text-[9px] leading-4 text-slate-400">{detail}</p></div></div>)}</div></aside>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-2 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div><p className="text-[9px] font-bold uppercase tracking-[0.16em] text-blue-600">Practice history</p><h2 className="mt-1 text-lg font-bold">Recent Practice</h2><p className="mt-1 text-[10px] text-slate-500">Resume unfinished sessions or review feedback from completed interviews.</p></div>
          {sessions.length > 0 && <span className="w-fit rounded-full bg-blue-50 px-2.5 py-1 text-[9px] font-bold text-blue-700">{sessions.length} {sessions.length === 1 ? "session" : "sessions"}</span>}
        </div>

        {historyLoading ? (
          <div className="grid min-h-40 place-items-center text-xs font-semibold text-slate-400">Loading recent practice…</div>
        ) : historyError ? (
          <div className="px-6 py-10 text-center"><p className="text-xs font-semibold text-red-600">{historyError}</p><button type="button" onClick={() => window.location.reload()} className="mt-3 text-[10px] font-bold text-blue-700">Try again</button></div>
        ) : sessions.length === 0 ? (
          <div className="grid min-h-48 place-items-center px-5 text-center"><div><span className="mx-auto grid size-11 place-items-center rounded-xl bg-blue-50 text-lg text-blue-700">▶</span><h3 className="mt-4 text-sm font-bold">No practice sessions yet</h3><p className="mt-1 text-[10px] text-slate-500">Start a Quick Practice session and your progress will appear here.</p></div></div>
        ) : (
          <div className="divide-y divide-slate-100">
            {sessions.slice(0, 5).map((session) => {
              const completed = session.status === "completed";
              const progress = session.questions.length ? Math.round((session.current_index / session.questions.length) * 100) : 0;
              const date = new Date(session.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
              const typeLabel = interviewTypes.find((item) => item.value === session.interview_type)?.label ?? "Interview";
              return <article key={session.id} className="grid gap-4 px-5 py-4 transition hover:bg-slate-50/70 sm:grid-cols-[1fr_150px_110px] sm:items-center sm:px-6">
                <div className="flex min-w-0 items-center gap-3"><span className={`grid size-10 shrink-0 place-items-center rounded-xl text-xs font-bold ${completed ? "bg-emerald-50 text-emerald-700" : "bg-blue-50 text-blue-700"}`}>{completed ? "✓" : "▶"}</span><div className="min-w-0"><strong className="block truncate text-xs">{typeLabel} · {session.target_role}</strong><span className="mt-1 block text-[9px] text-slate-500">{session.experience_level} · {date}</span></div></div>
                <div>{completed ? <div><span className="text-[9px] font-semibold text-slate-400">Final score</span><strong className="mt-1 block text-lg text-emerald-700">{session.overall_score ?? "—"}<small className="text-[9px] text-slate-400">/100</small></strong></div> : <div><div className="flex justify-between text-[9px]"><span className="font-semibold text-slate-500">In progress</span><b>{progress}%</b></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-blue-600" style={{ width: `${progress}%` }} /></div></div>}</div>
                <button type="button" onClick={() => router.push(`/employee/interview-practice/${session.id}`)} className={`h-9 rounded-lg px-4 text-[10px] font-bold ${completed ? "border border-slate-200 bg-white text-slate-700 hover:border-blue-300" : "bg-blue-700 text-white hover:bg-blue-800"}`}>{completed ? "Review" : "Resume"}</button>
              </article>;
            })}
          </div>
        )}
      </section>
    </div>
  );
}
