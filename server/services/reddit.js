const Snoowrap = require('snoowrap');
const { generateRedditReply } = require('./claude');
const supabase = require('../db/supabase');

let reddit;

function getRedditClient() {
  if (!reddit) {
    reddit = new Snoowrap({
      userAgent: 'Ampere Marketing Bot v1.0',
      clientId: process.env.REDDIT_CLIENT_ID,
      clientSecret: process.env.REDDIT_CLIENT_SECRET,
      username: process.env.REDDIT_USERNAME,
      password: process.env.REDDIT_PASSWORD
    });
    reddit.config({ requestDelay: 1000, continueAfterRatelimitError: true });
  }
  return reddit;
}

async function monitorSubreddits(productId) {
  const { data: monitors } = await supabase
    .from('reddit_monitors')
    .select('*')
    .eq('product_id', productId)
    .eq('active', true);

  const { data: product } = await supabase
    .from('products')
    .select('*')
    .eq('id', productId)
    .single();

  if (!monitors?.length || !product) return;

  for (const monitor of monitors) {
    await checkSubreddit(monitor, product);
  }
}

async function checkSubreddit(monitor, product) {
  try {
    const r = getRedditClient();
    const subreddit = await r.getSubreddit(monitor.subreddit);
    const newPosts = await subreddit.getNew({ limit: 25 });

    for (const post of newPosts) {
      const { data: existing } = await supabase
        .from('reddit_threads')
        .select('id')
        .eq('thread_id', post.id)
        .single();

      if (existing) continue;

      const fullText = `${post.title} ${post.selftext}`.toLowerCase();
      const matched = monitor.keywords.some(kw => fullText.includes(kw.toLowerCase()));
      if (!matched) continue;

      const ageHours = (Date.now() / 1000 - post.created_utc) / 3600;
      if (ageHours > 48) continue;

      const draft = await generateRedditReply({
        subreddit: monitor.subreddit,
        thread_title: post.title,
        thread_body: post.selftext?.substring(0, 500)
      }, product);

      const urgency = ageHours < 2 ? 'urgent' : ageHours < 12 ? 'normal' : 'low';

      await supabase.from('reddit_threads').insert({
        monitor_id: monitor.id,
        product_id: product.id,
        thread_id: post.id,
        thread_title: post.title,
        thread_body: post.selftext?.substring(0, 1000),
        thread_url: `https://reddit.com${post.permalink}`,
        subreddit: monitor.subreddit,
        thread_age_hrs: ageHours,
        draft_reply: draft,
        status: 'pending',
        urgency
      });

      await supabase.from('content_queue').insert({
        product_id: product.id,
        platform: 'reddit',
        content_type: 'reply',
        body: draft,
        link: `https://reddit.com${post.permalink}`,
        status: 'pending',
        urgency,
        predicted_eng: urgency === 'urgent' ? 5 : 3
      });
    }

    await supabase
      .from('reddit_monitors')
      .update({ last_checked: new Date().toISOString() })
      .eq('id', monitor.id);

  } catch (error) {
    console.error(`Reddit monitor error for r/${monitor.subreddit}:`, error.message);
  }
}

async function postReply(threadUrl, replyText) {
  try {
    const match = threadUrl.match(/comments\/([a-z0-9]+)\//i);
    if (!match) throw new Error('Invalid thread URL');

    const r = getRedditClient();
    const submission = await r.getSubmission(match[1]);
    await submission.reply(replyText);
    return true;
  } catch (error) {
    console.error('Reddit post error:', error.message);
    return false;
  }
}

module.exports = { monitorSubreddits, checkSubreddit, postReply };
