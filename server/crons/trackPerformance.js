const supabase = require('../db/supabase');
const { analyzePerformance } = require('../services/intelligence');

async function trackAllPerformance() {
  console.log('[cron] trackAllPerformance — starting');

  const { data: products } = await supabase
    .from('products')
    .select('id')
    .eq('active', true);

  for (const product of products || []) {
    try {
      await analyzePerformance(product.id);
    } catch (e) {
      console.error(`[cron] performance tracking error for ${product.id}:`, e.message);
    }
  }

  console.log('[cron] trackAllPerformance — done');
}

module.exports = { trackAllPerformance };
