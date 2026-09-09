"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { api, clearStoredSession, getApiErrorMessage, isUnauthorized } from "../../lib/api";
import { NotificationBell } from "./notification-bell";

type UserProfile = { id: number; full_name: string; email: string; role: "employee" | "hr" };
type ResumeAnalysis = { id: number; original_filename: string; job_title: string; overall_score: number; impact_score: number; clarity_score: number; ats_score: number; status: string; recommendations: string[]; created_at: string };
type DashboardData = { analysis_count: number; latest: ResumeAnalysis | null };
type IconName = "home" | "document" | "chart" | "versions" | "calendar" | "spark" | "settings" | "help" | "bell" | "arrow" | "target" | "clock";

const quickActions = [
  { title: "Analyze a resume", detail: "Upload and review a resume", icon: "document" as const, href: "/employee/resume-analyzer/new" },
  { title: "View reports", detail: "Review previous analysis results", icon: "chart" as const, href: "/employee/reports" },
  { title: "Practice an interview", detail: "Start a guided practice session", icon: "calendar" as const, href: "/employee/interview-practice" },
];

export function EmployeeDashboard() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileError, setProfileError] = useState("");
  const [currentDateTime, setCurrentDateTime] = useState<Date | null>(null);
  const [openMenu, setOpenMenu] = useState<"account" | null>(null);
  const [dashboard, setDashboard] = useState<DashboardData>({ analysis_count: 0, latest: null });

  useEffect(() => {
    const savedRole = localStorage.getItem("userRole") ?? sessionStorage.getItem("userRole");
    const token = localStorage.getItem("accessToken") ?? sessionStorage.getItem("accessToken");
    if (!token || savedRole !== "employee") { router.replace(savedRole === "hr" ? "/hr/dashboard" : "/"); return; }

    async function loadProfile() {
      try {
        const { data: user } = await api.get<UserProfile>("/api/auth/profile/");
        if (user.role !== "employee") { router.replace("/hr/dashboard"); return; }
        setProfile(user);
        const { data: dashboardData } = await api.get<DashboardData>("/api/resumes/dashboard/");
        setDashboard(dashboardData);
      } catch (error) { if (isUnauthorized(error)) { clearSession(); router.replace("/"); return; } setProfileError(getApiErrorMessage(error, "Unable to load your profile.")); }
    }
    void loadProfile();
  }, [router]);

  useEffect(() => {
    const updateDateTime = () => setCurrentDateTime(new Date());
    updateDateTime();
    const timer = window.setInterval(updateDateTime, 60_000);
    return () => window.clearInterval(timer);
  }, []);

  function clearSession() {
    clearStoredSession();
  }

  function logout() { clearSession(); router.replace("/"); router.refresh(); }
  const firstName = profile?.full_name.split(" ")[0] || "there";
  const hour = currentDateTime?.getHours() ?? 12;
  const greeting = hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";
  const latest = dashboard.latest;
  const summary = [
    { label: "Latest resume score", value: latest ? `${latest.overall_score} / 100` : "—", detail: latest ? latest.status : "No analysis yet", icon: "document" as const },
    { label: "ATS match", value: latest ? `${latest.ats_score}%` : "—", detail: latest?.job_title ?? "Add a target role", icon: "target" as const },
    { label: "Saved analyses", value: String(dashboard.analysis_count), detail: dashboard.analysis_count === 1 ? "1 completed analysis" : `${dashboard.analysis_count} completed analyses`, icon: "chart" as const },
  ];

  return (
    <main className="min-h-screen bg-[#f7f8fa] text-slate-950">
      <div className="grid min-h-screen lg:grid-cols-[230px_1fr]">
        <aside className="flex flex-col border-b border-slate-200 bg-white px-4 py-4 lg:fixed lg:inset-y-0 lg:w-[230px] lg:border-b-0 lg:border-r">
          <Brand />
          <p className="mb-2 mt-6 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Workspace</p>
          <nav className="grid grid-cols-2 gap-1 sm:grid-cols-4 lg:grid-cols-1" aria-label="Employee navigation">
            <NavItem label="Overview" icon="home" href="/employee/dashboard" active />
            <NavItem label="Resume Analyzer" icon="document" href="/employee/resume-analyzer" />
            <NavItem label="Compare Resumes" icon="versions" href="/employee/compare-resumes" />
            <NavItem label="Resume Builder" icon="document" href="/employee/resume-builder" />
            <NavItem label="Interview Practice" icon="calendar" href="/employee/interview-practice" />
          </nav>
          <div className="mt-auto hidden lg:block">
            <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Account</p>
            <NavItem label="Settings" icon="settings" href="/employee/settings" /><NavItem label="Help center" icon="help" href="/employee/help" />
            <div className="mt-5 border-t border-slate-100 pt-5"><div className="flex items-center gap-3 rounded-xl p-2"><span className="grid size-9 shrink-0 place-items-center rounded-full bg-blue-50 text-xs font-bold text-blue-700">{profile?.full_name.charAt(0).toUpperCase() || "E"}</span><div className="min-w-0 flex-1"><strong className="block truncate text-xs">{profile?.full_name || "Loading profile..."}</strong><span className="block truncate text-[10px] text-slate-500">{profile?.email || "Employee"}</span></div></div><button type="button" onClick={logout} className="mt-2 w-full rounded-lg px-3 py-2 text-left text-xs font-semibold text-slate-500 hover:bg-red-50 hover:text-red-700">Log out</button></div>
          </div>
        </aside>

        <section className="min-w-0 lg:col-start-2">
          <header className="relative z-20 border-b border-slate-200 bg-white px-5 py-3 sm:px-6 lg:px-7"><div className="flex items-center justify-between"><div><h1 className="text-xl font-bold tracking-[-.03em]">Overview</h1><p className="mt-0.5 text-[10px] text-slate-500">Your resume activity and next steps.</p></div><div className="relative ml-auto flex items-center gap-2"><NotificationBell/><button type="button" aria-label="Open account menu" aria-expanded={openMenu === "account"} onClick={() => setOpenMenu((menu) => menu === "account" ? null : "account")} className="grid size-8 place-items-center rounded-full bg-blue-50 text-[10px] font-bold text-blue-700 ring-blue-100 hover:ring-4">{profile?.full_name.split(" ").map((part) => part[0]).slice(0,2).join("") || "EU"}</button>
            {openMenu === "account" && <div className="absolute right-0 top-12 w-60 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-900/10"><div className="flex items-center gap-3 border-b border-slate-100 p-4"><span className="grid size-10 shrink-0 place-items-center rounded-full bg-blue-50 text-xs font-bold text-blue-700">{profile?.full_name.charAt(0).toUpperCase() || "E"}</span><div className="min-w-0"><strong className="block truncate text-xs">{profile?.full_name || "Employee"}</strong><span className="block truncate text-[9px] text-slate-400">{profile?.email}</span></div></div><div className="p-2"><Link href="/employee/settings" onClick={() => setOpenMenu(null)} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"><Icon name="settings" /> Profile & settings</Link><Link href="/employee/help" onClick={() => setOpenMenu(null)} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"><Icon name="help" /> Help center</Link></div><div className="border-t border-slate-100 p-2"><button type="button" onClick={logout} className="w-full rounded-lg px-3 py-2.5 text-left text-xs font-semibold text-red-600 hover:bg-red-50">Log out</button></div></div>}
          </div></div><div className="relative mt-3 w-full max-w-sm"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><Icon name="document" /></span><input aria-label="Search workspace" placeholder="Search overview..." className="h-9 w-full rounded-lg bg-slate-50 pl-10 pr-3 text-xs outline-none focus:ring-2 focus:ring-blue-100" /></div></header>

          <div className="w-full px-5 py-4 sm:px-6 lg:px-7">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><h2 className="text-2xl font-bold tracking-[-0.04em]">{greeting} {firstName}</h2><p className="mt-0.5 text-xs text-slate-500">Here&apos;s what&apos;s moving your career forward today.</p>{profileError && <p role="alert" className="mt-1 text-xs font-semibold text-red-600">{profileError}</p>}</div><Link href="/employee/resume-analyzer/new" className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 text-[10px] font-bold text-white shadow-sm hover:bg-blue-800"><span className="text-base leading-none">+</span> New analysis</Link></div>

            <div className="mt-4 grid gap-3 md:grid-cols-3">{summary.map((item) => <SummaryCard key={item.label} {...item} />)}</div>

            <div className="mt-4 grid gap-4 xl:grid-cols-[1.35fr_.75fr]">
              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">{latest ? <><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start"><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-blue-600">Latest analysis</p><h2 className="mt-1 text-lg font-bold">{latest.job_title}</h2><p className="mt-1 text-[10px] text-slate-500">{new Date(latest.created_at).toLocaleDateString()} · {latest.original_filename}</p></div><Link href="/employee/reports" className="flex items-center gap-1 text-xs font-bold text-blue-700">View history <Icon name="arrow" /></Link></div><div className="mt-6 grid gap-5 sm:grid-cols-[140px_1fr] sm:items-center"><div className="rounded-2xl bg-blue-50 p-5 text-center"><strong className="block text-4xl tracking-tight text-blue-700">{latest.overall_score}</strong><span className="mt-1 block text-[9px] font-bold uppercase tracking-wider text-blue-500">Overall score</span></div><div><div className="grid grid-cols-3 gap-3"><Score label="Impact" value={String(latest.impact_score)} /><Score label="Clarity" value={String(latest.clarity_score)} /><Score label="ATS match" value={String(latest.ats_score)} /></div><div className="mt-5 rounded-xl bg-amber-50 px-4 py-3"><strong className="block text-[10px] text-amber-900">Top improvement</strong><p className="mt-1 text-[10px] leading-4 text-amber-800">{latest.recommendations[0]}</p></div></div></div></> : <div className="grid min-h-52 place-items-center text-center"><div><span className="mx-auto grid size-11 place-items-center rounded-xl bg-blue-50 text-blue-700"><Icon name="document" /></span><h2 className="mt-4 text-sm font-bold">No resume analysis yet</h2><p className="mt-1 text-[10px] text-slate-500">Upload your first resume to see scores and recommendations here.</p><Link href="/employee/resume-analyzer" className="mt-4 inline-flex h-9 items-center rounded-lg bg-blue-700 px-4 text-[10px] font-bold text-white">Analyze a resume</Link></div></div>}</section>

              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Quick actions</p><h2 className="mt-1 text-lg font-bold">What do you want to do?</h2><div className="mt-4 divide-y divide-slate-100">{quickActions.map((item) => <Link key={item.title} href={item.href} className="flex items-center gap-3 py-4"><span className="grid size-9 shrink-0 place-items-center rounded-lg bg-blue-50 text-blue-700"><Icon name={item.icon} /></span><span className="min-w-0 flex-1"><strong className="block text-xs">{item.title}</strong><span className="mt-1 block truncate text-[10px] text-slate-500">{item.detail}</span></span><span className="text-slate-400"><Icon name="arrow" /></span></Link>)}</div></section>
            </div>

            <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><div className="flex items-center justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Recent activity</p><h2 className="mt-1 text-lg font-bold">Latest work</h2></div><Link href="/employee/reports" className="text-xs font-bold text-blue-700">View reports →</Link></div><div className="mt-5 grid divide-y divide-slate-100 border-t border-slate-100 md:grid-cols-3 md:divide-x md:divide-y-0"> <Activity icon="document" title="Resume analyzed" detail="Today, 9:42 AM" result="86 / 100" /><Activity icon="calendar" title="Interview practice" detail="Yesterday, 4:18 PM" result="Completed" /><Activity icon="versions" title="Resume version updated" detail="August 18, 11:06 AM" result="Saved" /></div></section>
          </div>
        </section>
      </div>
    </main>
  );
}

