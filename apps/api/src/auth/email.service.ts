import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailService {
  private resend: any = null;

  constructor(private config: ConfigService) {
    this.initResend();
  }

  private async initResend() {
    const apiKey = this.config.get<string>('RESEND_API_KEY');
    if (apiKey) {
      try {
        const { Resend } = await import('resend');
        this.resend = new Resend(apiKey);
      } catch (e) {
        console.warn('Resend not available, falling back to console logging');
      }
    }
  }

  async sendMagicLink(email: string, token: string, type: 'login' | 'signup'): Promise<void> {
    const baseUrl = this.config.get<string>('APP_URL') || 'http://localhost:3000';
    const magicLink = `${baseUrl}/verify?token=${token}`;
    
    const subject = type === 'signup' 
      ? 'Welcome to Entrys - Verify your email'
      : 'Sign in to Entrys';
    
    const text = type === 'signup'
      ? `Welcome to Entrys

Click the link below to create your account:

${magicLink}

This link expires in 15 minutes.

If you didn't request this email, you can safely ignore it.`
      : `Sign in to Entrys

Click the link below to sign in to your account:

${magicLink}

This link expires in 15 minutes.

If you didn't request this email, you can safely ignore it.`;

    // In development, log to console
    if (!this.resend || this.config.get<string>('NODE_ENV') !== 'production') {
      console.log('\n========================================');
      console.log(`📧 MAGIC LINK EMAIL (${type.toUpperCase()})`);
      console.log('========================================');
      console.log(`To: ${email}`);
      console.log(`Subject: ${subject}`);
      console.log(`\n🔗 Magic Link: ${magicLink}`);
      console.log('========================================\n');
      return;
    }

    // In production, use Resend
    try {
      await this.resend.emails.send({
        from: this.config.get<string>('EMAIL_FROM') || 'Entrys <noreply@entrys.co>',
        to: email,
        subject,
        text,
      });
    } catch (error) {
      console.error('Failed to send email via Resend:', error);
      throw new Error('Failed to send magic link email');
    }
  }
}
