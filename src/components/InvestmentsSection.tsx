import React, { useState } from 'react';
import { Building2, CheckCircle2, AlertCircle, Loader2, Sparkles, ArrowRight } from 'lucide-react';
import type { UserProfile, PlanConfig } from '../types';
import { purchaseInvestmentPlan } from '../firebase/services';

interface InvestmentsSectionProps {
  user: UserProfile | null;
  onOpenWallet: () => void;
  onSuccessPurchase: () => void;
}

export const INVESTMENT_PLANS: PlanConfig[] = [
  {
    id: 'spark-150',
    name: 'Spark 150',
    cost: 150,
    dailyReturn: 25,
    days: 28,
    totalReturn: 700,
    image: '/src/assets/images/plan_spark_estate_1793033641407.jpg',
    description: 'Boutique urban residential micro-studio in Quezon City.',
  },
  {
    id: 'vertex-300',
    name: 'Vertex 300',
    cost: 300,
    dailyReturn: 50,
    days: 29,
    totalReturn: 1450,
    image: '/src/assets/images/plan_spark_estate_1793033641407.jpg',
    description: 'High-density smart condo loft unit adjacent to Bonifacio Global City.',
  },
  {
    id: 'apex-600',
    name: 'Apex 600',
    cost: 600,
    dailyReturn: 100,
    days: 30,
    totalReturn: 3000,
    image: '/src/assets/images/plan_apex_commercial_1793033641826.jpg',
    description: 'Prime Grade-A commercial office plaza in Ortigas Business Center.',
  },
  {
    id: 'zenith-1200',
    name: 'Zenith 1200',
    cost: 1200,
    dailyReturn: 200,
    days: 31,
    totalReturn: 6200,
    image: '/src/assets/images/plan_apex_commercial_1793033641826.jpg',
    description: 'Corporate headquarters multi-tenant tower in Ayala Avenue, Makati.',
  },
  {
    id: 'sovereign-2400',
    name: 'Sovereign 2400',
    cost: 2400,
    dailyReturn: 400,
    days: 32,
    totalReturn: 12800,
    image: '/src/assets/images/plan_obsidian_mansion_1793033641970.jpg',
    description: 'Private oceanfront luxury villa enclave in Punta Fuego, Batangas.',
  },
  {
    id: 'obsidian-4800',
    name: 'Obsidian 4800',
    cost: 4800,
    dailyReturn: 800,
    days: 33,
    totalReturn: 26400,
    image: '/src/assets/images/plan_obsidian_mansion_1793033641970.jpg',
    description: 'Elite penthouse duplex residence with private helicopter pad.',
  },
];

