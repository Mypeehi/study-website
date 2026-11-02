import React, { useState, useEffect, useMemo } from 'react';
import {
  Trophy,
  Award,
  Crown,
  Medal,
  Flame,
  Zap,
  TrendingUp,
  Target,
  Sparkles,
  Users,
  Shield,
  Search,
  Filter,
  CheckCircle2,
  Lock,
  ArrowUpRight,
  Globe,
  Radio,
  BookOpen,
  Palette,
  X,
  ExternalLink,
} from 'lucide-react';
import { UserStudyState, LeaderboardEntry, RankTierDefinition, UserProfileCustomization } from '../types';
import { EXP_RANK_TIERS, getLevelInfo, getFullLeaderboard } from '../utils/storage';
import { playStreakFlameSound, playCorrectSound } from '../utils/audio';
import { StickFigureAvatar } from './StickFigureAvatar';
import { StickFigureCustomizerModal } from './StickFigureCustomizerModal';
import { WeeklyTopScholarBadge } from './WeeklyTopScholarBadge';

interface LeaderboardPageProps {
  studyState: UserStudyState;
  onNavigateToDrill?: () => void;
  onNavigateToExamPlan?: () => void;
  onUpdateProfile?: (profile: UserProfileCustomization) => void;
  onOpenCustomizer?: () => void;
}

