import { Router } from 'express';
import multer from 'multer';
import { rateLimit } from 'express-rate-limit';
import { z } from 'zod';
import { emailRequestSchema, noteSchema, patchSchema, uuidSchema } from './contract.js';
import type { CaseStore } from './store.js';
import type { AiService } from './ai.js';
import { ApiFailure } from './errors.js';
import { MAX_PHOTO_BYTES, processPhoto } from './photos.js';

export function caseRoutes(store: CaseStore, ai: AiService, limit = 30) {
  const router = Router();
  for (const name of ['caseId', 'entryId', 'photoId']) {
    router.param(name, (_request, _response, next, value) => {
      const parsed = uuidSchema.safeParse(value);
      next(parsed.success ? undefined : new ApiFailure('BAD_REQUEST', 'That ID is not valid.'));
    });
  }
  const analysisLimit = rateLimit({
    windowMs: 60 * 60 * 1000, limit, standardHeaders: 'draft-8', legacyHeaders: false,
    message: { error: { code: 'TOO_MANY_REQUESTS', message: 'Lots of requests right now. Please try again later.' } },
  });
  const caseLimit = rateLimit({
    windowMs: 60 * 60 * 1000, limit: 60, standardHeaders: 'draft-8', legacyHeaders: false,
    message: { error: { code: 'TOO_MANY_REQUESTS', message: 'Too many new cases. Please try again later.' } },
  });
  const upload = multer({ storage: multer.memoryStorage(), limits: {
    fileSize: MAX_PHOTO_BYTES, files: 3, fields: 1, fieldSize: 4000, parts: 4,
  } }).array('photos', 3);
  router.post('/cases', caseLimit, async (_request, response) => {
    response.status(201).json({ caseId: await store.createCase() });
  });
  router.get('/cases/:caseId', async (request, response) => {
    response.json(await store.getCase(uuidSchema.parse(request.params.caseId)));
  });
  router.post('/cases/:caseId/entries', analysisLimit, upload, async (request, response) => {
    const fields = z.object({ note: noteSchema.optional() }).strict().parse(request.body ?? {});
    const files = request.files as Express.Multer.File[] | undefined;
    if (!files?.length) throw new ApiFailure('BAD_REQUEST', 'Choose 1 to 3 photos.');
    const log = await store.getCase(uuidSchema.parse(request.params.caseId));
    if (log.entries.length >= 50) throw new ApiFailure('BAD_REQUEST', 'This case already has 50 entries.');
    // Process in sequence to bound memory use for large images.
    const photos = [];
    for (const file of files) photos.push(await processPhoto(file.buffer));
    const note = fields.note ?? '';
    const analysis = await ai.analyze(photos.map(photo => photo.bytes), note);
    // No files or records have been written before successful analysis.
    const entry = await store.saveEntry(uuidSchema.parse(request.params.caseId), note, analysis, photos);
    response.status(201).json({ entry });
  });
  router.patch('/cases/:caseId/entries/:entryId', async (request, response) => {
    const patch = patchSchema.parse(request.body);
    response.json({ entry: await store.patchEntry(uuidSchema.parse(request.params.caseId), uuidSchema.parse(request.params.entryId), patch) });
  });
  router.get('/cases/:caseId/photos/:photoId', async (request, response, next) => {
    const stream = await store.photoStream(uuidSchema.parse(request.params.caseId), uuidSchema.parse(request.params.photoId));
    response.type('image/jpeg').set('Cache-Control', 'private, no-store');
    stream.on('error', next);
    response.on('close', () => stream.destroy());
    stream.pipe(response);
  });
  router.get('/cases/:caseId/verify', async (request, response) => {
    response.json({ results: await store.verify(uuidSchema.parse(request.params.caseId)) });
  });
  router.post('/cases/:caseId/email', analysisLimit, async (request, response) => {
    const fields = emailRequestSchema.parse(request.body);
    const log = await store.getCase(uuidSchema.parse(request.params.caseId));
    const chosen = new Set(fields.entryIds);
    const entries = log.entries.filter(entry => chosen.has(entry.entryId));
    if (entries.length !== chosen.size) throw new ApiFailure('NOT_FOUND', 'One of those entries was not found in this case.');
    if (entries.some(entry => !entry.analysis.is_housing_problem)) {
      throw new ApiFailure('BAD_REQUEST', 'Choose entries that show a housing concern.');
    }
    response.json(await ai.email(entries, fields));
  });
  router.delete('/cases/:caseId', async (request, response) => {
    await store.deleteCase(uuidSchema.parse(request.params.caseId));
    response.json({ deleted: true });
  });
  return router;
}
