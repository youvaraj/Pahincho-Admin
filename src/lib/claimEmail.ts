import "server-only";

import { CLAIM_STATUS_LABELS, type ClaimStatus } from "./claimTypes";

const LOGO_URL =
  "https://firebasestorage.googleapis.com/v0/b/pahincho-1a4d6.appspot.com/o/assets%2Flogo-black_1024_1024.png?alt=media&token=bda0b01a-947e-40df-be60-b84601e72fa0";

const SUPPORT_EMAIL = "support@pahincho.com";
const SUPPORT_PHONE = "408 359 7495";
const SUPPORT_PHONE_TEL = "+14083597495";

export type ClaimConfirmationEmailData = {
  firstName: string;
  lastName: string;
  email: string;
  title: string;
  details: string;
  claimNumber: string;
  status: ClaimStatus;
};

export type SendEmailResult =
  | { ok: true; providerId: string }
  | { ok: false; error: string };

function createClaimConfirmationHtml(data: ClaimConfirmationEmailData): string {
  const { firstName, title, details, status } = data;
  const statusLabel = CLAIM_STATUS_LABELS[status];
  const year = new Date().getFullYear();

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Claim confirmation</title>
  <style>
    body { margin: 0; padding: 0; background: #f7fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #2d3748; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
    .header { background: linear-gradient(135deg, #FFB347 0%, #FFC266 100%); padding: 36px 30px; text-align: center; }
    .header img { width: 72px; height: 72px; border-radius: 16px; }
    .header h1 { margin: 16px 0 0; color: #1a202c; font-size: 26px; }
    .content { padding: 36px 30px; }
    .greeting { font-size: 18px; font-weight: 600; margin-bottom: 16px; }
    .intro { font-size: 15px; line-height: 1.6; color: #4a5568; margin-bottom: 24px; }
    .claim-box { background: #fff8ee; border: 1px solid #ffe0b0; border-radius: 12px; padding: 20px; margin-bottom: 24px; }
    .claim-title { font-size: 16px; font-weight: 600; margin: 0 0 8px; }
    .claim-details { font-size: 14px; line-height: 1.55; color: #4a5568; white-space: pre-wrap; }
    .meta { font-size: 13px; color: #718096; margin-top: 12px; }
    .support { background: #f7fafc; border-radius: 12px; padding: 20px; margin-bottom: 8px; }
    .support h2 { margin: 0 0 10px; font-size: 16px; color: #1a202c; }
    .support p { margin: 6px 0; font-size: 14px; color: #4a5568; line-height: 1.5; }
    .support a { color: #d97706; text-decoration: none; }
    .footer { padding: 24px 30px; text-align: center; border-top: 1px solid #e2e8f0; background: #f7fafc; }
    .footer p { margin: 6px 0; font-size: 13px; color: #718096; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="${LOGO_URL}" alt="Pahincho Logo" />
      <h1>Claim received</h1>
    </div>
    <div class="content">
      <div class="greeting">Dear ${escapeHtml(firstName)},</div>
      <p class="intro">
        Thank you for contacting Pahincho. We've filed your claim and our team will follow up.
        When you contact us, please refer to the claim ID in the subject line of this email.
      </p>
      <div class="claim-box">
        <div class="claim-title">${escapeHtml(title)}</div>
        <div class="claim-details">${escapeHtml(details)}</div>
        <div class="meta">Current status: ${escapeHtml(statusLabel)}</div>
      </div>
      <div class="support">
        <h2>Need help?</h2>
        <p>
          Email us at
          <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a>
          or call
          <a href="tel:${SUPPORT_PHONE_TEL}">${SUPPORT_PHONE}</a>.
        </p>
      </div>
    </div>
    <div class="footer">
      <p style="font-weight: 600; color: #2d3748;">The Pahincho Team</p>
      <p><a href="https://pahincho.com" style="color: #718096; text-decoration: none;">www.pahincho.com</a></p>
      <p style="font-size: 12px; color: #a0aec0; margin-top: 16px;">© ${year} Pahincho. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;
}

function createClaimConfirmationText(data: ClaimConfirmationEmailData): string {
  const statusLabel = CLAIM_STATUS_LABELS[data.status];
  return `Dear ${data.firstName},

Thank you for contacting Pahincho. We've filed your claim and our team will follow up.
When you contact us, please refer to the claim ID in the subject line of this email.

Title: ${data.title}
Status: ${statusLabel}

Details:
${data.details}

Need help?
Email: ${SUPPORT_EMAIL}
Phone: ${SUPPORT_PHONE}

The Pahincho Team
www.pahincho.com`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Sends claim confirmation via Resend REST API (same approach as Pahincho Cloud Functions).
 * Lives only in pahincho-admin — does not import from or modify ~/source/Pahincho.
 */
export async function sendClaimConfirmationEmail(
  data: ClaimConfirmationEmailData
): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return { ok: false, error: "RESEND_API_KEY is not configured." };
  }

  const from = process.env.FROM_EMAIL || "Pahincho Team <noreply@pahincho.com>";
  const payload = {
    from,
    to: [data.email],
    reply_to: SUPPORT_EMAIL,
    subject: `Claim received — ${data.claimNumber}`,
    html: createClaimConfirmationHtml(data),
    text: createClaimConfirmationText(data),
  };

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.text();
      return { ok: false, error: `Resend API error: ${error}` };
    }

    const result = (await response.json()) as { id?: string };
    return { ok: true, providerId: result.id ?? "unknown" };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to send claim confirmation email.",
    };
  }
}
