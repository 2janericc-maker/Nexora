import React, { useState, useEffect, useRef } from 'react';
import { Flame, Coins, AlertCircle, Sparkles, Volume2, VolumeX, ArrowDown } from 'lucide-react';
import confetti from 'canvas-confetti';
import type { UserProfile, RouletteLogRecord } from '../types';
import {
  determineRouletteOutcome,
  executeRouletteSpin,
  subscribeToRouletteLogs,
} from '../firebase/services';
import { sounds } from '../utils/audio';

interface RouletteSectionProps {
  user: UserProfile | null;
  onOpenWallet: () => void;
}

// 12 Slices mapping outcomes visually (DO NOT SHOW PROBABILITIES)
interface WheelSlice {
  label: string;
  sublabel: string;
  multiplier: number;
  outcomeName: string;
  color: string;
  textColor: string;
}

const WHEEL_SLICES: WheelSlice[] = [
  { label: '0x', sublabel: 'Try Again', multiplier: 0, outcomeName: 'Lose', color: '#f8fafc', textColor: '#64748b' },
  { label: '1.5x', sublabel: 'Small Win', multiplier: 1.5, outcomeName: 'Small Win', color: '#fef3c7', textColor: '#92400e' },
  { label: '0x', sublabel: 'Try Again', multiplier: 0, outcomeName: 'Lose', color: '#f1f5f9', textColor: '#64748b' },
  { label: '2x', sublabel: 'Win', multiplier: 2, outcomeName: 'Win', color: '#ecfdf5', textColor: '#065f46' },
  { label: '0x', sublabel: 'Try Again', multiplier: 0, outcomeName: 'Lose', color: '#f8fafc', textColor: '#64748b' },
  { label: '4x', sublabel: 'Big Win', multiplier: 4, outcomeName: 'Big Win', color: '#f59e0b', textColor: '#ffffff' },
  { label: '0x', sublabel: 'Try Again', multiplier: 0, outcomeName: 'Lose', color: '#f1f5f9', textColor: '#64748b' },
  { label: '1.5x', sublabel: 'Small Win', multiplier: 1.5, outcomeName: 'Small Win', color: '#fef3c7', textColor: '#92400e' },
  { label: '0x', sublabel: 'Try Again', multiplier: 0, outcomeName: 'Lose', color: '#f8fafc', textColor: '#64748b' },
  { label: '10x', sublabel: 'Jackpot', multiplier: 10, outcomeName: 'Mega Jackpot', color: '#e11d48', textColor: '#ffffff' },
  { label: '0x', sublabel: 'Try Again', multiplier: 0, outcomeName: 'Lose', color: '#f1f5f9', textColor: '#64748b' },
  { label: '1.5x', sublabel: 'Small Win', multiplier: 1.5, outcomeName: 'Small Win', color: '#fef3c7', textColor: '#92400e' },
];

