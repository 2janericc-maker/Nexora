import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage, handleFirestoreError, OperationType } from './config';
import type {
  UserProfile,
  InvestmentContract,
  DepositRecord,
  WithdrawalRecord,
  CouponRecord,
  AppSettings,
  RouletteLogRecord,
} from '../types';

const USERS_COL = 'users';
const INVESTMENTS_COL = 'investments';
const DEPOSITS_COL = 'deposits';
const WITHDRAWALS_COL = 'withdrawals';
const COUPONS_COL = 'coupons';
const SETTINGS_COL = 'settings';
const ROULETTE_LOGS_COL = 'roulette_logs';

// Helper to generate referral code
export function generateReferralCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = 'NEX';
  for (let i = 0; i < 5; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// -------------------------------------------------------------
// APP SETTINGS INITIALIZATION & SUBSCRIPTION
// -------------------------------------------------------------
const DEFAULT_SETTINGS: AppSettings = {
  activeDepositQrUrl:
    'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600&auto=format&fit=crop&q=80',
  communityChatLink: 'https://t.me/nexora_official_vip',
  communityQrUrl:
    'https://images.unsplash.com/photo-1595079672139-5470805086ae?w=600&auto=format&fit=crop&q=80',
};

export async function ensureDefaultSettings(): Promise<void> {
  const settingsRef = doc(db, SETTINGS_COL, 'appConfig');
  try {
    const snap = await getDoc(settingsRef);
    if (!snap.exists()) {
      await setDoc(settingsRef, DEFAULT_SETTINGS);
    }
  } catch (err) {
    console.warn('Initializing default settings:', err);
  }
}

export function subscribeToSettings(callback: (settings: AppSettings) => void) {
  const settingsRef = doc(db, SETTINGS_COL, 'appConfig');
  return onSnapshot(
    settingsRef,
    (snapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.data() as AppSettings);
      } else {
        callback(DEFAULT_SETTINGS);
      }
    },
    (err) => {
      handleFirestoreError(err, OperationType.GET, 'settings/appConfig');
    }
  );
}

export async function updateAppSettings(settings: Partial<AppSettings>): Promise<void> {
  const settingsRef = doc(db, SETTINGS_COL, 'appConfig');
  try {
    await setDoc(settingsRef, settings, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, 'settings/appConfig');
  }
}

// -------------------------------------------------------------
// AUTHENTICATION & USER MANAGEMENT
// -------------------------------------------------------------
export async function registerUser(
  mobileNumber: string,
  password: string,
  referralCodeInput?: string
): Promise<UserProfile> {
  try {
    // 1. Check if mobile already exists
    const qMobile = query(collection(db, USERS_COL), where('mobileNumber', '==', mobileNumber.trim()));
    const existingSnap = await getDocs(qMobile);
    if (!existingSnap.empty) {
      throw new Error('This mobile number is already registered. Please log in.');
    }

    // 2. Validate referral code if provided
    let referrerUserId: string | null = null;
    let initialBalance = 0;

    const trimmedRef = referralCodeInput?.trim().toUpperCase();
    if (trimmedRef) {
      const qRef = query(collection(db, USERS_COL), where('referralCode', '==', trimmedRef));
      const refSnap = await getDocs(qRef);
      if (!refSnap.empty) {
        referrerUserId = refSnap.docs[0].id;
        initialBalance = 30; // Referral signup bonus
      }
    }

    // 3. Generate a distinct referral code
    const uniqueReferralCode = generateReferralCode();
    const newUserRef = doc(collection(db, USERS_COL));
    const userId = newUserRef.id;

    const newUserData = {
      mobileNumber: mobileNumber.trim(),
      password: password.trim(),
      balance: initialBalance,
      referralCode: uniqueReferralCode,
      referredBy: referrerUserId,
      withdrawalMethod: null,
      accountName: null,
      accountNumber: null,
      claimedMissions: [],
      createdAt: serverTimestamp(),
    };

    await setDoc(newUserRef, newUserData);

    return {
      id: userId,
      ...newUserData,
      createdAt: new Date(),
    } as UserProfile;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, USERS_COL);
  }
}

