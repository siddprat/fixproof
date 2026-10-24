import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import sharp from 'sharp';
import { analysisSchema, emailDraftSchema } from '../src/contract.js';

// Run against the deployed service. Creates and deletes only its own test case.
const base = process.argv[2]?.replace(/\/$/, '');
if (!base || !/^https?:\/\//.test(base)) throw new Error('Pass the service URL.');
let caseId: string | undefined;
async function api(path: string, options?: RequestInit) {
  const response = await fetch(`${base}/api${path}`, { ...options, signal: AbortSignal.timeout(60_000) });
  const body = await response.json();
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${body.error?.code ?? 'Request failed'}: ${body.error?.message ?? ''}`);
  return body;
}
try {
  assert.equal((await api('/health')).ok, true);
  caseId = (await api('/cases', { method: 'POST' })).caseId;
  const path = process.argv[3];
  const bytes = path ? await readFile(path) : await sharp({ create: { width: 256, height: 256, channels: 3, background: '#8899aa' } }).jpeg().toBuffer();
  const form = new FormData();
  form.append('photos', new Blob([new Uint8Array(bytes)], { type: 'image/jpeg' }), 'test.jpg');
  form.append('note', path ? '' : 'Test image: a generated solid color.');
  const { entry } = await api(`/cases/${caseId}/entries`, { method: 'POST', body: form });
  analysisSchema.parse(entry.analysis);
  console.log('PASS: photo upload, model response, and saved entry.');
  const stored = await fetch(`${base}${entry.photos[0].url}`);
  assert.equal(stored.status, 200);
  assert.equal(createHash('sha256').update(Buffer.from(await stored.arrayBuffer())).digest('hex'), entry.photos[0].sha256);
  assert.ok((await api(`/cases/${caseId}/verify`)).results.every((result: { ok: boolean }) => result.ok));
  console.log('PASS: saved photo hash and verification.');
  const edited = await api(`/cases/${caseId}/entries/${entry.entryId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ note: 'Smoke test checked.' }) });
  assert.equal(edited.entry.edited, true);
  if (entry.analysis.is_housing_problem) {
    emailDraftSchema.parse(await api(`/cases/${caseId}/email`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ entryIds: [entry.entryId], type: 'followup' }) }));
    console.log('PASS: email draft.');
  } else console.log('Email test skipped: image was not a housing concern.');
  console.log('PASS: edit.');
} catch (error) {
  console.error(error instanceof Error ? error.message : 'Smoke test failed.');
  process.exitCode = 1;
} finally {
  if (caseId) {
    try {
      assert.equal((await api(`/cases/${caseId}`, { method: 'DELETE' })).deleted, true);
      assert.equal((await fetch(`${base}/api/cases/${caseId}`)).status, 404);
      console.log('PASS: test case deleted.');
    } catch { console.error(`Test case cleanup failed. Delete this case when the service is available: ${caseId}`); process.exitCode = 1; }
  }
}
