'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import {
  setTitleTool,
  setDescriptionTool,
  setCategoryTool,
  setDepartmentTool,
  setPriorityTool,
  flagSafetyTool,
  noteUnclearTool,
} from '@/ai/tools';
import type { AnalysisResult, Category, Priority } from '@/types/ai';

const AnalyzeImageInputSchema = z.object({
  photoDataUri: z.string().describe("Base64 encoded data URI of the issue photo: 'data:<mime>;base64,<encoded>'"),
  locationAddress: z.string().optional().describe('Address or GPS coords of the captured issue'),
  language: z.enum(['en', 'hi', 'te']).default('en').describe('Preferred output language'),
});

export type AnalyzeImageInput = z.infer<typeof AnalyzeImageInputSchema>;

export async function analyzeImage(input: AnalyzeImageInput): Promise<AnalysisResult> {
  const defaultTitle =
    input.language === 'hi'
      ? 'नागरिक समस्या'
      : input.language === 'te'
      ? 'పౌర సమస్య'
      : 'Civic Issue';

  const defaultDescription =
    input.language === 'hi'
      ? 'स्थान पर देखी गई समस्या का विवरण लिखें।'
      : input.language === 'te'
      ? 'గమనించిన సమస్య వివరాలు ఇక్కడ నమోదు చేయండి.'
      : 'Please describe the issue observed.';

  const prompt = `You are IssueSnap's vision-language assistant for municipal reporting.
Analyze the attached photo of a civic issue. You MUST call the appropriate tools to construct the complaint draft.

Target language for title and description: ${
    input.language === 'hi'
      ? 'Hindi (हिन्दी)'
      : input.language === 'te'
      ? 'Telugu (తెలుగు)'
      : 'English'
  }.

Location Context: ${input.locationAddress || 'Not provided'}
Photo: {{media url=photoDataUri}}

Instructions:
1. Always call 'set_title' with a concise title (<= 70 chars).
2. Always call 'set_description' detailing the problem and hazard.
3. Call 'set_category' picking one of: Pothole, Garbage, Broken Streetlight, Water Leak, Drainage, Trees, Signage, Noise, Other, with a realistic confidence score (0.0 to 1.0).
4. Call 'set_department' designating the department responsible.
5. Call 'set_priority' choosing low, medium, high, or urgent.
6. If an immediate life or physical safety hazard is visible (open manhole, live wire, structural collapse), call 'flag_safety'.
7. If image is too blurry or unclear, call 'note_unclear'.`;

  try {
    const response = await ai.generate({
      prompt: [
        { text: prompt },
        { media: { url: input.photoDataUri } },
      ],
      tools: [
        setTitleTool,
        setDescriptionTool,
        setCategoryTool,
        setDepartmentTool,
        setPriorityTool,
        flagSafetyTool,
        noteUnclearTool,
      ],
    });

    const toolRequests = response.toolRequests || [];

    let title = defaultTitle;
    let description = defaultDescription;
    let category: Category | null = null;
    let department_id: string | null = 'Public Works';
    let priority: Priority = 'medium';
    let confidence = 0.85;
    let safety_flag = false;
    let safety_reason: string | null = null;
    let unclear_question: string | null = null;

    for (const part of toolRequests) {
      const req = part.toolRequest;
      if (!req) continue;
      const args = (req.input || {}) as Record<string, unknown>;
      switch (req.name) {
        case 'set_title':
          if (typeof args.title === 'string') title = args.title;
          break;
        case 'set_description':
          if (typeof args.description === 'string') description = args.description;
          break;
        case 'set_category':
          if (typeof args.value === 'string') category = args.value as Category;
          if (typeof args.confidence === 'number') confidence = args.confidence;
          break;
        case 'set_department':
          if (typeof args.department === 'string') department_id = args.department;
          break;
        case 'set_priority':
          if (typeof args.value === 'string') priority = args.value as Priority;
          break;
        case 'flag_safety':
          safety_flag = true;
          priority = 'urgent';
          if (typeof args.reason === 'string') safety_reason = args.reason;
          break;
        case 'note_unclear':
          if (typeof args.question === 'string') unclear_question = args.question;
          break;
      }
    }

    if (!category) {
      category = 'Other';
      confidence = 0.5;
    }

    return {
      title,
      description,
      category,
      department_id,
      priority,
      confidence,
      safety_flag,
      safety_reason,
      unclear_question,
      detected_objects: [],
    };
  } catch (err) {
    console.warn(
      '[AnalyzeImage] Vision AI service unavailable or quota limited, activating graceful fallback:',
      err instanceof Error ? err.message : err
    );

    // Return a clean fallback analysis so the review screen loads instantly and submission never fails
    return {
      title: defaultTitle,
      description: defaultDescription,
      category: 'Other',
      department_id: 'Public Works',
      priority: 'medium',
      confidence: 0.7,
      safety_flag: false,
      safety_reason: null,
      unclear_question: null,
      detected_objects: [],
    };
  }
}
