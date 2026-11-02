import React, { useState } from 'react';
import {
  Flame,
  Shield,
  CheckCircle2,
  Circle,
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Award,
  Zap,
  Target,
  Settings2,
  Sparkles,
  Layers,
  HelpCircle,
  Trophy,
  RotateCcw,
  BarChart3,
  Calendar as CalendarIcon,
  Palette,
  TrendingUp,
} from 'lucide-react';
import { UserStudyState, AchievementBadge } from '../types';
import { getLevelInfo, updateDailyStudyGoal } from '../utils/storage';
import { ASSET_IMAGES } from '../data/lectures';
import { playStreakFlameSound, playCorrectSound, playIncorrectSound } from '../utils/audio';
import { StickFigureAvatar } from './StickFigureAvatar';
import { PerformanceAnalyticsHeatmap } from './PerformanceAnalyticsHeatmap';
import { DailyStudyGoals } from './DailyStudyGoals';
import { MonthlyStudyCalendarHeatmap } from './MonthlyStudyCalendarHeatmap';
import { WeeklyPerformanceSummaryModal } from './WeeklyPerformanceSummaryModal';
import { Achievements } from './Achievements';

interface StreakRetentionDashboardProps {
  studyState: UserStudyState;
  onNavigate: (tab: 'plan' | 'session' | 'lectures' | 'quiz' | 'examiner' | 'cards' | 'leaderboard' | 'achievements' | 'mistakes' | 'level-drill') => void;
  onSelectTopicForExaminer: (topic: string) => void;
  onSelectTopicForQuiz?: (topic: string) => void;
  onUpdateStudyState?: (newState: UserStudyState) => void;
  onTriggerToast?: (badge: AchievementBadge) => void;
  onResetProgress?: () => void;
  onOpenCustomizer?: () => void;
}

