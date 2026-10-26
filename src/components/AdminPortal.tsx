import React, { useState, useEffect } from 'react';
import {
  Lock,
  ArrowDownCircle,
  ArrowUpCircle,
  QrCode,
  Ticket,
  Users,
  Coins,
  CheckCircle2,
  XCircle,
  Upload,
  Loader2,
  Search,
  ArrowLeft,
  AlertCircle,
  Image as ImageIcon,
} from 'lucide-react';
import type {
  DepositRecord,
  WithdrawalRecord,
  CouponRecord,
  AppSettings,
  RouletteLogRecord,
  UserProfile,
} from '../types';
import {
  subscribeToAllDeposits,
  subscribeToAllWithdrawals,
  subscribeToAllCoupons,
  subscribeToAllUsers,
  subscribeToRouletteLogs,
  approveDeposit,
  rejectDeposit,
  approveWithdrawal,
  rejectWithdrawal,
  createCoupon,
  updateAppSettings,
  uploadFileToStorage,
} from '../firebase/services';

interface AdminPortalProps {
  settings: AppSettings;
  onExitAdmin: () => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({ settings, onExitAdmin }) => {
  // Authentication State
  const [isAdminAuth, setIsAdminAuth] = useState(false);
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);

  // Active Admin Tab
  const [tab, setTab] = useState<'deposits' | 'withdrawals' | 'roulette' | 'qr' | 'coupons' | 'users'>('deposits');

