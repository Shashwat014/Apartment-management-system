import cors from 'cors';
import cookieParser from 'cookie-parser';
import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { env } from './config/env.js';
import healthRouter from './routes/health.routes.js';
import authRouter from './routes/auth.routes.js';
import propertyRouter from './routes/property.routes.js';
import unitRouter from './routes/unit.routes.js';
import rentRouter from './routes/rent.routes.js';
import maintenanceRouter from './routes/maintenance.routes.js';
import noticeRouter from './routes/notice.routes.js';
import dashboardRouter from './routes/dashboard.routes.js';
import adminRouter from './routes/admin.routes.js';
import reportRouter from './routes/report.routes.js';
import { errorHandler, notFound } from './middleware/error-handler.js';

const app = express();

app.disable('x-powered-by');
if (env.nodeEnv === 'production') app.set('trust proxy', 1);
app.use(helmet());
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || env.clientOrigins.includes(origin)) return callback(null, true);
      callback(new Error('Origin is not allowed by CORS policy.'));
    },
    credentials: true,
  }),
);
app.use(express.json({ limit: '100kb' }));
app.use(cookieParser());
app.use('/api/v1/auth', rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: 'draft-8', legacyHeaders: false }), authRouter);
app.use('/api/v1/health', healthRouter);
app.use('/api/v1/properties', propertyRouter);
app.use('/api/v1/units', unitRouter);
app.use('/api/v1/rent', rentRouter);
app.use('/api/v1/maintenance', maintenanceRouter);
app.use('/api/v1/notices', noticeRouter);
app.use('/api/v1/dashboard', dashboardRouter);
app.use('/api/v1/admin', adminRouter);
app.use('/api/v1/reports', reportRouter);
app.use(notFound);
app.use(errorHandler);

export default app;
