const supabase = require('../db/supabase');
const { generateWeeklyInsight } = require('./claude');

async function analyzePerformance(productId) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [perfData, queueData] = await Promise.all([
    supabase
      .from('content_performance')
      .select('*')
      .eq('product_id', productId)
      .gte('tracked_at', thirtyDaysAgo.toISOString()),
    supabase
      .from('content_queue')
      .select('platform, content_type, body, status, created_at')
      .eq('product_id', productId)
      .eq('status', 'posted')
      .gte('created_at', thirtyDaysAgo.toISOString())
  ]);

  const perf = perfData.data || [];
  const queue = queueData.data || [];

  const byPlatform = {};
  perf.forEach(r => {
    if (!byPlatform[r.platform]) {
      byPlatform[r.platform] = { clicks: 0, signups: 0, conversions: 0, count: 0 };
    }
    byPlatform[r.platform].clicks += r.clicks;
    byPlatform[r.platform].signups += r.signups;
    byPlatform[r.platform].conversions += r.conversions;
    byPlatform[r.platform].count++;
  });

  const platformStats = Object.entries(byPlatform).map(([platform, stats]) => ({
    platform,
    avg_clicks: stats.count ? stats.clicks / stats.count : 0,
    avg_signups: stats.count ? stats.signups / stats.count : 0,
    conversion_rate: stats.clicks ? (stats.signups / stats.clicks) * 100 : 0,
    total_posts: queue.filter(q => q.platform === platform).length
  }));

  // Update content_patterns
  for (const stat of platformStats) {
    const { data: existing } = await supabase
      .from('content_patterns')
      .select('id')
      .eq('product_id', productId)
      .eq('platform', stat.platform)
      .eq('angle', 'overall')
      .single();

    if (existing) {
      await supabase.from('content_patterns').update({
        avg_clicks: stat.avg_clicks,
        avg_signups: stat.avg_signups,
        sample_size: stat.total_posts,
        updated_at: new Date().toISOString()
      }).eq('id', existing.id);
    } else {
      await supabase.from('content_patterns').insert({
        product_id: productId,
        platform: stat.platform,
        angle: 'overall',
        avg_clicks: stat.avg_clicks,
        avg_signups: stat.avg_signups,
        sample_size: stat.total_posts
      });
    }
  }

  return { by_platform: platformStats, total_posts: queue.length };
}

async function optimizeContentMix(productId) {
  const { data: patterns } = await supabase
    .from('content_patterns')
    .select('*')
    .eq('product_id', productId)
    .order('avg_signups', { ascending: false });

  if (!patterns?.length) return { reddit: 5, pinterest: 10, blog: 1, facebook: 3 };

  const ranked = patterns.sort((a, b) => b.avg_signups - a.avg_signups);
  const top = ranked[0];

  // Shift 20% more budget to top performer
  const base = { reddit: 5, pinterest: 10, blog: 1, facebook: 3 };
  if (top) {
    const boost = Math.floor(base[top.platform] * 0.2) || 1;
    base[top.platform] = (base[top.platform] || 0) + boost;
  }

  return base;
}

async function generateInsightReport(productId, weekData) {
  const { data: product } = await supabase
    .from('products')
    .select('*')
    .eq('id', productId)
    .single();

  if (!product) throw new Error('Product not found');

  return generateWeeklyInsight(product, weekData);
}

module.exports = { analyzePerformance, optimizeContentMix, generateInsightReport };
