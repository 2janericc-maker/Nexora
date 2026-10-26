import React from 'react';
import { X, Send, ShieldCheck, ExternalLink } from 'lucide-react';
import type { AppSettings } from '../types';

interface CommunityModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
}

export const CommunityModal: React.FC<CommunityModalProps> = ({
  isOpen,
  onClose,
  settings,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white border border-stone-200 rounded-3xl p-6 sm:p-8 shadow-2xl text-center">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-800 rounded-lg hover:bg-stone-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon & Title */}
        <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-50 border border-amber-200/80 flex items-center justify-center text-amber-600 mb-4 shadow-xs">
          <Send className="w-6 h-6" />
        </div>

        <h3 className="text-xl font-bold text-slate-900 mb-1">
          Join the Nexora Official Community
        </h3>
        <p className="text-xs text-slate-500 mb-6 leading-relaxed">
          Connect with daily investors, receive real-time contract announcements, withdrawal proofs, and exclusive flash coupon drops.
        </p>

        {/* Dedicated Community QR Code */}
        <div className="bg-stone-50 border border-stone-200/80 rounded-2xl p-4 inline-block mx-auto mb-6 shadow-inner">
          <div className="w-48 h-48 bg-white rounded-xl p-2 flex items-center justify-center mx-auto overflow-hidden border border-stone-200">
            {settings.communityQrUrl ? (
              <img
                src={settings.communityQrUrl}
                alt="Nexora Official Community QR Code"
                referrerPolicy="no-referrer"
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="text-slate-800 text-xs text-center font-bold">
                Official Telegram Group QR
              </div>
            )}
          </div>
          <p className="text-[11px] text-slate-500 mt-2 font-mono">Scan via Telegram or WhatsApp</p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5">
          <a
            href={settings.communityChatLink || 'https://t.me/nexora_official_vip'}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-600 hover:to-amber-500 text-slate-950 font-bold text-xs uppercase tracking-wider shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>Join Community Now</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-70" />
          </a>

          <button
            onClick={onClose}
            className="w-full py-2.5 px-4 rounded-xl text-slate-600 hover:text-slate-900 bg-stone-100 hover:bg-stone-200 text-xs font-semibold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>

        <div className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Verified Official Channel · 24/7 Investor Support</span>
        </div>
      </div>
    </div>
  );
};
