import express from 'express';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import type { Config } from './config.js';
import { CloudStore, type CaseStore } from './store.js';
import { createAi, type AiService } from './ai.js';
import { caseRoutes } from './routes.js';
import { errorHandler } from './errors.js';

export function createApp(config: Config, dependencies?: { store: CaseStore; ai: AiService; rateLimit?: number }) {
  const app = express();
  app.disable('x-powered-by');
  // Cloud Run adds the immediate proxy hop. Do not trust arbitrary forwarded hops.
  app.set('trust proxy', 1);
  app.use('/api', (_request, response, next) => {
    response.set('Cache-Control', 'private, no-store');
    response.set('X-Content-Type-Options', 'nosniff');
    next();
  });
  app.use(express.json({ limit: '32kb' }));
  app.get('/api/health', (_request, response) => {
    response.json({
      ok: true,
      model: config.AI_MODE === 'local' ? config.OLLAMA_MODEL : config.GEMMA_MODEL,
      mode: config.AI_MODE,
    });
  });
  app.use('/api', caseRoutes(dependencies?.store ?? new CloudStore(config), dependencies?.ai ?? createAi(config), dependencies?.rateLimit));
  app.use('/api', (_request, response) => {
    response.status(404).json({ error: { code: 'NOT_FOUND', message: 'That API route was not found.' } });
  });
  if (existsSync(join(config.webDist, 'index.html'))) {
    app.use(express.static(config.webDist));
    app.get(/.*/, (_request, response) => response.sendFile(join(config.webDist, 'index.html')));
  }
  app.use(errorHandler);
  return app;
}
