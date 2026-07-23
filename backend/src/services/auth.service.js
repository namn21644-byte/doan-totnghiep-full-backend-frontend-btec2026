import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { userRepository } from '../repositories/user.repository.js';
import { mailService } from './mail.service.js';
import { ApiError } from '../utils/apiError.js';
import { env } from '../config/env.js';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken
} from '../utils/jwt.util.js';
import { generateOtp, hashOtp, compareOtp, getOtpExpiryDate } from '../utils/otp.util.js';

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function buildRefreshExpiryDate() {
  const match = /^(\d+)([smhd])$/.exec(env.jwt.refreshExpiresIn);
  const unitMs = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
  const amount = match ? parseInt(match[1], 10) : 7;
  const unit = match ? match[2] : 'd';
  return new Date(Date.now() + amount * (unitMs[unit] || unitMs.d));
}

export const authService = {
  async register({ fullName, full_name, email, password }) {
    fullName = fullName || full_name;
    const existing = await userRepository.findByEmail(email);
    if (existing) {
      throw ApiError.conflict('Email đã được sử dụng');
    }

    const passwordHash = await bcrypt.hash(password, env.bcryptSaltRounds);
    const otp = generateOtp();
    const otpCodeHash = await hashOtp(otp);

    const user = await userRepository.create({
      fullName,
      email,
      passwordHash,
      otpCodeHash,
      otpExpiresAt: getOtpExpiryDate()
    });

    await mailService.sendOtpEmail(email, otp);

    return { userId: user._id, email: user.email };
  },

  async resendOtp(email) {
    const user = await userRepository.findByEmail(email);
    if (!user) throw ApiError.notFound('Không tìm thấy tài khoản');
    if (user.isVerified) throw ApiError.badRequest('Tài khoản đã được xác thực');

    const otp = generateOtp();
    const otpCodeHash = await hashOtp(otp);

    await userRepository.updateById(user._id, {
      otpCodeHash,
      otpExpiresAt: getOtpExpiryDate()
    });

    await mailService.sendOtpEmail(email, otp);
    return { email };
  },

  async verifyOtp({ email, otp }) {
    const user = await userRepository.findByEmail(email);
    if (!user) throw ApiError.notFound('Không tìm thấy tài khoản');
    if (user.isVerified) throw ApiError.badRequest('Tài khoản đã được xác thực trước đó');
    if (!user.otpCodeHash || !user.otpExpiresAt || user.otpExpiresAt < new Date()) {
      throw ApiError.badRequest('Mã OTP đã hết hạn, vui lòng yêu cầu gửi lại');
    }

    const isMatch = await compareOtp(otp, user.otpCodeHash);
    if (!isMatch) throw ApiError.badRequest('Mã OTP không chính xác');

    await userRepository.updateById(user._id, {
      isVerified: true,
      otpCodeHash: null,
      otpExpiresAt: null
    });

    return { email: user.email };
  },

  async login({ email, password, userAgent, ip }) {
    const user = await userRepository.findByEmail(email);
    if (!user) throw ApiError.unauthorized('Email hoặc mật khẩu không đúng');

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) throw ApiError.unauthorized('Email hoặc mật khẩu không đúng');

    if (!user.isVerified) {
      throw ApiError.forbidden('Tài khoản chưa được xác thực OTP');
    }

    const accessToken = signAccessToken({ sub: user._id.toString(), role: user.role });
    const refreshToken = signRefreshToken({ sub: user._id.toString() });

    await userRepository.clearExpiredRefreshTokens(user._id);
    await userRepository.addRefreshToken(user._id, {
      tokenHash: hashToken(refreshToken),
      userAgent: userAgent || '',
      ip: ip || '',
      createdAt: new Date(),
      expiresAt: buildRefreshExpiryDate()
    });

    await userRepository.updateById(user._id, { lastLoginAt: new Date() });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role
      }
    };
  },

  async refreshToken({ refreshToken, userAgent, ip }) {
    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch (err) {
      throw ApiError.unauthorized('Refresh token không hợp lệ hoặc đã hết hạn');
    }

    const user = await userRepository.findById(decoded.sub);
    if (!user) throw ApiError.unauthorized('Người dùng không tồn tại');

    const tokenHash = hashToken(refreshToken);
    const stored = user.refreshTokens.find((rt) => rt.tokenHash === tokenHash);
    if (!stored || stored.expiresAt < new Date()) {
      throw ApiError.unauthorized('Refresh token không hợp lệ hoặc đã bị thu hồi');
    }

    await userRepository.removeRefreshTokenByHash(user._id, tokenHash);

    const newAccessToken = signAccessToken({ sub: user._id.toString(), role: user.role });
    const newRefreshToken = signRefreshToken({ sub: user._id.toString() });

    await userRepository.addRefreshToken(user._id, {
      tokenHash: hashToken(newRefreshToken),
      userAgent: userAgent || '',
      ip: ip || '',
      createdAt: new Date(),
      expiresAt: buildRefreshExpiryDate()
    });

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  },

  async logout({ userId, refreshToken }) {
    const tokenHash = hashToken(refreshToken);
    await userRepository.removeRefreshTokenByHash(userId, tokenHash);
    return true;
  },

  async getProfile(userId) {
    const user = await userRepository.findById(userId);
    if (!user) throw ApiError.notFound('Không tìm thấy người dùng');
    return {
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
      lastLoginAt: user.lastLoginAt
    };
  }
};
