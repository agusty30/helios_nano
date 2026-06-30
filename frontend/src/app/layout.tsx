import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { ToastProvider } from "@/components/ui/Toast";

export const metadata: Metadata = {
  title: "HeliOS — Autonomous AI Financial Operating System",
  description: "AI-native platform for budgeting, procurement, and autonomous payments",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <meta name="talentapp:project_verification" content="25491fbb06aa4a150ef270513d1d17886c509823ca79afb84bd509f1c281091ac077e6665d0c60975875dc304ddd7ee8346969dd79f1de933826134234855da6" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-bg text-foreground antialiased font-sans">
        <AuthProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
