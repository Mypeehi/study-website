import React, { useState } from 'react';
import { Volume2, VolumeX, Shield, Flame, Calendar, Target, Sparkles, Clock, RotateCcw, AlertTriangle, Trophy } from 'lucide-react';
import { isSoundEnabled, setSoundEnabled, playStreakFlameSound, playIncorrectSound } from '../utils/audio';
import { ExamPlan, UserProfileCustomization, DailyStudyGoal } from '../types';
import { RoadmapLevelsButton } from './RoadmapLevelsButton';
import { StickFigureAvatar } from './StickFigureAvatar';
import { DailyStudyGoalTracker } from './DailyStudyGoalTracker';

interface TopNavbarProps {
  activeTab: 'plan' | 'session' | 'lectures' | 'quiz' | 'examiner' | 'cards' | 'streak';
  setActiveTab: (tab: 'plan' | 'session' | 'lectures' | 'quiz' | 'examiner' | 'cards' | 'streak') => void;
  streak: number;
  freezeTokens: number;
  totalXp: number;
  levelTitle: string;
  activeExamPlan?: ExamPlan | null;
  onResetProgress?: () => void;
  completedMilestones?: number[];
  activeMilestoneIndex?: number;
  onSelectMilestoneIndex?: (index: number) => void;
  onToggleCompleteMilestone?: (index: number) => void;
  userProfile?: UserProfileCustomization;
  onOpenCustomizer?: () => void;
  dailyStudyGoal?: DailyStudyGoal;
  onUpdateTargetMinutes?: (minutes: number) => void;
  onAddStudyMinutes?: (minutes: number) => void;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({
  activeTab,
  setActiveTab,
  streak,
  freezeTokens,
  totalXp,
  levelTitle,
  activeExamPlan,
  onResetProgress,
  completedMilestones,
  activeMilestoneIndex,
  onSelectMilestoneIndex,
  onToggleCompleteMilestone,
  userProfile,
  onOpenCustomizer,
  dailyStudyGoal,
  onUpdateTargetMinutes,
  onAddStudyMinutes,
}) => {
  const [soundOn, setSoundOn] = useState(isSoundEnabled());
  const [showResetModal, setShowResetModal] = useState(false);

  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    setSoundEnabled(next);
    if (next) playStreakFlameSound();
  };

