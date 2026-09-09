import Link from "next/link";
import type { ReactNode } from "react";

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen overflow-hidden bg-white text-slate-950">
      <div className="grid min-h-screen lg:grid-cols-2">
        <section className="relative hidden overflow-hidden border-r border-blue-200 bg-gradient-to-br from-blue-100 via-blue-50 to-indigo-100 px-14 py-10 shadow-[inset_-18px_0_36px_-28px_rgba(30,64,175,0.45)] lg:flex lg:flex-col lg:justify-between xl:px-20 xl:py-14">
          <div aria-hidden className="absolute -left-28 bottom-10 size-80 rounded-full bg-blue-200/35 blur-3xl" />
          <div aria-hidden className="absolute -right-28 -top-32 size-96 rounded-full bg-blue-200/35 blur-3xl" />
          <div className="relative">
            <Brand />
            <div className="mt-16 max-w-xl xl:mt-20">
              <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-blue-700"><span className="size-2 rounded-full bg-blue-600" />AI-powered career platform</span>
              <h1 className="mt-7 text-5xl font-bold leading-[1.07] tracking-[-0.045em] xl:text-6xl">Smarter resume analysis,<span className="block text-blue-700">Better opportunities.</span></h1>
              <p className="mt-6 max-w-lg text-base leading-7 text-slate-600">Analyze resumes, identify skill gaps and receive clear insights for better career and hiring decisions.</p>
            </div>
          </div>
          <ResumeIllustration />
          <div className="relative flex items-center justify-between gap-6 text-xs text-slate-500"><span>© 2026 Resumind</span><span>Secure, explainable analysis</span></div>
        </section>
        <section className="flex items-center justify-center bg-white px-5 py-10 sm:px-10 lg:px-16 xl:px-24"><div className="w-full max-w-md"><div className="mb-10 lg:hidden"><Brand /></div>{children}</div></section>
      </div>
    </main>
  );
}

function Brand() {
  return <Link href="/" className="inline-flex items-center gap-3"><span className="flex size-11 items-center justify-center rounded-2xl bg-blue-700 text-white shadow-lg shadow-blue-700/20"><svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M6 2h8l4 4v16H6Z" /><path d="M14 2v5h5M9 12h6M9 16h6" /></svg></span><span><strong className="block text-xl tracking-[-0.03em] text-blue-800">RESUMIND</strong><span className="text-xs text-slate-500">AI Resume Intelligence</span></span></Link>;
}

function ResumeIllustration() {
  return <div className="relative mx-auto my-8 w-full max-w-lg xl:my-10"><div className="absolute inset-x-20 bottom-1 h-14 rounded-full bg-blue-300/25 blur-2xl" /><div className="relative mx-auto flex max-w-xs items-end justify-center"><div className="w-52 -rotate-3 rounded-2xl border border-blue-100 bg-white p-5 shadow-xl shadow-blue-900/10"><div className="flex items-center gap-3"><span className="size-10 rounded-full bg-blue-100" /><div className="flex-1"><div className="h-3 w-28 rounded-full bg-slate-800" /><div className="mt-2 h-2 w-20 rounded-full bg-slate-200" /></div></div><div className="mt-6 space-y-2.5"><div className="h-2 rounded-full bg-blue-100" /><div className="h-2 w-5/6 rounded-full bg-slate-200" /><div className="h-2 rounded-full bg-slate-200" /><div className="h-2 w-3/4 rounded-full bg-slate-200" /></div><div className="mt-6 grid grid-cols-3 gap-2"><span className="h-8 rounded-lg bg-blue-50" /><span className="h-8 rounded-lg bg-indigo-50" /><span className="h-8 rounded-lg bg-cyan-50" /></div></div><div className="relative -ml-7 mb-6 w-40 rounded-2xl border border-blue-100 bg-white p-4 shadow-xl shadow-blue-900/15"><span className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">AI match</span><strong className="mt-1 block text-3xl">92%</strong><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-blue-100"><div className="h-full w-[92%] rounded-full bg-blue-600" /></div><p className="mt-3 text-[11px] leading-4 text-slate-500">Strong profile match</p></div></div></div>;
}
