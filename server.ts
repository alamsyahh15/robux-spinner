import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CHECKPOINT_FILE = path.join(process.cwd(), 'checkpoint.json');

// Initialize checkpoint file if it doesn't exist
if (!fs.existsSync(CHECKPOINT_FILE)) {
  fs.writeFileSync(CHECKPOINT_FILE, JSON.stringify({ robloxUsernames: [], discordUsernames: [] }, null, 2));
}

const VALID_VOUCHERS = ['CHOCONG69','COKLAT69'];

const REWARDS = [
  { amount: 6, weight: 1000000, color: '#f87171' }, // red-400
  { amount: 9, weight: 1000000, color: '#fb923c' }, // orange-400
  { amount: 69, weight: 100000, color: '#facc15' }, // yellow-400
  { amount: 696, weight: 10000, color: '#4ade80' }, // green-400
  { amount: 6.969, weight: 1, color: '#c084fc' }, // purple-400
];

const TOTAL_WEIGHT = REWARDS.reduce((sum, r) => sum + r.weight, 0);

function getRandomReward() {
  const random = Math.random() * TOTAL_WEIGHT;
  let currentWeight = 0;
  for (const reward of REWARDS) {
    currentWeight += reward.weight;
    if (random <= currentWeight) {
      return reward;
    }
  }
  return REWARDS[0];
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  app.post('/api/spin', async (req, res) => {
    const { robloxUsername, discordUsername, voucherCode } = req.body;

    if (!robloxUsername || !discordUsername || !voucherCode) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!VALID_VOUCHERS.includes(voucherCode)) {
      return res.status(400).json({ error: 'Invalid voucher code' });
    }

    // Check if user has already spun
    try {
      const checkpointData = JSON.parse(fs.readFileSync(CHECKPOINT_FILE, 'utf-8'));
      
      if (checkpointData.robloxUsernames.includes(robloxUsername)) {
        return res.status(400).json({ error: 'This Roblox username has already claimed a reward.' });
      }
      
      if (checkpointData.discordUsernames.includes(discordUsername)) {
        return res.status(400).json({ error: 'This Discord username has already claimed a reward.' });
      }

      // Save to checkpoint
      checkpointData.robloxUsernames.push(robloxUsername);
      checkpointData.discordUsernames.push(discordUsername);
      fs.writeFileSync(CHECKPOINT_FILE, JSON.stringify(checkpointData, null, 2));

    } catch (err) {
      console.error('Error reading/writing checkpoint file:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }

    const reward = getRandomReward();

    // Send to Discord Webhook
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
    if (webhookUrl) {
      try {
        await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            embeds: [
              {
                color: 5763719, // Warna hijau (Hex: #57F287)
                description: `🎁 **YEAYY!! ROBUX REWARD CLAIMED**\n\n👤 **Winner Details**\n**Roblox Username:** ${robloxUsername}\n**Discord Username:** ${discordUsername}\n\n🎟️ **Voucher Info**\n**Code Used:** ${voucherCode}\n\n💰 **Prize**\n**Reward:** ${reward.amount} Robux\n\n⚠️ **Catatan**\n• Hadiah akan segera dikirimkan ke akun Roblox pemenang.\n• Harap bersabar menunggu proses pengiriman.`
              }
            ]
          }),
        });
      } catch (error) {
        console.error('Failed to send Discord webhook:', error);
      }
    }

    res.json({ reward });
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