export async function loginUser(mobileNumber: string, password: string): Promise<UserProfile> {
  try {
    const q = query(
      collection(db, USERS_COL),
      where('mobileNumber', '==', mobileNumber.trim()),
      where('password', '==', password.trim())
    );
    const snap = await getDocs(q);
    if (snap.empty) {
      throw new Error('Invalid mobile number or password.');
    }
    const docData = snap.docs[0].data();
    return {
      id: snap.docs[0].id,
      ...docData,
    } as UserProfile;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, USERS_COL);
  }
}

export function subscribeToUser(userId: string, callback: (user: UserProfile | null) => void) {
  const userRef = doc(db, USERS_COL, userId);
  return onSnapshot(
    userRef,
    (snapshot) => {
      if (snapshot.exists()) {
        callback({ id: snapshot.id, ...snapshot.data() } as UserProfile);
      } else {
        callback(null);
      }
    },
    (err) => {
      handleFirestoreError(err, OperationType.GET, `users/${userId}`);
    }
  );
}

export async function updateUserPayoutBinding(
  userId: string,
  method: 'GCash' | 'Maya',
  accountName: string,
  accountNumber: string
): Promise<void> {
  const userRef = doc(db, USERS_COL, userId);
  try {
    await updateDoc(userRef, {
      withdrawalMethod: method,
      accountName: accountName.trim(),
      accountNumber: accountNumber.trim(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `users/${userId}`);
  }
}

// -------------------------------------------------------------
// INVESTMENTS, FIRST-PLAN MLM COMMISSION & AUTO-CREDITING
// -------------------------------------------------------------
export function subscribeToUserInvestments(
  userId: string,
  callback: (investments: InvestmentContract[]) => void
) {
  const q = query(
    collection(db, INVESTMENTS_COL),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as InvestmentContract[];
      callback(items);
    },
    (err) => {
      handleFirestoreError(err, OperationType.GET, INVESTMENTS_COL);
    }
  );
}

export async function purchaseInvestmentPlan(
  userId: string,
  planName: string,
  cost: number,
  dailyReturn: number,
  days: number
): Promise<void> {
  try {
    await runTransaction(db, async (transaction) => {
      // 1. Fetch user doc
      const userRef = doc(db, USERS_COL, userId);
      const userSnap = await transaction.get(userRef);
      if (!userSnap.exists()) {
        throw new Error('User does not exist.');
      }
      const userData = userSnap.data() as UserProfile;
      if (userData.balance < cost) {
        throw new Error(`Insufficient wallet balance. Required: ₱${cost.toLocaleString()}, Available: ₱${userData.balance.toLocaleString()}`);
      }

      // 2. Check if this is user's first plan purchase ever
      const existingInvestmentsQuery = query(
        collection(db, INVESTMENTS_COL),
        where('userId', '==', userId),
        limit(1)
      );
      const existingInvestmentsSnap = await getDocs(existingInvestmentsQuery);
      const isFirstPlan = existingInvestmentsSnap.empty;

      // 3. Deduct plan cost from user
      transaction.update(userRef, {
        balance: userData.balance - cost,
      });

      // 4. Create new investment document
      const newInvestRef = doc(collection(db, INVESTMENTS_COL));
      transaction.set(newInvestRef, {
        userId,
        planName,
        cost,
        dailyReturn,
        daysRemaining: days,
        daysCollectedCount: 0,
        totalDays: days,
        lastCollectedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
      });

      // 5. First-Plan-Only MLM Commission payout (Level 1: 30%, Level 2: 3%, Level 3: 2%)
      if (isFirstPlan && userData.referredBy) {
        // Level 1 Referrer
        const level1Ref = doc(db, USERS_COL, userData.referredBy);
        const level1Snap = await transaction.get(level1Ref);
        if (level1Snap.exists()) {
          const l1Data = level1Snap.data() as UserProfile;
          const l1Bonus = Math.round(cost * 0.3); // 30%
          transaction.update(level1Ref, {
            balance: (l1Data.balance || 0) + l1Bonus,
          });

          // Level 2 Referrer
          if (l1Data.referredBy) {
            const level2Ref = doc(db, USERS_COL, l1Data.referredBy);
            const level2Snap = await transaction.get(level2Ref);
            if (level2Snap.exists()) {
              const l2Data = level2Snap.data() as UserProfile;
              const l2Bonus = Math.round(cost * 0.03); // 3%
              transaction.update(level2Ref, {
                balance: (l2Data.balance || 0) + l2Bonus,
              });

              // Level 3 Referrer
              if (l2Data.referredBy) {
                const level3Ref = doc(db, USERS_COL, l2Data.referredBy);
                const level3Snap = await transaction.get(level3Ref);
                if (level3Snap.exists()) {
                  const l3Data = level3Snap.data() as UserProfile;
                  const l3Bonus = Math.round(cost * 0.02); // 2%
                  transaction.update(level3Ref, {
                    balance: (l3Data.balance || 0) + l3Bonus,
                  });
                }
              }
            }
          }
        }
      }
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, INVESTMENTS_COL);
  }
}

// Auto-credit daily return when elapsed 24-hour cycles have passed
export async function claimDailyReturn(
  userId: string,
  investmentId: string
): Promise<{ creditedAmount: number }> {
  try {
    return await runTransaction(db, async (transaction) => {
      const investRef = doc(db, INVESTMENTS_COL, investmentId);
      const investSnap = await transaction.get(investRef);
      if (!investSnap.exists()) {
        throw new Error('Investment not found.');
      }
      const invest = investSnap.data() as InvestmentContract;
      if (invest.daysRemaining <= 0) {
        throw new Error('This contract has completed all return cycles.');
      }

      const userRef = doc(db, USERS_COL, userId);
      const userSnap = await transaction.get(userRef);
      if (!userSnap.exists()) {
        throw new Error('User not found.');
      }
      const user = userSnap.data() as UserProfile;

      const lastCollectedMs =
        invest.lastCollectedAt?.toMillis?.() ??
        (invest.lastCollectedAt instanceof Date
          ? invest.lastCollectedAt.getTime()
          : Date.now());

      const elapsedMs = Date.now() - lastCollectedMs;
      const DAY_MS = 24 * 60 * 60 * 1000;
      const elapsedCycles = Math.floor(elapsedMs / DAY_MS);

      if (elapsedCycles <= 0) {
        throw new Error('24-hour collection cooldown is still active.');
      }

      const payableCycles = Math.min(invest.daysRemaining, elapsedCycles);
      const totalYield = payableCycles * invest.dailyReturn;

      const newDaysRemaining = invest.daysRemaining - payableCycles;
      const newDaysCollected = (invest.daysCollectedCount || 0) + payableCycles;

      transaction.update(userRef, {
        balance: (user.balance || 0) + totalYield,
      });

      transaction.update(investRef, {
        daysRemaining: newDaysRemaining,
        daysCollectedCount: newDaysCollected,
        lastCollectedAt: serverTimestamp(),
      });

      return { creditedAmount: totalYield };
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `investments/${investmentId}`);
  }
}

// -------------------------------------------------------------
// ROULETTE LOGS & EXACT PROBABILITY ENGINE
// -------------------------------------------------------------
export interface RouletteOutcome {
  name: string;
  multiplier: number;
}

// Probabilities:
// Mega Jackpot: 0.5% (10x)
// Big Win: 1.5% (4x)
// Win: 5.0% (2x)
// Small Win: 27.0% (1.5x)
// Lose: 66.0% (0x)
export function determineRouletteOutcome(): RouletteOutcome {
  const rand = Math.random() * 100; // 0 - 100
  if (rand < 0.5) {
    return { name: 'Mega Jackpot', multiplier: 10 };
  } else if (rand < 2.0) {
    // 0.5 + 1.5 = 2.0
    return { name: 'Big Win', multiplier: 4 };
  } else if (rand < 7.0) {
    // 2.0 + 5.0 = 7.0
    return { name: 'Win', multiplier: 2 };
  } else if (rand < 34.0) {
    // 7.0 + 27.0 = 34.0
    return { name: 'Small Win', multiplier: 1.5 };
  } else {
    return { name: 'Lose', multiplier: 0 };
  }
}

export async function executeRouletteSpin(
  userId: string,
  mobileNumber: string,
  betAmount: number,
  predeterminedOutcome?: RouletteOutcome
): Promise<{
  outcome: string;
  multiplier: number;
  payout: number;
  playerProfit: number;
  newBalance: number;
}> {
  // Table limits validation (50 - 300)
  if (betAmount < 50 || betAmount > 300) {
    throw new Error('Bet amount must be between ₱50 and ₱300.');
  }

  const result = predeterminedOutcome || determineRouletteOutcome();
  const payout = Math.floor(betAmount * result.multiplier);
  const playerProfit = payout - betAmount;
  const houseProfit = betAmount - payout;

  try {
    const finalBalance = await runTransaction(db, async (transaction) => {
      const userRef = doc(db, USERS_COL, userId);
      const userSnap = await transaction.get(userRef);
      if (!userSnap.exists()) {
        throw new Error('User not found.');
      }
      const user = userSnap.data() as UserProfile;
      if (user.balance < betAmount) {
        throw new Error('Insufficient balance for this bet.');
      }

      const calculatedBalance = user.balance - betAmount + payout;
      transaction.update(userRef, { balance: calculatedBalance });

      const logRef = doc(collection(db, ROULETTE_LOGS_COL));
      transaction.set(logRef, {
        userId,
        mobileNumber,
        betAmount,
        outcome: result.name,
        multiplier: result.multiplier,
        payout,
        playerProfit,
        houseProfit,
        createdAt: serverTimestamp(),
      });

      return calculatedBalance;
    });

    return {
      outcome: result.name,
      multiplier: result.multiplier,
      payout,
      playerProfit,
      newBalance: finalBalance,
    };
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, ROULETTE_LOGS_COL);
  }
}

export function subscribeToRouletteLogs(
  logLimit = 20,
  callback: (logs: RouletteLogRecord[]) => void
) {
  const q = query(
    collection(db, ROULETTE_LOGS_COL),
    orderBy('createdAt', 'desc'),
    limit(logLimit)
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const logs = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as RouletteLogRecord[];
      callback(logs);
    },
    (err) => {
      handleFirestoreError(err, OperationType.GET, ROULETTE_LOGS_COL);
    }
  );
}

// -------------------------------------------------------------
// STORAGE UPLOADS & DEPOSITS
// Explicit try/catch/finally with loading states in finally
// -------------------------------------------------------------
export async function uploadFileToStorage(
  folder: 'deposit-proofs' | 'admin-qr',
  file: File,
  onProgress?: (progress: number) => void
): Promise<string> {
  const timestamp = Date.now();
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
  const path = `${folder}/${timestamp}_${sanitizedName}`;
  const storageRef = ref(storage, path);

  try {
    const uploadResult = await uploadBytes(storageRef, file, {
      contentType: file.type,
    });
    const downloadUrl = await getDownloadURL(uploadResult.ref);
    return downloadUrl;
  } catch (storageError) {
    console.warn('Storage uploadBytes failed, falling back to base64 preservation:', storageError);
    // Robust fallback: if cloud bucket is restricted or offline, encode file so user is never stranded
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (e) => reject(new Error('Failed to read image file'));
      reader.readAsDataURL(file);
    });
  }
}

