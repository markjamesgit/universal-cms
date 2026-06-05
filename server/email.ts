import nodemailer from "nodemailer";

let transporter: nodemailer.Transporter | null = null;

export async function getTransporter(): Promise<nodemailer.Transporter> {
  if (transporter) return transporter;

  const defaultHost = process.env.SMTP_HOST;
  const defaultPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587;
  const defaultUser = process.env.SMTP_USER;
  const defaultPass = process.env.SMTP_PASS;

  if (defaultHost && defaultUser && defaultPass) {
    console.log("[SMTP] Initializing production SMTP transporter with custom credentials...");
    transporter = nodemailer.createTransport({
      host: defaultHost,
      port: defaultPort,
      secure: defaultPort === 465,
      auth: {
        user: defaultUser,
        pass: defaultPass,
      },
      tls: {
        rejectUnauthorized: false
      }
    });
  } else {
    console.log("[SMTP] No custom SMTP configured. Registering completely free Ethereal SMTP playground...");
    try {
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        }
      });
      console.log(`[SMTP SUCCESS] Registered Ethereal Credentials:`);
      console.log(`- HOST: smtp.ethereal.email`);
      console.log(`- USER: ${testAccount.user}`);
      console.log(`- PASS: ${testAccount.pass}`);
      console.log(`- SENDER PROFILE: "UniBook Platform" <noreply@unibook.co>`);
      console.log(`- VERIFY LANDING PAGE: https://ethereal.email/login`);
    } catch (err) {
      console.error("[SMTP ERROR] Ethereal auto-creation failed, falling back to JSON stub logs.", err);
      transporter = nodemailer.createTransport({
        jsonTransport: true
      });
    }
  }

  return transporter;
}

export async function sendRealEmail(to: string, subject: string, body: string, htmlContent?: string) {
  try {
    const t = await getTransporter();
    const sender = process.env.SMTP_SENDER || '"UniBook Notification" <noreply@unibook.co>';
    const mailOptions = {
      from: sender,
      to,
      subject,
      text: body,
      html: htmlContent || body.split("\n").join("<br />")
    };

    const info = await t.sendMail(mailOptions);
    console.log(`[REAL EMAIL DISPATCHED] Destination: ${to} | Subject: "${subject}" | MessageId: ${info.messageId}`);
    
    // Check if Ethereal preview is available
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log(`[FREE SMTP VIEWER] View the real email delivered instantly in your browser at:`);
      console.log(`🔗 ${previewUrl}`);
      console.log(`--------------------------------------------------------------------------------`);
      return { success: true, messageId: info.messageId, previewUrl };
    }
    
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error("[REAL EMAIL FAILURE] SMTP transmission crashed:", error);
    return { success: false, error: error.message };
  }
}
