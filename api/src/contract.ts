import { z } from 'zod';

export type Category =
  | "plumbing" | "electrical" | "mold_moisture" | "appliance"
  | "pests" | "structure" | "heating_cooling" | "other";
export type Urgency = "routine" | "soon" | "possible_hazard";
export type Confidence = "low" | "medium" | "high";

export interface Analysis {
  is_housing_problem: boolean;
  visible_observations: string[];
  category: Category;
  location_in_unit: string | null;
  urgency: Urgency;
  hazard_note: string | null;
  cannot_determine: string[];
  confidence: Confidence;
  suggested_alt_text: string;
}

export interface Photo {
  photoId: string;          // UUID v4
  sha256: string;           // hex of the exact bytes stored in Cloud Storage
  url: string;              // "/api/cases/{caseId}/photos/{photoId}"
  exifTime: string | null;  // ISO 8601 from the original upload, or null. NOT verified.
}

export interface Entry {
  entryId: string;          // UUID v4
  caseId: string;
  createdAt: string;        // ISO 8601 UTC, set by the server. Authoritative.
  note: string;             // may be empty
  photos: Photo[];          // 1 to 3
  analysis: Analysis;
  edited: boolean;          // true once the user changed anything via PATCH
}

export interface CaseLog {
  caseId: string;
  createdAt: string;
  entries: Entry[];         // oldest first
}

export interface EmailDraft { subject: string; body: string; }

export interface ApiError { error: { code: ErrorCode; message: string } }
export type ErrorCode =
  | "BAD_REQUEST" | "NOT_FOUND" | "PAYLOAD_TOO_LARGE"
  | "TOO_MANY_REQUESTS" | "AI_UNAVAILABLE" | "AI_INVALID_OUTPUT";

export const uuidSchema = z.uuidv4();
export const analysisSchema = z.object({
  is_housing_problem: z.boolean(),
  visible_observations: z.array(z.string().min(1).max(600)).min(1).max(20),
  category: z.enum(['plumbing', 'electrical', 'mold_moisture', 'appliance', 'pests', 'structure', 'heating_cooling', 'other']),
  location_in_unit: z.string().max(200).nullable(),
  urgency: z.enum(['routine', 'soon', 'possible_hazard']),
  hazard_note: z.string().max(600).nullable(),
  cannot_determine: z.array(z.string().min(1).max(600)).max(20),
  confidence: z.enum(['low', 'medium', 'high']),
  suggested_alt_text: z.string().min(1).max(600),
}).strict();
export const aiAnalysisSchema = analysisSchema.refine(
  value => value.is_housing_problem || value.confidence === 'low',
  { message: 'Non-housing photos must have low confidence.' },
);
export const noteSchema = z.string().max(1000);
export const patchSchema = z.object({
  note: noteSchema.optional(),
  analysis: analysisSchema.partial().strict().optional(),
}).strict().refine(value => value.note !== undefined || (value.analysis && Object.keys(value.analysis).length > 0), {
  message: 'Provide a note or an analysis field to change.',
});
const nameSchema = z.string().trim().max(100).refine(value => !/[\r\n\x00-\x1f]/.test(value), 'Use a single line.');
export const emailRequestSchema = z.object({
  entryIds: z.array(uuidSchema).min(1).max(50).refine(ids => new Set(ids).size === ids.length, 'Choose each entry once.'),
  type: z.enum(['first', 'followup']),
  tenantName: nameSchema.optional(),
  landlordName: nameSchema.optional(),
  unit: nameSchema.optional(),
}).strict();
export type EmailRequest = z.infer<typeof emailRequestSchema>;
export const emailDraftSchema = z.object({
  subject: z.string().min(1).max(79).refine(value => !/[\r\n]/.test(value)),
  body: z.string().min(1).refine(value => value.trim().split(/\s+/).length < 180, 'Keep the body under 180 words.'),
}).strict().refine(value => !/\b(sue|lawsuit|legal action|attorney)\b/i.test(value.subject + ' ' + value.body), {
  message: 'Do not use legal threats.',
});
