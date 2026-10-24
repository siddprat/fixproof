// In-browser mock of every endpoint in AGENTS.md. Used when VITE_USE_MOCK=true.
//
// Failure modes (add to the URL, they stick for the browser tab):
//   ?mock=fail-ai   entries and email calls fail with AI_UNAVAILABLE (502)
//   ?mock=invalid   entries and email calls fail with AI_INVALID_OUTPUT (502)
//   ?mock=seed      fill the current case with the four fixture entries
//   ?mock=off       clear any sticky failure mode
//
// State is kept in localStorage (wrapped in try/catch) so a reload keeps the case.

import type {
  Analysis, ApiError, CaseLog, EmailDraft, Entry, ErrorCode, Photo,
} from "./types";
import { analysisRotation, fixtureArt, seedEntries } from "./fixtures";
import { formatDateNY, uuid } from "../lib/format";

const LATENCY_MS = 1500;
const QUICK_MS = 250;
const STORE_KEY = "fixproof.mock.store";
const MODE_KEY = "fixproof.mock.mode";

interface MockCase { log: CaseLog; images: Record<string, string>; rotation: number }
type Store = Record<string, MockCase>;

/** Thrown by the mock with the same shape the real client throws. */
export class MockHttpError extends Error {
  status: number;
  body: ApiError;
  constructor(status: number, code: ErrorCode, message: string) {
    super(message);
    this.status = status;
    this.body = { error: { code, message } };
  }
}

// ---------- storage helpers ----------

let memoryStore: Store = {};

function loadStore(): Store {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) memoryStore = JSON.parse(raw) as Store;
  } catch { /* storage blocked: keep in memory only */ }
  return memoryStore;
}

function saveStore(store: Store): void {
  memoryStore = store;
  try { localStorage.setItem(STORE_KEY, JSON.stringify(store)); } catch { /* quota or blocked */ }
}

function readMode(): string | null {
  const fromUrl = new URLSearchParams(window.location.search).get("mock");
  try {
    if (fromUrl === "off") { sessionStorage.removeItem(MODE_KEY); return null; }
    if (fromUrl === "fail-ai" || fromUrl === "invalid") sessionStorage.setItem(MODE_KEY, fromUrl);
    return sessionStorage.getItem(MODE_KEY) ?? fromUrl;
  } catch {
    return fromUrl;
  }
}

// Every mock call reads the URL first, so ?mock=off (or a new mode) applies on page load,
// not only on the next AI call.
const wait = (ms: number) => { readMode(); return new Promise<void>((r) => setTimeout(r, ms)); };
const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v)) as T;

function failIfAiModeSet(): void {
  const mode = readMode();
  if (mode === "fail-ai") throw new MockHttpError(502, "AI_UNAVAILABLE", "Mock: model unreachable");
  if (mode === "invalid") throw new MockHttpError(502, "AI_INVALID_OUTPUT", "Mock: model output failed schema");
}

function getCase(store: Store, caseId: string): MockCase {
  const c = store[caseId];
  if (!c) throw new MockHttpError(404, "NOT_FOUND", "Case not found");
  return c;
}

// ---------- image helpers ----------

function placeholderSvg(label: string, bg: string, fg: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="480" viewBox="0 0 640 480">`
    + `<rect width="640" height="480" fill="${bg}"/>`
    + `<text x="320" y="250" font-family="system-ui,sans-serif" font-size="40" fill="${fg}" text-anchor="middle">${label}</text>`
    + `<text x="320" y="300" font-family="system-ui,sans-serif" font-size="20" fill="${fg}" text-anchor="middle">mock photo</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/** Shrink an upload to a small JPEG data URL (stands in for the server's resize + strip). */
async function fileToDataUrl(file: File): Promise<string> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, 640 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.8);
  } catch {
    return placeholderSvg("Your photo", "#dde3ea", "#2b3a4a");
  }
}

async function sha256Hex(text: string): Promise<string> {
  try {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
    return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
  } catch {
    // crypto.subtle needs a secure context (not plain http on a LAN IP). Mock only.
    let h = 0;
    for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) >>> 0;
    return h.toString(16).padStart(8, "0").repeat(8);
  }
}

/** The mock's image source for a photo. Real mode just uses photo.url. */
export function mockPhotoSrc(photo: Photo): string {
  const store = loadStore();
  for (const c of Object.values(store)) {
    const img = c.images[photo.photoId];
    if (img) return img;
  }
  const art = fixtureArt[photo.photoId];
  return art ? placeholderSvg(art.label, art.bg, art.fg) : placeholderSvg("Photo", "#dde3ea", "#2b3a4a");
}

// ---------- endpoints ----------

