const express = require('express');
const router = express.Router();
const supabase = require('../db/supabase');
const { requireAuth } = require('../middleware/auth');
const claude = require('../services/claude');
const firefly = require('../services/firefly');
const { generateUTM } = require('../services/utm');

router.use(requireAuth);

async function getProduct(productId, userId) {
  const { data } = await supabase
    .from('products')
    .select('*')
    .eq('id', productId)
    .eq('user_id', userId)
    .single();
  return data;
}

// POST /api/generate/reddit-reply
router.post('/reddit-reply', async (req, res) => {
  const { product_id, thread } = req.body;
  const product = await getProduct(product_id, req.userId);
  if (!product) return res.status(404).json({ error: 'Product not found' });

  try {
    const body = await claude.generateRedditReply(thread, product);
    const { data } = await supabase.from('content_queue').insert({
      product_id,
      platform: 'reddit',
      content_type: 'reply',
      body,
      link: thread.thread_url,
      status: 'pending',
      urgency: 'normal',
      predicted_eng: 3
    }).select().single();
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/generate/pinterest-pin
router.post('/pinterest-pin', async (req, res) => {
  const { product_id, meal } = req.body;
  const product = await getProduct(product_id, req.userId);
  if (!product) return res.status(404).json({ error: 'Product not found' });

  try {
    const [body, imageUrl] = await Promise.all([
      claude.generatePinterestPin(meal, product),
      firefly.generateFoodImage(meal.name)
    ]);

    const scheduled = new Date();
    scheduled.setHours(14, 0, 0, 0);
    if (scheduled < new Date()) scheduled.setDate(scheduled.getDate() + 1);

    const { data } = await supabase.from('content_queue').insert({
      product_id,
      platform: 'pinterest',
      content_type: 'pin',
      body,
      image_url: imageUrl,
      image_prompt: `${meal.name} overhead food photography`,
      status: 'pending',
      urgency: 'normal',
      predicted_eng: 3,
      scheduled_for: scheduled.toISOString()
    }).select().single();
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/generate/blog-post
router.post('/blog-post', async (req, res) => {
  const { product_id, keyword } = req.body;
  const product = await getProduct(product_id, req.userId);
  if (!product) return res.status(404).json({ error: 'Product not found' });

  try {
    const body = await claude.generateBlogPost(keyword, product);
    const { data } = await supabase.from('content_queue').insert({
      product_id,
      platform: 'blog',
      content_type: 'blog',
      body,
      status: 'pending',
      urgency: 'low',
      predicted_eng: 3
    }).select().single();
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/generate/email
router.post('/email', async (req, res) => {
  const { product_id, trigger, userData } = req.body;
  const product = await getProduct(product_id, req.userId);
  if (!product) return res.status(404).json({ error: 'Product not found' });

  try {
    const email = await claude.generateEmail(trigger, product, userData);
    const { data } = await supabase.from('email_sequences').insert({
      product_id,
      name: `${trigger} email`,
      trigger,
      subject: email.subject,
      body: email.body,
      delay_hours: 0
    }).select().single();
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/generate/batch
router.post('/batch', async (req, res) => {
  const { product_id } = req.body;
  const product = await getProduct(product_id, req.userId);
  if (!product) return res.status(404).json({ error: 'Product not found' });

  const { generateWeeklyContent } = require('../crons/generateContent');
  try {
    await generateWeeklyContent(product_id);
    res.json({ success: true, message: 'Batch content generation started' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
