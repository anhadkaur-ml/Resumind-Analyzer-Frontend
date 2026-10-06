"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChangeEvent, DragEvent, useEffect, useRef, useState } from "react";
import { api, clearStoredSession, getApiErrorMessage, isUnauthorized } from "../../lib/api";
import { NotificationBell } from "./notification-bell";
type Profile = { full_name: string; email: string; role: "employee" | "hr" };
type DetailedReport = { summary: string; strengths: string[]; weaknesses: string[]; matched_keywords: string[]; missing_keywords: string[]; section_feedback: { section: string; feedback: string }[]; ats_issues: string[]; bullet_rewrites: string[]; improved_summary: string; action_plan: string[] };
type Analysis = { id: number; original_filename: string; job_title: string; overall_score: number; impact_score: number; clarity_score: number; ats_score: number; status: string; recommendations: string[]; detailed_report: DetailedReport; created_at: string };
type BuilderResumeSource = { id: number; title: string; target_role: string; completion: number };
type IconName = "home" | "document" | "chart" | "versions" | "calendar" | "spark" | "settings" | "help" | "bell" | "upload" | "shield" | "check" | "arrow" | "file" | "target" | "history";

const navigation: { label: string; icon: IconName; href?: string; badge?: string }[] = [
  { label: "Overview", icon: "home", href: "/employee/dashboard" },
  { label: "Resume Analyzer", icon: "document", href: "/employee/resume-analyzer" },
  { label: "Compare Resumes", icon: "versions", href: "/employee/compare-resumes" },
  { label: "Resume Builder", icon: "document", href: "/employee/resume-builder" },
  { label: "Interview Practice", icon: "calendar", href: "/employee/interview-practice" },
];

