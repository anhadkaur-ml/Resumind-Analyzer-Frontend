"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { AuthShell } from "../components/auth-shell";
import { api, getApiErrorMessage } from "../../lib/api";
type Role = "employee" | "hr";

export default function SignupPage() {
  const [role, setRole] = useState<Role>("employee");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const payload = { full_name: String(data.get("full_name") ?? "").trim(), email: String(data.get("email") ?? "").trim(), password: String(data.get("password") ?? ""), password_confirm: String(data.get("password_confirm") ?? ""), role };
    setError("");
    if (payload.password !== payload.password_confirm) { setError("The passwords do not match."); return; }
    setIsSubmitting(true);
    try {
      await api.post("/api/auth/signup/", payload);
      form.reset();
      setSuccess(true);
    } catch (requestError) { setError(getApiErrorMessage(requestError, "The backend is unavailable. Please try again.")); }
    finally { setIsSubmitting(false); }
  }

  return <AuthShell><p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-700">Create your workspace</p><h2 className="mt-3 text-4xl font-bold tracking-[-0.04em]">Create account</h2><p className="mt-3 text-sm leading-6 text-slate-500">Choose how you’ll use Resumind. Your account type determines your dashboard.</p>{success ? <div className="mt-9 rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center"><h3 className="font-bold text-emerald-900">Account created successfully</h3><p className="mt-2 text-sm text-emerald-700">You can now sign in with your email and password.</p><Link href="/" className="mt-5 inline-flex rounded-xl bg-blue-700 px-6 py-3 text-sm font-bold text-white">Continue to login</Link></div> : <form onSubmit={handleSubmit} className="mt-7 space-y-4"><Input label="Full name" name="full_name" type="text" autoComplete="name" placeholder="Arjun Sharma" /><Input label="Email address" name="email" type="email" autoComplete="email" placeholder="you@example.com" /><div className="grid gap-4 sm:grid-cols-2"><Input label="Password" name="password" type="password" autoComplete="new-password" placeholder="Minimum 8 characters" /><Input label="Confirm password" name="password_confirm" type="password" autoComplete="new-password" placeholder="Repeat password" /></div><fieldset><legend className="text-sm font-semibold text-slate-700">I am joining as</legend><div className="mt-2 grid grid-cols-2 gap-3"><RoleButton role="employee" selected={role} onSelect={setRole} title="Employee" detail="Analyze my resume" /><RoleButton role="hr" selected={role} onSelect={setRole} title="HR" detail="Review candidates" /></div></fieldset><button disabled={isSubmitting} className="flex h-12 w-full items-center justify-center rounded-xl bg-blue-700 text-sm font-bold text-white shadow-lg shadow-blue-700/20 transition hover:bg-blue-800 disabled:opacity-70">{isSubmitting ? "Creating account..." : `Create ${role === "hr" ? "HR" : "Employee"} account`}</button>{error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}</form>}<p className="mt-6 text-center text-xs text-slate-500">Already have an account? <Link href="/" className="font-semibold text-blue-700">Sign in</Link></p></AuthShell>;
}

function Input(props: { label: string; name: string; type: string; autoComplete: string; placeholder: string }) { return <div><label htmlFor={props.name} className="text-sm font-semibold text-slate-700">{props.label}</label><input {...props} id={props.name} required className="mt-2 h-11 w-full rounded-xl border border-slate-300 px-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-100" /></div>; }
function RoleButton({ role, selected, onSelect, title, detail }: { role: Role; selected: Role; onSelect: (role: Role) => void; title: string; detail: string }) { const active = role === selected; return <button type="button" onClick={() => onSelect(role)} aria-pressed={active} className={`rounded-xl border p-3 text-left transition ${active ? "border-blue-600 bg-blue-50 ring-2 ring-blue-100" : "border-slate-200 hover:border-blue-300"}`}><strong className="block text-sm">{title}</strong><span className="mt-1 block text-xs text-slate-500">{detail}</span></button>; }


