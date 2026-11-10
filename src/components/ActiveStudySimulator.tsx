import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  Zap,
  Target,
  HelpCircle,
  AlertCircle,
  Footprints,
  Dumbbell,
  Clock,
  Sparkles,
  CheckCircle2,
  Volume2,
  VolumeX,
  ExternalLink,
  Flame,
  ArrowRight
} from 'lucide-react';
import {
  playTimerTickSound,
  playPhaseCompleteChime,
  playDeepWorkGongSound,
  playCorrectSound,
  playStreakFlameSound,
  isSoundEnabled,
  setSoundEnabled
} from '../utils/audio';
import { ExamPlan } from '../types';

export type StudySubject = 'Math' | 'World Languages' | 'English' | 'Social Studies' | 'Science' | 'Physics' | string;

export const LAZY_STUDYING_DESCRIPTIONS: Record<string, string> = {
  Math: 'Playing strategy games, estimating grocery bills, or mentally calculating percentages during sales.',
  'World Languages': "Passively listening to a podcast in your target language, watching anime with subtitles, or changing your phone's language setting.",
  English: 'Listening to audiobooks, reading Reddit threads analyzing movie plots, or watching video essays on YouTube.',
  'Social Studies': "Watching historical documentaries while eating, playing historically-based video games like Assassin's Creed, or listening to true crime/history podcasts.",
  Science: 'Watching nature documentaries, following science communicators on TikTok, or baking (which is literally applied chemistry).',
  Physics: 'Watching a sci-fi movie and laughing at the bad physics, playing Kerbal Space Program, or watching slow-mo sports replays.',
};

export const SUBJECT_TOPIC_PRESETS: Record<string, string[]> = {
  Math: [
    'Calculus: Derivatives & Chain Rule',
    'Algebra: Quadratic Vertex Form & Factoring',
    'Geometry: Circle Theorems & Angle Proofs',
    'Trigonometry: Unit Circle & Wave Functions',
  ],
  'World Languages': [
    'Irregular Past Tense Conjugations',
    'Direct & Indirect Object Pronouns',
    'Subjunctive Mood in Subordinate Clauses',
    'Idiomatic Expressions & Common Slang',
  ],
  English: [
    'Rhetorical Devices & Textual Inferences',
    'Author Tone, Purpose & Point of View',
    'Thesis Statement & Argumentative Structure',
    'Poetry Scansion & Figurative Language',
  ],
  'Social Studies': [
    'Causes & Outcomes of the Cold War',
    'Constitutional Compromises & Bill of Rights',
    'Supply, Demand & Market Equilibrium',
    'Decolonization & Post-WWII Geopolitics',
  ],
  Science: [
    'Cellular Respiration & ATP Synthase',
    'DNA Replication & RNA Transcription',
    'Chemical Equilibrium & Le Chatelier Principle',
    'Acid-Base Titration & pH Buffers',
  ],
  Physics: [
    "Newton's Second Law & Momentum Conservation",
    'Electric Circuits: Ohm & Kirchhoff Laws',
    'Optics: Refraction & Snell Law',
    'Simple Harmonic Motion & Resonance',
  ],
};

interface ActiveStudySimulatorProps {
  currentPlan?: ExamPlan | null;
  onNavigateToQuiz?: (subject?: string, phase?: 'pretest' | 'practice') => void;
  onNavigateToMistakes?: () => void;
  onNavigateToPractice?: (subject?: string) => void;
  onNavigateToRoadmap?: () => void;
  onLaunchInterview?: () => void;
  onResetProgress?: () => void;
  onRecordStudyMinutes?: (minutes: number) => void;
  onRecordXp?: (amount: number) => void;
  completedMilestonesCount?: number;
  unfixedMistakesCount?: number;
}

