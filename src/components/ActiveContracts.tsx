import React, { useEffect, useState, useCallback } from 'react';
import { Clock, CheckCircle, Award, Sparkles, Loader2, ArrowUpRight, Building2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import type { UserProfile, InvestmentContract } from '../types';
import { claimDailyReturn } from '../firebase/services';
import { sounds } from '../utils/audio';

interface ActiveContractsProps {
  user: UserProfile | null;
  contracts: InvestmentContract[];
  onOpenPackages: () => void;
}

export const ActiveContracts: React.FC<ActiveContractsProps> = ({
  user,
  contracts,
  onOpenPackages,
}) => {
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());

  // Update timer every second for accurate countdowns
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Format countdown string HH:MM:SS
  const getRemainingCooldown = useCallback(
    (contract: InvestmentContract) => {
      if (contract.daysRemaining <= 0) return { ready: false, text: 'Completed', progress: 100 };

      const lastCollectedMs =
        contract.lastCollectedAt?.toMillis?.() ??
        (contract.lastCollectedAt instanceof Date
          ? contract.lastCollectedAt.getTime()
          : contract.lastCollectedAt?.seconds
          ? contract.lastCollectedAt.seconds * 1000
          : now);

      const DAY_MS = 24 * 60 * 60 * 1000;
      const nextCollectMs = lastCollectedMs + DAY_MS;
      const diff = nextCollectMs - now;

      if (diff <= 0) {
        return { ready: true, text: '00:00:00 (Ready to Collect)', progress: 100 };
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      const pad = (n: number) => n.toString().padStart(2, '0');
      const elapsedPortion = Math.min(100, Math.max(0, ((DAY_MS - diff) / DAY_MS) * 100));

      return {
        ready: false,
        text: `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`,
        progress: elapsedPortion,
      };
    },
    [now]
  );

  // Handle claim / collect daily return
  const handleCollect = async (contract: InvestmentContract) => {
    if (!user || claimingId) return;

    setClaimingId(contract.id);
    setSuccessNotice(null);

    try {
      const res = await claimDailyReturn(user.id, contract.id);
      sounds.playWin();
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
      });
      setSuccessNotice(`Successfully collected ₱${res.creditedAmount.toLocaleString()} daily yield!`);
      setTimeout(() => setSuccessNotice(null), 4000);
    } catch (err) {
      console.error('Claim error:', err);
    } finally {
      setClaimingId(null);
    }
  };

  // Auto-collect on load if cycle passed
  useEffect(() => {
    if (!user || contracts.length === 0) return;
    contracts.forEach((c) => {
      if (c.daysRemaining > 0) {
        const lastCollectedMs =
          c.lastCollectedAt?.toMillis?.() ??
          (c.lastCollectedAt instanceof Date
            ? c.lastCollectedAt.getTime()
            : c.lastCollectedAt?.seconds
            ? c.lastCollectedAt.seconds * 1000
            : Date.now());
        const DAY_MS = 24 * 60 * 60 * 1000;
        if (Date.now() - lastCollectedMs >= DAY_MS) {
          claimDailyReturn(user.id, c.id).catch(() => {});
        }
      }
    });
  }, [contracts, user]);

  return (
    <div className="py-8 sm:py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4 border-b border-amber-100 pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100/70 text-amber-900 text-xs font-semibold mb-2">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>Active Contract Portfolios</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            My Investment Contracts
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xl">
            Live 24-hour collection cooldown countdowns. Yields are automatically credited directly to your Philippine peso wallet.
          </p>
        </div>

        <button
          onClick={onOpenPackages}
          className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-sm shadow-amber-500/20 cursor-pointer self-start sm:self-auto"
        >
          <span>Purchase New Package</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Success Toast */}
      {successNotice && (
        <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5 animate-in fade-in duration-200">
          <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-semibold">{successNotice}</span>
        </div>
      )}

      {/* Empty State */}
      {contracts.length === 0 ? (
        <div className="rounded-3xl border-2 border-dashed border-stone-200 bg-white p-12 text-center shadow-xs">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-50 border border-amber-200/80 flex items-center justify-center text-amber-600 mb-4">
            <Building2 className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-900 mb-1">No Active Contracts Yet</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mb-6 leading-relaxed">
            You do not currently have any active real estate contracts. Choose a package starting at only ₱150 to begin collecting daily returns!
          </p>
          <button
            onClick={onOpenPackages}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-600 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 transition-all cursor-pointer"
          >
            Explore Available Packages
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {contracts.map((contract) => {
            const cooldown = getRemainingCooldown(contract);
            const isCompleted = contract.daysRemaining <= 0;
            const totalDays =
              contract.totalDays || (contract.daysRemaining + (contract.daysCollectedCount || 0));
            const progressPct =
              totalDays > 0
                ? Math.min(100, Math.round(((contract.daysCollectedCount || 0) / totalDays) * 100))
                : 0;

            return (
              <div
                key={contract.id}
                className={`rounded-2xl p-6 border transition-all flex flex-col justify-between ${
                  isCompleted
                    ? 'bg-stone-50 border-stone-200 opacity-75'
                    : 'bg-white border-stone-200/90 hover:border-amber-400 shadow-sm hover:shadow-md'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                        Contract #{contract.id.slice(0, 6)}
                      </span>
                      <h4 className="text-base font-bold text-slate-900">{contract.planName}</h4>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 block">Daily Yield</span>
                      <span className="text-sm font-bold text-emerald-700 font-mono tabular-nums">
                        +₱{contract.dailyReturn.toLocaleString()}/day
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1.5 mb-4">
                    <div className="flex justify-between text-[11px] text-slate-500">
                      <span>Cycle: {contract.daysCollectedCount || 0} / {totalDays} Days</span>
                      <span className="font-mono font-semibold text-slate-700">{progressPct}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-stone-100 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-400 to-amber-600 transition-all duration-500"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>

                  {/* Metric Chips */}
                  <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-stone-50 border border-stone-200/80 text-xs mb-4">
                    <div>
                      <span className="text-[10px] text-slate-500 block">Accrued Return</span>
                      <span className="font-bold text-amber-800 font-mono tabular-nums">
                        ₱{((contract.daysCollectedCount || 0) * contract.dailyReturn).toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Remaining Cycles</span>
                      <span className="font-bold text-slate-800 font-mono tabular-nums">
                        {contract.daysRemaining} Days
                      </span>
                    </div>
                  </div>
                </div>

                {/* Cooldown Timer & Action */}
                <div className="pt-3 border-t border-stone-200/80">
                  {isCompleted ? (
                    <div className="flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-emerald-700">
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                      <span>Full Contract Cycle Completed</span>
                    </div>
                  ) : cooldown.ready ? (
                    <button
                      onClick={() => handleCollect(contract)}
                      disabled={claimingId === contract.id}
                      className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold text-xs uppercase tracking-wider shadow-sm shadow-emerald-500/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer animate-pulse"
                    >
                      {claimingId === contract.id ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Crediting ₱{contract.dailyReturn}...</span>
                        </>
                      ) : (
                        <>
                          <Award className="w-4 h-4" />
                          <span>Collect ₱{contract.dailyReturn.toLocaleString()} Today</span>
                        </>
                      )}
                    </button>
                  ) : (
                    <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/80 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-amber-600 animate-spin-slow" />
                        <span className="text-[11px] font-medium text-slate-600">Next Return:</span>
                      </div>
                      <span className="text-xs font-mono font-bold text-amber-800 tabular-nums">
                        {cooldown.text}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
