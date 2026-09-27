import app from './app.js';
import { env } from './config/env.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';

let server;

try {
  await connectDatabase();
  server = app.listen(env.port, () => {
    console.info(`API listening on port ${env.port} in ${env.nodeEnv} mode.`);
  });
} catch (error) {
  console.error(`API startup failed: ${error.message}`);
  process.exit(1);
}

function shutdown(signal) {
  server.close(async () => {
    await disconnectDatabase();
    console.info(`${signal} received. API server closed.`);
    process.exit(0);
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