export const StreakRetentionDashboard: React.FC<StreakRetentionDashboardProps> = ({
  studyState,
  onNavigate,
  onSelectTopicForExaminer,
  onSelectTopicForQuiz,
  onUpdateStudyState,
  onTriggerToast,
  onResetProgress,
  onOpenCustomizer,
}) => {
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showWeeklySummary, setShowWeeklySummary] = useState(false);
  const levelData = getLevelInfo(studyState.totalXp);
  const examPlan = studyState.activeExamPlan;

  // Generate 30 days of activity blocks
  const daysArray = React.useMemo(() => {
    const list = [];
    const now = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const iso = d.toISOString().split('T')[0];
      const log = studyState.studyLog[iso];
      const intensity = log ? Math.min(3, Math.max(1, Math.ceil((log.quizzesCount + log.vivaCount) / 2))) : 0;
      list.push({
        date: iso,
        label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        intensity,
        log,
      });
    }
    return list;
  }, [studyState.studyLog]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-10">
      {/* Active Exam Plan Banner */}
      {examPlan ? (
        <div className="bg-gradient-to-r from-rose-950/40 via-slate-900 to-amber-950/30 border border-rose-500/30 rounded-2xl p-5 md:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-rose-400 uppercase tracking-wider">
              <span>Active Exam Target</span>
              <span aria-hidden="true">·</span>
              <span className="text-slate-300">{examPlan.profile.gradeLevel}</span>
              <span aria-hidden="true">·</span>
              <span className="text-slate-400">{examPlan.profile.country}</span>
            </div>
            <h2 className="text-xl md:text-2xl font-bold font-display text-white">
              ⚡ {examPlan.daysRemaining} Days Until {examPlan.profile.subject} Exam
            </h2>
            <p className="text-xs text-slate-300">
              Target: <strong className="text-amber-400">{examPlan.dailyStudyTargetMinutes} min/day</strong> active recall. Focus: {examPlan.profile.topics.slice(0, 3).join(', ')}.
            </p>
          </div>

          <div className="flex items-center gap-3 self-stretch sm:self-auto shrink-0">
            <button
              onClick={() => onNavigate('plan')}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs rounded-xl transition-colors cursor-pointer shadow-sm"
            >
              View War Plan & Roadmap →
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-slate-900/60 border border-dashed border-slate-800 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-slate-200">
              No Exam Target Configured Yet
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Set your subject, exam date, grade level, and past paper questions to generate a customized Angry Examiner War Plan.
            </p>
          </div>
          <button
            onClick={() => onNavigate('plan')}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition-colors shrink-0 cursor-pointer"
          >
            Configure Exam Target
          </button>
        </div>
      )}

      {/* Top Hero: Streak & Academic Rank Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/40 border border-slate-800 p-6 md:p-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-5">
            <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-2xl overflow-hidden bg-slate-950 border border-amber-500/30 flex-shrink-0 shadow-lg shadow-amber-500/10">
              <img
                src={ASSET_IMAGES.streakBadge}
                alt="Golden Flame Streak Badge"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <div className="flex items-center gap-2 text-xs text-amber-400 font-semibold tracking-wider uppercase mb-1">
                <span>Active Study Momentum</span>
                <span aria-hidden="true">·</span>
                <span>Level {levelData.level} Scholar</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold font-display text-white tracking-tight">
                {studyState.streak} Day Study Streak
              </h1>
              <p className="text-slate-400 text-sm mt-1 max-w-xl">
                Current record: <span className="font-mono-numbers text-slate-200 font-semibold">{studyState.longestStreak} days</span>. Maintain daily drills to prevent synaptic decay and build instant exam automaticity.
              </p>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-4 bg-slate-950/80 border border-slate-800 rounded-xl p-4 self-stretch md:self-auto">
            {/* Custom Stick Figure Scholar Profile Card */}
            <div
              onClick={() => onOpenCustomizer?.()}
              className="flex items-center gap-2.5 px-3 border-r border-slate-800 cursor-pointer group"
              title="Click to customize your stick figure"
            >
              <StickFigureAvatar
                config={studyState.userProfile?.stickFigure}
                seed="You"
                size={44}
                className="rounded-xl transition-transform group-hover:scale-105"
              />
              <div className="text-left hidden sm:block">
                <div className="text-xs font-bold text-white group-hover:text-amber-300 font-display truncate max-w-[110px]">
                  {studyState.userProfile?.displayName || 'Scholar'}
                </div>
                <div className="text-[10px] text-amber-400 font-semibold flex items-center gap-1">
                  <Palette className="w-3 h-3" />
                  <span>Edit Look</span>
                </div>
              </div>
            </div>

            <div className="text-center px-3 border-r border-slate-800">
              <div className="text-xs text-slate-400 mb-0.5">Freeze Shields</div>
              <div className="flex items-center justify-center gap-1 text-cyan-400 font-bold text-lg font-mono-numbers">
                <Shield className="w-4 h-4" />
                {studyState.freezeTokens}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">+1 every 5 days</div>
            </div>
            <div className="text-center px-3 border-r border-slate-800">
              <div className="text-xs text-slate-400 mb-0.5">Total Knowledge XP</div>
              <div className="text-amber-400 font-bold text-lg font-mono-numbers">
                {studyState.totalXp}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">{levelData.title}</div>
            </div>

            <a
              href="#scholar-achievements"
              className="text-center px-3 border-r border-slate-800 hover:bg-slate-900/60 transition-colors rounded-lg group"
              title="Jump to Achievements & Badges"
            >
              <div className="text-xs text-slate-400 mb-0.5 flex items-center justify-center gap-1 group-hover:text-amber-300">
                <Award className="w-3.5 h-3.5 text-amber-400" />
                <span>Badges</span>
              </div>
              <div className="text-amber-300 font-bold text-lg font-mono-numbers">
                {Object.keys(studyState.achievements || {}).length}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5 group-hover:text-amber-400">View Badges ↓</div>
            </a>

            <div className="flex flex-col sm:flex-row items-center gap-2 pl-2">
              <button
                type="button"
                onClick={() => setShowWeeklySummary(true)}
                className="flex items-center justify-center gap-1.5 text-cyan-300 hover:text-white font-bold text-xs bg-cyan-950/60 hover:bg-cyan-900/80 border border-cyan-500/40 px-3 py-1.5 rounded-lg transition-colors cursor-pointer shadow-sm whitespace-nowrap"
                title="View Weekly Performance Summary & Recharts Trends"
              >
                <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
                <span>Weekly Summary</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigate('leaderboard')}
                className="flex items-center justify-center gap-1.5 text-amber-300 hover:text-white font-bold text-xs bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 px-3 py-1.5 rounded-lg transition-colors cursor-pointer shadow-sm whitespace-nowrap"
                title="View Global EXP Leaderboard & Academic Ranks"
              >
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                <span>Leaderboard & Ranks</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById('monthly-study-calendar');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="flex items-center justify-center gap-1.5 text-slate-300 hover:text-white font-semibold text-xs bg-slate-900 hover:bg-slate-800 border border-slate-800 px-3 py-1.5 rounded-lg transition-colors cursor-pointer shadow-sm whitespace-nowrap"
                title="Jump to Monthly Calendar Heatmap"
              >
                <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
                <span>Monthly Calendar</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById('performance-analytics');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="flex items-center justify-center gap-1.5 text-rose-300 hover:text-white font-semibold text-xs bg-rose-950/50 hover:bg-rose-900/60 border border-rose-500/40 px-3 py-1.5 rounded-lg transition-colors cursor-pointer shadow-sm whitespace-nowrap"
                title="Jump to Knowledge Gap Heatmap"
              >
                <BarChart3 className="w-3.5 h-3.5 text-rose-400" />
                <span>Error Heatmap</span>
              </button>
            </div>
          </div>
        </div>

        {/* Level XP Progress Bar */}
        <div className="mt-6 pt-5 border-t border-slate-800/80">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Progress to Next Rank: <strong className="text-slate-200">{levelData.title}</strong></span>
            <span className="font-mono-numbers">{levelData.progressPercent}% ({studyState.totalXp} / {levelData.nextLevelXp} XP)</span>
          </div>
          <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
            <div
              className="bg-gradient-to-r from-amber-500 to-amber-300 h-full rounded-full transition-all duration-500"
              style={{ width: `${levelData.progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* NEW DAILY STUDY GOALS COMPONENT: RADIAL GAUGE PROGRESS TRACKER */}
      <DailyStudyGoals
        studyState={studyState}
        onUpdateStudyState={onUpdateStudyState}
        onNavigateToQuiz={() => {
          if (onSelectTopicForQuiz) {
            onSelectTopicForQuiz(studyState.activeExamPlan?.profile?.topics[0] || 'General Academic');
          } else {
            onNavigate('quiz');
          }
        }}
        onNavigateToSession={() => onNavigate('session')}
      />

      {/* Two Column Layout: Daily Checklist & 30-Day Activity Heatmap */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Today's Daily Objectives Checklist */}
        <div className="lg:col-span-5 bg-slate-900/60 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white font-display">
                Today's Retention Objectives
              </h2>
              <span className="text-xs text-slate-400 font-mono-numbers">
                {Object.values(studyState.todayCompleted).filter(Boolean).length} / 4 Done
              </span>
            </div>
            <p className="text-xs text-slate-400 mb-5">
              Complete these tasks every 24 hours to secure your streak, earn bonus XP, and shield yourself against forgetting curves.
            </p>

            <div className="space-y-3">
              {/* Task 1 */}
              <div
                onClick={() => onNavigate('quiz')}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                  studyState.todayCompleted.dailyQuiz
                    ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  {studyState.todayCompleted.dailyQuiz ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                  ) : (
                    <Circle className="w-5 h-5 text-slate-600 flex-shrink-0" />
                  )}
                  <div>
                    <div className="text-sm font-medium">Daily 5-Question Quiz</div>
                    <div className="text-xs text-slate-400">Mixed high-yield question set</div>
                  </div>
                </div>
                <span className="text-xs font-mono-numbers text-amber-400 font-medium">+50 XP</span>
              </div>

              {/* Task 2 */}
              <div
                onClick={() => onNavigate('examiner')}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                  studyState.todayCompleted.vivaDrill
                    ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  {studyState.todayCompleted.vivaDrill ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                  ) : (
                    <Circle className="w-5 h-5 text-slate-600 flex-shrink-0" />
                  )}
                  <div>
                    <div className="text-sm font-medium">Survive 1 Angry Examiner Drill</div>
                    <div className="text-xs text-slate-400">Speaking practice or Spot the Flaw review</div>
                  </div>
                </div>
                <span className="text-xs font-mono-numbers text-rose-400 font-medium">+75 XP</span>
              </div>

              {/* Task 3 */}
              <div
                onClick={() => onNavigate('cards')}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                  studyState.todayCompleted.flashcards
                    ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  {studyState.todayCompleted.flashcards ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                  ) : (
                    <Circle className="w-5 h-5 text-slate-600 flex-shrink-0" />
                  )}
                  <div>
                    <div className="text-sm font-medium">Clear Spaced Repetition Due Cards</div>
                    <div className="text-xs text-slate-400">Leitner box interval review</div>
                  </div>
                </div>
                <span className="text-xs font-mono-numbers text-amber-400 font-medium">+30 XP</span>
              </div>

              {/* Task 4 */}
              <div
                onClick={() => onNavigate('lectures')}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                  studyState.todayCompleted.lectureNotes
                    ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  {studyState.todayCompleted.lectureNotes ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                  ) : (
                    <Circle className="w-5 h-5 text-slate-600 flex-shrink-0" />
                  )}
                  <div>
                    <div className="text-sm font-medium">Study 1 Lecture Breakdown</div>
                    <div className="text-xs text-slate-400">Review traps and step mechanisms</div>
                  </div>
                </div>
                <span className="text-xs font-mono-numbers text-amber-400 font-medium">+25 XP</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>Daily Reset at Midnight</span>
            <button
              onClick={() => {
                onNavigate('quiz');
                playStreakFlameSound();
              }}
              className="text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1 cursor-pointer"
            >
              Start Today's Quiz <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right Column: 30-Day Activity Calendar & Recent Examiner Grades */}
        <div className="lg:col-span-7 bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold text-white font-display">
                30-Day Study Consistency Matrix
              </h2>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowWeeklySummary(true)}
                  className="text-xs text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1.5 cursor-pointer bg-cyan-950/50 hover:bg-cyan-900/60 border border-cyan-500/30 px-2.5 py-1 rounded-lg transition-colors"
                  title="Open Weekly Performance Summary with consistency charts"
                >
                  <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Weekly Report</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const el = document.getElementById('monthly-study-calendar');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="text-xs text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1 cursor-pointer"
                >
                  <span>Full Monthly Calendar</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Regular short drills prevent memory loss. Darker amber shows multiple completed quizzes and speaking practice tests.
            </p>

            {/* Heatmap Grid */}
            <div className="grid grid-cols-10 sm:grid-cols-15 gap-2 p-3 bg-slate-950 rounded-xl border border-slate-800">
              {daysArray.map((day, idx) => {
                const colorClass =
                  day.intensity === 3
                    ? 'bg-amber-400 border-amber-300'
                    : day.intensity === 2
                    ? 'bg-amber-500/80 border-amber-500'
                    : day.intensity === 1
                    ? 'bg-amber-600/40 border-amber-500/30'
                    : 'bg-slate-900 border-slate-800/60';

                return (
                  <div
                    key={idx}
                    title={`${day.label}: ${day.log ? `${day.log.quizzesCount} quizzes, ${day.log.vivaCount} speaking tests, ${day.log.xpEarned} XP` : 'No study logged'}`}
                    className={`aspect-square rounded-md border ${colorClass} transition-transform hover:scale-110 cursor-pointer`}
                  />
                );
              })}
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 px-1">
              <span>30 days ago</span>
              <div className="flex items-center gap-1.5">
                <span>Less</span>
                <span className="w-2.5 h-2.5 rounded-sm bg-slate-900 border border-slate-800 inline-block" />
                <span className="w-2.5 h-2.5 rounded-sm bg-amber-600/40 border border-amber-500/30 inline-block" />
                <span className="w-2.5 h-2.5 rounded-sm bg-amber-500/80 border border-amber-500 inline-block" />
                <span className="w-2.5 h-2.5 rounded-sm bg-amber-400 border border-amber-300 inline-block" />
                <span>More</span>
              </div>
              <span>Today</span>
            </div>
          </div>

          {/* Recent Examiner Performance */}
          <div className="pt-4 border-t border-slate-800">
            <h3 className="text-sm font-semibold text-slate-200 mb-3 flex items-center justify-between">
              <span>Recent Examiner Scorecard</span>
              <button
                onClick={() => onNavigate('examiner')}
                className="text-xs text-rose-400 hover:text-rose-300 font-medium flex items-center gap-1 cursor-pointer"
              >
                Face Examiner <ArrowRight className="w-3 h-3" />
              </button>
            </h3>

            {studyState.recentExaminerScores.length === 0 ? (
              <div className="text-xs text-slate-500 py-3 text-center border border-dashed border-slate-800 rounded-lg">
                No recent speaking tests recorded. Enter The Angry Examiner simulator to test your skills!
              </div>
            ) : (
              <div className="space-y-2">
                {studyState.recentExaminerScores.slice(0, 3).map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/70 border border-slate-800/80 text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`font-bold font-mono-numbers px-2 py-0.5 rounded text-[11px] ${
                          item.score >= 8
                            ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/30'
                            : item.score >= 5
                            ? 'bg-amber-950/60 text-amber-400 border border-amber-500/30'
                            : 'bg-rose-950/60 text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        {item.score}/10
                      </span>
                      <span className="text-slate-300 font-medium">{item.topic}</span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-400">
                      <span>{item.verdict}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono-numbers">{item.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SCHOLAR ACHIEVEMENTS & UNLOCKABLE BADGES SECTION */}
      <div id="scholar-achievements">
        <Achievements
          studyState={studyState}
          onUpdateStudyState={onUpdateStudyState}
          onTriggerToast={onTriggerToast}
          onNavigateToSection={(s) => onNavigate(s as any)}
        />
      </div>

      {/* MONTHLY STUDY CALENDAR HEATMAP: VISUALIZE CONSISTENT DAILY STUDY ACTIVITY & MILESTONE ACHIEVEMENTS */}
      <div id="monthly-study-calendar">
        <MonthlyStudyCalendarHeatmap
          studyState={studyState}
          onNavigateToQuiz={(topic) => {
            if (onSelectTopicForQuiz) {
              onSelectTopicForQuiz(topic || studyState.activeExamPlan?.profile?.topics[0] || 'General Academic');
            } else {
              onNavigate('quiz');
            }
          }}
          onNavigateToExaminer={(topic) => {
            onSelectTopicForExaminer(topic || studyState.activeExamPlan?.profile?.topics[0] || 'The Bohr Effect');
            onNavigate('examiner');
          }}
          onNavigateToPlan={() => onNavigate('plan')}
        />
      </div>

      {/* NEW PERFORMANCE ANALYTICS SECTION: D3 SUB-TOPIC KNOWLEDGE GAP HEATMAP */}
      <PerformanceAnalyticsHeatmap
        studyState={studyState}
        onNavigateToQuiz={(topic) => {
          if (onSelectTopicForQuiz) {
            onSelectTopicForQuiz(topic);
          } else {
            onNavigate('quiz');
          }
        }}
        onNavigateToExaminer={(topic) => {
          onSelectTopicForExaminer(topic);
          onNavigate('examiner');
        }}
      />

      {/* Topic Retention Decay Matrix */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 md:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-white font-display">
              Spaced Repetition & Topic Retention Decay
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Estimated synaptic recall decay modeled by days since active recall drill. Topics falling below 70% require an immediate refresher.
            </p>
          </div>
          <button
            onClick={() => onNavigate('quiz')}
            className="self-start sm:self-auto px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold rounded-lg text-xs transition-colors cursor-pointer whitespace-nowrap shadow-sm"
          >
            Review Weakest Topic
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(studyState.topicMastery).map(([topicName, stats]) => {
            const isCritical = stats.retentionPercent < 70;
            const isFresh = stats.retentionPercent >= 85;

            return (
              <div
                key={topicName}
                className="bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl p-4 flex flex-col justify-between transition-colors"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="text-sm font-semibold text-slate-200 line-clamp-1">
                      {topicName}
                    </h3>
                    {isCritical ? (
                      <span className="text-[10px] font-semibold text-rose-400 flex items-center gap-1 shrink-0">
                        <AlertTriangle className="w-3 h-3" /> ▲ DECAYING
                      </span>
                    ) : isFresh ? (
                      <span className="text-[10px] font-semibold text-emerald-400 flex items-center gap-1 shrink-0">
                        ● STABLE
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold text-amber-400 flex items-center gap-1 shrink-0">
                        ■ MODERATE
                      </span>
                    )}
                  </div>

                  <div className="flex items-baseline justify-between text-xs text-slate-400 mb-2">
                    <span>Estimated Retention</span>
                    <span className="font-mono-numbers font-bold text-slate-200">
                      {stats.retentionPercent}%
                    </span>
                  </div>

                  <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800 mb-3">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isCritical
                          ? 'bg-rose-500'
                          : isFresh
                          ? 'bg-emerald-500'
                          : 'bg-amber-500'
                      }`}
                      style={{ width: `${stats.retentionPercent}%` }}
                    />
                  </div>

                  <div className="text-[11px] text-slate-500 space-x-2">
                    <span>Last reviewed: <strong className="text-slate-400 font-mono-numbers">{stats.lastReviewedDaysAgo === 0 ? 'Today' : `${stats.lastReviewedDaysAgo}d ago`}</strong></span>
                    <span>·</span>
                    <span>{stats.quizzesAttempted} quizzes</span>
                    <span>·</span>
                    <span>{stats.vivaAttempted} speaking tests</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-900 flex items-center justify-between">
                  <button
                    onClick={() => onSelectTopicForExaminer(topicName)}
                    className="text-xs text-rose-400 hover:text-rose-300 font-medium cursor-pointer"
                  >
                    Test by Speaking
                  </button>
                  <button
                    onClick={() => onNavigate('quiz')}
                    className="text-xs text-slate-400 hover:text-amber-400 font-medium cursor-pointer flex items-center gap-1"
                  >
                    Take Quiz <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Danger Zone: Reset All Student Progress */}
      {onResetProgress && (
        <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-5 shadow-xl">
          <div className="space-y-1.5 text-center sm:text-left">
            <h4 className="text-sm font-bold text-slate-200 flex items-center justify-center sm:justify-start gap-2">
              <RotateCcw className="w-4 h-4 text-rose-400" />
              <span>Restart Student Progress</span>
            </h4>
            <p className="text-xs text-slate-400 max-w-lg leading-relaxed">
              Want to start your curriculum from scratch? This wipes your XP, streak badges, active exam plan, and question logs back to Day 1.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowResetConfirm(true)}
            className="px-5 py-2.5 rounded-xl bg-rose-600/15 hover:bg-rose-600/25 border border-rose-500/40 text-rose-300 text-xs font-bold transition-all cursor-pointer shrink-0 shadow-sm"
          >
            Restart From Scratch
          </button>
        </div>
      )}

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
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
                onClick={() => setShowResetConfirm(false)}
                className="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => {
                  playIncorrectSound();
                  setShowResetConfirm(false);
                  onNavigate('plan');
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

      {/* Weekly Performance Summary Modal */}
      <WeeklyPerformanceSummaryModal
        isOpen={showWeeklySummary}
        onClose={() => setShowWeeklySummary(false)}
        studyState={studyState}
        onNavigateToSession={() => onNavigate('session')}
        onNavigateToQuiz={() => onNavigate('quiz')}
      />
    </div>
  );
};
