const express = require('express');
const router = express.Router();
const supabase = require('../db/supabase');
const { requireAuth } = require('../middleware/auth');

router.use(requireAuth);

async function verifyProductOwnership(productId, userId) {
  const { data } = await supabase
    .from('products')
    .select('id')
    .eq('id', productId)
    .eq('user_id', userId)
    .single();
  return !!data;
}

// GET /api/analytics/:productId
router.get('/:productId', async (req, res) => {
  const { productId } = req.params;
  const { range = '30' } = req.query;

  if (!await verifyProductOwnership(productId, req.userId)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const since = new Date();
  since.setDate(since.getDate() - parseInt(range));

  const [perfData, queueData, patternData] = await Promise.all([
    supabase
      .from('content_performance')
      .select('*')
      .eq('product_id', productId)
      .gte('tracked_at', since.toISOString()),
    supabase
      .from('content_queue')
      .select('platform, content_type, status, created_at')
      .eq('product_id', productId)
      .eq('status', 'posted')
      .gte('created_at', since.toISOString()),
    supabase
      .from('content_patterns')
      .select('*')
      .eq('product_id', productId)
  ]);

  const perf = perfData.data || [];
  const totalClicks = perf.reduce((s, r) => s + r.clicks, 0);
  const totalSignups = perf.reduce((s, r) => s + r.signups, 0);
  const totalConversions = perf.reduce((s, r) => s + r.conversions, 0);
  const totalMrr = perf.reduce((s, r) => s + parseFloat(r.mrr_added || 0), 0);

  const byPlatform = {};
  perf.forEach(r => {
    if (!byPlatform[r.platform]) {
      byPlatform[r.platform] = { clicks: 0, signups: 0, conversions: 0, posts: 0 };
    }
    byPlatform[r.platform].clicks += r.clicks;
    byPlatform[r.platform].signups += r.signups;
    byPlatform[r.platform].conversions += r.conversions;
  });

  (queueData.data || []).forEach(q => {
    if (byPlatform[q.platform]) byPlatform[q.platform].posts++;
  });

  res.json({
    summary: {
      total_clicks: totalClicks,
      signups: totalSignups,
      conversions: totalConversions,
      mrr_added: totalMrr,
      posts_published: queueData.data?.length || 0
    },
    by_platform: byPlatform,
    patterns: patternData.data || []
  });
});

// GET /api/analytics/:productId/week
router.get('/:productId/week', async (req, res) => {
  const { productId } = req.params;

  if (!await verifyProductOwnership(productId, req.userId)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const { data: weekData } = await supabase
    .from('weekly_reports')
    .select('*')
    .eq('product_id', productId)
    .order('week_of', { ascending: false })
    .limit(2);

  res.json(weekData || []);
});

// GET /api/analytics/:productId/best
router.get('/:productId/best', async (req, res) => {
  const { productId } = req.params;

  if (!await verifyProductOwnership(productId, req.userId)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const { data } = await supabase
    .from('content_performance')
    .select('*, content_queue(platform, content_type, body)')
    .eq('product_id', productId)
    .order('signups', { ascending: false })
    .limit(10);

  res.json(data || []);
});

// POST /api/analytics/track
router.post('/track', async (req, res) => {
  const { content_id, product_id, platform, event_type, mrr } = req.body;
  if (!content_id || !event_type) return res.status(400).json({ error: 'Missing fields' });

  const updates = {};
  if (event_type === 'click') updates.clicks = 1;
  if (event_type === 'signup') updates.signups = 1;
  if (event_type === 'conversion') { updates.conversions = 1; updates.mrr_added = mrr || 0; }

  const { data: existing } = await supabase
    .from('content_performance')
    .select('*')
    .eq('content_id', content_id)
    .single();

  if (existing) {
    const merged = {
      clicks: (existing.clicks || 0) + (updates.clicks || 0),
      signups: (existing.signups || 0) + (updates.signups || 0),
      conversions: (existing.conversions || 0) + (updates.conversions || 0),
      mrr_added: parseFloat(existing.mrr_added || 0) + parseFloat(updates.mrr_added || 0)
    };
    await supabase.from('content_performance').update(merged).eq('id', existing.id);
  } else {
    await supabase.from('content_performance').insert({
      content_id,
      product_id,
      platform,
      ...updates
    });
  }

  res.json({ success: true });
});

module.exports = router;
