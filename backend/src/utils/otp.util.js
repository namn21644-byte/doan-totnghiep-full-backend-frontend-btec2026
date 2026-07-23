import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { env } from '../config/env.js';

export function generateOtp() {
  const digits = '0123456789';
  let otp = '';
  for (let i = 0; i < env.otp.length; i++) {
    otp += digits[crypto.randomInt(0, digits.length)];
  }
  return otp;
}

export async function hashOtp(otp) {
  return bcrypt.hash(otp, env.bcryptSaltRounds);
}

export async function compareOtp(otp, otpHash) {
  return bcrypt.compare(otp, otpHash);
}

export function getOtpExpiryDate() {
  return new Date(Date.now() + env.otp.expiresInMinutes * 60 * 1000);
}
