function generateUTM(productUrl, platform, contentType, contentId) {
  const base = productUrl.includes('?') ? productUrl : productUrl.replace(/\/$/, '');
  const params = new URLSearchParams({
    utm_source: platform,
    utm_medium: contentType,
    utm_campaign: 'ampere',
    utm_content: contentId
  });
  return `${base}?${params.toString()}`;
}

function parseUTMParams(url) {
  try {
    const u = new URL(url);
    return {
      source: u.searchParams.get('utm_source'),
      medium: u.searchParams.get('utm_medium'),
      campaign: u.searchParams.get('utm_campaign'),
      content: u.searchParams.get('utm_content')
    };
  } catch {
    return null;
  }
}

module.exports = { generateUTM, parseUTMParams };
