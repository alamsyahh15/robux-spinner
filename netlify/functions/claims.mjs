import { connectLambda, getStore } from '@netlify/blobs';

function json(statusCode, body) {
  const response = {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
    body: JSON.stringify(body),
  };

  if (statusCode === 204) response.body = '';
  return response;
}

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return json(204, {});
  if (event.httpMethod !== 'GET') return json(405, { error: 'Method not allowed' });

  connectLambda(event);

  const store = getStore('robux-roulette');
  const { blobs } = await store.list({ prefix: 'claimed/roblox/' });

  const records = (await Promise.all(blobs.map((blob) => store.get(blob.key, { type: 'json' })))).filter(Boolean);

  records.sort((a, b) => String(b.claimedAt ?? '').localeCompare(String(a.claimedAt ?? '')));

  return json(200, { count: records.length, records });
};
