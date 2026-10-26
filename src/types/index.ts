export interface UserProfile {
  id: string; // User UID
  mobileNumber: string;
  password?: string;
  balance: number;
  referralCode: string;
  referredBy: string | null;
  withdrawalMethod?: 'GCash' | 'Maya' | null;
  accountName?: string | null;
  accountNumber?: string | null;
  claimedMissions?: string[];
  createdAt: any;
}

export interface InvestmentContract {
  id: string;
  userId: string;
  planName: string;
  cost: number;
  dailyReturn: number;
  daysRemaining: number;
  daysCollectedCount: number;
  totalDays: number;
  lastCollectedAt: any;
  createdAt: any;
}

export interface DepositRecord {
  id: string;
  userId: string;
  userMobile?: string;
  amount: number;
  proofImageUrl: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  createdAt: any;
  processedAt?: any;
}

export interface WithdrawalRecord {
  id: string;
  userId: string;
  userMobile?: string;
  amount: number;
  withdrawalMethod: 'GCash' | 'Maya' | string;
  accountName: string;
  accountNumber: string;
  status: 'pending' | 'approved' | 'paid' | 'rejected';
  createdAt: any;
  processedAt?: any;
}

export interface CouponRecord {
  id: string;
  code: string;
  amount: number;
  isUsed: boolean;
  usedBy?: string | null;
  usedByMobile?: string | null;
  usedAt?: any | null;
  createdAt: any;
}

export interface AppSettings {
  activeDepositQrUrl: string;
  communityChatLink: string;
  communityQrUrl: string;
}

export interface RouletteLogRecord {
  id: string;
  userId: string;
  mobileNumber: string;
  betAmount: number;
  outcome: string;
  multiplier: number;
  payout: number;
  playerProfit: number;
  houseProfit: number;
  createdAt: any;
}

export interface PlanConfig {
  id: string;
  name: string;
  cost: number;
  dailyReturn: number;
  days: number;
  totalReturn: number;
  image: string;
  description: string;
}
