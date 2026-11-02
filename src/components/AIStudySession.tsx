import React, { useState, useEffect, useRef } from 'react';
import {
  Clock,
  Play,
  Pause,
  RotateCcw,
  Coffee,
  CheckCircle2,
  Sparkles,
  Flame,
  Award,
  Layers,
  HelpCircle,
  MessageSquare,
  Send,
  BookOpen,
  Volume2,
  Mic,
  MicOff,
  ChevronRight,
  ArrowRight,
  Shield,
  Smile,
  Zap,
  Brain,
  Headphones,
  Check,
  Eye,
  EyeOff,
  Bot,
  Timer,
  X
} from 'lucide-react';
import { ExamProfile, StudySessionData, QuizQuestion, StudyPhase, UserStudyState } from '../types';
import {
  playCorrectSound,
  playIncorrectSound,
  playStreakFlameSound,
  playTimerTickSound,
  playVivaGavelSound,
  speakExaminerVoice,
  stopSpeaking
} from '../utils/audio';
import { ActiveStudyScheduler } from './ActiveStudyScheduler';
import { AntiMotivationProtocolCard } from './AntiMotivationProtocolCard';
import { NeurologicalSoundscapePlayer } from './NeurologicalSoundscapePlayer';
import { AILoadingBar } from './AILoadingBar';
import { generateSchedule, PHASE_CONFIG } from '../utils/schedule';
import { getQuestionIntroSideTalk, getAnswerReaction } from '../utils/aiPersonality';
import { TypewriterText } from './TypewriterText';
import { DeepWorkPomodoroTimer } from './DeepWorkPomodoroTimer';
import { getDetailedAnswerExplanation } from '../utils/answerExplanation';
import { WrongAnswerBreakdownCard } from './WrongAnswerBreakdownCard';

interface AIStudySessionProps {
  examProfile?: ExamProfile | null;
  studyState?: UserStudyState;
  onUpdateStudyState?: (newState: UserStudyState) => void;
  onFinishSession: (minutesStudied: number, xpEarned: number, topic: string) => void;
  onExit: () => void;
}

