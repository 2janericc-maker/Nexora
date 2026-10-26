import React, { useState } from 'react';
import { Target, Gift, Check, Loader2, Sparkles, ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';
import type { UserProfile } from '../types';
import { claimMissionReward } from '../firebase/services';
import { sounds } from '../utils/audio';

interface MissionsSectionProps {
  user: UserProfile | null;
  level1InvestorsCount: number;
  onOpenTeam: () => void;
}

interface MissionItem {
  id: string;
  name: string;
  targetCount: number;
  reward: number;
  description: string;
}

const MISSIONS: MissionItem[] = [
  {
    id: 'mission-1',
    name: 'First Signal 1',
    targetCount: 5,
    reward: 50,
    description: 'Invite 5 friends who purchase their first investment package.',
  },
  {
    id: 'mission-2',
    name: 'Inner Circle 2',
    targetCount: 10,
    reward: 100,
    description: 'Invite 10 friends who purchase their first investment package.',
  },
  {
    id: 'mission-3',
    name: 'Relay 3',
    targetCount: 15,
    reward: 150,
    description: 'Invite 15 friends who purchase their first investment package.',
  },
  {
    id: 'mission-4',
    name: 'Convergence 4',
    targetCount: 30,
    reward: 300,
    description: 'Invite 30 friends who purchase their first investment package.',
  },
  {
    id: 'mission-5',
    name: 'Constellation 5',
    targetCount: 60,
    reward: 600,
    description: 'Invite 60 friends who purchase their first investment package.',
  },
  {
    id: 'mission-6',
    name: 'Legacy Protocol 6',
    targetCount: 120,
    reward: 1200,
    description: 'Invite 120 friends who purchase their first investment package.',
  },
];

export const MissionsSection: React.FC<MissionsSectionProps> = ({
  user,
  level1InvestorsCount,
  onOpenTeam,
}) => {
  const [claimingId, setClaimingId] = useState<string | null>(null);

  const claimedMissions = user?.claimedMissions || [];

  const handleClaim = async (mission: MissionItem) => {
    if (!user || claimingId) return;

    setClaimingId(mission.id);

    try {
      await claimMissionReward(user.id, mission.id, mission.reward);
      sounds.playWin();
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch (err) {
      console.error('Claim mission error:', err);
    } finally {
      setClaimingId(null);
    }
  };

  return (
    <div className="py-8 sm:py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4 border-b border-amber-100 pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100/70 text-amber-900 text-xs font-semibold mb-2">
            <Target className="w-3.5 h-3.5 text-amber-600" />
            <span>Investor Growth Milestones</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Affiliate Reward Missions
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xl">
            Receive bonus cash rewards directly into your wallet as your personal investor network scales.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-3.5 rounded-2xl bg-white border border-amber-200/90 shadow-xs flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 font-bold">
              <Gift className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-mono block">
                Active Investors
              </span>
              <span className="text-xs font-bold text-slate-900 font-mono">
                {level1InvestorsCount} Qualified
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Missions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {MISSIONS.map((mission) => {
          const isCompleted = level1InvestorsCount >= mission.targetCount;
          const isClaimed = claimedMissions.includes(mission.id);
          const progress = Math.min(
            100,
            Math.round((level1InvestorsCount / mission.targetCount) * 100)
          );

          return (
            <div
              key={mission.id}
              className={`rounded-2xl p-6 border transition-all flex flex-col justify-between ${
                isClaimed
                  ? 'bg-stone-50 border-stone-200 opacity-75'
                  : isCompleted
                  ? 'bg-white border-amber-400 shadow-md shadow-amber-500/10'
                  : 'bg-white border-stone-200/90 shadow-xs'
              }`}
            >
              <div>
                <div className="flex items-start justify-between mb-2">
                  <span className="text-[10px] font-mono uppercase text-amber-700 font-bold tracking-wider">
                    Tier Milestone
                  </span>
                  <span className="text-sm font-bold text-emerald-700 font-mono tabular-nums flex items-center gap-1">
                    <Gift className="w-3.5 h-3.5 text-amber-500" />
                    ₱{mission.reward.toLocaleString()}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 mb-1">{mission.name}</h3>
                <p className="text-xs text-slate-500 mb-5 leading-relaxed">{mission.description}</p>

                {/* Progress Bar */}
                <div className="space-y-1.5 mb-6">
                  <div className="flex justify-between text-[11px] text-slate-500">
                    <span>
                      Progress: {Math.min(level1InvestorsCount, mission.targetCount)} / {mission.targetCount}
                    </span>
                    <span className="font-mono font-semibold text-slate-700">{progress}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-stone-100 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        isCompleted ? 'bg-emerald-500' : 'bg-gradient-to-r from-amber-400 to-amber-600'
                      }`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Action */}
              <div>
                {isClaimed ? (
                  <div className="w-full py-2.5 rounded-xl bg-stone-100 border border-stone-200 flex items-center justify-center gap-1.5 text-xs font-bold text-slate-500">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>Claimed (+₱{mission.reward})</span>
                  </div>
                ) : isCompleted ? (
                  <button
                    onClick={() => handleClaim(mission)}
                    disabled={claimingId === mission.id}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-600 hover:to-amber-500 text-slate-950 font-bold text-xs uppercase tracking-wider shadow-md shadow-amber-500/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer animate-pulse"
                  >
                    {claimingId === mission.id ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Claiming Reward...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Claim ₱{mission.reward} Reward</span>
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    onClick={onOpenTeam}
                    className="w-full py-2.5 rounded-xl bg-stone-50 hover:bg-stone-100 border border-stone-200 text-xs font-bold text-slate-700 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <span>Invite Friends</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
