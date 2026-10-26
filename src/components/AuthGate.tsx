import React, { useState, useEffect } from 'react';
import {
  Lock,
  Phone,
  UserCheck,
  AlertCircle,
  Loader2,
  Sparkles,
  ShieldCheck,
  Building2,
  ArrowRight,
} from 'lucide-react';
import type { UserProfile } from '../types';
import { registerUser, loginUser } from '../firebase/services';

interface AuthGateProps {
  onSuccess: (user: UserProfile, isNewLogin: boolean) => void;
  initialReferralCode?: string;
}

export const AuthGate: React.FC<AuthGateProps> = ({ onSuccess, initialReferralCode }) => {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [mobileNumber, setMobileNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [referralCode, setReferralCode] = useState(initialReferralCode || '');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (initialReferralCode) {
      setReferralCode(initialReferralCode.toUpperCase());
      setTab('register');
    }
  }, [initialReferralCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanMobile = mobileNumber.trim();
    if (!cleanMobile || cleanMobile.length < 10) {
      setErrorMessage('Please enter a valid Philippine mobile number (e.g. 09171234567).');
      return;
    }

    if (!password.trim() || password.length < 4) {
      setErrorMessage('Password must be at least 4 characters long.');
      return;
    }

    if (tab === 'register') {
      if (password !== confirmPassword) {
        setErrorMessage('Passwords do not match. Please verify.');
        return;
      }
    }

    setIsLoading(true);

    try {
      if (tab === 'register') {
        const newUser = await registerUser(cleanMobile, password, referralCode);
        onSuccess(newUser, true);
      } else {
        const existingUser = await loginUser(cleanMobile, password);
        onSuccess(existingUser, true);
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Authentication failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F5] flex flex-col justify-between selection:bg-amber-100 selection:text-amber-900">
      {/* Top Luxury Bar */}
      <header className="w-full bg-white/80 backdrop-blur-md border-b border-amber-100/80 px-6 py-4 flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 flex items-center justify-center text-slate-950 font-black text-lg shadow-sm shadow-amber-500/20">
            N
          </div>
          <div>
            <span className="text-lg font-bold text-slate-900 tracking-tight">
              Nexora <span className="text-amber-600 font-semibold">Investment</span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-amber-800 bg-amber-50 border border-amber-200/80 px-3 py-1 rounded-full font-medium">
          <ShieldCheck className="w-4 h-4 text-amber-600" />
          <span>Members Only Portal</span>
        </div>
      </header>

      {/* Main Authentication Grid */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 rounded-3xl bg-white border border-stone-200/80 shadow-xl overflow-hidden">
          {/* Left Hero Brand Panel (White & Gold Luxury) */}
          <div className="lg:col-span-5 bg-gradient-to-br from-[#FFFDF9] via-amber-50/50 to-amber-100/30 p-8 sm:p-10 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-amber-100">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100/60 border border-amber-200 text-amber-900 text-xs font-semibold mb-6">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>Private Institutional Assets</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
                Secure Access to Philippine Property Yields
              </h2>

              <p className="text-xs sm:text-sm text-slate-600 mt-3 leading-relaxed">
                Log in to monitor your active contracts, collect automated daily earnings, play live roulette, and request instant GCash or Maya withdrawals.
              </p>
            </div>

            <div className="mt-8 space-y-3 pt-6 border-t border-amber-200/60 text-xs text-slate-600">
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600 shrink-0">
                  <Building2 className="w-3.5 h-3.5" />
                </div>
                <span>Starting packages from ₱150 with daily yields</span>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600 shrink-0">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>
                <span>24/7 Verified GCash &amp; Maya Payout Channels</span>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600 shrink-0">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <span>₱30 instant balance bonus on referral signups</span>
              </div>
            </div>
          </div>

          {/* Right Form Panel */}
          <div className="lg:col-span-7 p-8 sm:p-10 bg-white flex flex-col justify-center">
            {/* Tab Selector */}
            <div className="flex p-1 bg-stone-100/80 rounded-2xl mb-6 border border-stone-200/60">
              <button
                type="button"
                onClick={() => {
                  setTab('login');
                  setErrorMessage(null);
                }}
                className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  tab === 'login'
                    ? 'bg-white text-slate-900 shadow-sm border border-stone-200/60'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setTab('register');
                  setErrorMessage(null);
                }}
                className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  tab === 'register'
                    ? 'bg-white text-slate-900 shadow-sm border border-stone-200/60'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Register
              </button>
            </div>

            <div className="mb-5">
              <h3 className="text-xl font-bold text-slate-900">
                {tab === 'login' ? 'Sign In to Your Account' : 'Create Investor Account'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {tab === 'login'
                  ? 'Enter your mobile number and password to access the platform.'
                  : 'Register now and start earning guaranteed daily returns.'}
              </p>
            </div>

            {/* Auth Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Mobile Number */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 block">
                  Philippine Mobile Number
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Phone className="w-4 h-4" />
                  </span>
                  <input
                    type="tel"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-stone-50 border border-stone-200 focus:border-amber-500 focus:bg-white focus:outline-none text-slate-900 font-mono text-xs transition-colors"
                    placeholder="09171234567"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 block">Password</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-stone-50 border border-stone-200 focus:border-amber-500 focus:bg-white focus:outline-none text-slate-900 text-xs transition-colors"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              {/* Confirm Password (Register Only) */}
              {tab === 'register' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 block">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </span>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-stone-50 border border-stone-200 focus:border-amber-500 focus:bg-white focus:outline-none text-slate-900 text-xs transition-colors"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </div>
              )}

              {/* Referral Code (Register Only) */}
              {tab === 'register' && (
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-semibold text-slate-700 block">
                      Invitation Referral Code (Optional)
                    </label>
                    <span className="text-[11px] text-amber-700 font-semibold flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      <span>₱30 Welcome Credit</span>
                    </span>
                  </div>
                  <input
                    type="text"
                    value={referralCode}
                    onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                    className="w-full px-4 py-2.5 rounded-xl bg-stone-50 border border-stone-200 focus:border-amber-500 focus:bg-white focus:outline-none text-slate-900 font-mono text-xs uppercase tracking-wider"
                    placeholder="e.g. NEX888"
                  />
                </div>
              )}

              {/* Error Notice */}
              {errorMessage && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-600 hover:to-amber-500 text-slate-950 font-bold text-xs uppercase tracking-wider shadow-md shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying Credentials...</span>
                  </>
                ) : (
                  <>
                    <UserCheck className="w-4 h-4" />
                    <span>{tab === 'login' ? 'Sign In to Portal' : 'Create Free Account'}</span>
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-6 text-center text-xs text-slate-500 border-t border-stone-200">
        <p>Nexora Investment Corp. · All amounts denominated in Philippine Peso (₱ / PHP)</p>
      </footer>
    </div>
  );
};
