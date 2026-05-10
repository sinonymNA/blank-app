const supabase = require('../db/supabase');
const { sendMorningDigestEmail } = require('../services/resend');
const { createClerkClient } = require('@clerk/clerk-sdk-node');

async function sendMorningDigest() {
  console.log('[cron] sendMorningDigest — starting');

  const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

  // Get all users who have pending content
  const { data: pendingItems } = await supabase
    .from('content_queue')
    .select('product_id, urgency, products(user_id)')
    .eq('status', 'pending');

  if (!pendingItems?.length) {
    console.log('[cron] sendMorningDigest — no pending items');
    return;
  }

  // Group by user
  const byUser = {};
  for (const item of pendingItems) {
    const userId = item.products?.user_id;
    if (!userId) continue;
    if (!byUser[userId]) byUser[userId] = { total: 0, urgent: 0, productIds: new Set() };
    byUser[userId].total++;
    if (item.urgency === 'urgent') byUser[userId].urgent++;
    byUser[userId].productIds.add(item.product_id);
  }

  const appUrl = process.env.APP_URL || 'https://ampere.app';

  for (const [userId, counts] of Object.entries(byUser)) {
    try {
      const user = await clerk.users.getUser(userId);
      const email = user.emailAddresses?.[0]?.emailAddress;
      if (!email) continue;

      const firstName = user.firstName || 'there';

      // Get top 3 pending items for preview
      const { data: topItems } = await supabase
        .from('content_queue')
        .select('platform, content_type, body')
        .in('product_id', Array.from(counts.productIds))
        .eq('status', 'pending')
        .order('urgency', { ascending: true })
        .limit(3);

      await sendMorningDigestEmail({
        to: email,
        name: firstName,
        pendingCount: counts.total,
        urgentCount: counts.urgent,
        topItems: topItems || [],
        queueUrl: `${appUrl}/queue`
      });

      console.log(`[cron] sendMorningDigest — sent to ${email}`);
    } catch (e) {
      console.error(`[cron] sendMorningDigest — error for user ${userId}:`, e.message);
    }
  }

  console.log('[cron] sendMorningDigest — done');
}

module.exports = { sendMorningDigest };
