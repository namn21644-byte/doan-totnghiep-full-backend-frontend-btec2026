import Joi from 'joi';

export const listAlertQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  deviceId: Joi.string().hex().length(24),
  severity: Joi.string().valid('critical', 'high', 'medium', 'low', 'info'),
  status: Joi.string().valid('new', 'acknowledged', 'resolved', 'ignored'),
  sourceType: Joi.string().valid('scan_result', 'log')
});

export const updateAlertStatusSchema = Joi.object({
  status: Joi.string().valid('new', 'acknowledged', 'resolved', 'ignored').required(),
  assignedTo: Joi.string().hex().length(24).allow(null)
});
