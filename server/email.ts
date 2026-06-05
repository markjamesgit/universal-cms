import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import nodemailer from "nodemailer";

const projectRoot = process.cwd();

let transporter: nodemailer.Transporter | null = null;
let cachedConfigKey = "";

function getEnvFilePaths(): string[] {
  return [
    path.join(projectRoot, ".env"),
    path.resolve(process.cwd(), ".env"),
  ];
}

export function loadEnv(): void {
  for (const envPath of getEnvFilePaths()) {
    if (!fs.existsSync(envPath)) continue;
    dotenv.config({ path: envPath, override: true });
  }
}

function getSmtpCredentials() {
  loadEnv();
  const host = process.env.SMTP_HOST?.trim();
  const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587;
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim().replace(/\s+/g, "");
  return { host, port, user, pass };
}

export function logSmtpStatus(): void {
  const envPaths = getEnvFilePaths();
  const foundEnv = envPaths.find((p) => fs.existsSync(p));
  const { host, user, pass, port } = getSmtpCredentials();

  console.log(`[SMTP] Project root: ${projectRoot}`);
  console.log(`[SMTP] CWD: ${process.cwd()}`);
  console.log(`[SMTP] .env file: ${foundEnv || "NOT FOUND"}`);

  if (host && user && pass) {
    console.log(`[SMTP] ✓ Production Gmail configured: ${host}:${port} as ${user}`);
  } else {
    console.log(
      `[SMTP] ✗ Production mail NOT configured (host:${Boolean(host)} user:${Boolean(user)} pass:${Boolean(pass)})`
    );
    console.log("[SMTP] Will use Ethereal test inbox — emails will NOT reach real Gmail.");
  }
}

export async function getTransporter(): Promise<nodemailer.Transporter> {
  loadEnv();
  const { host, port, user, pass } = getSmtpCredentials();
  const configKey = `${host}|${port}|${user}|${pass}`;

  // Always rebuild in dev so .env edits apply without a manual server kill.
  if (process.env.NODE_ENV !== "production") {
    transporter = null;
    cachedConfigKey = "";
  }

  if (transporter && cachedConfigKey === configKey) {
    return transporter;
  }

  transporter = null;
  cachedConfigKey = configKey;

  if (host && user && pass) {
    console.log(`[SMTP] Connecting Gmail via ${host}:${port} as ${user}`);
    transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });

    await transporter.verify();
    console.log("[SMTP] ✓ Gmail connection verified.");
  } else {
    console.log("[SMTP] Using Ethereal test inbox (no SMTP credentials in .env).");
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  }

  return transporter;
}

export async function sendRealEmail(to: string, subject: string, body: string, htmlContent?: string) {
  try {
    const t = await getTransporter();
    loadEnv();
    const rawSender = process.env.SMTP_SENDER?.trim();
    const sender = rawSender
      ? (rawSender.includes("<") ? rawSender : `"UniBook" <${rawSender}>`)
      : '"UniBook Notification" <noreply@unibook.co>';

    const info = await t.sendMail({
      from: sender,
      to,
      subject,
      text: body,
      html: htmlContent || body.split("\n").join("<br />"),
    });

    console.log(`[EMAIL] Sent to ${to} | Subject: "${subject}" | MessageId: ${info.messageId}`);

    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log(`[EMAIL] Test-mode preview: ${previewUrl}`);
      return { success: true, messageId: info.messageId, previewUrl, isTestMode: true };
    }

    console.log(`[EMAIL] ✓ Delivered to real inbox: ${to}`);
    return { success: true, messageId: info.messageId, isTestMode: false };
  } catch (error: any) {
    console.error("[EMAIL] FAILED:", error.message);
    return { success: false, error: error.message, isTestMode: false };
  }
}

export async function sendMerchantWelcomeEmail(opts: {
  to: string;
  businessName: string;
  siteUrl: string;
  loginUrl: string;
}) {
  const { to, businessName, siteUrl, loginUrl } = opts;
  const subject = `Your ${businessName} workspace is ready`;
  const body = `Hello,

Your business "${businessName}" has been registered on Universal CMS.

Your public website: ${siteUrl}

Sign in to your merchant dashboard with this email address (${to}):
${loginUrl}

Open the link above and click Continue to access your dashboard.

— Universal CMS`;

  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:520px;margin:0 auto;color:#18181b">
      <h2 style="font-size:20px;margin:0 0 12px">Your workspace is ready</h2>
      <p style="font-size:14px;line-height:1.6;color:#52525b">
        <strong>${businessName}</strong> is now live on Universal CMS.
        Use your contact email <strong>${to}</strong> to sign in.
      </p>
      <p style="margin:24px 0">
        <a href="${loginUrl}" style="display:inline-block;background:#18181b;color:#fff;text-decoration:none;padding:12px 20px;border-radius:8px;font-size:14px;font-weight:600">
          Open merchant login
        </a>
      </p>
      <p style="font-size:13px;color:#71717a">
        Public site: <a href="${siteUrl}" style="color:#18181b">${siteUrl}</a>
      </p>
      <p style="font-size:12px;color:#a1a1aa;margin-top:24px">— Universal CMS</p>
    </div>
  `;

  return sendRealEmail(to, subject, body, html);
}
