import { randomUUID } from 'node:crypto';
import { Readable } from 'node:stream';
import type { CaseStore } from '../src/store.js';
import type { Analysis, CaseLog, Entry } from '../src/contract.js';
import { ApiFailure } from '../src/errors.js';
import { hashPhoto, type ProcessedPhoto } from '../src/photos.js';

// Test double only. Production always uses Firestore and private Cloud Storage.
export class MemoryStore implements CaseStore {
  cases = new Map<string, CaseLog>();
  photos = new Map<string, Buffer>();
  async createCase() { const id = randomUUID(); this.cases.set(id, { caseId: id, createdAt: new Date().toISOString(), entries: [] }); return id; }
  async getCase(id: string) { const log = this.cases.get(id); if (!log) throw new ApiFailure('NOT_FOUND', 'Case not found.'); return structuredClone(log); }
  async saveEntry(id: string, note: string, analysis: Analysis, photos: ProcessedPhoto[]) {
    await this.getCase(id);
    const entry: Entry = { caseId: id, entryId: randomUUID(), createdAt: new Date().toISOString(), note, analysis, edited: false, photos: photos.map(photo => {
      const photoId = randomUUID(); this.photos.set(photoId, photo.bytes);
      return { photoId, sha256: photo.sha256, exifTime: photo.exifTime, url: `/api/cases/${id}/photos/${photoId}` };
    }) };
    this.cases.get(id)!.entries.push(entry); return entry;
  }
  async patchEntry(id: string, entryId: string, patch: { note?: string; analysis?: Partial<Analysis> }) {
    await this.getCase(id);
    const entry = this.cases.get(id)!.entries.find(item => item.entryId === entryId);
    if (!entry) throw new ApiFailure('NOT_FOUND', 'Entry not found.');
    Object.assign(entry, { note: patch.note ?? entry.note, analysis: { ...entry.analysis, ...patch.analysis }, edited: true }); return entry;
  }
  async photoStream(id: string, photoId: string) {
    const log = await this.getCase(id);
    if (!log.entries.some(entry => entry.photos.some(photo => photo.photoId === photoId))) throw new ApiFailure('NOT_FOUND', 'Photo not found.');
    return Readable.from(this.photos.get(photoId)!);
  }
  async verify(id: string) { return (await this.getCase(id)).entries.flatMap(entry => entry.photos.map(photo => ({ photoId: photo.photoId, ok: hashPhoto(this.photos.get(photo.photoId)!) === photo.sha256 }))); }
  async deleteCase(id: string) { const log = await this.getCase(id); for (const entry of log.entries) for (const photo of entry.photos) this.photos.delete(photo.photoId); this.cases.delete(id); }
}
