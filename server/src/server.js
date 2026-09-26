import app from './app.js';
import { env } from './config/env.js';

const server = app.listen(env.port, () => {
  console.info(`API listening on port ${env.port} in ${env.nodeEnv} mode.`);
});

function shutdown(signal) {
  server.close(() => {
    console.info(`${signal} received. API server closed.`);
    process.exit(0);
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
