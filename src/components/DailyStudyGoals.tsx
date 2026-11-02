import React, { useState, useId } from 'react';
import {
  Target,
  Clock,
  HelpCircle,
  Settings2,
  Sparkles,
  Flame,
  ArrowRight,
  Plus,
  RotateCcw,
  CheckCircle2,
  Trophy,
  BookOpen
} from 'lucide-react';
import { UserStudyState, DailyStudyGoal } from '../types';
import {
  updateDailyStudyGoal,
  recordStudyMinutes,
  recordQuickQuestionCount
} from '../utils/storage';
import { playStreakFlameSound, playCorrectSound } from '../utils/audio';

interface DailyStudyGoalsProps {
  studyState: UserStudyState;
  onUpdateStudyState?: (newState: UserStudyState) => void;
  onNavigateToQuiz?: () => void;
  onNavigateToSession?: () => void;
  className?: string;
}

export const DailyStudyGoals: React.FC<DailyStudyGoalsProps> = ({
  studyState,
  onUpdateStudyState,
  onNavigateToQuiz,
  onNavigateToSession,
  className = '',
}) => {
  const gradientId = useId();

  // Extract current goal or sensible defaults
  const goal: DailyStudyGoal = studyState.dailyStudyGoal || {
    targetQuestions: 10,
    targetFlashcards: 15,
    completedQuestions: 0,
    completedFlashcards: 0,
    targetHours: 1.0,
    completedMinutes: 0,
    goalMetricType: 'questions',
    lastGoalDate: new Date().toISOString().split('T')[0],
  };

  const activeMetric: 'questions' | 'hours' | 'both' = goal.goalMetricType || 'questions';

  // Local configuration modal/panel state
  const [isEditing, setIsEditing] = useState(false);
  const [selectedMetricTab, setSelectedMetricTab] = useState<'questions' | 'hours' | 'both'>(activeMetric);
  const [targetQuestionsInput, setTargetQuestionsInput] = useState(goal.targetQuestions || 10);
  const [targetHoursInput, setTargetHoursInput] = useState(goal.targetHours || 1.0);
  const [feedbackMsg, setFeedbackMsg] = useState('');

  // Values and progress computations
  const targetQuestions = Math.max(1, goal.targetQuestions || 10);
  const completedQuestions = goal.completedQuestions || 0;
  const questionsProgress = Math.min(100, Math.round((completedQuestions / targetQuestions) * 100));
  const isQuestionsComplete = completedQuestions >= targetQuestions;

  const targetHours = Math.max(0.25, goal.targetHours || 1.0);
  const targetMinutes = Math.round(targetHours * 60);
  const completedMinutes = goal.completedMinutes || 0;
  const completedHoursFormatted = (completedMinutes / 60).toFixed(1);
  const hoursProgress = Math.min(100, Math.round((completedMinutes / targetMinutes) * 100));
  const isHoursComplete = completedMinutes >= targetMinutes;

  // Composite percentage for Dual mode
  const compositeProgress = Math.round((questionsProgress + hoursProgress) / 2);
  const isDualComplete = isQuestionsComplete && isHoursComplete;

  // Active progress based on selected metric mode
  const currentProgress =
    activeMetric === 'questions'
      ? questionsProgress
      : activeMetric === 'hours'
      ? hoursProgress
      : compositeProgress;

  const isCurrentComplete =
    activeMetric === 'questions'
      ? isQuestionsComplete
      : activeMetric === 'hours'
      ? isHoursComplete
      : isDualComplete;

  // Handlers
  const handleSaveGoals = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const updated = updateDailyStudyGoal(
      studyState,
      targetQuestionsInput,
      goal.targetFlashcards || 15,
      targetHoursInput,
      selectedMetricTab
    );
    onUpdateStudyState?.(updated);
    setIsEditing(false);
    playStreakFlameSound();
    setFeedbackMsg('Daily target updated!');
    setTimeout(() => setFeedbackMsg(''), 2500);
  };

  const handleApplyPreset = (q: number, h: number) => {
    setTargetQuestionsInput(q);
    setTargetHoursInput(h);
  };

  const handleQuickAddQuestions = (amount: number) => {
    const updated = recordQuickQuestionCount(studyState, amount);
    onUpdateStudyState?.(updated);
    if (completedQuestions + amount >= targetQuestions && !isQuestionsComplete) {
      playCorrectSound();
    } else {
      playStreakFlameSound();
    }
  };

  const handleQuickAddMinutes = (minutes: number) => {
    const updated = recordStudyMinutes(studyState, minutes);
    onUpdateStudyState?.(updated);
    if (completedMinutes + minutes >= targetMinutes && !isHoursComplete) {
      playCorrectSound();
    } else {
      playStreakFlameSound();
    }
  };

  const handleSwitchMetricDirect = (metric: 'questions' | 'hours' | 'both') => {
    const updated = updateDailyStudyGoal(
      studyState,
      goal.targetQuestions,
      goal.targetFlashcards,
      goal.targetHours || 1.0,
      metric
    );
    onUpdateStudyState?.(updated);
    setSelectedMetricTab(metric);
  };

  // SVG Radial Geometry
  const size = 200;
  const strokeWidth = 12;
  const center = size / 2;
  const radius = center - strokeWidth;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (currentProgress / 100) * circumference;

  // For Dual Mode Inner Ring
  const innerRadius = radius - 18;
  const innerCircumference = 2 * Math.PI * innerRadius;
  const innerStrokeDashoffset = innerCircumference - (hoursProgress / 100) * innerCircumference;
  const outerStrokeDashoffset = circumference - (questionsProgress / 100) * circumference;

  return (
    <div className={`bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 space-y-6 shadow-xl relative overflow-hidden ${className}`}>
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider mb-1">
            <Target className="w-4 h-4 text-amber-400" />
            <span>Daily Study Goals · Active Recall Quota</span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold font-display text-white flex items-center gap-2">
            <span>Daily Target Tracking</span>
            {isCurrentComplete && (
              <span className="text-xs px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Met Today
              </span>
            )}
          </h2>
          {/* Clean unboxed metadata per Section 1A */}
          <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
            <span>Streak Day {studyState.streak}</span>
            <span aria-hidden="true">·</span>
            <span>Resets daily at midnight</span>
            <span aria-hidden="true">·</span>
            <span className="text-slate-300 font-semibold">{currentProgress}% Quota Achieved</span>
          </div>
        </div>

        {/* Metric Mode Switcher & Edit Button */}
        <div className="flex flex-wrap items-center gap-2 self-stretch sm:self-auto">
          {/* Segmented Metric Tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => handleSwitchMetricDirect('questions')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeMetric === 'questions'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Questions</span>
            </button>
            <button
              type="button"
              onClick={() => handleSwitchMetricDirect('hours')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeMetric === 'hours'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Hours</span>
            </button>
            <button
              type="button"
              onClick={() => handleSwitchMetricDirect('both')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeMetric === 'both'
                  ? 'bg-rose-500 text-white font-bold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Dual Tracker</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsEditing(!isEditing)}
            className="px-3.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Settings2 className="w-3.5 h-3.5 text-amber-400" />
            <span>{isEditing ? 'Close' : 'Set Targets'}</span>
          </button>
        </div>
      </div>

      {feedbackMsg && (
        <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* Target Configuration Drawer */}
      {isEditing && (
        <form onSubmit={handleSaveGoals} className="p-5 rounded-2xl bg-slate-950 border border-amber-500/30 space-y-5 animate-fadeIn">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white font-display flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Configure Your Daily Study Goals</span>
            </h3>
            <span className="text-[11px] text-slate-400">Choose your tracking focus and targets</span>
          </div>

          {/* Quick Presets */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Quick Goal Presets:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => handleApplyPreset(5, 0.5)}
                className="p-2.5 rounded-xl border border-slate-800 bg-slate-900/80 hover:border-amber-500/50 text-left text-xs transition-colors cursor-pointer"
              >
                <div className="font-bold text-white">Casual Sprint</div>
                <div className="text-[10px] text-slate-400">5 Qs · 0.5 Hours (30m)</div>
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset(10, 1.0)}
                className="p-2.5 rounded-xl border border-slate-800 bg-slate-900/80 hover:border-amber-500/50 text-left text-xs transition-colors cursor-pointer"
              >
                <div className="font-bold text-white">Standard Mastery</div>
                <div className="text-[10px] text-slate-400">10 Qs · 1.0 Hour (60m)</div>
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset(20, 2.0)}
                className="p-2.5 rounded-xl border border-slate-800 bg-slate-900/80 hover:border-amber-500/50 text-left text-xs transition-colors cursor-pointer"
              >
                <div className="font-bold text-white">Honors Push</div>
                <div className="text-[10px] text-slate-400">20 Qs · 2.0 Hours (120m)</div>
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset(35, 3.5)}
                className="p-2.5 rounded-xl border border-slate-800 bg-slate-900/80 hover:border-amber-500/50 text-left text-xs transition-colors cursor-pointer"
              >
                <div className="font-bold text-white">Exam War Room</div>
                <div className="text-[10px] text-slate-400">35 Qs · 3.5 Hours (210m)</div>
              </button>
            </div>
          </div>

          {/* Sliders Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-1">
            {/* Questions Target Slider */}
            <div className="space-y-2 p-3.5 bg-slate-900/60 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between text-xs">
                <label className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
                  <span>Target Question Count per Day:</span>
                </label>
                <span className="font-mono-numbers text-amber-400 font-bold text-sm">
                  {targetQuestionsInput} Questions
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={60}
                step={1}
                value={targetQuestionsInput}
                onChange={e => setTargetQuestionsInput(parseInt(e.target.value) || 1)}
                className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono-numbers">
                <span>1 Q/day</span>
                <span>30 Qs/day</span>
                <span>60 Qs/day</span>
              </div>
            </div>

            {/* Hours Target Slider */}
            <div className="space-y-2 p-3.5 bg-slate-900/60 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between text-xs">
                <label className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Target Study Hours per Day:</span>
                </label>
                <span className="font-mono-numbers text-cyan-400 font-bold text-sm">
                  {targetHoursInput} Hours ({Math.round(targetHoursInput * 60)} min)
                </span>
              </div>
              <input
                type="range"
                min={0.25}
                max={6.0}
                step={0.25}
                value={targetHoursInput}
                onChange={e => setTargetHoursInput(parseFloat(e.target.value) || 0.5)}
                className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono-numbers">
                <span>15 mins</span>
                <span>3.0 hours</span>
                <span>6.0 hours</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-slate-200 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-slate-950 font-bold text-xs rounded-xl shadow-lg transition-transform hover:scale-[1.02] cursor-pointer"
            >
              Save Daily Study Goals
            </button>
          </div>
        </form>
      )}

      {/* Main Interactive Progress Body */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Side: Radial Gauge (4 cols) */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center p-4 bg-slate-950/70 border border-slate-800/80 rounded-2xl relative">
          <div className="relative flex items-center justify-center">
            {/* SVG Radial Gauge */}
            <svg
              width={size}
              height={size}
              className="transform -rotate-90 select-none overflow-visible"
            >
              <defs>
                {/* Questions Gradient */}
                <linearGradient id={`${gradientId}-q-grad`} x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#f43f5e" />
                </linearGradient>

                {/* Hours Gradient */}
                <linearGradient id={`${gradientId}-h-grad`} x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#06b6d4" />
                  <stop offset="100%" stopColor="#10b981" />
                </linearGradient>

                {/* Glow Filter for Completed */}
                <filter id={`${gradientId}-glow`} x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3.5" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* DUAL MODE: Outer Ring (Questions) + Inner Ring (Hours) */}
              {activeMetric === 'both' ? (
                <>
                  {/* Outer Background Track (Questions) */}
                  <circle
                    cx={center}
                    cy={center}
                    r={radius}
                    fill="none"
                    stroke="#1e293b"
                    strokeWidth={strokeWidth}
                  />

                  {/* Outer Progress Track (Questions) */}
                  <circle
                    cx={center}
                    cy={center}
                    r={radius}
                    fill="none"
                    stroke={`url(#${gradientId}-q-grad)`}
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={outerStrokeDashoffset}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dashoffset 0.8s ease' }}
                    filter={isQuestionsComplete ? `url(#${gradientId}-glow)` : 'none'}
                  />

                  {/* Inner Background Track (Hours) */}
                  <circle
                    cx={center}
                    cy={center}
                    r={innerRadius}
                    fill="none"
                    stroke="#1e293b"
                    strokeWidth={strokeWidth - 2}
                  />

                  {/* Inner Progress Track (Hours) */}
                  <circle
                    cx={center}
                    cy={center}
                    r={innerRadius}
                    fill="none"
                    stroke={`url(#${gradientId}-h-grad)`}
                    strokeWidth={strokeWidth - 2}
                    strokeDasharray={innerCircumference}
                    strokeDashoffset={innerStrokeDashoffset}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dashoffset 0.8s ease' }}
                    filter={isHoursComplete ? `url(#${gradientId}-glow)` : 'none'}
                  />
                </>
              ) : (
                /* SINGLE MODE: Full Radial Gauge */
                <>
                  {/* Background Track */}
                  <circle
                    cx={center}
                    cy={center}
                    r={radius}
                    fill="none"
                    stroke="#1e293b"
                    strokeWidth={strokeWidth}
                  />

                  {/* Progress Arc */}
                  <circle
                    cx={center}
                    cy={center}
                    r={radius}
                    fill="none"
                    stroke={activeMetric === 'hours' ? `url(#${gradientId}-h-grad)` : `url(#${gradientId}-q-grad)`}
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dashoffset 0.8s ease' }}
                    filter={isCurrentComplete ? `url(#${gradientId}-glow)` : 'none'}
                  />
                </>
              )}
            </svg>

            {/* Radial Center Metric Content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
              {activeMetric === 'questions' && (
                <>
                  <div className="text-3xl font-black font-mono-numbers tracking-tight text-white">
                    {completedQuestions}
                    <span className="text-sm font-normal text-slate-500 font-sans"> / {targetQuestions}</span>
                  </div>
                  <div className="text-xs font-bold text-amber-400 font-mono-numbers mt-0.5">
                    {questionsProgress}%
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {isQuestionsComplete ? 'Questions Met 🎯' : `${targetQuestions - completedQuestions} questions to go`}
                  </div>
                </>
              )}

              {activeMetric === 'hours' && (
                <>
                  <div className="text-3xl font-black font-mono-numbers tracking-tight text-white">
                    {completedHoursFormatted}h
                    <span className="text-sm font-normal text-slate-500 font-sans"> / {targetHours}h</span>
                  </div>
                  <div className="text-xs font-bold text-cyan-400 font-mono-numbers mt-0.5">
                    {hoursProgress}%
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {isHoursComplete ? 'Hours Met 🎯' : `${Math.max(0, targetMinutes - completedMinutes)}m to go`}
                  </div>
                </>
              )}

              {activeMetric === 'both' && (
                <>
                  <div className="text-3xl font-black font-mono-numbers tracking-tight text-white">
                    {compositeProgress}%
                  </div>
                  <div className="text-[11px] font-semibold text-slate-300 mt-0.5">
                    Composite Goal
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    {isDualComplete ? 'All Targets Met! 🎯' : 'Dual Progress Active'}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Radial Legend / Quick Indicator */}
          {activeMetric === 'both' ? (
            <div className="flex items-center gap-4 mt-4 pt-3 border-t border-slate-900 text-[11px]">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span className="text-slate-300 font-medium">Questions ({questionsProgress}%)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                <span className="text-slate-300 font-medium">Hours ({hoursProgress}%)</span>
              </div>
            </div>
          ) : (
            <div className="mt-4 pt-3 border-t border-slate-900 text-center">
              <span className="text-[11px] text-slate-400 font-mono">
                {activeMetric === 'questions' ? 'Radial Target: Question Count' : 'Radial Target: Study Hours'}
              </span>
            </div>
          )}
        </div>

        {/* Right Side: Detailed Cards & Quick Action Loggers (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Status Metric Breakdown Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* 1. Questions Track Card */}
            <div className={`p-4 rounded-xl border transition-all ${
              activeMetric === 'questions' || activeMetric === 'both'
                ? 'bg-slate-950/90 border-amber-500/30'
                : 'bg-slate-950/40 border-slate-800 opacity-70'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                    <HelpCircle className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">Question Target</span>
                    <span className="text-[10px] text-slate-400">Multiple-choice active recall</span>
                  </div>
                </div>

                <span className={`text-[11px] font-mono-numbers font-bold px-2 py-0.5 rounded border ${
                  isQuestionsComplete
                    ? 'bg-emerald-950/60 border-emerald-500/30 text-emerald-300'
                    : 'bg-amber-950/40 border-amber-500/30 text-amber-300'
                }`}>
                  {isQuestionsComplete ? 'Target Met 🎯' : `${targetQuestions - completedQuestions} left`}
                </span>
              </div>

              <div className="flex items-baseline justify-between text-xs pt-1 mb-1.5">
                <span className="text-slate-300 font-medium">
                  {completedQuestions} <span className="text-slate-500">/ {targetQuestions} questions</span>
                </span>
                <span className="font-mono-numbers font-bold text-amber-400">{questionsProgress}%</span>
              </div>

              {/* Linear Progress Indicator */}
              <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isQuestionsComplete ? 'bg-emerald-400' : 'bg-gradient-to-r from-amber-500 to-rose-500'
                  }`}
                  style={{ width: `${questionsProgress}%` }}
                />
              </div>

              {/* Quick Increment Buttons */}
              <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-slate-900 text-xs">
                <span className="text-[11px] text-slate-500">Quick Log:</span>
                <button
                  type="button"
                  onClick={() => handleQuickAddQuestions(1)}
                  className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 rounded-md font-medium text-[11px] transition-colors cursor-pointer"
                >
                  +1 Q
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickAddQuestions(5)}
                  className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 rounded-md font-medium text-[11px] transition-colors cursor-pointer"
                >
                  +5 Qs
                </button>
                {onNavigateToQuiz && (
                  <button
                    type="button"
                    onClick={onNavigateToQuiz}
                    className="ml-auto text-[11px] text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <span>Drill</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* 2. Study Hours Track Card */}
            <div className={`p-4 rounded-xl border transition-all ${
              activeMetric === 'hours' || activeMetric === 'both'
                ? 'bg-slate-950/90 border-cyan-500/30'
                : 'bg-slate-950/40 border-slate-800 opacity-70'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                    <Clock className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">Hours Target</span>
                    <span className="text-[10px] text-slate-400">Deep study sessions & timers</span>
                  </div>
                </div>

                <span className={`text-[11px] font-mono-numbers font-bold px-2 py-0.5 rounded border ${
                  isHoursComplete
                    ? 'bg-emerald-950/60 border-emerald-500/30 text-emerald-300'
                    : 'bg-cyan-950/40 border-cyan-500/30 text-cyan-300'
                }`}>
                  {isHoursComplete ? 'Target Met 🎯' : `${Math.max(0, targetMinutes - completedMinutes)}m left`}
                </span>
              </div>

              <div className="flex items-baseline justify-between text-xs pt-1 mb-1.5">
                <span className="text-slate-300 font-medium">
                  {completedHoursFormatted}h ({completedMinutes}m) <span className="text-slate-500">/ {targetHours}h</span>
                </span>
                <span className="font-mono-numbers font-bold text-cyan-400">{hoursProgress}%</span>
              </div>

              {/* Linear Progress Indicator */}
              <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isHoursComplete ? 'bg-emerald-400' : 'bg-gradient-to-r from-cyan-500 to-indigo-500'
                  }`}
                  style={{ width: `${hoursProgress}%` }}
                />
              </div>

              {/* Quick Increment Buttons */}
              <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-slate-900 text-xs">
                <span className="text-[11px] text-slate-500">Quick Log:</span>
                <button
                  type="button"
                  onClick={() => handleQuickAddMinutes(15)}
                  className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 rounded-md font-medium text-[11px] transition-colors cursor-pointer"
                >
                  +15m
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickAddMinutes(30)}
                  className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 rounded-md font-medium text-[11px] transition-colors cursor-pointer"
                >
                  +30m
                </button>
                {onNavigateToSession && (
                  <button
                    type="button"
                    onClick={onNavigateToSession}
                    className="ml-auto text-[11px] text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <span>Session</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Motivation & Streak Bonus Callout */}
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shrink-0">
                <Flame className="w-3.5 h-3.5" />
              </div>
              <p className="text-slate-300 leading-snug">
                {isCurrentComplete ? (
                  <strong className="text-emerald-400">
                    Daily Quota Hit! Streak is safe and +50 XP bonus unlocked.
                  </strong>
                ) : (
                  <span>
                    Completing your daily quota locks in your study streak and defends your exam knowledge against synaptic decay.
                  </span>
                )}
              </p>
            </div>

            <div className="shrink-0 flex items-center gap-2">
              {onNavigateToQuiz && (
                <button
                  type="button"
                  onClick={onNavigateToQuiz}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg transition-colors flex items-center gap-1 cursor-pointer shadow-sm"
                >
                  <span>Practice Questions</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
