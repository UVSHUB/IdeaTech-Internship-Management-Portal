import nodemailer from 'nodemailer';

let transporter: nodemailer.Transporter | null = null;

async function getTransporter(): Promise<nodemailer.Transporter> {
  if (transporter) return transporter;

  const host = process.env.EMAIL_HOST || 'smtp.ethereal.email';
  const port = parseInt(process.env.EMAIL_PORT || '587');
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (user && pass) {
    transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
  } else {
    // Fallback: Create test credentials automatically via Ethereal
    try {
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      console.log('📬 Mailer initialized with Ethereal Test Account:');
      console.log(`Email User: ${testAccount.user}`);
    } catch (error) {
      console.error('Failed to create Ethereal SMTP account. Falling back to console logging.', error);
      transporter = {
        sendMail: async (options: any) => {
          console.log('\n--- 📧 MOCK EMAIL SENT ---');
          console.log(`To: ${options.to}`);
          console.log(`Subject: ${options.subject}`);
          console.log(`Content:\n${options.text || options.html}`);
          console.log('--------------------------\n');
          return { messageId: 'mock-id-' + Date.now() };
        }
      } as any;
    }
  }

  return transporter!;
}

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailParams) {
  try {
    const client = await getTransporter();
    const info = await client.sendMail({
      from: `"IdeaTech ITIMP" <noreply@ideatech.lk>`,
      to,
      subject,
      html,
    });
    
    // If using ethereal, log preview URL
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log(`📩 Email preview: ${previewUrl}`);
    }
    return info;
  } catch (error) {
    console.error('Email send failed:', error);
    return null;
  }
}
