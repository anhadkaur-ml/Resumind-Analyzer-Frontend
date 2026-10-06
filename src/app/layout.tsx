import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Resumind | AI Resume Intelligence",
  description: "AI-powered resume analysis for employees and HR teams.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