export const mockApi = {
  async health(): Promise<{ ok: true; model: string; mode: "hosted" | "local" }> {
    await wait(QUICK_MS);
    return { ok: true, model: "mock-gemma", mode: "hosted" };
  },

  async createCase(): Promise<{ caseId: string }> {
    await wait(QUICK_MS);
    const store = loadStore();
    const caseId = uuid();
    store[caseId] = { log: { caseId, createdAt: new Date().toISOString(), entries: [] }, images: {}, rotation: 0 };
    saveStore(store);
    return { caseId };
  },

  async getCase(caseId: string): Promise<CaseLog> {
    await wait(QUICK_MS);
    const store = loadStore();
    const c = getCase(store, caseId);
    if (new URLSearchParams(window.location.search).get("mock") === "seed" && c.log.entries.length === 0) {
      c.log.entries = seedEntries.map((e) => ({ ...clone(e), caseId }));
      saveStore(store);
    }
    return clone(c.log);
  },

  async createEntry(caseId: string, files: File[], note: string): Promise<{ entry: Entry }> {
    await wait(LATENCY_MS);
    const store = loadStore();
    const c = getCase(store, caseId);
    if (files.length < 1 || files.length > 3) throw new MockHttpError(400, "BAD_REQUEST", "Send 1 to 3 photos");
    if (note.length > 1000) throw new MockHttpError(400, "BAD_REQUEST", "Note too long");
    if (c.log.entries.length >= 50) throw new MockHttpError(400, "BAD_REQUEST", "Case is full");
    for (const f of files) {
      if (f.size > 8 * 1024 * 1024) throw new MockHttpError(413, "PAYLOAD_TOO_LARGE", "File over 8 MB");
      if (!["image/jpeg", "image/png", "image/webp"].includes(f.type)) {
        throw new MockHttpError(400, "BAD_REQUEST", "Unsupported file type");
      }
    }
    failIfAiModeSet();

    const photos: Photo[] = [];
    for (const f of files) {
      const photoId = uuid();
      const dataUrl = await fileToDataUrl(f);
      c.images[photoId] = dataUrl;
      photos.push({
        photoId,
        sha256: await sha256Hex(dataUrl),
        url: `/api/cases/${caseId}/photos/${photoId}`,
        // The real server reads EXIF. The mock uses the file's modified time as a stand-in.
        exifTime: f.lastModified ? new Date(f.lastModified).toISOString() : null,
      });
    }
    const analysis: Analysis = clone(analysisRotation[c.rotation % analysisRotation.length]);
    c.rotation += 1;
    const entry: Entry = {
      entryId: uuid(), caseId, createdAt: new Date().toISOString(), note, photos, analysis, edited: false,
    };
    c.log.entries.push(entry);
    saveStore(store);
    return { entry: clone(entry) };
  },

  async patchEntry(
    caseId: string, entryId: string, patch: { note?: string; analysis?: Partial<Analysis> },
  ): Promise<{ entry: Entry }> {
    await wait(QUICK_MS);
    const store = loadStore();
    const c = getCase(store, caseId);
    const entry = c.log.entries.find((e) => e.entryId === entryId);
    if (!entry) throw new MockHttpError(404, "NOT_FOUND", "Entry not found");
    if (patch.note !== undefined) {
      if (patch.note.length > 1000) throw new MockHttpError(400, "BAD_REQUEST", "Note too long");
      entry.note = patch.note;
    }
    if (patch.analysis) entry.analysis = { ...entry.analysis, ...patch.analysis };
    entry.edited = true;
    saveStore(store);
    return { entry: clone(entry) };
  },

  async verify(caseId: string): Promise<{ results: { photoId: string; ok: boolean }[] }> {
    await wait(QUICK_MS * 2);
    const store = loadStore();
    const c = getCase(store, caseId);
    const results: { photoId: string; ok: boolean }[] = [];
    for (const e of c.log.entries) {
      for (const p of e.photos) {
        const img = c.images[p.photoId];
        // Fixture photos have no stored bytes in the mock; treat them as unchanged.
        results.push({ photoId: p.photoId, ok: img ? (await sha256Hex(img)) === p.sha256 : true });
      }
    }
    return { results };
  },

  async email(
    caseId: string,
    req: { entryIds: string[]; type: "first" | "followup"; tenantName?: string; landlordName?: string; unit?: string },
  ): Promise<EmailDraft> {
    await wait(LATENCY_MS);
    const store = loadStore();
    const c = getCase(store, caseId);
    if (req.entryIds.length === 0) throw new MockHttpError(400, "BAD_REQUEST", "Pick at least one entry");
    const entries = c.log.entries.filter((e) => req.entryIds.includes(e.entryId));
    if (entries.length !== req.entryIds.length) throw new MockHttpError(404, "NOT_FOUND", "Entry not found");
    failIfAiModeSet();

    const latest = entries[entries.length - 1];
    const where = latest.analysis.location_in_unit ?? "my unit";
    const unit = req.unit ? ` in unit ${req.unit}` : "";
    const dates = entries.map((e) => formatDateNY(e.createdAt));
    const obs = latest.analysis.visible_observations.slice(0, 3).map((o) => `- ${o}`).join("\n");
    const greeting = req.landlordName ? `Hello ${req.landlordName},` : "Hello,";
    const sign = req.tenantName || "[Your name]";

    if (req.type === "followup" && entries.length > 1) {
      const earlier = dates.slice(0, -1).join(", ");
      return {
        subject: `Follow-up: repair needed at ${where}${unit}`.slice(0, 79),
        body: `${greeting}\n\nI am following up on the repair problem I reported on ${earlier}. It is still not fixed. `
          + `On ${dates[dates.length - 1]} I saw:\n${obs}\n\nI have dated photos of each report and can send them. `
          + `Please reply to confirm you got this and let me know a date for the repair.\n\nThank you,\n${sign}`,
      };
    }
    return {
      subject: `Repair request: ${where}${unit}`.slice(0, 79),
      body: `${greeting}\n\nI would like to report a repair problem at ${where}${unit}. On ${dates[dates.length - 1]} I saw:\n${obs}\n\n`
        + `I have dated photos and can send them. Please let me know when someone can take a look.\n\nThank you,\n${sign}`,
    };
  },

  async deleteCase(caseId: string): Promise<{ deleted: true }> {
    await wait(QUICK_MS);
    const store = loadStore();
    getCase(store, caseId);
    delete store[caseId];
    saveStore(store);
    return { deleted: true };
  },
};
