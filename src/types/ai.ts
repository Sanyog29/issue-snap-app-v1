// IssueSnap v2 — AI tool types for VLM tool-use flow

export const CATEGORIES = [
  'Pothole',
  'Garbage',
  'Broken Streetlight',
  'Water Leak',
  'Drainage',
  'Trees',
  'Signage',
  'Noise',
  'Other',
] as const;
export type Category = (typeof CATEGORIES)[number];

export const PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const;
export type Priority = (typeof PRIORITIES)[number];

// Tool call argument types
export interface SetTitleArgs {
  title: string;
}
export interface SetDescriptionArgs {
  description: string;
}
export interface SetCategoryArgs {
  value: Category;
  confidence: number;
}
export interface SetDepartmentArgs {
  department_id: string;
}
export interface SetPriorityArgs {
  value: Priority;
  reason: string;
}
export interface FlagSafetyArgs {
  reason: string;
}
export interface NoteUnclearArgs {
  question: string;
}

// Assembled result after tool calls
export interface AnalysisResult {
  title: string;
  description: string;
  category: Category | null;
  department_id: string | null;
  priority: Priority;
  confidence: number;
  safety_flag: boolean;
  safety_reason: string | null;
  unclear_question: string | null;
  detected_objects: string[];
}
