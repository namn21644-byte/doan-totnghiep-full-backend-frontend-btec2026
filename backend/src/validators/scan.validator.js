import Joi from 'joi';

export const createScanSchema = Joi.object({
  deviceId: Joi.string().hex().length(24).required(),
  preset: Joi.string().valid('quick', 'full', 'custom').required(),
  ports: Joi.when('preset', {
    is: 'custom',
    then: Joi.string()
      .pattern(/^[\d,\-]+$/)
      .required()
      .messages({ 'string.pattern.base': 'ports chỉ chứa số, dấu phẩy và dấu gạch ngang' }),
    otherwise: Joi.string().allow('').optional()
  }),
  enableServiceDetection: Joi.boolean().default(true),
  enableOsDetection: Joi.boolean().default(false)
});

export const listScanQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  deviceId: Joi.string().hex().length(24),
  status: Joi.string().valid('queued', 'running', 'completed', 'failed', 'cancelled')
});
