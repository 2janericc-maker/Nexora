import React, { useState, useEffect } from 'react';
import { X, Ticket, AlertCircle, CheckCircle2, Loader2, Sparkles, Clock } from 'lucide-react';
import confetti from 'canvas-confetti';
import type { UserProfile } from '../types';
import { redeemCoupon } from '../firebase/services';
import { sounds } from '../utils/audio';

interface CouponModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile | null;
}

export const CouponModal: React.FC<CouponModalProps> = ({ isOpen, onClose, user }) => {
  const [couponCode, setCouponCode] = useState('');
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successAmount, setSuccessAmount] = useState<number | null>(null);

  // Anti-Spam Lockout 5-Second Timer State
  const [lockoutTimer, setLockoutTimer] = useState<number>(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (lockoutTimer > 0) {
      timer = setTimeout(() => {
        setLockoutTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearTimeout(timer);
  }, [lockoutTimer]);

  if (!isOpen) return null;

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (lockoutTimer > 0) return;

    const trimmed = couponCode.trim().toUpperCase();
    if (!trimmed) {
      setErrorMessage('Please enter a valid coupon code.');
      return;
    }

    setIsRedeeming(true);
    setErrorMessage(null);
    setSuccessAmount(null);

    try {
      const res = await redeemCoupon(user.id, user.mobileNumber, trimmed);
      sounds.playWin();
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
      setSuccessAmount(res.amount);
      setCouponCode('');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Invalid or expired coupon code.';
      setErrorMessage(message);
      // Enforce strict 5-second anti-spam lockout
      setLockoutTimer(5);
    } finally {
      setIsRedeeming(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-white border border-stone-200 rounded-3xl p-6 sm:p-8 shadow-2xl text-center">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-800 rounded-lg hover:bg-stone-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Icon */}
        <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-50 border border-amber-200/80 flex items-center justify-center text-amber-600 mb-4 shadow-xs">
          <Ticket className="w-6 h-6" />
        </div>

        <h3 className="text-xl font-bold text-slate-900 mb-1">Redeem Bonus Coupon</h3>
        <p className="text-xs text-slate-500 mb-6 leading-relaxed">
          Enter an official promo voucher code to receive instant wallet balance credit.
        </p>

        {/* Success Banner */}
        {successAmount !== null ? (
          <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs mb-6 space-y-2 animate-in fade-in">
            <CheckCircle2 className="w-9 h-9 text-emerald-600 mx-auto" />
            <h4 className="text-sm font-bold text-slate-900">Coupon Redeemed Successfully!</h4>
            <p className="font-mono text-emerald-700 text-lg font-extrabold">
              +₱{successAmount.toLocaleString()} credited to your balance
            </p>
            <button
              onClick={() => {
                setSuccessAmount(null);
                onClose();
              }}
              className="mt-3 w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleRedeem} className="space-y-4">
            <div className="space-y-1.5 text-left">
              <label className="text-xs font-semibold text-slate-700 block">
                Coupon Voucher Code
              </label>
              <input
                type="text"
                disabled={isRedeeming || lockoutTimer > 0}
                value={couponCode}
                onChange={(e) => {
                  setCouponCode(e.target.value.toUpperCase());
                  setErrorMessage(null);
                }}
                className="w-full px-4 py-3 rounded-xl bg-stone-50 border border-stone-200 focus:border-amber-500 focus:bg-white focus:outline-none text-slate-900 font-mono font-bold text-sm uppercase tracking-wider text-center disabled:opacity-50"
                placeholder="e.g. NEXVIP100"
                required
              />
            </div>

            {/* Error Message & Strict 5-Second Lockout Indicator */}
            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs space-y-1.5 text-left">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
                  <span>{errorMessage}</span>
                </div>
                {lockoutTimer > 0 && (
                  <div className="flex items-center gap-1.5 text-[11px] text-amber-800 pt-1 border-t border-rose-200/80 font-mono font-semibold">
                    <Clock className="w-3.5 h-3.5 animate-spin-slow text-amber-600" />
                    <span>Anti-Spam Lockout: Try again in {lockoutTimer}s...</span>
                  </div>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={isRedeeming || lockoutTimer > 0 || !couponCode.trim()}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-600 hover:to-amber-500 text-slate-950 font-bold text-xs uppercase tracking-wider shadow-md shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRedeeming ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying Coupon...</span>
                </>
              ) : lockoutTimer > 0 ? (
                <>
                  <Clock className="w-4 h-4" />
                  <span>Security Lockout ({lockoutTimer}s)</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Redeem Coupon</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
