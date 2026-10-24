import { readFile } from 'node:fs/promises';
import { loadConfig } from '../src/config.js';
import { createAi } from '../src/ai.js';
import { processPhoto } from '../src/photos.js';

try {
  const path = process.argv[2];
  if (!path) throw new Error('Usage: npm run try-analyze -- path/to/photo.jpg');
  const photo = await processPhoto(await readFile(path));
  const analysis = await createAi(loadConfig()).analyze([photo.bytes], '');
  console.log(JSON.stringify(analysis, null, 2));
} catch (error) {
  console.error(error instanceof Error ? error.message : 'Photo check failed.');
  process.exitCode = 1;
}
