import React, { useState, useEffect } from 'react';
import {
  Wallet,
  ArrowDownCircle,
  ArrowUpCircle,
  QrCode,
  Upload,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Clock,
  Check,
} from 'lucide-react';
import type {
  UserProfile,
  DepositRecord,
  WithdrawalRecord,
  AppSettings,
  InvestmentContract,
} from '../types';
import {
  updateUserPayoutBinding,
  uploadFileToStorage,
  submitDepositProof,
  requestWithdrawal,
  subscribeToUserDeposits,
  subscribeToUserWithdrawals,
} from '../firebase/services';

interface WalletSectionProps {
  user: UserProfile | null;
  settings: AppSettings;
  activeContracts: InvestmentContract[];
  onOpenPackages: () => void;
}

export const WalletSection: React.FC<WalletSectionProps> = ({
  user,
  settings,
  activeContracts,
  onOpenPackages,
}) => {
  const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw' | 'binding'>('deposit');

  // Binding Form States
  const [bindMethod, setBindMethod] = useState<'GCash' | 'Maya'>('GCash');
  const [bindAccountName, setBindAccountName] = useState('');
  const [bindAccountNumber, setBindAccountNumber] = useState('');
  const [isSavingBinding, setIsSavingBinding] = useState(false);
  const [bindSuccess, setBindSuccess] = useState(false);
  const [bindError, setBindError] = useState<string | null>(null);

  // Deposit Form States
  const [depositAmount, setDepositAmount] = useState<number>(300);
  const [depositProofFile, setDepositProofFile] = useState<File | null>(null);
  const [depositProofPreview, setDepositProofPreview] = useState<string | null>(null);
  const [isSubmittingDeposit, setIsSubmittingDeposit] = useState(false);
  const [depositSuccess, setDepositSuccess] = useState(false);
  const [depositError, setDepositError] = useState<string | null>(null);

  // Withdrawal Form States
  const [withdrawAmount, setWithdrawAmount] = useState<number>(100);
  const [isSubmittingWithdraw, setIsSubmittingWithdraw] = useState(false);
  const [withdrawSuccess, setWithdrawSuccess] = useState(false);
  const [withdrawError, setWithdrawError] = useState<string | null>(null);

  // History states
  const [depositsList, setDepositsList] = useState<DepositRecord[]>([]);
  const [withdrawalsList, setWithdrawalsList] = useState<WithdrawalRecord[]>([]);

  useEffect(() => {
    if (user) {
      if (user.withdrawalMethod) setBindMethod(user.withdrawalMethod);
      if (user.accountName) setBindAccountName(user.accountName);
      if (user.accountNumber) setBindAccountNumber(user.accountNumber);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const unsubDep = subscribeToUserDeposits(user.id, (deps) => setDepositsList(deps));
    const unsubWith = subscribeToUserWithdrawals(user.id, (withs) => setWithdrawalsList(withs));
    return () => {
      unsubDep();
      unsubWith();
    };
  }, [user]);

  const handleSaveBinding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!bindAccountName.trim() || !bindAccountNumber.trim()) {
      setBindError('Please enter both account name and mobile account number.');
      return;
    }

    setIsSavingBinding(true);
    setBindError(null);
    setBindSuccess(false);

    try {
      await updateUserPayoutBinding(user.id, bindMethod, bindAccountName, bindAccountNumber);
      setBindSuccess(true);
      setTimeout(() => setBindSuccess(false), 3000);
    } catch (err) {
      setBindError(err instanceof Error ? err.message : 'Failed to update binding.');
    } finally {
      setIsSavingBinding(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setDepositProofFile(file);
      const reader = new FileReader();
      reader.onload = () => setDepositProofPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!depositAmount || depositAmount < 50) {
      setDepositError('Minimum deposit amount is ₱50.');
      return;
    }
    if (!depositProofFile) {
      setDepositError('Please upload your payment transaction screenshot receipt.');
      return;
    }

    setIsSubmittingDeposit(true);
    setDepositError(null);
    setDepositSuccess(false);

    try {
      const proofUrl = await uploadFileToStorage('deposit-proofs', depositProofFile);
      await submitDepositProof(user.id, user.mobileNumber, depositAmount, proofUrl);

      setDepositSuccess(true);
      setDepositProofFile(null);
      setDepositProofPreview(null);
      setTimeout(() => setDepositSuccess(false), 5000);
    } catch (err) {
      setDepositError(err instanceof Error ? err.message : 'Failed to submit deposit.');
    } finally {
      setIsSubmittingDeposit(false);
    }
  };

  const handleSubmitWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!user.withdrawalMethod || !user.accountName || !user.accountNumber) {
      setWithdrawError('Please bind your GCash or Maya payout account first.');
      setActiveTab('binding');
      return;
    }

    if (activeContracts.length === 0) {
      setWithdrawError('You must hold at least one active investment plan to request a withdrawal.');
      return;
    }

    if (withdrawAmount < 100) {
      setWithdrawError('Minimum withdrawal amount is ₱100.');
      return;
    }

    if (user.balance < withdrawAmount) {
      setWithdrawError(
        `Insufficient balance. Available: ₱${user.balance.toLocaleString('en-US', {
          minimumFractionDigits: 2,
        })}`
      );
      return;
    }

    setIsSubmittingWithdraw(true);
    setWithdrawError(null);
    setWithdrawSuccess(false);

    try {
      await requestWithdrawal(
        user.id,
        user.mobileNumber,
        withdrawAmount,
        user.withdrawalMethod,
        user.accountName,
        user.accountNumber
      );
      setWithdrawSuccess(true);
      setTimeout(() => setWithdrawSuccess(false), 5000);
    } catch (err) {
      setWithdrawError(err instanceof Error ? err.message : 'Withdrawal request failed.');
    } finally {
      setIsSubmittingWithdraw(false);
    }
  };

  const isBound = Boolean(user?.withdrawalMethod && user?.accountName && user?.accountNumber);

  return (
    <div className="py-8 sm:py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4 border-b border-amber-100 pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100/70 text-amber-900 text-xs font-semibold mb-2">
            <Wallet className="w-3.5 h-3.5 text-amber-600" />
            <span>Financial Operations</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Wallet &amp; Disbursements
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xl">
            Real-time deposit top-ups via official GCash/Maya QR code and direct payouts to your bound mobile wallet.
          </p>
        </div>

        {/* User Balance Box */}
        {user && (
          <div className="p-4 rounded-2xl bg-white border border-amber-200/90 flex items-center gap-5 shadow-xs">
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-mono block">
                Available Funds
              </span>
              <span className="text-xl font-bold text-slate-900 font-mono tabular-nums">
                ₱{user.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="text-right border-l border-stone-200 pl-4">
              <span className="text-[10px] text-slate-500 uppercase font-mono block">
                Payout Binding
              </span>
              <span className="text-xs font-bold text-amber-700">
                {isBound ? `${user.withdrawalMethod} · Bound` : 'Unbound'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Tab Controls (White & Gold) */}
      <div className="flex items-center gap-2 mb-8 p-1.5 bg-stone-100/80 rounded-2xl max-w-md border border-stone-200/60">
        <button
          onClick={() => setActiveTab('deposit')}
          className={`flex-1 py-2.5 px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'deposit'
              ? 'bg-white text-slate-900 shadow-sm border border-stone-200/60'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <ArrowDownCircle className="w-3.5 h-3.5" />
          <span>Deposit</span>
        </button>
        <button
          onClick={() => setActiveTab('withdraw')}
          className={`flex-1 py-2.5 px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'withdraw'
              ? 'bg-white text-slate-900 shadow-sm border border-stone-200/60'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <ArrowUpCircle className="w-3.5 h-3.5" />
          <span>Withdraw</span>
        </button>
        <button
          onClick={() => setActiveTab('binding')}
          className={`flex-1 py-2.5 px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'binding'
              ? 'bg-white text-slate-900 shadow-sm border border-stone-200/60'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Payout Binding</span>
        </button>
      </div>

      {/* TAB 1: DEPOSIT */}
      {activeTab === 'deposit' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left: Official Deposit QR Code */}
          <div className="lg:col-span-5 rounded-3xl bg-white border border-stone-200/90 p-6 flex flex-col items-center text-center shadow-sm">
            <div className="inline-flex items-center gap-2 text-xs font-bold text-amber-800 bg-amber-50 px-3 py-1 rounded-full border border-amber-200 mb-2">
              <QrCode className="w-4 h-4 text-amber-600" />
              <span>Official Deposit QR Code</span>
            </div>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              Scan using GCash or Maya. Transfer your desired deposit amount and upload your receipt screenshot below.
            </p>

            <div className="w-56 h-56 bg-stone-50 rounded-2xl p-3 flex items-center justify-center border border-stone-200 shadow-inner overflow-hidden mb-3">
              {settings.activeDepositQrUrl ? (
                <img
                  src={settings.activeDepositQrUrl}
                  alt="Official Deposit QR Code"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="text-slate-900 text-xs font-bold">Official Deposit QR</div>
              )}
            </div>

            <div className="text-[11px] text-slate-500 space-y-1">
              <p>Supports GCash &amp; Maya QR PH</p>
              <p className="text-amber-700 font-semibold">Verify account details before submitting</p>
            </div>
          </div>

          {/* Right: Submit Proof Form */}
          <div className="lg:col-span-7 rounded-3xl bg-white border border-stone-200/90 p-6 sm:p-8 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-1">Submit Payment Verification</h3>
            <p className="text-xs text-slate-500 mb-6">
              Deposits are verified manually by system auditors and credited to your wallet balance once confirmed.
            </p>

            <form onSubmit={handleSubmitDeposit} className="space-y-4">
              {/* Deposit Amount */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 block">Sent Amount (₱ PHP)</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 font-mono font-bold">
                    ₱
                  </span>
                  <input
                    type="number"
                    min={50}
                    step={50}
                    value={depositAmount || ''}
                    onChange={(e) => setDepositAmount(Number(e.target.value))}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-stone-50 border border-stone-200 focus:border-amber-500 focus:bg-white focus:outline-none text-slate-900 font-mono font-bold text-sm"
                    placeholder="300"
                    required
                  />
                </div>
              </div>

              {/* Upload Receipt */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 block">
                  Upload Payment Screenshot (GCash / Maya Receipt)
                </label>
                <label className="border-2 border-dashed border-stone-200 hover:border-amber-400 rounded-2xl p-5 flex flex-col items-center justify-center cursor-pointer bg-stone-50/70 hover:bg-stone-50 transition-colors">
                  {depositProofPreview ? (
                    <div className="flex flex-col items-center gap-2">
                      <img
                        src={depositProofPreview}
                        alt="Proof Preview"
                        className="max-h-44 rounded-xl object-contain border border-stone-200"
                      />
                      <span className="text-[11px] font-semibold text-amber-700">Click to replace screenshot</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1.5 text-center">
                      <Upload className="w-6 h-6 text-slate-400" />
                      <span className="text-xs font-semibold text-slate-700">
                        Choose receipt image to upload
                      </span>
                      <span className="text-[11px] text-slate-400">PNG, JPG, or JPEG</span>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                    required
                  />
                </label>
              </div>

              {/* Error */}
              {depositError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
                  <span>{depositError}</span>
                </div>
              )}

              {/* Success */}
              {depositSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
                  <span>
                    Deposit request submitted successfully! Auditors are reviewing your screenshot.
                  </span>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmittingDeposit}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-600 hover:to-amber-500 text-slate-950 font-bold text-xs uppercase tracking-wider shadow-md shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmittingDeposit ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Uploading Proof &amp; Submitting...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Submit Deposit for Verification</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB 2: WITHDRAWAL */}
      {activeTab === 'withdraw' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 rounded-3xl bg-white border border-stone-200/90 p-6 sm:p-8 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Request Withdrawal</h3>

            {/* Mandatory Disclaimer Notice */}
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-3 mb-5">
              <Clock className="w-5 h-5 shrink-0 mt-0.5 text-amber-600" />
              <div className="space-y-1">
                <p className="font-bold">Important Notice:</p>
                <p className="text-amber-800/90 leading-relaxed italic">
                  &ldquo;Withdrawals are processed manually and take approximately 2 hours to receive.&rdquo;
                </p>
              </div>
            </div>

            {/* Requirements Checklist */}
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80 space-y-2.5 mb-5 text-xs">
              <div className="flex items-center gap-2.5">
                <CheckCircle2
                  className={`w-4 h-4 ${isBound ? 'text-emerald-600' : 'text-slate-300'}`}
                />
                <span className={isBound ? 'text-slate-800 font-medium' : 'text-slate-500'}>
                  GCash / Maya account details bound ({isBound ? `${user?.withdrawalMethod} - ${user?.accountNumber}` : 'Required'})
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2
                  className={`w-4 h-4 ${activeContracts.length > 0 ? 'text-emerald-600' : 'text-slate-300'}`}
                />
                <span className={activeContracts.length > 0 ? 'text-slate-800 font-medium' : 'text-slate-500'}>
                  Hold at least 1 active investment plan ({activeContracts.length} active)
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span className="text-slate-800 font-medium">Minimum withdrawal amount: ₱100</span>
              </div>
            </div>

            <form onSubmit={handleSubmitWithdrawal} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 block">
                  Withdrawal Amount (₱ PHP)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 font-mono font-bold">
                    ₱
                  </span>
                  <input
                    type="number"
                    min={100}
                    value={withdrawAmount || ''}
                    onChange={(e) => setWithdrawAmount(Number(e.target.value))}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-stone-50 border border-stone-200 focus:border-amber-500 focus:bg-white focus:outline-none text-slate-900 font-mono font-bold text-sm"
                    placeholder="100"
                    required
                  />
                </div>
              </div>

              {isBound && (
                <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200/80 text-xs space-y-1 font-mono">
                  <div className="flex justify-between text-slate-600">
                    <span>Payout Channel:</span>
                    <span className="font-bold text-slate-900">{user?.withdrawalMethod}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Account Name:</span>
                    <span className="font-bold text-slate-900">{user?.accountName}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Account Number:</span>
                    <span className="font-bold text-amber-800">{user?.accountNumber}</span>
                  </div>
                </div>
              )}

              {/* Error */}
              {withdrawError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
                  <div className="flex-1">
                    <p>{withdrawError}</p>
                    {activeContracts.length === 0 && (
                      <button
                        type="button"
                        onClick={onOpenPackages}
                        className="mt-1 text-xs font-bold text-amber-700 underline hover:text-amber-800 block cursor-pointer"
                      >
                        Acquire an Investment Plan to Unlock &rarr;
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Success */}
              {withdrawSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
                  <span>
                    Withdrawal request submitted! It has entered the disbursement queue and takes ~2 hours.
                  </span>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmittingWithdraw}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold text-xs uppercase tracking-wider shadow-md shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmittingWithdraw ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Submitting Request...</span>
                  </>
                ) : (
                  <>
                    <ArrowUpCircle className="w-4 h-4" />
                    <span>Submit Withdrawal Request</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Right Policy */}
          <div className="lg:col-span-5 rounded-3xl bg-white border border-stone-200/90 p-6 sm:p-8 space-y-4 shadow-sm">
            <h4 className="text-sm font-bold text-slate-900">Disbursement Regulations</h4>
            <ul className="text-xs text-slate-600 space-y-3 leading-relaxed">
              <li className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                <span>Withdrawal requests are processed daily between 8:00 AM and 10:00 PM Manila Time.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                <span>Minimum withdrawal amount is ₱100. There are zero platform deductions or hidden taxes.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                <span>Disbursements are sent straight to your bound GCash or Maya mobile wallet account.</span>
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* TAB 3: BINDING */}
      {activeTab === 'binding' && (
        <div className="max-w-2xl mx-auto rounded-3xl bg-white border border-stone-200/90 p-6 sm:p-8 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-1">Bind Prepaid Payout Account</h3>
          <p className="text-xs text-slate-500 mb-6">
            Link your verified Philippine mobile wallet (GCash or Maya) for direct automated disbursements.
          </p>

          <form onSubmit={handleSaveBinding} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 block">Select Provider</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setBindMethod('GCash')}
                  className={`py-3 px-4 rounded-2xl border font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    bindMethod === 'GCash'
                      ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-xs'
                      : 'bg-stone-50 border-stone-200 text-slate-500 hover:border-slate-300'
                  }`}
                >
                  <span>GCash</span>
                </button>

                <button
                  type="button"
                  onClick={() => setBindMethod('Maya')}
                  className={`py-3 px-4 rounded-2xl border font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    bindMethod === 'Maya'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-xs'
                      : 'bg-stone-50 border-stone-200 text-slate-500 hover:border-slate-300'
                  }`}
                >
                  <span>Maya (PayMaya)</span>
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 block">
                Account Full Name (As in GCash/Maya)
              </label>
              <input
                type="text"
                value={bindAccountName}
                onChange={(e) => setBindAccountName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-stone-50 border border-stone-200 focus:border-amber-500 focus:bg-white focus:outline-none text-slate-900 text-xs"
                placeholder="e.g. Juan Dela Cruz"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 block">
                Registered Mobile Number
              </label>
              <input
                type="tel"
                value={bindAccountNumber}
                onChange={(e) => setBindAccountNumber(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-stone-50 border border-stone-200 focus:border-amber-500 focus:bg-white focus:outline-none text-slate-900 font-mono text-xs"
                placeholder="09XXXXXXXXX"
                required
              />
            </div>

            {bindError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{bindError}</span>
              </div>
            )}

            {bindSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Payout details saved successfully!</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSavingBinding}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-600 hover:to-amber-500 text-slate-950 font-bold text-xs uppercase tracking-wider shadow-md shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSavingBinding ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving Changes...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Save Payout Binding</span>
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* History Tables */}
      <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Deposits History */}
        <div className="rounded-3xl bg-white border border-stone-200/90 p-6 shadow-sm">
          <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
            <ArrowDownCircle className="w-4 h-4 text-amber-600" />
            <span>Recent Deposits</span>
          </h4>
          {depositsList.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">No deposit history recorded.</p>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {depositsList.map((dep) => (
                <div
                  key={dep.id}
                  className="p-3 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-bold text-slate-900 font-mono tabular-nums">
                      ₱{dep.amount.toLocaleString()}
                    </span>
                    <span className="text-[11px] text-slate-500 block">
                      {dep.createdAt?.toDate ? dep.createdAt.toDate().toLocaleDateString() : 'Recent'}
                    </span>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase ${
                      dep.status === 'approved'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : dep.status === 'rejected'
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : 'bg-amber-50 text-amber-800 border border-amber-200'
                    }`}
                  >
                    {dep.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Withdrawals History */}
        <div className="rounded-3xl bg-white border border-stone-200/90 p-6 shadow-sm">
          <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
            <ArrowUpCircle className="w-4 h-4 text-emerald-600" />
            <span>Recent Withdrawals</span>
          </h4>
          {withdrawalsList.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">No withdrawal history recorded.</p>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {withdrawalsList.map((w) => (
                <div
                  key={w.id}
                  className="p-3 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-bold text-slate-900 font-mono tabular-nums">
                      ₱{w.amount.toLocaleString()}
                    </span>
                    <span className="text-[11px] text-slate-500 block">
                      {w.withdrawalMethod} · {w.accountNumber}
                    </span>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase ${
                      w.status === 'paid' || w.status === 'approved'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : w.status === 'rejected'
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : 'bg-amber-50 text-amber-800 border border-amber-200'
                    }`}
                  >
                    {w.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