export const LeaderboardPage: React.FC<LeaderboardPageProps> = ({
  studyState,
  onNavigateToDrill,
  onNavigateToExamPlan,
  onUpdateProfile,
  onOpenCustomizer,
}) => {
  const [viewMode, setViewMode] = useState<'all-time' | 'weekly'>('all-time');
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'ranks'>('leaderboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [isLiveRefreshing, setIsLiveRefreshing] = useState(false);
  const [isCustomizerModalOpen, setIsCustomizerModalOpen] = useState(false);
  const [selectedScholarForModal, setSelectedScholarForModal] = useState<LeaderboardEntry | null>(null);
  const [seasonInfo, setSeasonInfo] = useState({
    season: 'Season 1: Global High-Yield Sprint',
    daysRemaining: 18,
    activeScholarsCount: 4892,
  });

  const customName = studyState.userProfile?.displayName || 'You (Scholar)';

  const levelData = useMemo(() => getLevelInfo(studyState.totalXp), [studyState.totalXp]);

  // Fetch or calculate full leaderboard
  const { entries, userRank, userWeeklyRank } = useMemo(() => {
    return getFullLeaderboard(studyState, customName);
  }, [studyState, customName]);

  // Handle refreshing leaderboard data
  const handleLiveRefresh = async () => {
    setIsLiveRefreshing(true);
    try {
      const res = await fetch(`/api/leaderboard?userXp=${studyState.totalXp}&userStreak=${studyState.streak}`);
      if (res.ok) {
        const data = await res.json();
        if (data.season) {
          setSeasonInfo({
            season: data.season,
            daysRemaining: data.daysRemainingInSeason || 18,
            activeScholarsCount: data.totalScholarsActive || 4892,
          });
        }
      }
    } catch {
      // Fallback works silently via getFullLeaderboard
    } finally {
      setTimeout(() => setIsLiveRefreshing(false), 500);
    }
  };

  useEffect(() => {
    handleLiveRefresh();
  }, []);

  // Filtered and sorted leaderboard list
  const filteredEntries = useMemo(() => {
    let list = [...entries];

    if (viewMode === 'weekly') {
      list.sort((a, b) => b.weeklyXp - a.weeklyXp);
    } else {
      list.sort((a, b) => b.totalXp - a.totalXp);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        e =>
          e.displayName.toLowerCase().includes(q) ||
          e.username.toLowerCase().includes(q) ||
          (e.isCurrentUser && e.topSubject?.toLowerCase().includes(q)) ||
          e.country.toLowerCase().includes(q)
      );
    }

    if (tierFilter !== 'all') {
      const tierNum = parseInt(tierFilter, 10);
      list = list.filter(e => e.tierNumber === tierNum);
    }

    return list;
  }, [entries, viewMode, searchQuery, tierFilter]);

  const activeRankIndex = viewMode === 'weekly' ? userWeeklyRank : userRank;

  // Podium (Top 3)
  const podiumEntries = useMemo(() => {
    const sorted = [...entries].sort((a, b) => (viewMode === 'weekly' ? b.weeklyXp - a.weeklyXp : b.totalXp - a.totalXp));
    return {
      first: sorted[0],
      second: sorted[1],
      third: sorted[2],
    };
  }, [entries, viewMode]);

  // Reigning Weekly Top Scholar (highest weekly XP across all scholars)
  const weeklyTopScholar = useMemo(() => {
    if (!entries || entries.length === 0) return null;
    const sorted = [...entries].sort((a, b) => b.weeklyXp - a.weeklyXp);
    return sorted[0] || null;
  }, [entries]);

  return (
    <div className="max-w-6xl mx-auto px-2 sm:px-4 py-6 md:py-8 space-y-8 animate-fadeIn">
      {/* Top Header & Season Status Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/40 border border-slate-800 p-6 md:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <Radio className="w-3.5 h-3.5 text-amber-400" />
              <span>Live Global Study Network</span>
              <span className="text-slate-500">·</span>
              <span className="text-slate-300">{seasonInfo.season}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold font-display text-white tracking-tight flex items-center gap-3">
              <Trophy className="w-8 h-8 md:w-10 md:h-10 text-amber-400 shrink-0" />
              <span>Global EXP Leaderboard & Ranks</span>
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Compete with high-yield scholars worldwide. Earn <strong className="text-amber-400">Knowledge EXP</strong> by mastering roadmap levels, solving daily drills, conquering flashcards, and holding oral defenses.
            </p>
          </div>

          {/* User Quick Rank Summary Card */}
          <div className="bg-slate-950/80 backdrop-blur-md border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 shrink-0 shadow-lg min-w-[280px]">
            <div className="flex items-center gap-3">
              <div
                onClick={() => {
                  if (onOpenCustomizer) onOpenCustomizer();
                  else setIsCustomizerModalOpen(true);
                }}
                className="relative cursor-pointer group"
                title="Click to customize your stick figure"
              >
                <StickFigureAvatar
                  config={studyState.userProfile?.stickFigure}
                  seed="You"
                  size={58}
                  className="rounded-2xl transition-transform group-hover:scale-105"
                />
                <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-amber-500 text-slate-950 font-black text-[10px] flex items-center justify-center shadow-md">
                  ✏️
                </span>
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400 uppercase tracking-wider font-semibold flex-wrap">
                  <span>Your Standing</span>
                  <span className="text-slate-600">·</span>
                  <span className="text-amber-400 font-bold">#{activeRankIndex}</span>
                  {weeklyTopScholar?.isCurrentUser && (
                    <WeeklyTopScholarBadge size="xs" showSparkles={false} tooltipPlacement="bottom" />
                  )}
                </div>
                <div className="font-bold text-white text-base truncate font-display">
                  {studyState.userProfile?.displayName || 'You (Scholar)'}
                </div>
                <div className="text-[11px] text-slate-300 font-medium truncate">
                  {levelData.division}
                </div>
                <div className="flex items-center gap-2 text-xs font-mono-numbers mt-0.5 text-slate-300">
                  <span className="text-amber-400 font-bold">{studyState.totalXp.toLocaleString()} XP</span>
                  <span className="text-slate-600">·</span>
                  <span className="flex items-center gap-1 text-orange-400 font-semibold">
                    <Flame className="w-3.5 h-3.5 fill-orange-500/30" />
                    {studyState.streak}d
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                if (onOpenCustomizer) onOpenCustomizer();
                else setIsCustomizerModalOpen(true);
              }}
              className="w-full sm:w-auto mt-2 sm:mt-0 px-3 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 hover:text-white text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
            >
              <Palette className="w-3.5 h-3.5" />
              <span>Customize Avatar</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs (Leaderboard vs Ranks Breakdown) */}
        <div className="flex flex-wrap items-center justify-between gap-4 mt-8 pt-6 border-t border-slate-800/80">
          <div className="flex items-center gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('leaderboard')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'leaderboard'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Leaderboard Standings</span>
            </button>
            <button
              onClick={() => setActiveTab('ranks')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'ranks'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Award className="w-4 h-4" />
              <span>EXP Ranks & Goals ({EXP_RANK_TIERS.length} Tiers)</span>
            </button>
          </div>

          {activeTab === 'leaderboard' && (
            <div className="flex items-center gap-3">
              {/* View Mode (All-time vs Weekly) */}
              <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs">
                <button
                  onClick={() => setViewMode('all-time')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                    viewMode === 'all-time'
                      ? 'bg-slate-800 text-amber-300 font-bold border border-slate-700'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  All-Time EXP
                </button>
                <button
                  onClick={() => setViewMode('weekly')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                    viewMode === 'weekly'
                      ? 'bg-slate-800 text-amber-300 font-bold border border-slate-700'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Weekly Sprint
                </button>
              </div>

              {/* Live refresh */}
              <button
                onClick={handleLiveRefresh}
                disabled={isLiveRefreshing}
                className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-amber-400 transition-colors cursor-pointer text-xs flex items-center gap-1.5"
                title="Refresh rankings"
              >
                <Radio className={`w-3.5 h-3.5 ${isLiveRefreshing ? 'animate-spin text-amber-400' : ''}`} />
                <span className="hidden sm:inline">Sync Live</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* TAB 1: LEADERBOARD STANDINGS */}
      {activeTab === 'leaderboard' && (
        <div className="space-y-8 animate-fadeIn">
          {/* Weekly Top Scholar Spotlight Banner */}
          {weeklyTopScholar && (
            <div
              onClick={() => setSelectedScholarForModal(weeklyTopScholar)}
              className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-950/60 via-slate-900 to-purple-950/50 border-2 border-amber-400/60 p-5 md:p-6 shadow-[0_0_35px_rgba(251,191,36,0.18)] cursor-pointer hover:border-amber-300 transition-all group"
            >
              {/* Shimmer Ambient Glow */}
              <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-amber-400/10 via-purple-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -left-10 -bottom-10 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

              <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
                <div className="flex items-center gap-4">
                  {/* Avatar with Crown Badge */}
                  <div className="relative shrink-0">
                    <StickFigureAvatar
                      config={weeklyTopScholar.stickFigure}
                      seed={weeklyTopScholar.avatarSeed}
                      size={68}
                      className="rounded-2xl shadow-xl ring-2 ring-amber-400/80 transition-transform group-hover:scale-105"
                    />
                    <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-gradient-to-br from-amber-300 to-amber-500 text-slate-950 font-black text-sm flex items-center justify-center shadow-lg ring-2 ring-slate-900 animate-bounce">
                      👑
                    </span>
                    {weeklyTopScholar.verifiedOnline && (
                      <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-slate-900 shadow" />
                    )}
                  </div>

                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <WeeklyTopScholarBadge size="md" tooltipPlacement="bottom" />
                      {weeklyTopScholar.isCurrentUser && (
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-500 text-slate-950 font-black text-[10px] uppercase tracking-wider animate-pulse">
                          🎉 YOU HOLD THE TITLE!
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-xl sm:text-2xl font-black font-display text-white tracking-tight group-hover:text-amber-300 transition-colors">
                        {weeklyTopScholar.displayName}
                      </h3>
                      <span className="text-xs text-amber-300 font-mono">
                        @{weeklyTopScholar.username}
                      </span>
                      <span className="text-slate-500">·</span>
                      <span className="text-xs text-slate-400 font-medium">
                        {weeklyTopScholar.country}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 max-w-xl">
                      {weeklyTopScholar.isCurrentUser
                        ? 'You are dominating the global sprint this week! Keep up the momentum to secure your weekly champion honors.'
                        : `${weeklyTopScholar.displayName} leads the global sprint with an impressive pace. Earn EXP in drills & missions to contend for the crown!`}
                    </p>
                  </div>
                </div>

                {/* Right Stat Pillars */}
                <div className="flex items-center gap-3 sm:gap-4 shrink-0 bg-slate-950/80 border border-slate-800/80 rounded-2xl p-3 sm:p-4 backdrop-blur-md">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                      Weekly Sprint XP
                    </span>
                    <span className="text-lg sm:text-xl font-black font-mono-numbers text-amber-300 flex items-center gap-1">
                      <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
                      +{weeklyTopScholar.weeklyXp.toLocaleString()} XP
                    </span>
                  </div>

                  <div className="w-px h-9 bg-slate-800" />

                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                      Sprint Streak
                    </span>
                    <span className="text-lg sm:text-xl font-black font-mono-numbers text-orange-400 flex items-center gap-1">
                      <Flame className="w-4 h-4 fill-orange-500/30" />
                      {weeklyTopScholar.streakDays}d
                    </span>
                  </div>

                  <div className="w-px h-9 bg-slate-800 hidden sm:block" />

                  <div className="hidden sm:block">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                      Accuracy
                    </span>
                    <span className="text-lg sm:text-xl font-black font-mono-numbers text-emerald-400">
                      {weeklyTopScholar.accuracyRate}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Top 3 Podium Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 pt-2">
            {/* Rank 2 (Silver) */}
            {podiumEntries.second && (
              <div
                onClick={() => setSelectedScholarForModal(podiumEntries.second)}
                className={`order-2 md:order-1 bg-slate-900/70 border rounded-3xl p-5 md:p-6 flex flex-col justify-between relative overflow-hidden group hover:border-slate-500 transition-all shadow-xl cursor-pointer ${
                  weeklyTopScholar?.id === podiumEntries.second.id
                    ? 'border-amber-400/80 ring-2 ring-amber-400/40 bg-gradient-to-b from-purple-950/30 to-slate-900'
                    : 'border-slate-700/60'
                }`}
              >
                <div className="absolute top-0 right-0 px-4 py-1.5 bg-slate-700/40 border-b border-l border-slate-600/50 rounded-bl-2xl text-xs font-mono font-bold text-slate-300 flex items-center gap-1.5">
                  <Medal className="w-4 h-4 text-slate-300" />
                  <span>2ND PLACE</span>
                </div>

                <div className="flex items-center gap-4 pt-4">
                  <div className="relative shrink-0">
                    <StickFigureAvatar
                      config={podiumEntries.second.stickFigure}
                      seed={podiumEntries.second.avatarSeed}
                      size={58}
                      className="rounded-2xl shadow-md transition-transform group-hover:scale-105"
                    />
                    <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-slate-700 border border-slate-400 text-white font-bold text-xs flex items-center justify-center">
                      2
                    </span>
                  </div>

                  <div className="min-w-0">
                    <div className="font-bold text-white text-base truncate font-display">
                      {podiumEntries.second.displayName}
                    </div>
                    <div className="text-xs text-slate-400 truncate">
                      @{podiumEntries.second.username}
                    </div>
                    <div className="text-[11px] text-slate-300 mt-1 font-semibold flex items-center gap-1.5 flex-wrap">
                      <span>{podiumEntries.second.rankTierName}</span>
                      {weeklyTopScholar?.id === podiumEntries.second.id && (
                        <WeeklyTopScholarBadge size="xs" showSparkles={false} tooltipPlacement="top" />
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">
                      {viewMode === 'weekly' ? 'Weekly Sprint XP' : 'Total Knowledge XP'}
                    </span>
                    <span className="text-lg font-bold font-mono-numbers text-slate-200">
                      {(viewMode === 'weekly' ? podiumEntries.second.weeklyXp : podiumEntries.second.totalXp).toLocaleString()} XP
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Daily Streak</span>
                    <span className="text-amber-400 font-bold font-mono-numbers flex items-center gap-1 justify-end">
                      <Flame className="w-3.5 h-3.5 fill-amber-500/30" />
                      {podiumEntries.second.streakDays}d
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Rank 1 (Gold - Champion) */}
            {podiumEntries.first && (
              <div
                onClick={() => setSelectedScholarForModal(podiumEntries.first)}
                className={`order-1 md:order-2 bg-gradient-to-b from-amber-950/40 via-slate-900 to-slate-900 border-2 rounded-3xl p-6 md:p-7 flex flex-col justify-between relative overflow-hidden group hover:border-amber-400 transition-all shadow-2xl md:-translate-y-2 cursor-pointer ${
                  weeklyTopScholar?.id === podiumEntries.first.id
                    ? 'border-amber-400 shadow-amber-950/50 ring-2 ring-amber-400/30'
                    : 'border-amber-500/50 shadow-amber-950/30'
                }`}
              >
                <div className="absolute top-0 right-0 px-4 py-1.5 bg-amber-500 text-slate-950 font-black text-xs rounded-bl-2xl flex items-center gap-1.5 shadow-md">
                  <Crown className="w-4 h-4 fill-slate-950" />
                  <span>CHAMPION #1</span>
                </div>

                <div className="flex items-center gap-4 pt-4">
                  <div className="relative shrink-0">
                    <StickFigureAvatar
                      config={podiumEntries.first.stickFigure}
                      seed={podiumEntries.first.avatarSeed}
                      size={72}
                      className="rounded-2xl shadow-xl transition-transform group-hover:scale-105"
                    />
                    <span className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-amber-500 text-slate-950 font-extrabold text-sm flex items-center justify-center shadow-md">
                      👑
                    </span>
                  </div>

                  <div className="min-w-0">
                    <div className="font-extrabold text-white text-lg truncate font-display flex items-center gap-1.5">
                      <span>{podiumEntries.first.displayName}</span>
                    </div>
                    <div className="text-xs text-amber-300 font-mono truncate">
                      @{podiumEntries.first.username}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap mt-1">
                      <div className="inline-block px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[11px] font-bold">
                        {podiumEntries.first.division}
                      </div>
                      {weeklyTopScholar?.id === podiumEntries.first.id && (
                        <WeeklyTopScholarBadge size="sm" tooltipPlacement="top" />
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-amber-400/80 text-[10px] uppercase font-bold block">
                      {viewMode === 'weekly' ? 'Weekly Sprint XP' : 'Total Knowledge XP'}
                    </span>
                    <span className="text-2xl font-black font-mono-numbers text-amber-300">
                      {(viewMode === 'weekly' ? podiumEntries.first.weeklyXp : podiumEntries.first.totalXp).toLocaleString()} XP
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Study Streak</span>
                    <span className="text-amber-400 text-base font-bold font-mono-numbers flex items-center gap-1 justify-end">
                      <Flame className="w-4 h-4 fill-amber-500/30 animate-pulse" />
                      {podiumEntries.first.streakDays}d
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Rank 3 (Bronze) */}
            {podiumEntries.third && (
              <div
                onClick={() => setSelectedScholarForModal(podiumEntries.third)}
                className={`order-3 bg-slate-900/70 border rounded-3xl p-5 md:p-6 flex flex-col justify-between relative overflow-hidden group hover:border-amber-700/60 transition-all shadow-xl cursor-pointer ${
                  weeklyTopScholar?.id === podiumEntries.third.id
                    ? 'border-amber-400/80 ring-2 ring-amber-400/40 bg-gradient-to-b from-purple-950/30 to-slate-900'
                    : 'border-amber-900/40'
                }`}
              >
                <div className="absolute top-0 right-0 px-4 py-1.5 bg-amber-900/40 border-b border-l border-amber-700/50 rounded-bl-2xl text-xs font-mono font-bold text-amber-300 flex items-center gap-1.5">
                  <Medal className="w-4 h-4 text-amber-500" />
                  <span>3RD PLACE</span>
                </div>

                <div className="flex items-center gap-4 pt-4">
                  <div className="relative shrink-0">
                    <StickFigureAvatar
                      config={podiumEntries.third.stickFigure}
                      seed={podiumEntries.third.avatarSeed}
                      size={58}
                      className="rounded-2xl shadow-md transition-transform group-hover:scale-105"
                    />
                    <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-amber-900 border border-amber-700 text-amber-200 font-bold text-xs flex items-center justify-center">
                      3
                    </span>
                  </div>

                  <div className="min-w-0">
                    <div className="font-bold text-white text-base truncate font-display">
                      {podiumEntries.third.displayName}
                    </div>
                    <div className="text-xs text-slate-400 truncate">
                      @{podiumEntries.third.username}
                    </div>
                    <div className="text-[11px] text-slate-300 mt-1 font-semibold flex items-center gap-1.5 flex-wrap">
                      <span>{podiumEntries.third.rankTierName}</span>
                      {weeklyTopScholar?.id === podiumEntries.third.id && (
                        <WeeklyTopScholarBadge size="xs" showSparkles={false} tooltipPlacement="top" />
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">
                      {viewMode === 'weekly' ? 'Weekly Sprint XP' : 'Total Knowledge XP'}
                    </span>
                    <span className="text-lg font-bold font-mono-numbers text-amber-200">
                      {(viewMode === 'weekly' ? podiumEntries.third.weeklyXp : podiumEntries.third.totalXp).toLocaleString()} XP
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Daily Streak</span>
                    <span className="text-amber-400 font-bold font-mono-numbers flex items-center gap-1 justify-end">
                      <Flame className="w-3.5 h-3.5 fill-amber-500/30" />
                      {podiumEntries.third.streakDays}d
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Search & Filter Toolbar */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search scholars by name, username, or country..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={tierFilter}
                onChange={e => setTierFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-amber-500/50 cursor-pointer"
              >
                <option value="all">All Rank Tiers</option>
                {EXP_RANK_TIERS.map(tier => (
                  <option key={tier.tierNumber} value={tier.tierNumber}>
                    Tier {tier.tierNumber}: {tier.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Leaderboard Table List */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/80 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    <th className="py-3.5 px-4 sm:px-6 w-16 text-center">Rank</th>
                    <th className="py-3.5 px-4">Scholar</th>
                    <th className="py-3.5 px-4 hidden sm:table-cell">Rank Tier</th>
                    <th className="py-3.5 px-4 hidden md:table-cell">Accuracy & Recall</th>
                    <th className="py-3.5 px-4 text-center">Streak</th>
                    <th className="py-3.5 px-4 sm:px-6 text-right">
                      {viewMode === 'weekly' ? 'Weekly XP' : 'Total XP'}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-xs">
                  {filteredEntries.map((scholar, index) => {
                    const isUser = scholar.isCurrentUser;
                    const isWeeklyTop = weeklyTopScholar && scholar.id === weeklyTopScholar.id;
                    const displayRank = index + 1;

                    return (
                      <tr
                        key={scholar.id}
                        className={`transition-colors ${
                          isWeeklyTop
                            ? 'bg-gradient-to-r from-amber-500/20 via-purple-500/15 to-amber-500/10 border-y-2 border-amber-400 text-white font-bold shadow-[0_0_20px_rgba(251,191,36,0.15)] ring-1 ring-amber-400/40'
                            : isUser
                            ? 'bg-amber-500/15 border-y-2 border-amber-500/60 text-white font-bold'
                            : 'hover:bg-slate-850/40 text-slate-300'
                        }`}
                      >
                        {/* Rank Badge */}
                        <td className="py-4 px-4 sm:px-6 text-center font-mono-numbers">
                          {displayRank === 1 ? (
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-xl bg-amber-500 text-slate-950 font-black text-xs shadow-md">
                              1
                            </span>
                          ) : displayRank === 2 ? (
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-xl bg-slate-600 text-white font-bold text-xs shadow">
                              2
                            </span>
                          ) : displayRank === 3 ? (
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-xl bg-amber-800/80 text-amber-200 font-bold text-xs">
                              3
                            </span>
                          ) : (
                            <span className="text-slate-400 font-semibold text-xs">
                              #{displayRank}
                            </span>
                          )}
                        </td>

                        {/* Scholar Avatar & Info */}
                        <td className="py-4 px-4 cursor-pointer" onClick={() => setSelectedScholarForModal(scholar)}>
                          <div className="flex items-center gap-3">
                            <div className="relative shrink-0">
                              <StickFigureAvatar
                                config={scholar.stickFigure}
                                seed={scholar.avatarSeed}
                                size={42}
                                className={`rounded-xl ${
                                  isWeeklyTop
                                    ? 'ring-2 ring-amber-400 shadow-lg'
                                    : isUser
                                    ? 'ring-2 ring-amber-400/80 shadow-md'
                                    : ''
                                }`}
                              />
                              {isWeeklyTop && (
                                <span
                                  className="absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full bg-gradient-to-br from-amber-300 to-amber-500 text-slate-950 font-black text-[10px] flex items-center justify-center shadow-md ring-1 ring-slate-900 animate-bounce"
                                  title="Weekly Top Scholar"
                                >
                                  👑
                                </span>
                              )}
                              {scholar.verifiedOnline && (
                                <span
                                  className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-slate-900"
                                  title="Online right now"
                                />
                              )}
                            </div>

                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className={`font-semibold truncate font-display ${isWeeklyTop ? 'text-amber-300' : isUser ? 'text-amber-300' : 'text-white'}`}>
                                  {scholar.displayName}
                                </span>
                                {isUser && (
                                  <span className="px-1.5 py-0.2 rounded bg-amber-500 text-slate-950 font-black text-[9px] uppercase tracking-wider">
                                    YOU
                                  </span>
                                )}
                                {isWeeklyTop && (
                                  <WeeklyTopScholarBadge size="xs" showSparkles={false} tooltipPlacement="auto" />
                                )}
                              </div>
                              <div className="text-[11px] text-slate-400 flex items-center gap-1.5 truncate">
                                <span>@{scholar.username}</span>
                                <span className="text-slate-600">·</span>
                                <span>{scholar.country}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Rank Tier */}
                        <td className="py-4 px-4 hidden sm:table-cell">
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950/80 border border-slate-800 text-[11px]">
                            <span>{scholar.division}</span>
                          </div>
                        </td>

                        {/* Accuracy & Recall (never show subject for bots) */}
                        <td className="py-4 px-4 hidden md:table-cell text-slate-400">
                          {isUser && scholar.topSubject ? (
                            <div className="truncate max-w-[220px] text-xs font-semibold text-amber-300 mb-1">
                              {scholar.topSubject}
                            </div>
                          ) : null}
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono-numbers text-[11px] font-semibold">
                            {scholar.accuracyRate}% Accuracy
                          </span>
                        </td>

                        {/* Streak */}
                        <td className="py-4 px-4 text-center">
                          <span className="inline-flex items-center gap-1 font-mono-numbers font-bold text-amber-400">
                            <Flame className="w-3.5 h-3.5 fill-amber-500/30" />
                            {scholar.streakDays}d
                          </span>
                        </td>

                        {/* EXP Count */}
                        <td className="py-4 px-4 sm:px-6 text-right font-mono-numbers">
                          <span className={`text-sm font-bold ${isUser ? 'text-amber-300' : 'text-slate-100'}`}>
                            {(viewMode === 'weekly' ? scholar.weeklyXp : scholar.totalXp).toLocaleString()}
                          </span>
                          <span className="text-[10px] text-slate-500 ml-1">XP</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {filteredEntries.length === 0 && (
              <div className="p-12 text-center text-slate-400 space-y-2">
                <Users className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-sm font-medium">No scholars found matching your search filter.</p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setTierFilter('all');
                  }}
                  className="text-xs text-amber-400 hover:underline cursor-pointer"
                >
                  Clear filters
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: EXP RANKS & GOALS BREAKDOWN */}
      {activeTab === 'ranks' && (
        <div className="space-y-8 animate-fadeIn">
          {/* User Progress to Next Rank Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/40 border border-amber-500/30 rounded-3xl p-6 md:p-8 space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-2xl">
                  {levelData.badgeIcon}
                </div>
                <div>
                  <div className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider">
                    Current Academic Rank
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold font-display text-white">
                    Tier {levelData.level}: {levelData.title} ({levelData.division})
                  </h3>
                </div>
              </div>

              {levelData.nextTier ? (
                <div className="text-right">
                  <span className="text-xs text-slate-400 block">Next Rank Target</span>
                  <span className="text-sm font-bold text-amber-300 font-display">
                    {levelData.nextTier.badgeIcon} {levelData.nextTier.name} ({levelData.nextTier.minXp.toLocaleString()} XP)
                  </span>
                </div>
              ) : (
                <div className="px-3 py-1 bg-amber-500/20 text-amber-300 rounded-xl text-xs font-bold border border-amber-500/40">
                  👑 Max Rank Achieved!
                </div>
              )}
            </div>

            {/* Progress Bar */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between text-xs font-mono-numbers">
                <span className="text-slate-300">
                  Progress in Tier {levelData.level}: <strong>{levelData.progressPercent}%</strong>
                </span>
                <span className="text-amber-400 font-bold">
                  {studyState.totalXp.toLocaleString()} / {levelData.nextLevelXp.toLocaleString()} XP
                </span>
              </div>

              <div className="w-full h-3.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800 p-0.5">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-rose-500 rounded-full transition-all duration-700 shadow-sm"
                  style={{ width: `${levelData.progressPercent}%` }}
                />
              </div>

              {levelData.nextTier && (
                <p className="text-[11px] text-slate-400 pt-1">
                  ⚡ Earn <strong className="text-white">{(levelData.nextLevelXp - studyState.totalXp).toLocaleString()} more XP</strong> to unlock <strong className="text-amber-300">{levelData.nextTier.name}</strong> and level up!
                </p>
              )}
            </div>
          </div>

          {/* Rank Ladder Cards (All Tiers with XP requirements, perks & motto) */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold font-display text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-400" />
              <span>The Smart Study Academic Rank Ladder</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {EXP_RANK_TIERS.map(tier => {
                const isCurrent = levelData.level === tier.tierNumber;
                const isPassed = studyState.totalXp >= tier.maxXp;
                const isLocked = studyState.totalXp < tier.minXp;

                return (
                  <div
                    key={tier.tierNumber}
                    className={`rounded-3xl p-6 border transition-all relative overflow-hidden flex flex-col justify-between ${
                      isCurrent
                        ? 'bg-slate-900 border-2 border-amber-500 shadow-xl shadow-amber-950/20 ring-2 ring-amber-500/20'
                        : isPassed
                        ? 'bg-slate-900/60 border-slate-800 text-slate-300'
                        : 'bg-slate-950/70 border-slate-850 opacity-80'
                    }`}
                  >
                    <div>
                      {/* Top Header */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl border ${tier.color}`}>
                            {tier.badgeIcon}
                          </div>
                          <div>
                            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                              Rank Tier {tier.tierNumber}
                            </div>
                            <h3 className={`text-lg font-bold font-display ${isCurrent ? 'text-amber-400' : 'text-white'}`}>
                              {tier.name}
                            </h3>
                          </div>
                        </div>

                        {/* Status Tag */}
                        {isCurrent ? (
                          <span className="px-2.5 py-1 rounded-full bg-amber-500 text-slate-950 font-black text-[10px] tracking-wider uppercase">
                            ACTIVE RANK
                          </span>
                        ) : isPassed ? (
                          <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Mastered</span>
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-500">
                            <Lock className="w-3.5 h-3.5" />
                            <span>Locked</span>
                          </span>
                        )}
                      </div>

                      {/* XP Range Goal */}
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono-numbers mb-3">
                        <Zap className="w-3.5 h-3.5 text-amber-400" />
                        <span className="text-slate-300">
                          {tier.minXp.toLocaleString()} – {tier.maxXp.toLocaleString()} XP
                        </span>
                      </div>

                      {/* Motto */}
                      <p className="text-xs text-slate-400 italic mb-4">
                        "{tier.motto}"
                      </p>

                      {/* Perks */}
                      <div className="space-y-1.5 mb-4">
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                          Unlocked Privileges & Perks:
                        </span>
                        {tier.perks.map((perk, i) => (
                          <div key={i} className="flex items-start gap-2 text-xs text-slate-300">
                            <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                            <span>{perk}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Divisions */}
                    <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                      <span>Divisions:</span>
                      <div className="flex items-center gap-2">
                        {tier.divisionTitles.map((div, idx) => (
                          <span key={idx} className="px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800">
                            {div}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Action Footer for Quick Practice */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="text-sm font-bold text-white font-display">
            Ready to climb higher up the Leaderboard?
          </h4>
          <p className="text-xs text-slate-400 mt-0.5">
            Complete daily practice questions (+25 XP per correct answer) or conquer milestone roadmap missions (+100 XP).
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {onNavigateToDrill && (
            <button
              onClick={onNavigateToDrill}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-all cursor-pointer flex items-center gap-2 shadow-md"
            >
              <Zap className="w-4 h-4 fill-slate-950" />
              <span>Earn EXP in Daily Drill</span>
            </button>
          )}

          {onNavigateToExamPlan && (
            <button
              onClick={onNavigateToExamPlan}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-700 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Target className="w-4 h-4 text-rose-400" />
              <span>Roadmap War Plan</span>
            </button>
          )}
        </div>
      </div>

      {/* SCHOLAR PROFILE POPUP MODAL */}
      {selectedScholarForModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn"
          onClick={() => setSelectedScholarForModal(null)}
        >
          <div
            className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-md w-full shadow-2xl p-6 relative overflow-hidden space-y-6 text-center"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedScholarForModal(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Top Stick Figure Display */}
            <div className="flex flex-col items-center pt-2">
              <div className="relative group mb-3">
                <StickFigureAvatar
                  config={selectedScholarForModal.stickFigure}
                  seed={selectedScholarForModal.avatarSeed}
                  size={100}
                  className="rounded-3xl shadow-xl transition-transform group-hover:scale-105"
                />
                {selectedScholarForModal.verifiedOnline && (
                  <span
                    className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-slate-900 shadow"
                    title="Online Active"
                  />
                )}
              </div>

              <div className="flex items-center gap-1.5 justify-center flex-wrap">
                <h3 className="text-xl font-bold font-display text-white">
                  {selectedScholarForModal.displayName}
                </h3>
                {selectedScholarForModal.isCurrentUser && (
                  <span className="px-1.5 py-0.5 rounded bg-amber-500 text-slate-950 font-black text-[10px] uppercase">
                    YOU
                  </span>
                )}
              </div>
              <div className="text-xs text-amber-400 font-mono">
                @{selectedScholarForModal.username} · {selectedScholarForModal.country}
              </div>

              {weeklyTopScholar?.id === selectedScholarForModal.id && (
                <div className="mt-2.5">
                  <WeeklyTopScholarBadge size="md" tooltipPlacement="bottom" />
                </div>
              )}
            </div>

            {/* Rank & Stats Grid */}
            <div className="grid grid-cols-2 gap-3 text-left">
              <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Current Rank Tier</span>
                <span className="text-sm font-bold text-white block mt-0.5 truncate">
                  {selectedScholarForModal.rankTierName}
                </span>
                <span className="text-[11px] text-amber-400 font-semibold block mt-0.5">
                  {selectedScholarForModal.division}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Knowledge XP</span>
                <span className="text-base font-bold font-mono-numbers text-amber-300 block mt-0.5">
                  {selectedScholarForModal.totalXp.toLocaleString()} XP
                </span>
                <span className="text-[11px] text-slate-400 block mt-0.5 font-mono-numbers">
                  +{selectedScholarForModal.weeklyXp.toLocaleString()} XP this week
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Daily Study Streak</span>
                <span className="text-base font-bold font-mono-numbers text-orange-400 flex items-center gap-1 mt-0.5">
                  <Flame className="w-4 h-4 fill-orange-500/30" />
                  {selectedScholarForModal.streakDays} Days
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Accuracy & Recall</span>
                <span className="text-base font-bold font-mono-numbers text-emerald-400 block mt-0.5">
                  {selectedScholarForModal.accuracyRate}% Correct
                </span>
              </div>
            </div>

            {selectedScholarForModal.isCurrentUser && selectedScholarForModal.topSubject ? (
              <div className="text-left p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 text-xs text-slate-300">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  Your Subject Track:
                </span>
                <span>{selectedScholarForModal.topSubject}</span>
              </div>
            ) : null}

            {selectedScholarForModal.isCurrentUser ? (
              <button
                type="button"
                onClick={() => {
                  setSelectedScholarForModal(null);
                  if (onOpenCustomizer) onOpenCustomizer();
                  else setIsCustomizerModalOpen(true);
                }}
                className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors flex items-center justify-center gap-2 shadow-md cursor-pointer"
              >
                <Palette className="w-4 h-4" />
                <span>Customize Your Stick Figure</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setSelectedScholarForModal(null)}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
              >
                Close Scholar Card
              </button>
            )}
          </div>
        </div>
      )}

      {/* STICK FIGURE CUSTOMIZER MODAL */}
      <StickFigureCustomizerModal
        isOpen={isCustomizerModalOpen}
        onClose={() => setIsCustomizerModalOpen(false)}
        currentProfile={studyState.userProfile}
        onSaveProfile={newProfile => {
          onUpdateProfile?.(newProfile);
          setIsCustomizerModalOpen(false);
        }}
        userRankInfo={{
          level: levelData.level,
          title: levelData.title,
          totalXp: studyState.totalXp,
          badgeIcon: levelData.badgeIcon,
        }}
      />
    </div>
  );
};
