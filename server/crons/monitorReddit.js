const supabase = require('../db/supabase');
const { monitorSubreddits } = require('../services/reddit');

async function monitorAllReddit() {
  console.log('[cron] monitorAllReddit — starting');

  const { data: products, error } = await supabase
    .from('products')
    .select('id')
    .eq('active', true);

  if (error) {
    console.error('[cron] monitorAllReddit — DB error:', error.message);
    return;
  }

  for (const product of products || []) {
    try {
      await monitorSubreddits(product.id);
    } catch (e) {
      console.error(`[cron] monitorAllReddit — error for product ${product.id}:`, e.message);
    }
  }

  console.log(`[cron] monitorAllReddit — done (${products?.length || 0} products)`);
}

module.exports = { monitorAllReddit };