function Brand() { return <div className="flex items-center gap-3 px-2"><span className="grid size-9 place-items-center rounded-xl bg-blue-700 font-bold text-white">R</span><div><strong className="block text-base tracking-tight text-blue-800">RESUMIND</strong><span className="block text-[10px] text-slate-500">AI Resume Intelligence</span></div></div>; }
function NavItem({ label, icon, active = false, badge, href }: { label: string; icon: IconName; active?: boolean; badge?: string; href?: string }) { const content = <><Icon name={icon} /><span className="flex-1">{label}</span>{badge && <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[8px] font-bold text-amber-700">{badge}</span>}</>; const className = `flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-xs font-semibold transition ${active ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"}`; return href ? <Link href={href} aria-current={active ? "page" : undefined} className={className}>{content}</Link> : <button type="button" className={className}>{content}</button>; }
function SummaryCard({ label, value, detail, icon }: { label: string; value: string; detail: string; icon: "document" | "target" | "chart" }) { return <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><span className="grid size-9 place-items-center rounded-lg bg-blue-50 text-blue-700"><Icon name={icon} /></span><p className="mt-4 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500">{label}</p><strong className="mt-1 block text-2xl tracking-tight">{value}</strong><span className="mt-2 block text-[10px] font-semibold text-slate-500">{detail}</span></article>; }
function Score({ label, value }: { label: string; value: string }) { return <div><div className="flex items-end justify-between gap-1"><span className="text-[9px] font-semibold text-slate-500">{label}</span><strong className="text-sm">{value}</strong></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100"><span className="block h-full rounded-full bg-blue-600" style={{ width: `${value}%` }} /></div></div>; }
function Activity({ icon, title, detail, result }: { icon: IconName; title: string; detail: string; result: string }) { return <div className="flex items-center gap-3 px-0 py-4 first:pl-0 md:px-5 md:py-2"><span className="grid size-9 shrink-0 place-items-center rounded-lg bg-slate-50 text-slate-500"><Icon name={icon} /></span><div className="min-w-0 flex-1"><strong className="block truncate text-xs">{title}</strong><span className="text-[10px] text-slate-400">{detail}</span></div><span className="text-[10px] font-bold text-blue-700">{result}</span></div>; }

function Icon({ name }: { name: IconName }) {
  const paths: Record<IconName, React.ReactNode> = {
    home: <><path d="m3 11 9-8 9 8" /><path d="M5 10v10h14V10M9 20v-6h6v6" /></>, document: <><path d="M6 2h8l4 4v16H6Z" /><path d="M14 2v5h5M9 12h6M9 16h6" /></>, chart: <><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></>, versions: <><rect x="5" y="4" width="14" height="16" rx="2" /><path d="M8 1h8M9 9h6M9 13h6" /></>, calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M7 3v4M17 3v4M3 10h18" /></>, spark: <><path d="m12 3 1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5Z" /><path d="m19 15 .8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8Z" /></>, settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H3v-4h.2a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3A1.7 1.7 0 0 0 10 3V3h4v.2a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z" /></>, help: <><circle cx="12" cy="12" r="9" /><path d="M9.8 9a2.3 2.3 0 1 1 3 2.2c-.8.3-.8.8-.8 1.8M12 17h.01" /></>, bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 7h18s-3 0-3-7" /><path d="M10 19h4" /></>, arrow: <path d="m9 18 6-6-6-6" />, target: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="4" /><path d="M12 3v3M21 12h-3" /></>, clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  };
  return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>{paths[name]}</svg>;
}
