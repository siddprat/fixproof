import express, { type ErrorRequestHandler } from 'express';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import type { Config } from './config.js';

export function createApp(config: Config) {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '32kb' }));
  app.get('/api/health', (_request, response) => {
    response.json({
      ok: true,
      model: config.AI_MODE === 'local' ? config.OLLAMA_MODEL : config.GEMMA_MODEL,
      mode: config.AI_MODE,
    });
  });
  app.use('/api', (_request, response) => {
    response.status(404).json({ error: { code: 'NOT_FOUND', message: 'That API route was not found.' } });
  });
  if (existsSync(join(config.webDist, 'index.html'))) {
    app.use(express.static(config.webDist));
    app.get(/.*/, (_request, response) => response.sendFile(join(config.webDist, 'index.html')));
  }
  const errors: ErrorRequestHandler = (error, _request, response, _next) => {
    if (response.headersSent) return _next(error);
    if (error?.type === 'entity.too.large') {
      response.status(413).json({ error: { code: 'PAYLOAD_TOO_LARGE', message: 'That request is too large.' } });
      return;
    }
    response.status(400).json({ error: { code: 'BAD_REQUEST', message: 'We could not read that request.' } });
  };
  app.use(errors);
  return app;
}
