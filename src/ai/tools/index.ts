import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { CATEGORIES, PRIORITIES } from '@/types/ai';

export const setTitleTool = ai.defineTool(
  {
    name: 'set_title',
    description: 'Set a concise, punchy title for the civic issue (<= 70 chars).',
    inputSchema: z.object({
      title: z.string().describe('Short headline of the problem'),
    }),
    outputSchema: z.string(),
  },
  async ({ title }) => title
);

export const setDescriptionTool = ai.defineTool(
  {
    name: 'set_description',
    description: "Detailed description of what is wrong, exact context, and visible impact in the user's chosen language.",
    inputSchema: z.object({
      description: z.string().describe('Thorough problem description'),
    }),
    outputSchema: z.string(),
  },
  async ({ description }) => description
);

export const setCategoryTool = ai.defineTool(
  {
    name: 'set_category',
    description: 'Categorize the civic issue and provide a confidence score between 0.0 and 1.0.',
    inputSchema: z.object({
      value: z.enum(CATEGORIES).describe('Category name'),
      confidence: z.number().min(0).max(1).describe('Confidence between 0 and 1'),
    }),
    outputSchema: z.object({
      value: z.enum(CATEGORIES),
      confidence: z.number(),
    }),
  },
  async (args) => args
);

export const setDepartmentTool = ai.defineTool(
  {
    name: 'set_department',
    description: 'Designate the target responsible department (e.g. Roads & Buildings, Sanitation, Electricity, Water Works, General Administration).',
    inputSchema: z.object({
      department: z.string().describe('Department name responsible for fixing this issue'),
    }),
    outputSchema: z.string(),
  },
  async ({ department }) => department
);

export const setPriorityTool = ai.defineTool(
  {
    name: 'set_priority',
    description: 'Set urgency priority level for the issue (low, medium, high, urgent).',
    inputSchema: z.object({
      value: z.enum(PRIORITIES).describe('Urgency level'),
      reason: z.string().describe('Reasoning for priority choice'),
    }),
    outputSchema: z.object({
      value: z.enum(PRIORITIES),
      reason: z.string(),
    }),
  },
  async (args) => args
);

export const flagSafetyTool = ai.defineTool(
  {
    name: 'flag_safety',
    description: 'Flag critical safety hazard if immediate danger is detected (exposed live wires, open manholes, active water main burst, gas leak).',
    inputSchema: z.object({
      reason: z.string().describe('Why this constitutes an immediate public safety hazard'),
    }),
    outputSchema: z.string(),
  },
  async ({ reason }) => reason
);

export const noteUnclearTool = ai.defineTool(
  {
    name: 'note_unclear',
    description: 'Ask the citizen one clarifying question if the image is ambiguous or lacks vital context.',
    inputSchema: z.object({
      question: z.string().describe('Clarifying question for citizen'),
    }),
    outputSchema: z.string(),
  },
  async ({ question }) => question
);
