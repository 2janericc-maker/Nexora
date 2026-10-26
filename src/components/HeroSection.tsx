import React from 'react';
import { ShieldCheck, TrendingUp, Sparkles, ArrowRight } from 'lucide-react';

interface HeroSectionProps {
  onExplore: () => void;
  onOpenRoulette: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onExplore,
  onOpenRoulette,
}) => {
  return (
    <section className="relative overflow-hidden bg-slate-950 pt-8 pb-14 border-b border-slate-900">
      {/* Background Subtle Gradient Accents */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-10 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Value Proposition & CTAs */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-amber-400 bg-amber-400/10 border border-amber-400/20 px-3 py-1 rounded-full">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Philippine Real Estate Asset Yields</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-[1.15] text-balance">
              Premium Property Contracts with{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-300 to-emerald-400">
                Guaranteed Daily Returns
              </span>
            </h1>

            <p className="text-slate-400 text-sm sm:text-base leading-relaxed max-w-xl">
              Invest in high-yield commercial hubs, luxury residential towers, and smart infrastructure across Metro Manila. Receive automated daily earnings credited directly to your Philippine peso wallet.
            </p>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-3 gap-3 pt-2">
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-xs text-slate-400 block mb-1">Starting Capital</span>
                <span className="text-lg font-bold text-white font-mono tabular-nums">₱150</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-xs text-slate-400 block mb-1">Max Daily Yield</span>
                <span className="text-lg font-bold text-emerald-400 font-mono tabular-nums">₱800/day</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-xs text-slate-400 block mb-1">Direct Commission</span>
                <span className="text-lg font-bold text-amber-400 font-mono tabular-nums">30% Level 1</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={onExplore}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 flex items-center gap-2 transition-all cursor-pointer"
              >
                <span>View Investment Plans</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={onOpenRoulette}
                className="px-5 py-3 rounded-xl bg-slate-900 hover:bg-slate-850 text-slate-200 border border-slate-800 hover:border-amber-400/40 font-semibold text-sm transition-all flex items-center gap-2 cursor-pointer"
              >
                <TrendingUp className="w-4 h-4 text-amber-400" />
                <span>Play Live Roulette (Up to 10x)</span>
              </button>
            </div>

            <div className="flex items-center gap-4 text-xs text-slate-400 pt-1">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Direct GCash & Maya Withdrawals
              </span>
              <span className="text-slate-700">·</span>
              <span>24/7 Auto-Crediting Engine</span>
            </div>
          </div>

          {/* Right Column: Hero Real Estate Render */}
          <div className="lg:col-span-5">
            <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-900 shadow-2xl group">
              <img
                src="/src/assets/images/hero_nexora_realestate_1793033639775.jpg"
                alt="Nexora Prime Real Estate Tower"
                referrerPolicy="no-referrer"
                className="w-full h-80 lg:h-[420px] object-cover object-center group-hover:scale-102 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 p-4 rounded-xl bg-slate-950/90 backdrop-blur-md border border-slate-800/80">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-mono uppercase text-amber-400 font-semibold tracking-wider">
                      Flagship Asset
                    </span>
                    <h4 className="text-sm font-bold text-white">Nexora Horizon Tower · Makati</h4>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] text-slate-400 block">Cycle Return</span>
                    <span className="text-sm font-bold text-emerald-400 font-mono tabular-nums">+450% Total ROI</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
