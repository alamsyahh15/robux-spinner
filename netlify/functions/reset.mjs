import { connectLambda, getStore } from '@netlify/blobs';

function json(statusCode, body) {
  const response = {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
    body: JSON.stringify(body),
  };

  if (statusCode === 204) response.body = '';
  return response;
}

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return json(204, {});
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' });

  connectLambda(event);

  const store = getStore('robux-roulette');

  const { blobs: robloxBlobs } = await store.list({ prefix: 'claimed/roblox/' });
  const { blobs: discordBlobs } = await store.list({ prefix: 'claimed/discord/' });

  const keys = new Set([...robloxBlobs.map((b) => b.key), ...discordBlobs.map((b) => b.key)]);
  await Promise.all([...keys].map((key) => store.delete(key)));

  return json(200, { deleted: keys.size });
};