export function ResumeAnalyzer() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [builderResume, setBuilderResume] = useState<BuilderResumeSource | null>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(0);
  const [jobTitle, setJobTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    const role = localStorage.getItem("userRole") ?? sessionStorage.getItem("userRole");
    const token = localStorage.getItem("accessToken") ?? sessionStorage.getItem("accessToken");
    if (!token || role !== "employee") { router.replace(role === "hr" ? "/hr/dashboard" : "/"); return; }
    api.get<Profile>("/api/auth/profile/")
      .then(({ data: user }) => { if (user.role !== "employee") router.replace("/hr/dashboard"); else setProfile(user); })
      .catch((reason) => { if (isUnauthorized(reason)) { clearSession(); router.replace("/"); } });
  }, [router]);

  useEffect(() => {
    // Resume Builder passes only its database ID; Django still verifies ownership.
    const builderResumeId = new URLSearchParams(window.location.search).get("builderResumeId");
    if (!builderResumeId) return;
    api.get<BuilderResumeSource>(`/api/resumes/builder/${builderResumeId}/`)
      .then(({data})=>{setBuilderResume(data);setJobTitle((current)=>current||data.target_role);setFile(null);})
      .catch((reason)=>setError(getApiErrorMessage(reason,"The selected Builder resume could not be loaded.")));
  }, []);

  function clearSession() { clearStoredSession(); }
  function logout() { clearSession(); router.replace("/"); router.refresh(); }
  function selectFile(candidate?: File) {
    setError(""); setProgress(0); setAnalysis(null);
    if (!candidate) return;
    const extension = candidate.name.split(".").pop()?.toLowerCase();
    if (!extension || !["pdf", "doc", "docx"].includes(extension)) { setError("Please upload a PDF, DOC, or DOCX file."); setFile(null); return; }
    if (candidate.size > 10 * 1024 * 1024) { setError("Your file is larger than the 10 MB limit."); setFile(null); return; }
    setFile(candidate); setBuilderResume(null);
  }
  function onInput(event: ChangeEvent<HTMLInputElement>) { selectFile(event.target.files?.[0]); }
  function onDrop(event: DragEvent<HTMLDivElement>) { event.preventDefault(); setDragging(false); selectFile(event.dataTransfer.files[0]); }
  async function analyze() {
    if ((!file && !builderResume) || !jobTitle.trim() || isAnalyzing) return;
    setError(""); setAnalysis(null); setProgress(20); setIsAnalyzing(true);
    try {
      const response = builderResume
        ? await api.post<Analysis>(`/api/resumes/builder/${builderResume.id}/analyze/`, {job_title:jobTitle.trim(),job_description:jobDescription.trim()})
        : await api.post<Analysis>("/api/resumes/analyses/", (()=>{const body=new FormData();body.append("resume",file as File);body.append("job_title",jobTitle.trim());body.append("job_description",jobDescription.trim());return body;})(), {
            onUploadProgress: (event) => {if (event.total) setProgress(Math.min(60,20+Math.round((event.loaded/event.total)*40)));},
          });
      setProgress(70);
      setAnalysis(response.data); setProgress(100);
      router.push(`/employee/reports/${response.data.id}`);
    } catch (reason) {
      if (isUnauthorized(reason)) { clearSession(); router.replace("/"); return; }
      setProgress(0); setError(getApiErrorMessage(reason, "Unable to analyze this resume."));
    } finally {
      setIsAnalyzing(false);
    }
  }
  const initials = profile?.full_name.split(" ").map((part) => part[0]).slice(0, 2).join("").toUpperCase() || "EU";

  return <main className="min-h-screen bg-[#f7f8fa] text-slate-950">
    <div className="grid min-h-screen lg:grid-cols-[230px_1fr]">
      <aside className="flex flex-col border-b border-slate-200 bg-white px-4 py-4 lg:fixed lg:inset-y-0 lg:w-[230px] lg:border-b-0 lg:border-r">
        <Brand />
        <p className="mb-2 mt-6 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Workspace</p>
        <nav className="grid grid-cols-2 gap-1 sm:grid-cols-4 lg:grid-cols-1" aria-label="Employee navigation">
          {navigation.map((item) => <NavItem key={item.label} {...item} active={item.href === "/employee/resume-analyzer"} />)}
        </nav>
        <div className="mt-auto hidden lg:block">
          <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Account</p>
          <NavItem label="Settings" icon="settings" href="/employee/settings" /><NavItem label="Help center" icon="help" href="/employee/help" />
          <div className="mt-5 border-t border-slate-100 pt-5"><div className="flex items-center gap-3 rounded-xl p-2"><span className="grid size-9 shrink-0 place-items-center rounded-full bg-blue-50 text-xs font-bold text-blue-700">{initials.slice(0, 1)}</span><div className="min-w-0 flex-1"><strong className="block truncate text-xs">{profile?.full_name || "Loading profile..."}</strong><span className="block truncate text-[10px] text-slate-500">{profile?.email || "Employee"}</span></div></div><button type="button" onClick={logout} className="mt-2 w-full rounded-lg px-3 py-2 text-left text-xs font-semibold text-slate-500 hover:bg-red-50 hover:text-red-700">Log out</button></div>
        </div>
      </aside>
      <section className="min-w-0 lg:col-start-2">
        <header className="border-b border-slate-200 bg-white px-5 py-3 sm:px-6 lg:px-7"><div className="flex items-center justify-between gap-4"><div><h1 className="text-xl font-bold tracking-[-.03em]">Resume Analyzer</h1><p className="mt-0.5 text-[10px] text-slate-500">AI-powered resume intelligence</p></div><div className="ml-auto flex items-center gap-2"><NotificationBell/><span className="grid size-8 place-items-center rounded-full bg-blue-50 text-[10px] font-bold text-blue-700">{initials}</span></div></div><div className="relative mt-3 w-full max-w-xs"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><Icon name="document"/></span><input aria-label="Search Resume Analyzer" placeholder="Search resume analyzer..." className="h-9 w-full rounded-lg bg-slate-50 pl-10 pr-3 text-xs outline-none focus:ring-2 focus:ring-blue-100"/></div></header>
        <div className="w-full px-5 py-4 sm:px-6 lg:px-7">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-blue-600">AI Resume Review</p><h1 className="mt-1 text-2xl font-bold tracking-[-0.03em]">New resume analysis</h1><p className="mt-1 text-xs text-slate-500">Upload your resume and add a target role to receive focused, actionable feedback.</p></div><Link href="/employee/resume-analyzer" className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 shadow-sm transition hover:border-blue-200 hover:text-blue-700"><Icon name="history" /> Analysis history</Link></div>
          <section className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="grid lg:grid-cols-2">
              <div className="p-4 sm:p-5 lg:border-r lg:border-slate-100">
                <div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-blue-600">Step 1</p><h2 className="mt-1 text-lg font-bold">Upload your resume</h2><p className="mt-1 text-[10px] text-slate-500">We&apos;ll scan your experience, skills, and impact.</p></div><span className="grid size-9 place-items-center rounded-xl bg-blue-50 text-blue-700"><Icon name="upload" /></span></div>
              <div onDragEnter={() => setDragging(true)} onDragLeave={() => setDragging(false)} onDragOver={(event) => event.preventDefault()} onDrop={onDrop} className={`mt-5 rounded-xl border-2 border-dashed px-4 py-6 text-center transition ${dragging ? "border-blue-500 bg-blue-50" : file ? "border-emerald-300 bg-emerald-50/40" : "border-slate-200 bg-slate-50/60"}`}>
                <input ref={inputRef} type="file" accept=".pdf,.doc,.docx" onChange={onInput} className="sr-only" />
                {builderResume ? <><span className="mx-auto grid size-11 place-items-center rounded-xl bg-white text-emerald-600 shadow-sm"><Icon name="file" /></span><strong className="mt-3 block truncate text-xs">{builderResume.title}</strong><span className="mt-1 block text-[10px] text-slate-500">Resume Builder · {builderResume.completion}% complete · Ready to analyze</span><button type="button" onClick={() => inputRef.current?.click()} className="mt-3 text-[10px] font-bold text-blue-700">Upload a different resume</button></> : file ? <><span className="mx-auto grid size-11 place-items-center rounded-xl bg-white text-emerald-600 shadow-sm"><Icon name="file" /></span><strong className="mt-3 block truncate text-xs">{file.name}</strong><span className="mt-1 block text-[10px] text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB · Ready to analyze</span><button type="button" onClick={() => inputRef.current?.click()} className="mt-3 text-[10px] font-bold text-blue-700">Choose a different file</button></> : <><span className="mx-auto grid size-11 place-items-center rounded-xl bg-white text-blue-700 shadow-sm"><Icon name="upload" /></span><strong className="mt-3 block text-xs">Drop your resume here</strong><span className="mt-1 block text-[10px] text-slate-500">or browse from your computer</span><button type="button" onClick={() => inputRef.current?.click()} className="mt-3 rounded-lg border border-slate-200 bg-white px-4 py-2 text-[10px] font-bold shadow-sm hover:border-blue-300 hover:text-blue-700">Browse files</button><span className="mt-3 block text-[9px] text-slate-400">PDF, DOC, or DOCX · Max 10 MB</span></>}
              </div>
              {error && <p role="alert" className="mt-3 text-xs font-semibold text-red-600">{error}</p>}
              <div className="mt-4 flex items-start gap-2 rounded-lg bg-emerald-50 px-3 py-2.5 text-emerald-800"><Icon name="shield" /><p className="text-[9px] leading-4"><strong>Your document stays private.</strong> It is used only to create your personal report.</p></div>
              </div>
              <div className="border-t border-slate-100 p-4 sm:p-5 lg:border-t-0">
                <div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-blue-600">Step 2</p><h2 className="mt-1 text-lg font-bold">Add a target role</h2><p className="mt-1 text-[10px] text-slate-500">Tailor your analysis to the opportunity you want.</p></div><span className="grid size-9 place-items-center rounded-xl bg-violet-50 text-violet-700"><Icon name="target" /></span></div>
                <label className="mt-5 block"><span className="text-[10px] font-bold text-slate-700">Job title</span><input value={jobTitle} onChange={(event) => setJobTitle(event.target.value)} placeholder="e.g. Senior Product Designer" className="mt-2 h-10 w-full rounded-lg border border-slate-200 px-3 text-xs outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-50" /></label>
                <label className="mt-4 block"><span className="text-[10px] font-bold text-slate-700">Job description <em className="font-normal not-italic text-slate-400">Optional</em></span><textarea value={jobDescription} onChange={(event) => setJobDescription(event.target.value)} placeholder="Paste the job description for a more precise ATS match and tailored recommendations..." className="mt-2 h-[120px] w-full resize-none rounded-lg border border-slate-200 p-3 text-xs leading-5 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-50" /></label>
                <div className="mt-3 flex items-center justify-between"><button type="button" onClick={() => { setJobTitle("Senior Product Designer"); setJobDescription("Lead end-to-end product design, partner with product and engineering, conduct user research, and build accessible experiences."); }} className="rounded-lg border border-slate-200 px-3 py-2 text-[9px] font-bold text-slate-600 hover:border-blue-200 hover:text-blue-700">Use sample role</button><span className="text-[9px] text-slate-400">Better context, sharper feedback</span></div>
              </div>
            </div>
            <div className="border-t border-slate-100 bg-slate-50/60 px-5 py-4 sm:px-6">
              {progress > 0 && <div className="mb-4"><div className="flex justify-between text-[10px] font-bold"><span>{progress === 100 ? "Review ready" : "Analyzing your resume..."}</span><span className="text-blue-700">{progress}%</span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-blue-600 transition-all" style={{ width: `${progress}%` }} /></div></div>}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><p className="text-[10px] text-slate-500"><strong className="text-slate-700">Ready when both steps are complete.</strong><br />Your report typically takes less than a minute.</p><button type="button" disabled={(!file && !builderResume) || !jobTitle.trim() || isAnalyzing} onClick={analyze} className="flex h-11 min-w-52 items-center justify-center gap-2 rounded-lg bg-blue-700 px-6 text-xs font-bold text-white shadow-md shadow-blue-700/15 transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none">{isAnalyzing ? "Analyzing..." : analysis ? "Analyze again" : "Analyze resume"}<Icon name="arrow" /></button></div>
            </div>
          </section>
          {analysis && <AnalysisReport analysis={analysis} />}
          <div className="mt-5 grid gap-3 md:grid-cols-3"><Outcome title="ATS-friendly scan" detail="Check your resume against hiring systems." /><Outcome title="Clear suggestions" detail="Know exactly what to improve next." /><Outcome title="Role-specific insights" detail="Match skills and keywords to your target." /></div>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-[10px] font-semibold text-slate-400"><span className="flex items-center gap-2"><Icon name="check" /> No formatting changes</span><span className="flex items-center gap-2"><Icon name="check" /> Results in under a minute</span><span className="flex items-center gap-2"><Icon name="check" /> Actionable recommendations</span></div>
        </div>
      </section>
    </div>
  </main>;
}

function Brand() { return <div className="flex items-center gap-3 px-2"><span className="grid size-9 place-items-center rounded-xl bg-blue-700 font-bold text-white">R</span><div><strong className="block text-base tracking-tight text-blue-800">RESUMIND</strong><span className="block text-[10px] text-slate-500">AI Resume Intelligence</span></div></div>; }
function NavItem({ label, icon, href, active, badge }: { label: string; icon: IconName; href?: string; active?: boolean; badge?: string }) { const content = <><Icon name={icon} /><span className="flex-1">{label}</span>{badge && <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[8px] font-bold text-amber-700">{badge}</span>}</>; const style = `flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-xs font-semibold transition ${active ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"}`; return href ? <Link href={href} aria-current={active ? "page" : undefined} className={style}>{content}</Link> : <button type="button" className={style}>{content}</button>; }
function Outcome({ title, detail }: { title: string; detail: string }) { return <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><span className="grid size-8 shrink-0 place-items-center rounded-lg bg-blue-50 text-blue-700"><Icon name="check" /></span><div><strong className="block text-[11px]">{title}</strong><p className="mt-1 text-[9px] text-slate-500">{detail}</p></div></div>; }
function ResultScore({ label, value }: { label: string; value: number }) { return <div><div className="flex items-end justify-between"><span className="text-[10px] font-semibold text-slate-500">{label}</span><strong className="text-lg">{value}<small className="text-[9px] text-slate-400">/100</small></strong></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100"><span className="block h-full rounded-full bg-blue-600" style={{ width: `${value}%` }}/></div></div>; }
function AnalysisReport({ analysis }: { analysis: Analysis }) {
  const report = analysis.detailed_report;
  return <section className="mt-5 overflow-hidden rounded-2xl border border-blue-200 bg-white shadow-sm">
    <div className="p-6"><div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-4"><span className="grid size-16 shrink-0 place-items-center rounded-2xl bg-blue-50 text-2xl font-bold text-blue-700">{analysis.overall_score}</span><div><p className="text-[9px] font-bold uppercase tracking-[0.16em] text-blue-600">Complete resume report</p><h2 className="mt-1 text-lg font-bold">Your resume is rated {analysis.status.toLowerCase()}.</h2><p className="mt-1 text-[10px] text-slate-500">{analysis.original_filename} · {analysis.job_title}</p></div></div><Link href="/employee/reports" className="text-xs font-bold text-blue-700">View analysis history →</Link></div><div className="mt-6 grid gap-5 border-t border-slate-100 pt-5 sm:grid-cols-3"><ResultScore label="Impact" value={analysis.impact_score}/><ResultScore label="Clarity" value={analysis.clarity_score}/><ResultScore label="ATS match" value={analysis.ats_score}/></div></div>
    <div className="border-t border-slate-100 bg-slate-50/60 p-6"><ReportBlock title="Executive summary"><p className="text-xs leading-6 text-slate-600">{report.summary}</p></ReportBlock>
      <div className="mt-5 grid gap-5 lg:grid-cols-2"><ReportList title="What works well" items={report.strengths} tone="green"/><ReportList title="What needs improvement" items={report.weaknesses} tone="amber"/></div>
      <div className="mt-5 grid gap-5 lg:grid-cols-2"><KeywordBlock title="Matched keywords" items={report.matched_keywords} matched/><KeywordBlock title="Missing or underused keywords" items={report.missing_keywords}/></div>
      <ReportBlock title="Section-by-section feedback" className="mt-5"><div className="grid gap-3 md:grid-cols-2">{report.section_feedback.map((item, index)=><div key={`${item.section}-${index}`} className="rounded-xl border border-slate-200 bg-white p-4"><strong className="text-xs">{item.section}</strong><p className="mt-1 text-[10px] leading-5 text-slate-500">{item.feedback}</p></div>)}</div></ReportBlock>
      <div className="mt-5 grid gap-5 lg:grid-cols-2"><ReportList title="ATS and formatting checks" items={report.ats_issues} tone="blue"/><ReportList title="Suggested bullet rewrites" items={report.bullet_rewrites} tone="blue"/></div>
      <ReportBlock title="Suggested professional summary" className="mt-5"><p className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-xs leading-6 text-blue-950">{report.improved_summary}</p></ReportBlock>
      <ReportBlock title="Prioritized action plan" className="mt-5"><ol className="grid gap-3 md:grid-cols-2">{report.action_plan.map((item,index)=><li key={`${item}-${index}`} className="flex gap-3 rounded-xl border border-slate-200 bg-white p-4 text-[10px] leading-5 text-slate-600"><span className="grid size-6 shrink-0 place-items-center rounded-full bg-blue-700 font-bold text-white">{index+1}</span>{item}</li>)}</ol></ReportBlock>
    </div>
  </section>;
}
function ReportBlock({title,children,className=""}:{title:string;children:React.ReactNode;className?:string}) { return <section className={className}><h3 className="mb-3 text-sm font-bold">{title}</h3>{children}</section>; }
function ReportList({title,items,tone}:{title:string;items:string[];tone:"green"|"amber"|"blue"}) { const colors={green:"bg-emerald-50 text-emerald-700",amber:"bg-amber-50 text-amber-700",blue:"bg-blue-50 text-blue-700"}; return <ReportBlock title={title}><ul className="space-y-2">{items.map((item,index)=><li key={`${item}-${index}`} className="flex gap-3 rounded-xl border border-slate-200 bg-white p-3 text-[10px] leading-5 text-slate-600"><span className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-full ${colors[tone]}`}><Icon name="check"/></span>{item}</li>)}</ul></ReportBlock>; }
function KeywordBlock({title,items,matched=false}:{title:string;items:string[];matched?:boolean}) { return <ReportBlock title={title}><div className="flex min-h-16 flex-wrap content-start gap-2 rounded-xl border border-slate-200 bg-white p-4">{items.length ? items.map((item)=><span key={item} className={`rounded-full px-2.5 py-1 text-[9px] font-semibold ${matched?"bg-emerald-50 text-emerald-700":"bg-amber-50 text-amber-700"}`}>{item}</span>):<span className="text-[10px] text-slate-400">No keywords identified.</span>}</div></ReportBlock>; }
function Icon({ name }: { name: IconName }) { const paths: Record<IconName, React.ReactNode> = { home: <><path d="m3 11 9-8 9 8"/><path d="M5 10v10h14V10M9 20v-6h6v6"/></>, document: <><path d="M6 2h8l4 4v16H6Z"/><path d="M14 2v5h5M9 12h6M9 16h6"/></>, chart: <><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></>, versions: <><rect x="5" y="4" width="14" height="16" rx="2"/><path d="M8 1h8M9 9h6M9 13h6"/></>, calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 10h18"/></>, spark: <><path d="m12 3 1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5Z"/><path d="m19 15 .8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8Z"/></>, settings: <><circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z"/></>, help: <><circle cx="12" cy="12" r="9"/><path d="M9.8 9a2.3 2.3 0 1 1 3 2.2c-.8.3-.8.8-.8 1.8M12 17h.01"/></>, bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 7h18s-3 0-3-7"/><path d="M10 19h4"/></>, upload: <><path d="M12 16V4m0 0L7 9m5-5 5 5"/><path d="M4 15v5h16v-5"/></>, shield: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/></>, check: <path d="m6 12 4 4 8-8"/>, arrow: <path d="m9 18 6-6-6-6"/>, file: <><path d="M6 2h8l4 4v16H6Z"/><path d="M14 2v5h5M9 13l2 2 4-4"/></>, target: <><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><path d="M12 3v3M21 12h-3"/></>, history: <><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5M12 7v5l3 2"/></> }; return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>{paths[name]}</svg>; }
