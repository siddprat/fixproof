import { test } from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import exifr from 'exifr';
import { processPhoto, hashPhoto, MAX_PHOTO_BYTES } from '../src/photos.js';

export const photo = () => sharp({ create: { width: 1600, height: 800, channels: 3, background: '#bca' } }).jpeg().toBuffer();
test('stored JPEG is resized, stripped of GPS and EXIF, and hashes its exact bytes', async () => {
  const original = await sharp(await photo()).withExif({
    IFD0: { Artist: 'Private name' },
    IFD2: { DateTimeOriginal: '2026:10:24 17:00:00' },
    IFD3: { GPSLatitudeRef: 'N', GPSLatitude: '37/1 13/1 0/1', GPSLongitudeRef: 'W', GPSLongitude: '80/1 25/1 0/1' },
  }).toBuffer();
  const originalExif = await exifr.parse(original);
  assert.ok(originalExif.latitude, 'Fixture must contain actual GPS data.');
  const processed = await processPhoto(original);
  const meta = await sharp(processed.bytes).metadata();
  assert.equal(meta.width, 1280);
  assert.equal(meta.height, 640);
  assert.equal(meta.format, 'jpeg');
  assert.equal(meta.exif, undefined);
  assert.equal(meta.xmp, undefined);
  assert.equal(await exifr.gps(processed.bytes), undefined);
  assert.equal(processed.sha256, hashPhoto(processed.bytes));
  assert.ok(processed.exifTime?.startsWith('2026-10-24'));
});
test('wrong contents and oversize input produce contract errors', async () => {
  await assert.rejects(processPhoto(Buffer.from('not a photo')), { code: 'BAD_REQUEST' });
  await assert.rejects(processPhoto(Buffer.alloc(MAX_PHOTO_BYTES + 1)), { code: 'PAYLOAD_TOO_LARGE' });
  const gif = await sharp(await photo()).gif().toBuffer();
  await assert.rejects(processPhoto(gif), { code: 'BAD_REQUEST' });
});
