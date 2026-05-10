const supabase = require('../db/supabase');
const { sendMorningDigestEmail } = require('../services/resend');

async function sendMorningDigest() {
  console.log('[cron] sendMorningDigest — starting');

  if (!process.env.FROM_EMAIL) {
    console.log('[cron] sendMorningDigest — FROM_EMAIL not configured, skipping');
    return;
  }

  const { data: pendingItems } = await supabase
    .from('content_queue')
    .select('product_id, urgency')
    .eq('status', 'pending');

  if (!pendingItems?.length) {
    console.log('[cron] sendMorningDigest — no pending items');
    return;
  }

  try {
    const total = pendingItems.length;
    const urgent = pendingItems.filter(i => i.urgency === 'urgent').length;

    const { data: topItems } = await supabase
      .from('content_queue')
      .select('platform, content_type, body')
      .eq('status', 'pending')
      .order('urgency', { ascending: true })
      .limit(3);

    const appUrl = process.env.APP_URL || 'https://ampere.app';

    await sendMorningDigestEmail({
      to: process.env.FROM_EMAIL,
      name: 'there',
      pendingCount: total,
      urgentCount: urgent,
      topItems: topItems || [],
      queueUrl: `${appUrl}/queue`
    });

    console.log(`[cron] sendMorningDigest — sent to ${process.env.FROM_EMAIL}`);
  } catch (e) {
    console.error('[cron] sendMorningDigest — error:', e.message);
  }

  console.log('[cron] sendMorningDigest — done');
}

module.exports = { sendMorningDigest };
