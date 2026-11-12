const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const nodemailer = require('nodemailer');

let transporter = null;

function getSender() {
  const senderAddress = (process.env.SMTP_USER || 'noreply@siliconwest.in').trim();
  if (process.env.EMAIL_FROM && process.env.EMAIL_FROM.trim().length > 0) {
    return process.env.EMAIL_FROM.trim();
  }
  return {
    name: 'Event Management Committee • Silicon West',
    address: senderAddress,
  };
}

function getAppUrl() {
  return (
    process.env.APP_URL ||
    process.env.FRONTEND_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    'http://localhost:3000'
  ).replace(/\/$/, '');
}

async function getTransporter() {
  if (transporter) return transporter;

  const host = (process.env.SMTP_HOST || 'smtp.zoho.in').trim();
  const port = Number(process.env.SMTP_PORT) || 465;
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;
  const user = (process.env.SMTP_USER || 'noreply@siliconwest.in').trim();
  const pass = (process.env.SMTP_PASS || '').trim();
  const service = (process.env.SMTP_SERVICE || '').trim();

  const isConfigured = (service || host) && user && pass;

  if (isConfigured) {
    const transportConfig = service
      ? {
          service,
          auth: { user, pass },
        }
      : {
          host,
          port,
          secure,
          auth: { user, pass },
          tls: { rejectUnauthorized: false },
        };

    transporter = nodemailer.createTransport(transportConfig);
    console.log(`📧 Configured production SMTP email transporter (${service || host}:${port})`);
  } else {
    try {
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: { user: testAccount.user, pass: testAccount.pass },
      });
      console.log('📧 Configured Ethereal test email account for dev delivery');
    } catch {
      transporter = {
        sendMail: async (options) => {
          console.log('\n================== [DEV EMAIL SENT] ==================');
          console.log(`To: ${options.to}`);
          console.log(`Subject: ${options.subject}`);
          console.log('======================================================\n');
          return { messageId: 'dev-mock-id' };
        },
      };
    }
  }

  return transporter;
}

/**
 * Format timestamp in clean formal IST format
 */
function formatEventDate(dateString) {
  if (!dateString) return 'To Be Announced';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return 'To Be Announced';
    return d.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return 'To Be Announced';
  }
}

/**
 * Helper to generate official event entry ticket pass code
 * Format: SW-PASS-2026-{UUID_FRAGMENT}
 */
function generatePassNo(registrationId) {
  const currentYear = new Date().getFullYear();
  if (registrationId && typeof registrationId === 'string') {
    const cleanUuid = registrationId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8).toUpperCase();
    return `SW-PASS-${currentYear}-${cleanUuid}`;
  }
  const randomSnippet = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `SW-PASS-${currentYear}-${randomSnippet}`;
}

/**
 * Clean, Solid-Blue Professional Email Layout Builder
 * - NO gradients used (clean solid colors)
 * - Inter / system-ui premium font stack
 * - NO reference / security tracking numbers
 * - Silicon West Signature Blue theme (#034694)
 */
