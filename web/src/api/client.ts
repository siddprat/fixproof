// Typed client for every endpoint in AGENTS.md.
// VITE_USE_MOCK=true routes every call to the in-browser mock.
// On any failure this throws an ApiClientError carrying the ApiError code and message.

import type { Analysis, ApiError, CaseLog, EmailDraft, Entry, ErrorCode, Photo } from "./types";
import { MockHttpError, mockApi, mockPhotoSrc } from "./mock";

export const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";

/** Client-side only: "NETWORK" means the request never got an answer. Not part of the contract. */
export type ClientErrorCode = ErrorCode | "NETWORK";

export class ApiClientError extends Error {
  code: ClientErrorCode;
  status: number;
  constructor(code: ClientErrorCode, message: string, status: number) {
    super(message);
    this.name = "ApiClientError";
    this.code = code;
    this.status = status;
  }
}

export interface Health { ok: true; model: string; mode: "hosted" | "local" }
export interface EmailRequest {
  entryIds: string[];
  type: "first" | "followup";
  tenantName?: string;
  landlordName?: string;
  unit?: string;
}
export interface EntryPatch { note?: string; analysis?: Partial<Analysis> }
export interface VerifyResult { results: { photoId: string; ok: boolean }[] }

const KNOWN_CODES: ErrorCode[] = [
  "BAD_REQUEST", "NOT_FOUND", "PAYLOAD_TOO_LARGE", "TOO_MANY_REQUESTS", "AI_UNAVAILABLE", "AI_INVALID_OUTPUT",
];

function codeFromStatus(status: number): ErrorCode {
  if (status === 404) return "NOT_FOUND";
  if (status === 413) return "PAYLOAD_TOO_LARGE";
  if (status === 429) return "TOO_MANY_REQUESTS";
  if (status >= 500) return "AI_UNAVAILABLE";
  return "BAD_REQUEST";
}

function isApiError(v: unknown): v is ApiError {
  if (typeof v !== "object" || v === null || !("error" in v)) return false;
  const e = (v as { error: unknown }).error;
  return typeof e === "object" && e !== null && "code" in e
    && KNOWN_CODES.includes((e as { code: ErrorCode }).code);
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`/api${path}`, { ...init, headers: { Accept: "application/json", ...init.headers } });
  } catch {
    throw new ApiClientError("NETWORK", "Network request failed", 0);
  }
  const text = await res.text();
  let body: unknown = null;
  try { body = text ? JSON.parse(text) : null; } catch { /* not JSON */ }
  if (!res.ok) {
    if (isApiError(body)) throw new ApiClientError(body.error.code, body.error.message, res.status);
    throw new ApiClientError(codeFromStatus(res.status), text.slice(0, 200) || res.statusText, res.status);
  }
  return body as T;
}

const json = (method: string, data: unknown): RequestInit => ({
  method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
});

/** Run a mock call and convert its errors to the same ApiClientError the real path throws. */
async function viaMock<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    if (err instanceof MockHttpError) throw new ApiClientError(err.body.error.code, err.body.error.message, err.status);
    throw err;
  }
}

const enc = encodeURIComponent;

export const api = {
  health(): Promise<Health> {
    return USE_MOCK ? viaMock(() => mockApi.health()) : request<Health>("/health");
  },

  createCase(): Promise<{ caseId: string }> {
    return USE_MOCK ? viaMock(() => mockApi.createCase()) : request("/cases", { method: "POST" });
  },

  getCase(caseId: string): Promise<CaseLog> {
    return USE_MOCK ? viaMock(() => mockApi.getCase(caseId)) : request(`/cases/${enc(caseId)}`);
  },

  createEntry(caseId: string, photos: File[], note: string): Promise<{ entry: Entry }> {
    if (USE_MOCK) return viaMock(() => mockApi.createEntry(caseId, photos, note));
    const form = new FormData();
    for (const p of photos) form.append("photos", p, p.name);
    if (note) form.append("note", note);
    return request(`/cases/${enc(caseId)}/entries`, { method: "POST", body: form });
  },

  patchEntry(caseId: string, entryId: string, patch: EntryPatch): Promise<{ entry: Entry }> {
    return USE_MOCK
      ? viaMock(() => mockApi.patchEntry(caseId, entryId, patch))
      : request(`/cases/${enc(caseId)}/entries/${enc(entryId)}`, json("PATCH", patch));
  },

  verify(caseId: string): Promise<VerifyResult> {
    return USE_MOCK ? viaMock(() => mockApi.verify(caseId)) : request(`/cases/${enc(caseId)}/verify`);
  },

  email(caseId: string, req: EmailRequest): Promise<EmailDraft> {
    return USE_MOCK
      ? viaMock(() => mockApi.email(caseId, req))
      : request(`/cases/${enc(caseId)}/email`, json("POST", req));
  },

  deleteCase(caseId: string): Promise<{ deleted: true }> {
    return USE_MOCK
      ? viaMock(() => mockApi.deleteCase(caseId))
      : request(`/cases/${enc(caseId)}`, { method: "DELETE" });
  },

  /** Where an <img> should load a photo from. */
  photoSrc(photo: Photo): string {
    return USE_MOCK ? mockPhotoSrc(photo) : photo.url;
  },
};
