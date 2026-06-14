import nodemailer from 'nodemailer';
import { config } from '../config';

const transporter = nodemailer.createTransport({
  host: config.smtp.host,
  port: config.smtp.port,
  secure: false,
  auth: {
    user: config.smtp.user,
    pass: config.smtp.pass,
  },
  connectionTimeout: 5000,
  greetingTimeout: 5000,
});

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export const sendEmail = async (options: EmailOptions): Promise<void> => {
  await transporter.sendMail({
    from: config.emailFrom,
    to: options.to,
    subject: options.subject,
    html: options.html,
  });
};

export const sendVerificationEmail = async (
  email: string,
  token: string
): Promise<void> => {
  const verifyUrl = `${config.frontendUrl}/verify-email?token=${token}`;

  await sendEmail({
    to: email,
    subject: 'Verify your CampusConnect account',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #7C3AED, #6366F1); padding: 30px; border-radius: 12px; text-align: center;">
          <h1 style="color: white; margin: 0;">CampusConnect</h1>
          <p style="color: white; opacity: 0.9;">Verify your email address</p>
        </div>
        <div style="padding: 30px; background: #f8fafc; border-radius: 0 0 12px 12px;">
          <p style="color: #334155;">Hello,</p>
          <p style="color: #334155;">Thank you for signing up for CampusConnect! Please click the button below to verify your email address.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verifyUrl}" style="background: #2563EB; color: white; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: bold;">Verify Email</a>
          </div>
          <p style="color: #64748b; font-size: 12px;">If you didn't create an account, please ignore this email.</p>
        </div>
      </div>
    `,
  });
};

export const sendPasswordResetEmail = async (
  email: string,
  token: string
): Promise<void> => {
  const resetUrl = `${config.frontendUrl}/reset-password?token=${token}`;

  await sendEmail({
    to: email,
    subject: 'Reset your CampusConnect password',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #7C3AED, #6366F1); padding: 30px; border-radius: 12px; text-align: center;">
          <h1 style="color: white; margin: 0;">CampusConnect</h1>
          <p style="color: white; opacity: 0.9;">Reset your password</p>
        </div>
        <div style="padding: 30px; background: #f8fafc; border-radius: 0 0 12px 12px;">
          <p style="color: #334155;">Hello,</p>
          <p style="color: #334155;">We received a request to reset your password. Click the button below to create a new password.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background: #7C3AED; color: white; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: bold;">Reset Password</a>
          </div>
          <p style="color: #64748b; font-size: 12px;">This link will expire in 1 hour. If you didn't request a password reset, please ignore this email.</p>
        </div>
      </div>
    `,
  });
};
