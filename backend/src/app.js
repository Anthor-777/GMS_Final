import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { auth } from './middleware/auth.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import analyticsRoutes from './routes/analytics.js';
import attendanceRoutes from './routes/attendance.js';
import authRoutes from './routes/auth.js';
import dashboardRoutes from './routes/dashboard.js';
import equipmentRoutes from './routes/equipment.js';
import maintenanceRoutes from './routes/maintenance.js';
import memberRoutes from './routes/members.js';
import paymentRoutes from './routes/payments.js';
import planRoutes from './routes/plans.js';
import reportRoutes from './routes/reports.js';
import sessionRoutes from './routes/sessions.js';
import subscriptionRoutes from './routes/subscriptions.js';
import trainerRoutes from './routes/trainers.js';

export const app = express();

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173'
}));
app.use(express.json({ limit: '1mb' }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

app.get('/api/health', (req, res) => {
  res.json({ success: true, data: { status: 'ok' } });
});

app.use('/api/auth', authRoutes);

app.use('/api', auth);
app.use('/api/members', memberRoutes);
app.use('/api/plans', planRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/trainers', trainerRoutes);
app.use('/api/equipment', equipmentRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/analytics', analyticsRoutes);

app.use(notFound);
app.use(errorHandler);
