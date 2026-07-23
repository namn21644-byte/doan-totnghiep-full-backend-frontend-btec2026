import Joi from 'joi';

export const createRiskRuleSchema = Joi.object({
  matchType: Joi.string().valid('port', 'service').required(),
  port: Joi.when('matchType', {
    is: 'port',
    then: Joi.number().integer().min(1).max(65535).required(),
    otherwise: Joi.forbidden()
  }),
  protocol: Joi.string().valid('tcp', 'udp', 'any').default('any'),
  serviceName: Joi.when('matchType', {
    is: 'service',
    then: Joi.string().min(1).max(100).required(),
    otherwise: Joi.forbidden()
  }),
  severity: Joi.string().valid('critical', 'high', 'medium', 'low', 'info').required(),
  score: Joi.number().min(0).max(100).required(),
  description: Joi.string().min(3).max(500).required(),
  recommendation: Joi.string().allow('').max(500).default('')
});

export const updateRiskRuleSchema = Joi.object({
  protocol: Joi.string().valid('tcp', 'udp', 'any'),
  severity: Joi.string().valid('critical', 'high', 'medium', 'low', 'info'),
  score: Joi.number().min(0).max(100),
  description: Joi.string().min(3).max(500),
  recommendation: Joi.string().allow('').max(500),
  isActive: Joi.boolean()
}).min(1);

export const listRiskRuleQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  matchType: Joi.string().valid('port', 'service'),
  severity: Joi.string().valid('critical', 'high', 'medium', 'low', 'info')
});

export const riskOverviewQuerySchema = Joi.object({
  deviceId: Joi.string().hex().length(24)
});
