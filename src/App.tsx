/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import type {
  UserProfile,
  InvestmentContract,
  AppSettings,
} from './types';
import {
  ensureDefaultSettings,
  subscribeToSettings,
  subscribeToUser,
  subscribeToUserInvestments,
  fetchTeamStats,
} from './firebase/services';
import { Header } from './components/Header';
import { AuthGate } from './components/AuthGate';
import { InvestmentsSection } from './components/InvestmentsSection';
import { ActiveContracts } from './components/ActiveContracts';
import { RouletteSection } from './components/RouletteSection';
import { WalletSection } from './components/WalletSection';
import { MissionsSection } from './components/MissionsSection';
import { TeamSection } from './components/TeamSection';
import { CommunityModal } from './components/CommunityModal';
import { CouponModal } from './components/CouponModal';
import { AdminPortal } from './components/AdminPortal';

export type AppPage = 'packages' | 'contracts' | 'roulette' | 'wallet' | 'missions' | 'team';

export default function App() {
  // Routing for Secret Admin Portal (/admin2026)
  const [isAdminRoute, setIsAdminRoute] = useState<boolean>(false);

  // Multi-Page state: 'packages' | 'contracts' | 'roulette' | 'wallet' | 'missions' | 'team'
  const [currentPage, setCurrentPage] = useState<AppPage>('packages');

  // App Settings from Firestore settings/appConfig
  const [settings, setSettings] = useState<AppSettings>({
    activeDepositQrUrl: '',
    communityChatLink: 'https://t.me/nexora_official_vip',
    communityQrUrl: '',
  });

  // User & Real-time State (Direct Firestore streams, no mock data, no localStorage caching for balances)
  const [currentUserId, setCurrentUserId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('nexora_active_session_uid');
    }
    return null;
  });
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [activeContracts, setActiveContracts] = useState<InvestmentContract[]>([]);
  const [teamStats, setTeamStats] = useState({
    level1Count: 0,
    level2Count: 0,
    level3Count: 0,
    level1InvestorsCount: 0,
  });

  // Modal States
  const [isCouponOpen, setIsCouponOpen] = useState(false);
  const [isCommunityOpen, setIsCommunityOpen] = useState(false);

  // Referral code captured from URL ?ref=...
  const [initialRefCode, setInitialRefCode] = useState<string>('');

  // 1. Detect Secret Admin Route & Hash Page Routing
  useEffect(() => {
    const handleUrlChange = () => {
      const path = window.location.pathname.toLowerCase();
      const hash = window.location.hash.toLowerCase().replace('#', '');

      if (path.includes('/admin2026') || hash.includes('admin2026')) {
        setIsAdminRoute(true);
      } else {
        setIsAdminRoute(false);
      }

      // Check ?ref= query parameter
      const params = new URLSearchParams(window.location.search);
      const refParam = params.get('ref');
      if (refParam) {
        setInitialRefCode(refParam.toUpperCase());
      }

      // Multi-Page routing from hash
      const validPages: AppPage[] = ['packages', 'contracts', 'roulette', 'wallet', 'missions', 'team'];
      if (validPages.includes(hash as AppPage)) {
        setCurrentPage(hash as AppPage);
      }
    };

    handleUrlChange();
    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('hashchange', handleUrlChange);
    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('hashchange', handleUrlChange);
    };
  }, []);

  // 2. Initialize default settings & subscribe to settings
  useEffect(() => {
    ensureDefaultSettings().catch(console.error);
    const unsub = subscribeToSettings((data) => {
      setSettings(data);
    });
    return () => unsub();
  }, []);

  // 3. Real-time User Profile & Investments subscription
  useEffect(() => {
    if (!currentUserId) {
      setCurrentUser(null);
      setActiveContracts([]);
      return;
    }

    const unsubUser = subscribeToUser(currentUserId, (userProfile) => {
      setCurrentUser(userProfile);
    });

    const unsubInvest = subscribeToUserInvestments(currentUserId, (contracts) => {
      setActiveContracts(contracts);
    });

    fetchTeamStats(currentUserId).then(setTeamStats).catch(console.error);

    return () => {
      unsubUser();
      unsubInvest();
    };
  }, [currentUserId]);

  // Handle successful login/registration
  const handleAuthSuccess = (user: UserProfile, isNewLogin: boolean) => {
    setCurrentUserId(user.id);
    setCurrentUser(user);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('nexora_active_session_uid', user.id);
    }
    // Mandatory Rule: "Every time a user successfully logs in, a modal automatically pops up displaying the dedicated Community QR Code and Community Chat Link."
    if (isNewLogin) {
      setIsCommunityOpen(true);
    }
  };

  const handleLogout = () => {
    setCurrentUserId(null);
    setCurrentUser(null);
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('nexora_active_session_uid');
    }
  };

  const handleNavigate = (page: string) => {
    setCurrentPage(page as AppPage);
    window.location.hash = page;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // If on secret admin route, render secret Admin Portal
  if (isAdminRoute) {
    return (
      <AdminPortal
        settings={settings}
        onExitAdmin={() => {
          window.history.pushState({}, '', '/');
          setIsAdminRoute(false);
        }}
      />
    );
  }

  // CRITICAL MANDATE:
  // "Do not show the websites content when they are not logged in, Users need to Login first to see whats in the website."
  if (!currentUserId || !currentUser) {
    return (
      <AuthGate
        onSuccess={handleAuthSuccess}
        initialReferralCode={initialRefCode}
      />
    );
  }

  // Authenticated Multi-Page Application View in White & Gold Theme
  return (
    <div className="min-h-screen bg-[#FAF9F5] text-slate-900 flex flex-col font-sans selection:bg-amber-100 selection:text-amber-900">
      {/* Top Bar Header with Multi-Page Navigation */}
      <Header
        user={currentUser}
        onOpenCoupon={() => setIsCouponOpen(true)}
        onLogout={handleLogout}
        currentPage={currentPage}
        onNavigate={handleNavigate}
      />

      {/* Main Content Area: Renders the active dedicated page view */}
      <main className="flex-1">
        {currentPage === 'packages' && (
          <InvestmentsSection
            user={currentUser}
            onOpenWallet={() => handleNavigate('wallet')}
            onSuccessPurchase={() => handleNavigate('contracts')}
          />
        )}

        {currentPage === 'contracts' && (
          <ActiveContracts
            user={currentUser}
            contracts={activeContracts}
            onOpenPackages={() => handleNavigate('packages')}
          />
        )}

        {currentPage === 'roulette' && (
          <RouletteSection
            user={currentUser}
            onOpenWallet={() => handleNavigate('wallet')}
          />
        )}

        {currentPage === 'wallet' && (
          <WalletSection
            user={currentUser}
            settings={settings}
            activeContracts={activeContracts}
            onOpenPackages={() => handleNavigate('packages')}
          />
        )}

        {currentPage === 'missions' && (
          <MissionsSection
            user={currentUser}
            level1InvestorsCount={teamStats.level1InvestorsCount}
            onOpenTeam={() => handleNavigate('team')}
          />
        )}

        {currentPage === 'team' && (
          <TeamSection
            user={currentUser}
            settings={settings}
            teamStats={teamStats}
          />
        )}
      </main>

      {/* Footer in White & Gold */}
      <footer className="bg-white border-t border-amber-100/90 py-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-5 h-5 rounded-md bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 font-black text-xs">
              N
            </div>
            <span className="font-bold text-slate-900">Nexora Investment Corp.</span>
            <span>· Metro Manila, Philippines</span>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            <span>GCash &amp; Maya Supported</span>
            <span>·</span>
            <span>Philippine Peso (₱ / PHP)</span>
            <span>·</span>
            <span>Secured with Cloud Firestore</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <CouponModal
        isOpen={isCouponOpen}
        onClose={() => setIsCouponOpen(false)}
        user={currentUser}
      />

      <CommunityModal
        isOpen={isCommunityOpen}
        onClose={() => setIsCommunityOpen(false)}
        settings={settings}
      />
    </div>
  );
}
