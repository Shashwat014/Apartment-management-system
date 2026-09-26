import 'dotenv/config';

function getPort(value) {
  const port = Number(value || 5000);

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT must be an integer between 1 and 65535.');
  }

  return port;
}

export const env = Object.freeze({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: getPort(process.env.PORT),
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
});