export async function submitDepositProof(
  userId: string,
  userMobile: string,
  amount: number,
  proofImageUrl: string
): Promise<string> {
  if (amount <= 0) {
    throw new Error('Please enter a valid deposit amount.');
  }
  if (!proofImageUrl) {
    throw new Error('Please upload your payment transaction screenshot.');
  }

  const depositRef = collection(db, DEPOSITS_COL);
  try {
    const newDoc = await addDoc(depositRef, {
      userId,
      userMobile,
      amount,
      proofImageUrl,
      status: 'pending',
      createdAt: serverTimestamp(),
    });
    return newDoc.id;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, DEPOSITS_COL);
  }
}

export function subscribeToUserDeposits(
  userId: string,
  callback: (deposits: DepositRecord[]) => void
) {
  const q = query(
    collection(db, DEPOSITS_COL),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as DepositRecord[];
      callback(items);
    },
    (err) => {
      handleFirestoreError(err, OperationType.GET, DEPOSITS_COL);
    }
  );
}

// -------------------------------------------------------------
// WITHDRAWALS
// -------------------------------------------------------------
export async function requestWithdrawal(
  userId: string,
  userMobile: string,
  amount: number,
  withdrawalMethod: string,
  accountName: string,
  accountNumber: string
): Promise<string> {
  if (amount < 100) {
    throw new Error('Minimum withdrawal amount is ₱100.');
  }
  if (!withdrawalMethod || !accountName || !accountNumber) {
    throw new Error('Please bind your GCash or Maya payout account first.');
  }

  try {
    return await runTransaction(db, async (transaction) => {
      const userRef = doc(db, USERS_COL, userId);
      const userSnap = await transaction.get(userRef);
      if (!userSnap.exists()) {
        throw new Error('User not found.');
      }
      const user = userSnap.data() as UserProfile;

      // Condition: User must have at least 1 active investment
      const investQuery = query(
        collection(db, INVESTMENTS_COL),
        where('userId', '==', userId),
        limit(1)
      );
      const investSnap = await getDocs(investQuery);
      if (investSnap.empty) {
        throw new Error('You must hold at least one active investment plan to withdraw.');
      }

      if (user.balance < amount) {
        throw new Error(`Insufficient balance. Available: ₱${user.balance.toLocaleString()}`);
      }

      // Deduct balance atomically
      transaction.update(userRef, {
        balance: user.balance - amount,
      });

      const withdrawalRef = doc(collection(db, WITHDRAWALS_COL));
      transaction.set(withdrawalRef, {
        userId,
        userMobile,
        amount,
        withdrawalMethod,
        accountName,
        accountNumber,
        status: 'pending',
        createdAt: serverTimestamp(),
      });

      return withdrawalRef.id;
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, WITHDRAWALS_COL);
  }
}

export function subscribeToUserWithdrawals(
  userId: string,
  callback: (withdrawals: WithdrawalRecord[]) => void
) {
  const q = query(
    collection(db, WITHDRAWALS_COL),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as WithdrawalRecord[];
      callback(items);
    },
    (err) => {
      handleFirestoreError(err, OperationType.GET, WITHDRAWALS_COL);
    }
  );
}

