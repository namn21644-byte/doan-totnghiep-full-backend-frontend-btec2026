import { Router } from 'express';
import { riskController } from '../controllers/risk.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';
import { validateQuery } from '../middleware/validate.middleware.js';
import { riskOverviewQuerySchema } from '../validators/riskRule.validator.js';

const router = Router();

router.use(authenticate);

router.get('/overview', validateQuery(riskOverviewQuerySchema), riskController.overview);
router.post('/re-evaluate/:scanId', requireRole('admin', 'analyst'), riskController.reEvaluate);

export default router;
