import React from 'react';
import { LogOut, Ticket, Wallet, Building2, Clock, Coins, Target, Users } from 'lucide-react';
import type { UserProfile } from '../types';

interface HeaderProps {
  user: UserProfile | null;
  onOpenCoupon: () => void;
  onLogout: () => void;
  currentPage: string;
  onNavigate: (page: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  onOpenCoupon,
  onLogout,
  currentPage,
  onNavigate,
}) => {
  const navItems = [
    { id: 'packages', label: 'Packages', icon: Building2 },
    { id: 'contracts', label: 'Contracts', icon: Clock },
    { id: 'roulette', label: 'Roulette', icon: Coins },
    { id: 'wallet', label: 'Wallet', icon: Wallet },
    { id: 'missions', label: 'Missions', icon: Target },
    { id: 'team', label: 'Team', icon: Users },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-amber-200/70 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-6">
        {/* Zone 1: Brand Wordmark (White & Gold) */}
        <button
          onClick={() => onNavigate('packages')}
          className="text-lg font-bold tracking-tight text-slate-900 flex items-center gap-2.5 whitespace-nowrap shrink-0 group cursor-pointer"
        >
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 flex items-center justify-center text-slate-950 font-black text-sm shadow-sm shadow-amber-500/25">
            N
          </div>
          <span>
            Nexora <span className="text-amber-600 font-semibold">Investment</span>
          </span>
        </button>

        {/* Zone 2: Multi-Page Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1 sm:gap-2 text-xs font-semibold text-slate-600">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`px-3 py-2 rounded-xl transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer ${
                  isActive
                    ? 'bg-amber-50 text-amber-800 border border-amber-200 shadow-xs font-bold'
                    : 'hover:text-slate-900 hover:bg-stone-50 border border-transparent'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-amber-600' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Zone 3: User Balance & Quick Controls */}
        <div className="flex items-center gap-2.5 shrink-0">
          {user && (
            <>
              {/* Wallet Balance Display */}
              <button
                onClick={() => onNavigate('wallet')}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50/80 border border-amber-200/90 hover:bg-amber-100/70 transition-colors cursor-pointer shadow-xs"
                title="View Wallet"
              >
                <Wallet className="w-4 h-4 text-amber-600 shrink-0" />
                <span className="text-xs text-slate-600 hidden sm:inline">Balance:</span>
                <span className="text-xs sm:text-sm font-bold text-slate-900 font-mono tabular-nums">
                  ₱{Number(user.balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </button>

              {/* Coupon Redemption Button */}
              <button
                onClick={onOpenCoupon}
                className="px-3 py-1.5 text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 border border-amber-400/80 rounded-xl shadow-xs shadow-amber-500/20 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
              >
                <Ticket className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Redeem Coupon</span>
              </button>

              {/* User mobile & Logout */}
              <div className="flex items-center gap-1 pl-1">
                <span className="text-xs font-mono text-slate-500 hidden lg:inline">
                  {user.mobileNumber.slice(0, 4)}****{user.mobileNumber.slice(-3)}
                </span>
                <button
                  onClick={onLogout}
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-stone-100 transition-colors cursor-pointer"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Mobile Sub-Navigation Bar */}
      <div className="md:hidden flex items-center justify-around px-2 py-2 border-t border-amber-100 bg-white overflow-x-auto text-xs">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1 whitespace-nowrap transition-colors ${
                isActive
                  ? 'bg-amber-100 text-amber-900 font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
};