  return (
    <header className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur-md border-b border-slate-800">
      <div className="w-full px-3 sm:px-6 h-16 flex items-center justify-start gap-2 sm:gap-3 overflow-x-auto scrollbar-none">
        {/* Left Side Wordmark */}
        <button
          onClick={() => setActiveTab(activeExamPlan ? 'plan' : 'lectures')}
          className="text-left group cursor-pointer focus:outline-none flex items-center gap-2 shrink-0 mr-1"
        >
          <span className="text-base sm:text-lg font-bold font-display text-white tracking-tight group-hover:text-amber-400 transition-colors whitespace-nowrap">
            Smart Study
          </span>
        </button>

        {/* AI Roadmap Levels Button right on the top left navigation */}
        <div className="shrink-0">
          <RoadmapLevelsButton
            milestones={activeExamPlan?.milestones}
            completedLevels={completedMilestones || []}
            activeLevelIndex={activeMilestoneIndex || 0}
            onSelectLevel={(idx) => {
              onSelectMilestoneIndex?.(idx);
              setActiveTab('plan');
            }}
            onToggleCompleteLevel={onToggleCompleteMilestone}
            onStartStudyForLevel={() => {
              setActiveTab('session');
            }}
            onViewFullRoadmap={() => {
              setActiveTab('plan');
            }}
          />
        </div>

        {/* Clean text navigation links on the left side */}
        <nav className="flex items-center gap-1 sm:gap-1.5 text-xs sm:text-sm font-medium text-slate-300 shrink-0">
          <button
            onClick={() => setActiveTab('session')}
            className={`transition-colors relative py-1 px-2.5 rounded-xl cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'session'
                ? 'text-amber-300 font-bold bg-amber-500/15 border border-amber-500/30 shadow-sm'
                : 'hover:text-white hover:bg-slate-900 border border-transparent'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>AI Study Session</span>
          </button>
          <button
            onClick={() => setActiveTab('plan')}
            className={`transition-colors relative py-1 px-2.5 rounded-xl cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'plan'
                ? 'text-rose-300 font-semibold bg-rose-500/15 border border-rose-500/30 shadow-sm'
                : 'hover:text-white hover:bg-slate-900 border border-transparent'
            }`}
          >
            <span>Exam War Plan</span>
            {activeExamPlan && (
              <span className="text-[10px] font-mono-numbers px-1.5 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800/80 font-bold">
                {activeExamPlan.daysRemaining}d
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('lectures')}
            className={`transition-colors relative py-1 px-2.5 rounded-xl cursor-pointer whitespace-nowrap ${
              activeTab === 'lectures'
                ? 'text-amber-300 font-semibold bg-amber-500/15 border border-amber-500/30 shadow-sm'
                : 'hover:text-white hover:bg-slate-900 border border-transparent'
            }`}
          >
            Lectures & Notes
          </button>
          <button
            onClick={() => setActiveTab('quiz')}
            className={`transition-colors relative py-1 px-2.5 rounded-xl cursor-pointer whitespace-nowrap ${
              activeTab === 'quiz'
                ? 'text-amber-300 font-semibold bg-amber-500/15 border border-amber-500/30 shadow-sm'
                : 'hover:text-white hover:bg-slate-900 border border-transparent'
            }`}
          >
            Daily Quiz
          </button>
          <button
            onClick={() => setActiveTab('examiner')}
            className={`transition-colors relative py-1 px-2.5 rounded-xl cursor-pointer whitespace-nowrap ${
              activeTab === 'examiner'
                ? 'text-rose-300 font-semibold bg-rose-500/15 border border-rose-500/30 shadow-sm'
                : 'hover:text-white hover:bg-slate-900 border border-transparent'
            }`}
          >
            The Angry Examiner
          </button>
          <button
            onClick={() => setActiveTab('cards')}
            className={`transition-colors relative py-1 px-2.5 rounded-xl cursor-pointer whitespace-nowrap ${
              activeTab === 'cards'
                ? 'text-amber-300 font-semibold bg-amber-500/15 border border-amber-500/30 shadow-sm'
                : 'hover:text-white hover:bg-slate-900 border border-transparent'
            }`}
          >
            Flashcards
          </button>
          <button
            onClick={() => setActiveTab('streak')}
            className={`transition-colors relative py-1 px-2.5 rounded-xl cursor-pointer whitespace-nowrap ${
              activeTab === 'streak'
                ? 'text-amber-300 font-semibold bg-amber-500/15 border border-amber-500/30 shadow-sm'
                : 'hover:text-white hover:bg-slate-900 border border-transparent'
            }`}
          >
            Streaks
          </button>
          <button
            onClick={() => (setActiveTab as any)('leaderboard')}
            className={`transition-colors relative py-1 px-2.5 rounded-xl cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              (activeTab as any) === 'leaderboard'
                ? 'text-amber-300 font-semibold bg-amber-500/15 border border-amber-500/30 shadow-sm'
                : 'hover:text-white hover:bg-slate-900 border border-transparent'
            }`}
          >
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>Leaderboard</span>
          </button>
        </nav>

        {/* Prominent Daily Study Goal Tracker Bar Component */}
        <div className="shrink-0 flex items-center px-1">
          <DailyStudyGoalTracker
            dailyStudyGoal={dailyStudyGoal}
            onUpdateTargetMinutes={onUpdateTargetMinutes}
            onAddStudyMinutes={onAddStudyMinutes}
            variant="desktop-bar"
          />
        </div>

        {/* Action Buttons on the Left Side (Adjacent to navigation) */}
        <div className="flex items-center gap-2 shrink-0 pl-2 border-l border-slate-800">
          {/* Quick AI Study Session Launch Button */}
          <button
            onClick={() => setActiveTab('session')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-slate-950 text-xs font-bold transition-all cursor-pointer shadow-md"
          >
            <Clock className="w-3.5 h-3.5 fill-slate-950" />
            <span>AI Session</span>
          </button>

          {/* Streak indicator */}
          {/* Stick Figure Profile Avatar Button */}
          <button
            type="button"
            onClick={() => onOpenCustomizer?.()}
            title={`Customize your stick figure profile (${userProfile?.displayName || 'Scholar'})`}
            className="flex items-center gap-1.5 p-1 rounded-xl hover:bg-slate-900 border border-transparent hover:border-amber-500/30 transition-all cursor-pointer group"
          >
            <StickFigureAvatar
              config={userProfile?.stickFigure}
              seed="You"
              size={32}
              className="rounded-lg transition-transform group-hover:scale-110"
            />
            <span className="hidden lg:inline text-xs font-bold text-slate-300 group-hover:text-amber-300 max-w-[100px] truncate">
              {userProfile?.displayName || 'Scholar'}
            </span>
          </button>

          {/* Daily Streak Flame Counter */}
          <button
            onClick={() => {
              setActiveTab('streak');
              playStreakFlameSound();
            }}
            title="Current study streak - Click to view retention map"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-semibold hover:bg-amber-500/20 transition-colors cursor-pointer"
          >
            <Flame className="w-4 h-4 text-amber-400 animate-pulse fill-amber-500/30" />
            <span className="font-mono-numbers">{streak}d</span>
          </button>

          {/* Freeze Shields */}
          <div
            title={`${freezeTokens} streak freeze shields available`}
            className="hidden sm:flex items-center gap-1 text-slate-400 text-xs font-mono-numbers px-1"
          >
            <Shield className="w-3.5 h-3.5 text-cyan-400" />
            <span>{freezeTokens}</span>
          </div>

          {/* Sound Toggle */}
          <button
            onClick={toggleSound}
            aria-label={soundOn ? 'Mute sound effects' : 'Enable sound effects'}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-900 rounded-lg transition-colors cursor-pointer"
          >
            {soundOn ? <Volume2 className="w-4 h-4 text-amber-400" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Reset Progress Button */}
          {onResetProgress && (
            <button
              onClick={() => setShowResetModal(true)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/40 text-rose-300 hover:text-rose-200 text-xs font-semibold transition-colors cursor-pointer"
              title="Restart student's entire progress on the app"
            >
              <RotateCcw className="w-3 h-3 text-rose-400" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile nav row */}
      <div className="md:hidden flex flex-col border-t border-slate-900 bg-slate-950 px-2 py-2 gap-1.5 text-xs">
        <div className="flex items-center justify-center">
          <DailyStudyGoalTracker
            dailyStudyGoal={dailyStudyGoal}
            onUpdateTargetMinutes={onUpdateTargetMinutes}
            onAddStudyMinutes={onAddStudyMinutes}
            variant="mobile-header"
            className="w-full justify-between"
          />
        </div>
        <div className="flex items-center justify-around">
        <button
          onClick={() => setActiveTab('session')}
          className={`px-2 py-1 ${activeTab === 'session' ? 'text-amber-400 font-bold' : 'text-slate-400'}`}
        >
          Session
        </button>
        <button
          onClick={() => setActiveTab('plan')}
          className={`px-2 py-1 ${activeTab === 'plan' ? 'text-rose-400 font-semibold' : 'text-slate-400'}`}
        >
          War Plan
        </button>
        <button
          onClick={() => setActiveTab('lectures')}
          className={`px-2 py-1 ${activeTab === 'lectures' ? 'text-amber-400 font-semibold' : 'text-slate-400'}`}
        >
          Notes
        </button>
        <button
          onClick={() => setActiveTab('quiz')}
          className={`px-2 py-1 ${activeTab === 'quiz' ? 'text-amber-400 font-semibold' : 'text-slate-400'}`}
        >
          Quiz
        </button>
        <button
          onClick={() => setActiveTab('examiner')}
          className={`px-2 py-1 ${activeTab === 'examiner' ? 'text-rose-400 font-semibold' : 'text-slate-400'}`}
        >
          Examiner
        </button>
        <button
          onClick={() => setActiveTab('streak')}
          className={`px-2 py-1 ${activeTab === 'streak' ? 'text-amber-400 font-semibold' : 'text-slate-400'}`}
        >
          Streaks
        </button>
        {onResetProgress && (
          <button
            onClick={() => setShowResetModal(true)}
            className="px-2 py-1 text-slate-500 hover:text-rose-400"
            title="Restart Progress"
          >
            Reset
          </button>
        )}
        </div>
      </div>

      {/* Reset Entire Progress Confirmation Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl space-y-5 text-center relative overflow-hidden">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-bold font-display text-white">
                Restart All Progress?
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                This will reset your study streak, earned XP, daily question goals, and exam battle plan back to Day 1. You will start fresh as a new student.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                className="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => {
                  playIncorrectSound();
                  setShowResetModal(false);
                  onResetProgress?.();
                }}
                className="py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors cursor-pointer shadow-lg shadow-rose-950/40"
              >
                Yes, Reset All
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
