import React, { useState } from 'react';
import { Users, Copy, Check, QrCode, Send, ExternalLink, ShieldCheck, Sparkles } from 'lucide-react';
import type { UserProfile, AppSettings } from '../types';

interface TeamSectionProps {
  user: UserProfile | null;
  settings: AppSettings;
  teamStats: {
    level1Count: number;
    level2Count: number;
    level3Count: number;
    level1InvestorsCount: number;
  };
}

export const TeamSection: React.FC<TeamSectionProps> = ({
  user,
  settings,
  teamStats,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://nexora.app';
  const referralLink = user ? `${baseUrl}/?ref=${user.referralCode}` : `${baseUrl}/?ref=NEX888`;

  const handleCopyLink = () => {
    if (!user) return;
    navigator.clipboard.writeText(referralLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyCode = () => {
    if (!user) return;
    navigator.clipboard.writeText(user.referralCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="py-8 sm:py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4 border-b border-amber-100 pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100/70 text-amber-900 text-xs font-semibold mb-2">
            <Users className="w-3.5 h-3.5 text-amber-600" />
            <span>Multi-Tier Affiliate Network</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Team &amp; MLM Commission Hub
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xl">
            Earn 30% direct commissions plus 2-tier sub-level network bonuses. Commissions are paid out immediately on each friend&apos;s first plan purchase.
          </p>
        </div>
      </div>

      {/* 3-Tier Commission Cards (White & Gold) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="p-6 rounded-3xl bg-white border border-stone-200/90 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono uppercase text-amber-700 font-bold tracking-wider block">
              Direct Referrals
            </span>
            <h3 className="text-lg font-bold text-slate-900">Level 1 Commission</h3>
            <p className="text-xs text-slate-500 mt-0.5">Friends who register using your link</p>
          </div>
          <div className="text-right">
            <span className="text-3xl font-extrabold text-amber-600 font-mono">30%</span>
            <span className="text-[11px] text-slate-500 block font-mono">
              {teamStats.level1Count} Members
            </span>
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-white border border-stone-200/90 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono uppercase text-emerald-700 font-bold tracking-wider block">
              Sub-Affiliates
            </span>
            <h3 className="text-lg font-bold text-slate-900">Level 2 Commission</h3>
            <p className="text-xs text-slate-500 mt-0.5">Friends invited by your Level 1</p>
          </div>
          <div className="text-right">
            <span className="text-3xl font-extrabold text-emerald-600 font-mono">3%</span>
            <span className="text-[11px] text-slate-500 block font-mono">
              {teamStats.level2Count} Members
            </span>
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-white border border-stone-200/90 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono uppercase text-blue-700 font-bold tracking-wider block">
              Extended Network
            </span>
            <h3 className="text-lg font-bold text-slate-900">Level 3 Commission</h3>
            <p className="text-xs text-slate-500 mt-0.5">Friends invited by your Level 2</p>
          </div>
          <div className="text-right">
            <span className="text-3xl font-extrabold text-blue-600 font-mono">2%</span>
            <span className="text-[11px] text-slate-500 block font-mono">
              {teamStats.level3Count} Members
            </span>
          </div>
        </div>
      </div>

      {/* First-Plan Rule Callout */}
      <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 mb-8 flex items-start gap-3 text-xs">
        <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-slate-700 leading-relaxed">
          <span className="font-bold text-slate-900">First-Plan Commission Rule:</span> Multi-level referral bonuses (30% / 3% / 2%) are distributed exclusively on the <span className="text-amber-700 font-bold">very first investment package</span> purchased by each referred user. Commissions are immediately credited directly to your available balance.
        </div>
      </div>

      {/* Links & Invitation Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-10">
        {/* Referral Link & Code */}
        <div className="lg:col-span-7 rounded-3xl bg-white border border-stone-200/90 p-6 sm:p-8 space-y-5 shadow-xs">
          <h3 className="text-lg font-bold text-slate-900">Your Personalized Referral Link</h3>

          {/* Referral Code Box */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 block">Referral Code</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={user ? user.referralCode : ''}
                className="flex-1 px-4 py-2.5 rounded-xl bg-stone-50 border border-stone-200 font-mono font-bold text-amber-700 text-sm tracking-wider"
              />
              <button
                onClick={handleCopyCode}
                className="px-4 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-xs font-bold text-slate-800 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                {copiedCode ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                <span>{copiedCode ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Full Share URL */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 block">Full Share URL</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={referralLink}
                className="flex-1 px-4 py-2.5 rounded-xl bg-stone-50 border border-stone-200 font-mono text-xs text-slate-700 truncate"
              />
              <button
                onClick={handleCopyLink}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-600 hover:to-amber-500 text-slate-950 font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-xs shadow-amber-500/20"
              >
                {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedLink ? 'Copied!' : 'Copy Link'}</span>
              </button>
            </div>
          </div>

          <p className="text-xs text-slate-500 leading-relaxed pt-2">
            Share your link across social media and messaging channels. New users who register with your link receive an immediate ₱30 signup bonus, and you unlock 30% commission upon their first package purchase!
          </p>
        </div>

        {/* QR Code */}
        <div className="lg:col-span-5 rounded-3xl bg-white border border-stone-200/90 p-6 sm:p-8 flex flex-col items-center text-center justify-center shadow-xs">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 bg-amber-50 px-3 py-1 rounded-full border border-amber-200 mb-2">
            <QrCode className="w-4 h-4 text-amber-600" />
            <span>Referral QR Code</span>
          </div>
          <p className="text-xs text-slate-500 mb-4">
            Scan directly with your phone camera to open your signup link.
          </p>

          <div className="w-44 h-44 bg-stone-50 rounded-2xl p-3 flex items-center justify-center border border-stone-200 shadow-inner">
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                referralLink
              )}`}
              alt="Your Referral QR Code"
              className="w-full h-full object-contain"
            />
          </div>
        </div>
      </div>

      {/* Mandatory Team Panel Integration: Permanent Dedicated Community QR & Link */}
      <div className="rounded-3xl bg-gradient-to-br from-white via-amber-50/40 to-amber-100/30 border border-amber-200 p-6 sm:p-8 shadow-xs">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Details */}
          <div className="lg:col-span-7 space-y-4">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 bg-amber-100/80 px-3 py-1 rounded-full border border-amber-200">
              <Send className="w-3.5 h-3.5 text-amber-600" />
              <span>Official Investor Community</span>
            </div>

            <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900">
              Connect with the Philippine Nexora Community
            </h3>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-xl">
              Stay updated with official contract launches, daily withdrawal payment receipts, system updates, and live community announcements.
            </p>

            <div className="pt-2">
              <a
                href={settings.communityChatLink || 'https://t.me/nexora_official_vip'}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-600 hover:to-amber-500 text-slate-950 font-bold text-xs uppercase tracking-wider shadow-md shadow-amber-500/20 transition-all cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Join Official Telegram Channel</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-70" />
              </a>
            </div>
          </div>

          {/* Right Community QR Code */}
          <div className="lg:col-span-5 flex flex-col items-center text-center">
            <div className="bg-white border border-stone-200/90 rounded-2xl p-4 inline-block shadow-sm">
              <div className="w-44 h-44 bg-stone-50 rounded-xl p-2 flex items-center justify-center mx-auto overflow-hidden border border-stone-200">
                {settings.communityQrUrl ? (
                  <img
                    src={settings.communityQrUrl}
                    alt="Dedicated Community QR Code"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="text-slate-900 text-xs font-bold text-center">
                    Official Community QR
                  </div>
                )}
              </div>
              <p className="text-[11px] text-slate-500 mt-2 font-mono">Dedicated Telegram Group QR</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
