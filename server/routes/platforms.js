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

// GET /api/platforms/:productId
router.get('/:productId', async (req, res) => {
  if (!await verifyProductOwnership(req.params.productId, req.userId)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const { data, error } = await supabase
    .from('platform_connections')
    .select('id, product_id, platform, posting_freq, optimal_times, active, connected_at')
    .eq('product_id', req.params.productId);

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// POST /api/platforms/connect
router.post('/connect', async (req, res) => {
  const { product_id, platform, credentials, posting_freq, optimal_times } = req.body;

  if (!await verifyProductOwnership(product_id, req.userId)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const { data: existing } = await supabase
    .from('platform_connections')
    .select('id')
    .eq('product_id', product_id)
    .eq('platform', platform)
    .single();

  if (existing) {
    const { data, error } = await supabase
      .from('platform_connections')
      .update({ credentials, posting_freq, optimal_times, active: true })
      .eq('id', existing.id)
      .select('id, product_id, platform, posting_freq, optimal_times, active, connected_at')
      .single();
    if (error) return res.status(500).json({ error: error.message });
    return res.json(data);
  }

  const { data, error } = await supabase
    .from('platform_connections')
    .insert({ product_id, platform, credentials, posting_freq, optimal_times })
    .select('id, product_id, platform, posting_freq, optimal_times, active, connected_at')
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

// DELETE /api/platforms/:id
router.delete('/:id', async (req, res) => {
  const { data: conn } = await supabase
    .from('platform_connections')
    .select('product_id')
    .eq('id', req.params.id)
    .single();

  if (!conn) return res.status(404).json({ error: 'Not found' });
  if (!await verifyProductOwnership(conn.product_id, req.userId)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const { error } = await supabase
    .from('platform_connections')
    .delete()
    .eq('id', req.params.id);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// POST /api/platforms/test/:id
router.post('/test/:id', async (req, res) => {
  const { data: conn } = await supabase
    .from('platform_connections')
    .select('*')
    .eq('id', req.params.id)
    .single();

  if (!conn) return res.status(404).json({ error: 'Not found' });

  // Platform-specific connection tests would go here
  res.json({ success: true, platform: conn.platform, status: 'connected' });
});

// Reddit monitors
router.get('/reddit/monitors/:productId', async (req, res) => {
  if (!await verifyProductOwnership(req.params.productId, req.userId)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const { data, error } = await supabase
    .from('reddit_monitors')
    .select('*')
    .eq('product_id', req.params.productId);

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.post('/reddit/monitors', async (req, res) => {
  const { product_id, subreddit, keywords } = req.body;

  if (!await verifyProductOwnership(product_id, req.userId)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const { data, error } = await supabase
    .from('reddit_monitors')
    .insert({ product_id, subreddit: subreddit.replace(/^r\//, ''), keywords })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

router.delete('/reddit/monitors/:id', async (req, res) => {
  const { data: monitor } = await supabase
    .from('reddit_monitors')
    .select('product_id')
    .eq('id', req.params.id)
    .single();

  if (!monitor) return res.status(404).json({ error: 'Not found' });
  if (!await verifyProductOwnership(monitor.product_id, req.userId)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const { error } = await supabase
    .from('reddit_monitors')
    .delete()
    .eq('id', req.params.id);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

router.get('/reddit/threads', async (req, res) => {
  const { data: products } = await supabase
    .from('products')
    .select('id')
    .eq('user_id', req.userId);

  if (!products?.length) return res.json([]);

  const productIds = products.map(p => p.id);
  const { data, error } = await supabase
    .from('reddit_threads')
    .select('*')
    .in('product_id', productIds)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

module.exports = router;
