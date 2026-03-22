import nodemailer from 'nodemailer';
import logger from '../config/logger';

// Verificar se as configurações SMTP estão disponíveis
const hasSmtpConfig = !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

let transporter: nodemailer.Transporter | null = null;

if (hasSmtpConfig) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true' || false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    // Configurações adicionais para melhor compatibilidade
    tls: {
      rejectUnauthorized: process.env.SMTP_REJECT_UNAUTHORIZED !== 'false',
    },
  });

  // Verificar conexão ao criar o transporter
  transporter.verify((error) => {
    if (error) {
      logger.error('SMTP connection failed', { error: error.message });
    } else {
      logger.info('SMTP connection verified successfully');
    }
  });
} else {
  logger.warn('SMTP configuration missing. Email sending will be disabled. Set SMTP_HOST, SMTP_USER, and SMTP_PASS environment variables.');
}

export async function sendEmail(to: string, subject: string, html: string) {
  if (!hasSmtpConfig || !transporter) {
    const error = 'SMTP não configurado. Configure as variáveis SMTP_HOST, SMTP_USER e SMTP_PASS.';
    logger.error('Email sending failed', { to, subject, error });
    throw new Error(error);
  }

  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject,
      html,
    });

    logger.info('Email sent successfully', { 
      to, 
      subject, 
      messageId: info.messageId 
    });

    return info;
  } catch (error) {
    logger.error('Failed to send email', { 
      to, 
      subject, 
      error: error instanceof Error ? error.message : String(error) 
    });
    throw error;
  }
} 