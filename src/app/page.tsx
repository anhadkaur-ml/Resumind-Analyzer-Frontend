"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { AuthShell } from "./components/auth-shell";
import { api, getApiErrorMessage } from "../lib/api";

type LoginResponse = {
  access: string;
  refresh: string;
  user: { role: "employee" | "hr" };
};

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email") ?? "").trim();
    const password = String(data.get("password") ?? "");
    const remember = data.get("remember") === "on";
    setFormError("");
    setIsSubmitting(true);

    try {
      const { data: auth } = await api.post<LoginResponse>("/api/auth/login/", { email, password });
      const storage = remember ? localStorage : sessionStorage;
      storage.setItem("accessToken", auth.access);
      storage.setItem("refreshToken", auth.refresh);
      storage.setItem("userRole", auth.user.role);
      router.push(auth.user.role === "hr" ? "/hr/dashboard" : "/employee/dashboard");
    } catch (error) {
      setFormError(getApiErrorMessage(error, "The backend is unavailable. Please try again."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthShell>
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-700">Secure account access</p>
      <h2 className="mt-3 text-4xl font-bold tracking-[-0.04em]">Welcome back!</h2>
      <p className="mt-3 text-sm leading-6 text-slate-500">Sign in and we’ll open the correct workspace for your account.</p>

      <form onSubmit={handleSubmit} className="mt-9 space-y-6">
        <div>
          <label htmlFor="email" className="text-sm font-semibold text-slate-700">Email address</label>
          <input id="email" name="email" type="email" required autoComplete="email" placeholder="you@example.com" className="mt-2 h-12 w-full rounded-xl border border-slate-300 px-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-100" />
        </div>
        <div>
          <div className="flex items-center justify-between"><label htmlFor="password" className="text-sm font-semibold text-slate-700">Password</label><button type="button" className="text-xs font-semibold text-blue-700">Forgot password?</button></div>
          <div className="relative mt-2">
            <input id="password" name="password" type={showPassword ? "text" : "password"} required autoComplete="current-password" placeholder="Enter your password" className="h-12 w-full rounded-xl border border-slate-300 px-4 pr-16 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-100" />
            <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute inset-y-0 right-4 text-xs font-semibold text-blue-700" aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? "Hide" : "Show"}</button>
          </div>
        </div>
        <label className="flex cursor-pointer items-center gap-3 text-sm text-slate-600"><input name="remember" type="checkbox" className="size-4 accent-blue-700" />Keep me signed in</label>
        <button disabled={isSubmitting} className="flex h-12 w-full items-center justify-center rounded-xl bg-blue-700 text-sm font-bold text-white shadow-lg shadow-blue-700/20 transition hover:bg-blue-800 disabled:opacity-70">{isSubmitting ? "Signing in..." : "Login"}</button>
        {formError && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{formError}</p>}
        <p className="text-center text-[11px] text-slate-400">Your account is protected with secure authentication</p>
      </form>

      <p className="mt-8 border-t border-slate-200 pt-6 text-center text-xs text-slate-500">Don&apos;t have an account? <Link href="/signup" className="font-semibold text-blue-700 hover:text-blue-900">Create account</Link></p>
    </AuthShell>
  );
}