export const ActiveStudySimulator: React.FC<ActiveStudySimulatorProps> = ({
  currentPlan,
  onNavigateToQuiz,
  onNavigateToMistakes,
  onNavigateToPractice,
  onNavigateToRoadmap,
  onLaunchInterview,
  onResetProgress,
  onRecordStudyMinutes,
  onRecordXp,
  completedMilestonesCount = 0,
  unfixedMistakesCount = 0,
}) => {
  // Study configuration state
  const [totalMinutes, setTotalMinutes] = useState<number>(60);
  const [selectedSubject, setSelectedSubject] = useState<string>(() => {
    if (currentPlan?.profile?.subject) {
      return currentPlan.profile.subject;
    }
    return 'Math';
  });
  const [customGoal, setCustomGoal] = useState<string>(() => {
    if (currentPlan?.milestones?.[0]?.focus) {
      return `Master ${currentPlan.milestones[0].focus} & eliminate logic traps`;
    }
    return 'Master standard application and eliminate 2 logic traps';
  });
  const [isEditingGoal, setIsEditingGoal] = useState<boolean>(false);
  const [soundOn, setSoundOn] = useState<boolean>(isSoundEnabled());

  useEffect(() => {
    if (currentPlan?.profile?.subject) {
      setSelectedSubject(currentPlan.profile.subject);
    }
  }, [currentPlan?.profile?.subject]);

  useEffect(() => {
    if (currentPlan?.milestones?.[0]?.focus) {
      setCustomGoal(`Master ${currentPlan.milestones[0].focus} & eliminate logic traps`);
    }
  }, [currentPlan?.milestones]);

  // Interactive Live Session Runner State
  const [isSessionActive, setIsSessionActive] = useState<boolean>(false);
  const [activeStepIndex, setActiveStepIndex] = useState<number>(0);
  const [stepSecondsRemaining, setStepSecondsRemaining] = useState<number>(0);
  const [isTimerPaused, setIsTimerPaused] = useState<boolean>(false);
  const [sessionCompleted, setSessionCompleted] = useState<boolean>(false);
  const [totalSessionMinutesLogged, setTotalSessionMinutesLogged] = useState<number>(0);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Time calculations matching exact simulator formula:
  // Step 1 is fixed at 1 min
  // remaining = totalMinutes - 1
  // Step 2: 35% of remaining
  // Step 3: 20% of remaining
  // Step 4: 10% of remaining
  // Step 5: Remaining absorbed
  const m1 = 1;
  const remaining = Math.max(0, totalMinutes - 1);
  const m2 = Math.round(remaining * 0.35);
  const m3 = Math.round(remaining * 0.20);
  const m4 = Math.round(remaining * 0.10);
  const m5 = Math.max(1, remaining - (m2 + m3 + m4));

  const stepsData = [
    {
      step: 1,
      name: 'Goal',
      fullName: 'Goal Setting',
      minutes: m1,
      color: 'blue',
      barBg: 'bg-blue-500',
      badgeBg: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      borderTop: 'border-blue-500',
      icon: Target,
      tagline: 'Define a specific objective. Don\'t write "study", write exactly what standard you will master.',
      actionLabel: 'Set Goal Standard',
      actionHandler: () => setIsEditingGoal(true),
    },
    {
      step: 2,
      name: 'Pretest',
      fullName: 'Cold Pretest',
      minutes: m2,
      color: 'purple',
      barBg: 'bg-purple-500',
      badgeBg: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      borderTop: 'border-purple-500',
      icon: HelpCircle,
      tagline: currentPlan?.profile?.subject
        ? `Attempt hard ${currentPlan.profile.subject} questions cold. Create neural gaps so your brain encodes solutions deeper.`
        : 'Attempt hard questions cold. Create cognitive gaps so your brain absorbs info better later.',
      actionLabel: currentPlan ? `Launch Plan Pretest (${currentPlan.profile.subject})` : 'Launch Pretest Drill',
      actionHandler: () => onNavigateToQuiz?.(currentPlan ? currentPlan.profile.subject : selectedSubject, 'pretest'),
    },
    {
      step: 3,
      name: 'Fix Mistakes',
      fullName: 'Analyze & Fix Errors',
      minutes: m3,
      color: 'pink',
      barBg: 'bg-pink-500',
      badgeBg: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
      borderTop: 'border-pink-500',
      icon: AlertCircle,
      tagline: 'Analyze logic errors. Locate the exact rule or text line that proves the right answer.',
      actionLabel: unfixedMistakesCount > 0 ? `Review Mistakes (${unfixedMistakesCount})` : 'Open Mistake Vault',
      actionHandler: () => onNavigateToMistakes?.(),
    },
    {
      step: 4,
      name: 'Walk/Break',
      fullName: 'Cognitive Reset & Walk',
      minutes: m4,
      color: 'amber',
      barBg: 'bg-amber-500',
      badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      borderTop: 'border-amber-500',
      icon: Footprints,
      tagline: 'Step away from screens. Let your Default Mode Network process the errors in the background.',
      actionLabel: 'Start Break Breath',
      actionHandler: () => playDeepWorkGongSound(),
    },
    {
      step: 5,
      name: 'Practice',
      fullName: 'Deliberate Practice',
      minutes: m5,
      color: 'emerald',
      barBg: 'bg-emerald-500',
      badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      borderTop: 'border-emerald-500',
      icon: Dumbbell,
      tagline: currentPlan?.profile?.subject
        ? `Apply newly fixed ${currentPlan.profile.subject} concepts on fresh targeted problems until automatic.`
        : 'Apply your newly fixed knowledge on fresh problems until the pattern is cemented.',
      actionLabel: currentPlan ? `Practice Plan Problems (${currentPlan.profile.subject})` : 'Launch Practice Drill',
      actionHandler: () => onNavigateToPractice
        ? onNavigateToPractice(currentPlan ? currentPlan.profile.subject : selectedSubject)
        : onNavigateToQuiz?.(currentPlan ? currentPlan.profile.subject : selectedSubject, 'practice'),
    },
  ];

  // Start live guided session
  const handleStartLiveSession = () => {
    setIsSessionActive(true);
    setSessionCompleted(false);
    setActiveStepIndex(0);
    setStepSecondsRemaining(stepsData[0].minutes * 60);
    setIsTimerPaused(false);
    playDeepWorkGongSound();
  };

  const handlePauseResume = () => {
    setIsTimerPaused(prev => !prev);
  };

  const handleSkipToNextStep = () => {
    playPhaseCompleteChime();
    if (activeStepIndex < stepsData.length - 1) {
      const nextIdx = activeStepIndex + 1;
      setActiveStepIndex(nextIdx);
      setStepSecondsRemaining(stepsData[nextIdx].minutes * 60);
    } else {
      finishLiveSession();
    }
  };

  const finishLiveSession = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsSessionActive(false);
    setSessionCompleted(true);
    setTotalSessionMinutesLogged(totalMinutes);
    onRecordStudyMinutes?.(totalMinutes);
    onRecordXp?.(totalMinutes * 10);
    playStreakFlameSound();
    playCorrectSound();
  };

  const handleExitSession = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsSessionActive(false);
  };

  // Live timer interval
  useEffect(() => {
    if (!isSessionActive || isTimerPaused) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setStepSecondsRemaining(prev => {
        if (prev <= 1) {
          // Current step completed
          playPhaseCompleteChime();
          if (activeStepIndex < stepsData.length - 1) {
            const nextIdx = activeStepIndex + 1;
            setActiveStepIndex(nextIdx);
            return stepsData[nextIdx].minutes * 60;
          } else {
            finishLiveSession();
            return 0;
          }
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isSessionActive, isTimerPaused, activeStepIndex, totalMinutes]);

  const formatTimerDigits = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-full py-4 px-2 sm:px-4 md:px-8 flex flex-col items-center justify-center">
      <main className="w-full max-w-5xl glass-panel rounded-2xl shadow-2xl p-6 md:p-10 border border-slate-700/60 transition-all">
        
        {/* Top Header */}
        <header className="mb-8 text-center relative">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-blue-400 tracking-wider uppercase font-mono bg-blue-500/10 px-2.5 py-1 rounded-md border border-blue-500/20">
                Cognitive Science Protocol
              </span>
            </div>

            <div className="flex items-center gap-2">
              {onLaunchInterview && (
                <button
                  onClick={onLaunchInterview}
                  className="px-3 py-1.5 rounded-lg border border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                  title="Launch 1-on-1 AI Intake Interview"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>AI Intake Interview</span>
                </button>
              )}

              <button
                onClick={() => {
                  const nextSound = !soundOn;
                  setSoundOn(nextSound);
                  setSoundEnabled(nextSound);
                }}
                className={`p-2 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
                  soundOn
                    ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
                    : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
                }`}
                title={soundOn ? 'Sound cues enabled' : 'Muted'}
              >
                {soundOn ? <Volume2 className="w-4 h-4 text-blue-400" /> : <VolumeX className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-500 mb-2 font-display">
            5-Step Active Study Simulator
          </h1>
          <p className="text-slate-400 text-sm md:text-base max-w-2xl mx-auto">
            Optimized time blocks with heavy emphasis on Pretesting.
          </p>
        </header>

        {/* Live Active Session HUD (if running) */}
        {isSessionActive && (
          <div className="mb-8 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/40 rounded-2xl p-6 shadow-xl animate-fadeIn">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-xl ${stepsData[activeStepIndex].badgeBg}`}>
                  {React.createElement(stepsData[activeStepIndex].icon, { className: 'w-6 h-6' })}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs uppercase font-semibold text-slate-400">
                      Step {activeStepIndex + 1} of 5
                    </span>
                    <span className="text-xs text-indigo-400 font-mono">
                      · {stepsData[activeStepIndex].fullName}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-white">
                    {stepsData[activeStepIndex].name}: {formatTimerDigits(stepSecondsRemaining)}
                  </h3>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePauseResume}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                >
                  {isTimerPaused ? <Play className="w-4 h-4 fill-current" /> : <Pause className="w-4 h-4" />}
                  <span>{isTimerPaused ? 'Resume' : 'Pause'}</span>
                </button>
                <button
                  onClick={handleSkipToNextStep}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-medium flex items-center gap-1 transition-all cursor-pointer"
                  title="Next step"
                >
                  <SkipForward className="w-4 h-4" />
                  <span>Next</span>
                </button>
                <button
                  onClick={handleExitSession}
                  className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all cursor-pointer"
                  title="Exit session"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Current step focus prompt */}
            <div className="pt-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-sm text-slate-300">
              <p className="leading-relaxed">
                <strong className="text-white font-medium">Current Focus: </strong>
                {stepsData[activeStepIndex].tagline}
              </p>
              <button
                onClick={stepsData[activeStepIndex].actionHandler}
                className="shrink-0 px-3 py-1.5 bg-slate-800 hover:bg-indigo-600 text-indigo-300 hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border border-indigo-500/30"
              >
                <span>{stepsData[activeStepIndex].actionLabel}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Completion Notification */}
        {sessionCompleted && (
          <div className="mb-8 bg-emerald-950/40 border border-emerald-500/40 rounded-2xl p-5 shadow-lg flex items-center justify-between gap-4 animate-fadeIn">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-base font-bold text-emerald-200">
                  5-Step Session Finished! (+{totalSessionMinutesLogged * 10} XP)
                </h4>
                <p className="text-xs text-emerald-400/90">
                  {totalSessionMinutesLogged} minutes logged toward your daily mastery goal. Neural gap consolidation complete.
                </p>
              </div>
            </div>
            <button
              onClick={() => setSessionCompleted(false)}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Active Study Plan Synchronized Banner */}
        {currentPlan && (
          <div className="mb-6 bg-gradient-to-r from-indigo-950/70 via-purple-950/50 to-slate-900 border border-indigo-500/40 rounded-2xl p-4 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                <Sparkles className="w-5 h-5 text-indigo-300" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-300 bg-indigo-500/20 px-2 py-0.5 rounded border border-indigo-500/30">
                    Active Study Plan Synchronized
                  </span>
                  <span className="text-xs text-slate-300 font-medium">
                    {currentPlan.profile.subject}
                  </span>
                </div>
                <p className="text-sm text-slate-200 mt-1">
                  Questions in <strong className="text-purple-300">Step 2 (Pretest)</strong> and <strong className="text-emerald-300">Step 5 (Deliberate Practice)</strong> are automatically generated from your active <span className="text-white font-semibold">{currentPlan.profile.subject}</span> syllabus.
                </p>
              </div>
            </div>
            {currentPlan.milestones?.[0] && (
              <div className="shrink-0 text-left sm:text-right text-xs bg-slate-900/80 px-3.5 py-2 rounded-xl border border-indigo-500/30 shadow-inner">
                <span className="text-slate-400 block text-[10px] uppercase font-mono tracking-wider">Milestone Target</span>
                <span className="font-semibold text-white">{currentPlan.milestones[0].focus}</span>
                <span className="block text-[11px] text-emerald-400 font-mono mt-0.5">{currentPlan.milestones[0].phase} · Days {currentPlan.milestones[0].dayRange}</span>
              </div>
            )}
          </div>
        )}

        {/* Controls Section: Time Slider & Subject Dropdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
          {/* Time Slider */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label htmlFor="timeSlider" className="text-sm font-semibold text-slate-300 tracking-wide uppercase">
                Total Study Minutes
              </label>
              <span id="timeDisplay" className="text-2xl font-bold text-blue-400 font-mono">
                {totalMinutes} min
              </span>
            </div>
            <input
              type="range"
              id="timeSlider"
              min="30"
              max="180"
              value={totalMinutes}
              step="1"
              onChange={(e) => setTotalMinutes(parseInt(e.target.value, 10))}
              className="study-slider"
            />
            <div className="flex justify-between text-xs text-slate-500 font-mono">
              <span>30m</span>
              <span>180m</span>
            </div>
          </div>

          {/* Subject Dropdown */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label htmlFor="subjectSelect" className="block text-sm font-semibold text-slate-300 tracking-wide uppercase">
                Subject
              </label>
              {currentPlan?.profile?.subject && selectedSubject === currentPlan.profile.subject && (
                <span className="text-[11px] text-indigo-400 font-medium bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                  Plan Synced
                </span>
              )}
            </div>
            <div className="relative">
              <select
                id="subjectSelect"
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full appearance-none bg-slate-800 border border-slate-600 text-white py-3 px-4 pr-8 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all cursor-pointer font-medium"
              >
                {currentPlan?.profile?.subject && (
                  <option value={currentPlan.profile.subject}>
                    🎯 {currentPlan.profile.subject} (From Active Plan)
                  </option>
                )}
                <option value="Math">Math</option>
                <option value="World Languages">World Languages</option>
                <option value="English">English</option>
                <option value="Social Studies">Social Studies</option>
                <option value="Science">Science</option>
                <option value="Physics">Physics</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Lazy Studying Banner */}
        <div className="bg-blue-900/30 border border-blue-500/30 rounded-xl p-4 mb-10 flex items-start space-x-4 shadow-sm">
          <div className="bg-blue-500/20 p-2 rounded-lg text-blue-400 shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <h4 className="text-sm font-bold text-blue-300 uppercase tracking-wide mb-1 flex items-center gap-2">
              <span>Lazy Studying</span>
              <span className="text-[11px] font-normal text-blue-400/80 lowercase">({selectedSubject.toLowerCase()})</span>
            </h4>
            <p id="lazyStudyingText" className="text-slate-300 text-sm leading-relaxed">
              {LAZY_STUDYING_DESCRIPTIONS[selectedSubject] ||
                `Passively reviewing high-yield concept maps, past paper trap breakdowns, or formula cheat sheets for ${selectedSubject}.`}
            </p>
          </div>
        </div>

        {/* Visual Timeline */}
        <div className="mb-10">
          <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-2 mb-3">
            <h3 className="text-sm font-semibold text-slate-300 tracking-wide uppercase">
              Session Timeline Breakout
            </h3>
            <span className="text-xs text-slate-500 font-mono">
              *Step 1 is fixed at 1 min
            </span>
          </div>
          
          <div className="w-full h-8 flex rounded-lg overflow-hidden shadow-inner bg-slate-800">
            <div
              id="bar-step1"
              style={{ width: `${(m1 / totalMinutes) * 100}%` }}
              className="timeline-segment bg-blue-500 h-full flex items-center justify-center text-xs font-bold text-white shadow-sm"
              title={`Goal Setting: ${m1}m`}
            >
              1m
            </div>
            <div
              id="bar-step2"
              style={{ width: `${(m2 / totalMinutes) * 100}%` }}
              className="timeline-segment bg-purple-500 h-full flex items-center justify-center text-xs font-bold text-white shadow-sm"
              title={`Pretest: ${m2}m`}
            >
              {m2}m
            </div>
            <div
              id="bar-step3"
              style={{ width: `${(m3 / totalMinutes) * 100}%` }}
              className="timeline-segment bg-pink-500 h-full flex items-center justify-center text-xs font-bold text-white shadow-sm"
              title={`Fix Mistakes: ${m3}m`}
            >
              {m3}m
            </div>
            <div
              id="bar-step4"
              style={{ width: `${(m4 / totalMinutes) * 100}%` }}
              className="timeline-segment bg-amber-500 h-full flex items-center justify-center text-xs font-bold text-slate-900 shadow-sm"
              title={`Walk / Break: ${m4}m`}
            >
              {m4}m
            </div>
            <div
              id="bar-step5"
              style={{ width: `${(m5 / totalMinutes) * 100}%` }}
              className="timeline-segment bg-emerald-500 h-full flex items-center justify-center text-xs font-bold text-white shadow-sm"
              title={`Practice Problems: ${m5}m`}
            >
              {m5}m
            </div>
          </div>

          {/* Quick Segment Legend */}
          <div className="flex flex-wrap items-center justify-between gap-2 mt-2.5 text-[11px] text-slate-400 font-medium">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" /> Goal (1m)</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block" /> Pretest ({Math.round((m2 / totalMinutes) * 100)}%)</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-pink-500 inline-block" /> Fix Mistakes ({Math.round((m3 / totalMinutes) * 100)}%)</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" /> Walk / Break ({Math.round((m4 / totalMinutes) * 100)}%)</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Practice ({Math.round((m5 / totalMinutes) * 100)}%)</span>
          </div>
        </div>

        {/* Detailed Breakdown Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          
          {/* Step 1 */}
          <div className="bg-slate-800/50 rounded-xl p-4 border-t-4 border-blue-500 shadow-sm flex flex-col hover:bg-slate-800/80 transition-colors group">
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-bold text-slate-200 group-hover:text-blue-400 transition-colors">1. Goal</h4>
              <span className="text-xs font-mono bg-blue-500/20 text-blue-300 py-1 px-2 rounded">
                1m
              </span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              Define a specific objective. Don't write "study", write exactly what standard you will master.
            </p>
            <div className="mt-auto pt-2 border-t border-slate-700/50">
              <button
                onClick={() => setIsEditingGoal(prev => !prev)}
                className="w-full py-1.5 px-2 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 text-xs font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
              >
                <Target className="w-3.5 h-3.5" />
                <span>{isEditingGoal ? 'Close Standard' : 'Edit Objective'}</span>
              </button>
            </div>
          </div>

          {/* Step 2 */}
          <div className="bg-slate-800/50 rounded-xl p-4 border-t-4 border-purple-500 shadow-sm flex flex-col hover:bg-slate-800/80 transition-colors group">
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-bold text-slate-200 group-hover:text-purple-400 transition-colors">2. Pretest</h4>
              <span id="time-step2" className="text-xs font-mono bg-purple-500/20 text-purple-300 py-1 px-2 rounded">
                {m2}m
              </span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              Attempt hard questions cold. Create cognitive gaps so your brain absorbs info better later.
            </p>
            <div className="mt-auto pt-2 border-t border-slate-700/50">
              <button
                onClick={() => onNavigateToQuiz?.(currentPlan ? currentPlan.profile.subject : selectedSubject, 'pretest')}
                className="w-full py-1.5 px-2 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 text-xs font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>{currentPlan ? `Start Plan Pretest` : 'Start Cold Test'}</span>
              </button>
            </div>
          </div>

          {/* Step 3 */}
          <div className="bg-slate-800/50 rounded-xl p-4 border-t-4 border-pink-500 shadow-sm flex flex-col hover:bg-slate-800/80 transition-colors group">
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-bold text-slate-200 group-hover:text-pink-400 transition-colors">3. Fix Mistakes</h4>
              <span id="time-step3" className="text-xs font-mono bg-pink-500/20 text-pink-300 py-1 px-2 rounded">
                {m3}m
              </span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              Analyze logic errors. Locate the exact rule or text line that proves the right answer.
            </p>
            <div className="mt-auto pt-2 border-t border-slate-700/50">
              <button
                onClick={() => onNavigateToMistakes?.()}
                className="w-full py-1.5 px-2 rounded-lg bg-pink-500/10 hover:bg-pink-500/20 text-pink-300 text-xs font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
              >
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{unfixedMistakesCount > 0 ? `Fix ${unfixedMistakesCount} Traps` : 'Mistake Vault'}</span>
              </button>
            </div>
          </div>

          {/* Step 4 */}
          <div className="bg-slate-800/50 rounded-xl p-4 border-t-4 border-amber-500 shadow-sm flex flex-col hover:bg-slate-800/80 transition-colors group">
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-bold text-slate-200 group-hover:text-amber-400 transition-colors">4. Walk/Break</h4>
              <span id="time-step4" className="text-xs font-mono bg-amber-500/20 text-amber-300 py-1 px-2 rounded">
                {m4}m
              </span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              Step away from screens. Let your Default Mode Network process the errors in the background.
            </p>
            <div className="mt-auto pt-2 border-t border-slate-700/50">
              <button
                onClick={() => playDeepWorkGongSound()}
                className="w-full py-1.5 px-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
              >
                <Footprints className="w-3.5 h-3.5" />
                <span>Default Mode Gong</span>
              </button>
            </div>
          </div>

          {/* Step 5 */}
          <div className="bg-slate-800/50 rounded-xl p-4 border-t-4 border-emerald-500 shadow-sm flex flex-col hover:bg-slate-800/80 transition-colors group">
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-bold text-slate-200 group-hover:text-emerald-400 transition-colors">5. Practice</h4>
              <span id="time-step5" className="text-xs font-mono bg-emerald-500/20 text-emerald-300 py-1 px-2 rounded">
                {m5}m
              </span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              Apply your newly fixed knowledge on fresh problems until the pattern is cemented.
            </p>
            <div className="mt-auto pt-2 border-t border-slate-700/50">
              <button
                onClick={() => onNavigateToPractice
                  ? onNavigateToPractice(currentPlan ? currentPlan.profile.subject : selectedSubject)
                  : onNavigateToQuiz?.(currentPlan ? currentPlan.profile.subject : selectedSubject, 'practice')}
                className="w-full py-1.5 px-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-xs font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
              >
                <Dumbbell className="w-3.5 h-3.5" />
                <span>{currentPlan ? `Practice Plan Problems` : 'Cement Pattern'}</span>
              </button>
            </div>
          </div>

        </div>

        {/* Inline Goal Setter Drawer (when active) */}
        {isEditingGoal && (
          <div className="mb-8 p-4 rounded-xl bg-slate-900 border border-blue-500/30 animate-fadeIn">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-blue-300 uppercase tracking-wide">
                Target Standard Objective (Step 1)
              </label>
              <span className="text-[11px] text-slate-400">Be concrete and measurable</span>
            </div>
            <input
              type="text"
              value={customGoal}
              onChange={(e) => setCustomGoal(e.target.value)}
              placeholder="e.g. Master Squeeze Theorem & eliminate limit indeterminate traps"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
            />
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-400">Quick suggestions:</span>
              {SUBJECT_TOPIC_PRESETS[selectedSubject].slice(0, 3).map((preset) => (
                <button
                  key={preset}
                  onClick={() => setCustomGoal(`Master ${preset} standard with zero trap errors`)}
                  className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors cursor-pointer border border-slate-700"
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Action Toolbar */}
        <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span className="flex items-center gap-1.5 text-blue-300 font-semibold">
              <Clock className="w-4 h-4 text-blue-400" />
              Total: {totalMinutes}m Session
            </span>
            <span aria-hidden="true">·</span>
            <span>Pretest Weight: 35%</span>
            <span aria-hidden="true">·</span>
            <span>Subject: {selectedSubject}</span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {onNavigateToRoadmap && (
              <button
                onClick={onNavigateToRoadmap}
                className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl border border-slate-700 hover:border-slate-600 bg-slate-800/80 hover:bg-slate-800 text-slate-300 text-sm font-semibold transition-all cursor-pointer"
              >
                Roadmap Milestones
              </button>
            )}

            <button
              onClick={handleStartLiveSession}
              disabled={isSessionActive}
              className="flex-1 sm:flex-initial px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:via-indigo-500 hover:to-purple-500 text-white text-sm font-bold shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>{isSessionActive ? 'Session in Progress' : 'Launch 5-Step Session'}</span>
            </button>
          </div>
        </div>

      </main>
    </div>
  );
};
