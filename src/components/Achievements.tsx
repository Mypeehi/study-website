import React, { useState, useMemo } from 'react';
import {
  Award,
  Flame,
  Zap,
  Shield,
  BookOpen,
  Layers,
  Trophy,
  HelpCircle,
  Target,
  BarChart3,
  CheckCircle2,
  Lock,
  Sparkles,
  ArrowRight,
  TrendingUp,
  X,
  Check,
  ChevronRight,
  Filter,
  ExternalLink,
} from 'lucide-react';
import { UserStudyState, AchievementBadge, AchievementCategory, AchievementTier, AchievementRarity } from '../types';
import {
  evaluateAchievements,
  claimAchievementReward,
  ACHIEVEMENT_TIERS,
  ACHIEVEMENT_RARITIES,
} from '../utils/achievements';
import { playCorrectSound, playStreakFlameSound } from '../utils/audio';

interface AchievementsProps {
  studyState: UserStudyState;
  onUpdateStudyState?: (newState: UserStudyState) => void;
  onNavigateToSection?: (section: 'plan' | 'session' | 'lectures' | 'quiz' | 'examiner' | 'cards' | 'streak' | 'mistakes' | 'level-drill') => void;
  onTriggerToast?: (badge: AchievementBadge) => void;
  variant?: 'full-dashboard' | 'compact-card' | 'standalone-page';
}

