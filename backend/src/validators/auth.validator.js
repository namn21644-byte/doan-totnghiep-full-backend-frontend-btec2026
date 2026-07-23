import Joi from 'joi';

export const registerSchema = Joi.object({
  fullName: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  password: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/)
    .required()
    .messages({
      'string.pattern.base':
        'Mật khẩu phải chứa ít nhất 1 chữ hoa, 1 chữ thường và 1 chữ số'
    })
}).rename('full_name', 'fullName', { override: true, ignoreUndefined: true });

export const verifyOtpSchema = Joi.object({
  email: Joi.string().email().required(),
  otp: Joi.string().length(6).pattern(/^\d+$/).required()
}).rename('otp_code', 'otp', { override: true, ignoreUndefined: true });

export const resendOtpSchema = Joi.object({
  email: Joi.string().email().required()
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required(), 
  password: Joi.string().required()
});

export const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().required()
}).rename('refresh_token', 'refreshToken', { override: true, ignoreUndefined: true });
