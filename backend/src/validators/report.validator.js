import Joi from 'joi';

export const generateReportSchema = Joi.object({
  type: Joi.string().valid('scan_summary', 'risk_summary', 'device_report').required(),
  format: Joi.string().valid('pdf', 'xlsx').required(),
  deviceId: Joi.when('type', {
    is: 'device_report',
    then: Joi.string().hex().length(24).required(),
    otherwise: Joi.string().hex().length(24).optional()
  }),
  from: Joi.date().iso(),
  to: Joi.date().iso()
});

export const listReportQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  type: Joi.string().valid('scan_summary', 'risk_summary', 'device_report')
});