function buildCleanBlueEmailLayout({
  badgeText = 'OFFICIAL NOTICE',
  documentTitle,
  recipientName = 'Student',
  contentHtml,
  callToAction = null,
  securityNote = null,
}) {
  const currentDate = new Date().toLocaleDateString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  return `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${documentTitle}</title>
  <style type="text/css">
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
    body { margin: 0; padding: 0; min-width: 100%; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; color: #1e293b; -webkit-font-smoothing: antialiased; }
    table { border-collapse: collapse; }
    .content-table { max-width: 620px; width: 100%; margin: 28px auto; background-color: #ffffff; border-radius: 10px; border: 1px solid #cbd5e1; overflow: hidden; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.05); }
    .gold-bar { height: 4px; width: 100%; background-color: #fbbf24; }
    .header-bar { background-color: #034694; padding: 26px 32px; text-align: left; }
    .emblem-box { width: 44px; height: 44px; background-color: #ffffff; border-radius: 8px; border: 2px solid #fbbf24; text-align: center; line-height: 44px; font-size: 24px; font-weight: 800; color: #034694; display: inline-block; }
    .inst-name { font-size: 16px; font-weight: 800; letter-spacing: 0.04em; color: #ffffff; text-transform: uppercase; margin: 0; line-height: 1.25; }
    .inst-sub { font-size: 11.5px; font-weight: 600; letter-spacing: 0.06em; color: #bfdbfe; text-transform: uppercase; margin: 4px 0 0 0; }
    .doc-meta { background-color: #f8fafc; border-bottom: 1px solid #e2e8f0; padding: 12px 32px; font-size: 12px; color: #64748b; }
    .doc-badge { display: inline-block; padding: 4px 12px; background-color: #eff6ff; color: #034694; border: 1px solid #bfdbfe; border-radius: 4px; font-size: 10.5px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; }
    .body-section { padding: 32px; font-size: 14.5px; line-height: 1.65; color: #334155; }
    .doc-title { font-size: 21px; font-weight: 800; color: #0f172a; margin: 0 0 16px 0; letter-spacing: -0.02em; line-height: 1.3; }
    .salutation { font-size: 15px; color: #0f172a; margin-bottom: 16px; font-weight: 600; }
    .data-card { background-color: #ffffff; border: 1.5px solid #e2e8f0; border-radius: 8px; overflow: hidden; margin: 22px 0; }
    .data-card-header { background-color: #f8fafc; border-bottom: 1px solid #e2e8f0; padding: 11px 18px; font-size: 11.5px; font-weight: 700; color: #034694; text-transform: uppercase; letter-spacing: 0.06em; }
    .data-card-body { padding: 18px; }
    .data-table { width: 100%; font-size: 13.5px; }
    .data-table td { padding: 9px 8px; vertical-align: top; border-bottom: 1px solid #f1f5f9; }
    .data-table tr:last-child td { border-bottom: none; }
    .data-label { color: #64748b; font-weight: 600; width: 33%; font-size: 11.5px; text-transform: uppercase; letter-spacing: 0.04em; }
    .data-val { color: #0f172a; font-weight: 600; font-size: 13.5px; }
    .code-box { background-color: #f0f7ff; border: 2px dashed #034694; border-radius: 8px; padding: 22px 16px; text-align: center; margin: 22px 0; }
    .code-digits { font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 800; letter-spacing: 10px; color: #034694; margin: 0; }
    .code-note { font-size: 11px; font-weight: 700; color: #64748b; margin-top: 8px; text-transform: uppercase; letter-spacing: 0.06em; }
    .btn-wrap { text-align: center; margin: 28px 0 14px 0; }
    .btn-action { display: inline-block; background-color: #034694; color: #ffffff !important; text-decoration: none; font-size: 13.5px; font-weight: 700; padding: 13px 32px; border-radius: 6px; letter-spacing: 0.02em; }
    .sec-notice { background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 12px 16px; margin: 22px 0; font-size: 12px; color: #92400e; border-radius: 0 6px 6px 0; }
    .footer-section { background-color: #f8fafc; color: #64748b; padding: 26px 32px; font-size: 11px; line-height: 1.6; text-align: center; border-top: 1px solid #e2e8f0; }
    .footer-inst { font-weight: 700; color: #1e293b; text-transform: uppercase; letter-spacing: 0.05em; font-size: 11.5px; margin-bottom: 4px; }
  </style>
</head>
<body>
  <table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#f1f5f9">
    <tr>
      <td align="center" style="padding: 24px 12px;">
        <table class="content-table" cellpadding="0" cellspacing="0" border="0">
          <!-- Gold Accent Bar -->
          <tr>
            <td><div class="gold-bar"></div></td>
          </tr>

          <!-- Solid Blue Header -->
          <tr>
            <td class="header-bar">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td width="52" valign="middle">
                    <div class="emblem-box">S</div>
                  </td>
                  <td style="padding-left: 14px;" valign="middle">
                    <div class="inst-name">Silicon Institute of Technology</div>
                    <div class="inst-sub">Silicon West Campus &bull; Event Management Committee</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Document Metadata Strip -->
          <tr>
            <td class="doc-meta">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td><span class="doc-badge">${badgeText}</span></td>
                  <td align="right" style="font-size: 11.5px; color: #64748b;">
                    Date: ${currentDate}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Document Body -->
          <tr>
            <td class="body-section">
              <h1 class="doc-title">${documentTitle}</h1>
              <div class="salutation">Dear <strong>${recipientName}</strong>,</div>

              ${contentHtml}

              ${
                callToAction
                  ? `<div class="btn-wrap">
                      <a href="${callToAction.url}" class="btn-action">${callToAction.label} &rarr;</a>
                    </div>`
                  : ''
              }

              ${
                securityNote
                  ? `<div class="sec-notice">
                      <strong style="color: #b45309; text-transform: uppercase; font-size: 11px; letter-spacing: 0.05em;">Notice:</strong> ${securityNote}
                    </div>`
                  : ''
              }

              <div style="margin-top: 30px; padding-top: 18px; border-top: 1px solid #f1f5f9; font-size: 13.5px; color: #475569;">
                Sincerely,<br />
                <strong style="color: #0f172a;">Event Management Committee</strong><br />
                Silicon Institute of Technology, Sambalpur
              </div>
            </td>
          </tr>

          <!-- Clean Light Footer -->
          <tr>
            <td class="footer-section">
              <div class="footer-inst">Silicon Institute of Technology, Sambalpur</div>
              <div style="color: #475569; font-weight: 500;">Silicon West Campus, Sason, Sambalpur, Odisha &ndash; 768200</div>
              <div style="margin-top: 8px; color: #94a3b8; font-size: 10.5px; line-height: 1.5;">
                Official automated notice generated on behalf of the Event Management Committee.<br />
                Silicon West Campus Portal
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

// ========================================================
// SEQUENTIAL EMAIL QUEUE WITH CONFIGURABLE BREAK (60s)
// ========================================================
const emailQueue = [];
let isQueueProcessing = false;

// 60 seconds (60,000 ms) break between each email to strictly adhere to SMTP limits
const EMAIL_SEND_INTERVAL_MS = Number(process.env.EMAIL_SEND_INTERVAL_MS) || 60000;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Worker that processes the email queue one by one,
 * pausing for 60 seconds (EMAIL_SEND_INTERVAL_MS) between each dispatch.
 */
async function processEmailQueue() {
  if (isQueueProcessing) return;
  isQueueProcessing = true;

  console.log(`\n📬 [EMAIL QUEUE STARTED] Processing ${emailQueue.length} queued email(s) (${EMAIL_SEND_INTERVAL_MS / 1000}s cooldown between each).`);

  while (emailQueue.length > 0) {
    const job = emailQueue.shift();
    const { mailOptions, type, queuedAt } = job;

    try {
      const mailTransporter = await getTransporter();
      console.log(`\n🚀 [EMAIL QUEUE DISPATCH] (${type}) Sending to: ${mailOptions.to}`);
      console.log(`   Subject  : ${mailOptions.subject}`);
      console.log(`   Enqueued : ${queuedAt.toLocaleTimeString()}`);

      const info = await mailTransporter.sendMail(mailOptions);
      console.log(`✅ [EMAIL QUEUE SUCCESS] Delivered to ${mailOptions.to} (MessageId: ${info.messageId || 'ok'})`);
    } catch (err) {
      console.error(`❌ [EMAIL QUEUE ERROR] Failed to deliver to ${mailOptions.to}: ${err.message}`);
    }

    // If there are more emails waiting in line, enforce the 60-second break
    if (emailQueue.length > 0) {
      console.log(`⏳ [EMAIL QUEUE COOLDOWN] Waiting ${EMAIL_SEND_INTERVAL_MS / 1000}s before sending the next email to prevent SMTP rate limits... [${emailQueue.length} remaining]`);
      await sleep(EMAIL_SEND_INTERVAL_MS);
    }
  }

  isQueueProcessing = false;
  console.log(`📭 [EMAIL QUEUE IDLE] All queued emails have been processed.\n`);
}

/**
 * Enqueue an email into the delivery queue.
 * Returns immediately with a queue receipt so callers (API endpoints) do not hang for 60+ seconds.
 */
function enqueueEmail(mailOptions, type = 'NOTIFICATION') {
  const queuedAt = new Date();
  const queuePosition = emailQueue.length + 1;
  const estimatedDelaySec = (queuePosition - 1) * (EMAIL_SEND_INTERVAL_MS / 1000);

  emailQueue.push({
    mailOptions,
    type,
    queuedAt,
  });

  console.log(`📥 [EMAIL QUEUED] (${type}) Added email for ${mailOptions.to} [Position #${queuePosition} | Estimated delay: ${estimatedDelaySec}s]`);

  // Start queue worker in background if not already active
  processEmailQueue().catch((err) => {
    console.error('Unexpected error in email queue runner:', err);
  });

  return {
    status: 'queued',
    messageId: `queue-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    to: mailOptions.to,
    type,
    queuePosition,
    queuedAt,
    estimatedDelaySec,
  };
}

/**
 * Inspect the current queue status
 */
function getEmailQueueStatus() {
  return {
    queueLength: emailQueue.length,
    isProcessing: isQueueProcessing,
    intervalSeconds: EMAIL_SEND_INTERVAL_MS / 1000,
    pending: emailQueue.map((j) => ({
      to: j.mailOptions.to,
      type: j.type,
      queuedAt: j.queuedAt,
    })),
  };
}

/**
 * 1. Send 6-digit email verification code (Clean Blue)
 */
async function sendVerificationEmail({ to, name, code }) {
  const from = getSender();
  const senderAddress = (process.env.SMTP_USER || 'noreply@siliconwest.in').trim();

  const contentHtml = `
    <p>Thank you for signing up for the <strong>Silicon West Campus Management Portal</strong>.</p>
    <p>Please enter the 6-digit One-Time Passcode (OTP) below to verify your official Silicon ID and activate your student account:</p>

    <div class="code-box">
      <div class="code-digits">${code}</div>
      <div class="code-note">Verification Code &bull; Valid for 15 Minutes</div>
    </div>

    <p>Once verified, complete your student profile details (SIC Number, Academic Batch, and Gender) to access all campus events and society memberships.</p>
  `;

  const html = buildCleanBlueEmailLayout({
    badgeText: 'ACCOUNT VERIFICATION',
    documentTitle: 'Email Verification Passcode',
    recipientName: name || 'Student',
    contentHtml,
    securityNote: 'This security code is confidential. Silicon West staff will never request your OTP via phone or external chat.',
  });

  const text = `Dear ${name || 'Student'},\n\nYour Silicon West account verification code is: ${code}\nValid for 15 minutes.\n\nEvent Management Committee\nSilicon Institute of Technology, Sambalpur`;

  const mailOptions = {
    from,
    to,
    replyTo: senderAddress,
    subject: `Verify your Silicon West account: ${code}`,
    text,
    html,
  };

  return enqueueEmail(mailOptions, 'ACCOUNT_VERIFICATION');
}

/**
 * 2. Send password reset email with code (Clean Blue & Red Alert)
 */
async function sendPasswordResetEmail({ to, name, code }) {
  const from = getSender();
  const senderAddress = (process.env.SMTP_USER || 'noreply@siliconwest.in').trim();

  const contentHtml = `
    <p>We received an official request to reset the password for your Silicon West Campus account associated with <strong>${to}</strong>.</p>
    <p>Please enter the 6-digit security code below in your password recovery window to set a new password:</p>

    <div class="code-box" style="background-color: #fff1f2; border-color: #e11d48;">
      <div class="code-digits" style="color: #be123c;">${code}</div>
      <div class="code-note" style="color: #be123c;">Password Reset Code &bull; Single Use Only</div>
    </div>

    <p>If you did not initiate this request, your account may be at risk. Please contact the campus IT Helpdesk immediately.</p>
  `;

  const html = buildCleanBlueEmailLayout({
    badgeText: 'SECURITY NOTICE',
    documentTitle: 'Password Reset Authorization',
    recipientName: name || 'User',
    contentHtml,
    securityNote: 'This code expires strictly after 15 minutes. For your protection, never share this security code with anyone.',
  });

  const text = `Dear ${name || 'User'},\n\nA request was made to reset your Silicon West password.\nAuthorization Code: ${code}\nValid for 15 minutes.\n\nEvent Management Committee\nSilicon Institute of Technology, Sambalpur`;

  const mailOptions = {
    from,
    to,
    replyTo: senderAddress,
    subject: `Reset your Silicon West password: ${code}`,
    text,
    html,
  };

  return enqueueEmail(mailOptions, 'PASSWORD_RESET');
}

/**
 * 3. Send event registration confirmation pass (Solid Blue Official Admission Pass)
 */
async function sendRegistrationConfirmationEmail({
  to,
  name,
  event,
  registration,
  teamName,
  teamMembers,
}) {
  const mailTransporter = await getTransporter();
  const from = getSender();
  const senderAddress = (process.env.SMTP_USER || 'noreply@siliconwest.in').trim();
  const appUrl = getAppUrl();

  const eventTitle = event?.title || 'Campus Event';
  const clubName = event?.club?.name || 'Silicon Institute Technical Society';
  const eventDate = formatEventDate(event?.startsAt);
  const venue = event?.venue || 'Campus Auditorium / Specified Venue';
  const passNo = generatePassNo(registration?.id);

  const isTeam = Boolean(teamName || (Array.isArray(teamMembers) && teamMembers.length > 0));

  const teamRosterHtml =
    isTeam && Array.isArray(teamMembers) && teamMembers.length > 0
      ? `
        <div style="margin-top: 14px; padding: 12px 16px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px;">
          <div style="font-size: 11px; font-weight: 700; color: #034694; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px;">Confirmed Team Members:</div>
          <table width="100%" style="font-size: 13px; color: #334155; border-collapse: collapse;">
            ${teamMembers
              .map(
                (m, idx) => `
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 6px 0; font-weight: 700; width: 28px; color: #034694;">${idx + 1}.</td>
                <td style="padding: 6px 0; font-weight: 700;">${m.name || 'Student Participant'}</td>
                <td style="padding: 6px 0; color: #64748b; font-family: monospace;">${m.email}</td>
              </tr>
            `
              )
              .join('')}
          </table>
        </div>
      `
      : '';

  const contentHtml = `
    <p>This is an official confirmation that your registration for <strong>${eventTitle}</strong> is confirmed.</p>

    <!-- Solid Blue Admission Pass Box -->
    <div style="background-color: #f0f7ff; border: 2px solid #034694; border-radius: 8px; overflow: hidden; margin: 20px 0;">
      <!-- Pass Header -->
      <div style="background-color: #034694; color: #ffffff; padding: 14px 20px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td>
              <div style="font-size: 10px; font-weight: 700; letter-spacing: 0.1em; color: #fbbf24; text-transform: uppercase;">Official Admission Pass</div>
              <div style="font-size: 16px; font-weight: 800; color: #ffffff; margin-top: 2px;">${eventTitle}</div>
            </td>
            <td align="right" valign="middle">
              <span style="background-color: #ffffff; color: #034694; font-size: 11px; font-weight: 800; letter-spacing: 0.06em; padding: 4px 10px; border-radius: 4px; text-transform: uppercase;">CONFIRMED</span>
            </td>
          </tr>
        </table>
      </div>

      <!-- Pass Body -->
      <div style="padding: 18px 20px; background-color: #ffffff;">
        <table width="100%" style="font-size: 13px; border-collapse: collapse;">
          <tr>
            <td style="padding: 7px 0; color: #64748b; font-weight: 600; width: 34%; font-size: 11.5px; text-transform: uppercase;">Ticket Pass ID</td>
            <td style="padding: 7px 0; font-family: monospace; font-size: 14px; font-weight: 800; color: #034694;">${passNo}</td>
          </tr>
          <tr>
            <td style="padding: 7px 0; color: #64748b; font-weight: 600; font-size: 11.5px; text-transform: uppercase;">Participant</td>
            <td style="padding: 7px 0; font-weight: 700; color: #0f172a;">${name}</td>
          </tr>
          <tr>
            <td style="padding: 7px 0; color: #64748b; font-weight: 600; font-size: 11.5px; text-transform: uppercase;">Official Email</td>
            <td style="padding: 7px 0; font-weight: 600; color: #0f172a;">${to}</td>
          </tr>
          <tr>
            <td style="padding: 7px 0; color: #64748b; font-weight: 600; font-size: 11.5px; text-transform: uppercase;">Host Society</td>
            <td style="padding: 7px 0; font-weight: 600; color: #0f172a;">${clubName}</td>
          </tr>
          <tr>
            <td style="padding: 7px 0; color: #64748b; font-weight: 600; font-size: 11.5px; text-transform: uppercase;">Schedule</td>
            <td style="padding: 7px 0; font-weight: 700; color: #0f172a;">${eventDate}</td>
          </tr>
          <tr>
            <td style="padding: 7px 0; color: #64748b; font-weight: 600; font-size: 11.5px; text-transform: uppercase;">Venue</td>
            <td style="padding: 7px 0; font-weight: 700; color: #0f172a;">${venue}</td>
          </tr>
          ${
            teamName
              ? `<tr>
                  <td style="padding: 7px 0; color: #64748b; font-weight: 600; font-size: 11.5px; text-transform: uppercase;">Team Designation</td>
                  <td style="padding: 7px 0; font-weight: 800; color: #034694;">${teamName}</td>
                </tr>`
              : ''
          }
        </table>

        ${teamRosterHtml}
      </div>
    </div>

    <div style="background-color: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 6px; padding: 14px 18px; margin: 18px 0; font-size: 12.5px; color: #475569;">
      <strong style="color: #0f172a; text-transform: uppercase; font-size: 11px; letter-spacing: 0.05em;">Entry Guidelines:</strong>
      <ul style="margin: 6px 0 0 0; padding-left: 20px; line-height: 1.6;">
        <li>Please present this digital pass or your Ticket Pass ID at the venue check-in desk.</li>
        <li>A valid Silicon Institute of Technology physical student ID card is mandatory for admittance.</li>
        <li>Check-in counters open 20 minutes prior to the scheduled start time.</li>
      </ul>
    </div>
  `;

  const html = buildCleanBlueEmailLayout({
    badgeText: 'ADMISSION PASS',
    documentTitle: 'Official Event Registration Admission Pass',
    recipientName: name || 'Student Participant',
    contentHtml,
    callToAction: {
      label: 'View Digital Pass in Portal',
      url: `${appUrl}/my-registrations`,
    },
    securityNote: 'This admission pass is non-transferable. Misuse or falsification of entry documents violates campus regulations.',
  });

  const text = `Dear ${name || 'Student'},\n\nYour registration for "${eventTitle}" is CONFIRMED.\n\nPass Code: ${passNo}\nDate: ${eventDate}\nVenue: ${venue}\nHost Club: ${clubName}\n\nView pass: ${appUrl}/dashboard/registrations\n\nEvent Management Committee\nSilicon Institute of Technology, Sambalpur`;

  const mailOptions = {
    from,
    to,
    replyTo: senderAddress,
    subject: `Registration Confirmed: ${eventTitle} [Pass: ${passNo}]`,
    text,
    html,
  };

  return enqueueEmail(mailOptions, 'REGISTRATION_CONFIRMATION');
}

/**
 * 4. Send team invitation email to teammate (Clean Solid Blue)
 */
async function sendTeamInvitationEmail({
  to,
  teammateName,
  inviterName,
  teamName,
  event,
}) {
  const from = getSender();
  const senderAddress = (process.env.SMTP_USER || 'noreply@siliconwest.in').trim();
  const appUrl = getAppUrl();

  const eventTitle = event?.title || 'Campus Event';
  const clubName = event?.club?.name || 'Silicon West Technical Society';
  const eventDate = formatEventDate(event?.startsAt);
  const venue = event?.venue || 'Campus Auditorium / Specified Venue';

  const contentHtml = `
    <p>You have received an official nomination from <strong>${inviterName || 'A Student Team Lead'}</strong> to join team <strong>${teamName || 'Campus Team'}</strong> for the event below:</p>

    <div class="data-card">
      <div class="data-card-header">
        Team Nomination Overview
      </div>
      <div class="data-card-body">
        <table class="data-table">
          <tr>
            <td class="data-label">Team Designation</td>
            <td class="data-val" style="color: #034694; font-size: 14.5px; font-weight: 700;">${teamName || 'Official Campus Team'}</td>
          </tr>
          <tr>
            <td class="data-label">Invited By</td>
            <td class="data-val">${inviterName || 'Team Leader'}</td>
          </tr>
          <tr>
            <td class="data-label">Event Title</td>
            <td class="data-val">${eventTitle}</td>
          </tr>
          <tr>
            <td class="data-label">Host Society</td>
            <td class="data-val">${clubName}</td>
          </tr>
          <tr>
            <td class="data-label">Event Schedule</td>
            <td class="data-val">${eventDate}</td>
          </tr>
          <tr>
            <td class="data-label">Designated Venue</td>
            <td class="data-val">${venue}</td>
          </tr>
        </table>
      </div>
    </div>

    <p>Please log in to your student dashboard to review the event details and accept or decline the team invitation.</p>
  `;

  const html = buildCleanBlueEmailLayout({
    badgeText: 'TEAM INVITATION',
    documentTitle: 'Official Event Team Invitation',
    recipientName: teammateName || 'Student',
    contentHtml,
    callToAction: {
      label: 'Review & Respond to Invitation',
      url: `${appUrl}/dashboard/invitations`,
    },
    securityNote: 'Team nominations require active confirmation before the event registration closes.',
  });

  const text = `Dear ${teammateName || 'Student'},\n\n${inviterName} has invited you to join team "${teamName}" for "${eventTitle}".\nSchedule: ${eventDate}\nVenue: ${venue}\n\nRespond here: ${appUrl}/dashboard/invitations\n\nEvent Management Committee\nSilicon Institute of Technology, Sambalpur`;

  const mailOptions = {
    from,
    to,
    replyTo: senderAddress,
    subject: `Team Invitation: Join ${teamName} for ${eventTitle}`,
    text,
    html,
  };

  return enqueueEmail(mailOptions, 'TEAM_INVITATION');
}

/**
 * 5. Send team invitation response update email to team leader (Clean Solid Blue)
 */
async function sendTeamInviteStatusEmail({
  to,
  inviterName,
  teammateName,
  teamName,
  event,
  status,
}) {
  const from = getSender();
  const senderAddress = (process.env.SMTP_USER || 'noreply@siliconwest.in').trim();
  const appUrl = getAppUrl();

  const isAccepted = status === 'ACCEPTED';
  const statusColor = isAccepted ? '#15803d' : '#b45309';
  const statusBg = isAccepted ? '#ecfdf5' : '#fffbeb';
  const statusBorder = isAccepted ? '#86efac' : '#fde68a';
  const statusText = isAccepted ? 'CONFIRMED / ACCEPTED' : 'DECLINED';

  const eventTitle = event?.title || 'Campus Event';

  const contentHtml = `
    <p>This is an automated status update from the <strong>Event Management Committee</strong> regarding your team nomination for <strong>${teamName}</strong> in <strong>${eventTitle}</strong>.</p>

    <div class="data-card">
      <div class="data-card-header">
        Response Summary
      </div>
      <div class="data-card-body">
        <table class="data-table">
          <tr>
            <td class="data-label">Teammate Name</td>
            <td class="data-val">${teammateName || 'Student'}</td>
          </tr>
          <tr>
            <td class="data-label">Decision Status</td>
            <td class="data-val">
              <span style="display: inline-block; padding: 4px 12px; background-color: ${statusBg}; color: ${statusColor}; border: 1px solid ${statusBorder}; border-radius: 4px; font-weight: 700; font-size: 11px; text-transform: uppercase;">
                ${statusText}
              </span>
            </td>
          </tr>
          <tr>
            <td class="data-label">Team Designation</td>
            <td class="data-val">${teamName}</td>
          </tr>
          <tr>
            <td class="data-label">Associated Event</td>
            <td class="data-val">${eventTitle}</td>
          </tr>
        </table>
      </div>
    </div>

    <p>${
      isAccepted
        ? `The participant has confirmed acceptance. Their seat is officially locked into your team roster for this event.`
        : `The participant has declined this invitation. If registration remains open, you may invite an alternate candidate from your dashboard.`
    }</p>
  `;

  const html = buildCleanBlueEmailLayout({
    badgeText: 'ROSTER UPDATE',
    documentTitle: 'Team Nomination Status Update',
    recipientName: inviterName || 'Team Leader',
    contentHtml,
    callToAction: {
      label: 'Manage Team Roster in Dashboard',
      url: `${appUrl}/dashboard/registrations`,
    },
  });

  const text = `Dear ${inviterName || 'Team Leader'},\n\nYour teammate ${teammateName} has ${statusText} the team invitation for "${teamName}" in ${eventTitle}.\n\nView team roster: ${appUrl}/dashboard/registrations\n\nEvent Management Committee\nSilicon Institute of Technology, Sambalpur`;

  const mailOptions = {
    from,
    to,
    replyTo: senderAddress,
    subject: `Team Roster Update: ${teammateName} [${statusText}] Invitation for ${teamName}`,
    text,
    html,
  };

  return enqueueEmail(mailOptions, 'TEAM_INVITE_STATUS');
}

/**
 * 6. Send all clean-blue email templates to a specified address for live review
 */
async function sendAllTemplatesTest({ targetEmail, recipientName = 'Satya Ranjan Nayak' }) {
  console.log(`\n======================================================`);
  console.log(`📤 Dispatching all clean-blue email templates to: ${targetEmail}`);
  console.log(`   (They are enqueued and will send with 60s cooldown)`);
  console.log(`======================================================\n`);

  const results = {};

  // 1. Account Verification OTP
  results.verification = await sendVerificationEmail({
    to: targetEmail,
    name: recipientName,
    code: '849201',
  });

  // 2. Password Reset Authorization
  results.passwordReset = await sendPasswordResetEmail({
    to: targetEmail,
    name: recipientName,
    code: '319084',
  });

  // 3. Event Registration Pass
  results.registration = await sendRegistrationConfirmationEmail({
    to: targetEmail,
    name: recipientName,
    event: {
      title: 'Silicon HackNova 2026: 36-Hour National Hackathon',
      startsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      venue: 'Main Auditorium & Innovation Labs, Tech Block, Silicon West',
      club: { name: 'Silicon Coding Club (SCC)' },
    },
    registration: {
      id: 'a8b1c2d3-e4f5-6789-0123-abcdef456789',
    },
    teamName: 'CyberKnights Innovators',
    teamMembers: [
      { name: recipientName, email: targetEmail },
      { name: 'Aman Sharma', email: 'aman.sharma@silicon.ac.in' },
      { name: 'Kavita Patel', email: 'kavita.patel@silicon.ac.in' },
      { name: 'Rohan Mohapatra', email: 'rohan.m@silicon.ac.in' },
    ],
  });

  // 4. Team Nomination & Invitation
  results.teamInvitation = await sendTeamInvitationEmail({
    to: targetEmail,
    teammateName: recipientName,
    inviterName: 'Prof. Alekha Dash',
    teamName: 'Autonomous Rovers Core Squad',
    event: {
      title: 'Autonomous Robotics & Drone Tech Hands-on Workshop',
      startsAt: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString(),
      venue: 'Advanced Robotics Lab, Silicon University Sambalpur Campus',
      club: { name: 'RoboSilicon - Robotics & IoT Club' },
    },
  });

  // 5. Team Invite Status Notice
  results.teamInviteStatus = await sendTeamInviteStatusEmail({
    to: targetEmail,
    inviterName: recipientName,
    teammateName: 'Priyanka Mishra (23BTECH042)',
    teamName: 'CyberKnights Innovators',
    event: {
      title: 'Silicon HackNova 2026: 36-Hour National Hackathon',
    },
    status: 'ACCEPTED',
  });

  return results;
}

module.exports = {
  getTransporter,
  generatePassNo,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendRegistrationConfirmationEmail,
  sendTeamInvitationEmail,
  sendTeamInviteStatusEmail,
  sendAllTemplatesTest,
  enqueueEmail,
  getEmailQueueStatus,
};
