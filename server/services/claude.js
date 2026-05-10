const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

async function generateRedditReply(thread, product) {
  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 400,
    messages: [{
      role: 'user',
      content: `You are a helpful person who genuinely wants to solve people's problems.

Someone posted in ${thread.subreddit}:
Title: "${thread.thread_title}"
Body: "${thread.thread_body || '(no body text)'}"

Product context:
Name: ${product.name}
URL: ${product.url}
What it does: ${product.pitch}
Key differentiator: ${product.differentiator}
Target audience: ${product.audience}

Write a Reddit reply that:
1. Opens with 2-3 sentences of GENUINE helpful advice that does NOT mention the product
2. Transitions naturally to mentioning the product as one possible solution
3. Never sounds promotional or like an ad
4. Uses casual Reddit tone — lowercase where natural, no exclamation marks
5. Is 100-150 words maximum
6. Ends with the URL naturally embedded in context

The product mention should feel like an afterthought, not the point.
If someone read this they should think "helpful person" not "marketer."

Return only the reply text. No explanation.`
    }]
  });

  return response.content[0].text;
}

async function generatePinterestPin(meal, product) {
  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 400,
    messages: [{
      role: 'user',
      content: `Write a Pinterest pin description for a recipe.

Meal: ${meal.name}
Estimated cost: ~$${meal.estimatedCost} for ${meal.servings} people
Description: ${meal.description}

Requirements:
- 150-200 words
- Warm, helpful food blogger voice
- Include these keywords naturally: meal planning, easy dinner ideas,
  budget meals, family dinner, weekly meal prep, cheap meals for family
- Include 2-3 genuine useful cooking tips specific to this dish
- Final sentence: natural soft mention of ${product.name} at ${product.url}
- No hashtags in body text
- No exclamation marks
- Sounds like a real food blogger, not an ad

Return only the description text.`
    }]
  });

  return response.content[0].text;
}

async function generateBlogPost(keyword, product) {
  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2000,
    messages: [{
      role: 'user',
      content: `Write a 1200 word SEO blog post.

Target keyword: "${keyword}"
Product to mention: ${product.name} (${product.url})
Product pitch: ${product.pitch}

Structure:
  H1: Compelling title naturally containing the keyword
  Intro paragraph: Paint the problem vividly (2 paragraphs)
  3-4 H2 sections: Genuinely helpful content on the topic
  Conclusion: ONE paragraph mentioning ${product.name} as a solution

Rules:
- The post should be genuinely useful even if reader never uses the product
- Keyword appears 4-5 times naturally, never forced
- First person voice where it feels natural
- No fluff — every sentence earns its place
- Product mention is ONE paragraph at the very end
- Tone: knowledgeable helpful friend, not content farm
- Include specific actionable tips, not vague advice

Return the full blog post in markdown format.`
    }]
  });

  return response.content[0].text;
}

async function generateEmail(trigger, product, userData = {}) {
  const triggers = {
    welcome: {
      instruction: `Write a warm welcome email. Tone: excited friend.
        Cover: what they just signed up for, how to get started,
        what to expect this week. 200 words max.
        End with: one clear CTA button text to get started.`
    },
    day3: {
      instruction: `Write a check-in email from the founder.
        Feel: genuine, personal, not automated.
        Cover: ask how it's going, share one power tip,
        remind them free trial ends in 4 days.
        150 words max. Conversational. No marketing speak.`
    },
    day6: {
      instruction: `Write a conversion email. Honest, not pushy.
        Cover: what they'll lose access to, what $9.99/month gets them,
        one line social proof. Clear CTA.
        150 words max. Treat them like an intelligent adult.`
    },
    day30: {
      instruction: `Write a 2-sentence win-back email.
        Just ask: did it not work for them? Ask them to reply.
        Subject line: "Quick question"
        Body: maximum 3 sentences. Ultra personal.
        This should NOT feel like a marketing email at all.`
    }
  };

  const emailSpec = triggers[trigger] || triggers.welcome;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 800,
    messages: [{
      role: 'user',
      content: `Write an email for ${product.name}.
${emailSpec.instruction}

Product: ${product.name}
URL: ${product.url}
Pitch: ${product.pitch}
${userData.name ? `Recipient name: ${userData.name}` : ''}

Return JSON:
{
  "subject": "email subject line",
  "body": "full email body in plain text with \\n for line breaks",
  "cta_text": "button text if needed",
  "cta_url": "URL for CTA button"
}

Return only valid JSON.`
    }]
  });

  return JSON.parse(response.content[0].text);
}

async function generateFacebookPost(product, postType = 'helpful') {
  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 400,
    messages: [{
      role: 'user',
      content: `Write a Facebook group post for a meal planning / budget cooking community.

Post type: ${postType === 'helpful' ? 'Purely helpful, NO product mention' : 'Soft product mention at end'}
Product: ${product.name} — ${product.pitch}

Rules:
- Sounds like a real community member, not a brand
- No hashtags
- No exclamation marks
- Conversational, warm
- If helpful type: share a genuine tip or insight, nothing promotional
- If mention type: tip first (80% of post), one line about product at end
- 100-150 words max

Return only the post text.`
    }]
  });

  return response.content[0].text;
}

async function generateWeeklyInsight(product, weekData) {
  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 400,
    messages: [{
      role: 'user',
      content: `You are a marketing analyst. Write a weekly performance insight.

Product: ${product.name}
Week data:
  Posts published: ${weekData.posts_published}
  Total clicks: ${weekData.total_clicks}
  New signups: ${weekData.signups}
  Conversions to paid: ${weekData.conversions}
  MRR added: $${weekData.mrr_added}
  Best performing content: ${weekData.best_content}
  Worst performing: ${weekData.worst_content}
  Platform breakdown: ${JSON.stringify(weekData.platforms)}

Write:
1. One sentence overall summary
2. One specific insight about what worked and why
3. One specific recommendation for next week
4. One thing to stop doing

Tone: direct, data-driven, actionable. Like a smart analyst friend.
200 words max. Return as plain text.`
    }]
  });

  return response.content[0].text;
}

async function regenerateContent(originalContent, feedback, product) {
  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 600,
    messages: [{
      role: 'user',
      content: `Rewrite this marketing content.

Original: "${originalContent.body}"
Platform: ${originalContent.platform}
Issue: ${feedback || 'Make it better — more natural, more helpful, less promotional'}

Product: ${product.name} — ${product.pitch}
URL: ${product.url}

Write a better version. Same platform, same goal, different approach.
Return only the new content text.`
    }]
  });

  return response.content[0].text;
}

async function suggestSubreddits(product) {
  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 300,
    messages: [{
      role: 'user',
      content: `Suggest 5 Reddit subreddits to monitor for this product.

Product: ${product.name}
What it does: ${product.pitch}
Target audience: ${product.audience}
Problem it solves: ${product.pain_point}

Return a JSON array of subreddit names (without r/ prefix) and keywords to watch.
Format:
[
  { "subreddit": "name", "keywords": ["keyword1", "keyword2", "keyword3"] }
]

Return only valid JSON.`
    }]
  });

  return JSON.parse(response.content[0].text);
}

module.exports = {
  generateRedditReply,
  generatePinterestPin,
  generateBlogPost,
  generateEmail,
  generateFacebookPost,
  generateWeeklyInsight,
  regenerateContent,
  suggestSubreddits
};
