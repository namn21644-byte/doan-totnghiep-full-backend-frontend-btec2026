import Joi from 'joi';

const ipv4Pattern =
  /^(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)){3}$/;

export const createDeviceSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  ipAddress: Joi.string().pattern(ipv4Pattern).required().messages({
    'string.pattern.base': 'ipAddress phải là địa chỉ IPv4 hợp lệ'
  }),
  hostname: Joi.string().allow('').max(255),
  osType: Joi.string().valid('windows', 'linux', 'other').default('other'),
  location: Joi.string().allow('').max(255),
  tags: Joi.array().items(Joi.string().max(50)).default([])
});

export const updateDeviceSchema = Joi.object({
  name: Joi.string().min(2).max(100),
  hostname: Joi.string().allow('').max(255),
  location: Joi.string().allow('').max(255),
  tags: Joi.array().items(Joi.string().max(50)),
  status: Joi.string().valid('active', 'inactive', 'unreachable')
}).min(1);

export const listDeviceQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  search: Joi.string().allow('').max(100),
  status: Joi.string().valid('active', 'inactive', 'unreachable'),
  osType: Joi.string().valid('windows', 'linux', 'other')
});
