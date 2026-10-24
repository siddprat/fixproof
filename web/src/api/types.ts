// Copied exactly from AGENTS.md "Types (copy these exactly)". Do not edit here
// without a `contract:` commit to AGENTS.md first.

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
