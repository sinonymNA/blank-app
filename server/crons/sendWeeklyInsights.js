const supabase = require('../db/supabase');
const { sendWeeklyInsightsEmail } = require('../services/resend');
const { generateInsightReport } = require('../services/intelligence');
const { createClerkClient } = require('@clerk/clerk-sdk-node');

async function sendWeeklyInsights() {
  console.log('[cron] sendWeeklyInsights — starting');

  const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

  const { data: products } = await supabase
    .from('products')
    .select('*, weekly_reports(*, content_queue(platform, body))')
    .eq('active', true);

  if (!products?.length) return;

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  for (const product of products) {
    try {
      // Compile week data
      const { data: perf } = await supabase
        .from('content_performance')
        .select('*')
        .eq('product_id', product.id)
        .gte('tracked_at', weekAgo.toISOString());

      const { data: postedItems } = await supabase
        .from('content_queue')
        .select('id, platform, body, content_performance(*)')
        .eq('product_id', product.id)
        .eq('status', 'posted')
        .gte('posted_at', weekAgo.toISOString());

      const perfArr = perf || [];
      const totalClicks = perfArr.reduce((s, r) => s + r.clicks, 0);
      const totalSignups = perfArr.reduce((s, r) => s + r.signups, 0);
      const totalConversions = perfArr.reduce((s, r) => s + r.conversions, 0);
      const totalMrr = perfArr.reduce((s, r) => s + parseFloat(r.mrr_added || 0), 0);

      const byPlatform = {};
      perfArr.forEach(r => {
        if (!byPlatform[r.platform]) byPlatform[r.platform] = { clicks: 0, signups: 0 };
        byPlatform[r.platform].clicks += r.clicks;
        byPlatform[r.platform].signups += r.signups;
      });

      const sortedItems = (postedItems || []).sort((a, b) => {
        const aSignups = a.content_performance?.reduce((s, p) => s + p.signups, 0) || 0;
        const bSignups = b.content_performance?.reduce((s, p) => s + p.signups, 0) || 0;
        return bSignups - aSignups;
      });

      const weekData = {
        posts_published: postedItems?.length || 0,
        total_clicks: totalClicks,
        signups: totalSignups,
        conversions: totalConversions,
        mrr_added: totalMrr.toFixed(2),
        best_content: sortedItems[0]?.body?.substring(0, 100) || 'N/A',
        worst_content: sortedItems[sortedItems.length - 1]?.body?.substring(0, 100) || 'N/A',
        platforms: byPlatform
      };

      // Save weekly report
      const weekOf = new Date();
      weekOf.setDate(weekOf.getDate() - weekOf.getDay());

      const { data: report } = await supabase
        .from('weekly_reports')
        .insert({
          product_id: product.id,
          week_of: weekOf.toISOString().split('T')[0],
          ...weekData,
          best_content_id: sortedItems[0]?.id || null
        })
        .select()
        .single();

      const insights = await generateInsightReport(product.id, weekData);

      if (report) {
        await supabase.from('weekly_reports')
          .update({ recommendations: insights })
          .eq('id', report.id);
      }

      // Get user email from Clerk
      const user = await clerk.users.getUser(product.user_id);
      const email = user.emailAddresses?.[0]?.emailAddress;
      if (!email) continue;

      await sendWeeklyInsightsEmail({
        to: email,
        name: user.firstName,
        report: weekData,
        insights,
        productName: product.name
      });

      console.log(`[cron] sendWeeklyInsights — sent for ${product.name} to ${email}`);
    } catch (e) {
      console.error(`[cron] sendWeeklyInsights — error for ${product.name}:`, e.message);
    }
  }

  console.log('[cron] sendWeeklyInsights — done');
}

module.exports = { sendWeeklyInsights };