export const RouletteSection: React.FC<RouletteSectionProps> = ({ user, onOpenWallet }) => {
  const [betAmount, setBetAmount] = useState<number>(50);
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [rotationAngle, setRotationAngle] = useState<number>(0);
  const [recentLogs, setRecentLogs] = useState<RouletteLogRecord[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<{
    outcome: string;
    multiplier: number;
    payout: number;
  } | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const quickBets = [50, 100, 150, 200, 300];

  // Subscribe to live winning spins from roulette_logs
  useEffect(() => {
    const unsub = subscribeToRouletteLogs(25, (logs) => {
      const winningLogs = logs.filter((l) => l.payout > 0);
      setRecentLogs(winningLogs);
    });
    return () => unsub();
  }, []);

  // Draw wheel on canvas in White & Gold luxury styling
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = width / 2 - 14;

    ctx.clearRect(0, 0, width, height);

    const sliceAngle = (2 * Math.PI) / WHEEL_SLICES.length;

    WHEEL_SLICES.forEach((slice, i) => {
      const startAngle = i * sliceAngle;
      const endAngle = startAngle + sliceAngle;

      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = slice.color;
      ctx.fill();

      // Golden Dividers
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = '#e2e8f0';
      ctx.stroke();

      // Text Labels
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(startAngle + sliceAngle / 2);
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';

      // Multiplier Label
      ctx.fillStyle = slice.textColor;
      ctx.font = 'bold 15px monospace';
      ctx.fillText(slice.label, radius - 20, 0);

      // Sublabel
      ctx.fillStyle = slice.textColor;
      ctx.font = 'bold 9px sans-serif';
      ctx.fillText(slice.sublabel, radius - 58, 0);

      ctx.restore();
    });

    // Outer Gold Rim
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.lineWidth = 8;
    ctx.strokeStyle = '#d97706';
    ctx.stroke();

    // Secondary Inner Gold Accent
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius - 4, 0, 2 * Math.PI);
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#fef3c7';
    ctx.stroke();

    // Center Gold Hub
    ctx.beginPath();
    ctx.arc(centerX, centerY, 30, 0, 2 * Math.PI);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#d97706';
    ctx.stroke();

    // Center N Wordmark
    ctx.fillStyle = '#b45309';
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('N', centerX, centerY);
  }, []);

  const formatMaskedMobile = (mobile: string) => {
    if (!mobile) return '****0000';
    const digitsOnly = mobile.replace(/\D/g, '');
    const last4 = digitsOnly.slice(-4) || '1234';
    return `****${last4}`;
  };

  const handleSpin = async () => {
    if (!user) return;

    setErrorMessage(null);
    setLastResult(null);

    // Table limits & balance validation (Strictly client-side before backend call)
    if (isNaN(betAmount) || betAmount < 50 || betAmount > 300) {
      setErrorMessage('Bet amount must be between ₱50 and ₱300.');
      return;
    }

    if (user.balance < betAmount) {
      setErrorMessage(
        `Insufficient balance. You have ₱${user.balance.toLocaleString('en-US', {
          minimumFractionDigits: 2,
        })} but need ₱${betAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}.`
      );
      return;
    }

    setIsSpinning(true);

    try {
      const outcome = determineRouletteOutcome();

      const matchingIndices = WHEEL_SLICES.map((s, i) => (s.outcomeName === outcome.name ? i : -1)).filter(
        (i) => i !== -1
      );
      const chosenSliceIndex =
        matchingIndices[Math.floor(Math.random() * matchingIndices.length)] ?? 0;

      const sliceDeg = 360 / WHEEL_SLICES.length;
      const targetDeg = (270 - (chosenSliceIndex * sliceDeg + sliceDeg / 2) + 360) % 360;

      const currentFullRotations = Math.floor(rotationAngle / 360) + 5;
      const finalAngle = currentFullRotations * 360 + targetDeg;

      let tickCount = 0;
      const tickInterval = setInterval(() => {
        if (!isMuted) sounds.playTick();
        tickCount++;
        if (tickCount > 24) clearInterval(tickInterval);
      }, 120);

      setRotationAngle(finalAngle);

      const spinPromise = executeRouletteSpin(user.id, user.mobileNumber, betAmount, outcome);

      await new Promise((r) => setTimeout(r, 3400));
      clearInterval(tickInterval);

      const spinResult = await spinPromise;

      setLastResult({
        outcome: spinResult.outcome,
        multiplier: spinResult.multiplier,
        payout: spinResult.payout,
      });

      if (spinResult.multiplier >= 10) {
        if (!isMuted) sounds.playJackpot();
        confetti({
          particleCount: 150,
          spread: 100,
          origin: { y: 0.6 },
        });
      } else if (spinResult.multiplier > 0) {
        if (!isMuted) sounds.playWin();
        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.7 },
        });
      } else {
        if (!isMuted) sounds.playLoss();
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Spin execution failed.');
    } finally {
      setIsSpinning(false);
    }
  };

  return (
    <div className="py-8 sm:py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Live Winnings Ticker (White & Gold) */}
      <div className="mb-8 rounded-2xl bg-white border border-amber-200/90 p-3 overflow-hidden flex items-center shadow-xs">
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold whitespace-nowrap shrink-0">
          <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-600" />
          <span>Live Payout Ticker</span>
        </div>

        <div className="relative overflow-hidden w-full ml-3">
          <div className="flex items-center gap-8 whitespace-nowrap animate-marquee">
            {recentLogs.length > 0 ? (
              recentLogs.map((log) => (
                <div key={log.id} className="flex items-center gap-1.5 text-xs">
                  <span className="font-mono text-slate-800 font-bold">
                    {formatMaskedMobile(log.mobileNumber)}
                  </span>
                  <span className="text-slate-500">won</span>
                  <span className="font-bold text-emerald-700 font-mono tabular-nums">
                    ₱{log.payout.toLocaleString()}
                  </span>
                  <span className="text-amber-600 font-mono font-bold">({log.multiplier}x)!</span>
                </div>
              ))
            ) : (
              <div className="text-xs text-slate-400 italic">
                Live winning spins will stream here in real time.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4 border-b border-amber-100 pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100/70 text-amber-900 text-xs font-semibold mb-2">
            <Coins className="w-3.5 h-3.5 text-amber-600" />
            <span>Interactive Mini-Game</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Nexora Instant Roulette
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xl">
            Place your bet between ₱50 and ₱300. Multiplied returns are credited immediately to your wallet balance via atomic database transactions.
          </p>
        </div>

        <button
          onClick={() => setIsMuted(!isMuted)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-stone-200 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer self-start md:self-auto shadow-xs"
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-rose-500" /> : <Volume2 className="w-4 h-4 text-emerald-600" />}
          <span>{isMuted ? 'Muted' : 'Sound On'}</span>
        </button>
      </div>

      {/* Game Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Wheel Column */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center">
          <div className="relative p-6 sm:p-8 rounded-3xl bg-white border border-stone-200/90 shadow-lg flex flex-col items-center">
            {/* Top Indicator Arrow */}
            <div className="absolute top-4 z-20 flex flex-col items-center filter drop-shadow-[0_4px_8px_rgba(217,119,6,0.3)]">
              <div className="w-0 h-0 border-l-[14px] border-l-transparent border-r-[14px] border-r-transparent border-t-[24px] border-t-amber-500" />
              <ArrowDown className="w-4 h-4 text-white -mt-5 font-black" />
            </div>

            {/* Rotating Canvas Wheel */}
            <div
              className="w-72 h-72 sm:w-84 sm:h-84 md:w-96 md:h-96 relative transition-transform duration-[3400ms] ease-out"
              style={{
                transform: `rotate(${rotationAngle}deg)`,
                transitionTimingFunction: 'cubic-bezier(0.12, 0.8, 0.2, 1)',
              }}
            >
              <canvas ref={canvasRef} width={400} height={400} className="w-full h-full rounded-full" />
            </div>

            {/* Outcome Display */}
            <div className="mt-4 text-center">
              {lastResult && (
                <div
                  className={`p-3 rounded-2xl border text-xs font-bold animate-in fade-in duration-200 ${
                    lastResult.multiplier > 0
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-stone-50 border-stone-200 text-slate-500'
                  }`}
                >
                  {lastResult.multiplier > 0 ? (
                    <span className="flex items-center gap-1.5 justify-center">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      <span>
                        {lastResult.outcome}! Payout: ₱{lastResult.payout.toLocaleString()} ({lastResult.multiplier}x)
                      </span>
                    </span>
                  ) : (
                    <span>Spin resulted in 0x. Try again!</span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Controls Column */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-3xl bg-white border border-stone-200/90 p-6 sm:p-8 shadow-lg space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Wager Selection
              </span>
              <span className="text-xs text-amber-700 font-mono font-bold">Limits: ₱50 – ₱300</span>
            </div>

            {/* Bet Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 block">
                Bet Amount (₱ PHP)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 font-bold font-mono">
                  ₱
                </div>
                <input
                  type="number"
                  min={50}
                  max={300}
                  step={10}
                  disabled={isSpinning}
                  value={betAmount || ''}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    setBetAmount(isNaN(val) ? 0 : val);
                    setErrorMessage(null);
                  }}
                  className="w-full pl-8 pr-4 py-3 rounded-2xl bg-stone-50 border border-stone-200 focus:border-amber-500 focus:bg-white focus:outline-none text-slate-900 font-mono font-bold text-lg tabular-nums"
                  placeholder="50"
                />
              </div>
            </div>

            {/* Quick Chips */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-slate-500 block">Quick Presets:</span>
              <div className="grid grid-cols-5 gap-2">
                {quickBets.map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    disabled={isSpinning}
                    onClick={() => {
                      setBetAmount(amt);
                      setErrorMessage(null);
                    }}
                    className={`py-2 px-2 text-xs font-bold rounded-xl border transition-all cursor-pointer font-mono ${
                      betAmount === amt
                        ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-xs'
                        : 'bg-stone-50 text-slate-700 border-stone-200 hover:border-amber-300'
                    }`}
                  >
                    ₱{amt}
                  </button>
                ))}
              </div>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
                <div className="flex-1">
                  <p>{errorMessage}</p>
                  {user && user.balance < betAmount && (
                    <button
                      onClick={onOpenWallet}
                      className="mt-1 text-xs font-bold text-amber-700 underline hover:text-amber-800 cursor-pointer block"
                    >
                      Top Up Wallet Balance &rarr;
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Balance Notice */}
            <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80 flex items-center justify-between text-xs">
              <span className="text-slate-600 font-medium">Available Balance:</span>
              <span className="font-bold text-slate-900 font-mono tabular-nums">
                ₱{user ? user.balance.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '0.00'}
              </span>
            </div>

            {/* Spin CTA */}
            <button
              type="button"
              onClick={handleSpin}
              disabled={isSpinning}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-600 hover:to-amber-500 text-slate-950 font-extrabold text-sm uppercase tracking-wider shadow-md shadow-amber-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Coins className="w-5 h-5" />
              <span>{isSpinning ? 'Wheel Spinning...' : `Spin Now · ₱${betAmount}`}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
