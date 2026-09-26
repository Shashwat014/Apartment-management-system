import cors from 'cors';
import express from 'express';
import { env } from './config/env.js';
import healthRouter from './routes/health.routes.js';

const app = express();

app.disable('x-powered-by');
app.use(
  cors({
    origin: env.clientOrigin,
  }),
);
app.use(express.json({ limit: '100kb' }));
app.use('/api/v1/health', healthRouter);

app.use((_request, response) => {
  response.status(404).json({
    success: false,
    message: 'Route not found.',
  });
});

export default app;
