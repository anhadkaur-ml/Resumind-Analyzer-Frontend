"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  api,
  clearStoredSession,
  getApiErrorMessage,
  isUnauthorized,
} from "../../lib/api";

type InterviewType =
  "behavioral" | "role_specific" | "technical" | "hr_screening";
type InterviewView = "dashboard" | "quick" | "setup" | "history";
type SessionPayload = {
  interview_type: InterviewType;
  target_role: string;
  experience_level: string;
  question_count: 5 | 10 | 15 | 20;
  resume_id?: number;
};
type InterviewSession = SessionPayload & {
  id: number;
  current_index: number;
  questions: string[];
  status: "in_progress" | "completed";
  overall_score: number | null;
  created_at: string;
  resume_title?: string;
};
type SavedResume = {
  id: number;
  title: string;
  target_role: string;
  status: "Draft" | "Completed";
  skill_items: string[];
};

const types: Array<{ label: string; value: InterviewType; detail: string }> = [
  {
    label: "Behavioral",
    value: "behavioral",
    detail: "Experience and workplace situations",
  },
  {
    label: "Role-specific",
    value: "role_specific",
    detail: "Questions tailored to your target role",
  },
  {
    label: "Technical",
    value: "technical",
    detail: "Skills and problem-solving questions",
  },
  {
    label: "HR screening",
    value: "hr_screening",
    detail: "Introduction, goals and culture fit",
  },
];
const quick: Array<
  SessionPayload & {
    title: string;
    detail: string;
    duration: string;
    icon: string;
  }
> = [
  {
    title: "Behavioral warm-up",
    detail: "Practice clear STAR-based responses",
    duration: "5 questions",
    icon: "B",
    interview_type: "behavioral",
    target_role: "General professional",
    experience_level: "Mid-level (3–5 years)",
    question_count: 5,
  },
  {
    title: "Technical sprint",
    detail: "Sharpen technical and problem-solving answers",
    duration: "10 questions",
    icon: "T",
    interview_type: "technical",
    target_role: "Software Engineer",
    experience_level: "Mid-level (3–5 years)",
    question_count: 10,
  },
  {
    title: "HR screening",
    detail: "Prepare your introduction and career goals",
    duration: "5 questions",
    icon: "HR",
    interview_type: "hr_screening",
    target_role: "General professional",
    experience_level: "Entry level (0–2 years)",
    question_count: 5,
  },
];
const roles = [
  "Software Engineer",
  "Frontend Developer",
  "Backend Developer",
  "Full Stack Developer",
  "Python Developer",
  "Data Analyst",
  "Data Scientist",
  "Machine Learning Engineer",
  "DevOps Engineer",
  "UI/UX Designer",
  "Product Designer",
  "Product Manager",
  "Business Analyst",
  "HR Executive",
];