export const AIStudySession: React.FC<AIStudySessionProps> = ({
  examProfile,
  studyState,
  onUpdateStudyState,
  onFinishSession,
  onExit,
}) => {
  const isEnglishOrHumanities = /english|literature|reading|writing|language|grammar|rhetoric|history/i.test(examProfile?.subject || '');
  const initialCategory: 'Math/Science' | 'Reading/Writing' | 'General' = isEnglishOrHumanities
    ? 'Reading/Writing'
    : /math|calculus|algebra|geometry|physics|chemistry|biology/i.test(examProfile?.subject || '')
    ? 'Math/Science'
    : 'General';

  // Session Configuration
  const [selectedHours, setSelectedHours] = useState<number>(1);
  const [selectedSubjectCategory, setSelectedSubjectCategory] = useState<'Math/Science' | 'Reading/Writing' | 'General'>(initialCategory);
  const [isDeepWork, setIsDeepWork] = useState<boolean>(true);
  const [isConfiguring, setIsConfiguring] = useState<boolean>(true);
  const [sessionViewMode, setSessionViewMode] = useState<'pomodoro' | 'phased'>('pomodoro');
  const [showPomodoroModal, setShowPomodoroModal] = useState<boolean>(false);

  // Sync subject category when examProfile changes
  useEffect(() => {
    if (examProfile?.subject) {
      if (/english|literature|reading|writing|language|grammar|rhetoric|history/i.test(examProfile.subject)) {
        setSelectedSubjectCategory('Reading/Writing');
      } else if (/math|calculus|algebra|geometry|physics|chemistry|biology/i.test(examProfile.subject)) {
        setSelectedSubjectCategory('Math/Science');
      } else {
        setSelectedSubjectCategory('General');
      }
    }
  }, [examProfile?.subject]);

  // Active Session State
  const [sessionData, setSessionData] = useState<StudySessionData | null>(null);
  const [isLoadingSession, setIsLoadingSession] = useState<boolean>(false);
  const [activeStep, setActiveStep] = useState<
    'pretest' | 'core-sprint' | 'blurting' | 'flashcards' | 'application' | 'teach-back' | 'anti-motivation'
  >('pretest');

  // Timer State
  const [totalSeconds, setTotalSeconds] = useState<number>(50 * 60);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(50 * 60);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isBreakTime, setIsBreakTime] = useState<boolean>(false);
  const [breakSecondsRemaining, setBreakSecondsRemaining] = useState<number>(10 * 60);
  const [secondsStudied, setSecondsStudied] = useState<number>(0);

  // Phase 1: Pretest State
  const [pretestSelectedOpt, setPretestSelectedOpt] = useState<number | null>(null);
  const [pretestAnswered, setPretestAnswered] = useState<boolean>(false);

  // Phase 3: Blurting (Active Recall Brain Dump) State
  const [blurtingText, setBlurtingText] = useState<string>('');
  const [blurtingTimeLeft, setBlurtingTimeLeft] = useState<number>(180); // 3 minutes
  const [blurtingTimerActive, setBlurtingTimerActive] = useState<boolean>(false);
  const [blurtingRevealed, setBlurtingRevealed] = useState<boolean>(false);
  const [checkedKeyPoints, setCheckedKeyPoints] = useState<number[]>([]);

  // Phase 4: Flashcards State
  const [currentCardIdx, setCurrentCardIdx] = useState<number>(0);
  const [isCardFlipped, setIsCardFlipped] = useState<boolean>(false);
  const [masteredCardIndices, setMasteredCardIndices] = useState<number[]>([]);

  // Phase 5: Application Questions State
  const [currentQIdx, setCurrentQIdx] = useState<number>(0);
  const [selectedOpt, setSelectedOpt] = useState<number | null>(null);
  const [answeredQs, setAnsweredQs] = useState<Record<number, { choice: number; isCorrect: boolean }>>({});

  // Phase 6: Teach-Back State
  const [teachBackAnswerText, setTeachBackAnswerText] = useState<string>('');
  const [isListening, setIsListening] = useState<boolean>(false);
  const [teachBackSubmitted, setTeachBackSubmitted] = useState<boolean>(false);
  const recognitionRef = useRef<any>(null);

  // In-Session AI Coach Chat Drawer
  const [showCoach, setShowCoach] = useState<boolean>(false);
  const [coachQuestion, setCoachQuestion] = useState<string>('');
  const [coachMessages, setCoachMessages] = useState<{ sender: 'user' | 'coach'; text: string }[]>([]);
  const [isAskingCoach, setIsAskingCoach] = useState<boolean>(false);

  // Completion State
  const [isCompleted, setIsCompleted] = useState<boolean>(false);

  const subject = examProfile?.subject || 'English & Humanities';
  const topics = (examProfile?.topics && examProfile.topics.length > 0)
    ? examProfile.topics
    : ['Rhetorical Analysis & Textual Inferences'];
  const gradeLevel = examProfile?.gradeLevel || 'Middle / High School';

  // Initialize Speech Recognition if supported
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recog = new SpeechRecognition();
        recog.continuous = true;
        recog.interimResults = true;
        recog.lang = 'en-US';

        recog.onresult = (event: any) => {
          let transcript = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript;
          }
          setTeachBackAnswerText(prev => `${prev} ${transcript}`.trim());
        };

        recog.onerror = () => setIsListening(false);
        recog.onend = () => setIsListening(false);
        recognitionRef.current = recog;
      }
    }
    return () => {
      stopSpeaking();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {}
      }
    };
  }, []);

  // Main Study Timer Interval
  useEffect(() => {
    let timer: any = null;
    if (isRunning && !isBreakTime && secondsRemaining > 0) {
      const breakIntervalMins = isDeepWork ? 50 : 25;
      timer = setInterval(() => {
        setSecondsRemaining(prev => {
          if (prev <= 1) {
            handleSessionComplete();
            return 0;
          }

          // Check if break interval reached (e.g. at every 50 or 25 min)
          const elapsed = totalSeconds - (prev - 1);
          if (elapsed > 0 && elapsed % (breakIntervalMins * 60) === 0 && prev > 60) {
            triggerBreak();
          }

          if (prev <= 5 && prev > 0) {
            playTimerTickSound();
          }

          return prev - 1;
        });
        setSecondsStudied(s => s + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isRunning, isBreakTime, secondsRemaining, totalSeconds, isDeepWork]);

  // Break Timer Interval
  useEffect(() => {
    let breakTimer: any = null;
    if (isRunning && isBreakTime && breakSecondsRemaining > 0) {
      breakTimer = setInterval(() => {
        setBreakSecondsRemaining(prev => {
          if (prev <= 1) {
            endBreak();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(breakTimer);
  }, [isRunning, isBreakTime, breakSecondsRemaining]);

  // Blurting Countdown Timer Interval
  useEffect(() => {
    let bTimer: any = null;
    if (blurtingTimerActive && blurtingTimeLeft > 0) {
      bTimer = setInterval(() => {
        setBlurtingTimeLeft(t => {
          if (t <= 1) {
            setBlurtingTimerActive(false);
            playVivaGavelSound();
            return 0;
          }
          if (t <= 5) playTimerTickSound();
          return t - 1;
        });
      }, 1000);
    }
    return () => clearInterval(bTimer);
  }, [blurtingTimerActive, blurtingTimeLeft]);

  const triggerBreak = () => {
    setIsBreakTime(true);
    setBreakSecondsRemaining((isDeepWork ? 10 : 5) * 60);
    playStreakFlameSound();
    speakExaminerVoice("Time for a scheduled brain break. Stand up, stretch your neck and shoulders, and drink cold water.");
  };

  const endBreak = () => {
    setIsBreakTime(false);
    playVivaGavelSound();
    speakExaminerVoice("Break time is over. Re-engage your focus now!");
  };

  const handleStartSession = async (
    customHours: number = selectedHours,
    customSubject: string = selectedSubjectCategory,
    customDeepWork: boolean = isDeepWork,
    targetPhase?: StudyPhase
  ) => {
    setIsLoadingSession(true);
    setIsConfiguring(false);

    const durationMins = Math.round(customHours * 60);
    const workCycle = customDeepWork ? 50 : 25;
    const initialSeconds = Math.min(durationMins, workCycle) * 60;

    setTotalSeconds(initialSeconds);
    setSecondsRemaining(initialSeconds);
    setSelectedHours(customHours);
    setIsDeepWork(customDeepWork);

    try {
      const res = await fetch('/api/study-session/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject,
          topics,
          gradeLevel,
          durationMinutes: durationMins,
          subjectCategory: customSubject,
          deepWorkMode: customDeepWork,
          questionTypes: examProfile?.questionTypes,
        }),
      });

      const data: StudySessionData = await res.json();
      setSessionData(data);
      setIsRunning(true);
      playStreakFlameSound();

      if (targetPhase === 'Core Sprint') setActiveStep('core-sprint');
      else if (targetPhase === 'Blurting') setActiveStep('blurting');
      else if (targetPhase === 'Application') setActiveStep('application');
      else if (targetPhase === 'Teach-Back') setActiveStep('teach-back');
      else if (targetPhase === 'Break') triggerBreak();
      else setActiveStep('pretest');
    } catch (err) {
      console.error(err);
      alert('Could not start study session. Please check your connection.');
      setIsConfiguring(true);
    } finally {
      setIsLoadingSession(false);
    }
  };

  const handleSessionComplete = () => {
    setIsRunning(false);
    setIsCompleted(true);
    playStreakFlameSound();

    const minutes = Math.max(1, Math.round(secondsStudied / 60));
    const xp = minutes * 4 + masteredCardIndices.length * 5 + Object.values(answeredQs).filter(a => a.isCorrect).length * 10 + (teachBackSubmitted ? 25 : 0);
    onFinishSession(minutes, xp, sessionData?.topic || subject);
  };

  const toggleMic = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not available in this browser. Please type your answer.');
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const handleAskCoach = async (presetText?: string) => {
    const query = presetText || coachQuestion.trim();
    if (!query || isAskingCoach) return;

    setCoachMessages(prev => [...prev, { sender: 'user', text: query }]);
    setCoachQuestion('');
    setIsAskingCoach(true);

    try {
      const res = await fetch('/api/study-session/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: query,
          currentTopic: sessionData?.topic || topics[0],
          subject,
          gradeLevel,
        }),
      });
      const data = await res.json();
      setCoachMessages(prev => [...prev, { sender: 'coach', text: data.answer }]);
    } catch (e) {
      setCoachMessages(prev => [...prev, { sender: 'coach', text: 'Remember the core rule: name the rate-limiting step, trace what activates it, and explain what shuts it off.' }]);
    } finally {
      setIsAskingCoach(false);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // 0. GENERATING CONTENT LOADING BAR ANIMATION
  if (isLoadingSession) {
    return (
      <AILoadingBar
        title="Generating Flashcards & Practice Questions"
        subtitle="The Angry Explainer is deconstructing rate-limiting mechanisms, generating targeted flashcards, and formulating exam questions..."
        itemType="session"
        topic={sessionData?.topic || topics[0] || subject}
        onCancel={() => {
          setIsLoadingSession(false);
          setIsConfiguring(true);
        }}
      />
    );
  }

  // 1. CONFIGURATION VIEW (Pomodoro Deep Work & Phased Curriculum Sprints)
  if (isConfiguring) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8 animate-fadeIn">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold uppercase tracking-wider">
            <Flame className="w-3.5 h-3.5 fill-amber-500/30" /> High-Intensity Focus Laboratory
          </div>
          <h1 className="text-3xl md:text-4xl font-bold font-display text-white tracking-tight">
            AI Focus & Phased Study Session
          </h1>
          <p className="text-slate-400 text-sm max-w-xl mx-auto">
            Choose between an uninterrupted Pomodoro Deep Work sprint to build streak momentum, or launch a guided multi-phase AI curriculum sprint.
          </p>
        </div>

        {/* Segmented Mode Selector Bar */}
        <div className="flex items-center justify-center">
          <div className="bg-slate-950 border border-slate-800 p-1.5 rounded-2xl flex items-center gap-2 max-w-md w-full shadow-lg">
            <button
              type="button"
              onClick={() => setSessionViewMode('pomodoro')}
              className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                sessionViewMode === 'pomodoro'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Flame className="w-4 h-4 fill-current" />
              <span>Pomodoro Deep Work</span>
            </button>

            <button
              type="button"
              onClick={() => setSessionViewMode('phased')}
              className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                sessionViewMode === 'phased'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>Phased AI Sprints</span>
            </button>
          </div>
        </div>

        {/* View Mode 1: Full Pomodoro Deep Work Timer */}
        {sessionViewMode === 'pomodoro' ? (
          <div className="space-y-8 animate-fadeIn">
            <DeepWorkPomodoroTimer
              topic={topics[0] || subject}
              subject={subject}
              studyState={studyState}
              onUpdateStudyState={onUpdateStudyState}
              onCycleComplete={(mins, xp) => {
                onFinishSession(mins, xp, topics[0] || subject);
              }}
            />

            {/* Quick Link Card to Phased AI Curriculum */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Prefer Step-by-Step AI Curriculum Drills?</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1 max-w-xl">
                  Let your AI coach guide you through diagnostic pretesting, core sprinting, active recall blurting, and teach-back questions.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSessionViewMode('phased')}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer"
              >
                Switch to Phased Sprints →
              </button>
            </div>

            {/* Part 1: Anti-Motivation Protocol Toolbox */}
            <AntiMotivationProtocolCard
              topic={topics[0] || subject}
              onFiveMinuteSuccess={() => setSessionViewMode('pomodoro')}
            />

            {/* Part 2: Neurological Soundscape Engine */}
            <NeurologicalSoundscapePlayer />
          </div>
        ) : (
          <div className="space-y-8 animate-fadeIn">
            {/* Interactive Active Study Planner */}
            <ActiveStudyScheduler
              defaultHours={selectedHours}
              defaultSubject={selectedSubjectCategory}
              defaultDeepWork={isDeepWork}
              onStartSession={(h, subj, dw, phase) => {
                setSelectedHours(h);
                setSelectedSubjectCategory(subj as any);
                setIsDeepWork(dw);
                handleStartSession(h, subj, dw, phase);
              }}
              onRecordXp={(amt) => {
                onFinishSession(1, amt, subject);
              }}
            />

            {/* Part 1: Anti-Motivation Protocol Toolbox */}
            <AntiMotivationProtocolCard
              topic={topics[0] || subject}
              onFiveMinuteSuccess={() => handleStartSession(1, selectedSubjectCategory, isDeepWork)}
            />

            {/* Part 2: Neurological Soundscape Engine */}
            <NeurologicalSoundscapePlayer />
          </div>
        )}

        <div className="flex justify-between items-center pt-2">
          <button
            onClick={onExit}
            className="text-xs text-slate-400 hover:text-slate-200 cursor-pointer"
          >
            ← Back to Overview
          </button>
        </div>
      </div>
    );
  }

  // 2. BREAK TIME OVERLAY
  if (isBreakTime) {
    const totalBreakSecs = (isDeepWork ? 10 : 5) * 60;
    const breakElapsedSecs = Math.max(0, totalBreakSecs - breakSecondsRemaining);
    const breakRatio = totalBreakSecs > 0 ? Math.min(1, Math.max(0, breakElapsedSecs / totalBreakSecs)) : 0;
    const breakRadius = 88;
    const breakCircumference = 2 * Math.PI * breakRadius;
    const breakOffset = breakCircumference * (1 - breakRatio);
    const breakAngle = breakRatio * 2 * Math.PI - Math.PI / 2;
    const breakHeadX = 110 + breakRadius * Math.cos(breakAngle);
    const breakHeadY = 110 + breakRadius * Math.sin(breakAngle);

    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center space-y-6 animate-fadeIn">
        {/* Circular SVG Progress Indicator around the Break Timer */}
        <div className="relative w-64 h-64 mx-auto flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 220 220">
            <defs>
              <linearGradient id="breakSvgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#a5f3fc" />
                <stop offset="50%" stopColor="#06b6d4" />
                <stop offset="100%" stopColor="#0284c7" />
              </linearGradient>
              <filter id="breakGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Background Track Circle */}
            <circle
              cx="110"
              cy="110"
              r={breakRadius}
              className="stroke-slate-900"
              strokeWidth="10"
              fill="transparent"
            />
            {/* Subtle inner dashed reference ring */}
            <circle
              cx="110"
              cy="110"
              r="76"
              stroke="#1e293b"
              strokeWidth="1"
              strokeDasharray="3 6"
              fill="transparent"
            />

            {/* Animated Progress Arc */}
            <circle
              cx="110"
              cy="110"
              r={breakRadius}
              stroke="url(#breakSvgGrad)"
              strokeWidth="10"
              strokeDasharray={breakCircumference}
              strokeDashoffset={breakOffset}
              strokeLinecap="round"
              className="transition-all duration-500 ease-linear"
              fill="transparent"
            />

            {/* Glowing Head Marker */}
            {breakRatio > 0.005 && (
              <>
                <circle
                  cx={breakHeadX}
                  cy={breakHeadY}
                  r="7"
                  fill="#06b6d4"
                  filter="url(#breakGlow)"
                  className="transition-all duration-500"
                />
                <circle
                  cx={breakHeadX}
                  cy={breakHeadY}
                  r="4"
                  fill="#ffffff"
                  className="transition-all duration-500"
                />
              </>
            )}
          </svg>

          {/* Centered Content Inside the Circular Gauge */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
            <div className="w-11 h-11 rounded-full bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300 mb-1.5 shadow-lg animate-pulse">
              <Coffee className="w-5 h-5" />
            </div>
            <span className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider">
              Brain Recovery Interval
            </span>
            <h1 className="text-3xl md:text-4xl font-bold font-display text-white font-mono-numbers mt-0.5">
              {formatTime(breakSecondsRemaining)}
            </h1>
            <span className="text-xs text-cyan-300 font-mono-numbers mt-1">
              {formatTime(breakElapsedSecs)} elapsed ({Math.round(breakRatio * 100)}%)
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
            Stand up, stretch your neck and shoulders, and drink cold water. Rest your eyes on something 20 feet away to relax the ciliary eye muscles and consolidate memory.
          </p>
        </div>

        <div className="pt-2 flex items-center justify-center gap-4">
          <button
            onClick={endBreak}
            className="px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-xl transition-colors cursor-pointer shadow-lg"
          >
            End Break & Resume Focus →
          </button>
        </div>
      </div>
    );
  }

  // 3. COMPLETED SESSION VIEW
  if (isCompleted) {
    const minutes = Math.max(1, Math.round(secondsStudied / 60));
    const xp = minutes * 4 + masteredCardIndices.length * 5 + Object.values(answeredQs).filter(a => a.isCorrect).length * 10 + (teachBackSubmitted ? 25 : 0);

    return (
      <div className="max-w-xl mx-auto px-4 py-12 animate-fadeIn">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-6 shadow-2xl">
          <div className="w-20 h-20 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto">
            <Award className="w-10 h-10 animate-bounce" />
          </div>

          <div>
            <span className="text-xs uppercase font-semibold text-amber-400">Study Protocol Executed</span>
            <h1 className="text-3xl font-bold font-display text-white mt-1">
              Outstanding Focus Session!
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              You completed your active recall session on <strong className="text-slate-200">{sessionData?.topic}</strong>.
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800 text-center">
            <div>
              <div className="text-[10px] text-slate-500 uppercase">Focus Time</div>
              <div className="text-lg font-bold text-slate-100 font-mono-numbers">{minutes} min</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-500 uppercase">Cards Mastered</div>
              <div className="text-lg font-bold text-amber-400 font-mono-numbers">
                {masteredCardIndices.length} / {sessionData?.flashcards.length || 0}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-slate-500 uppercase">Total XP</div>
              <div className="text-lg font-bold text-emerald-400 font-mono-numbers">+{xp} XP</div>
            </div>
          </div>

          <button
            onClick={onExit}
            className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition-colors cursor-pointer shadow-md"
          >
            Return to Study Dashboard
          </button>
        </div>
      </div>
    );
  }

  // 4. ACTIVE STUDY SESSION INTERFACE
  const progressPercent = Math.min(100, Math.round(((totalSeconds - secondsRemaining) / totalSeconds) * 100));

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      {/* Session Top Bar: Topic, Timer, Compact Soundscape Engine, and Coach Toggle */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 md:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-xs text-amber-400 font-semibold uppercase tracking-wider">
            <span>AI Study Session</span>
            <span aria-hidden="true">·</span>
            <span className="text-slate-300">{subject}</span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold font-display text-white">
            {sessionData?.topic}
          </h2>
        </div>

        {/* Live Timer & Compact Neurological Soundscape Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Pomodoro Deep Work Focus Pill */}
          <DeepWorkPomodoroTimer
            compact
            topic={sessionData?.topic || topics[0] || subject}
            subject={subject}
            studyState={studyState}
            onUpdateStudyState={onUpdateStudyState}
            onOpenFullTimer={() => setShowPomodoroModal(true)}
          />

          {/* Neurological Soundscape Selector */}
          <NeurologicalSoundscapePlayer compact />

          {/* Live Timer Pill with Circular SVG Progress Indicator */}
          <div className="flex items-center gap-3 bg-slate-950 border border-slate-800 px-3.5 py-1.5 rounded-xl shadow-md">
            {/* Circular SVG Progress Ring around the Clock */}
            <div
              className="relative w-8 h-8 flex items-center justify-center shrink-0"
              title={`${progressPercent}% elapsed (${formatTime(totalSeconds - secondsRemaining)} of ${formatTime(totalSeconds)})`}
            >
              <svg className="w-8 h-8 transform -rotate-90" viewBox="0 0 36 36">
                <circle
                  cx="18"
                  cy="18"
                  r="14"
                  className="stroke-slate-800"
                  strokeWidth="3"
                  fill="transparent"
                />
                <circle
                  cx="18"
                  cy="18"
                  r="14"
                  stroke="#f59e0b"
                  strokeWidth="3"
                  strokeDasharray={2 * Math.PI * 14}
                  strokeDashoffset={2 * Math.PI * 14 * (1 - progressPercent / 100)}
                  strokeLinecap="round"
                  fill="transparent"
                  className="transition-all duration-500 ease-linear"
                />
              </svg>
              <Clock className="w-3.5 h-3.5 text-amber-400 absolute pointer-events-none" />
            </div>

            <div className="flex flex-col">
              <span className="text-lg font-bold font-mono-numbers text-white tracking-tight leading-none">
                {formatTime(secondsRemaining)}
              </span>
              <span className="text-[10px] text-slate-400 font-mono-numbers leading-none mt-1">
                {progressPercent}% elapsed
              </span>
            </div>

            <div className="flex items-center gap-1 pl-2 border-l border-slate-800">
              <button
                onClick={() => setIsRunning(!isRunning)}
                className="p-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 transition-colors cursor-pointer"
                title={isRunning ? 'Pause Timer' : 'Resume Timer'}
              >
                {isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              </button>

              <button
                onClick={handleSessionComplete}
                className="px-2 py-0.5 text-[11px] font-semibold text-rose-400 hover:text-rose-300 hover:bg-slate-900 rounded cursor-pointer"
              >
                Finish
              </button>
            </div>
          </div>

          {/* Coach Toggle */}
          <button
            onClick={() => setShowCoach(!showCoach)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              showCoach
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'bg-slate-950 text-slate-300 hover:text-white border border-slate-800'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Coach</span>
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden border border-slate-800/80">
        <div
          className="bg-gradient-to-r from-cyan-500 via-amber-500 to-rose-500 h-full rounded-full transition-all duration-1000"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Phase Navigation Tabs (Pretest, Core Sprint, Blurting, Flashcards, Application, Teach-Back, Anti-Motivation) */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-900 rounded-xl border border-slate-800 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveStep('pretest')}
          className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeStep === 'pretest'
              ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <span>1. Pretest (10%)</span>
        </button>

        <button
          onClick={() => setActiveStep('core-sprint')}
          className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeStep === 'core-sprint'
              ? 'bg-indigo-500 text-white font-bold shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <span>2. Core Sprint</span>
        </button>

        <button
          onClick={() => setActiveStep('blurting')}
          className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeStep === 'blurting'
              ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <span>3. Blurting (Recall)</span>
        </button>

        <button
          onClick={() => setActiveStep('flashcards')}
          className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeStep === 'flashcards'
              ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <span>4. Flashcards</span>
          <span className="text-[10px] font-mono-numbers px-1.5 rounded bg-slate-950/60 text-slate-200">
            {sessionData?.flashcards.length || 0}
          </span>
        </button>

        <button
          onClick={() => setActiveStep('application')}
          className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeStep === 'application'
              ? 'bg-rose-500 text-white font-bold shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <span>5. Application</span>
          <span className="text-[10px] font-mono-numbers px-1.5 rounded bg-slate-950/60 text-slate-200">
            {sessionData?.practiceQuestions.length || 0}
          </span>
        </button>

        <button
          onClick={() => setActiveStep('teach-back')}
          className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeStep === 'teach-back'
              ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <span>6. Teach-Back</span>
        </button>

        <button
          onClick={() => setActiveStep('anti-motivation')}
          className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeStep === 'anti-motivation'
              ? 'bg-rose-600 text-white font-bold shadow-sm'
              : 'text-rose-400 hover:text-rose-300'
          }`}
        >
          <Flame className="w-3 h-3 text-rose-500" />
          <span>Anti-Motivation</span>
        </button>
      </div>

      {/* Main Content Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className={showCoach ? 'lg:col-span-8' : 'lg:col-span-12'}>
          {/* PHASE 1: PRETEST */}
          {activeStep === 'pretest' && sessionData?.pretestQuestion && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 space-y-6 shadow-xl animate-fadeIn">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                  Phase 1: Pretest Diagnostic
                </span>
                <span className="text-xs text-slate-400">10% Time Allocation</span>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg md:text-xl font-bold font-display text-white">
                  Test Your Baseline: Guess Before You Read
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Attempt this question before studying the notes. Pretesting drops activation energy and trains your brain to notice the core mechanism during your Core Sprint.
                </p>
              </div>

              {/* Pretest Question Box */}
              <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
                {sessionData.pretestQuestion.passage && (
                  <div className="p-4 rounded-xl bg-slate-900/90 border border-cyan-500/30 space-y-2 text-left">
                    <div className="flex items-center gap-2 text-cyan-300 text-xs font-bold uppercase tracking-wider">
                      <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{sessionData.pretestQuestion.passageTitle || 'Reading Passage & Experimental Case Study'}</span>
                    </div>
                    <div className="text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-line font-serif">
                      {sessionData.pretestQuestion.passage}
                    </div>
                  </div>
                )}

                <div className="text-sm md:text-base font-semibold text-slate-100">
                  {sessionData.pretestQuestion.question}
                </div>

                <div className="space-y-2.5">
                  {sessionData.pretestQuestion.options.map((opt, idx) => {
                    const isSelected = pretestSelectedOpt === idx;
                    const isCorrect = idx === sessionData.pretestQuestion?.correctIndex;

                    let btnStyle = 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700';
                    if (pretestAnswered) {
                      if (isCorrect) btnStyle = 'bg-emerald-950/40 border-emerald-500/60 text-emerald-200';
                      else if (isSelected) btnStyle = 'bg-rose-950/40 border-rose-500/60 text-rose-200';
                      else btnStyle = 'bg-slate-950 border-slate-900 text-slate-500 opacity-60';
                    }

                    return (
                      <button
                        key={idx}
                        disabled={pretestAnswered}
                        onClick={() => {
                          setPretestSelectedOpt(idx);
                          setPretestAnswered(true);
                          if (isCorrect) playCorrectSound();
                          else playIncorrectSound();
                        }}
                        className={`w-full text-left p-3.5 rounded-xl border text-xs md:text-sm font-sans flex items-start gap-3 transition-all cursor-pointer ${btnStyle}`}
                      >
                        <span className="font-mono-numbers font-bold text-xs uppercase px-2 py-0.5 rounded bg-slate-950 border border-slate-800 shrink-0">
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <span className="leading-relaxed">{opt}</span>
                      </button>
                    );
                  })}
                </div>

                {pretestAnswered && pretestSelectedOpt !== null && (
                  <WrongAnswerBreakdownCard
                    explanation={getDetailedAnswerExplanation(
                      sessionData.pretestQuestion,
                      pretestSelectedOpt,
                      subject
                    )}
                  />
                )}
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setActiveStep('core-sprint')}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl flex items-center gap-2 cursor-pointer shadow-md"
                >
                  <span>Proceed to Phase 2: Core Sprint</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* PHASE 2: CORE SPRINT */}
          {activeStep === 'core-sprint' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 space-y-6 shadow-xl animate-fadeIn">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                  Phase 2: Core Sprint
                </span>
                <span className="text-xs text-slate-400">Deep Work Causal Analysis</span>
              </div>

              <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/30 text-amber-300 text-xs italic font-serif leading-relaxed">
                "{sessionData?.motivationalAdvice}"
              </div>

              <div className="space-y-4">
                <h3 className="text-xl md:text-2xl font-bold font-display text-white">
                  How {sessionData?.topic} Works (Step-by-Step)
                </h3>
                <div className="text-sm md:text-base text-slate-200 leading-relaxed space-y-3 font-sans">
                  {sessionData?.briefExplanation.split('\n\n').map((para, i) => (
                    <p key={i}>{para}</p>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                <span className="text-xs text-slate-500">Read carefully, then test recall with Blurting</span>
                <button
                  onClick={() => setActiveStep('blurting')}
                  className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 shadow-md"
                >
                  <span>Proceed to Phase 3: Blurting (Brain Dump)</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* PHASE 3: BLURTING (ACTIVE RECALL BRAIN DUMP) */}
          {activeStep === 'blurting' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 space-y-6 shadow-xl animate-fadeIn">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  Phase 3: Blurting (Active Brain Dump)
                </span>
                <span className="text-xs text-slate-400">3-Minute Memory Recall Drill</span>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg md:text-xl font-bold font-display text-white">
                  Close All Notes: The Blurting Drill
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {sessionData?.blurtingPrompt || `Close your notes. Type out everything you remember about ${sessionData?.topic} in 3 minutes without looking at the text.`}
                </p>
              </div>

              {/* Blurting Timer and Input Area */}
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="relative w-7 h-7 flex items-center justify-center shrink-0">
                      <svg className="w-7 h-7 transform -rotate-90" viewBox="0 0 28 28">
                        <circle cx="14" cy="14" r="11" className="stroke-slate-800" strokeWidth="2.5" fill="transparent" />
                        <circle
                          cx="14"
                          cy="14"
                          r="11"
                          stroke="#f59e0b"
                          strokeWidth="2.5"
                          strokeDasharray={2 * Math.PI * 11}
                          strokeDashoffset={2 * Math.PI * 11 * (1 - Math.min(1, Math.max(0, (180 - blurtingTimeLeft) / 180)))}
                          strokeLinecap="round"
                          fill="transparent"
                          className="transition-all duration-500 ease-linear"
                        />
                      </svg>
                      <Clock className="w-3.5 h-3.5 text-amber-400 absolute pointer-events-none" />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono-numbers font-bold text-white text-sm">
                        {formatTime(blurtingTimeLeft)}
                      </span>
                      <span className="text-slate-500">Remaining ({Math.round(((180 - blurtingTimeLeft) / 180) * 100)}% elapsed)</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {!blurtingTimerActive ? (
                      <button
                        type="button"
                        onClick={() => setBlurtingTimerActive(true)}
                        className="px-3 py-1 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs cursor-pointer"
                      >
                        Start 3-Min Timer
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setBlurtingTimerActive(false)}
                        className="px-3 py-1 rounded-lg bg-slate-800 text-slate-300 text-xs cursor-pointer"
                      >
                        Pause
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setBlurtingTimerActive(false);
                        setBlurtingTimeLeft(180);
                      }}
                      className="p-1 text-slate-500 hover:text-slate-300 cursor-pointer"
                      title="Reset Blurting Timer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <textarea
                  rows={6}
                  value={blurtingText}
                  onChange={e => setBlurtingText(e.target.value)}
                  placeholder="Brain dump here: Name the trigger, the rate-limiting step, the molecules/equations, and what shuts it down..."
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500/60 rounded-xl p-4 text-xs md:text-sm text-slate-100 placeholder:text-slate-600 outline-none leading-relaxed transition-colors"
                />
              </div>

              {/* Reveal Key Points Checklist */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      setBlurtingRevealed(!blurtingRevealed);
                      playStreakFlameSound();
                    }}
                    className="px-4 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-700 text-amber-400 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    {blurtingRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    <span>{blurtingRevealed ? 'Hide Model Key Points' : 'Reveal Key Points & Self-Grade'}</span>
                  </button>
                  <span className="text-xs text-slate-500 font-mono-numbers">
                    {checkedKeyPoints.length} / {sessionData?.blurtingKeyPoints?.length || 5} Recalled
                  </span>
                </div>

                {blurtingRevealed && sessionData?.blurtingKeyPoints && (
                  <div className="p-4 rounded-xl bg-slate-950 border border-amber-500/30 space-y-3 animate-fadeIn">
                    <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">
                      Check What You Captured in Your Brain Dump:
                    </span>
                    <div className="space-y-2">
                      {sessionData.blurtingKeyPoints.map((point, idx) => {
                        const isChecked = checkedKeyPoints.includes(idx);
                        return (
                          <div
                            key={idx}
                            onClick={() => {
                              setCheckedKeyPoints(prev =>
                                prev.includes(idx) ? prev.filter(p => p !== idx) : [...prev, idx]
                              );
                              playCorrectSound();
                            }}
                            className={`p-3 rounded-xl border text-xs cursor-pointer flex items-start gap-2.5 transition-all ${
                              isChecked
                                ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-200'
                                : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                            }`}
                          >
                            <div className={`w-4 h-4 rounded border mt-0.5 flex items-center justify-center shrink-0 ${
                              isChecked ? 'bg-emerald-500 border-emerald-400 text-slate-950 font-bold text-[10px]' : 'border-slate-700'
                            }`}>
                              {isChecked ? '✓' : ''}
                            </div>
                            <span className="leading-relaxed">{point}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setActiveStep('flashcards')}
                  className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-2 cursor-pointer shadow-md"
                >
                  <span>Proceed to Phase 4: Flashcards</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* PHASE 4: FLASHCARDS */}
          {activeStep === 'flashcards' && sessionData?.flashcards && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  Phase 4: Session Flashcards
                </span>
                <span className="text-emerald-400 font-mono-numbers font-bold">
                  {masteredCardIndices.length} / {sessionData.flashcards.length} Mastered
                </span>
              </div>

              {/* Flashcard Box */}
              <div
                onClick={() => setIsCardFlipped(!isCardFlipped)}
                className="min-h-[260px] bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-7 flex flex-col justify-between cursor-pointer transition-all shadow-xl relative select-none"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] uppercase font-bold text-slate-500">
                      {isCardFlipped ? 'The Explanation' : 'Prompt / Recall Question'}
                    </span>
                    <span className="text-xs text-slate-500">
                      Tap to {isCardFlipped ? 'flip back' : 'reveal answer'}
                    </span>
                  </div>

                  {!isCardFlipped ? (
                    <div className="text-lg md:text-xl font-bold font-display text-white pt-4 leading-relaxed">
                      {sessionData.flashcards[currentCardIdx]?.front}
                    </div>
                  ) : (
                    <div className="space-y-3 pt-2 animate-fadeIn">
                      <p className="text-sm md:text-base text-slate-200 leading-relaxed font-sans">
                        {sessionData.flashcards[currentCardIdx]?.back}
                      </p>
                      {sessionData.flashcards[currentCardIdx]?.trap && (
                        <div className="p-3 rounded-lg bg-amber-950/20 border border-amber-500/30 text-xs text-amber-200">
                          <strong className="text-amber-400">Examiner Trap Warning: </strong>
                          {sessionData.flashcards[currentCardIdx]?.trap}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="text-center text-[11px] text-slate-500 pt-3">
                  {isCardFlipped ? 'Self-grade below to track mastery' : 'Say the mechanism out loud before flipping!'}
                </div>
              </div>

              {/* Flashcard Action Buttons */}
              {isCardFlipped ? (
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => {
                      playIncorrectSound();
                      setIsCardFlipped(false);
                      if (currentCardIdx + 1 < sessionData.flashcards.length) {
                        setCurrentCardIdx(c => c + 1);
                      }
                    }}
                    className="py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                  >
                    Still Learning
                  </button>

                  <button
                    onClick={() => {
                      playCorrectSound();
                      if (!masteredCardIndices.includes(currentCardIdx)) {
                        setMasteredCardIndices(m => [...m, currentCardIdx]);
                      }
                      setIsCardFlipped(false);
                      if (currentCardIdx + 1 < sessionData.flashcards.length) {
                        setCurrentCardIdx(c => c + 1);
                      }
                    }}
                    className="py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer shadow-md"
                  >
                    ✓ Mastered
                  </button>
                </div>
              ) : (
                <div className="flex justify-between items-center">
                  <button
                    onClick={() => {
                      setIsCardFlipped(false);
                      setCurrentCardIdx(c => Math.max(0, c - 1));
                    }}
                    disabled={currentCardIdx === 0}
                    className="text-xs text-slate-500 hover:text-slate-300 disabled:opacity-30 cursor-pointer"
                  >
                    ← Previous Card
                  </button>

                  <button
                    onClick={() => {
                      setIsCardFlipped(false);
                      if (currentCardIdx + 1 < sessionData.flashcards.length) {
                        setCurrentCardIdx(c => c + 1);
                      } else {
                        setActiveStep('application');
                      }
                    }}
                    className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl cursor-pointer"
                  >
                    {currentCardIdx + 1 < sessionData.flashcards.length ? 'Next Card →' : 'Done → Go to Application'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* PHASE 5: APPLICATION QUESTIONS (CHAT AI STYLE) */}
          {activeStep === 'application' && sessionData?.practiceQuestions && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 space-y-6 shadow-2xl animate-fadeIn">
              {/* Header with AI Persona & Question Counter */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-md">
                    <Bot className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white font-display text-sm">The Angry Explainer</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/40">
                        Phase 5 · AI Chat Sparring
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">1-on-1 application drill with side-talk and personality</p>
                  </div>
                </div>

                <div className="text-right flex items-center gap-2 sm:block">
                  <span className="text-xs text-slate-400">Application Challenge: </span>
                  <span className="text-xs font-bold font-mono-numbers text-amber-400">
                    Question {currentQIdx + 1} of {sessionData.practiceQuestions.length}
                  </span>
                </div>
              </div>

              {/* Chat Thread for Current Question */}
              {sessionData.practiceQuestions[currentQIdx] && (() => {
                const q = sessionData.practiceQuestions[currentQIdx];
                const intro = getQuestionIntroSideTalk(q, currentQIdx, sessionData.practiceQuestions.length);
                const ans = answeredQs[currentQIdx];
                const reaction = ans ? getAnswerReaction(q, ans.choice, ans.isCorrect) : null;

                return (
                  <div className="space-y-4">
                    {/* 1. AI Side-Talk & Question Bubble */}
                    <div className="flex items-start gap-3 animate-fadeIn">
                      <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
                        <Bot className="w-4 h-4" />
                      </div>
                      <div className="flex-1 bg-slate-950/80 border border-slate-800/90 rounded-2xl rounded-tl-sm p-4 sm:p-5 text-slate-200 shadow-md space-y-3">
                        <div className="text-[11px] text-amber-400/90 font-medium italic flex items-center gap-1.5 border-b border-slate-800/80 pb-2">
                          <Flame className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <TypewriterText text={intro.sideTalk} speed={18} cursorColor="text-amber-400" />
                        </div>

                        {q.passage && (
                          <div className="p-4 rounded-xl bg-slate-900/90 border border-cyan-500/30 space-y-2 text-left my-2">
                            <div className="flex items-center gap-2 text-cyan-300 text-xs font-bold uppercase tracking-wider">
                              <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
                              <span>{q.passageTitle || 'Reading Passage & Experimental Case Study'}</span>
                            </div>
                            <div className="text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-line font-serif">
                              {q.passage}
                            </div>
                          </div>
                        )}

                        <h3 className="text-sm sm:text-base font-bold font-display text-white leading-relaxed">
                          {q.question}
                        </h3>

                        {/* Interactive Option Chips */}
                        <div className="space-y-2 pt-1">
                          {q.options.map((opt, idx) => {
                            const isSelected = ans?.choice === idx;
                            const isCorrect = q.correctIndex === idx;

                            let style = 'bg-slate-900 border-slate-800 text-slate-200 hover:border-amber-500/50 hover:bg-slate-850';
                            if (ans) {
                              if (isCorrect) style = 'bg-emerald-950/50 border-emerald-500/70 text-emerald-200 ring-1 ring-emerald-500/30';
                              else if (isSelected) style = 'bg-rose-950/50 border-rose-500/70 text-rose-200 ring-1 ring-rose-500/30';
                              else style = 'bg-slate-900/40 border-slate-900 text-slate-500 opacity-50';
                            }

                            return (
                              <button
                                key={idx}
                                disabled={!!ans}
                                onClick={() => {
                                  const correct = isCorrect;
                                  setAnsweredQs(prev => ({
                                    ...prev,
                                    [currentQIdx]: { choice: idx, isCorrect: correct }
                                  }));
                                  if (correct) playCorrectSound();
                                  else playIncorrectSound();
                                }}
                                className={`w-full text-left p-3 rounded-xl border text-xs sm:text-sm font-sans flex items-start gap-3 transition-all cursor-pointer ${style}`}
                              >
                                <span className="font-mono-numbers font-bold text-xs uppercase px-2 py-0.5 rounded bg-slate-950 border border-slate-800 shrink-0">
                                  {String.fromCharCode(65 + idx)}
                                </span>
                                <span className="leading-relaxed">{opt}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* 2. User Answer Bubble (if answered) */}
                    {ans && (
                      <div className="flex items-end justify-end gap-3 animate-fadeIn">
                        <div className="max-w-[85%] rounded-2xl rounded-tr-sm p-3.5 bg-gradient-to-br from-indigo-600 to-indigo-700 text-white text-xs sm:text-sm shadow-md">
                          <span className="font-semibold text-[11px] block text-indigo-200 mb-0.5">Your Response</span>
                          Option {String.fromCharCode(65 + ans.choice)}: {q.options[ans.choice]}
                        </div>
                      </div>
                    )}

                    {/* 3. AI Reaction & Personality Debrief (if answered) */}
                    {ans && reaction && (
                      <div className="flex items-start gap-3 animate-fadeIn">
                        <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
                          <Bot className="w-4 h-4" />
                        </div>
                        <div className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl rounded-tl-sm p-4 sm:p-5 text-slate-200 shadow-xl space-y-3">
                          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                            <span className="font-bold text-xs text-amber-400 flex items-center gap-1.5 uppercase tracking-wider">
                              <Flame className="w-3.5 h-3.5" /> {reaction.headline}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono-numbers">
                              {ans.isCorrect ? '✓ Concept Mastered' : '✗ Distractor Sprung'}
                            </span>
                          </div>

                          <p className="text-xs sm:text-sm text-slate-300 italic font-serif leading-relaxed">
                            {reaction.banter}
                          </p>

                          <WrongAnswerBreakdownCard
                            explanation={getDetailedAnswerExplanation(q, ans.choice, subject)}
                            compact
                          />
                        </div>
                      </div>
                    )}

                    {/* Navigation Buttons */}
                    <div className="pt-2 flex justify-between items-center">
                      <button
                        onClick={() => setCurrentQIdx(qIdx => Math.max(0, qIdx - 1))}
                        disabled={currentQIdx === 0}
                        className="text-xs text-slate-500 hover:text-slate-300 disabled:opacity-30 cursor-pointer"
                      >
                        ← Previous Question
                      </button>

                      <button
                        onClick={() => {
                          if (currentQIdx + 1 < sessionData.practiceQuestions.length) {
                            setCurrentQIdx(qIdx => qIdx + 1);
                          } else {
                            setActiveStep('teach-back');
                          }
                        }}
                        className="px-6 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl cursor-pointer shadow-md transition-all flex items-center gap-2 hover:scale-[1.02]"
                      >
                        <span>
                          {currentQIdx + 1 < sessionData.practiceQuestions.length
                            ? 'Next Question in Chat →'
                            : 'Proceed to Phase 6: Teach-Back →'}
                        </span>
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* PHASE 6: TEACH-BACK (FEYNMAN METHOD) */}
          {activeStep === 'teach-back' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 space-y-6 shadow-xl animate-fadeIn">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  Phase 6: Teach-Back (Feynman Technique)
                </span>
                <span className="text-xs text-slate-400">Oral Explanation Drill</span>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg md:text-xl font-bold font-display text-white">
                  Explain the Mechanism Without Fluff
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {sessionData?.teachBackPrompt || `Explain the entire mechanism of ${sessionData?.topic} out loud as if teaching an intelligent 12-year-old. You are forbidden from using the word "basically" or hand-waving!`}
                </p>
              </div>

              {/* Dictation / Input Box */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Your Explanation:
                  </label>
                  <button
                    type="button"
                    onClick={toggleMic}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                      isListening
                        ? 'bg-rose-500 text-white animate-pulse'
                        : 'bg-slate-950 text-slate-300 border border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    {isListening ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
                    <span>{isListening ? 'Listening...' : 'Voice Dictate'}</span>
                  </button>
                </div>

                <textarea
                  rows={4}
                  value={teachBackAnswerText}
                  onChange={e => setTeachBackAnswerText(e.target.value)}
                  placeholder="Speak or type your explanation here. Step 1 starts with... then... and finally..."
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500/60 rounded-xl p-4 text-xs md:text-sm text-slate-200 outline-none leading-relaxed transition-colors"
                />

                <div className="flex justify-between items-center pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setTeachBackSubmitted(true);
                      playCorrectSound();
                    }}
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer"
                  >
                    Check Against 1st-Class Model Answer
                  </button>
                </div>
              </div>

              {teachBackSubmitted && (
                <div className="p-4 rounded-xl bg-slate-950 border border-emerald-500/30 space-y-2 animate-fadeIn">
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block">
                    Model 1st-Class Teach-Back Answer:
                  </span>
                  <p className="text-xs md:text-sm text-slate-200 leading-relaxed font-sans">
                    {sessionData?.sampleCheckAnswer}
                  </p>
                </div>
              )}

              <div className="pt-4 border-t border-slate-800 flex justify-between items-center">
                <span className="text-xs text-slate-500">All phases completed!</span>
                <button
                  onClick={handleSessionComplete}
                  className="px-6 py-3 bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-slate-950 font-bold text-xs rounded-xl cursor-pointer shadow-lg transition-transform hover:scale-105"
                >
                  ✓ Finish Study Session & Claim XP
                </button>
              </div>
            </div>
          )}

          {/* PHASE 7: ANTI-MOTIVATION PROTOCOL TOOLBOX */}
          {activeStep === 'anti-motivation' && (
            <div className="space-y-6 animate-fadeIn">
              <AntiMotivationProtocolCard topic={sessionData?.topic || subject} />
            </div>
          )}
        </div>

        {/* Collapsible AI Study Coach Drawer */}
        {showCoach && (
          <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-bold text-slate-200">AI Study Coach</span>
              </div>
              <button
                onClick={() => setShowCoach(false)}
                className="text-slate-500 hover:text-slate-300 text-xs cursor-pointer"
              >
                Close
              </button>
            </div>

            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 leading-relaxed">
                "Stuck on a mechanism? Ask me anything about {sessionData?.topic}. I will give you a direct, jargon-free causal answer."
              </div>

              {coachMessages.map((msg, i) => (
                <div
                  key={i}
                  className={`p-3 rounded-xl text-xs leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-amber-500/20 border border-amber-500/30 text-amber-200 ml-4'
                      : 'bg-slate-950 border border-slate-800 text-slate-200 mr-4'
                  }`}
                >
                  {msg.text}
                </div>
              ))}

              {isAskingCoach && (
                <div className="p-2 text-xs text-slate-500 italic flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 animate-spin" />
                  <span>Coach is thinking...</span>
                </div>
              )}
            </div>

            {/* Quick Questions */}
            <div className="space-y-1 pt-1">
              <span className="text-[10px] text-slate-500 uppercase font-semibold">Quick Prompts:</span>
              <div className="flex flex-col gap-1">
                <button
                  type="button"
                  onClick={() => handleAskCoach(`What is the rate-limiting step in ${sessionData?.topic}?`)}
                  className="text-left text-[11px] text-amber-400/90 hover:text-amber-300 p-1.5 rounded bg-slate-950 border border-slate-800/80 cursor-pointer"
                >
                  "What is the rate-limiting step?"
                </button>
                <button
                  type="button"
                  onClick={() => handleAskCoach(`What happens if the primary receptor/enzyme is blocked?`)}
                  className="text-left text-[11px] text-amber-400/90 hover:text-amber-300 p-1.5 rounded bg-slate-950 border border-slate-800/80 cursor-pointer"
                >
                  "What happens if an inhibitor blocks it?"
                </button>
              </div>
            </div>

            {/* Coach Input */}
            <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
              <input
                type="text"
                value={coachQuestion}
                onChange={e => setCoachQuestion(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAskCoach()}
                placeholder="Ask coach..."
                className="flex-1 bg-slate-950 border border-slate-800 focus:border-amber-500/50 rounded-xl px-3 py-2 text-xs text-slate-100 outline-none"
              />
              <button
                type="button"
                onClick={() => handleAskCoach()}
                disabled={isAskingCoach || !coachQuestion.trim()}
                className="p-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 disabled:opacity-40 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Full Deep Work Pomodoro Timer Modal Overlay */}
      {showPomodoroModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="max-w-3xl w-full relative">
            <button
              type="button"
              onClick={() => setShowPomodoroModal(false)}
              className="absolute top-4 right-4 z-20 p-2 rounded-xl bg-slate-800/90 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer shadow-lg"
              title="Close Pomodoro Modal"
            >
              <X className="w-5 h-5" />
            </button>
            <DeepWorkPomodoroTimer
              topic={sessionData?.topic || topics[0] || subject}
              subject={subject}
              studyState={studyState}
              onUpdateStudyState={onUpdateStudyState}
              onCycleComplete={(mins, xp) => {
                onFinishSession(mins, xp, sessionData?.topic || topics[0] || subject);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
