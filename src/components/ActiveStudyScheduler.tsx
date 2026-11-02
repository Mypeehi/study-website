import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Clock,
  Coffee,
  RotateCcw,
  Sparkles,
  Zap,
  BookOpen,
  HelpCircle,
  Brain,
  MessageSquare,
  Shield,
  Layers,
  ArrowRight,
  Play,
  Pause,
  SkipForward,
  CheckCircle2,
  Volume2,
  VolumeX,
  Plus,
  Minus,
  Copy,
  Check,
  Flame,
  SlidersHorizontal,
  Timer,
  ChevronRight,
  Headphones,
  Award,
  Target,
  Maximize2
} from 'lucide-react';
import { StudyPhase, ScheduleBlock } from '../types';
import { generateSchedule, PHASE_CONFIG, SCHEDULE_WEIGHTS } from '../utils/schedule';
import {
  playTimerTickSound,
  playPhaseCompleteChime,
  playDeepWorkGongSound,
  playCorrectSound,
  playStreakFlameSound,
  startSoundscape,
  stopSoundscape,
  getActiveSoundscape,
  SoundscapeMode
} from '../utils/audio';

interface ActiveStudySchedulerProps {
  onStartSession?: (hours: number, subject: string, isDeepWork: boolean, targetPhase?: StudyPhase) => void;
  defaultHours?: number;
  defaultSubject?: string;
  defaultDeepWork?: boolean;
  dailyTargetMinutes?: number;
  onRecordXp?: (amount: number) => void;
}

