const supabase = require('../db/supabase');
const claude = require('../services/claude');
const firefly = require('../services/firefly');
const { optimizeContentMix } = require('../services/intelligence');

const MEAL_IDEAS = [
  { name: 'Honey Garlic Chicken Thighs', estimatedCost: 8, servings: 4, description: 'Tender chicken thighs glazed with honey garlic sauce' },
  { name: 'One-Pot Pasta Primavera', estimatedCost: 6, servings: 4, description: 'Creamy vegetable pasta made in a single pot' },
  { name: 'Sheet Pan Salmon and Veggies', estimatedCost: 12, servings: 2, description: 'Flaky salmon with roasted seasonal vegetables' },
  { name: 'Budget Turkey Meatballs', estimatedCost: 7, servings: 6, description: 'Lean turkey meatballs in simple marinara sauce' },
  { name: 'Black Bean Tacos', estimatedCost: 5, servings: 4, description: 'Spiced black bean tacos with fresh toppings' },
  { name: 'Creamy Tomato Soup', estimatedCost: 4, servings: 4, description: 'Rich homemade tomato soup with crusty bread' },
  { name: 'Stir-Fry Rice Bowl', estimatedCost: 6, servings: 3, description: 'Quick veggie stir-fry over steamed rice' },
  { name: 'Slow Cooker Pulled Pork', estimatedCost: 10, servings: 8, description: 'Fall-apart pulled pork perfect for meal prep' }
];

const BLOG_KEYWORDS = [
  'cheap meal prep ideas for the week',
  'how to cut grocery bill in half',
  'easy family dinners under $10',
  'meal planning for beginners',
  'budget cooking tips that actually work'
];

async function generateWeeklyContent(specificProductId = null) {
  console.log('[cron] generateWeeklyContent — starting');

  let query = supabase.from('products').select('*').eq('active', true);
  if (specificProductId) query = query.eq('id', specificProductId);

  const { data: products, error } = await query;

  if (error) {
    console.error('[cron] generateWeeklyContent — DB error:', error.message);
    return;
  }

  for (const product of products || []) {
    try {
      await generateForProduct(product);
    } catch (e) {
      console.error(`[cron] generateWeeklyContent — error for ${product.name}:`, e.message);
    }
  }

  console.log('[cron] generateWeeklyContent — done');
}

async function generateForProduct(product) {
  const mix = await optimizeContentMix(product.id);
  const now = new Date();
  const items = [];

  // Reddit posts (select random high-traffic subreddits if no monitors configured)
  const { data: monitors } = await supabase
    .from('reddit_monitors')
    .select('subreddit, keywords')
    .eq('product_id', product.id)
    .eq('active', true)
    .limit(5);

  for (let i = 0; i < Math.min(mix.reddit || 3, monitors?.length || 0); i++) {
    const monitor = monitors[i];
    try {
      const body = await claude.generateFacebookPost(product, i % 2 === 0 ? 'helpful' : 'mention');
      const scheduled = new Date(now);
      scheduled.setDate(scheduled.getDate() + Math.floor(i * 1.5));
      scheduled.setHours(9, 0, 0, 0);

      items.push({
        product_id: product.id,
        platform: 'reddit',
        content_type: 'post',
        body,
        status: 'pending',
        urgency: 'low',
        predicted_eng: 3,
        scheduled_for: scheduled.toISOString()
      });
    } catch (e) {
      console.error(`Reddit content gen error: ${e.message}`);
    }
  }

  // Pinterest pins
  const mealsToUse = MEAL_IDEAS.sort(() => Math.random() - 0.5).slice(0, mix.pinterest || 5);
  for (let i = 0; i < mealsToUse.length; i++) {
    const meal = mealsToUse[i];
    try {
      const [body, imageUrl] = await Promise.all([
        claude.generatePinterestPin(meal, product),
        process.env.FIREFLY_ACCESS_TOKEN ? firefly.generateFoodImage(meal.name) : null
      ]);

      const scheduled = new Date(now);
      scheduled.setDate(scheduled.getDate() + Math.floor(i / 2));
      scheduled.setHours(i % 2 === 0 ? 9 : 14, 0, 0, 0);

      items.push({
        product_id: product.id,
        platform: 'pinterest',
        content_type: 'pin',
        body,
        image_url: imageUrl,
        image_prompt: `${meal.name} overhead food photography`,
        status: 'pending',
        urgency: 'low',
        predicted_eng: 3,
        scheduled_for: scheduled.toISOString()
      });
    } catch (e) {
      console.error(`Pinterest content gen error: ${e.message}`);
    }
  }

  // Blog post
  if (mix.blog > 0) {
    const keyword = BLOG_KEYWORDS[Math.floor(Math.random() * BLOG_KEYWORDS.length)];
    try {
      const body = await claude.generateBlogPost(keyword, product);
      items.push({
        product_id: product.id,
        platform: 'blog',
        content_type: 'blog',
        body,
        status: 'pending',
        urgency: 'low',
        predicted_eng: 4
      });
    } catch (e) {
      console.error(`Blog content gen error: ${e.message}`);
    }
  }

  // Facebook posts
  for (let i = 0; i < (mix.facebook || 2); i++) {
    try {
      const body = await claude.generateFacebookPost(product, i === 0 ? 'helpful' : 'mention');
      const scheduled = new Date(now);
      scheduled.setDate(scheduled.getDate() + i * 3);
      scheduled.setHours(10, 0, 0, 0);

      items.push({
        product_id: product.id,
        platform: 'facebook',
        content_type: 'post',
        body,
        status: 'pending',
        urgency: 'low',
        predicted_eng: 2,
        scheduled_for: scheduled.toISOString()
      });
    } catch (e) {
      console.error(`Facebook content gen error: ${e.message}`);
    }
  }

  if (items.length > 0) {
    const { error } = await supabase.from('content_queue').insert(items);
    if (error) console.error(`Batch insert error for ${product.name}: ${error.message}`);
    else console.log(`Generated ${items.length} items for ${product.name}`);
  }
}

module.exports = { generateWeeklyContent };
