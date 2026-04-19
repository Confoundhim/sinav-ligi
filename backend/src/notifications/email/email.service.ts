import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { emailTemplates } from './email.templates';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor(private readonly configService: ConfigService) {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    const host = this.configService.get<string>('smtp.host');
    const port = this.configService.get<number>('smtp.port');
    const user = this.configService.get<string>('smtp.user');
    const pass = this.configService.get<string>('smtp.pass');

    if (!host || !user || !pass) {
      this.logger.warn('SMTP ayarları eksik - email servisi devre dışı');
      return;
    }

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });

    this.logger.log('Email servisi başlatıldı');
  }

  private async sendEmail(to: string, subject: string, html: string) {
    if (!this.transporter) {
      this.logger.warn(`Email gönderilemedi (SMTP kapalı): ${subject}`);
      return { sent: false, reason: 'SMTP not configured' };
    }

    const from = this.configService.get<string>('smtp.from');

    try {
      const result = await this.transporter.sendMail({
        from: `"Sınav Ligi" <${from}>`,
        to,
        subject,
        html,
      });
      this.logger.log(`Email gönderildi: ${to}, subject: ${subject}`);
      return { sent: true, messageId: result.messageId };
    } catch (err) {
      this.logger.error(`Email gönderim hatası: ${to}`, err);
      return { sent: false, error: (err as Error).message };
    }
  }

  /**
   * Hoş geldin emaili
   */
  async sendWelcomeEmail(to: string, displayName: string) {
    const template = emailTemplates.welcome(displayName);
    return this.sendEmail(to, template.subject, template.html);
  }

  /**
   * Şifre sıfırlama emaili
   */
  async sendPasswordResetEmail(to: string, resetToken: string) {
    const resetUrl =
      this.configService.get<string>('app.frontendUrl') ??
      'http://localhost:3001';
    const template = emailTemplates.passwordReset(resetToken, resetUrl);
    return this.sendEmail(to, template.subject, template.html);
  }

  /**
   * Burs kazanma emaili
   */
  async sendScholarshipEmail(
    to: string,
    displayName: string,
    amount: number,
    rank: number,
  ) {
    const template = emailTemplates.scholarship(displayName, amount, rank);
    return this.sendEmail(to, template.subject, template.html);
  }
}
