import { Router } from 'express';
import { deviceController } from '../controllers/device.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';
import { validate, validateQuery } from '../middleware/validate.middleware.js';
import {
  createDeviceSchema,
  updateDeviceSchema,
  listDeviceQuerySchema
} from '../validators/device.validator.js';

const router = Router();

router.use(authenticate);

router.post(
  '/',
  requireRole('admin', 'analyst'),
  validate(createDeviceSchema),
  deviceController.create
);

router.get('/', validateQuery(listDeviceQuerySchema), deviceController.list);

router.get('/:id', deviceController.getById);

router.put(
  '/:id',
  requireRole('admin', 'analyst'),
  validate(updateDeviceSchema),
  deviceController.update
);

router.delete('/:id', requireRole('admin'), deviceController.remove);

router.post(
  '/:id/regenerate-key',
  requireRole('admin'),
  deviceController.regenerateKey
);

export default router;
