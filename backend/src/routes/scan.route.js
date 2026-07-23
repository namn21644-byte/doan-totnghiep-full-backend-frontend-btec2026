import { Router } from 'express';
import { scanController } from '../controllers/scan.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';
import { validate, validateQuery } from '../middleware/validate.middleware.js';
import { createScanSchema, listScanQuerySchema } from '../validators/scan.validator.js';

const router = Router();

router.use(authenticate);

router.post(
  '/',
  requireRole('admin', 'analyst'),
  validate(createScanSchema),
  scanController.create
);

router.get('/', validateQuery(listScanQuerySchema), scanController.list);
router.get('/:id', scanController.getById);
router.patch('/:id/cancel', requireRole('admin', 'analyst'), scanController.cancel);

export default router;
