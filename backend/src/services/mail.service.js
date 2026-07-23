import nodemailer from 'nodemailer';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

const transporter = nodemailer.createTransport({
  host: env.smtp.host,
  port: env.smtp.port,
  secure: env.smtp.secure,
  auth: {
    user: env.smtp.user,
    pass: env.smtp.pass
  }
});

export const mailService = {
  async sendOtpEmail(toEmail, otp) {
    const html = `
      <div style="font-family: sans-serif; max-width: 480px; margin: auto;">
        <h2>Xác thực tài khoản NetScan</h2>
        <p>Mã OTP của bạn là:</p>
        <p style="font-size: 28px; font-weight: bold; letter-spacing: 4px;">${otp}</p>
        <p>Mã có hiệu lực trong ${env.otp.expiresInMinutes} phút.</p>
        <p>Nếu bạn không yêu cầu, vui lòng bỏ qua email này.</p>
      </div>
    `;

    try {
      await transporter.sendMail({
        from: env.smtp.from,
        to: toEmail,
        subject: 'Mã xác thực OTP - NetScan Security',
        html
      });
      logger.info(`OTP email sent to ${toEmail}`);
    } catch (err) {
      logger.error(`Failed to send OTP email to ${toEmail}: ${err.message}`);
      throw err;
    }
  }
};
