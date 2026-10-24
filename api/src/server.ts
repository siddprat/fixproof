import { createApp } from './app.js';
import { loadConfig } from './config.js';

try {
  const config = loadConfig();
  const server = createApp(config).listen(config.PORT, '0.0.0.0', () => {
    console.info(`FixProof API listening on port ${config.PORT}`);
  });
  process.on('SIGTERM', () => server.close(() => process.exit(0)));
} catch (error) {
  console.error(error instanceof Error ? error.message : 'Unable to start FixProof.');
  process.exitCode = 1;
}
