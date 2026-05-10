const express = require('express');
const router = express.Router();
const supabase = require('../db/supabase');
const { requireAuth } = require('../middleware/auth');
const { regenerateContent } = require('../services/claude');
const { generateUTM } = require('../services/utm');
const bufferService = require('../services/buffer');

router.use(requireAuth);

async function getUserProductIds(userId) {
  const { data } = await supabase
    .from('products')
    .select('id')
    .eq('user_id', userId);
  return (data || []).map(p => p.id);
}

// GET /api/queue
router.get('/', async (req, res) => {
  const productIds = await getUserProductIds(req.userId);
  if (!productIds.length) return res.json([]);

  const { platform, urgency } = req.query;
  let query = supabase
    .from('content_queue')
    .select('*, products(name, url)')
    .in('product_id', productIds)
    .eq('status', 'pending')
    .order('urgency', { ascending: true })
    .order('created_at', { ascending: true });

  if (platform) query = query.eq('platform', platform);
  if (urgency) query = query.eq('urgency', urgency);

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// GET /api/queue/urgent
router.get('/urgent', async (req, res) => {
  const productIds = await getUserProductIds(req.userId);
  if (!productIds.length) return res.json([]);

  const { data, error } = await supabase
    .from('content_queue')
    .select('*, products(name, url)')
    .in('product_id', productIds)
    .eq('status', 'pending')
    .eq('urgency', 'urgent')
    .order('created_at', { ascending: true });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// GET /api/queue/count
router.get('/count', async (req, res) => {
  const productIds = await getUserProductIds(req.userId);
  if (!productIds.length) return res.json({});

  const { data, error } = await supabase
    .from('content_queue')
    .select('product_id, urgency')
    .in('product_id', productIds)
    .eq('status', 'pending');

  if (error) return res.status(500).json({ error: error.message });

  const counts = {};
  data.forEach(item => {
    if (!counts[item.product_id]) counts[item.product_id] = { total: 0, urgent: 0 };
    counts[item.product_id].total++;
    if (item.urgency === 'urgent') counts[item.product_id].urgent++;
  });

  res.json(counts);
});

// POST /api/queue/approve/:id
router.post('/approve/:id', async (req, res) => {
  const { data: item, error: fetchErr } = await supabase
    .from('content_queue')
    .select('*, products(*)')
    .eq('id', req.params.id)
    .single();

  if (fetchErr || !item) return res.status(404).json({ error: 'Item not found' });

  const utmLink = item.link
    ? generateUTM(item.products.url, item.platform, item.content_type, item.id)
    : null;

  let bufferId = null;
  if (item.scheduled_for) {
    try {
      bufferId = await bufferService.schedulePost({
        text: item.body,
        media: item.image_url ? [item.image_url] : [],
        scheduledAt: item.scheduled_for,
        platform: item.platform
      });
    } catch (e) {
      console.error('Buffer schedule failed:', e.message);
    }
  }

  const { data, error } = await supabase
    .from('content_queue')
    .update({
      status: 'approved',
      approved_at: new Date().toISOString(),
      utm_params: utmLink ? { url: utmLink } : null,
      buffer_post_id: bufferId
    })
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// POST /api/queue/skip/:id
router.post('/skip/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('content_queue')
    .update({ status: 'skipped' })
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// POST /api/queue/edit/:id
router.post('/edit/:id', async (req, res) => {
  const { body } = req.body;
  if (!body) return res.status(400).json({ error: 'Body is required' });

  const { data, error } = await supabase
    .from('content_queue')
    .update({ body, status: 'approved', approved_at: new Date().toISOString() })
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// POST /api/queue/regenerate/:id
router.post('/regenerate/:id', async (req, res) => {
  const { feedback } = req.body;

  const { data: item, error: fetchErr } = await supabase
    .from('content_queue')
    .select('*, products(*)')
    .eq('id', req.params.id)
    .single();

  if (fetchErr || !item) return res.status(404).json({ error: 'Item not found' });

  try {
    const newBody = await regenerateContent(item, feedback, item.products);
    const { data, error } = await supabase
      .from('content_queue')
      .update({ body: newBody })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: 'Regeneration failed: ' + e.message });
  }
});

// POST /api/queue/approve-all
router.post('/approve-all', async (req, res) => {
  const productIds = await getUserProductIds(req.userId);
  if (!productIds.length) return res.json({ approved: 0 });

  const { data, error } = await supabase
    .from('content_queue')
    .update({ status: 'approved', approved_at: new Date().toISOString() })
    .in('product_id', productIds)
    .eq('status', 'pending')
    .neq('urgency', 'urgent')
    .select();

  if (error) return res.status(500).json({ error: error.message });
  res.json({ approved: data.length });
});

module.exports = router;
