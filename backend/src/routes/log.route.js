import { Router } from 'express';
import { logController } from '../controllers/log.controller.js';
import { authenticate, verifyDeviceKey } from '../middleware/auth.middleware.js';
import { validate, validateQuery } from '../middleware/validate.middleware.js';
import { logIngestLimiter } from '../middleware/rateLimit.middleware.js';
import { ingestLogsSchema, listLogQuerySchema } from '../validators/log.validator.js';

const router = Router();

router.post(
  '/ingest',
  logIngestLimiter,
  verifyDeviceKey,
  validate(ingestLogsSchema),
  logController.ingest
);

router.get('/', authenticate, validateQuery(listLogQuerySchema), logController.list);

export default router;