export const Achievements: React.FC<AchievementsProps> = ({
  studyState,
  onUpdateStudyState,
  onNavigateToSection,
  onTriggerToast,
  variant = 'full-dashboard',
}) => {
  const [selectedCategory, setSelectedCategory] = useState<AchievementCategory | 'all' | 'ready' | 'unlocked'>('all');
  const [selectedRarity, setSelectedRarity] = useState<AchievementRarity | 'all'>('all');
  const [inspectingBadge, setInspectingBadge] = useState<AchievementBadge | null>(null);
  const [recentlyClaimedId, setRecentlyClaimedId] = useState<string | null>(null);
  const [showSimulateMenu, setShowSimulateMenu] = useState(false);

  // Evaluate current achievements based on live user study state
  const badges = useMemo(() => {
    return evaluateAchievements(studyState);
  }, [studyState]);

  // Aggregate stats
  const stats = useMemo(() => {
    const total = badges.length;
    const unlocked = badges.filter(b => b.isUnlocked).length;
    const claimed = badges.filter(b => b.isClaimed).length;
    const readyToClaim = badges.filter(b => b.isUnlocked && !b.isClaimed).length;
    const totalXpClaimed = badges.filter(b => b.isClaimed).reduce((sum, b) => sum + b.xpReward, 0);
    const totalXpAvailable = badges.reduce((sum, b) => sum + b.xpReward, 0);
    const completionPercent = Math.round((unlocked / Math.max(1, total)) * 100);

    // Rarity breakdowns
    const rarityBreakdown = {
      Common: {
        total: badges.filter(b => b.rarity === 'Common').length,
        unlocked: badges.filter(b => b.rarity === 'Common' && b.isUnlocked).length,
      },
      Rare: {
        total: badges.filter(b => b.rarity === 'Rare').length,
        unlocked: badges.filter(b => b.rarity === 'Rare' && b.isUnlocked).length,
      },
      Epic: {
        total: badges.filter(b => b.rarity === 'Epic').length,
        unlocked: badges.filter(b => b.rarity === 'Epic' && b.isUnlocked).length,
      },
      Legendary: {
        total: badges.filter(b => b.rarity === 'Legendary').length,
        unlocked: badges.filter(b => b.rarity === 'Legendary' && b.isUnlocked).length,
      },
    };

    // Find the next closest in-progress badge
    const inProgressBadges = badges
      .filter(b => !b.isUnlocked)
      .map(b => ({
        ...b,
        ratio: b.currentValue / Math.max(1, b.targetValue),
      }))
      .sort((a, b) => b.ratio - a.ratio);

    const closestBadge = inProgressBadges[0] || null;

    return {
      total,
      unlocked,
      claimed,
      readyToClaim,
      totalXpClaimed,
      totalXpAvailable,
      completionPercent,
      closestBadge,
      rarityBreakdown,
    };
  }, [badges]);

  // Filtered badges list
  const filteredBadges = useMemo(() => {
    return badges.filter(badge => {
      // Category filtering
      if (selectedCategory === 'ready' && !(badge.isUnlocked && !badge.isClaimed)) return false;
      if (selectedCategory === 'unlocked' && !badge.isUnlocked) return false;
      if (selectedCategory !== 'all' && selectedCategory !== 'ready' && selectedCategory !== 'unlocked') {
        if (badge.category !== selectedCategory) return false;
      }

      // Rarity filtering
      if (selectedRarity !== 'all' && badge.rarity !== selectedRarity) return false;

      return true;
    });
  }, [badges, selectedCategory, selectedRarity]);

  const handleClaimReward = (badge: AchievementBadge) => {
    if (!badge.isUnlocked || badge.isClaimed) return;

    playStreakFlameSound();
    playCorrectSound();

    const { updatedState, badge: updatedBadge } = claimAchievementReward(studyState, badge.id);

    if (onUpdateStudyState) {
      onUpdateStudyState(updatedState);
    }

    setRecentlyClaimedId(badge.id);
    setTimeout(() => {
      setRecentlyClaimedId(null);
    }, 3000);

    if (inspectingBadge && inspectingBadge.id === badge.id && updatedBadge) {
      setInspectingBadge(updatedBadge);
    }
  };

  const getBadgeIcon = (iconName: string, className = 'w-6 h-6') => {
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
      case 'help-circle':
        return <HelpCircle className={className} />;
      case 'target':
        return <Target className={className} />;
      case 'bar-chart':
        return <BarChart3 className={className} />;
      case 'check-circle':
        return <CheckCircle2 className={className} />;
      case 'trending-up':
        return <TrendingUp className={className} />;
      default:
        return <Award className={className} />;
    }
  };

  const getNavigationTarget = (category: AchievementCategory): 'quiz' | 'lectures' | 'examiner' | 'mistakes' | 'streak' | 'plan' => {
    switch (category) {
      case 'streak':
        return 'streak';
      case 'mastery':
        return 'lectures';
      case 'quiz':
        return 'quiz';
      case 'examiner':
        return 'examiner';
      case 'vault':
        return 'mistakes';
      case 'consistency':
        return 'plan';
      default:
        return 'quiz';
    }
  };

  return (
    <div className="space-y-6">
      {/* Achievements Top Hero Card */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/30 border border-slate-800 rounded-3xl p-6 md:p-8 relative overflow-hidden shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 uppercase tracking-wider">
              <span>Scholar Milestones & Honors</span>
              <span aria-hidden="true">·</span>
              <span>Gamified Badges</span>
              <span aria-hidden="true">·</span>
              <span className="text-slate-400">Verifiable Retention</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-bold font-display text-white tracking-tight flex items-center gap-2.5">
              <span>Cognitive Mastery Achievements</span>
              {stats.readyToClaim > 0 && (
                <span className="text-xs px-2.5 py-1 rounded-full bg-amber-500 text-slate-950 font-black animate-bounce font-mono-numbers">
                  {stats.readyToClaim} Claimable
                </span>
              )}
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Permanent unlockable honors tracking verified academic grit. Maintain unbroken daily streaks, master comprehensive lecture mechanisms, and conquer oral board defenses to claim bonus XP and freeze tokens.
            </p>
          </div>

          {/* Quick Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 shrink-0">
            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/90 text-center">
              <span className="text-[11px] text-slate-400 block mb-0.5">Badges Unlocked</span>
              <span className="text-xl sm:text-2xl font-bold font-mono-numbers text-white">
                {stats.unlocked} <span className="text-xs text-slate-500 font-sans">/ {stats.total}</span>
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/90 text-center">
              <span className="text-[11px] text-slate-400 block mb-0.5">Completion</span>
              <span className="text-xl sm:text-2xl font-bold font-mono-numbers text-amber-400">
                {stats.completionPercent}%
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/90 text-center col-span-2 sm:col-span-1">
              <span className="text-[11px] text-slate-400 block mb-0.5">XP Bounty Claimed</span>
              <span className="text-xl sm:text-2xl font-bold font-mono-numbers text-emerald-400">
                +{stats.totalXpClaimed} <span className="text-xs text-slate-500 font-sans">XP</span>
              </span>
            </div>
          </div>
        </div>

        {/* Global Progress Bar */}
        <div className="mt-6 pt-5 border-t border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5 font-medium">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Overall Curriculum Badge Completion</span>
            </span>
            <span className="font-mono-numbers font-semibold text-slate-200">
              {stats.unlocked} of {stats.total} Unlocked ({stats.completionPercent}%)
            </span>
          </div>

          <div className="w-full h-2.5 rounded-full bg-slate-950 border border-slate-800/80 overflow-hidden p-0.5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-500 via-emerald-400 to-cyan-400 transition-all duration-700 ease-out"
              style={{ width: `${Math.max(4, stats.completionPercent)}%` }}
            />
          </div>
        </div>

        {/* Next Closest Target Spotlight */}
        {stats.closestBadge && (
          <div className="mt-4 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-300 shrink-0">
                {getBadgeIcon(stats.closestBadge.icon, 'w-4 h-4')}
              </div>
              <div>
                <span className="text-slate-400 text-[11px] block">Next badge within reach:</span>
                <span className="font-bold text-white font-display text-sm">
                  {stats.closestBadge.title} — {stats.closestBadge.subtitle}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
              <span className="font-mono-numbers text-amber-300 font-semibold">
                {stats.closestBadge.currentValue} / {stats.closestBadge.targetValue} {stats.closestBadge.unit} ({Math.round((stats.closestBadge.currentValue / Math.max(1, stats.closestBadge.targetValue)) * 100)}%)
              </span>
              <button
                type="button"
                onClick={() => setInspectingBadge(stats.closestBadge)}
                className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition-colors cursor-pointer"
              >
                Inspect
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Rarity Level Filter Strip with Border Gradients & Glow Effects */}
      <div className="bg-slate-950/80 border border-slate-800/90 rounded-2xl p-3.5 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>Badge Rarity Tier:</span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Simulation / Instant Gratification Test Menu */}
          {onTriggerToast && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowSimulateMenu(!showSimulateMenu)}
                className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                title="Test unlock toast overlay system"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Test Unlock Toast</span>
              </button>

              {showSimulateMenu && (
                <div className="absolute left-0 sm:right-0 sm:left-auto top-full mt-2 w-56 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-2 z-30 space-y-1">
                  <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                    Trigger Sample Toast:
                  </div>
                  {(['Common', 'Rare', 'Epic', 'Legendary'] as AchievementRarity[]).map((rarity) => {
                    const sampleBadge = badges.find(b => b.rarity === rarity) || badges[0];
                    const cfg = ACHIEVEMENT_RARITIES[rarity];
                    return (
                      <button
                        key={rarity}
                        type="button"
                        onClick={() => {
                          onTriggerToast(sampleBadge);
                          setShowSimulateMenu(false);
                        }}
                        className="w-full text-left px-2.5 py-1.5 rounded-xl hover:bg-slate-800 text-xs flex items-center justify-between cursor-pointer transition-colors"
                      >
                        <span className="flex items-center gap-1.5">
                          <span>{cfg.sparkleSymbol}</span>
                          <span className={cfg.tagText}>{rarity}</span>
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono truncate max-w-[90px]">
                          {sampleBadge.title}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={() => setSelectedRarity('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              selectedRarity === 'all'
                ? 'bg-slate-700 text-white shadow-md'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            All Rarities ({badges.length})
          </button>

          {(['Common', 'Rare', 'Epic', 'Legendary'] as AchievementRarity[]).map((r) => {
            const config = ACHIEVEMENT_RARITIES[r];
            const isSelected = selectedRarity === r;
            const count = stats.rarityBreakdown[r].total;
            const unlocked = stats.rarityBreakdown[r].unlocked;

            return (
              <button
                key={r}
                type="button"
                onClick={() => setSelectedRarity(isSelected ? 'all' : r)}
                className={`relative px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-300 cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? `p-[1.5px] bg-gradient-to-r ${config.borderGradient} ${config.badgeGlow} scale-105`
                    : `border ${config.tagBorder} ${config.tagBg} hover:scale-102`
                }`}
                title={`Filter by ${r} Rarity (${config.loreLabel})`}
              >
                <span>{config.sparkleSymbol}</span>
                <span className={config.tagText}>{config.name}</span>
                <span className="text-[10px] font-mono-numbers px-1.5 py-0.5 rounded bg-black/40 text-slate-300 font-normal">
                  {unlocked}/{count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter Tabs (Zero-pill segmented buttons) */}
      <div className="flex items-center justify-between gap-4 flex-wrap pb-1">
        <div className="flex items-center gap-1.5 p-1 bg-slate-950/90 border border-slate-800 rounded-2xl overflow-x-auto max-w-full">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All Categories
          </button>

          {stats.readyToClaim > 0 && (
            <button
              type="button"
              onClick={() => setSelectedCategory('ready')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                selectedCategory === 'ready'
                  ? 'bg-emerald-500 text-slate-950 shadow-md'
                  : 'text-emerald-400 hover:text-emerald-300 bg-emerald-500/10'
              }`}
            >
              <Sparkles className="w-3 h-3" />
              <span>Claimable ({stats.readyToClaim})</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setSelectedCategory('unlocked')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
              selectedCategory === 'unlocked'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Unlocked ({stats.unlocked})
          </button>

          <button
            type="button"
            onClick={() => setSelectedCategory('streak')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1 ${
              selectedCategory === 'streak'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span>Streak</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedCategory('mastery')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1 ${
              selectedCategory === 'mastery'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
            <span>Topic Mastery</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedCategory('examiner')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1 ${
              selectedCategory === 'examiner'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Target className="w-3.5 h-3.5 text-rose-400" />
            <span>Examiner Viva</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedCategory('vault')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1 ${
              selectedCategory === 'vault'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span>Mistakes Vault</span>
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400 font-mono-numbers">
          {selectedRarity !== 'all' && (
            <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-amber-300">
              {selectedRarity} Rarity
            </span>
          )}
          <span>Showing {filteredBadges.length} of {badges.length} badges</span>
        </div>
      </div>

      {/* Badges Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredBadges.map(badge => {
          const tierConfig = ACHIEVEMENT_TIERS[badge.tier];
          const rarityConfig = ACHIEVEMENT_RARITIES[badge.rarity || 'Common'];
          const isReadyToClaim = badge.isUnlocked && !badge.isClaimed;
          const isRecentlyClaimed = recentlyClaimedId === badge.id;
          const progressPercent = Math.min(100, Math.round((badge.currentValue / Math.max(1, badge.targetValue)) * 100));

          return (
            <div
              key={badge.id}
              className={`rounded-3xl p-[2px] transition-all duration-300 relative group cursor-pointer ${
                badge.isClaimed
                  ? `bg-gradient-to-br ${rarityConfig.cardBorderGradient} ${rarityConfig.badgeGlow} ${rarityConfig.badgeGlowHover} hover:scale-[1.015]`
                  : isReadyToClaim
                  ? `bg-gradient-to-br ${rarityConfig.borderGradient} ${rarityConfig.badgeGlowUnlocked} ${rarityConfig.badgeGlowHover} ring-2 ring-amber-400/80 scale-[1.015]`
                  : `bg-gradient-to-br ${rarityConfig.cardBorderGradient} opacity-90 hover:opacity-100 ${rarityConfig.badgeGlow} ${rarityConfig.badgeGlowHover} hover:scale-[1.01]`
              }`}
              onClick={() => setInspectingBadge(badge)}
            >
              <div className={`rounded-[22px] p-5 h-full flex flex-col justify-between transition-all duration-300 relative overflow-hidden ${
                badge.isClaimed
                  ? `bg-gradient-to-br ${rarityConfig.cardBgGradient} backdrop-blur-md`
                  : isReadyToClaim
                  ? 'bg-gradient-to-br from-slate-900 via-slate-950 to-amber-950/40 backdrop-blur-md'
                  : 'bg-slate-950/95 backdrop-blur-md hover:bg-slate-900/80'
              }`}>
                {/* Ambient glow accent in top-right */}
                <div
                  className={`absolute -top-12 -right-12 w-32 h-32 rounded-full blur-2xl pointer-events-none opacity-20 ${
                    badge.rarity === 'Legendary'
                      ? 'bg-amber-400'
                      : badge.rarity === 'Epic'
                      ? 'bg-purple-500'
                      : badge.rarity === 'Rare'
                      ? 'bg-cyan-400'
                      : 'bg-slate-500'
                  }`}
                />

                {/* Top Row: Rarity Tag, Tier Label & Rewards */}
                <div className="space-y-3 relative z-10">
                  <div className="flex items-center justify-between text-xs text-slate-400 pb-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {/* Rarity Pill Badge with Border Gradient and Glow */}
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider font-mono border flex items-center gap-1 shadow-sm ${rarityConfig.tagBg} ${rarityConfig.tagBorder} ${rarityConfig.tagText}`}
                        title={`${badge.rarity} Rarity - ${rarityConfig.loreLabel}`}
                      >
                        <span>{rarityConfig.sparkleSymbol}</span>
                        <span>{badge.rarity}</span>
                      </span>

                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider font-mono border ${tierConfig.ribbonBg}`}>
                        {badge.tier}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs font-bold font-mono-numbers">
                      <span className="text-amber-400">+{badge.xpReward} XP</span>
                      {badge.freezeTokenReward && (
                        <span className="text-cyan-400 text-[11px] flex items-center gap-0.5">
                          · +{badge.freezeTokenReward} ❄️
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Badge Visual Icon & Title */}
                  <div className="flex items-start gap-4">
                    {/* Badge Emblem Container with Rarity Border Gradient & Glow */}
                    <div className="relative shrink-0">
                      <div
                        className={`w-14 h-14 rounded-2xl flex items-center justify-center border transition-all duration-300 group-hover:scale-105 shadow-inner relative overflow-hidden ${
                          badge.isClaimed
                            ? `bg-gradient-to-br ${tierConfig.badgeBg} ${rarityConfig.emblemRing} text-white shadow-lg`
                            : isReadyToClaim
                            ? `bg-gradient-to-br ${rarityConfig.borderGradient} ${rarityConfig.emblemRing} text-white animate-pulse`
                            : `bg-slate-900/90 ${rarityConfig.emblemRing} text-slate-400`
                        }`}
                      >
                        {(badge.rarity === 'Legendary' || badge.rarity === 'Epic') && (
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none" />
                        )}
                        {getBadgeIcon(badge.icon, 'w-7 h-7 relative z-10')}
                      </div>

                      {/* Mini Stamp Badge Overlay */}
                      {badge.isClaimed ? (
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-slate-950 flex items-center justify-center text-slate-950 shadow z-20">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      ) : isReadyToClaim ? (
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-amber-400 border-2 border-slate-950 flex items-center justify-center text-slate-950 shadow animate-bounce z-20">
                          <Sparkles className="w-3 h-3 stroke-[3]" />
                        </div>
                      ) : (
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-slate-800 border-2 border-slate-950 flex items-center justify-center text-slate-500 shadow z-20">
                          <Lock className="w-3 h-3" />
                        </div>
                      )}
                    </div>

                    {/* Title & Description */}
                    <div className="space-y-1 flex-1 min-w-0">
                      <h3 className={`font-display font-bold text-base leading-snug truncate ${
                        badge.isClaimed ? 'text-white' : isReadyToClaim ? 'text-amber-200' : 'text-slate-300'
                      }`}>
                        {badge.title}
                      </h3>
                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                        {badge.description}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Bottom Progress or Claim Action Bar */}
                <div className="mt-5 pt-3 border-t border-slate-800/80 relative z-10">
                  {isReadyToClaim ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleClaimReward(badge);
                      }}
                      className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.02]"
                    >
                      <Sparkles className="w-4 h-4 text-slate-950" />
                      <span>Claim +{badge.xpReward} XP & Honor</span>
                    </button>
                  ) : badge.isClaimed ? (
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>Unlocked & Claimed</span>
                      </span>
                      <span className="font-mono-numbers text-[11px] text-slate-500">
                        {badge.claimedAt ? `on ${badge.claimedAt}` : 'Mastered'}
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span>Requirement: {badge.targetValue} {badge.unit}</span>
                        <span className="font-mono-numbers text-slate-300 font-semibold">
                          {badge.currentValue} / {badge.targetValue} ({progressPercent}%)
                        </span>
                      </div>

                      <div className="w-full h-1.5 rounded-full bg-slate-950 border border-slate-800 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all duration-500 ease-out"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* INSPECTION MODAL (Detailed Lore, Criteria, and Direct Navigation) */}
      {inspectingBadge && (() => {
        const modalRarityConfig = ACHIEVEMENT_RARITIES[inspectingBadge.rarity || 'Common'];
        const modalTierConfig = ACHIEVEMENT_TIERS[inspectingBadge.tier];

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fadeIn">
            <div
              className={`w-full max-w-lg rounded-3xl p-[2px] bg-gradient-to-br ${modalRarityConfig.borderGradient} ${modalRarityConfig.badgeGlowUnlocked} shadow-2xl relative animate-scaleUp`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-slate-900 rounded-[22px] p-6 sm:p-8 space-y-6 relative overflow-hidden">
                {/* Ambient glow in modal background */}
                <div
                  className={`absolute -top-16 -right-16 w-48 h-48 rounded-full blur-3xl pointer-events-none opacity-25 ${
                    inspectingBadge.rarity === 'Legendary'
                      ? 'bg-amber-400'
                      : inspectingBadge.rarity === 'Epic'
                      ? 'bg-purple-500'
                      : inspectingBadge.rarity === 'Rare'
                      ? 'bg-cyan-400'
                      : 'bg-slate-500'
                  }`}
                />

                {/* Close Button */}
                <button
                  type="button"
                  onClick={() => setInspectingBadge(null)}
                  className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer z-10"
                >
                  <X className="w-5 h-5" />
                </button>

                {/* Emblem Header */}
                <div className="flex flex-col items-center text-center space-y-3 pt-2 relative z-10">
                  <div
                    className={`w-20 h-20 rounded-3xl flex items-center justify-center border shadow-xl relative overflow-hidden ${
                      inspectingBadge.isClaimed
                        ? `bg-gradient-to-br ${modalTierConfig.badgeBg} ${modalRarityConfig.emblemRing} text-white shadow-lg`
                        : inspectingBadge.isUnlocked
                        ? `bg-gradient-to-br ${modalRarityConfig.borderGradient} ${modalRarityConfig.emblemRing} text-white ring-2 ring-white/30 animate-pulse`
                        : `bg-slate-950 ${modalRarityConfig.emblemRing} text-slate-500`
                    }`}
                  >
                    {getBadgeIcon(inspectingBadge.icon, 'w-10 h-10 relative z-10')}
                  </div>

                  <div>
                    <div className="flex items-center justify-center gap-2 text-xs text-slate-400 pb-1 flex-wrap">
                      {/* Rarity Tag */}
                      <span className={`px-2.5 py-0.5 rounded-md font-bold uppercase tracking-wider font-mono border ${modalRarityConfig.tagBg} ${modalRarityConfig.tagBorder} ${modalRarityConfig.tagText} flex items-center gap-1 shadow-sm`}>
                        <span>{modalRarityConfig.sparkleSymbol}</span>
                        <span>{inspectingBadge.rarity} Rarity</span>
                      </span>

                      <span className={`px-2.5 py-0.5 rounded-md font-bold uppercase tracking-wider font-mono border ${modalTierConfig.ribbonBg}`}>
                        {inspectingBadge.tier} Tier
                      </span>

                      <span aria-hidden="true" className="text-slate-600">·</span>
                      <span className="capitalize text-slate-400">{inspectingBadge.category}</span>
                    </div>

                    <h3 className="text-2xl font-bold font-display text-white">
                      {inspectingBadge.title}
                    </h3>
                    <p className="text-xs text-amber-300/90 font-medium">
                      {inspectingBadge.subtitle}
                    </p>
                    <span className="inline-block mt-1 text-[11px] text-slate-400 italic font-mono">
                      {modalRarityConfig.loreLabel}
                    </span>
                  </div>
                </div>

                {/* Lore Commentary */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/90 text-xs sm:text-sm text-slate-300 italic font-serif leading-relaxed relative z-10">
                  "{inspectingBadge.loreQuote}"
                </div>

                {/* Criteria & Current Progress */}
                <div className="space-y-3 bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80 relative z-10">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-semibold">Objective:</span>
                    <span className="text-slate-200">{inspectingBadge.description}</span>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-xs font-mono-numbers">
                      <span className="text-slate-400">Current Progress</span>
                      <span className="font-bold text-white">
                        {inspectingBadge.currentValue} / {inspectingBadge.targetValue} {inspectingBadge.unit} ({Math.min(100, Math.round((inspectingBadge.currentValue / Math.max(1, inspectingBadge.targetValue)) * 100))}%)
                      </span>
                    </div>

                    <div className="w-full h-2 rounded-full bg-slate-900 border border-slate-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          inspectingBadge.isUnlocked ? 'bg-emerald-400' : 'bg-amber-500'
                        }`}
                        style={{ width: `${Math.min(100, Math.round((inspectingBadge.currentValue / Math.max(1, inspectingBadge.targetValue)) * 100))}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/60 font-mono-numbers">
                    <span className="text-slate-400">Bounty Rewards:</span>
                    <span className="text-amber-400 font-bold flex items-center gap-2">
                      <span>+{inspectingBadge.xpReward} XP</span>
                      {inspectingBadge.freezeTokenReward && (
                        <span className="text-cyan-400">+{inspectingBadge.freezeTokenReward} Freeze Token</span>
                      )}
                    </span>
                  </div>
                </div>

                {/* Modal Actions */}
                <div className="flex items-center justify-between gap-3 pt-2 relative z-10">
                  {onNavigateToSection && (
                    <button
                      type="button"
                      onClick={() => {
                        const target = getNavigationTarget(inspectingBadge.category);
                        setInspectingBadge(null);
                        onNavigateToSection(target);
                      }}
                      className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <span>Practice to Unlock</span>
                      <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                    </button>
                  )}

                  {inspectingBadge.isUnlocked && !inspectingBadge.isClaimed ? (
                    <button
                      type="button"
                      onClick={() => handleClaimReward(inspectingBadge)}
                      className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-xs flex items-center gap-2 cursor-pointer shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.02]"
                    >
                      <Sparkles className="w-4 h-4 text-slate-950" />
                      <span>Claim Honor & Rewards</span>
                    </button>
                  ) : inspectingBadge.isClaimed ? (
                    <div className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5 ml-auto">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Honors Claimed ({inspectingBadge.claimedAt || 'Saved'})</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setInspectingBadge(null)}
                      className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium cursor-pointer ml-auto"
                    >
                      Close
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
