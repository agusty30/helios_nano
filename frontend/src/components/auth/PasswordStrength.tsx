"use client";

import { useMemo } from "react";

const LEVELS = [
  { label: "Weak", color: "bg-red-500", min: 0 },
  { label: "Fair", color: "bg-orange-500", min: 2 },
  { label: "Good", color: "bg-yellow-500", min: 3 },
  { label: "Strong", color: "bg-emerald-500", min: 4 },
];

function getStrength(password: string): number {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;
  return score;
}

export default function PasswordStrength({ password }: { password: string }) {
  const strength = useMemo(() => getStrength(password), [password]);
  const level = [...LEVELS].reverse().find((l) => strength >= l.min) || LEVELS[0];

  if (!password) return null;

  return (
    <div className="mt-2">
      <div className="flex gap-1 mb-1">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all duration-300 ${
              i < strength ? level.color : "bg-white/10"
            }`}
          />
        ))}
      </div>
      <p className={`text-[10px] font-medium transition-colors ${
        strength >= 4 ? "text-emerald-400" : strength >= 3 ? "text-yellow-400" : strength >= 2 ? "text-orange-400" : "text-red-400"
      }`}>
        {level.label} password
        {password.length < 8 && <span className="text-muted-dark ml-1">· Min. 8 characters</span>}
      </p>
    </div>
  );
}
