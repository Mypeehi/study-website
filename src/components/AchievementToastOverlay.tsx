import React, { useEffect, useState, useRef } from 'react';
import {
  Sparkles,
  X,
  Award,
  Flame,
  Zap,
  Shield,
  BookOpen,
  Layers,
  Trophy,
  Target,
  BarChart3,
  CheckCircle2,
  ExternalLink,
  Gift,
} from 'lucide-react';
import { AchievementBadge, AchievementRarity } from '../types';
import { ACHIEVEMENT_RARITIES, ACHIEVEMENT_TIERS } from '../utils/achievements';
import { playAchievementUnlockSound, playCorrectSound } from '../utils/audio';

export interface AchievementToastItem {
  id: string; // unique toast id
  badge: AchievementBadge;
  timestamp: number;
  durationMs?: number;
}

interface AchievementToastOverlayProps {
  toasts: AchievementToastItem[];
  onDismiss: (toastId: string) => void;
  onClaim?: (badge: AchievementBadge) => void;
  onInspectBadge?: (badge: AchievementBadge) => void;
}

export const AchievementToastOverlay: React.FC<AchievementToastOverlayProps> = ({
  toasts,
  onDismiss,
  onClaim,
  onInspectBadge,
}) => {
  if (toasts.length === 0) return null;

  return (
    <aside
      aria-label="Achievement Notifications"
      className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-[9999] flex flex-col gap-3 max-w-[calc(100vw-2.5rem)] sm:max-w-md w-full pointer-events-none"
    >
      {toasts.map((toast, index) => (
        <SingleAchievementToast
          key={toast.id}
          toast={toast}
          index={index}
          onDismiss={() => onDismiss(toast.id)}
          onClaim={() => onClaim && onClaim(toast.badge)}
          onInspect={() => onInspectBadge && onInspectBadge(toast.badge)}
        />
      ))}
    </aside>
  );
};

interface SingleAchievementToastProps {
  toast: AchievementToastItem;
  index: number;
  onDismiss: () => void;
  onClaim: () => void;
  onInspect: () => void;
}

