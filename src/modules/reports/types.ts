// IssueSnap — Reports Module Types
import { Category, Priority, RequestStatus } from '@/types';

export interface ReportSubmissionInput {
  title: string;
  description: string;
  category: Category;
  department: string;
  priority: Priority;
  locationLat: number;
  locationLng: number;
  locationAddress: string;
  reporterId?: string | null;
  reporterEmail?: string | null;
  reporterPhone?: string | null;
  photoDataUri?: string | null;
  aiAnalysisData?: {
    confidence?: number;
    safety_flag?: boolean;
    model?: string;
    detected_objects?: string[];
  };
}

export interface ReportSubmissionResult {
  success: boolean;
  requestId?: string;
  trackingToken?: string;
  error?: string;
}
