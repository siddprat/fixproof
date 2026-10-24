import { createHash } from 'node:crypto';
import sharp from 'sharp';
import exifr from 'exifr';
import { ApiFailure } from './errors.js';

export const MAX_PHOTO_BYTES = 8 * 1024 * 1024;
export interface ProcessedPhoto { bytes: Buffer; sha256: string; exifTime: string | null }
export const hashPhoto = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex');

export async function processPhoto(input: Buffer): Promise<ProcessedPhoto> {
  if (input.length > MAX_PHOTO_BYTES) throw new ApiFailure('PAYLOAD_TOO_LARGE', 'Each photo must be 8 MB or smaller.');
  try {
    const image = sharp(input, { limitInputPixels: 40_000_000, failOn: 'error' });
    const metadata = await image.metadata();
    if (!metadata.format || !['jpeg', 'png', 'webp'].includes(metadata.format) || (metadata.pages ?? 1) > 1) {
      throw new ApiFailure('BAD_REQUEST', 'Choose a still JPEG, PNG, or WebP photo.');
    }
    let exifTime: string | null = null;
    try {
      const exif = await exifr.parse(input, { pick: ['DateTimeOriginal', 'OffsetTimeOriginal'] });
      const time = exif?.DateTimeOriginal;
      if (time instanceof Date && Number.isFinite(time.getTime())) exifTime = time.toISOString();
    } catch { /* Missing or damaged camera metadata is optional. */ }
    // Auto-orient before stripping all original metadata. Sharp drops metadata by default.
    const bytes = await image.rotate().resize({ width: 1280, height: 1280, fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 80 }).toBuffer();
    return { bytes, sha256: hashPhoto(bytes), exifTime };
  } catch (error) {
    if (error instanceof ApiFailure) throw error;
    throw new ApiFailure('BAD_REQUEST', 'We could not read that photo. Choose a JPEG, PNG, or WebP image.');
  }
}