export const InvestmentsSection: React.FC<InvestmentsSectionProps> = ({
  user,
  onOpenWallet,
  onSuccessPurchase,
}) => {
  const [selectedPlan, setSelectedPlan] = useState<PlanConfig | null>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleOpenModal = (plan: PlanConfig) => {
    setErrorMessage(null);
    setSelectedPlan(plan);
  };

  const handleConfirmPurchase = async () => {
    if (!user || !selectedPlan) return;

    if (user.balance < selectedPlan.cost) {
      setErrorMessage(
        `Insufficient wallet balance. You have ₱${user.balance.toLocaleString('en-US', {
          minimumFractionDigits: 2,
        })} but need ₱${selectedPlan.cost.toLocaleString('en-US', { minimumFractionDigits: 2 })}.`
      );
      return;
    }

    setIsPurchasing(true);
    setErrorMessage(null);

    try {
      await purchaseInvestmentPlan(
        user.id,
        selectedPlan.name,
        selectedPlan.cost,
        selectedPlan.dailyReturn,
        selectedPlan.days
      );
      setSelectedPlan(null);
      onSuccessPurchase();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to purchase plan.');
    } finally {
      setIsPurchasing(false);
    }
  };

  return (
    <div className="py-8 sm:py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4 border-b border-amber-100 pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100/70 text-amber-900 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Institutional Real Estate Packages</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Select Your Investment Contract
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xl">
            Choose a verified commercial or residential property package. Earnings are auto-calculated every 24-hour cycle and deposited directly to your balance.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-white border border-amber-200/80 shadow-xs flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 font-bold">
              ₱
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-mono block">Currency</span>
              <span className="text-xs font-bold text-slate-900">Philippine Peso (PHP)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Packages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {INVESTMENT_PLANS.map((plan) => {
          const netProfit = plan.totalReturn - plan.cost;
          const roiPercent = Math.round((netProfit / plan.cost) * 100);

          return (
            <div
              key={plan.id}
              className="rounded-2xl bg-white border border-stone-200/90 hover:border-amber-400 hover:shadow-lg hover:shadow-amber-500/5 transition-all flex flex-col overflow-hidden group shadow-xs"
            >
              {/* Photo Header */}
              <div className="relative h-48 overflow-hidden bg-stone-100">
                <img
                  src={plan.image}
                  alt={plan.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />

                {/* Cost Pill */}
                <div className="absolute top-3 right-3 px-3 py-1 rounded-xl bg-white/95 backdrop-blur-md border border-amber-200 text-sm font-extrabold text-amber-700 font-mono tabular-nums shadow-sm">
                  ₱{plan.cost.toLocaleString()}
                </div>

                {/* Plan Name & Tag */}
                <div className="absolute bottom-3 left-4 right-4">
                  <span className="text-[10px] font-mono text-amber-300 font-semibold uppercase tracking-wider block">
                    Institutional Property
                  </span>
                  <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                </div>
              </div>

              {/* Details Body */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <p className="text-xs text-slate-600 leading-relaxed min-h-[36px]">
                  {plan.description}
                </p>

                {/* Metrics Table */}
                <div className="grid grid-cols-2 gap-2.5 p-3.5 rounded-xl bg-stone-50 border border-stone-200/80 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 block">Daily Yield</span>
                    <span className="text-sm font-bold text-emerald-700 font-mono tabular-nums">
                      +₱{plan.dailyReturn.toLocaleString()}/day
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Duration</span>
                    <span className="text-sm font-bold text-slate-800 font-mono tabular-nums">
                      {plan.days} Days
                    </span>
                  </div>
                  <div className="pt-1.5 border-t border-stone-200/60">
                    <span className="text-[10px] text-slate-500 block">Total Payout</span>
                    <span className="text-sm font-bold text-amber-700 font-mono tabular-nums">
                      ₱{plan.totalReturn.toLocaleString()}
                    </span>
                  </div>
                  <div className="pt-1.5 border-t border-stone-200/60">
                    <span className="text-[10px] text-slate-500 block">Net Profit</span>
                    <span className="text-sm font-bold text-emerald-700 font-mono tabular-nums">
                      +{roiPercent}% (+₱{netProfit.toLocaleString()})
                    </span>
                  </div>
                </div>

                {/* Invest Button (White & Gold Theme) */}
                <button
                  onClick={() => handleOpenModal(plan)}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-600 hover:to-amber-500 text-slate-950 font-bold text-xs uppercase tracking-wider shadow-sm shadow-amber-500/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Building2 className="w-4 h-4" />
                  <span>Purchase Package · ₱{plan.cost.toLocaleString()}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Confirmation Purchase Modal (White & Gold) */}
      {selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-md bg-white border border-stone-200 rounded-3xl p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-slate-900 mb-1">Confirm Contract Purchase</h3>
            <p className="text-xs text-slate-500 mb-4">
              Review your investment terms before authorizing this deduction:
            </p>

            <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 space-y-2.5 mb-4 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-600">Selected Package:</span>
                <span className="font-bold text-slate-900">{selectedPlan.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Purchase Cost:</span>
                <span className="font-bold text-amber-800 font-mono tabular-nums">
                  ₱{selectedPlan.cost.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Daily Return:</span>
                <span className="font-bold text-emerald-700 font-mono tabular-nums">
                  ₱{selectedPlan.dailyReturn.toLocaleString()}/day
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Duration Period:</span>
                <span className="font-bold text-slate-800">{selectedPlan.days} Days</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-amber-200/60">
                <span className="text-slate-700 font-semibold">Total Projected Return:</span>
                <span className="font-bold text-emerald-700 font-mono tabular-nums">
                  ₱{selectedPlan.totalReturn.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Current Balance */}
            {user && (
              <div className="flex items-center justify-between text-xs p-3 rounded-xl bg-stone-100 mb-4">
                <span className="text-slate-600">Your Current Balance:</span>
                <span className="font-bold text-slate-900 font-mono tabular-nums">
                  ₱{user.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
            )}

            {/* Error if Insufficient Balance */}
            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2 mb-4">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
                <div className="flex-1">
                  <p>{errorMessage}</p>
                  {user && user.balance < selectedPlan.cost && (
                    <button
                      onClick={() => {
                        setSelectedPlan(null);
                        onOpenWallet();
                      }}
                      className="mt-1.5 text-xs font-bold text-amber-700 underline hover:text-amber-800 block cursor-pointer"
                    >
                      Deposit Funds into Wallet &rarr;
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedPlan(null)}
                disabled={isPurchasing}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 bg-stone-100 hover:bg-stone-200 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmPurchase}
                disabled={isPurchasing}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-600 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isPurchasing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Processing Transaction...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Authorize Purchase</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