const SingleAchievementToast: React.FC<SingleAchievementToastProps> = ({
  toast,
  index,
  onDismiss,
  onClaim,
  onInspect,
}) => {
  const { badge } = toast;
  const rarityConfig = ACHIEVEMENT_RARITIES[badge.rarity || 'Common'];
  const tierConfig = ACHIEVEMENT_TIERS[badge.tier || 'Bronze'];

  const [isClaimedInToast, setIsClaimedInToast] = useState(badge.isClaimed);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(100);

  const durationMs = toast.durationMs || 7500;
  const startTimeRef = useRef<number>(Date.now());
  const remainingTimeRef = useRef<number>(durationMs);
  const animationFrameRef = useRef<number | null>(null);

  // Sound and animation on spawn
  useEffect(() => {
    playAchievementUnlockSound(badge.rarity || 'Common');
  }, [badge.id, badge.rarity]);

  // Sync claimed state if external prop changes
  useEffect(() => {
    if (badge.isClaimed) {
      setIsClaimedInToast(true);
    }
  }, [badge.isClaimed]);

  // Countdown timer with pause-on-hover
  useEffect(() => {
    let lastTick = performance.now();

    const tick = (now: number) => {
      const delta = now - lastTick;
      lastTick = now;

      if (!isPaused) {
        remainingTimeRef.current -= delta;
        const pct = Math.max(0, (remainingTimeRef.current / durationMs) * 100);
        setProgress(pct);

        if (remainingTimeRef.current <= 0) {
          onDismiss();
          return;
        }
      }

      animationFrameRef.current = requestAnimationFrame(tick);
    };

    animationFrameRef.current = requestAnimationFrame(tick);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [durationMs, isPaused, onDismiss]);

  const handleClaimClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsClaimedInToast(true);
    playCorrectSound();
    onClaim();
    // Keep toast visible for 2 seconds after claim to show gratification
    remainingTimeRef.current = Math.max(remainingTimeRef.current, 2500);
  };

  const getBadgeIcon = (iconName: string) => {
    const className = 'w-6 h-6';
    switch (iconName) {
      case 'flame':
        return <Flame className={className} />;
      case 'zap':
        return <Zap className={className} />;
      case 'award':
        return <Award className={className} />;
      case 'shield':
        return <Shield className={className} />;
      case 'book-open':
        return <BookOpen className={className} />;
      case 'layers':
        return <Layers className={className} />;
      case 'trophy':
        return <Trophy className={className} />;
      case 'target':
        return <Target className={className} />;
      case 'bar-chart':
        return <BarChart3 className={className} />;
      default:
        return <Award className={className} />;
    }
  };

  return (
    <div
      role="alert"
      aria-live="assertive"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className={`pointer-events-auto w-full rounded-2xl p-[2px] transition-all duration-300 transform shadow-2xl relative overflow-hidden animate-slideUp ${
        badge.rarity === 'Legendary'
          ? `bg-gradient-to-r ${rarityConfig.borderGradient} ${rarityConfig.badgeGlowUnlocked} ring-2 ring-amber-400/80`
          : badge.rarity === 'Epic'
          ? `bg-gradient-to-r ${rarityConfig.borderGradient} ${rarityConfig.badgeGlowUnlocked} ring-1 ring-purple-400/60`
          : badge.rarity === 'Rare'
          ? `bg-gradient-to-r ${rarityConfig.borderGradient} ${rarityConfig.badgeGlowUnlocked} ring-1 ring-cyan-400/60`
          : `bg-gradient-to-r ${rarityConfig.borderGradient} ${rarityConfig.badgeGlowUnlocked}`
      }`}
      style={{
        zIndex: 9999 - index,
      }}
    >
      <div className="bg-slate-950/95 backdrop-blur-md rounded-[14px] p-4 text-white relative overflow-hidden">
        {/* Ambient background glow matching rarity */}
        <div
          className={`absolute -top-10 -right-10 w-32 h-32 rounded-full blur-2xl pointer-events-none opacity-25 ${
            badge.rarity === 'Legendary'
              ? 'bg-amber-400'
              : badge.rarity === 'Epic'
              ? 'bg-purple-500'
              : badge.rarity === 'Rare'
              ? 'bg-cyan-400'
              : 'bg-slate-500'
          }`}
        />

        {/* Top Header Bar */}
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800/80 relative z-10">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-amber-500/20 text-amber-400">
              <Sparkles className="w-3.5 h-3.5 animate-spin-slow" />
            </span>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-400 font-mono">
              Achievement Unlocked!
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Rarity Tag */}
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-black uppercase font-mono tracking-wider border flex items-center gap-1 ${rarityConfig.tagBg} ${rarityConfig.tagBorder} ${rarityConfig.tagText}`}
            >
              <span>{rarityConfig.sparkleSymbol}</span>
              <span>{badge.rarity}</span>
            </span>

            {/* Close button */}
            <button
              type="button"
              onClick={onDismiss}
              aria-label="Dismiss notification"
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Body: Badge Icon & Title */}
        <div className="flex items-start gap-3 relative z-10">
          {/* Badge Icon Emblem */}
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border relative overflow-hidden shadow-lg ${
              badge.rarity === 'Legendary'
                ? `bg-gradient-to-br ${rarityConfig.borderGradient} ${rarityConfig.emblemRing} text-white`
                : badge.rarity === 'Epic'
                ? `bg-gradient-to-br ${rarityConfig.borderGradient} ${rarityConfig.emblemRing} text-white`
                : badge.rarity === 'Rare'
                ? `bg-gradient-to-br ${rarityConfig.borderGradient} ${rarityConfig.emblemRing} text-white`
                : `bg-slate-900 border-slate-700 text-slate-200`
            }`}
          >
            {getBadgeIcon(badge.icon)}
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0 space-y-0.5">
            <div className="flex items-center gap-1.5">
              <h4 className="font-display font-bold text-sm text-white truncate">
                {badge.title}
              </h4>
              <span className={`px-1.5 py-0.2 rounded text-[9px] font-mono border ${tierConfig.ribbonBg}`}>
                {badge.tier}
              </span>
            </div>

            <p className="text-xs text-amber-300 font-medium truncate">
              {badge.subtitle}
            </p>

            <p className="text-[11px] text-slate-400 line-clamp-1 leading-snug">
              {badge.description}
            </p>
          </div>
        </div>

        {/* Reward Bounty & Interactive Claim Action */}
        <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between gap-2 relative z-10">
          <div className="flex items-center gap-1.5 text-xs font-mono-numbers font-bold">
            <span className="text-amber-400">+{badge.xpReward} XP</span>
            {badge.freezeTokenReward && (
              <span className="text-cyan-400 text-[11px]">· +{badge.freezeTokenReward} ❄️ Token</span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onInspect}
              className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-[11px] font-medium flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span>View</span>
              <ExternalLink className="w-3 h-3" />
            </button>

            {isClaimedInToast ? (
              <div className="px-3 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[11px] font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Claimed!</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleClaimClick}
                className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 text-[11px] font-black flex items-center gap-1 shadow-md shadow-amber-500/20 cursor-pointer transition-all hover:scale-105"
              >
                <Gift className="w-3.5 h-3.5" />
                <span>Claim Bounty</span>
              </button>
            )}
          </div>
        </div>

        {/* Progress bar timer (bottom) */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-900 overflow-hidden">
          <div
            className={`h-full transition-all duration-100 ease-linear ${
              badge.rarity === 'Legendary'
                ? 'bg-amber-400'
                : badge.rarity === 'Epic'
                ? 'bg-purple-400'
                : badge.rarity === 'Rare'
                ? 'bg-cyan-400'
                : 'bg-slate-400'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
};