// -------------------------------------------------------------
// COUPON REDEMPTION & ANTI-SPAM LOCKOUT
// -------------------------------------------------------------
export async function redeemCoupon(
  userId: string,
  userMobile: string,
  rawCode: string
): Promise<{ amount: number }> {
  const code = rawCode.trim().toUpperCase();
  if (!code) {
    throw new Error('Please enter a coupon code.');
  }

  const couponRef = doc(db, COUPONS_COL, code);

  try {
    return await runTransaction(db, async (transaction) => {
      const couponSnap = await transaction.get(couponRef);
      if (!couponSnap.exists()) {
        throw new Error('Invalid coupon code. Please verify the code.');
      }
      const coupon = couponSnap.data() as CouponRecord;
      if (coupon.isUsed) {
        throw new Error('This coupon code has already been redeemed.');
      }

      const userRef = doc(db, USERS_COL, userId);
      const userSnap = await transaction.get(userRef);
      if (!userSnap.exists()) {
        throw new Error('User not found.');
      }
      const user = userSnap.data() as UserProfile;

      // Mark coupon as used
      transaction.update(couponRef, {
        isUsed: true,
        usedBy: userId,
        usedByMobile: userMobile,
        usedAt: serverTimestamp(),
      });

      // Credit balance
      transaction.update(userRef, {
        balance: (user.balance || 0) + coupon.amount,
      });

      return { amount: coupon.amount };
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `coupons/${code}`);
  }
}

// -------------------------------------------------------------
// MISSIONS & TEAM MLM STATS
// -------------------------------------------------------------
export async function claimMissionReward(
  userId: string,
  missionId: string,
  rewardAmount: number
): Promise<void> {
  const userRef = doc(db, USERS_COL, userId);
  try {
    await runTransaction(db, async (transaction) => {
      const userSnap = await transaction.get(userRef);
      if (!userSnap.exists()) {
        throw new Error('User not found.');
      }
      const user = userSnap.data() as UserProfile;
      const claimed = user.claimedMissions || [];
      if (claimed.includes(missionId)) {
        throw new Error('This mission reward has already been claimed.');
      }

      transaction.update(userRef, {
        balance: (user.balance || 0) + rewardAmount,
        claimedMissions: [...claimed, missionId],
      });
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `users/${userId}`);
  }
}

export async function fetchTeamStats(userId: string): Promise<{
  level1Count: number;
  level2Count: number;
  level3Count: number;
  level1InvestorsCount: number;
}> {
  try {
    // 1. Direct referrals (Level 1)
    const qL1 = query(collection(db, USERS_COL), where('referredBy', '==', userId));
    const snapL1 = await getDocs(qL1);
    const l1Ids = snapL1.docs.map((d) => d.id);
    const level1Count = l1Ids.length;

    // Check how many level 1 bought an investment
    let level1InvestorsCount = 0;
    if (l1Ids.length > 0) {
      // Chunk check or query
      for (const id of l1Ids) {
        const qInv = query(collection(db, INVESTMENTS_COL), where('userId', '==', id), limit(1));
        const invSnap = await getDocs(qInv);
        if (!invSnap.empty) {
          level1InvestorsCount++;
        }
      }
    }

    // 2. Level 2 referrals
    let level2Count = 0;
    const l2Ids: string[] = [];
    if (l1Ids.length > 0) {
      for (const l1Id of l1Ids) {
        const qL2 = query(collection(db, USERS_COL), where('referredBy', '==', l1Id));
        const snapL2 = await getDocs(qL2);
        level2Count += snapL2.size;
        snapL2.docs.forEach((d) => l2Ids.push(d.id));
      }
    }

    // 3. Level 3 referrals
    let level3Count = 0;
    if (l2Ids.length > 0) {
      for (const l2Id of l2Ids) {
        const qL3 = query(collection(db, USERS_COL), where('referredBy', '==', l2Id));
        const snapL3 = await getDocs(qL3);
        level3Count += snapL3.size;
      }
    }

    return {
      level1Count,
      level2Count,
      level3Count,
      level1InvestorsCount,
    };
  } catch (err) {
    console.error('Error fetching team stats:', err);
    return {
      level1Count: 0,
      level2Count: 0,
      level3Count: 0,
      level1InvestorsCount: 0,
    };
  }
}

// -------------------------------------------------------------
// ADMIN SERVICES (PROTECTED AT /admin2026)
// -------------------------------------------------------------
export function subscribeToAllDeposits(callback: (deposits: DepositRecord[]) => void) {
  const q = query(collection(db, DEPOSITS_COL), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as DepositRecord[];
      callback(items);
    },
    (err) => {
      handleFirestoreError(err, OperationType.GET, DEPOSITS_COL);
    }
  );
}

export function subscribeToAllWithdrawals(callback: (withdrawals: WithdrawalRecord[]) => void) {
  const q = query(collection(db, WITHDRAWALS_COL), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as WithdrawalRecord[];
      callback(items);
    },
    (err) => {
      handleFirestoreError(err, OperationType.GET, WITHDRAWALS_COL);
    }
  );
}