export function InterviewPracticeHome({
  view = "dashboard",
}: {
  view?: InterviewView;
}) {
  const router = useRouter();
  const [sessions, setSessions] = useState<InterviewSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [historyError, setHistoryError] = useState("");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [type, setType] = useState<InterviewType>("behavioral");
  const [role, setRole] = useState("Software Engineer");
  const [customRole, setCustomRole] = useState("");
  const [experience, setExperience] = useState("Mid-level (3–5 years)");
  const [questionCount, setQuestionCount] = useState<5 | 10 | 15 | 20>(10);
  const [savedResumes, setSavedResumes] = useState<SavedResume[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState("");
  const [resumesLoading, setResumesLoading] = useState(true);
  const [historySearch, setHistorySearch] = useState("");
  const [historyStatus, setHistoryStatus] = useState<"all" | "in_progress" | "completed">("all");
  const [historyType, setHistoryType] = useState<"all" | InterviewType>("all");
  const [historySort, setHistorySort] = useState<"newest" | "oldest">("newest");
  const [lastAttempt, setLastAttempt] = useState<SessionPayload | null>(null);

  useEffect(() => {
    api
      .get<InterviewSession[]>("/api/interviews/sessions/")
      .then(({ data }) => setSessions(data))
      .catch((requestError) => {
        if (isUnauthorized(requestError)) {
          clearStoredSession();
          router.replace("/");
          return;
        }
        setHistoryError(
          getApiErrorMessage(
            requestError,
            "Practice sessions could not be loaded.",
          ),
        );
      })
      .finally(() => setLoading(false));
  }, [router]);

  useEffect(() => {
    api
      .get<SavedResume[]>("/api/resumes/builder/")
      .then(({ data }) =>
        setSavedResumes(data.filter((resume) => resume.status === "Completed")),
      )
      .catch(() => setSavedResumes([]))
      .finally(() => setResumesLoading(false));
  }, []);

  const stats = useMemo(() => {
    const completed = sessions.filter((item) => item.status === "completed");
    const scores = completed
      .map((item) => item.overall_score)
      .filter((score): score is number => score !== null);
    return {
      completed: completed.length,
      active: sessions.length - completed.length,
      average: scores.length
        ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
        : 0,
    };
  }, [sessions]);

  const filteredSessions = useMemo(() => {
    const query = historySearch.trim().toLowerCase();
    return sessions
      .filter((session) => historyStatus === "all" || session.status === historyStatus)
      .filter((session) => historyType === "all" || session.interview_type === historyType)
      .filter((session) => !query || [session.target_role, session.experience_level, session.resume_title ?? "", types.find((item) => item.value === session.interview_type)?.label ?? ""].some((value) => value.toLowerCase().includes(query)))
      .sort((first, second) => historySort === "newest" ? new Date(second.created_at).getTime() - new Date(first.created_at).getTime() : new Date(first.created_at).getTime() - new Date(second.created_at).getTime());
  }, [historySearch, historySort, historyStatus, historyType, sessions]);

  async function start(payload: SessionPayload, key: string) {
    setLastAttempt(payload);
    setBusy(key);
    setError("");
    try {
      const { data } = await api.post<{ id: number }>(
        "/api/interviews/sessions/",
        payload,
      );
      router.push(`/employee/interview-practice/${data.id}`);
    } catch (requestError) {
      setError(
        getApiErrorMessage(
          requestError,
          "The interview could not be started. Please try again.",
        ),
      );
    } finally {
      setBusy("");
    }
  }

  async function deleteSession(sessionId: number) {
    if (!window.confirm("Delete this interview session and all of its saved answers? This cannot be undone.")) return;
    setHistoryError("");
    try {
      await api.delete(`/api/interviews/sessions/${sessionId}/`);
      setSessions((current) => current.filter((session) => session.id !== sessionId));
    } catch (requestError) {
      setHistoryError(getApiErrorMessage(requestError, "The interview session could not be deleted. Please try again."));
    }
  }

  if (view === "quick")
    return (
      <Page
        title="Quick Practice"
        subtitle="Start a short, focused session using ready-made settings."
      >
        <div className="grid gap-4 md:grid-cols-3">
          {quick.map((item) => {
            const key = `quick-${item.interview_type}`;
            return (
              <button
                key={item.title}
                disabled={Boolean(busy)}
                onClick={() => void start(item, key)}
                className="group rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md disabled:opacity-60"
              >
                <span className="grid size-11 place-items-center rounded-xl bg-blue-50 text-xs font-black text-blue-700">
                  {item.icon}
                </span>
                <strong className="mt-5 block text-sm">{item.title}</strong>
                <p className="mt-2 min-h-10 text-[10px] leading-5 text-slate-500">
                  {item.detail}
                </p>
                <div className="mt-5 flex justify-between">
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[9px] font-bold text-slate-500">
                    {item.duration}
                  </span>
                  <b className="text-[10px] text-blue-700">
                    {busy === key ? "Preparing…" : "Start →"}
                  </b>
                </div>
              </button>
            );
          })}
        </div>
        {error && <Error text={error} retry={lastAttempt ? () => void start(lastAttempt,"retry") : undefined} busy={Boolean(busy)} />}
      </Page>
    );

  if (view === "setup") {
    const selectedRole = role === "Other" ? customRole.trim() : role;
    return (
      <Page
        title="Set up an Interview"
        subtitle="Customize the interview type, target role, and experience level."
      >
        <div className="grid gap-5 xl:grid-cols-[1fr_320px]">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
            <fieldset>
              <legend className="text-[10px] font-bold">Interview type</legend>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {types.map((item) => (
                  <button
                    key={item.value}
                    onClick={() => setType(item.value)}
                    className={`rounded-xl border p-4 text-left ${type === item.value ? "border-blue-600 bg-blue-50 ring-2 ring-blue-100" : "border-slate-200"}`}
                  >
                    <strong className="block text-[11px]">{item.label}</strong>
                    <small className="mt-1 block text-[9px] text-slate-500">
                      {item.detail}
                    </small>
                  </button>
                ))}
              </div>
            </fieldset>
            <div className="mt-6 grid gap-5 sm:grid-cols-3">
              <label>
                <b className="text-[10px]">Target role</b>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="mt-2 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs"
                >
                  {roles.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                  <option>Other</option>
                </select>
                {role === "Other" && (
                  <input
                    value={customRole}
                    onChange={(e) => setCustomRole(e.target.value)}
                    placeholder="Enter your target role"
                    className="mt-2 h-11 w-full rounded-lg border border-slate-200 px-3 text-xs"
                  />
                )}
              </label>
              <label>
                <b className="text-[10px]">Experience level</b>
                <select
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  className="mt-2 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs"
                >
                  <option>Entry level (0–2 years)</option>
                  <option>Mid-level (3–5 years)</option>
                  <option>Senior (6–9 years)</option>
                  <option>Lead / Manager (10+ years)</option>
                </select>
              </label>
              <label>
                <b className="text-[10px]">Number of questions</b>
                <select
                  value={questionCount}
                  onChange={(e) =>
                    setQuestionCount(Number(e.target.value) as 5 | 10 | 15 | 20)
                  }
                  className="mt-2 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs"
                >
                  <option value={5}>5 questions</option>
                  <option value={10}>10 questions</option>
                  <option value={15}>15 questions</option>
                  <option value={20}>20 questions</option>
                </select>
              </label>
            </div>
            <label className="mt-5 block">
              <b className="text-[10px]">
                Use a saved resume{" "}
                <span className="font-normal text-slate-400">(optional)</span>
              </b>
              <select
                value={selectedResumeId}
                onChange={(event) => setSelectedResumeId(event.target.value)}
                disabled={resumesLoading}
                className="mt-2 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs disabled:bg-slate-50"
              >
                <option value="">
                  {resumesLoading
                    ? "Loading saved resumes…"
                    : "No resume — generate general questions"}
                </option>
                {savedResumes.map((resume) => (
                  <option key={resume.id} value={resume.id}>
                    {resume.title}
                    {resume.target_role ? ` — ${resume.target_role}` : ""}
                  </option>
                ))}
              </select>
              <span className="mt-1.5 block text-[9px] text-slate-500">
                Selecting a resume lets the AI ask about your actual skills,
                projects, and experience.
              </span>
            </label>
            <div className="mt-7 flex items-center justify-between rounded-xl bg-slate-50 p-4">
              <div>
                <strong className="text-xs">Ready to begin?</strong>
                <p className="mt-1 text-[9px] text-slate-500">
                  {questionCount} questions will be generated for your
                  selections.
                </p>
              </div>
              <button
                disabled={Boolean(busy) || !selectedRole}
                onClick={() =>
                  void start(
                    {
                      interview_type: type,
                      target_role: selectedRole,
                      experience_level: experience,
                      question_count: questionCount,
                      ...(selectedResumeId
                        ? { resume_id: Number(selectedResumeId) }
                        : {}),
                    },
                    "custom",
                  )
                }
                className="h-11 rounded-lg bg-blue-700 px-6 text-xs font-bold text-white disabled:bg-slate-300"
              >
                {busy ? "Preparing…" : "Start interview"}
              </button>
            </div>
            {error && <Error text={error} retry={lastAttempt ? () => void start(lastAttempt,"retry") : undefined} busy={Boolean(busy)} />}
          </section>
          <aside className="h-fit rounded-2xl bg-slate-950 p-6 text-white">
            <p className="text-[9px] font-bold uppercase tracking-wider text-blue-300">
              Session preview
            </p>
            <h3 className="mt-2 text-lg font-bold">
              {types.find((item) => item.value === type)?.label} Interview
            </h3>
            <Preview
              label="Target role"
              value={selectedRole || "Not selected"}
            />
            <Preview label="Experience" value={experience} />
            <Preview
              label="Resume context"
              value={
                savedResumes.find(
                  (resume) => resume.id === Number(selectedResumeId),
                )?.title ?? "Not selected"
              }
            />
            <Preview label="Questions" value={`${questionCount} questions`} />
            <Preview label="Format" value="One question at a time" />
            <Preview label="Feedback" value="Scores and improvement tips" />
          </aside>
        </div>
      </Page>
    );
  }

  if (view === "history")
    return (
      <Page
        title="Interview History"
        subtitle="Resume unfinished sessions and review completed interview feedback."
      >
        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid gap-3 md:grid-cols-[1fr_170px_170px_150px]">
            <label><span className="sr-only">Search interview history</span><input value={historySearch} onChange={(event) => setHistorySearch(event.target.value)} placeholder="Search by role, type, or resume…" className="h-10 w-full rounded-lg border border-slate-200 px-3 text-xs outline-none focus:border-blue-400" /></label>
            <label><span className="sr-only">Filter by status</span><select value={historyStatus} onChange={(event) => setHistoryStatus(event.target.value as "all" | "in_progress" | "completed")} className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs"><option value="all">All statuses</option><option value="in_progress">In progress</option><option value="completed">Completed</option></select></label>
            <label><span className="sr-only">Filter by interview type</span><select value={historyType} onChange={(event) => setHistoryType(event.target.value as "all" | InterviewType)} className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs"><option value="all">All types</option>{types.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
            <label><span className="sr-only">Sort interview history</span><select value={historySort} onChange={(event) => setHistorySort(event.target.value as "newest" | "oldest")} className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs"><option value="newest">Newest first</option><option value="oldest">Oldest first</option></select></label>
          </div>
          <div className="mt-3 flex items-center justify-between text-[9px] text-slate-500"><span>Showing {filteredSessions.length} of {sessions.length} sessions</span>{(historySearch || historyStatus !== "all" || historyType !== "all" || historySort !== "newest") && <button type="button" onClick={() => { setHistorySearch(""); setHistoryStatus("all"); setHistoryType("all"); setHistorySort("newest"); }} className="font-bold text-blue-700">Clear filters</button>}</div>
        </section>
        <History
          sessions={filteredSessions}
          loading={loading}
          error={historyError}
          all
          onDeleted={deleteSession}
          emptyText={sessions.length ? "No interview sessions match your current filters." : undefined}
        />
      </Page>
    );

  return (
    <div className="space-y-5">
      <section className="rounded-2xl bg-gradient-to-r from-slate-950 to-blue-950 p-6 text-white shadow-sm sm:p-8">
        <p className="text-[9px] font-bold uppercase tracking-[.18em] text-blue-300">
          AI-guided interview preparation
        </p>
        <h2 className="mt-2 text-2xl font-bold">
          Practice with purpose. Interview with confidence.
        </h2>
        <p className="mt-2 max-w-2xl text-xs leading-5 text-slate-300">
          Choose a quick session or build a tailored interview for your target
          role and experience level.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/employee/interview-practice/setup"
            className="rounded-lg bg-blue-600 px-5 py-3 text-xs font-bold"
          >
            Start new interview
          </Link>
          <Link
            href="/employee/interview-practice/quick"
            className="rounded-lg border border-white/20 bg-white/10 px-5 py-3 text-xs font-bold"
          >
            Quick practice
          </Link>
        </div>
      </section>
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="flex flex-col gap-2 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-bold">
              Choose how you want to practice
            </h2>
            <p className="mt-1 text-[10px] text-slate-500">
              Start quickly, customize an interview, or continue from your
              history.
            </p>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-[9px] text-slate-500">
            <span>
              <b className="text-slate-900">{stats.completed}</b> completed
            </span>
            <span>
              <b className="text-slate-900">
                {stats.average ? `${stats.average}%` : "—"}
              </b>{" "}
              average
            </span>
            <span>
              <b className="text-slate-900">{stats.active}</b> in progress
            </span>
          </div>
        </div>
        <nav
          className="grid divide-y divide-slate-100 sm:grid-cols-3 sm:divide-x sm:divide-y-0"
          aria-label="Interview practice pages"
        >
          <PracticeButton
            href="/employee/interview-practice/quick"
            icon="⚡"
            title="Quick Practice"
            detail="Start a short preset session"
          />
          <PracticeButton
            href="/employee/interview-practice/setup"
            icon="◎"
            title="Interview Preparation"
            detail="Create a tailored interview"
          />
          <PracticeButton
            href="/employee/interview-practice/history"
            icon="↗"
            title="Interview History"
            detail="Resume or review sessions"
          />
        </nav>
      </section>
      <section>
        <div className="mb-3 flex items-end justify-between">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-wider text-blue-600">
              Latest activity
            </p>
            <h2 className="mt-1 text-lg font-bold">Recent Practice</h2>
          </div>
          <Link
            href="/employee/interview-practice/history"
            className="text-[10px] font-bold text-blue-700"
          >
            View all history →
          </Link>
        </div>
        <History
          sessions={sessions.slice(0, 3)}
          loading={loading}
          error={historyError}
          onDeleted={deleteSession}
        />
      </section>
    </div>
  );
}

function Page({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between">
        <div>
          <Link
            href="/employee/interview-practice"
            className="text-[10px] font-bold text-blue-700"
          >
            ← Interview Practice
          </Link>
          <h2 className="mt-2 text-2xl font-bold">{title}</h2>
          <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
        </div>
        <Link
          href="/employee/interview-practice/history"
          className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-[10px] font-bold text-slate-600"
        >
          View history
        </Link>
      </div>
      {children}
    </div>
  );
}
function History({
  sessions,
  loading,
  error,
  all = false,
  onDeleted,
  emptyText,
}: {
  sessions: InterviewSession[];
  loading: boolean;
  error: string;
  all?: boolean;
  onDeleted?: (sessionId: number) => Promise<void>;
  emptyText?: string;
}) {
  const router = useRouter();
  if (loading) return <Empty text="Loading practice history…" />;
  if (error) return <Error text={error} />;
  if (!sessions.length)
    return (
      <Empty text={emptyText ?? "No practice sessions yet. Start an interview to see it here."} />
    );
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="divide-y divide-slate-100">
        {(all ? sessions : sessions.slice(0, 3)).map((item) => {
          const done = item.status === "completed";
          const progress = item.questions.length
            ? Math.round((item.current_index / item.questions.length) * 100)
            : 0;
          return (
            <article
              key={item.id}
              className="grid gap-4 px-5 py-4 hover:bg-slate-50 sm:grid-cols-[1fr_150px_180px] sm:items-center"
            >
              <div>
                <strong className="text-xs">
                  {
                    types.find((type) => type.value === item.interview_type)
                      ?.label
                  }{" "}
                  · {item.target_role}
                </strong>
                <span className="mt-1 block text-[9px] text-slate-500">
                  {item.experience_level} ·{" "}
                  {new Date(item.created_at).toLocaleDateString()}
                </span>
                {item.resume_title && (
                  <span className="mt-1 block text-[9px] font-semibold text-blue-700">
                    Resume: {item.resume_title}
                  </span>
                )}
              </div>
              <div>
                {done ? (
                  <strong className="text-lg text-emerald-700">
                    {item.overall_score ?? "—"}
                    <small className="text-[9px] text-slate-400">/100</small>
                  </strong>
                ) : (
                  <>
                    <div className="flex justify-between text-[9px]">
                      <span>In progress</span>
                      <b>{progress}%</b>
                    </div>
                    <div className="mt-2 h-1.5 rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-blue-600"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </>
                )}
              </div>
              <div className="flex justify-end gap-2"><button onClick={() => router.push(`/employee/interview-practice/${item.id}`)} className={`h-9 rounded-lg px-4 text-[10px] font-bold ${done ? "border border-slate-200" : "bg-blue-700 text-white"}`}>{done ? "Review" : "Resume"}</button>{all && onDeleted && <button type="button" onClick={() => void onDeleted(item.id)} className="h-9 rounded-lg border border-red-100 px-3 text-[10px] font-bold text-red-600 hover:bg-red-50">Delete</button>}</div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
function PracticeButton({
  href,
  icon,
  title,
  detail,
}: {
  href: string;
  icon: string;
  title: string;
  detail: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 px-5 py-4 transition hover:bg-blue-50/60"
    >
      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-blue-50 text-sm font-bold text-blue-700 group-hover:bg-blue-700 group-hover:text-white">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <strong className="block text-xs">{title}</strong>
        <small className="mt-1 block text-[9px] text-slate-500">{detail}</small>
      </span>
      <span className="text-lg text-slate-300 group-hover:text-blue-700">
        ›
      </span>
    </Link>
  );
}
function Preview({ label, value }: { label: string; value: string }) {
  return (
    <div className="mt-4 flex justify-between gap-4 border-b border-white/10 pb-3">
      <span className="text-[9px] text-slate-400">{label}</span>
      <strong className="text-right text-[10px]">{value}</strong>
    </div>
  );
}
function Empty({ text }: { text: string }) {
  return (
    <div className="grid min-h-36 place-items-center rounded-2xl border border-slate-200 bg-white px-6 text-center text-xs text-slate-500">
      {text}
    </div>
  );
}
function Error({ text, retry, busy=false }: { text: string; retry?:()=>void; busy?:boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-red-50 px-4 py-3 text-[10px] font-semibold text-red-700"><span>{text}</span>{retry&&<button type="button" disabled={busy} onClick={retry} className="shrink-0 rounded-lg border border-red-200 bg-white px-3 py-2 font-bold disabled:opacity-50">{busy?"Retrying…":"Retry"}</button>}</div>
  );
}
