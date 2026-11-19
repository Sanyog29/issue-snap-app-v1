// IssueSnap v2 — Database types (matches live Supabase schema)

export type UserType = 'citizen' | 'employee' | 'admin';
export type RequestStatus = 'submitted' | 'acknowledged' | 'in_progress' | 'resolved' | 'reopened' | 'rejected';
export type RequestPriority = 'low' | 'medium' | 'high' | 'urgent';
export type Language = 'en' | 'hi' | 'te';

export interface User {
  id: string;
  email: string | null;
  user_type: UserType;
  full_name: string;
  phone: string | null;
  preferred_language: Language;
  department_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Department {
  id: string;
  name: string;
  description: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  response_time_hours: number | null;
  active: boolean;
  created_at: string;
}

export interface Request {
  id: string;
  reporter_id: string | null;
  assigned_employee_id: string | null;
  title: string;
  description: string;
  original_image_url: string;
  completion_image_url: string | null;
  location_lat: number;
  location_lng: number;
  location_address: string | null;
  status: RequestStatus;
  priority: RequestPriority;
  category: string | null;
  department: string | null;
  reporter_phone: string | null;
  estimated_resolution_time: number | null;
  actual_resolution_time: number | null;
  citizen_rating: number | null;
  resolution_notes: string | null;
  audio_description: string | null;
  ai_analysis_data: AiAnalysisData | null;
  tracking_token: string;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export interface RequestUpdate {
  id: string;
  request_id: string;
  user_id: string | null;
  update_type: string;
  image_url: string | null;
  created_at: string;
}

export interface NotificationPreferences {
  id: string;
  user_id: string;
  email_notifications: boolean;
  sms_notifications: boolean;
  push_notifications: boolean;
  created_at: string;
  updated_at: string;
}

export interface AiAnalysisData {
  tool_calls?: AiToolCall[];
  model: string;
  latency_ms?: number;
  confidence: number;
  safety_flag: boolean;
  detected_objects?: string[];
}

export interface AiToolCall {
  tool: string;
  args: Record<string, unknown>;
}

export interface AnalyticsData {
  id: string;
  date: string;
  total_reports: number;
  resolved_reports: number;
  average_resolution_time: number;
  department: string;
  location_zone: string;
  created_at: string;
}
