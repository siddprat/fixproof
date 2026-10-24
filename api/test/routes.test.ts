import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import sharp from 'sharp';
import { createApp } from '../src/app.js';
import { createAi } from '../src/ai.js';
import { loadConfig } from '../src/config.js';
import { ApiFailure } from '../src/errors.js';
import { MAX_PHOTO_BYTES } from '../src/photos.js';
import { MemoryStore } from './memory-store.js';
import { multipart, request } from './http.js';

const config = loadConfig({ GOOGLE_CLOUD_PROJECT: 'test', GCS_BUCKET: 'test', GEMMA_MODEL: 'test-model', MOCK_AI: '1' });
const jsonHeaders = { 'content-type': 'application/json' };
const photo = () => sharp({ create: { width: 32, height: 32, channels: 3, background: '#abc' } }).png().toBuffer();
function setup(rateLimit?: number) {
  const store = new MemoryStore();
  const ai = createAi(config);
  const app = createApp(config, { store, ai, rateLimit });
  return { store, ai, app };
}

test('complete API flow: create, analyze, edit, email, serve, verify, tamper, delete', async () => {
  const { app, store } = setup();
  const created = await request(app, 'POST', '/api/cases');
  assert.equal(created.status, 201);
  const caseId = created.json().caseId;
  const base = `/api/cases/${caseId}`;
  const upload = multipart([await photo()], 'Bathroom ceiling');
  const saved = await request(app, 'POST', `${base}/entries`, upload.body, upload.headers);
  assert.equal(saved.status, 201, saved.bytes.toString());
  const entry = saved.json().entry;
  assert.equal(entry.edited, false);
  assert.equal(entry.photos.length, 1);
  assert.equal((await request(app, 'GET', base)).json().entries.length, 1);
  const patch = await request(app, 'PATCH', `${base}/entries/${entry.entryId}`, JSON.stringify({ note: 'Checked again', analysis: { location_in_unit: 'bathroom' } }), jsonHeaders);
  assert.equal(patch.json().entry.edited, true);
  assert.equal(patch.json().entry.analysis.category, entry.analysis.category);
  const email = await request(app, 'POST', `${base}/email`, JSON.stringify({ entryIds: [entry.entryId], type: 'followup' }), jsonHeaders);
  assert.equal(email.status, 200, email.bytes.toString());
  assert.match(email.json().body, /dated photos/i);
  assert.ok(email.json().body.trim().split(/\s+/).length < 180);
  const image = await request(app, 'GET', entry.photos[0].url);
  assert.match(String(image.headers['content-type']), /image\/jpeg/);
  assert.match(String(image.headers['cache-control']), /private/);
  assert.equal((await request(app, 'GET', `${base}/verify`)).json().results[0].ok, true);
  store.photos.set(entry.photos[0].photoId, Buffer.from('changed'));
  assert.equal((await request(app, 'GET', `${base}/verify`)).json().results[0].ok, false);
  assert.equal((await request(app, 'DELETE', base)).json().deleted, true);
  assert.equal(store.photos.size, 0);
  assert.equal((await request(app, 'GET', base)).status, 404);
});

test('upload and request limits return ApiError responses', async () => {
  const { app } = setup();
  const caseId = (await request(app, 'POST', '/api/cases')).json().caseId;
  const base = `/api/cases/${caseId}`;
  for (const [buffers, note, status, code] of [
    [[], undefined, 400, 'BAD_REQUEST'],
    [[Buffer.from('not an image')], undefined, 400, 'BAD_REQUEST'],
    [[await photo(), await photo(), await photo(), await photo()], undefined, 400, 'BAD_REQUEST'],
    [[Buffer.alloc(MAX_PHOTO_BYTES + 1)], undefined, 413, 'PAYLOAD_TOO_LARGE'],
    [[await photo()], 'a'.repeat(1001), 400, 'BAD_REQUEST'],
  ] as const) {
    const upload = multipart([...buffers], note);
    const result = await request(app, 'POST', `${base}/entries`, upload.body, upload.headers);
    assert.equal(result.status, status, result.bytes.toString());
    assert.equal(result.json().error.code, code);
  }
  assert.equal((await request(app, 'GET', '/api/cases/not-a-uuid')).status, 400);
  assert.equal((await request(app, 'GET', `/api/cases/${randomUUID()}`)).status, 404);
  assert.equal((await request(app, 'PATCH', `${base}/entries/${randomUUID()}`, '{}', jsonHeaders)).status, 400);
});

test('model failure leaves no photos or entries; rate limits are enforced', async () => {
  const { app, store, ai } = setup(1);
  ai.analyze = async () => { throw new ApiFailure('AI_UNAVAILABLE', 'Try again.'); };
  const caseId = await store.createCase();
  const upload = multipart([await photo()]);
  const path = `/api/cases/${caseId}/entries`;
  assert.equal((await request(app, 'POST', path, upload.body, upload.headers)).status, 502);
  assert.equal(store.photos.size, 0);
  assert.equal((await store.getCase(caseId)).entries.length, 0);
  const limited = await request(app, 'POST', path, upload.body, upload.headers);
  assert.equal(limited.status, 429);
  assert.equal(limited.json().error.code, 'TOO_MANY_REQUESTS');
});

test('unrelated photo returns 201 and cannot be selected for email', async () => {
  const { app, store } = setup();
  const caseId = await store.createCase();
  const upload = multipart([await photo()], '[mock:unrelated]');
  const saved = await request(app, 'POST', `/api/cases/${caseId}/entries`, upload.body, upload.headers);
  assert.equal(saved.status, 201);
  const entry = saved.json().entry;
  assert.equal(entry.analysis.is_housing_problem, false);
  assert.equal(entry.analysis.confidence, 'low');
  const email = await request(app, 'POST', `/api/cases/${caseId}/email`, JSON.stringify({ entryIds: [entry.entryId], type: 'first' }), jsonHeaders);
  assert.equal(email.status, 400);
});
