import { Router } from 'express';
import { alertController } from '../controllers/alert.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';
import { validate, validateQuery } from '../middleware/validate.middleware.js';
import { listAlertQuerySchema, updateAlertStatusSchema } from '../validators/alert.validator.js';

const router = Router();

router.use(authenticate);

router.get('/', validateQuery(listAlertQuerySchema), alertController.list);
router.get('/:id', alertController.getById);
router.patch(
  '/:id/status',
  requireRole('admin', 'analyst'),
  validate(updateAlertStatusSchema),
  alertController.updateStatus
);

export default router;
