import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Clock,
  Play,
  Pause,
  RotateCcw,
  Coffee,
  CheckCircle2,
  Sparkles,
  Flame,
  Shield,
  Zap,
  Award,
  AlertTriangle,
  ArrowRight,
  Maximize2,
  Minimize2,
  Headphones,
  Settings,
  ChevronRight,
  Target,
  Trophy
} from 'lucide-react';
import { UserStudyState } from '../types';
import {
  playCorrectSound,
  playStreakFlameSound,
  playTimerTickSound,
  playVivaGavelSound,
  startSoundscape,
  stopSoundscape,
  getActiveSoundscape
} from '../utils/audio';
import { recordDeepWorkPomodoroCompletion } from '../utils/storage';

export type PomodoroPresetId = 'classic' | 'deepwork' | 'ultradian' | 'custom';
export type PomodoroPhaseType = 'focus' | 'short-break' | 'long-break';

interface PresetConfig {
  id: PomodoroPresetId;
  name: string;
  focusMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
  description: string;
  recommendedTag?: string;
}

const PRESETS: Record<PomodoroPresetId, PresetConfig> = {
  deepwork: {
    id: 'deepwork',
    name: '50/10 Deep Work',
    focusMinutes: 50,
    shortBreakMinutes: 10,
    longBreakMinutes: 20,
    description: 'Gold standard for STEM, math proofs, and complex mechanistic theory.',
    recommendedTag: 'Recommended for Hard Subjects',
  },
  classic: {
    id: 'classic',
    name: '25/5 Classic Pomodoro',
    focusMinutes: 25,
    shortBreakMinutes: 5,
    longBreakMinutes: 15,
    description: 'Fast active recall bursts, vocabulary drilling, and rapid flashcards.',
  },
  ultradian: {
    id: 'ultradian',
    name: '90/20 Ultradian Rhythm',
    focusMinutes: 90,
    shortBreakMinutes: 20,
    longBreakMinutes: 30,
    description: 'Matches human biological 90-minute circadian peaks for full practice exams.',
  },
  custom: {
    id: 'custom',
    name: 'Custom Sprint',
    focusMinutes: 30,
    shortBreakMinutes: 5,
    longBreakMinutes: 15,
    description: 'Tailor custom focus and rest intervals to your schedule.',
  },
};

interface DeepWorkPomodoroTimerProps {
  topic?: string;
  subject?: string;
  studyState?: UserStudyState;
  onUpdateStudyState?: (newState: UserStudyState) => void;
  onCycleComplete?: (minutesStudied: number, xpEarned: number) => void;
  compact?: boolean;
  onOpenFullTimer?: () => void;
}