export async function approveDeposit(depositId: string): Promise<void> {
  const depositRef = doc(db, DEPOSITS_COL, depositId);
  try {
    await runTransaction(db, async (transaction) => {
      const depSnap = await transaction.get(depositRef);
      if (!depSnap.exists()) {
        throw new Error('Deposit record not found.');
      }
      const dep = depSnap.data() as DepositRecord;
      if (dep.status !== 'pending') {
        throw new Error('This deposit has already been processed.');
      }

      const userRef = doc(db, USERS_COL, dep.userId);
      const userSnap = await transaction.get(userRef);
      if (!userSnap.exists()) {
        throw new Error('User associated with this deposit not found.');
      }
      const user = userSnap.data() as UserProfile;

      // Credit user's balance
      transaction.update(userRef, {
        balance: (user.balance || 0) + dep.amount,
      });

      // Update deposit status
      transaction.update(depositRef, {
        status: 'approved',
        processedAt: serverTimestamp(),
      });
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `deposits/${depositId}`);
  }
}

export async function rejectDeposit(depositId: string, reason?: string): Promise<void> {
  const depositRef = doc(db, DEPOSITS_COL, depositId);
  try {
    await updateDoc(depositRef, {
      status: 'rejected',
      rejectionReason: reason || 'Transaction could not be verified.',
      processedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `deposits/${depositId}`);
  }
}

export async function approveWithdrawal(withdrawalId: string): Promise<void> {
  const withdrawalRef = doc(db, WITHDRAWALS_COL, withdrawalId);
  try {
    await updateDoc(withdrawalRef, {
      status: 'paid',
      processedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `withdrawals/${withdrawalId}`);
  }
}

export async function rejectWithdrawal(withdrawalId: string, reason?: string): Promise<void> {
  const withdrawalRef = doc(db, WITHDRAWALS_COL, withdrawalId);
  try {
    await runTransaction(db, async (transaction) => {
      const withSnap = await transaction.get(withdrawalRef);
      if (!withSnap.exists()) {
        throw new Error('Withdrawal record not found.');
      }
      const withRec = withSnap.data() as WithdrawalRecord;
      if (withRec.status !== 'pending') {
        throw new Error('This withdrawal has already been processed.');
      }

      const userRef = doc(db, USERS_COL, withRec.userId);
      const userSnap = await transaction.get(userRef);
      if (userSnap.exists()) {
        const user = userSnap.data() as UserProfile;
        // Refund deducted amount back to user's balance
        transaction.update(userRef, {
          balance: (user.balance || 0) + withRec.amount,
        });
      }

      transaction.update(withdrawalRef, {
        status: 'rejected',
        rejectionReason: reason || 'Account details invalid or unverified.',
        processedAt: serverTimestamp(),
      });
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `withdrawals/${withdrawalId}`);
  }
}

export async function createCoupon(code: string, amount: number): Promise<void> {
  const cleanCode = code.trim().toUpperCase();
  if (!cleanCode || amount <= 0) {
    throw new Error('Invalid coupon code or amount.');
  }
  const couponRef = doc(db, COUPONS_COL, cleanCode);
  try {
    const snap = await getDoc(couponRef);
    if (snap.exists()) {
      throw new Error(`Coupon "${cleanCode}" already exists.`);
    }
    await setDoc(couponRef, {
      code: cleanCode,
      amount,
      isUsed: false,
      usedBy: null,
      usedAt: null,
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `coupons/${cleanCode}`);
  }
}

export function subscribeToAllCoupons(callback: (coupons: CouponRecord[]) => void) {
  const q = query(collection(db, COUPONS_COL), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as CouponRecord[];
      callback(items);
    },
    (err) => {
      handleFirestoreError(err, OperationType.GET, COUPONS_COL);
    }
  );
}

export function subscribeToAllUsers(callback: (users: UserProfile[]) => void) {
  const q = query(collection(db, USERS_COL), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as UserProfile[];
      callback(items);
    },
    (err) => {
      handleFirestoreError(err, OperationType.GET, USERS_COL);
    }
  );
}
