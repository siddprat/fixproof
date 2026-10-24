import { randomUUID } from 'node:crypto';
import { Readable } from 'node:stream';
import { Firestore, FieldValue } from '@google-cloud/firestore';
import { Storage } from '@google-cloud/storage';
import type { Analysis, CaseLog, Entry } from './contract.js';
import { analysisSchema } from './contract.js';
import type { Config } from './config.js';
import { ApiFailure } from './errors.js';
import { hashPhoto, type ProcessedPhoto } from './photos.js';

export interface CaseStore {
  createCase(): Promise<string>;
  getCase(caseId: string): Promise<CaseLog>;
  saveEntry(caseId: string, note: string, analysis: Analysis, photos: ProcessedPhoto[]): Promise<Entry>;
  patchEntry(caseId: string, entryId: string, patch: { note?: string; analysis?: Partial<Analysis> }): Promise<Entry>;
  photoStream(caseId: string, photoId: string): Promise<Readable>;
  verify(caseId: string): Promise<{ photoId: string; ok: boolean }[]>;
  deleteCase(caseId: string): Promise<void>;
}
const missing = () => new ApiFailure('NOT_FOUND', 'We could not find that case or photo.');

export class CloudStore implements CaseStore {
  private db: Firestore;
  private bucket;
  constructor(config: Config) {
    this.db = new Firestore({ projectId: config.GOOGLE_CLOUD_PROJECT });
    this.bucket = new Storage({ projectId: config.GOOGLE_CLOUD_PROJECT, retryOptions: { maxRetries: 2 } }).bucket(config.GCS_BUCKET);
  }
  private ref(caseId: string) { return this.db.collection('cases').doc(caseId); }
  private path(caseId: string, entryId: string, photoId: string) { return `cases/${caseId}/${entryId}/${photoId}.jpg`; }
  async createCase() {
    const caseId = randomUUID();
    await this.ref(caseId).create({ createdAt: new Date().toISOString() });
    return caseId;
  }
  async getCase(caseId: string): Promise<CaseLog> {
    const ref = this.ref(caseId);
    const snapshot = await ref.get();
    if (!snapshot.exists || snapshot.get('deleting')) throw missing();
    const entries = await ref.collection('entries').orderBy('createdAt', 'asc').get();
    return { caseId, createdAt: snapshot.get('createdAt') as string, entries: entries.docs.map(doc => doc.data() as Entry) };
  }
  // A Firestore lease serializes writes across Cloud Run instances. Analysis happens before
  // this lease, so a slow model never blocks deletion. Deleted cases cannot be recreated.
  private async write<T>(caseId: string, action: () => Promise<T>, deleting = false): Promise<T> {
    const ref = this.ref(caseId);
    const owner = randomUUID();
    await this.db.runTransaction(async tx => {
      const doc = await tx.get(ref);
      if (!doc.exists || (!deleting && doc.get('deleting'))) throw missing();
      if (Number(doc.get('leaseUntil') ?? 0) > Date.now()) {
        throw new ApiFailure('BAD_REQUEST', 'This case is being saved. Please try again in a moment.');
      }
      tx.update(ref, { leaseOwner: owner, leaseUntil: Date.now() + 120_000, ...(deleting ? { deleting: true } : {}) });
    });
    try { return await action(); }
    finally {
      await this.db.runTransaction(async tx => {
        const doc = await tx.get(ref);
        if (doc.exists && doc.get('leaseOwner') === owner) {
          tx.update(ref, { leaseOwner: FieldValue.delete(), leaseUntil: FieldValue.delete() });
        }
      }).catch(() => console.error('Could not release case write lease.'));
    }
  }
  async saveEntry(caseId: string, note: string, analysis: Analysis, photos: ProcessedPhoto[]): Promise<Entry> {
    return this.write(caseId, async () => {
      const ref = this.ref(caseId);
      const existing = await ref.collection('entries').limit(50).get();
      if (existing.size >= 50) throw new ApiFailure('BAD_REQUEST', 'This case already has 50 entries.');
      const entryId = randomUUID();
      const entry: Entry = {
        entryId, caseId, createdAt: new Date().toISOString(), note, analysis, edited: false,
        photos: photos.map(photo => {
          const photoId = randomUUID();
          return { photoId, sha256: photo.sha256, exifTime: photo.exifTime, url: `/api/cases/${caseId}/photos/${photoId}` };
        }),
      };
      try {
        for (const [index, photo] of photos.entries()) {
          const saved = entry.photos[index]!;
          await this.bucket.file(this.path(caseId, entryId, saved.photoId)).save(photo.bytes, {
            resumable: false, timeout: 15_000,
            metadata: { contentType: 'image/jpeg', cacheControl: 'private, no-store' },
          });
        }
        await ref.collection('entries').doc(entryId).create(entry);
        return entry;
      } catch (error) {
        await this.bucket.deleteFiles({ prefix: `cases/${caseId}/${entryId}/` });
        throw error;
      }
    });
  }
  async patchEntry(caseId: string, entryId: string, patch: { note?: string; analysis?: Partial<Analysis> }): Promise<Entry> {
    return this.write(caseId, async () => {
      const ref = this.ref(caseId).collection('entries').doc(entryId);
      const doc = await ref.get();
      if (!doc.exists) throw missing();
      const current = doc.data() as Entry;
      const entry: Entry = {
        ...current, note: patch.note ?? current.note,
        analysis: analysisSchema.parse({ ...current.analysis, ...patch.analysis }), edited: true,
      };
      await ref.set(entry);
      return entry;
    });
  }
  private async photoPath(caseId: string, photoId: string) {
    const log = await this.getCase(caseId);
    const entry = log.entries.find(entry => entry.photos.some(photo => photo.photoId === photoId));
    if (!entry) throw missing();
    return this.path(caseId, entry.entryId, photoId);
  }
  async photoStream(caseId: string, photoId: string) {
    const file = this.bucket.file(await this.photoPath(caseId, photoId));
    if (!(await file.exists())[0]) throw missing();
    return file.createReadStream();
  }
  async verify(caseId: string) {
    const log = await this.getCase(caseId);
    const results: { photoId: string; ok: boolean }[] = [];
    for (const entry of log.entries) {
      for (const photo of entry.photos) {
        try {
          const [bytes] = await this.bucket.file(this.path(caseId, entry.entryId, photo.photoId)).download();
          results.push({ photoId: photo.photoId, ok: hashPhoto(bytes) === photo.sha256 });
        } catch (error) {
          if ((error as { code?: number }).code !== 404) throw error;
          results.push({ photoId: photo.photoId, ok: false });
        }
      }
    }
    return results;
  }
  async deleteCase(caseId: string) {
    await this.write(caseId, async () => {
      const ref = this.ref(caseId);
      const prefix = `cases/${caseId}/`;
      await this.bucket.deleteFiles({ prefix });
      // Keep the tombstone until all children and blobs have been removed.
      await this.db.recursiveDelete(ref.collection('entries'));
      const [files] = await this.bucket.getFiles({ prefix, maxResults: 1 });
      const entries = await ref.collection('entries').limit(1).get();
      if (files.length || !entries.empty) throw new Error('Deletion incomplete.');
      await ref.delete();
      if ((await ref.get()).exists) throw new Error('Deletion incomplete.');
    }, true);
  }
}
