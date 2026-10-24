import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { once } from 'node:events';
import { createApp } from '../src/app.js';
import { loadConfig } from '../src/config.js';

const env = {
  GOOGLE_CLOUD_PROJECT: 'test-project', GCS_BUCKET: 'test-bucket',
  GEMMA_MODEL: 'gemma-4-26b-a4b-it', MOCK_AI: '1',
};

test('hosted startup requires a key and never includes values in its error', () => {
  assert.throws(() => loadConfig({ ...env, MOCK_AI: '0' }), /GEMINI_API_KEY/);
  assert.throws(() => loadConfig({ ...env, PORT: 'secret-do-not-print' }), error => {
    assert.ok(error instanceof Error);
    assert.equal(error.message, 'Check environment variables: PORT');
    return true;
  });
});

test('health and API errors remain JSON while frontend routes use the SPA', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'fixproof-test-'));
  await writeFile(join(directory, 'index.html'), '<h1>FixProof test</h1>');
  const server = createApp(loadConfig({ ...env, WEB_DIST: directory })).listen(0, '127.0.0.1');
  try {
    await once(server, 'listening');
    const address = server.address();
    assert.ok(address && typeof address === 'object');
    const base = `http://127.0.0.1:${address.port}`;
    const health = await fetch(`${base}/api/health`);
    assert.deepEqual(await health.json(), { ok: true, model: env.GEMMA_MODEL, mode: 'hosted' });
    const missing = await fetch(`${base}/api/not-a-route`);
    assert.equal(missing.status, 404);
    assert.equal((await missing.json() as { error: { code: string } }).error.code, 'NOT_FOUND');
    const invalid = await fetch(`${base}/api/cases`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{',
    });
    assert.equal(invalid.status, 400);
    assert.equal((await invalid.json() as { error: { code: string } }).error.code, 'BAD_REQUEST');
    const page = await fetch(`${base}/entry/example`);
    assert.equal(await page.text(), '<h1>FixProof test</h1>');
  } finally {
    await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
    await rm(directory, { recursive: true, force: true });
  }
});
