async function generateFoodImage(mealName, style = 'editorial') {
  const styles = {
    editorial: `overhead flat lay food photography, white marble background, natural window light, fresh ingredients artfully arranged, minimal styling, warm editorial tones, high end food magazine, no text, no people, ultra realistic`,
    cozy: `rustic wooden table, warm kitchen lighting, steam rising, comfort food aesthetic, shallow depth of field, no text`,
    minimal: `pure white background, single dish centered, dramatic side lighting, fine dining presentation, no text`
  };

  const response = await fetch('https://firefly-api.adobe.io/v3/images/generate', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.FIREFLY_ACCESS_TOKEN}`,
      'x-api-key': process.env.FIREFLY_CLIENT_ID,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      prompt: `${mealName}, ${styles[style]}`,
      size: { width: 1000, height: 1500 },
      n: 1,
      contentClass: 'photo',
      style: { presets: ['photo'] }
    })
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Firefly API error: ${response.status} ${err}`);
  }

  const data = await response.json();
  return data.outputs?.[0]?.image?.url || null;
}

async function generateProductHeroImage(product) {
  const prompt = `${product.name} app concept, clean minimal flat design illustration, white background, soft pastel accents, mobile app mockup floating, professional tech startup aesthetic, no text overlay, modern`;

  const response = await fetch('https://firefly-api.adobe.io/v3/images/generate', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.FIREFLY_ACCESS_TOKEN}`,
      'x-api-key': process.env.FIREFLY_CLIENT_ID,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      prompt,
      size: { width: 1200, height: 630 },
      n: 1
    })
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Firefly API error: ${response.status} ${err}`);
  }

  const data = await response.json();
  return data.outputs?.[0]?.image?.url || null;
}

module.exports = { generateFoodImage, generateProductHeroImage };
