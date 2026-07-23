import { Router } from 'express';
import { riskRuleController } from '../controllers/riskRule.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';
import { validate, validateQuery } from '../middleware/validate.middleware.js';
import {
  createRiskRuleSchema,
  updateRiskRuleSchema,
  listRiskRuleQuerySchema
} from '../validators/riskRule.validator.js';

const router = Router();

router.use(authenticate);

router.post('/seed-defaults', requireRole('admin'), riskRuleController.seedDefaults);
router.post('/', requireRole('admin'), validate(createRiskRuleSchema), riskRuleController.create);
router.get('/', validateQuery(listRiskRuleQuerySchema), riskRuleController.list);
router.get('/:id', riskRuleController.getById);
router.put('/:id', requireRole('admin'), validate(updateRiskRuleSchema), riskRuleController.update);
router.delete('/:id', requireRole('admin'), riskRuleController.remove);

export default router;
