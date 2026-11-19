// IssueSnap — Staff Module Types
import { RequestStatus } from '@/types';

export interface StaffFilterParams {
  status?: RequestStatus | 'all';
  department?: string | 'all';
  searchQuery?: string;
}

export interface UpdateStatusParams {
  requestId: string;
  newStatus: RequestStatus;
  oldStatus?: string;
  staffNotes?: string;
  resolvedImageUrl?: string;
  completionImageUrl?: string;
  userId?: string;
}
