const express = require('express');
const router = express.Router();
const supabase = require('../db/supabase');

// POST /api/webhooks/buffer
router.post('/buffer', async (req, res) => {
  const { id: bufferId, status, service_update_id } = req.body;
  if (!bufferId) return res.status(400).json({ error: 'Missing buffer post ID' });

  const newStatus = status === 'sent_buffer' ? 'posted' : status === 'failed_buffer' ? 'failed' : null;

  if (newStatus) {
    await supabase
      .from('content_queue')
      .update({
        status: newStatus,
        posted_at: newStatus === 'posted' ? new Date().toISOString() : null
      })
      .eq('buffer_post_id', bufferId);
  }

  res.json({ received: true });
});

// POST /api/webhooks/plausible
router.post('/plausible', async (req, res) => {
  const { name: eventName, props } = req.body;

  if (!props?.utm_content) return res.json({ received: true });

  const contentId = props.utm_content;

  const { data: item } = await supabase
    .from('content_queue')
    .select('product_id, platform')
    .eq('id', contentId)
    .single();

  if (!item) return res.json({ received: true });

  const updates = {};
  if (eventName === 'pageview') updates.clicks = 1;
  if (eventName === 'signup') updates.signups = 1;
  if (eventName === 'upgrade') { updates.conversions = 1; updates.mrr_added = props.mrr || 0; }

  if (Object.keys(updates).length > 0) {
    const { data: existing } = await supabase
      .from('content_performance')
      .select('*')
      .eq('content_id', contentId)
      .single();

    if (existing) {
      await supabase.from('content_performance').update({
        clicks: existing.clicks + (updates.clicks || 0),
        signups: existing.signups + (updates.signups || 0),
        conversions: existing.conversions + (updates.conversions || 0),
        mrr_added: parseFloat(existing.mrr_added) + parseFloat(updates.mrr_added || 0)
      }).eq('id', existing.id);
    } else {
      await supabase.from('content_performance').insert({
        content_id: contentId,
        product_id: item.product_id,
        platform: item.platform,
        ...updates
      });
    }
  }

  res.json({ received: true });
});

module.exports = router;
