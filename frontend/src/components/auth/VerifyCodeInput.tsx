"use client";

import { useRef, useState, useCallback, useEffect } from "react";

interface VerifyCodeInputProps {
  length?: number;
  onComplete: (code: string) => void;
  disabled?: boolean;
}

export default function VerifyCodeInput({ length = 6, onComplete, disabled }: VerifyCodeInputProps) {
  const [values, setValues] = useState<string[]>(Array(length).fill(""));
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  const focusInput = useCallback((index: number) => {
    if (index >= 0 && index < length) {
      inputs.current[index]?.focus();
    }
  }, [length]);

  useEffect(() => {
    focusInput(0);
  }, [focusInput]);

  const handleChange = (index: number, value: string) => {
    if (disabled) return;
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...values];
    next[index] = digit;
    setValues(next);

    if (digit && index < length - 1) {
      focusInput(index + 1);
    }

    const code = next.join("");
    if (code.length === length && next.every((v) => v)) {
      onComplete(code);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !values[index] && index > 0) {
      focusInput(index - 1);
    }
    if (e.key === "ArrowLeft") focusInput(index - 1);
    if (e.key === "ArrowRight") focusInput(index + 1);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    if (!text) return;

    const next = [...values];
    for (let i = 0; i < text.length; i++) {
      next[i] = text[i];
    }
    setValues(next);
    focusInput(Math.min(text.length, length - 1));

    if (text.length === length) {
      onComplete(text);
    }
  };

  return (
    <div className="flex gap-2 justify-center">
      {values.map((val, i) => (
        <input
          key={i}
          ref={(el) => { inputs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={val}
          disabled={disabled}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={i === 0 ? handlePaste : undefined}
          className="w-12 h-14 text-center text-xl font-semibold rounded-xl bg-white/[0.04] border border-white/10 text-foreground
            focus:outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 focus:bg-white/[0.06]
            disabled:opacity-50 transition-all duration-200 font-mono"
          autoComplete="one-time-code"
        />
      ))}
    </div>
  );
}
