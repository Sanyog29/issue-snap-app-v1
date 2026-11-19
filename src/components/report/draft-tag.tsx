'use client';

import { Sparkles } from 'lucide-react';
import type { Category, Priority } from '@/types/ai';

interface DraftTagProps {
  title: string;
  category: Category | string;
  department: string;
  priority: Priority;
  confidence: number;
}

export function DraftTag({
  title,
  category,
  department,
  priority,
  confidence,
}: DraftTagProps) {
  return (
    <div className="bg-surface border-2 border-line-soft rounded-photo p-4 shadow-sm space-y-2">
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary-ink">
          <Sparkles className="w-3.5 h-3.5 text-primary-ink" />
          {category}
        </span>
        <span
          className={`text-xs font-bold uppercase px-2 py-0.5 rounded ${
            priority === 'urgent'
              ? 'bg-red/10 text-red'
              : priority === 'high'
              ? 'bg-amber/10 text-amber'
              : 'bg-primary/10 text-primary-ink'
          }`}
        >
          {priority}
        </span>
      </div>

      <h2 className="text-lg font-bold text-ink leading-tight">{title}</h2>
      
      <div className="flex items-center justify-between text-xs text-ink-muted pt-1 border-t border-line-soft">
        <span>Dept: <strong className="text-ink font-medium">{department}</strong></span>
        <span>AI Match: {Math.round(confidence * 100)}%</span>
      </div>
    </div>
  );
}
