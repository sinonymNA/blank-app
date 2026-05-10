const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.FROM_EMAIL || 'hello@ampere.app';

async function sendEmail({ to, subject, html, text }) {
  const { data, error } = await resend.emails.send({
    from: `Ampere <${FROM}>`,
    to,
    subject,
    html,
    text
  });

  if (error) throw new Error(`Resend error: ${error.message}`);
  return data;
}

async function sendMorningDigestEmail({ to, name, pendingCount, urgentCount, topItems, queueUrl }) {
  const urgentNote = urgentCount > 0
    ? `<p style="color:#F59E0B;font-weight:600;">⚠️ ${urgentCount} urgent items need attention</p>`
    : '';

  const itemsHtml = topItems.map(item => `
    <div style="border:1px solid #E4E4E7;border-radius:8px;padding:12px;margin-bottom:8px;">
      <div style="font-size:12px;color:#71717A;text-transform:uppercase;font-weight:600;">${item.platform} · ${item.content_type}</div>
      <div style="margin-top:4px;font-size:14px;color:#18181B;">${item.body.substring(0, 120)}...</div>
    </div>
  `).join('');

  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><style>body{font-family:Inter,sans-serif;background:#FAFAFA;margin:0;padding:20px;}</style></head>
    <body>
      <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;border:1px solid #E4E4E7;padding:32px;">
        <div style="font-size:24px;font-weight:700;color:#18181B;margin-bottom:4px;">Good morning, ${name || 'there'}</div>
        <div style="font-size:14px;color:#71717A;margin-bottom:24px;">${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</div>

        <div style="background:#EEF2FF;border-radius:8px;padding:16px;margin-bottom:24px;">
          <div style="font-size:32px;font-weight:700;color:#6366F1;">${pendingCount}</div>
          <div style="font-size:14px;color:#71717A;">posts ready for approval</div>
        </div>

        ${urgentNote}

        <div style="font-size:12px;font-weight:600;text-transform:uppercase;color:#71717A;letter-spacing:0.05em;margin-bottom:12px;">Preview</div>
        ${itemsHtml}

        <a href="${queueUrl}" style="display:block;background:#6366F1;color:#fff;text-align:center;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:24px;">Review Queue →</a>

        <div style="margin-top:24px;font-size:12px;color:#A1A1AA;text-align:center;">
          Ampere · <a href="${queueUrl}/settings" style="color:#A1A1AA;">Manage preferences</a>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({ to, subject: `☀️ Ampere: ${pendingCount} posts ready for approval`, html });
}

async function sendWeeklyInsightsEmail({ to, name, report, insights, productName }) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><style>body{font-family:Inter,sans-serif;background:#FAFAFA;margin:0;padding:20px;}</style></head>
    <body>
      <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;border:1px solid #E4E4E7;padding:32px;">
        <div style="font-size:24px;font-weight:700;color:#18181B;margin-bottom:4px;">${productName} — Weekly Report</div>
        <div style="font-size:14px;color:#71717A;margin-bottom:24px;">Week of ${new Date(report.week_of).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:24px;">
          ${[
            { label: 'Posts Published', value: report.posts_published },
            { label: 'Total Clicks', value: report.total_clicks },
            { label: 'New Signups', value: report.signups },
            { label: 'MRR Added', value: `$${report.mrr_added}` }
          ].map(m => `
            <div style="background:#FAFAFA;border:1px solid #E4E4E7;border-radius:8px;padding:16px;">
              <div style="font-size:24px;font-weight:700;color:#18181B;">${m.value}</div>
              <div style="font-size:12px;color:#71717A;">${m.label}</div>
            </div>
          `).join('')}
        </div>

        <div style="font-size:12px;font-weight:600;text-transform:uppercase;color:#71717A;letter-spacing:0.05em;margin-bottom:12px;">Intelligence Report</div>
        <div style="background:#F4F4F5;border-radius:8px;padding:16px;font-size:14px;line-height:1.6;color:#18181B;white-space:pre-line;">${insights}</div>

        <a href="${process.env.APP_URL || 'https://ampere.app'}/analytics" style="display:block;background:#6366F1;color:#fff;text-align:center;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:24px;">View Full Analytics →</a>
      </div>
    </body>
    </html>
  `;

  return sendEmail({ to, subject: `${productName} — Weekly Performance Report`, html });
}

module.exports = { sendEmail, sendMorningDigestEmail, sendWeeklyInsightsEmail };
