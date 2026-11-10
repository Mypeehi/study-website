import React, { useState } from 'react';
import {
  Volume2,
  VolumeX,
  Shield,
  Flame,
  Sparkles,
  Target,
  BookOpen,
  HelpCircle,
  Mic,
  CreditCard,
  TrendingUp,
  RotateCcw,
  AlertTriangle,
  AlertCircle,
  X,
  ChevronRight,
  Trophy,
  Palette,
  Clock,
  Settings2,
  Plus,
  Check,
  CheckCircle2,
  Award,
  Wand2,
  Github,
  FileDown,
} from 'lucide-react';
import { isSoundEnabled, setSoundEnabled, playStreakFlameSound, playIncorrectSound, playCorrectSound } from '../utils/audio';
import { ExamPlan, UserProfileCustomization, DailyStudyGoal } from '../types';
import { RoadmapLevelsButton } from './RoadmapLevelsButton';
import { StickFigureAvatar } from './StickFigureAvatar';
import { HandDrawnSmileyIcon } from './HandDrawnSmileyIcon';

interface LeftSidebarProps {
  activeTab: 'plan' | 'session' | 'lectures' | 'quiz' | 'examiner' | 'cards' | 'streak' | 'level-drill' | 'mistakes' | 'leaderboard' | 'achievements' | 'creator' | 'github';
  setActiveTab: (tab: 'plan' | 'session' | 'lectures' | 'quiz' | 'examiner' | 'cards' | 'streak' | 'level-drill' | 'mistakes' | 'leaderboard' | 'achievements' | 'creator' | 'github') => void;
  streak: number;
  freezeTokens: number;
  totalXp: number;
  levelTitle: string;
  activeExamPlan?: ExamPlan | null;
  unfixedMistakesCount?: number;
  onResetProgress?: () => void;
  completedMilestones?: number[];
  activeMilestoneIndex?: number;
  onSelectMilestoneIndex?: (index: number) => void;
  onToggleCompleteMilestone?: (index: number) => void;
  onOpenLevelPractice?: (index: number) => void;
  isOpenMobile: boolean;
  setIsOpenMobile: (open: boolean) => void;
  userProfile?: UserProfileCustomization;
  onOpenCustomizer?: () => void;
  dailyStudyGoal?: DailyStudyGoal;
  onUpdateTargetMinutes?: (minutes: number) => void;
  onAddStudyMinutes?: (minutes: number) => void;
}

