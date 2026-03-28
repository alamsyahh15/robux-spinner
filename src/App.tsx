import { useEffect, useState, type FormEvent } from 'react';
import { motion } from 'motion/react';
import confetti from 'canvas-confetti';
import { Loader2 } from 'lucide-react';

const REWARDS = [
  { amount: 6, color: '#f87171' },
  { amount: 9, color: '#fb923c' },
  { amount: 69, color: '#facc15' },
  { amount: 696, color: '#4ade80' },
  { amount: 6.969, color: '#c084fc' },
];

type ClaimRecord = {
  claimedAt?: string;
  robloxUsername?: string;
  discordUsername?: string;
  voucherCode?: string;
  reward?: number;
};

export default function App() {
  const [pathname, setPathname] = useState(() => window.location.pathname);

  const [robloxUsername, setRobloxUsername] = useState('');
  const [discordUsername, setDiscordUsername] = useState('');
  const [voucherCode, setVoucherCode] = useState('');
  
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinResult, setSpinResult] = useState<number | null>(null);
  const [rotation, setRotation] = useState(0);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [claims, setClaims] = useState<ClaimRecord[]>([]);
  const [claimsLoading, setClaimsLoading] = useState(false);
  const [claimsError, setClaimsError] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  const loadClaims = async () => {
    setClaimsLoading(true);
    setClaimsError('');
    try {
      const response = await fetch('/api/claims', { method: 'GET' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to load claims');
      setClaims(Array.isArray(data.records) ? data.records : []);
    } catch (err: any) {
      setClaimsError(err.message || 'Failed to load claims');
    } finally {
      setClaimsLoading(false);
    }
  };

  const handleResetClaims = async () => {
    const ok = window.confirm('Reset semua data claim?');
    if (!ok) return;
    setIsResetting(true);
    setClaimsError('');
    try {
      const response = await fetch('/api/reset', { method: 'POST' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to reset claims');
      await loadClaims();
    } catch (err: any) {
      setClaimsError(err.message || 'Failed to reset claims');
    } finally {
      setIsResetting(false);
    }
  };

  const formatDateTime = (value?: string) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString();
  };

  useEffect(() => {
    const onPopState = () => setPathname(window.location.pathname);
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  useEffect(() => {
    if (pathname === '/claims') void loadClaims();
  }, [pathname]);

  const navigate = (to: string) => {
    if (to === window.location.pathname) return;
    window.history.pushState({}, '', to);
    setPathname(to);
  };

  const handleSpin = async (e: FormEvent) => {
    e.preventDefault();
    if (!robloxUsername || !discordUsername || !voucherCode) {
      setError('Please fill in all fields');
      return;
    }

    setError('');
    setSuccessMessage('');
    setIsSpinning(true);

    try {
      const response = await fetch('/api/spin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ robloxUsername, discordUsername, voucherCode }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to spin');
      }

      const rewardAmount = data.reward.amount;
      const rewardIndex = REWARDS.findIndex(r => r.amount === rewardAmount);
      
      // Calculate rotation
      const sliceAngle = 360 / REWARDS.length;
      const sliceCenter = rewardIndex * sliceAngle + (sliceAngle / 2);
      const randomOffset = (Math.random() - 0.5) * (sliceAngle * 0.8); // Randomize landing within the slice
      const baseRotation = Math.ceil(rotation / 360) * 360;
      const targetRotation = baseRotation + 360 * 5 + (360 - (sliceCenter + randomOffset)); // Spin 5 times + land on target
      
      setRotation(targetRotation);
      
      // Wait for animation to finish
      setTimeout(() => {
        setSpinResult(rewardAmount);
        setIsSpinning(false);
        setSuccessMessage(`Congratulations! You won ${rewardAmount} Robux!`);
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      }, 5000);

    } catch (err: any) {
      setError(err.message);
      setIsSpinning(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center p-4 font-sans">
      {pathname === '/claims' ? (
        <div className="max-w-6xl w-full pt-10 pb-10">
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 hover:bg-slate-700"
            >
              Back
            </button>
          </div>

          <div className="bg-slate-800 rounded-2xl shadow-2xl border border-slate-700 overflow-hidden">
            <div className="p-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-100">Claimed List</h2>
                <p className="text-sm text-slate-400">Total: {claims.length}</p>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => void loadClaims()}
                  disabled={claimsLoading || isResetting}
                  className="px-4 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 hover:bg-slate-950 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {claimsLoading ? 'Loading...' : 'Refresh'}
                </button>
                <button
                  type="button"
                  onClick={() => void handleResetClaims()}
                  disabled={isResetting || claimsLoading}
                  className="px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/50 text-red-300 hover:bg-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isResetting ? 'Resetting...' : 'Reset'}
                </button>
              </div>
            </div>

            {claimsError && (
              <div className="px-6 pb-4">
                <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm">
                  {claimsError}
                </div>
              </div>
            )}

            <div className="overflow-x-auto border-t border-slate-700">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-900/40 text-slate-300">
                  <tr>
                    <th className="text-left font-medium px-4 py-3">#</th>
                    <th className="text-left font-medium px-4 py-3">Claimed At</th>
                    <th className="text-left font-medium px-4 py-3">Roblox</th>
                    <th className="text-left font-medium px-4 py-3">Discord</th>
                    <th className="text-left font-medium px-4 py-3">Voucher</th>
                    <th className="text-left font-medium px-4 py-3">Reward</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {claims.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-6 text-center text-slate-400">
                        {claimsLoading ? 'Loading...' : 'Belum ada yang claim'}
                      </td>
                    </tr>
                  ) : (
                    claims.map((claim, index) => (
                      <tr key={`${claim.claimedAt ?? 'na'}-${index}`} className="text-slate-200">
                        <td className="px-4 py-3 text-slate-400">{index + 1}</td>
                        <td className="px-4 py-3">{formatDateTime(claim.claimedAt)}</td>
                        <td className="px-4 py-3">{claim.robloxUsername ?? ''}</td>
                        <td className="px-4 py-3">{claim.discordUsername ?? ''}</td>
                        <td className="px-4 py-3">{claim.voucherCode ?? ''}</td>
                        <td className="px-4 py-3 font-semibold">{claim.reward ?? ''}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-12 items-center pt-10">
        
        {/* Left Side: Form */}
        <div className="bg-slate-800 p-8 rounded-2xl shadow-2xl border border-slate-700 order-2 md:order-1">
          <h1 className="text-3xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
            Free Robux Spin!
          </h1>
          <p className="text-slate-400 mb-6 text-sm">
            Enter your details and a valid voucher code to spin the wheel.
            <br /> <br/>
            Untuk claim Free Robux wajib join Discord MedusaBlox dan open ticket. Link Discord:{' '}
            <a
              href="https://discord.com/invite/Afs5b76ejR"
              target="_blank"
              rel="noreferrer"
              className="text-purple-300 hover:text-purple-200 underline"
            >
              https://discord.com/invite/Afs5b76ejR
            </a>
          </p>

          <form onSubmit={handleSpin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Roblox Username</label>
              <input
                type="text"
                value={robloxUsername}
                onChange={(e) => setRobloxUsername(e.target.value)}
                disabled={isSpinning}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
                placeholder="e.g. Builderman"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Discord Username</label>
              <input
                type="text"
                value={discordUsername}
                onChange={(e) => setDiscordUsername(e.target.value)}
                disabled={isSpinning}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
                placeholder="e.g. wumpus#1234"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Voucher Code</label>
              <input
                type="text"
                value={voucherCode}
                onChange={(e) => setVoucherCode(e.target.value)}
                disabled={isSpinning}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
                placeholder="Enter valid voucher"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}

            {successMessage && (
              <div className="p-3 bg-green-500/10 border border-green-500/50 rounded-lg text-green-400 text-sm font-medium text-center">
                {successMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={isSpinning}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-bold py-3 px-4 rounded-lg transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSpinning ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Spinning...
                </>
              ) : (
                'SPIN NOW!'
              )}
            </button>
          </form>

          
          <div className="mt-6 pt-6 border-t border-slate-700">
            <h3 className="text-sm font-semibold text-slate-300 mb-2">Rewards & Odds:</h3>
            <ul className="text-xs text-slate-400 space-y-1">
              <li>• 6 Robux (Common)</li>
              <li>• 9 Robux (Common)</li>
              <li>• 69 Robux (Uncommon)</li>
              <li>• 696 Robux (Rare)</li>
              <li>• 6.969 Robux (Legendary)</li>
            </ul>
          </div>
        </div>

        {/* Right Side: Wheel */}
        <div className="flex flex-col items-center justify-center relative order-1 md:order-2">
          <div className="relative w-80 h-80 md:w-96 md:h-96">
            {/* Pointer */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-4 z-20 w-0 h-0 border-l-[15px] border-r-[15px] border-t-[30px] border-l-transparent border-r-transparent border-t-white drop-shadow-md"></div>
            
            {/* Wheel */}
            <motion.div 
              className="w-full h-full rounded-full border-4 border-slate-700 overflow-hidden relative shadow-[0_0_50px_rgba(192,132,252,0.2)]"
              animate={{ rotate: rotation }}
              transition={{ duration: 5, ease: [0.2, 0.8, 0.2, 1] }}
              style={{
                background: `conic-gradient(
                  ${REWARDS[0].color} 0deg 72deg,
                  ${REWARDS[1].color} 72deg 144deg,
                  ${REWARDS[2].color} 144deg 216deg,
                  ${REWARDS[3].color} 216deg 288deg,
                  ${REWARDS[4].color} 288deg 360deg
                )`
              }}
            >
              {REWARDS.map((reward, index) => {
                const angle = 360 / REWARDS.length;
                const rotateAngle = index * angle + (angle / 2); // Center of the slice
                return (
                  <div
                    key={index}
                    className="absolute top-0 left-0 w-full h-full origin-center"
                    style={{
                      transform: `rotate(${rotateAngle}deg)`,
                    }}
                  >
                    <div 
                      className="absolute top-[10%] left-1/2 -translate-x-1/2 text-center z-10 font-bold text-white drop-shadow-md text-xl md:text-2xl"
                    >
                      {reward.amount}
                      <br/>
                      <span className="text-sm">Robux</span>
                    </div>
                  </div>
                );
              })}
            </motion.div>
            
            {/* Center dot */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-slate-800 rounded-full border-4 border-slate-700 z-10 shadow-inner flex items-center justify-center">
              <div className="w-6 h-6 bg-purple-500 rounded-full shadow-[0_0_10px_rgba(168,85,247,0.8)]"></div>
            </div>
          </div>
        </div>

      </div>
      )}
    </div>
  );
}