  // Subscribed Data
  const [deposits, setDeposits] = useState<DepositRecord[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRecord[]>([]);
  const [rouletteLogs, setRouletteLogs] = useState<RouletteLogRecord[]>([]);
  const [coupons, setCoupons] = useState<CouponRecord[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);

  // Action Loading States
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Coupon Creation Form
  const [newCouponCode, setNewCouponCode] = useState('');
  const [newCouponAmount, setNewCouponAmount] = useState<number>(100);
  const [isCreatingCoupon, setIsCreatingCoupon] = useState(false);
  const [couponSuccess, setCouponSuccess] = useState<string | null>(null);

  // Settings QR & Community Form
  const [chatLinkInput, setChatLinkInput] = useState(settings.communityChatLink || '');
  const [isUploadingDepositQr, setIsUploadingDepositQr] = useState(false);
  const [isUploadingCommunityQr, setIsUploadingCommunityQr] = useState(false);
  const [settingsNotice, setSettingsNotice] = useState<string | null>(null);

  // Image Preview Modal
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Search filters
  const [userSearch, setUserSearch] = useState('');

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminUsername.trim() === 'nexora2026' && adminPassword.trim() === 'nexora2026') {
      setIsAdminAuth(true);
      setAuthError(null);
    } else {
      setAuthError('Authentication failed. Invalid administrator credentials.');
    }
  };

  useEffect(() => {
    if (!isAdminAuth) return;

    const unsubDep = subscribeToAllDeposits((items) => setDeposits(items));
    const unsubWith = subscribeToAllWithdrawals((items) => setWithdrawals(items));
    const unsubLogs = subscribeToRouletteLogs(100, (items) => setRouletteLogs(items));
    const unsubCoup = subscribeToAllCoupons((items) => setCoupons(items));
    const unsubUsers = subscribeToAllUsers((items) => setUsers(items));

    return () => {
      unsubDep();
      unsubWith();
      unsubLogs();
      unsubCoup();
      unsubUsers();
    };
  }, [isAdminAuth]);

  useEffect(() => {
    if (settings.communityChatLink) {
      setChatLinkInput(settings.communityChatLink);
    }
  }, [settings]);

  const handleApproveDeposit = async (depId: string) => {
    setProcessingId(depId);
    setActionError(null);
    try {
      await approveDeposit(depId);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to approve deposit.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectDeposit = async (depId: string) => {
    setProcessingId(depId);
    setActionError(null);
    try {
      await rejectDeposit(depId, 'Transaction could not be verified by auditor.');
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to reject deposit.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleApproveWithdrawal = async (withId: string) => {
    setProcessingId(withId);
    setActionError(null);
    try {
      await approveWithdrawal(withId);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to approve withdrawal.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectWithdrawal = async (withId: string) => {
    setProcessingId(withId);
    setActionError(null);
    try {
      await rejectWithdrawal(withId, 'Rejected by admin: Account details invalid.');
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to reject withdrawal.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleCreateCouponSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCouponCode.trim() || newCouponAmount <= 0) return;

    setIsCreatingCoupon(true);
    setCouponSuccess(null);
    setActionError(null);

    try {
      await createCoupon(newCouponCode, newCouponAmount);
      setCouponSuccess(`Coupon "${newCouponCode.toUpperCase()}" created successfully!`);
      setNewCouponCode('');
      setTimeout(() => setCouponSuccess(null), 3000);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to create coupon.');
    } finally {
      setIsCreatingCoupon(false);
    }
  };

  const handleDepositQrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];

    setIsUploadingDepositQr(true);
    setSettingsNotice(null);
    setActionError(null);

    try {
      console.log('Uploading Deposit QR to admin-qr/...', file.name, `${file.size} bytes`);
      const url = await uploadFileToStorage('admin-qr', file);
      await updateAppSettings({ activeDepositQrUrl: url });
      setSettingsNotice('Official Deposit QR Code updated successfully!');
      setTimeout(() => setSettingsNotice(null), 3500);
    } catch (err) {
      console.error("Upload error:", err);
      const msg = err instanceof Error ? err.message : 'Failed to upload Deposit QR. Please verify image file format and permissions.';
      setActionError(`Deposit QR Upload Failed: ${msg}`);
    } finally {
      setIsUploadingDepositQr(false);
      e.target.value = '';
    }
  };

  const handleCommunityQrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];

    setIsUploadingCommunityQr(true);
    setSettingsNotice(null);
    setActionError(null);

    try {
      console.log('Uploading Community QR to admin-qr/...', file.name, `${file.size} bytes`);
      const url = await uploadFileToStorage('admin-qr', file);
      await updateAppSettings({ communityQrUrl: url });
      setSettingsNotice('Community QR Code updated successfully!');
      setTimeout(() => setSettingsNotice(null), 3500);
    } catch (err) {
      console.error("Upload error:", err);
      const msg = err instanceof Error ? err.message : 'Failed to upload Community QR. Please verify image file format and permissions.';
      setActionError(`Community QR Upload Failed: ${msg}`);
    } finally {
      setIsUploadingCommunityQr(false);
      e.target.value = '';
    }
  };

  const handleSaveChatLink = async () => {
    try {
      await updateAppSettings({ communityChatLink: chatLinkInput.trim() });
      setSettingsNotice('Community Chat Link saved successfully!');
      setTimeout(() => setSettingsNotice(null), 3000);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to save chat link.');
    }
  };

  // Login Screen if not authenticated (NO credentials hint shown)
  if (!isAdminAuth) {
    return (
      <div className="min-h-screen bg-[#FAF9F5] flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-white border border-stone-200 rounded-3xl p-8 shadow-xl">
          <div className="text-center mb-6">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 mb-3">
              <Lock className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">System Admin Portal</h2>
            <p className="text-xs text-slate-500 mt-1">Authorized personnel only.</p>
          </div>

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 block">Admin Username</label>
              <input
                type="text"
                value={adminUsername}
                onChange={(e) => setAdminUsername(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-stone-50 border border-stone-200 focus:border-amber-500 focus:bg-white focus:outline-none text-slate-900 text-xs"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 block">Admin Password</label>
              <input
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-stone-50 border border-stone-200 focus:border-amber-500 focus:bg-white focus:outline-none text-slate-900 text-xs"
                required
              />
            </div>

            {authError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md shadow-amber-500/20"
            >
              Sign In to Admin Console
            </button>
          </form>

          <button
            onClick={onExitAdmin}
            className="w-full mt-4 text-xs font-semibold text-slate-400 hover:text-slate-600 text-center block cursor-pointer"
          >
            &larr; Return to Application
          </button>
        </div>
      </div>
    );
  }

  const pendingDeposits = deposits.filter((d) => d.status === 'pending');
  const processedDeposits = deposits.filter((d) => d.status !== 'pending');

  const pendingWithdrawals = withdrawals.filter((w) => w.status === 'pending');
  const processedWithdrawals = withdrawals.filter((w) => w.status !== 'pending');

  const filteredUsers = users.filter(
    (u) =>
      u.mobileNumber.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.referralCode?.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.accountName?.toLowerCase().includes(userSearch.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#FAF9F5] text-slate-900">
      {/* Admin Top Navigation */}
      <header className="sticky top-0 z-30 bg-white border-b border-amber-200/80 px-6 py-4 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 font-black text-sm">
            N
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span>Nexora Admin Console</span>
              <span className="text-[10px] bg-amber-100 text-amber-800 border border-amber-300 px-2 py-0.5 rounded-full font-mono font-bold">
                v2026.1
              </span>
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onExitAdmin}
            className="px-3.5 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Public App</span>
          </button>
          <button
            onClick={() => setIsAdminAuth(false)}
            className="px-3.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-colors cursor-pointer"
          >
            Lock Admin
          </button>
        </div>
      </header>

      {/* Admin Subnav Tabs */}
      <div className="bg-white/80 border-b border-stone-200 px-6 flex items-center gap-2 overflow-x-auto">
        <button
          onClick={() => setTab('deposits')}
          className={`py-3 px-3 text-xs font-bold border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer ${
            tab === 'deposits'
              ? 'border-amber-600 text-amber-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <ArrowDownCircle className="w-4 h-4" />
          <span>Deposits ({pendingDeposits.length} Pending)</span>
        </button>

        <button
          onClick={() => setTab('withdrawals')}
          className={`py-3 px-3 text-xs font-bold border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer ${
            tab === 'withdrawals'
              ? 'border-amber-600 text-amber-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <ArrowUpCircle className="w-4 h-4" />
          <span>Withdrawals ({pendingWithdrawals.length} Pending)</span>
        </button>

        <button
          onClick={() => setTab('roulette')}
          className={`py-3 px-3 text-xs font-bold border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer ${
            tab === 'roulette'
              ? 'border-amber-600 text-amber-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Coins className="w-4 h-4" />
          <span>Roulette Audit Logs</span>
        </button>

        <button
          onClick={() => setTab('qr')}
          className={`py-3 px-3 text-xs font-bold border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer ${
            tab === 'qr'
              ? 'border-amber-600 text-amber-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <QrCode className="w-4 h-4" />
          <span>QR &amp; Community Settings</span>
        </button>

        <button
          onClick={() => setTab('coupons')}
          className={`py-3 px-3 text-xs font-bold border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer ${
            tab === 'coupons'
              ? 'border-amber-600 text-amber-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Ticket className="w-4 h-4" />
          <span>Coupon Management</span>
        </button>

        <button
          onClick={() => setTab('users')}
          className={`py-3 px-3 text-xs font-bold border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer ${
            tab === 'users'
              ? 'border-amber-600 text-amber-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>User Directory ({users.length})</span>
        </button>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {actionError && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{actionError}</span>
          </div>
        )}

        {/* 1. DEPOSITS */}
        {tab === 'deposits' && (
          <div className="space-y-8">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span>Pending Deposit Queue</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-mono font-bold">
                    {pendingDeposits.length}
                  </span>
                </h3>
              </div>

              {pendingDeposits.length === 0 ? (
                <div className="rounded-3xl bg-white border border-stone-200 p-8 text-center text-xs text-slate-500 shadow-xs">
                  No deposits awaiting verification.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {pendingDeposits.map((dep) => (
                    <div
                      key={dep.id}
                      className="rounded-3xl bg-white border border-stone-200/90 p-5 space-y-4 shadow-sm"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                            ID: {dep.id.slice(0, 8)}
                          </span>
                          <span className="text-sm font-bold text-slate-900 font-mono">
                            {dep.userMobile || dep.userId.slice(0, 10)}
                          </span>
                        </div>
                        <span className="text-base font-extrabold text-amber-700 font-mono tabular-nums">
                          ₱{dep.amount.toLocaleString()}
                        </span>
                      </div>

                      {/* Screenshot */}
                      <div
                        onClick={() => setPreviewImage(dep.proofImageUrl)}
                        className="h-44 rounded-2xl bg-stone-50 border border-stone-200 overflow-hidden cursor-pointer group relative flex items-center justify-center"
                      >
                        <img
                          src={dep.proofImageUrl}
                          alt="Deposit Proof"
                          className="w-full h-full object-contain group-hover:scale-102 transition-transform"
                        />
                        <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 flex items-center justify-center text-xs text-white font-bold gap-1 transition-opacity">
                          <ImageIcon className="w-4 h-4" />
                          <span>View Full Image</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <button
                          onClick={() => handleApproveDeposit(dep.id)}
                          disabled={processingId === dep.id}
                          className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                        >
                          {processingId === dep.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          )}
                          <span>Approve &amp; Credit</span>
                        </button>

                        <button
                          onClick={() => handleRejectDeposit(dep.id)}
                          disabled={processingId === dep.id}
                          className="py-2.5 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs flex items-center justify-center gap-1 transition-all cursor-pointer disabled:opacity-50"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Reject</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Processed Deposits List (Separate) */}
            <div className="pt-6 border-t border-stone-200">
              <h3 className="text-sm font-bold text-slate-800 mb-4">
                Processed Deposits History ({processedDeposits.length})
              </h3>
              <div className="rounded-3xl bg-white border border-stone-200 overflow-hidden shadow-xs">
                <table className="w-full text-xs text-left">
                  <thead className="bg-stone-50 text-slate-500 font-mono uppercase text-[10px] border-b border-stone-200">
                    <tr>
                      <th className="p-3.5">User</th>
                      <th className="p-3.5">Amount</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5">Receipt</th>
                      <th className="p-3.5">Processed Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {processedDeposits.map((dep) => (
                      <tr key={dep.id} className="hover:bg-stone-50/60">
                        <td className="p-3.5 font-mono">{dep.userMobile || dep.userId.slice(0, 10)}</td>
                        <td className="p-3.5 font-bold text-slate-900 font-mono tabular-nums">
                          ₱{dep.amount.toLocaleString()}
                        </td>
                        <td className="p-3.5">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              dep.status === 'approved'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            {dep.status}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <button
                            onClick={() => setPreviewImage(dep.proofImageUrl)}
                            className="text-amber-700 font-bold underline hover:text-amber-800"
                          >
                            View
                          </button>
                        </td>
                        <td className="p-3.5 text-slate-500 font-mono">
                          {dep.processedAt?.toDate
                            ? dep.processedAt.toDate().toLocaleString()
                            : dep.createdAt?.toDate
                            ? dep.createdAt.toDate().toLocaleString()
                            : 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 2. WITHDRAWALS */}
        {tab === 'withdrawals' && (
          <div className="space-y-8">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span>Pending Withdrawal Queue</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-mono font-bold">
                    {pendingWithdrawals.length}
                  </span>
                </h3>
              </div>

              {pendingWithdrawals.length === 0 ? (
                <div className="rounded-3xl bg-white border border-stone-200 p-8 text-center text-xs text-slate-500 shadow-xs">
                  No withdrawals pending disbursement.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {pendingWithdrawals.map((w) => (
                    <div
                      key={w.id}
                      className="rounded-3xl bg-white border border-stone-200/90 p-5 space-y-4 shadow-sm"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                            Ref: {w.id.slice(0, 8)}
                          </span>
                          <span className="text-sm font-bold text-slate-900 font-mono">
                            {w.userMobile || w.userId.slice(0, 10)}
                          </span>
                        </div>
                        <span className="text-base font-extrabold text-emerald-700 font-mono tabular-nums">
                          ₱{w.amount.toLocaleString()}
                        </span>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200/80 text-xs space-y-1 font-mono">
                        <div className="flex justify-between text-slate-600">
                          <span>Method:</span>
                          <span className="font-bold text-slate-900">{w.withdrawalMethod}</span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>Name:</span>
                          <span className="font-bold text-slate-900">{w.accountName}</span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>Mobile/Acct:</span>
                          <span className="font-bold text-amber-800">{w.accountNumber}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <button
                          onClick={() => handleApproveWithdrawal(w.id)}
                          disabled={processingId === w.id}
                          className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                        >
                          {processingId === w.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          )}
                          <span>Mark Paid</span>
                        </button>

                        <button
                          onClick={() => handleRejectWithdrawal(w.id)}
                          disabled={processingId === w.id}
                          className="py-2.5 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs flex items-center justify-center gap-1 transition-all cursor-pointer disabled:opacity-50"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Reject &amp; Refund</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Processed Withdrawals List (Separate) */}
            <div className="pt-6 border-t border-stone-200">
              <h3 className="text-sm font-bold text-slate-800 mb-4">
                Processed Withdrawals History ({processedWithdrawals.length})
              </h3>
              <div className="rounded-3xl bg-white border border-stone-200 overflow-hidden shadow-xs">
                <table className="w-full text-xs text-left">
                  <thead className="bg-stone-50 text-slate-500 font-mono uppercase text-[10px] border-b border-stone-200">
                    <tr>
                      <th className="p-3.5">User</th>
                      <th className="p-3.5">Amount</th>
                      <th className="p-3.5">Method &amp; Account</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5">Processed Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {processedWithdrawals.map((w) => (
                      <tr key={w.id} className="hover:bg-stone-50/60">
                        <td className="p-3.5 font-mono">{w.userMobile || w.userId.slice(0, 10)}</td>
                        <td className="p-3.5 font-bold text-emerald-700 font-mono tabular-nums">
                          ₱{w.amount.toLocaleString()}
                        </td>
                        <td className="p-3.5 font-mono">
                          {w.withdrawalMethod} - {w.accountName} ({w.accountNumber})
                        </td>
                        <td className="p-3.5">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              w.status === 'paid' || w.status === 'approved'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            {w.status}
                          </span>
                        </td>
                        <td className="p-3.5 text-slate-500 font-mono">
                          {w.processedAt?.toDate
                            ? w.processedAt.toDate().toLocaleString()
                            : w.createdAt?.toDate
                            ? w.createdAt.toDate().toLocaleString()
                            : 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 3. ROULETTE LOGS */}
        {tab === 'roulette' && (
          <div className="space-y-6">
            <h3 className="text-base font-bold text-slate-900">Live Roulette Audit Trail</h3>
            <div className="rounded-3xl bg-white border border-stone-200 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-stone-50 text-slate-500 font-mono uppercase text-[10px] border-b border-stone-200">
                    <tr>
                      <th className="p-3.5">Mobile Number</th>
                      <th className="p-3.5">Bet Amount</th>
                      <th className="p-3.5">Outcome</th>
                      <th className="p-3.5">Multiplier</th>
                      <th className="p-3.5">Payout</th>
                      <th className="p-3.5">Player Net</th>
                      <th className="p-3.5">House Net</th>
                      <th className="p-3.5">Date &amp; Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 font-mono">
                    {rouletteLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-stone-50/60">
                        <td className="p-3.5 font-bold text-slate-900">{log.mobileNumber}</td>
                        <td className="p-3.5 tabular-nums text-slate-700">₱{log.betAmount}</td>
                        <td className="p-3.5">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              log.multiplier >= 4
                                ? 'bg-amber-100 text-amber-800'
                                : log.multiplier > 0
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-stone-100 text-slate-500'
                            }`}
                          >
                            {log.outcome}
                          </span>
                        </td>
                        <td className="p-3.5 font-bold text-amber-700">{log.multiplier}x</td>
                        <td className="p-3.5 font-bold text-emerald-700 tabular-nums">
                          ₱{log.payout.toLocaleString()}
                        </td>
                        <td
                          className={`p-3.5 font-bold tabular-nums ${
                            log.playerProfit > 0
                              ? 'text-emerald-700'
                              : log.playerProfit < 0
                              ? 'text-rose-600'
                              : 'text-slate-500'
                          }`}
                        >
                          {log.playerProfit > 0 ? `+₱${log.playerProfit}` : `₱${log.playerProfit}`}
                        </td>
                        <td
                          className={`p-3.5 font-bold tabular-nums ${
                            log.houseProfit > 0
                              ? 'text-emerald-700'
                              : log.houseProfit < 0
                              ? 'text-rose-600'
                              : 'text-slate-500'
                          }`}
                        >
                          {log.houseProfit > 0 ? `+₱${log.houseProfit}` : `₱${log.houseProfit}`}
                        </td>
                        <td className="p-3.5 text-slate-500 text-[11px]">
                          {log.createdAt?.toDate ? log.createdAt.toDate().toLocaleString() : 'Just now'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 4. QR & COMMUNITY SETTINGS */}
        {tab === 'qr' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="rounded-3xl bg-white border border-stone-200/90 p-6 sm:p-8 space-y-4 shadow-sm">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <QrCode className="w-5 h-5 text-amber-600" />
                <span>Official Deposit QR Code</span>
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Upload your official GCash or Maya deposit QR code. Saves to Firebase Storage and updates user deposit screens immediately.
              </p>

              <div className="w-48 h-48 bg-stone-50 rounded-2xl p-3 flex items-center justify-center border border-stone-200 mx-auto overflow-hidden">
                {settings.activeDepositQrUrl ? (
                  <img
                    src={settings.activeDepositQrUrl}
                    alt="Active Deposit QR"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <span className="text-slate-900 text-xs font-bold">No QR Uploaded</span>
                )}
              </div>

              <label
                className={`w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-sm ${
                  isUploadingDepositQr ? 'opacity-50 pointer-events-none cursor-not-allowed' : 'cursor-pointer'
                }`}
              >
                {isUploadingDepositQr ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Uploading QR Image to admin-qr/...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span>Upload New Deposit QR</span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleDepositQrUpload}
                  disabled={isUploadingDepositQr}
                  className="hidden"
                />
              </label>
            </div>

            <div className="rounded-3xl bg-white border border-stone-200/90 p-6 sm:p-8 space-y-4 shadow-sm">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-600" />
                <span>Dedicated Community Channel &amp; QR</span>
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Configures the dedicated Community QR Code and Community Chat Link (strictly separate from payment deposit QR).
              </p>

              <div className="w-48 h-48 bg-stone-50 rounded-2xl p-3 flex items-center justify-center border border-stone-200 mx-auto overflow-hidden">
                {settings.communityQrUrl ? (
                  <img
                    src={settings.communityQrUrl}
                    alt="Community QR"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <span className="text-slate-900 text-xs font-bold">No Community QR</span>
                )}
              </div>

              <label
                className={`w-full py-3 px-4 rounded-xl bg-stone-100 hover:bg-stone-200 text-slate-800 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all border border-stone-200 ${
                  isUploadingCommunityQr ? 'opacity-50 pointer-events-none cursor-not-allowed' : 'cursor-pointer'
                }`}
              >
                {isUploadingCommunityQr ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Uploading Community QR to admin-qr/...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span>Upload Community Channel QR</span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleCommunityQrUpload}
                  disabled={isUploadingCommunityQr}
                  className="hidden"
                />
              </label>

              <div className="space-y-1.5 pt-2">
                <label className="text-xs font-semibold text-slate-700 block">
                  Community Chat Link (Telegram/WhatsApp)
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={chatLinkInput}
                    onChange={(e) => setChatLinkInput(e.target.value)}
                    className="flex-1 px-4 py-2 rounded-xl bg-stone-50 border border-stone-200 focus:border-amber-500 focus:outline-none text-slate-900 text-xs font-mono"
                    placeholder="https://t.me/..."
                  />
                  <button
                    onClick={handleSaveChatLink}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer"
                  >
                    Save
                  </button>
                </div>
              </div>

              {settingsNotice && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{settingsNotice}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 5. COUPONS */}
        {tab === 'coupons' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-5 rounded-3xl bg-white border border-stone-200/90 p-6 sm:p-8 space-y-4 shadow-sm">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Ticket className="w-5 h-5 text-amber-600" />
                <span>Create One-Time Coupon</span>
              </h3>
              <p className="text-xs text-slate-500">
                Generate single-use bonus codes redeemable by users in the mobile app.
              </p>

              <form onSubmit={handleCreateCouponSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">Coupon Code</label>
                  <input
                    type="text"
                    value={newCouponCode}
                    onChange={(e) => setNewCouponCode(e.target.value.toUpperCase())}
                    className="w-full px-4 py-2.5 rounded-xl bg-stone-50 border border-stone-200 focus:border-amber-500 focus:outline-none text-slate-900 font-mono uppercase font-bold text-xs"
                    placeholder="e.g. VIP200"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">
                    Reward Amount (₱ PHP)
                  </label>
                  <input
                    type="number"
                    min={10}
                    value={newCouponAmount || ''}
                    onChange={(e) => setNewCouponAmount(Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl bg-stone-50 border border-stone-200 focus:border-amber-500 focus:outline-none text-slate-900 font-mono font-bold text-xs"
                    placeholder="100"
                    required
                  />
                </div>

                {couponSuccess && (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{couponSuccess}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isCreatingCoupon}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50"
                >
                  {isCreatingCoupon ? 'Creating...' : 'Create Coupon Code'}
                </button>
              </form>
            </div>

            <div className="lg:col-span-7 rounded-3xl bg-white border border-stone-200/90 p-6 sm:p-8 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 mb-3">All Issued Coupons ({coupons.length})</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-stone-50 text-slate-500 font-mono uppercase text-[10px] border-b border-stone-200">
                    <tr>
                      <th className="p-3">Code</th>
                      <th className="p-3">Amount</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Redeemed By</th>
                      <th className="p-3">Redeemed At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 font-mono">
                    {coupons.map((c) => (
                      <tr key={c.id} className="hover:bg-stone-50/60">
                        <td className="p-3 font-bold text-amber-700">{c.code}</td>
                        <td className="p-3 font-bold text-slate-900 tabular-nums">₱{c.amount}</td>
                        <td className="p-3">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              c.isUsed ? 'bg-stone-100 text-slate-500' : 'bg-emerald-50 text-emerald-700'
                            }`}
                          >
                            {c.isUsed ? 'Redeemed' : 'Available'}
                          </span>
                        </td>
                        <td className="p-3 text-slate-700">{c.usedByMobile || c.usedBy || '-'}</td>
                        <td className="p-3 text-slate-500 text-[11px]">
                          {c.usedAt?.toDate ? c.usedAt.toDate().toLocaleString() : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 6. USERS */}
        {tab === 'users' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h3 className="text-base font-bold text-slate-900">Registered Users Directory</h3>
              <div className="relative max-w-xs w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Search mobile, ref code..."
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-white border border-stone-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="rounded-3xl bg-white border border-stone-200 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-stone-50 text-slate-500 font-mono uppercase text-[10px] border-b border-stone-200">
                    <tr>
                      <th className="p-3.5">Mobile Number</th>
                      <th className="p-3.5">Wallet Balance</th>
                      <th className="p-3.5">Ref Code</th>
                      <th className="p-3.5">Referred By</th>
                      <th className="p-3.5">Bound Payout</th>
                      <th className="p-3.5">Joined Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 font-mono">
                    {filteredUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-stone-50/60">
                        <td className="p-3.5 font-bold text-slate-900">{u.mobileNumber}</td>
                        <td className="p-3.5 font-bold text-emerald-700 tabular-nums">
                          ₱{u.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-3.5 text-amber-700">{u.referralCode}</td>
                        <td className="p-3.5 text-slate-500">{u.referredBy ? u.referredBy.slice(0, 8) : 'None'}</td>
                        <td className="p-3.5 text-slate-700">
                          {u.withdrawalMethod ? `${u.withdrawalMethod} · ${u.accountNumber}` : 'Unbound'}
                        </td>
                        <td className="p-3.5 text-slate-500 text-[11px]">
                          {u.createdAt?.toDate ? u.createdAt.toDate().toLocaleDateString() : 'Recent'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Preview Modal */}
      {previewImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
          <div className="relative max-w-3xl w-full max-h-[90vh] bg-white rounded-3xl p-4 border border-stone-200 flex flex-col items-center">
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-3 right-3 p-1.5 rounded-xl bg-stone-100 text-slate-600 hover:text-slate-900 cursor-pointer"
            >
              <XCircle className="w-5 h-5" />
            </button>
            <img
              src={previewImage}
              alt="Receipt Preview"
              className="max-h-[80vh] w-auto object-contain rounded-xl"
            />
          </div>
        </div>
      )}
    </div>
  );
};
