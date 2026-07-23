import { Router } from 'express';
import authRoutes from './auth.route.js';
import deviceRoutes from './device.route.js';
import scanRoutes from './scan.route.js';
import logRoutes from './log.route.js';
import riskRuleRoutes from './riskRule.route.js';
import riskRoutes from './risk.route.js';
import alertRoutes from './alert.route.js';
import reportRoutes from './report.route.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/devices', deviceRoutes);
router.use('/scans', scanRoutes);
router.use('/logs', logRoutes);
router.use('/risk-rules', riskRuleRoutes);
router.use('/risk', riskRoutes);
router.use('/alerts', alertRoutes);
router.use('/reports', reportRoutes);

export default router;
