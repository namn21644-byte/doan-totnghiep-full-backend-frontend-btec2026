import { Router } from 'express';
import { reportController } from '../controllers/report.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';
import { validate, validateQuery } from '../middleware/validate.middleware.js';
import { generateReportSchema, listReportQuerySchema } from '../validators/report.validator.js';

const router = Router();

router.use(authenticate);

router.post(
  '/generate',
  requireRole('admin', 'analyst'),
  validate(generateReportSchema),
  reportController.generate
);
router.get('/', validateQuery(listReportQuerySchema), reportController.list);
router.get('/:id/download', reportController.download);

export default router;
