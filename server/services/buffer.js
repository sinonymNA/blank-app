const BUFFER_API = 'https://api.bufferapp.com/1';

async function getProfiles() {
  const res = await fetch(`${BUFFER_API}/profiles.json?access_token=${process.env.BUFFER_ACCESS_TOKEN}`);
  if (!res.ok) throw new Error(`Buffer API error: ${res.status}`);
  return res.json();
}

async function schedulePost({ text, media = [], scheduledAt, platform }) {
  const profiles = await getProfiles();
  const profile = profiles.find(p =>
    p.service === platform || p.service_type === platform
  );

  if (!profile) throw new Error(`No Buffer profile found for platform: ${platform}`);

  const body = new URLSearchParams({
    access_token: process.env.BUFFER_ACCESS_TOKEN,
    'profile_ids[]': profile.id,
    text,
    scheduled_at: new Date(scheduledAt).toISOString()
  });

  if (media.length > 0) {
    media.forEach(url => body.append('media[photo]', url));
  }

  const res = await fetch(`${BUFFER_API}/updates/create.json`, {
    method: 'POST',
    body
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Buffer schedule error: ${res.status} ${err}`);
  }

  const data = await res.json();
  return data.updates?.[0]?.id || null;
}

async function getPostStatus(bufferId) {
  const res = await fetch(
    `${BUFFER_API}/updates/${bufferId}.json?access_token=${process.env.BUFFER_ACCESS_TOKEN}`
  );
  if (!res.ok) throw new Error(`Buffer API error: ${res.status}`);
  return res.json();
}

module.exports = { getProfiles, schedulePost, getPostStatus };
