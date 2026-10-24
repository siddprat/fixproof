import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { z } from 'zod';

const optionalText = z.preprocess(value => value === '' ? undefined : value, z.string().min(1).optional());
const schema = z.object({
  PORT: z.coerce.number().int().min(1).max(65535).default(8080),
  AI_MODE: z.enum(['hosted', 'local']).default('hosted'),
  MOCK_AI: z.enum(['0', '1']).default('0'),
  GEMMA_MODEL: optionalText,
  GEMINI_API_KEY: optionalText,
  GOOGLE_CLOUD_PROJECT: z.string().min(1),
  GCS_BUCKET: z.string().min(1),
  OLLAMA_URL: z.string().url().default('http://localhost:11434'),
  OLLAMA_MODEL: optionalText,
  WEB_DIST: optionalText,
}).superRefine((config, context) => {
  if (config.AI_MODE === 'hosted' && !config.GEMMA_MODEL) {
    context.addIssue({ code: 'custom', path: ['GEMMA_MODEL'], message: 'Set the confirmed model ID.' });
  }
  if (config.MOCK_AI !== '1' && config.AI_MODE === 'hosted' && !config.GEMINI_API_KEY) {
    context.addIssue({ code: 'custom', path: ['GEMINI_API_KEY'], message: 'Set the API key or use MOCK_AI=1.' });
  }
  if (config.AI_MODE === 'local' && !config.OLLAMA_MODEL) {
    context.addIssue({ code: 'custom', path: ['OLLAMA_MODEL'], message: 'Set the local model ID.' });
  }
});

export function loadConfig(env: NodeJS.ProcessEnv = process.env) {
  const normalized = Object.fromEntries(Object.entries(env).map(([key, value]) => [key, value === '' ? undefined : value]));
  const result = schema.safeParse(normalized);
  if (!result.success) {
    // Report only variable names, never the supplied values or secrets.
    throw new Error(`Check environment variables: ${[...new Set(result.error.issues.map(issue => issue.path.join('.')))].join(', ')}`);
  }
  return {
    ...result.data,
    webDist: result.data.WEB_DIST
      ? resolve(result.data.WEB_DIST)
      : fileURLToPath(new URL('../../web/dist', import.meta.url)),
  };
}
export type Config = ReturnType<typeof loadConfig>;
