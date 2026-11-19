'use client';

import { useRef, useEffect } from 'react';

interface CodeInputProps {
  code: string[];
  onChange: (code: string[]) => void;
  disabled?: boolean;
}

export function CodeInput({ code, onChange, disabled = false }: CodeInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (index: number, val: string) => {
    // Only accept numeric
    const clean = val.replace(/[^0-9]/g, '');
    if (!clean) {
      const updated = [...code];
      updated[index] = '';
      onChange(updated);
      return;
    }

    if (clean.length > 1) {
      // Pasting full code
      const digits = clean.slice(0, 6).split('');
      const updated = [...code];
      digits.forEach((d, i) => {
        if (i < 6) updated[i] = d;
      });
      onChange(updated);
      const nextIdx = Math.min(digits.length, 5);
      inputRefs.current[nextIdx]?.focus();
      return;
    }

    const updated = [...code];
    updated[index] = clean;
    onChange(updated);

    if (index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  return (
    <div className="flex justify-between items-center gap-2 w-full max-w-xs mx-auto">
      {Array.from({ length: 6 }).map((_, i) => (
        <input
          key={i}
          ref={(el) => {
            inputRefs.current[i] = el;
          }}
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          disabled={disabled}
          value={code[i] || ''}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          className="w-11 h-12 text-center text-xl font-bold font-mono border-2 border-line focus:border-primary-ink focus:ring-2 focus:ring-primary-ink/20 rounded-control text-ink bg-surface outline-none transition-all"
        />
      ))}
    </div>
  );
}