export const DeepWorkPomodoroTimer: React.FC<DeepWorkPomodoroTimerProps> = ({
  topic = 'General Academic Focus',
  subject = 'Active Recall',
  studyState,
  onUpdateStudyState,
  onCycleComplete,
  compact = false,
  onOpenFullTimer,
}) => {
  // Preset & Configuration
  const [activePreset, setActivePreset] = useState<PomodoroPresetId>('deepwork');
  const [currentPhase, setCurrentPhase] = useState<PomodoroPhaseType>('focus');
  const [cycleIndex, setCycleIndex] = useState<number>(1); // 1 to 4
  const [totalCompletedCycles, setTotalCompletedCycles] = useState<number>(0);

  // Custom durations if preset is custom
  const [customFocusMins, setCustomFocusMins] = useState<number>(30);
  const [customBreakMins, setCustomBreakMins] = useState<number>(5);

  // Timer Countdown state
  const config = PRESETS[activePreset];
  const targetMinutes = useMemo(() => {
    if (activePreset === 'custom') {
      return currentPhase === 'focus'
        ? customFocusMins
        : currentPhase === 'short-break'
        ? customBreakMins
        : customBreakMins * 2;
    }
    return currentPhase === 'focus'
      ? config.focusMinutes
      : currentPhase === 'short-break'
      ? config.shortBreakMinutes
      : config.longBreakMinutes;
  }, [activePreset, currentPhase, customFocusMins, customBreakMins, config]);

  const [secondsRemaining, setSecondsRemaining] = useState<number>(targetMinutes * 60);
  const [totalSecondsForPhase, setTotalSecondsForPhase] = useState<number>(targetMinutes * 60);
  const [isRunning, setIsRunning] = useState<boolean>(false);

  // Uninterrupted Study Monitoring
  const [interruptionCount, setInterruptionCount] = useState<number>(0);
  const [showInterruptionAlert, setShowInterruptionAlert] = useState<boolean>(false);
  const [recentRewardNotification, setRecentRewardNotification] = useState<{
    xp: number;
    minutes: number;
    isUninterrupted: boolean;
    earnedFreezeShield: boolean;
  } | null>(null);

  // Audio coupling
  const [autoPlaySoundscape, setAutoPlaySoundscape] = useState<boolean>(false);

  // Sync timer when preset or phase changes while paused
  useEffect(() => {
    if (!isRunning) {
      const secs = targetMinutes * 60;
      setSecondsRemaining(secs);
      setTotalSecondsForPhase(secs);
    }
  }, [targetMinutes]);

  // Main Countdown Interval
  useEffect(() => {
    let interval: any = null;
    if (isRunning && secondsRemaining > 0) {
      interval = setInterval(() => {
        setSecondsRemaining(prev => prev - 1);
      }, 1000);
    } else if (isRunning && secondsRemaining <= 0) {
      handlePhaseComplete();
    }
    return () => clearInterval(interval);
  }, [isRunning, secondsRemaining]);

  // Tab switch & visibility change listener to track focus interruptions
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isRunning && currentPhase === 'focus') {
        setInterruptionCount(prev => prev + 1);
        setShowInterruptionAlert(true);
      }
    };

    const handleWindowBlur = () => {
      if (isRunning && currentPhase === 'focus') {
        setInterruptionCount(prev => prev + 1);
        setShowInterruptionAlert(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [isRunning, currentPhase]);

  // Handle phase completion
  const handlePhaseComplete = () => {
    setIsRunning(false);

    if (currentPhase === 'focus') {
      const minutesFinished = Math.round(totalSecondsForPhase / 60);
      const isUninterrupted = interruptionCount === 0;
      const nextTotalCycles = totalCompletedCycles + 1;
      setTotalCompletedCycles(nextTotalCycles);

      // Trigger celebratory audio
      playStreakFlameSound();

      // Record in storage and streak system
      let xpAwarded = Math.round(minutesFinished * 2 * (isUninterrupted ? 1.25 : 1.0));
      let earnedFreeze = false;

      if (studyState) {
        const result = recordDeepWorkPomodoroCompletion(
          studyState,
          minutesFinished,
          isUninterrupted,
          nextTotalCycles,
          topic
        );
        xpAwarded = result.xpAwarded;
        earnedFreeze = result.earnedFreezeShield;
        if (onUpdateStudyState) {
          onUpdateStudyState(result.updatedState);
        }
      }

      onCycleComplete?.(minutesFinished, xpAwarded);

      setRecentRewardNotification({
        xp: xpAwarded,
        minutes: minutesFinished,
        isUninterrupted,
        earnedFreezeShield: earnedFreeze,
      });

      // Stop focus soundscape during break
      if (autoPlaySoundscape) {
        stopSoundscape();
      }

      // Transition to break
      if (cycleIndex >= 4) {
        setCurrentPhase('long-break');
        setCycleIndex(1);
        const nextSecs = (activePreset === 'custom' ? customBreakMins * 2 : config.longBreakMinutes) * 60;
        setSecondsRemaining(nextSecs);
        setTotalSecondsForPhase(nextSecs);
      } else {
        setCurrentPhase('short-break');
        setCycleIndex(prev => prev + 1);
        const nextSecs = (activePreset === 'custom' ? customBreakMins : config.shortBreakMinutes) * 60;
        setSecondsRemaining(nextSecs);
        setTotalSecondsForPhase(nextSecs);
      }
    } else {
      // Break finished, return to focus
      playCorrectSound();
      setCurrentPhase('focus');
      setInterruptionCount(0);
      setShowInterruptionAlert(false);
      const nextSecs = (activePreset === 'custom' ? customFocusMins : config.focusMinutes) * 60;
      setSecondsRemaining(nextSecs);
      setTotalSecondsForPhase(nextSecs);
    }
  };

  const handleToggleTimer = () => {
    const nextState = !isRunning;
    setIsRunning(nextState);

    if (nextState) {
      playTimerTickSound();
      if (currentPhase === 'focus' && autoPlaySoundscape && getActiveSoundscape() === 'off') {
        startSoundscape('steady-state', 0.35);
      }
    } else {
      if (autoPlaySoundscape && currentPhase === 'focus') {
        stopSoundscape();
      }
    }
  };

  const handleResetPhase = () => {
    setIsRunning(false);
    setSecondsRemaining(totalSecondsForPhase);
    setInterruptionCount(0);
    setShowInterruptionAlert(false);
  };

  const handleSkipToNextPhase = () => {
    setIsRunning(false);
    if (currentPhase === 'focus') {
      setCurrentPhase('short-break');
      const nextSecs = (activePreset === 'custom' ? customBreakMins : config.shortBreakMinutes) * 60;
      setSecondsRemaining(nextSecs);
      setTotalSecondsForPhase(nextSecs);
    } else {
      setCurrentPhase('focus');
      setInterruptionCount(0);
      setShowInterruptionAlert(false);
      const nextSecs = (activePreset === 'custom' ? customFocusMins : config.focusMinutes) * 60;
      setSecondsRemaining(nextSecs);
      setTotalSecondsForPhase(nextSecs);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // SVG Circular Gauge calculations
  const elapsedSeconds = Math.max(0, totalSecondsForPhase - secondsRemaining);
  const progressRatio = totalSecondsForPhase > 0 ? Math.min(1, Math.max(0, elapsedSeconds / totalSecondsForPhase)) : 0;
  const radius = 96;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progressRatio);

  // Position of glowing head marker
  const headAngle = progressRatio * 2 * Math.PI - Math.PI / 2;
  const headX = 120 + radius * Math.cos(headAngle);
  const headY = 120 + radius * Math.sin(headAngle);

  // 12-Position interval ticks around circle perimeter (quarter milestones highlighted)
  const intervalTicks = useMemo(() => {
    return [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(i => {
      const isMajor = i % 3 === 0;
      const angle = (i / 12) * 2 * Math.PI - Math.PI / 2;
      const rInner = isMajor ? 82 : 85;
      const rOuter = 89;
      return {
        key: i,
        x1: 120 + rInner * Math.cos(angle),
        y1: 120 + rInner * Math.sin(angle),
        x2: 120 + rOuter * Math.cos(angle),
        y2: 120 + rOuter * Math.sin(angle),
        isMajor,
        label: isMajor ? `${Math.round((i / 12) * 100)}%` : null,
      };
    });
  }, []);

  // ------------------------------------------------------------------------
  // COMPACT HEADER MODE (For session top bar or floating header)
  // ------------------------------------------------------------------------
  if (compact) {
    return (
      <div className="flex items-center gap-2 bg-slate-950/90 border border-slate-800 rounded-xl px-3 py-1.5 text-xs shadow-md">
        {/* Compact Circular SVG Progress Indicator */}
        <div
          className="relative w-7 h-7 flex items-center justify-center shrink-0"
          title={`${Math.round(progressRatio * 100)}% elapsed · ${formatTime(elapsedSeconds)} of ${formatTime(totalSecondsForPhase)}`}
        >
          <svg className="w-7 h-7 transform -rotate-90" viewBox="0 0 32 32">
            <circle
              cx="16"
              cy="16"
              r="13"
              className="stroke-slate-800"
              strokeWidth="2.5"
              fill="transparent"
            />
            <circle
              cx="16"
              cy="16"
              r="13"
              stroke={currentPhase === 'focus' ? '#f59e0b' : '#06b6d4'}
              strokeWidth="2.5"
              strokeDasharray={2 * Math.PI * 13}
              strokeDashoffset={2 * Math.PI * 13 * (1 - progressRatio)}
              strokeLinecap="round"
              fill="transparent"
              className="transition-all duration-500 ease-linear"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {currentPhase === 'focus' ? (
              <Flame className={`w-3.5 h-3.5 ${isRunning ? 'text-amber-400 fill-amber-400/30' : 'text-amber-500/70'}`} />
            ) : (
              <Coffee className="w-3.5 h-3.5 text-cyan-400" />
            )}
          </div>
        </div>

        <div
          className={`flex items-center gap-1 font-bold font-mono-numbers ${
            currentPhase === 'focus' ? 'text-amber-400' : 'text-cyan-400'
          }`}
        >
          <span>{formatTime(secondsRemaining)}</span>
          <span className="text-[10px] text-slate-500 font-mono-numbers font-normal">
            ({Math.round(progressRatio * 100)}%)
          </span>
        </div>

        {/* Phase Pill */}
        <span
          className={`text-[10px] px-1.5 py-0.5 rounded font-semibold hidden sm:inline ${
            currentPhase === 'focus'
              ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
              : 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
          }`}
        >
          {currentPhase === 'focus' ? `Deep Work (${cycleIndex}/4)` : 'Break'}
        </span>

        {/* Interruption Pill if any */}
        {interruptionCount > 0 && currentPhase === 'focus' && (
          <span className="text-[10px] px-1 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold" title="Tab switch detected">
            ⚠️ {interruptionCount}
          </span>
        )}

        <div className="flex items-center gap-1 border-l border-slate-800 pl-2">
          <button
            type="button"
            onClick={handleToggleTimer}
            className={`p-1 rounded cursor-pointer transition-colors ${
              isRunning
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-300'
            }`}
            title={isRunning ? 'Pause Pomodoro' : 'Start Pomodoro'}
          >
            {isRunning ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
          </button>

          {onOpenFullTimer && (
            <button
              type="button"
              onClick={onOpenFullTimer}
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-900 cursor-pointer"
              title="Expand full Pomodoro Deep Work dashboard"
            >
              <Maximize2 className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    );
  }

  // ------------------------------------------------------------------------
  // FULL DASHBOARD DEEP WORK POMODORO TIMER
  // ------------------------------------------------------------------------
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 space-y-7 shadow-2xl relative overflow-hidden">
      {/* Background radial gradient glow */}
      <div
        className={`absolute -top-24 -right-24 w-80 h-80 rounded-full blur-3xl pointer-events-none transition-colors duration-700 ${
          currentPhase === 'focus' ? 'bg-amber-500/10' : 'bg-cyan-500/10'
        }`}
      />

      {/* Header & Mode Switcher */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider mb-1">
            <Flame className="w-4 h-4 text-amber-400 fill-amber-500/30" />
            <span>Uninterrupted Deep Work Engine</span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold font-display text-white">
            Pomodoro Deep Work & Streak Timer
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xl leading-relaxed">
            Eliminates task-switching fatigue by enforcing strict focus blocks and scheduled neurological recovery breaks. Zero distractions secure streak protection and bonus XP multipliers.
          </p>
        </div>

        {/* Preset Selector Dropdown */}
        <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 p-1.5 rounded-xl self-stretch sm:self-auto">
          {(['deepwork', 'classic', 'ultradian'] as PomodoroPresetId[]).map(pid => (
            <button
              key={pid}
              type="button"
              onClick={() => {
                if (!isRunning) {
                  setActivePreset(pid);
                }
              }}
              disabled={isRunning}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activePreset === pid
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                  : 'text-slate-400 hover:text-slate-200 disabled:opacity-50'
              }`}
            >
              {PRESETS[pid].name.split(' ')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Main Countdown Gauge and Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Left / Center: SVG Radial Circular Gauge */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center p-4">
          <div className="relative w-64 h-64 md:w-72 md:h-72 flex items-center justify-center">
            {/* SVG Progress Circle */}
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 240 240">
              <defs>
                <linearGradient id="deepWorkFocusGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#fef08a" />
                  <stop offset="30%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#d97706" />
                </linearGradient>
                <linearGradient id="deepWorkBreakGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#a5f3fc" />
                  <stop offset="40%" stopColor="#06b6d4" />
                  <stop offset="100%" stopColor="#0284c7" />
                </linearGradient>
                <filter id="timerGlowFilter" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Background Track Circle */}
              <circle
                cx="120"
                cy="120"
                r={radius}
                className="stroke-slate-950"
                strokeWidth="12"
                fill="transparent"
              />
              <circle
                cx="120"
                cy="120"
                r={radius}
                stroke="#1e293b"
                strokeWidth="12"
                fill="transparent"
                opacity="0.6"
              />

              {/* Subtle inner reference dashed ring */}
              <circle
                cx="120"
                cy="120"
                r={84}
                stroke="#334155"
                strokeWidth="1"
                strokeDasharray="3 6"
                fill="transparent"
                opacity="0.4"
              />

              {/* Milestone Notch Ticks */}
              {intervalTicks.map(t => (
                <line
                  key={t.key}
                  x1={t.x1}
                  y1={t.y1}
                  x2={t.x2}
                  y2={t.y2}
                  stroke={t.isMajor ? '#64748b' : '#334155'}
                  strokeWidth={t.isMajor ? '2' : '1'}
                  strokeLinecap="round"
                />
              ))}

              {/* Animated Progress Arc */}
              <circle
                cx="120"
                cy="120"
                r={radius}
                stroke={currentPhase === 'focus' ? 'url(#deepWorkFocusGrad)' : 'url(#deepWorkBreakGrad)'}
                strokeWidth="12"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-500 ease-linear"
                fill="transparent"
              />

              {/* Glowing Head Marker Dot */}
              {progressRatio > 0.005 && (
                <>
                  <circle
                    cx={headX}
                    cy={headY}
                    r="8"
                    fill={currentPhase === 'focus' ? '#f59e0b' : '#06b6d4'}
                    filter="url(#timerGlowFilter)"
                    opacity="0.8"
                    className="transition-all duration-500"
                  />
                  <circle
                    cx={headX}
                    cy={headY}
                    r="4.5"
                    fill="#ffffff"
                    className="transition-all duration-500"
                  />
                </>
              )}
            </svg>

            {/* Centered Countdown Readout */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
              <span
                className={`text-[10px] md:text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full mb-1 flex items-center gap-1.5 ${
                  currentPhase === 'focus'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${isRunning ? 'animate-ping' : ''} ${currentPhase === 'focus' ? 'bg-amber-400' : 'bg-cyan-400'}`} />
                {currentPhase === 'focus'
                  ? 'Deep Focus Sprint'
                  : currentPhase === 'short-break'
                  ? 'Short Brain Break'
                  : 'Long Recovery Break'}
              </span>

              <span className="text-4xl md:text-5xl font-bold font-mono-numbers text-white tracking-tight">
                {formatTime(secondsRemaining)}
              </span>

              {/* Elapsed time & interval metrics */}
              <div className="mt-1 flex flex-col items-center gap-0.5">
                <span className="text-xs text-amber-400/90 font-mono-numbers font-semibold">
                  {formatTime(elapsedSeconds)} elapsed ({Math.round(progressRatio * 100)}%)
                </span>
                <span className="text-[11px] text-slate-400 font-mono-numbers">
                  Cycle {cycleIndex} of 4 · {Math.round(totalSecondsForPhase / 60)}m interval
                </span>
              </div>
            </div>
          </div>

          {/* 4-Cycle Progress Dots */}
          <div className="flex items-center gap-2 mt-4">
            {[1, 2, 3, 4].map(cNum => {
              const isPast = cNum < cycleIndex;
              const isCurrent = cNum === cycleIndex;

              return (
                <div
                  key={cNum}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    isCurrent
                      ? 'w-7 bg-amber-400 shadow-sm shadow-amber-500/50'
                      : isPast
                      ? 'w-5 bg-amber-600/80'
                      : 'w-4 bg-slate-800'
                  }`}
                  title={`Interval Cycle ${cNum} of 4`}
                />
              );
            })}
          </div>
        </div>

        {/* Right: Timer Controls, Focus Objective, & Streak Integration */}
        <div className="lg:col-span-7 space-y-5">
          {/* Active Focus Objective Card */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5 font-bold text-amber-400 uppercase tracking-wider">
                <Target className="w-3.5 h-3.5" />
                Active Focus Objective:
              </span>
              <span className="text-slate-500 font-mono-numbers">{subject}</span>
            </div>
            <p className="text-sm font-bold text-white">
              {topic}
            </p>
          </div>

          {/* Uninterrupted Status & Tab-Switching Warning */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Status 1: Uninterrupted Focus Monitor */}
            <div
              className={`p-3 rounded-xl border flex items-center justify-between ${
                interruptionCount === 0
                  ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-950/20 border-rose-500/30 text-rose-300'
              }`}
            >
              <div className="flex items-center gap-2.5">
                {interruptionCount === 0 ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                )}
                <div>
                  <div className="text-xs font-bold">
                    {interruptionCount === 0 ? '100% Uninterrupted' : `${interruptionCount} Tab Switches`}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {interruptionCount === 0 ? '+25% XP multiplier active' : 'Zero interruptions for bonus'}
                  </div>
                </div>
              </div>

              <span className="text-[11px] font-mono-numbers font-bold">
                {interruptionCount === 0 ? '🔥 1.25x' : '1.0x'}
              </span>
            </div>

            {/* Status 2: Streak Protection Status */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Shield className="w-4 h-4 text-cyan-400 shrink-0" />
                <div>
                  <div className="text-xs font-bold text-white">Streak Protection</div>
                  <div className="text-[10px] text-slate-400">
                    {studyState ? `${studyState.freezeTokens} Freeze Shields ready` : 'Secures daily habit'}
                  </div>
                </div>
              </div>

              <span className="text-[11px] font-mono-numbers font-bold text-amber-400">
                {studyState ? `${studyState.streak}d Streak` : 'Active'}
              </span>
            </div>
          </div>

          {/* Primary Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleToggleTimer}
              className={`flex-1 py-3 px-5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg ${
                isRunning
                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20'
                  : 'bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-slate-950 shadow-amber-500/10'
              }`}
            >
              {isRunning ? (
                <>
                  <Pause className="w-4 h-4" />
                  <span>Pause Pomodoro</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-slate-950" />
                  <span>Start {currentPhase === 'focus' ? 'Deep Work Sprint' : 'Break'}</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleSkipToNextPhase}
              className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Skip to next phase"
            >
              <span>Skip Phase</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={handleResetPhase}
              className="p-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer border border-slate-800"
              title="Reset current interval"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Soundscape Auto-Toggle Checkbox */}
          <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/80">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={autoPlaySoundscape}
                onChange={e => setAutoPlaySoundscape(e.target.checked)}
                className="w-3.5 h-3.5 rounded bg-slate-950 border-slate-800 accent-amber-500 cursor-pointer"
              />
              <span>Autoplay neurological soundscape during focus sprint</span>
            </label>

            <span className="text-[11px] text-slate-500">
              {config.description}
            </span>
          </div>
        </div>
      </div>

      {/* Reward Celebratory Banner (Upon completion) */}
      {recentRewardNotification && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/50 via-slate-900 to-emerald-950/40 border border-amber-500/40 space-y-2 animate-fadeIn shadow-2xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="p-2 rounded-xl bg-amber-500 text-slate-950 font-bold">
                <Trophy className="w-5 h-5 fill-slate-950" />
              </span>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                  {recentRewardNotification.isUninterrupted ? 'Uninterrupted Focus Achieved' : 'Focus Interval Complete'}
                </span>
                <h4 className="text-base font-bold text-white">
                  +{recentRewardNotification.xp} Knowledge XP Awarded · {recentRewardNotification.minutes} Focused Minutes Logged!
                </h4>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setRecentRewardNotification(null)}
              className="text-xs text-slate-400 hover:text-white underline cursor-pointer"
            >
              Dismiss
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3 pl-11 text-xs text-slate-300">
            <span className="flex items-center gap-1 text-emerald-400 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Daily Study Streak Secured & Logged in Heatmap
            </span>

            {recentRewardNotification.earnedFreezeShield && (
              <span className="flex items-center gap-1 text-cyan-300 font-bold bg-cyan-500/10 px-2.5 py-0.5 rounded-full border border-cyan-500/20">
                <Shield className="w-3.5 h-3.5 text-cyan-400" />
                4-Cycle Landmark Reached: +1 Freeze Shield Earned!
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