export const ActiveStudyScheduler: React.FC<ActiveStudySchedulerProps> = ({
  onStartSession,
  defaultHours = 2,
  defaultSubject = 'Math/Science',
  defaultDeepWork = true,
  dailyTargetMinutes,
  onRecordXp,
}) => {
  const detectCategory = (subj: string): 'Math/Science' | 'Reading/Writing' | 'General' => {
    if (subj === 'Reading/Writing' || /english|literature|reading|writing|rhetoric|grammar/i.test(subj)) {
      return 'Reading/Writing';
    }
    if (subj === 'General') return 'General';
    return 'Math/Science';
  };

  const [hours, setHours] = useState<number>(defaultHours);
  const [subject, setSubject] = useState<'Math/Science' | 'Reading/Writing' | 'General'>(() => detectCategory(defaultSubject));
  const [isDeepWork, setIsDeepWork] = useState<boolean>(defaultDeepWork);
  const [selectedBlockIdx, setSelectedBlockIdx] = useState<number | null>(null);

  // Custom duration override per block index (in minutes)
  const [customDurations, setCustomDurations] = useState<Record<number, number>>({});

  // Active Dedicated Part Timer State
  const [activeTimerBlockIdx, setActiveTimerBlockIdx] = useState<number | null>(null);
  const [timerSecondsRemaining, setTimerSecondsRemaining] = useState<number>(0);
  const [timerTotalSeconds, setTimerTotalSeconds] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [autoAdvanceNext, setAutoAdvanceNext] = useState<boolean>(true);
  const [completedBlockIndices, setCompletedBlockIndices] = useState<number[]>([]);
  const [copiedSchedule, setCopiedSchedule] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'roster' | 'timer-hud'>('roster');

  // Ambient soundscape integration
  const [ambientSound, setAmbientSound] = useState<SoundscapeMode>(() => getActiveSoundscape());

  const timerRef = useRef<any>(null);

  React.useEffect(() => {
    setSubject(detectCategory(defaultSubject));
  }, [defaultSubject]);

  // Generate baseline blocks from scheduler utility
  const { blocks: rawBlocks, totalMins: rawTotalMins } = useMemo(() => {
    return generateSchedule(hours, subject, isDeepWork);
  }, [hours, subject, isDeepWork]);

  // Compute effective blocks taking into account any custom duration overrides
  const effectiveBlocks = useMemo(() => {
    let currentStart = 0;
    return rawBlocks.map((b, idx) => {
      const dur = customDurations[idx] !== undefined ? Math.max(1, customDurations[idx]) : b.duration;
      const start = Math.round(currentStart * 10) / 10;
      const end = Math.round((currentStart + dur) * 10) / 10;
      currentStart += dur;
      return {
        ...b,
        duration: dur,
        start,
        end
      };
    });
  }, [rawBlocks, customDurations]);

  const totalEffectiveMins = useMemo(() => {
    return Math.round(effectiveBlocks.reduce((acc, b) => acc + b.duration, 0));
  }, [effectiveBlocks]);

  const activeRecallTotalMins = useMemo(() => {
    return Math.round(effectiveBlocks.filter(b => b.type === 'Active Recall').reduce((acc, b) => acc + b.duration, 0));
  }, [effectiveBlocks]);

  const breakTotalMins = useMemo(() => {
    return Math.round(effectiveBlocks.filter(b => b.type === 'Break').reduce((acc, b) => acc + b.duration, 0));
  }, [effectiveBlocks]);

  // Default active block if none explicitly selected
  const activeBlock = activeTimerBlockIdx !== null
    ? effectiveBlocks[activeTimerBlockIdx]
    : selectedBlockIdx !== null
    ? effectiveBlocks[selectedBlockIdx]
    : effectiveBlocks[0] || null;

  // Active Timer Countdown Effect
  useEffect(() => {
    if (isTimerRunning && timerSecondsRemaining > 0) {
      timerRef.current = setInterval(() => {
        setTimerSecondsRemaining(prev => {
          if (prev <= 5 && prev > 1) {
            playTimerTickSound();
          }
          if (prev <= 1) {
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTimerRunning, timerSecondsRemaining, activeTimerBlockIdx]);

  // Spacebar hotkey to toggle timer when HUD is active
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.code === 'Space' && activeTimerBlockIdx !== null) {
        e.preventDefault();
        setIsTimerRunning(running => !running);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTimerBlockIdx]);

  // Part timer completion handler
  const handleTimerComplete = () => {
    setIsTimerRunning(false);
    playPhaseCompleteChime();

    if (activeTimerBlockIdx !== null) {
      // Mark as completed
      setCompletedBlockIndices(prev => Array.from(new Set([...prev, activeTimerBlockIdx])));
      onRecordXp?.(35);
      playStreakFlameSound();

      // Check auto-advance
      if (autoAdvanceNext && activeTimerBlockIdx < effectiveBlocks.length - 1) {
        const nextIdx = activeTimerBlockIdx + 1;
        const nextBlock = effectiveBlocks[nextIdx];
        setTimeout(() => {
          setActiveTimerBlockIdx(nextIdx);
          const nextSecs = Math.round(nextBlock.duration * 60);
          setTimerTotalSeconds(nextSecs);
          setTimerSecondsRemaining(nextSecs);
          setIsTimerRunning(true);
          playCorrectSound();
        }, 1200);
      } else if (activeTimerBlockIdx === effectiveBlocks.length - 1) {
        // Entire schedule finished!
        playDeepWorkGongSound();
        onRecordXp?.(100);
      }
    }
  };

  // Launch dedicated timer for a specific block/part
  const handleStartPartTimer = (blockIdx: number) => {
    const blk = effectiveBlocks[blockIdx];
    if (!blk) return;

    setActiveTimerBlockIdx(blockIdx);
    setSelectedBlockIdx(blockIdx);
    const secs = Math.round(blk.duration * 60);
    setTimerTotalSeconds(secs);
    setTimerSecondsRemaining(secs);
    setIsTimerRunning(true);
    setActiveTab('timer-hud');
    playCorrectSound();
  };

  const handleToggleTimer = () => {
    if (activeTimerBlockIdx === null) {
      handleStartPartTimer(0);
      return;
    }
    setIsTimerRunning(r => !r);
  };

  const handleResetCurrentTimer = () => {
    if (activeTimerBlockIdx === null) return;
    const blk = effectiveBlocks[activeTimerBlockIdx];
    const secs = Math.round((blk?.duration || 10) * 60);
    setTimerTotalSeconds(secs);
    setTimerSecondsRemaining(secs);
    setIsTimerRunning(false);
  };

  const handleAdjustTimerSeconds = (deltaSeconds: number) => {
    setTimerSecondsRemaining(prev => Math.max(10, prev + deltaSeconds));
    setTimerTotalSeconds(prev => Math.max(10, prev + deltaSeconds));
  };

  const handleSkipToNextPart = () => {
    if (activeTimerBlockIdx === null) return;
    if (activeTimerBlockIdx < effectiveBlocks.length - 1) {
      handleStartPartTimer(activeTimerBlockIdx + 1);
    } else {
      setIsTimerRunning(false);
    }
  };

  const handleMarkCurrentPartCompleted = () => {
    if (activeTimerBlockIdx === null) return;
    setCompletedBlockIndices(prev => Array.from(new Set([...prev, activeTimerBlockIdx])));
    onRecordXp?.(30);
    playStreakFlameSound();
    playPhaseCompleteChime();
    if (autoAdvanceNext && activeTimerBlockIdx < effectiveBlocks.length - 1) {
      handleStartPartTimer(activeTimerBlockIdx + 1);
    } else {
      setIsTimerRunning(false);
    }
  };

  // Custom duration setters for individual blocks
  const handleModifyBlockDuration = (blockIdx: number, deltaMinutes: number) => {
    const currentDur = customDurations[blockIdx] !== undefined
      ? customDurations[blockIdx]
      : effectiveBlocks[blockIdx]?.duration || 10;
    const newDur = Math.max(1, Math.min(90, Math.round((currentDur + deltaMinutes) * 10) / 10));

    setCustomDurations(prev => ({
      ...prev,
      [blockIdx]: newDur
    }));

    // If currently timing this block, adjust its seconds
    if (activeTimerBlockIdx === blockIdx) {
      const newSecs = Math.round(newDur * 60);
      setTimerTotalSeconds(newSecs);
      setTimerSecondsRemaining(newSecs);
    }
  };

  const handleResetCustomDurations = () => {
    setCustomDurations({});
    setSelectedBlockIdx(null);
    if (activeTimerBlockIdx !== null) {
      const originalBlk = rawBlocks[activeTimerBlockIdx];
      if (originalBlk) {
        const secs = Math.round(originalBlk.duration * 60);
        setTimerTotalSeconds(secs);
        setTimerSecondsRemaining(secs);
      }
    }
  };

  // 1-Click Preset Tempos
  const handleApplyPreset = (targetHours: number, deepWork: boolean) => {
    setHours(targetHours);
    setIsDeepWork(deepWork);
    setCustomDurations({});
    setSelectedBlockIdx(null);
    setActiveTimerBlockIdx(null);
    setIsTimerRunning(false);
    playCorrectSound();
  };

  // Copy schedule plan to clipboard
  const handleCopySchedule = () => {
    const lines = [
      `📅 Personalized Active Study Plan (${subject})`,
      `Total Duration: ${totalEffectiveMins}m (${(totalEffectiveMins / 60).toFixed(1)} hrs) · Active Recall: ${activeRecallTotalMins}m · Breaks: ${breakTotalMins}m`,
      `----------------------------------------------------`,
      ...effectiveBlocks.map((b, i) => {
        const cfg = PHASE_CONFIG[b.phase];
        return `[Part 0${i + 1}] ${cfg.label} (${Math.round(b.duration)} mins | ${Math.round(b.start)}m - ${Math.round(b.end)}m)\n  • ${cfg.description}\n  • Guidance: ${cfg.actionGuidance}`;
      })
    ];

    navigator.clipboard.writeText(lines.join('\n\n')).then(() => {
      setCopiedSchedule(true);
      playCorrectSound();
      setTimeout(() => setCopiedSchedule(false), 2500);
    });
  };

  // Ambient soundscape switcher
  const handleToggleAmbient = (mode: SoundscapeMode) => {
    if (ambientSound === mode) {
      stopSoundscape();
      setAmbientSound('off');
    } else {
      startSoundscape(mode, 0.35);
      setAmbientSound(mode);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Circular SVG progress calculations for active part timer
  const radius = 62;
  const circumference = 2 * Math.PI * radius;
  const progressRatio = timerTotalSeconds > 0
    ? Math.min(1, Math.max(0, (timerTotalSeconds - timerSecondsRemaining) / timerTotalSeconds))
    : 0;
  const strokeDashoffset = circumference * (1 - progressRatio);

  const angle = (progressRatio * 360 - 90) * (Math.PI / 180);
  const headX = 80 + radius * Math.cos(angle);
  const headY = 80 + radius * Math.sin(angle);

  const activePhaseCfg = activeBlock ? PHASE_CONFIG[activeBlock.phase] : PHASE_CONFIG['Pretest'];

  const getPhaseIcon = (phase: StudyPhase) => {
    switch (phase) {
      case 'Pretest': return <HelpCircle className="w-4 h-4 text-cyan-400" />;
      case 'Core Sprint': return <Zap className="w-4 h-4 text-indigo-400" />;
      case 'Blurting': return <Brain className="w-4 h-4 text-amber-400" />;
      case 'Application': return <Target className="w-4 h-4 text-rose-400" />;
      case 'Teach-Back': return <MessageSquare className="w-4 h-4 text-emerald-400" />;
      case 'Break': return <Coffee className="w-4 h-4 text-cyan-400" />;
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 md:p-8 space-y-7 shadow-2xl relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header & Live Schedule Metrics */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5 border-b border-slate-800 pb-6 relative z-10">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider mb-1.5">
            <span className="p-1 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Layers className="w-3.5 h-3.5" />
            </span>
            <span>Personalized Study Architecture · Dedicated Part Timers</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-display text-white flex items-center gap-2.5">
            <span>Personalized Daily Study Schedule</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono-numbers border border-slate-700 font-normal">
              {effectiveBlocks.length} Scheduled Phases
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xl leading-relaxed">
            Every phase of your study session has a calibrated dedicated timer. Adjust durations, drill specific phases, or execute the full sequenced protocol with automated transitions.
          </p>
        </div>

        {/* Live HUD Counters & Goal Comparison */}
        <div className="flex flex-wrap items-center gap-3 self-stretch lg:self-auto">
          <div className="flex items-center bg-slate-950 border border-slate-800 px-3.5 py-2 rounded-2xl shadow-inner">
            <div className="text-center px-3 border-r border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold">Active Recall</span>
              <span className="text-base sm:text-lg font-extrabold font-mono-numbers text-amber-400">
                {activeRecallTotalMins}m
              </span>
            </div>
            <div className="text-center px-3 border-r border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold">Breaks</span>
              <span className="text-base sm:text-lg font-extrabold font-mono-numbers text-cyan-400">
                {breakTotalMins}m
              </span>
            </div>
            <div className="text-center px-3">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold">Total Session</span>
              <span className="text-base sm:text-lg font-extrabold font-mono-numbers text-white">
                {totalEffectiveMins}m
              </span>
            </div>
          </div>

          {/* Quick Schedule Copy & Export Button */}
          <button
            type="button"
            onClick={handleCopySchedule}
            className="px-3 py-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
            title="Copy formatted study schedule to clipboard"
          >
            {copiedSchedule ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Export Plan</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Preset Tempo Quick Pickers */}
      <div className="flex flex-wrap items-center gap-2 pt-0.5">
        <span className="text-[11px] font-semibold text-slate-400 mr-1 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-amber-400" />
          <span>Quick Tempos:</span>
        </span>
        <button
          type="button"
          onClick={() => handleApplyPreset(0.75, false)}
          className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
            hours === 0.75 && !isDeepWork
              ? 'bg-amber-500 text-slate-950 font-bold border-amber-400 shadow-sm'
              : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
          }`}
        >
          ⚡ 45m Sprint Drill
        </button>
        <button
          type="button"
          onClick={() => handleApplyPreset(1.5, false)}
          className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
            hours === 1.5 && !isDeepWork
              ? 'bg-amber-500 text-slate-950 font-bold border-amber-400 shadow-sm'
              : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
          }`}
        >
          🍅 90m Classic Pomodoro
        </button>
        <button
          type="button"
          onClick={() => handleApplyPreset(2, true)}
          className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
            hours === 2 && isDeepWork
              ? 'bg-amber-500 text-slate-950 font-bold border-amber-400 shadow-sm'
              : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
          }`}
        >
          🧠 2h Deep Work (50/10)
        </button>
        <button
          type="button"
          onClick={() => handleApplyPreset(3, true)}
          className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
            hours === 3 && isDeepWork
              ? 'bg-amber-500 text-slate-950 font-bold border-amber-400 shadow-sm'
              : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
          }`}
        >
          🏆 3h High-Yield Marathon
        </button>

        {Object.keys(customDurations).length > 0 && (
          <button
            type="button"
            onClick={handleResetCustomDurations}
            className="ml-auto text-[11px] text-amber-400 hover:text-amber-300 underline cursor-pointer flex items-center gap-1"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset Custom Times</span>
          </button>
        )}
      </div>

      {/* Control Panel Parameters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80">
        {/* Param 1: Study Duration */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <label className="font-semibold text-slate-300 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Base Duration:</span>
            </label>
            <span className="font-mono-numbers text-amber-400 font-bold">
              {hours} Hours ({rawTotalMins}m base)
            </span>
          </div>
          <input
            type="range"
            min={0.75}
            max={4}
            step={0.25}
            value={hours}
            onChange={e => {
              setHours(parseFloat(e.target.value));
              setCustomDurations({});
            }}
            className="w-full h-2 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-amber-500"
          />
          <div className="flex justify-between text-[10px] text-slate-500 font-mono-numbers">
            <span>45m</span>
            <span>1.5h</span>
            <span>2.5h</span>
            <span>4.0h</span>
          </div>
        </div>

        {/* Param 2: Subject Priority */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
            <span>Discipline Focus:</span>
          </label>
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-900 rounded-xl border border-slate-800">
            {(['Math/Science', 'Reading/Writing', 'General'] as const).map(subj => (
              <button
                key={subj}
                type="button"
                onClick={() => {
                  setSubject(subj);
                  setCustomDurations({});
                }}
                className={`py-1.5 text-[11px] font-medium rounded-lg transition-colors cursor-pointer truncate px-1 text-center ${
                  subject === subj
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {subj === 'Math/Science' ? 'STEM / Sci' : subj === 'Reading/Writing' ? 'Hum / Read' : 'General'}
              </button>
            ))}
          </div>
        </div>

        {/* Param 3: Work/Rest Cycle Cycle & Ambient Sound */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
            <span className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              <span>Interval Cadence:</span>
            </span>
            <span className="text-[10px] text-slate-500 font-normal">
              {isDeepWork ? '50m + 10m rest' : '25m + 5m rest'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setIsDeepWork(!isDeepWork);
                setCustomDurations({});
              }}
              className={`flex-1 py-1.5 px-3 rounded-xl border text-xs font-medium transition-all flex items-center justify-between cursor-pointer ${
                isDeepWork
                  ? 'bg-indigo-950/50 border-indigo-500/50 text-indigo-200'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className="truncate">
                {isDeepWork ? '⚡ Deep Work (50/10)' : '🍅 Standard (25/5)'}
              </span>
              <span className="w-2 h-2 rounded-full ml-1 bg-amber-400 shrink-0" />
            </button>

            {/* Ambient Soundscape Dropdown / Toggle */}
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1">
              <button
                type="button"
                onClick={() => handleToggleAmbient('steady-state')}
                title={ambientSound !== 'off' ? `Ambient Sound Active (${ambientSound})` : 'Play 40Hz Gamma Focus Noise'}
                className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer flex items-center gap-1 ${
                  ambientSound !== 'off'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Headphones className="w-3.5 h-3.5" />
                <span className="text-[10px] hidden sm:inline">
                  {ambientSound !== 'off' ? 'Focus Audio' : 'Sound'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Visual Timeline Timeline Bar */}
      <div className="space-y-3 pt-1">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="font-semibold text-slate-300 flex items-center gap-1.5">
            <Timer className="w-3.5 h-3.5 text-cyan-400" />
            <span>Interactive Session Sequence</span>
          </span>
          <span className="text-[11px] text-slate-400 font-mono-numbers">
            {completedBlockIndices.length} / {effectiveBlocks.length} Parts Completed
          </span>
        </div>

        {/* Segmented Timeline Bar */}
        <div className="h-11 w-full bg-slate-950 rounded-2xl overflow-hidden p-1 flex gap-1 border border-slate-800 shadow-inner">
          {effectiveBlocks.map((b, i) => {
            const widthPct = Math.max(3, (b.duration / totalEffectiveMins) * 100);
            const isSelected = selectedBlockIdx === i;
            const isCurrentlyTiming = activeTimerBlockIdx === i;
            const isCompleted = completedBlockIndices.includes(i);
            const cfg = PHASE_CONFIG[b.phase];

            let blockColor = 'bg-slate-800 text-slate-300';
            if (b.phase === 'Pretest') blockColor = 'bg-cyan-600 hover:bg-cyan-500 text-slate-950';
            else if (b.phase === 'Core Sprint') blockColor = 'bg-indigo-600 hover:bg-indigo-500 text-white';
            else if (b.phase === 'Blurting') blockColor = 'bg-amber-500 hover:bg-amber-400 text-slate-950';
            else if (b.phase === 'Application') blockColor = 'bg-rose-600 hover:bg-rose-500 text-white';
            else if (b.phase === 'Teach-Back') blockColor = 'bg-emerald-600 hover:bg-emerald-500 text-slate-950';
            else if (b.phase === 'Break') blockColor = 'bg-slate-800 hover:bg-slate-700 text-cyan-400';

            return (
              <div
                key={i}
                onClick={() => {
                  setSelectedBlockIdx(isSelected ? null : i);
                }}
                style={{ width: `${widthPct}%` }}
                title={`Part 0${i + 1}: ${cfg.label} (${Math.round(b.duration)}m)`}
                className={`h-full rounded-xl transition-all cursor-pointer relative group flex items-center justify-center text-[10px] font-extrabold ${blockColor} ${
                  isSelected ? 'ring-2 ring-white scale-y-105 z-10' : ''
                } ${isCurrentlyTiming ? 'ring-2 ring-amber-400 animate-pulse' : ''} ${
                  isCompleted ? 'opacity-70' : ''
                }`}
              >
                {isCompleted ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
                ) : b.phase === 'Break' ? (
                  <Coffee className="w-3.5 h-3.5 shrink-0" />
                ) : widthPct > 6 ? (
                  <span className="truncate px-1 tracking-tight">
                    {b.phase.split(' ')[0]} ({Math.round(b.duration)}m)
                  </span>
                ) : (
                  <span className="text-[9px]">{Math.round(b.duration)}m</span>
                )}
              </div>
            );
          })}
        </div>

        {/* Phase Legend */}
        <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px]">
          <div className="flex items-center gap-1.5 text-cyan-400">
            <span className="w-2.5 h-2.5 rounded-sm bg-cyan-500" />
            <span>Pretest</span>
          </div>
          <div className="flex items-center gap-1.5 text-indigo-400">
            <span className="w-2.5 h-2.5 rounded-sm bg-indigo-500" />
            <span>Core Sprint</span>
          </div>
          <div className="flex items-center gap-1.5 text-amber-400">
            <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" />
            <span>Blurting</span>
          </div>
          <div className="flex items-center gap-1.5 text-rose-400">
            <span className="w-2.5 h-2.5 rounded-sm bg-rose-500" />
            <span>Application</span>
          </div>
          <div className="flex items-center gap-1.5 text-emerald-400">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
            <span>Teach-Back</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-400">
            <span className="w-2.5 h-2.5 rounded-sm bg-slate-700" />
            <span>Rest Break</span>
          </div>
        </div>
      </div>

      {/* Tabs: Phase Roster & Dedicated Timer Engine */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('roster')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'roster'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Set Timers by Part ({effectiveBlocks.length})</span>
            </button>
            <button
              type="button"
              onClick={() => {
                if (activeTimerBlockIdx === null) {
                  handleStartPartTimer(0);
                } else {
                  setActiveTab('timer-hud');
                }
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'timer-hud'
                  ? 'bg-cyan-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Timer className="w-3.5 h-3.5" />
              <span>Active Part Timer HUD {isTimerRunning && '⏱️'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400">
            <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-slate-300">
              <input
                type="checkbox"
                checked={autoAdvanceNext}
                onChange={e => setAutoAdvanceNext(e.target.checked)}
                className="rounded border-slate-700 text-cyan-500 focus:ring-0 cursor-pointer"
              />
              <span>Auto-advance parts</span>
            </label>
          </div>
        </div>

        {/* TAB 1: PHASE ROSTER WITH DIRECT DURATION ADJUSTMENTS & INDIVIDUAL TIMERS */}
        {activeTab === 'roster' && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {effectiveBlocks.map((blk, idx) => {
                const cfg = PHASE_CONFIG[blk.phase];
                const isTiming = activeTimerBlockIdx === idx;
                const isCompleted = completedBlockIndices.includes(idx);
                const isSelected = selectedBlockIdx === idx;

                return (
                  <div
                    key={idx}
                    className={`p-4 rounded-2xl border transition-all space-y-3 ${
                      isTiming
                        ? 'bg-slate-950 border-amber-400 ring-1 ring-amber-400/50 shadow-lg'
                        : isSelected
                        ? 'bg-slate-950 border-cyan-500/60 shadow-md'
                        : isCompleted
                        ? 'bg-slate-950/60 border-emerald-900/40 text-slate-400'
                        : 'bg-slate-950/80 border-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2.5">
                        <span className="w-6 h-6 rounded-lg bg-slate-800 text-slate-300 font-bold font-mono-numbers text-xs flex items-center justify-center shrink-0 mt-0.5">
                          0{idx + 1}
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${cfg.badgeColor}`}>
                              {cfg.label}
                            </span>
                            {isCompleted && (
                              <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-0.5">
                                <CheckCircle2 className="w-3 h-3" /> Done (+35 XP)
                              </span>
                            )}
                            {isTiming && (
                              <span className="text-[10px] text-amber-400 font-bold flex items-center gap-1 animate-pulse font-mono-numbers">
                                Running {formatTime(timerSecondsRemaining)}
                              </span>
                            )}
                          </div>
                          <span className="text-xs font-mono-numbers text-slate-400 mt-1 block">
                            Starts at {Math.round(blk.start)}m → Ends at {Math.round(blk.end)}m
                          </span>
                        </div>
                      </div>

                      {/* Direct Duration Stepper for this specific part */}
                      <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 px-2 py-1 rounded-xl">
                        <button
                          type="button"
                          onClick={() => handleModifyBlockDuration(idx, -1)}
                          title="Subtract 1 minute"
                          className="w-5 h-5 rounded hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer font-bold text-xs"
                        >
                          -
                        </button>
                        <span className="font-mono-numbers font-bold text-xs text-white px-1">
                          {Math.round(blk.duration)}m
                        </span>
                        <button
                          type="button"
                          onClick={() => handleModifyBlockDuration(idx, 1)}
                          title="Add 1 minute"
                          className="w-5 h-5 rounded hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer font-bold text-xs"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed font-sans line-clamp-2">
                      {cfg.description}
                    </p>

                    {/* Action Bar for this part */}
                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800/60">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleModifyBlockDuration(idx, 5)}
                          className="text-[10px] px-2 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                        >
                          +5m
                        </button>
                        <button
                          type="button"
                          onClick={() => handleModifyBlockDuration(idx, -5)}
                          className="text-[10px] px-2 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                        >
                          -5m
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleStartPartTimer(idx)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm ${
                            isTiming
                              ? 'bg-amber-500 text-slate-950 font-extrabold'
                              : 'bg-cyan-600 hover:bg-cyan-500 text-white'
                          }`}
                        >
                          <Play className="w-3 h-3 fill-current" />
                          <span>{isTiming ? 'Active Timer' : `Start ${Math.round(blk.duration)}m Timer`}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: ACTIVE DEDICATED PART TIMER HUD WITH CIRCULAR SVG GAUGE */}
        {activeTab === 'timer-hud' && activeBlock && (
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl animate-fadeIn">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              {/* Circular SVG Gauge Countdown */}
              <div className="relative w-44 h-44 sm:w-48 sm:h-48 flex items-center justify-center shrink-0">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
                  <defs>
                    <linearGradient id="partTimerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#22d3ee" />
                      <stop offset="50%" stopColor="#818cf8" />
                      <stop offset="100%" stopColor="#f59e0b" />
                    </linearGradient>
                    <filter id="partGlowFilter" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="3" result="blur" />
                      <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                  </defs>

                  {/* Outer subtle ring */}
                  <circle
                    cx="80"
                    cy="80"
                    r={radius + 8}
                    fill="none"
                    stroke="#1e293b"
                    strokeWidth="1.5"
                    strokeDasharray="3 4"
                    opacity="0.6"
                  />

                  {/* Background Track */}
                  <circle
                    cx="80"
                    cy="80"
                    r={radius}
                    fill="none"
                    stroke="#0f172a"
                    strokeWidth="8"
                  />

                  {/* Dynamic Progress Arc */}
                  <circle
                    cx="80"
                    cy="80"
                    r={radius}
                    fill="none"
                    stroke="url(#partTimerGradient)"
                    strokeWidth="8"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    filter="url(#partGlowFilter)"
                    className="transition-all duration-500 ease-linear"
                  />

                  {/* Glowing head marker */}
                  {timerSecondsRemaining > 0 && (
                    <circle
                      cx={headX}
                      cy={headY}
                      r="4"
                      fill="#ffffff"
                      stroke="#f59e0b"
                      strokeWidth="2"
                      className="shadow-lg"
                    />
                  )}
                </svg>

                {/* Interior Counter & Phase Badge */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-2">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                    Part {activeTimerBlockIdx !== null ? `0${activeTimerBlockIdx + 1}` : '01'}
                  </span>
                  <span className="text-3xl sm:text-4xl font-extrabold font-mono-numbers text-white tracking-tight">
                    {formatTime(timerSecondsRemaining)}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border mt-1 ${activePhaseCfg.badgeColor}`}>
                    {activeBlock.phase}
                  </span>
                  <span className="text-[10px] font-mono-numbers text-amber-400/90 mt-1">
                    {Math.round(progressRatio * 100)}% Elapsed
                  </span>
                </div>
              </div>

              {/* Phase Guidance & Control Center */}
              <div className="space-y-4 flex-1 text-left">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                      Current Part Focus
                    </span>
                    <span className="text-xs text-slate-500 font-mono-numbers">
                      {Math.round(activeBlock.start)}m → {Math.round(activeBlock.end)}m
                    </span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                    {getPhaseIcon(activeBlock.phase)}
                    <span>{activePhaseCfg.label}</span>
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans">
                    {activePhaseCfg.description}
                  </p>
                </div>

                {/* Examiner Pedagogical Guidance */}
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-xs text-amber-200 font-medium space-y-1">
                  <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider block">
                    Angry Examiner Protocol:
                  </span>
                  <p className="text-xs text-slate-200 leading-relaxed">
                    {activePhaseCfg.actionGuidance}
                  </p>
                </div>

                {/* Live Controls */}
                <div className="flex flex-wrap items-center gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={handleToggleTimer}
                    className={`px-5 py-2.5 rounded-xl font-extrabold text-xs flex items-center gap-2 cursor-pointer shadow-lg transition-transform hover:scale-[1.02] ${
                      isTimerRunning
                        ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                        : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                    }`}
                  >
                    {isTimerRunning ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                    <span>{isTimerRunning ? 'Pause Timer (Space)' : 'Start Phase Timer (Space)'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleResetCurrentTimer}
                    title="Reset this part's timer"
                    className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAdjustTimerSeconds(60)}
                    className="px-2.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-semibold cursor-pointer"
                  >
                    +1m
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAdjustTimerSeconds(300)}
                    className="px-2.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-semibold cursor-pointer"
                  >
                    +5m
                  </button>

                  <button
                    type="button"
                    onClick={handleMarkCurrentPartCompleted}
                    className="px-3.5 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold flex items-center gap-1.5 cursor-pointer ml-auto"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Complete (+30 XP)</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSkipToNextPart}
                    title="Skip to next phase in sequence"
                    className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors cursor-pointer"
                  >
                    <SkipForward className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Selected Block Deep-Dive Card (if block clicked in timeline) */}
      {selectedBlockIdx !== null && activeTab === 'roster' && effectiveBlocks[selectedBlockIdx] && (
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 animate-fadeIn">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${PHASE_CONFIG[effectiveBlocks[selectedBlockIdx].phase].badgeColor}`}>
                {PHASE_CONFIG[effectiveBlocks[selectedBlockIdx].phase].label}
              </span>
              <span className="text-xs font-mono-numbers text-slate-400">
                {Math.round(effectiveBlocks[selectedBlockIdx].start)}m → {Math.round(effectiveBlocks[selectedBlockIdx].end)}m ({Math.round(effectiveBlocks[selectedBlockIdx].duration)} minutes)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleStartPartTimer(selectedBlockIdx)}
                className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg flex items-center gap-1 cursor-pointer"
              >
                <Play className="w-3 h-3 fill-slate-950" />
                <span>Launch Part 0{selectedBlockIdx + 1} Timer</span>
              </button>
            </div>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            {PHASE_CONFIG[effectiveBlocks[selectedBlockIdx].phase].description}
          </p>
          <div className="text-xs text-amber-300/90 bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20">
            <strong>Angry Explainer Guidance: </strong>
            {PHASE_CONFIG[effectiveBlocks[selectedBlockIdx].phase].actionGuidance}
          </div>
        </div>
      )}

      {/* Launch Phased Session Action */}
      {onStartSession && (
        <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-400 text-center sm:text-left">
            <span>Ready to execute this active protocol in full interactive mode?</span>
            {dailyTargetMinutes && (
              <span className="block text-[11px] text-amber-400/90 font-mono-numbers">
                Daily Goal: {dailyTargetMinutes}m · Schedule covers {totalEffectiveMins}m ({Math.round((totalEffectiveMins / dailyTargetMinutes) * 100)}%)
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => onStartSession(hours, subject, isDeepWork, activeBlock?.phase)}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 via-rose-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-xl transition-transform hover:scale-[1.02]"
            >
              <Sparkles className="w-4 h-4 fill-slate-950" />
              <span>Launch Full AI Study Session ({totalEffectiveMins}m)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
