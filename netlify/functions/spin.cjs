const VALID_VOUCHERS = ['FREE-ROBUX-2026', 'SPIN-ME', 'LUCKY-DAY', 'COKLAT69'];

const REWARDS = [
  { amount: 6, weight: 1000000, color: '#f87171' },
  { amount: 9, weight: 1000000, color: '#fb923c' },
  { amount: 69, weight: 100000, color: '#facc15' },
  { amount: 696, weight: 10000, color: '#4ade80' },
  { amount: 6969, weight: 1, color: '#c084fc' },
];

const TOTAL_WEIGHT = REWARDS.reduce((sum, r) => sum + r.weight, 0);

function getRandomReward() {
  const random = Math.random() * TOTAL_WEIGHT;
  let currentWeight = 0;
  for (const reward of REWARDS) {
    currentWeight += reward.weight;
    if (random <= currentWeight) return reward;
  }
  return REWARDS[0];
}

function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
    body: JSON.stringify(body),
  };
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return json(204, {});
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' });

  let payload;
  try {
    payload = event.body ? JSON.parse(event.body) : null;
  } catch {
    return json(400, { error: 'Invalid JSON body' });
  }

  const robloxUsername = payload?.robloxUsername;
  const discordUsername = payload?.discordUsername;
  const voucherCode = payload?.voucherCode;

  if (!robloxUsername || !discordUsername || !voucherCode) {
    return json(400, { error: 'Missing required fields' });
  }

  if (!VALID_VOUCHERS.includes(voucherCode)) {
    return json(400, { error: 'Invalid voucher code' });
  }

  const reward = getRandomReward();

  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (webhookUrl) {
    try {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          embeds: [
            {
              color: 5763719,
              description: `🎁 **ROBUX REWARD CLAIMED**\n\n👤 **Winner Details**\n**Roblox Username:** ${robloxUsername}\n**Discord Username:** ${discordUsername}\n\n🎟️ **Voucher Info**\n**Code Used:** ${voucherCode}\n\n💰 **Prize**\n**Reward:** ${reward.amount} Robux`,
            },
          ],
        }),
      });
    } catch {}
  }

  return json(200, { reward });
};
