"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

type Role = "employee" | "hr";

export function SimpleDashboard({ role }: { role: Role }) {
  const router = useRouter();
  const roleLabel = role === "hr" ? "HR" : "Employee";

  useEffect(() => {
    const savedRole =
      localStorage.getItem("userRole") ?? sessionStorage.getItem("userRole");
    const token =
      localStorage.getItem("accessToken") ??
      sessionStorage.getItem("accessToken");

    if (!token || savedRole !== role) {
      if (savedRole === "hr") router.replace("/hr/dashboard");
      else if (savedRole === "employee") router.replace("/employee/dashboard");
      else router.replace("/");
      return;
    }

  }, [role, router]);

  function logout() {
    for (const storage of [localStorage, sessionStorage]) {
      storage.removeItem("accessToken");
      storage.removeItem("refreshToken");
      storage.removeItem("userRole");
    }
    router.replace("/");
  }

  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 px-6 py-12 text-slate-950">
      <section className="w-full text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-blue-700 text-xl font-bold text-white shadow-lg shadow-blue-700/20">
          R
        </div>

        <p className="mt-6 text-xs font-bold uppercase tracking-[0.18em] text-blue-700">
          Resumind
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
          {roleLabel} Dashboard
        </h1>

        <span className="mt-5 inline-flex rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-bold text-blue-700">
          Role: {roleLabel}
        </span>

        <div className="mx-auto mt-8 max-w-xl rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
          <h2 className="font-bold text-emerald-900">Welcome to Resumind!</h2>
          <p className="mt-2 text-sm leading-6 text-emerald-700">
            You have successfully logged in as {role === "hr" ? "an HR user" : "an Employee"}.
          </p>
        </div>

        <button
          type="button"
          onClick={logout}
          className="mt-8 inline-flex h-11 items-center justify-center rounded-xl bg-blue-700 px-8 text-sm font-bold text-white shadow-lg shadow-blue-700/20 transition hover:bg-blue-800"
        >
          Logout
        </button>
      </section>
    </main>
  );
}