export const LeftSidebar: React.FC<LeftSidebarProps> = ({
  activeTab,
  setActiveTab,
  streak,
  freezeTokens,
  totalXp,
  levelTitle,
  activeExamPlan,
  unfixedMistakesCount = 0,
  onResetProgress,
  completedMilestones = [],
  activeMilestoneIndex = 0,
  onSelectMilestoneIndex,
  onToggleCompleteMilestone,
  onOpenLevelPractice,
  isOpenMobile,
  setIsOpenMobile,
  userProfile,
  onOpenCustomizer,
  dailyStudyGoal,
  onUpdateTargetMinutes,
  onAddStudyMinutes,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [soundOn, setSoundOn] = useState(isSoundEnabled());
  const [showResetModal, setShowResetModal] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);

  // Daily study goal calculations
  const targetMinutes = Math.max(
    5,
    dailyStudyGoal?.targetMinutes ?? (dailyStudyGoal?.targetHours ? Math.round(dailyStudyGoal.targetHours * 60) : 60)
  );
  const completedMinutes = Math.max(0, dailyStudyGoal?.completedMinutes ?? 0);
  const progressPercent = Math.min(100, Math.round((completedMinutes / targetMinutes) * 100));
  const isGoalMet = completedMinutes >= targetMinutes;

  const [selectedMinutesInput, setSelectedMinutesInput] = useState<number>(targetMinutes);

  const handleQuickAddMinutes = (amount: number) => {
    onAddStudyMinutes?.(amount);
    if (completedMinutes + amount >= targetMinutes && !isGoalMet) {
      playCorrectSound();
    } else {
      playStreakFlameSound();
    }
  };

  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    setSoundEnabled(next);
    if (next) playStreakFlameSound();
  };

  const navItems = [
    {
      id: 'level-drill' as const,
      label: 'Level Mission Drill',
      shortLabel: 'Mission Quiz',
      icon: HelpCircle,
      color: 'text-cyan-400',
      activeColor: 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300 font-bold',
      badge: `L${activeMilestoneIndex + 1} Drill`,
    },
    {
      id: 'mistakes' as const,
      label: 'Mistake Vault & Fix',
      shortLabel: 'Fix Mistakes',
      icon: AlertCircle,
      color: 'text-rose-400',
      activeColor: 'bg-rose-500/15 border-rose-500/40 text-rose-300 font-bold',
      badge: unfixedMistakesCount > 0 ? `${unfixedMistakesCount} Fix` : undefined,
    },
    {
      id: 'session' as const,
      label: 'AI Study Session',
      shortLabel: 'Session',
      icon: Sparkles,
      color: 'text-amber-400',
      activeColor: 'bg-amber-500/15 border-amber-500/40 text-amber-300 font-bold',
      badge: 'Timer',
    },
    {
      id: 'plan' as const,
      label: activeExamPlan ? '5-Step Study Simulator' : 'AI Intake Interview',
      shortLabel: activeExamPlan ? '5-Step Simulator' : 'Interview',
      icon: Target,
      color: 'text-blue-400',
      activeColor: 'bg-blue-500/15 border-blue-500/40 text-blue-300 font-bold',
      badge: activeExamPlan ? '5-Step' : 'Interview',
    },
    {
      id: 'lectures' as const,
      label: 'Lectures & Mindmaps',
      shortLabel: 'Mindmaps',
      icon: BookOpen,
      color: 'text-amber-400',
      activeColor: 'bg-amber-500/15 border-amber-500/40 text-amber-300 font-bold',
    },
    {
      id: 'quiz' as const,
      label: 'Daily Practice Quiz',
      shortLabel: 'Daily Quiz',
      icon: HelpCircle,
      color: 'text-amber-400',
      activeColor: 'bg-amber-500/15 border-amber-500/40 text-amber-300 font-bold',
    },
    {
      id: 'creator' as const,
      label: 'Gemini Question Studio',
      shortLabel: 'AI Creator',
      icon: Wand2,
      color: 'text-cyan-400',
      activeColor: 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300 font-bold',
      badge: 'Gemini AI',
    },
    {
      id: 'examiner' as const,
      label: 'The Angry Examiner',
      shortLabel: 'Examiner',
      icon: HandDrawnSmileyIcon,
      color: 'text-amber-400',
      activeColor: 'bg-amber-500/15 border-amber-500/40 text-amber-300 font-bold',
      badge: 'Interview',
    },
    {
      id: 'cards' as const,
      label: 'Spaced Repetition',
      shortLabel: 'Flashcards',
      icon: CreditCard,
      color: 'text-amber-400',
      activeColor: 'bg-amber-500/15 border-amber-500/40 text-amber-300 font-bold',
    },
    {
      id: 'streak' as const,
      label: 'Retention & Calendar',
      shortLabel: 'Calendar',
      icon: TrendingUp,
      color: 'text-amber-400',
      activeColor: 'bg-amber-500/15 border-amber-500/40 text-amber-300 font-bold',
      badge: `${streak}d`,
    },
    {
      id: 'achievements' as const,
      label: 'Achievements & Badges',
      shortLabel: 'Badges',
      icon: Award,
      color: 'text-amber-400',
      activeColor: 'bg-amber-500/15 border-amber-500/40 text-amber-300 font-bold',
      badge: 'Badges',
    },
    {
      id: 'leaderboard' as const,
      label: 'Leaderboard & Ranks',
      shortLabel: 'Leaderboard',
      icon: Trophy,
      color: 'text-amber-400',
      activeColor: 'bg-amber-500/15 border-amber-500/40 text-amber-300 font-bold',
      badge: 'Global',
    },
    {
      id: 'github' as const,
      label: 'GitHub Study Hub',
      shortLabel: 'GitHub',
      icon: Github,
      color: 'text-cyan-400',
      activeColor: 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300 font-bold',
      badge: 'Git Sync',
    },
  ];

  return (
    <>
      {/* DESKTOP HOVER-EXPANDABLE LEFT SIDEBAR RAIL */}
      <div
        className={`relative z-30 shrink-0 hidden md:block transition-all duration-300 ease-in-out h-screen sticky top-0 ${
          isHovered ? 'w-64 lg:w-72' : 'w-16 lg:w-18'
        }`}
      >
        <aside
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className={`absolute left-0 top-0 bottom-0 bg-slate-950/95 backdrop-blur-md border-r border-slate-800 h-screen flex flex-col transition-all duration-300 ease-in-out z-40 select-none ${
            isHovered
              ? 'w-64 lg:w-72 shadow-2xl shadow-black/90 ring-1 ring-white/10'
              : 'w-16 lg:w-18'
          }`}
        >
          {/* Pinned Top Brand Header */}
          <div className="p-3 pb-2.5 shrink-0 border-b border-slate-900/80">
            {/* Logo / Brand Header */}
            <button
              onClick={() => setActiveTab(activeExamPlan ? 'plan' : 'lectures')}
              className="w-full text-left group cursor-pointer focus:outline-none flex items-center gap-3 p-1 rounded-xl hover:bg-slate-900/60 transition-colors"
              title="Smart Study"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-600 via-amber-500 to-amber-600 flex items-center justify-center text-slate-950 font-black text-base shadow-lg shadow-rose-950/40 shrink-0 group-hover:scale-105 transition-transform">
                ⚡
              </div>

              {/* Extended Brand Text on hover */}
              <div className={`overflow-hidden transition-all duration-300 whitespace-nowrap ${
                isHovered ? 'opacity-100 max-w-[200px]' : 'opacity-0 max-w-0'
              }`}>
                <span className="text-sm lg:text-base font-bold font-display text-white tracking-tight group-hover:text-amber-400 transition-colors block leading-tight">
                  Smart Study
                </span>
                <span className="text-[10px] text-slate-400 font-mono block">
                  {levelTitle} · {totalXp} XP
                </span>
              </div>
            </button>
          </div>

          {/* Scrollable Center Body with sleek custom scrollbar */}
          <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-3 space-y-4 custom-sidebar-scroll">
            {/* AI Step-by-Step Study Roadmap Levels Button */}
            <div className="py-1">
              <RoadmapLevelsButton
                milestones={activeExamPlan?.milestones}
                completedLevels={completedMilestones}
                activeLevelIndex={activeMilestoneIndex}
                onSelectLevel={(idx) => {
                  onSelectMilestoneIndex?.(idx);
                  onOpenLevelPractice?.(idx);
                  setActiveTab('level-drill');
                }}
                onToggleCompleteLevel={onToggleCompleteMilestone}
                onStartStudyForLevel={() => {
                  setActiveTab('session');
                }}
                onViewFullRoadmap={() => {
                  setActiveTab('plan');
                }}
                onOpenLevelPractice={(idx) => {
                  onOpenLevelPractice?.(idx);
                  setActiveTab('level-drill');
                }}
                isCompact={!isHovered}
                className={isHovered ? 'w-full justify-between' : ''}
              />
            </div>

            {/* Navigation Buttons */}
            <nav className="space-y-1 pt-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    title={item.label}
                    className={`w-full flex items-center transition-all cursor-pointer text-left group relative ${
                      isHovered
                        ? `px-3 py-2.5 rounded-xl border justify-between ${
                            isActive
                              ? `${item.activeColor} shadow-md`
                              : 'bg-transparent border-transparent text-slate-300 hover:bg-slate-900/80 hover:text-white'
                          }`
                        : `h-10 w-10 mx-auto justify-center rounded-xl border ${
                            isActive
                              ? `${item.activeColor} shadow-sm`
                              : 'border-transparent text-slate-400 hover:bg-slate-900 hover:text-white'
                          }`
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Icon className={`w-5 h-5 shrink-0 ${
                        isActive ? 'text-amber-400' : 'text-slate-400 group-hover:text-amber-400'
                      }`} />

                      {/* Label on hover */}
                      <span className={`text-xs truncate transition-all duration-300 whitespace-nowrap ${
                        isHovered ? 'opacity-100 max-w-[150px]' : 'opacity-0 max-w-0'
                      }`}>
                        {item.label}
                      </span>
                    </div>

                    {/* Badge on hover */}
                    {item.badge && isHovered && (
                      <span className={`text-[10px] font-mono-numbers px-1.5 py-0.5 rounded font-semibold shrink-0 transition-opacity ${
                        isActive
                          ? 'bg-slate-950/80 text-amber-300 border border-amber-500/30'
                          : 'bg-slate-900 text-slate-400 border border-slate-800'
                      }`}>
                        {item.badge}
                      </span>
                    )}

                    {/* Collapsed active dot indicator */}
                    {!isHovered && isActive && (
                      <span className="absolute right-1 top-1 w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Bottom Section: Controls & Stats */}
            <div className="pt-3 border-t border-slate-800/80 space-y-2.5">
            {isHovered ? (
              /* Expanded Bottom Controls */
              <div className="space-y-2.5 animate-fadeIn">
                {/* Daily Study Goal Card with Progress Bar */}
                <div className="bg-slate-900/90 border border-slate-800 hover:border-amber-500/30 rounded-2xl p-2.5 space-y-2 shadow-inner group/goal transition-all">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <div className={`w-5 h-5 rounded-lg flex items-center justify-center shrink-0 ${
                        isGoalMet ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                      }`}>
                        <Target className="w-3 h-3" />
                      </div>
                      <span className="text-xs font-bold text-white tracking-tight truncate">
                        Daily Study Goal
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <span className={`text-[10px] font-mono-numbers px-1.5 py-0.5 rounded font-bold ${
                        isGoalMet
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                      }`}>
                        {isGoalMet ? '✓ Done' : `${progressPercent}%`}
                      </span>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedMinutesInput(targetMinutes);
                          setShowGoalModal(true);
                        }}
                        className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
                        title="Set target study minutes"
                      >
                        <Settings2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Progress numbers & text */}
                  <div className="flex items-baseline justify-between text-[11px]">
                    <div className="text-slate-300 font-mono-numbers">
                      <span className="font-bold text-white text-xs">{completedMinutes}</span>
                      <span className="text-slate-500"> / {targetMinutes} min</span>
                    </div>
                    <span className={`text-[10px] font-medium ${isGoalMet ? 'text-emerald-400' : 'text-slate-400'}`}>
                      {isGoalMet ? 'Goal reached today! 🎉' : `${Math.max(0, targetMinutes - completedMinutes)}m left`}
                    </span>
                  </div>

                  {/* Animated Progress Bar */}
                  <div
                    onClick={() => {
                      setSelectedMinutesInput(targetMinutes);
                      setShowGoalModal(true);
                    }}
                    className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800 cursor-pointer relative"
                    title="Click to change target study minutes"
                  >
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isGoalMet
                          ? 'bg-gradient-to-r from-emerald-500 to-amber-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]'
                          : 'bg-gradient-to-r from-amber-500 via-rose-500 to-amber-400'
                      }`}
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>

                  {/* Quick Action row */}
                  <div className="flex items-center gap-1.5 pt-0.5">
                    <button
                      type="button"
                      onClick={() => handleQuickAddMinutes(15)}
                      className="flex-1 py-1 px-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 hover:border-amber-500/30 text-[10px] font-semibold text-slate-300 hover:text-amber-300 flex items-center justify-center gap-1 transition-colors cursor-pointer"
                      title="Quick log +15 minutes of study"
                    >
                      <Plus className="w-2.5 h-2.5 text-amber-400" />
                      <span>+15m</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedMinutesInput(targetMinutes);
                        setShowGoalModal(true);
                      }}
                      className="flex-1 py-1 px-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-[10px] font-semibold text-amber-300 flex items-center justify-center gap-1 transition-colors cursor-pointer"
                      title="Change daily target minutes"
                    >
                      <Clock className="w-2.5 h-2.5 text-amber-400" />
                      <span>Set Goal</span>
                    </button>
                  </div>
                </div>

                {/* Scholar Profile Stick Figure Badge */}
                <div
                  onClick={() => onOpenCustomizer?.()}
                  className="flex items-center gap-2.5 p-2 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-amber-500/40 cursor-pointer transition-all group shadow-inner"
                  title="Customize your stick figure profile"
                >
                  <StickFigureAvatar
                    config={userProfile?.stickFigure}
                    seed="You"
                    size={36}
                    className="rounded-xl transition-transform group-hover:scale-105 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-white truncate font-display group-hover:text-amber-300">
                      {userProfile?.displayName || 'You (Scholar)'}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono truncate">
                      @{userProfile?.username || 'scholar'} · {totalXp} XP
                    </div>
                  </div>
                  <Palette className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-400 shrink-0" />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('streak');
                      playStreakFlameSound();
                    }}
                    className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-semibold hover:bg-amber-500/20 transition-colors cursor-pointer"
                    title="Study Streak"
                  >
                    <Flame className="w-3.5 h-3.5 text-amber-400 animate-pulse fill-amber-500/30 shrink-0" />
                    <span className="font-mono-numbers">{streak}d Streak</span>
                  </button>

                  <div
                    title={`${freezeTokens} streak freeze shields available`}
                    className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-cyan-300 text-xs font-mono-numbers"
                  >
                    <Shield className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span>{freezeTokens} Shields</span>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <button
                    onClick={toggleSound}
                    aria-label={soundOn ? 'Mute sound effects' : 'Enable sound effects'}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-slate-400 hover:text-slate-200 hover:bg-slate-900 rounded-xl border border-slate-800 text-xs transition-colors cursor-pointer"
                  >
                    {soundOn ? (
                      <>
                        <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                        <span>Sound On</span>
                      </>
                    ) : (
                      <>
                        <VolumeX className="w-3.5 h-3.5" />
                        <span>Muted</span>
                      </>
                    )}
                  </button>

                  <a
                    href="/api/download-single-file"
                    download="smart-study-single-file.html"
                    title="Download entire website as 1 self-contained HTML file"
                    className="flex items-center justify-center gap-1 py-2 px-2.5 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-cyan-500/40 text-cyan-300 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <FileDown className="w-3.5 h-3.5 text-cyan-400" />
                    <span>1-File</span>
                  </a>

                  {onResetProgress && (
                    <button
                      onClick={() => setShowResetModal(true)}
                      className="flex items-center gap-1 py-2 px-2.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/40 text-rose-300 hover:text-rose-200 text-xs font-semibold transition-colors cursor-pointer"
                      title="Restart student's entire progress on the app"
                    >
                      <RotateCcw className="w-3 h-3 text-rose-400" />
                      <span>Reset</span>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              /* Collapsed Icons Bottom Controls */
              <div className="space-y-2 flex flex-col items-center">
                {/* Collapsed Daily Study Goal Mini Progress Ring */}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedMinutesInput(targetMinutes);
                    setShowGoalModal(true);
                  }}
                  className="w-10 h-10 rounded-xl border border-slate-800 hover:border-amber-500/40 bg-slate-950/80 flex flex-col items-center justify-center cursor-pointer transition-colors relative group"
                  title={`Daily Goal: ${completedMinutes}/${targetMinutes} min (${progressPercent}%) - Click to set target`}
                >
                  <div className="relative w-6 h-6 flex items-center justify-center">
                    <svg className="w-6 h-6 -rotate-90" viewBox="0 0 24 24">
                      <circle
                        cx="12"
                        cy="12"
                        r="9"
                        fill="none"
                        stroke="#1e293b"
                        strokeWidth="2.5"
                      />
                      <circle
                        cx="12"
                        cy="12"
                        r="9"
                        fill="none"
                        stroke={isGoalMet ? '#34d399' : '#f59e0b'}
                        strokeWidth="2.5"
                        strokeDasharray={56.5}
                        strokeDashoffset={56.5 - (56.5 * progressPercent) / 100}
                        strokeLinecap="round"
                        className="transition-all duration-500"
                      />
                    </svg>
                    <Target className={`w-2.5 h-2.5 absolute ${isGoalMet ? 'text-emerald-400' : 'text-amber-400'}`} />
                  </div>
                  <span className="text-[8px] font-mono-numbers font-bold text-slate-300 leading-none mt-0.5">
                    {completedMinutes}m
                  </span>
                </button>

                {/* Collapsed Stick Figure Profile Button */}
                <button
                  type="button"
                  onClick={() => onOpenCustomizer?.()}
                  className="w-10 h-10 rounded-xl border border-slate-800 hover:border-amber-500/40 flex items-center justify-center cursor-pointer transition-colors p-0.5"
                  title="Customize Stick Figure Profile"
                >
                  <StickFigureAvatar
                    config={userProfile?.stickFigure}
                    seed="You"
                    size={32}
                  />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('streak');
                    playStreakFlameSound();
                  }}
                  className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 flex items-center justify-center cursor-pointer hover:bg-amber-500/20 transition-colors relative"
                  title={`${streak} Days Streak - Click to view`}
                >
                  <Flame className="w-4 h-4 text-amber-400 animate-pulse fill-amber-500/30" />
                  <span className="absolute -top-1 -right-1 text-[8px] font-mono-numbers px-1 bg-amber-500 text-slate-950 font-bold rounded-full">
                    {streak}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={toggleSound}
                  aria-label={soundOn ? 'Mute audio' : 'Enable audio'}
                  className="w-10 h-10 rounded-xl border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-900 flex items-center justify-center cursor-pointer transition-colors"
                  title={soundOn ? 'Sound is on (Click to mute)' : 'Sound is muted (Click to enable)'}
                >
                  {soundOn ? <Volume2 className="w-4 h-4 text-amber-400" /> : <VolumeX className="w-4 h-4" />}
                </button>

                {onResetProgress && (
                  <button
                    type="button"
                    onClick={() => setShowResetModal(true)}
                    className="w-10 h-10 rounded-xl border border-rose-900/40 text-rose-400 hover:bg-rose-950/40 flex items-center justify-center cursor-pointer transition-colors"
                    title="Restart Progress"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </aside>
      </div>

      {/* MOBILE DRAWER OVERLAY */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm md:hidden animate-fadeIn"
          onClick={() => setIsOpenMobile(false)}
        >
          <div
            className="w-72 bg-slate-950 border-r border-slate-800 h-full overflow-y-auto p-4 flex flex-col justify-between custom-sidebar-scroll"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div
                  onClick={() => {
                    setIsOpenMobile(false);
                    onOpenCustomizer?.();
                  }}
                  className="flex items-center gap-2.5 cursor-pointer group"
                  title="Click to customize stick figure"
                >
                  <StickFigureAvatar
                    config={userProfile?.stickFigure}
                    seed="You"
                    size={38}
                    className="rounded-xl transition-transform group-hover:scale-105"
                  />
                  <div>
                    <span className="text-base font-bold font-display text-white block group-hover:text-amber-300">
                      {userProfile?.displayName || 'Smart Study'}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {levelTitle} · {totalXp} XP
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsOpenMobile(false)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Roadmap Levels on Mobile Drawer */}
              <div className="space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block px-1">
                  Study Roadmap Level Track
                </span>
                <RoadmapLevelsButton
                  milestones={activeExamPlan?.milestones}
                  completedLevels={completedMilestones}
                  activeLevelIndex={activeMilestoneIndex}
                  onSelectLevel={(idx) => {
                    onSelectMilestoneIndex?.(idx);
                    onOpenLevelPractice?.(idx);
                    setActiveTab('level-drill');
                    setIsOpenMobile(false);
                  }}
                  onToggleCompleteLevel={onToggleCompleteMilestone}
                  onStartStudyForLevel={() => {
                    setActiveTab('session');
                    setIsOpenMobile(false);
                  }}
                  onViewFullRoadmap={() => {
                    setActiveTab('plan');
                    setIsOpenMobile(false);
                  }}
                  onOpenLevelPractice={(idx) => {
                    onOpenLevelPractice?.(idx);
                    setActiveTab('level-drill');
                    setIsOpenMobile(false);
                  }}
                  className="w-full justify-between"
                />
              </div>

              {/* Mobile Nav Links */}
              <nav className="space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;

                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        setIsOpenMobile(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl border text-xs transition-all cursor-pointer text-left ${
                        isActive
                          ? `${item.activeColor} shadow-md`
                          : 'bg-transparent border-transparent text-slate-300 hover:bg-slate-900/80 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-slate-400'}`} />
                        <span>{item.label}</span>
                      </div>

                      {item.badge && (
                        <span className={`text-[10px] font-mono-numbers px-1.5 py-0.5 rounded font-semibold ${
                          isActive
                            ? 'bg-slate-950/80 text-amber-300 border border-amber-500/30'
                            : 'bg-slate-900 text-slate-400 border border-slate-800'
                        }`}>
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
              {/* Daily Study Goal on Mobile Drawer */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                      isGoalMet ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                    }`}>
                      <Target className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white block">
                        Daily Study Goal
                      </span>
                      <span className="text-[10px] text-slate-400 block font-mono">
                        {completedMinutes} / {targetMinutes} min
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className={`text-[10px] font-mono-numbers px-2 py-0.5 rounded font-bold ${
                      isGoalMet
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                    }`}>
                      {isGoalMet ? '✓ Goal Met' : `${progressPercent}%`}
                    </span>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedMinutesInput(targetMinutes);
                        setShowGoalModal(true);
                      }}
                      className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg cursor-pointer"
                      title="Set target study minutes"
                    >
                      <Settings2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Mobile Progress Bar */}
                <div
                  onClick={() => {
                    setSelectedMinutesInput(targetMinutes);
                    setShowGoalModal(true);
                  }}
                  className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden border border-slate-800 cursor-pointer relative"
                  title="Click to change target study minutes"
                >
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isGoalMet
                        ? 'bg-gradient-to-r from-emerald-500 to-amber-400'
                        : 'bg-gradient-to-r from-amber-500 via-rose-500 to-amber-400'
                    }`}
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>

                <div className="flex items-center gap-2 pt-0.5">
                  <button
                    type="button"
                    onClick={() => handleQuickAddMinutes(15)}
                    className="flex-1 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 flex items-center justify-center gap-1 cursor-pointer transition-colors"
                  >
                    <Plus className="w-3 h-3 text-amber-400" />
                    <span>+15 min</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedMinutesInput(targetMinutes);
                      setShowGoalModal(true);
                    }}
                    className="flex-1 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 text-xs font-semibold text-amber-300 flex items-center justify-center gap-1 cursor-pointer transition-colors"
                  >
                    <Clock className="w-3 h-3 text-amber-400" />
                    <span>Set Target</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Mobile Footer */}
            <div className="pt-3 border-t border-slate-800/80 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('streak');
                    playStreakFlameSound();
                    setIsOpenMobile(false);
                  }}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-semibold cursor-pointer"
                >
                  <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-500/30" />
                  <span className="font-mono-numbers">{streak}d Streak</span>
                </button>

                <div className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-cyan-300 text-xs font-mono-numbers">
                  <Shield className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{freezeTokens} Shields</span>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2">
                <button
                  onClick={toggleSound}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-slate-400 hover:text-slate-200 hover:bg-slate-900 rounded-xl border border-slate-800 text-xs cursor-pointer"
                >
                  {soundOn ? <Volume2 className="w-3.5 h-3.5 text-amber-400" /> : <VolumeX className="w-3.5 h-3.5" />}
                  <span>{soundOn ? 'Sound On' : 'Muted'}</span>
                </button>

                <a
                  href="/api/download-single-file"
                  download="smart-study-single-file.html"
                  title="Download entire website as 1 self-contained HTML file"
                  className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 text-cyan-300 text-xs font-semibold cursor-pointer"
                >
                  <FileDown className="w-3.5 h-3.5 text-cyan-400" />
                  <span>1-File HTML</span>
                </a>

                {onResetProgress && (
                  <button
                    onClick={() => setShowResetModal(true)}
                    className="flex items-center gap-1 py-2 px-3 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/40 text-rose-300 text-xs font-semibold cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3 text-rose-400" />
                    <span>Reset</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reset Confirmation Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">Restart All Progress?</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                This will reset your study streak, earned XP, daily question goals, and exam battle plan back to Day 1.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  playIncorrectSound();
                  setShowResetModal(false);
                  setActiveTab('plan');
                  onResetProgress?.();
                }}
                className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold cursor-pointer shadow-lg shadow-rose-950/50"
              >
                Yes, Reset All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Set Daily Study Goal Modal */}
      {showGoalModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden animate-scaleUp">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Target className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-display">
                    Daily Study Goal
                  </h3>
                  <p className="text-xs text-slate-400">
                    Set target study minutes for today
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowGoalModal(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-5 max-h-[75vh] overflow-y-auto">
              {/* Current Status Banner */}
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-medium">
                    Today's Progress
                  </span>
                  <span className={`text-xs font-bold font-mono-numbers px-2 py-0.5 rounded ${
                    completedMinutes >= selectedMinutesInput
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-amber-500/15 text-amber-300 border border-amber-500/25'
                  }`}>
                    {completedMinutes >= selectedMinutesInput ? '🎉 Goal Met!' : `${Math.min(100, Math.round((completedMinutes / Math.max(1, selectedMinutesInput)) * 100))}%`}
                  </span>
                </div>

                <div className="flex items-baseline justify-between">
                  <div className="text-sm font-mono-numbers">
                    <span className="text-xl font-black text-white">{completedMinutes}</span>
                    <span className="text-slate-400 text-xs"> / {selectedMinutesInput} min target</span>
                  </div>
                  <span className="text-xs text-slate-400">
                    {completedMinutes >= selectedMinutesInput
                      ? `${completedMinutes - selectedMinutesInput}m bonus beyond goal`
                      : `${Math.max(0, selectedMinutesInput - completedMinutes)}m remaining`}
                  </span>
                </div>

                <div className="w-full bg-slate-900 rounded-full h-2.5 overflow-hidden border border-slate-800">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      completedMinutes >= selectedMinutesInput
                        ? 'bg-gradient-to-r from-emerald-500 to-amber-400'
                        : 'bg-gradient-to-r from-amber-500 to-rose-500'
                    }`}
                    style={{
                      width: `${Math.min(100, Math.round((completedMinutes / Math.max(1, selectedMinutesInput)) * 100))}%`,
                    }}
                  />
                </div>
              </div>

              {/* Target Minutes Stepper & Input */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                  Daily Target Minutes
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedMinutesInput(prev => Math.max(5, prev - 15))}
                    className="w-12 h-11 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm border border-slate-700 flex items-center justify-center cursor-pointer transition-colors"
                    title="-15 minutes"
                  >
                    -15
                  </button>

                  <div className="flex-1 relative">
                    <input
                      type="number"
                      min={5}
                      max={720}
                      step={5}
                      value={selectedMinutesInput}
                      onChange={(e) => setSelectedMinutesInput(Math.max(5, Math.min(720, parseInt(e.target.value) || 5)))}
                      className="w-full h-11 text-center font-mono-numbers text-lg font-black bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl text-white outline-none"
                    />
                    <span className="absolute right-3 top-3 text-xs text-slate-500 font-mono pointer-events-none">
                      min
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedMinutesInput(prev => Math.min(720, prev + 15))}
                    className="w-12 h-11 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm border border-slate-700 flex items-center justify-center cursor-pointer transition-colors"
                    title="+15 minutes"
                  >
                    +15
                  </button>
                </div>

                <input
                  type="range"
                  min={10}
                  max={180}
                  step={5}
                  value={Math.min(180, selectedMinutesInput)}
                  onChange={(e) => setSelectedMinutesInput(parseInt(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer mt-1"
                />
              </div>

              {/* Quick Presets */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-400 block">
                  Quick Presets:
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { mins: 15, label: '15 min', sub: 'Sprint' },
                    { mins: 30, label: '30 min', sub: 'Standard' },
                    { mins: 45, label: '45 min', sub: 'Focus' },
                    { mins: 60, label: '60 min', sub: '1 Hour' },
                    { mins: 90, label: '90 min', sub: 'Deep Work' },
                    { mins: 120, label: '120 min', sub: 'Marathon' },
                  ].map((preset) => (
                    <button
                      key={preset.mins}
                      type="button"
                      onClick={() => setSelectedMinutesInput(preset.mins)}
                      className={`py-2 px-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                        selectedMinutesInput === preset.mins
                          ? 'bg-amber-500/20 border-amber-500/60 text-amber-300 font-bold shadow-md'
                          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white'
                      }`}
                    >
                      <div className="text-xs font-bold font-mono-numbers">{preset.label}</div>
                      <div className="text-[10px] text-slate-500">{preset.sub}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Offline Study Quick-Add */}
              <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/60 space-y-2">
                <span className="text-[11px] font-semibold text-slate-400 block">
                  Studied offline or read textbooks today?
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickAddMinutes(15)}
                    className="flex-1 py-1.5 px-2 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-xs font-semibold text-slate-300 hover:text-amber-300 flex items-center justify-center gap-1 cursor-pointer transition-colors"
                  >
                    <Plus className="w-3 h-3 text-amber-400" />
                    <span>Log +15m</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickAddMinutes(30)}
                    className="flex-1 py-1.5 px-2 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-xs font-semibold text-slate-300 hover:text-amber-300 flex items-center justify-center gap-1 cursor-pointer transition-colors"
                  >
                    <Plus className="w-3 h-3 text-amber-400" />
                    <span>Log +30m</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowGoalModal(false)}
                className="py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onUpdateTargetMinutes?.(selectedMinutesInput);
                  setShowGoalModal(false);
                  playStreakFlameSound();
                }}
                className="py-2 px-5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-bold cursor-pointer transition-all shadow-lg shadow-amber-500/20 flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Save Goal ({selectedMinutesInput} min)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
