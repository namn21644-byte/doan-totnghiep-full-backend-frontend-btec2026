import Joi from 'joi';

const logEntrySchema = Joi.object({
  logType: Joi.string()
    .valid('windows_event', 'linux_syslog', 'agent_heartbeat')
    .required(),
  source: Joi.string().allow('').max(255).default(''),
  severity: Joi.string().valid('info', 'warning', 'error', 'critical').default('info'),
  eventId: Joi.number().integer().allow(null).default(null),
  rawMessage: Joi.string().allow('').max(4000).default(''),
  parsedData: Joi.object().unknown(true).default({}),
  timestamp: Joi.date().iso().required()
});

export const ingestLogsSchema = Joi.object({
  logs: Joi.array().items(logEntrySchema).min(1).max(500).required()
});

export const listLogQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(200).default(20),
  deviceId: Joi.string().hex().length(24),
  logType: Joi.string().valid('windows_event', 'linux_syslog', 'agent_heartbeat'),
  severity: Joi.string().valid('info', 'warning', 'error', 'critical'),
  from: Joi.date().iso(),
  to: Joi.date().iso()
});
