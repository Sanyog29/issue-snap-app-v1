import {
  CircleDot,
  Eye,
  Wrench,
  CheckCircle,
  RotateCcw,
  Ban,
} from 'lucide-react';
import type { RequestStatus } from '@/types/database';

interface StatusChipProps {
  status: RequestStatus | string;
  department?: string | null;
}

export function StatusChip({ status, department }: StatusChipProps) {
  switch (status) {
    case 'submitted':
    case 'New':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-ink/10 text-ink">
          <CircleDot className="w-3.5 h-3.5 text-ink-muted" />
          Received
        </span>
      );
    case 'acknowledged':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/15 text-primary-ink">
          <Eye className="w-3.5 h-3.5 text-primary-ink" />
          {department ? `Seen by ${department}` : 'Seen by Staff'}
        </span>
      );
    case 'in_progress':
    case 'In Progress':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/15 text-primary-ink">
          <Wrench className="w-3.5 h-3.5 text-primary-ink" />
          Being Fixed
        </span>
      );
    case 'resolved':
    case 'Resolved':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-green/15 text-green">
          <CheckCircle className="w-3.5 h-3.5 text-green" />
          Fixed
        </span>
      );
    case 'reopened':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber/15 text-amber">
          <RotateCcw className="w-3.5 h-3.5 text-amber" />
          Reopened
        </span>
      );
    case 'rejected':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red/15 text-red">
          <Ban className="w-3.5 h-3.5 text-red" />
          Can&apos;t Act
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-ink/10 text-ink">
          {status}
        </span>
      );
  }
}
