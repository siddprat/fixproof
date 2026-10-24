import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { request } from './http.js';
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
  const app = createApp(loadConfig({ ...env, WEB_DIST: directory }));
  try {
    const health = await request(app, 'GET', '/api/health');
    assert.deepEqual(health.json(), { ok: true, model: env.GEMMA_MODEL, mode: 'hosted' });
    const missing = await request(app, 'GET', '/api/not-a-route');
    assert.equal(missing.status, 404);
    assert.equal(missing.json().error.code, 'NOT_FOUND');
    const invalid = await request(app, 'POST', '/api/cases', '{', { 'content-type': 'application/json' });
    assert.equal(invalid.status, 400);
    assert.equal(invalid.json().error.code, 'BAD_REQUEST');
    const page = await request(app, 'GET', '/entry/example');
    assert.equal(page.bytes.toString(), '<h1>FixProof test</h1>');
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('blank optional values from the env example use defaults', () => {
  const config = loadConfig({ ...env, PORT: '', AI_MODE: '', OLLAMA_URL: '', OLLAMA_MODEL: '', WEB_DIST: '' });
  assert.equal(config.PORT, 8080);
  assert.equal(config.AI_MODE, 'hosted');
});
