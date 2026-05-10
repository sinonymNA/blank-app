const express = require('express');
const router = express.Router();
const supabase = require('../db/supabase');
const { requireAuth } = require('../middleware/auth');

router.use(requireAuth);

// GET /api/products
router.get('/', async (req, res) => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('user_id', req.userId)
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// POST /api/products
router.post('/', async (req, res) => {
  const { name, url, pitch, audience, pain_point, differentiator, conversion_goal, tone } = req.body;

  if (!name || !url || !pitch || !audience || !pain_point || !differentiator) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const { data, error } = await supabase
    .from('products')
    .insert({ user_id: req.userId, name, url, pitch, audience, pain_point, differentiator, conversion_goal, tone })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

// GET /api/products/:id
router.get('/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('products')
    .select('*, platform_connections(*), reddit_monitors(*)')
    .eq('id', req.params.id)
    .eq('user_id', req.userId)
    .single();

  if (error) return res.status(404).json({ error: 'Product not found' });
  res.json(data);
});

// PATCH /api/products/:id
router.patch('/:id', async (req, res) => {
  const allowed = ['name', 'url', 'pitch', 'audience', 'pain_point', 'differentiator', 'conversion_goal', 'tone', 'active'];
  const updates = {};
  allowed.forEach(field => { if (req.body[field] !== undefined) updates[field] = req.body[field]; });

  const { data, error } = await supabase
    .from('products')
    .update(updates)
    .eq('id', req.params.id)
    .eq('user_id', req.userId)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// DELETE /api/products/:id
router.delete('/:id', async (req, res) => {
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', req.params.id)
    .eq('user_id', req.userId);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

module.exports = router;
