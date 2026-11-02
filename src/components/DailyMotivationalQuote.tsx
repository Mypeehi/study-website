import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Quote,
  Flame,
  RotateCw,
  Copy,
  Check,
  ChevronUp,
  ChevronDown,
  Volume2,
  VolumeX,
  Sparkles,
  Zap,
  Target,
  Brain,
  ShieldAlert,
} from 'lucide-react';
import { playStreakFlameSound, speakExaminerVoice, stopSpeaking } from '../utils/audio';

export interface AngryScholarQuote {
  id: string;
  quote: string;
  author: string;
  theme: string;
  tag: string;
  actionDirective: string;
  iconType?: 'flame' | 'brain' | 'zap' | 'target' | 'shield';
}

export const ANGRY_SCHOLAR_QUOTES: AngryScholarQuote[] = [
  {
    id: 'as-1',
    quote: 'Passive reading is a hallucination of competence. Close the notes and force your synapses to pull the answer out of pure darkness.',
    author: 'The Angry Examiner',
    theme: 'Active Retrieval',
    tag: '⚡ Zero Hallucinations',
    actionDirective: 'Close your book now. Blurt the 3 core principles onto blank paper from raw memory.',
    iconType: 'zap',
  },
  {
    id: 'as-2',
    quote: 'If your practice session feels comfortable and cozy, you aren’t learning. You’re just sightseeing through things you already know.',
    author: 'Cognitive Rigor Protocol #7',
    theme: 'Desirable Difficulties',
    tag: '🧠 Desirable Difficulties',
    actionDirective: 'Pick the hardest problem set you’ve been avoiding and attempt question 1 immediately.',
    iconType: 'brain',
  },
  {
    id: 'as-3',
    quote: 'The exam paper will not supply multiple hints, color-coded summaries, or sympathetic nods. Train under combat conditions so the real test feels like a stroll.',
    author: 'The Chief Proctor',
    theme: 'Exam Automaticity',
    tag: '⚔️ Combat Readiness',
    actionDirective: 'Run a timed 5-question drill without checking notes or pausing the clock.',
    iconType: 'target',
  },
  {
    id: 'as-4',
    quote: 'Mental friction is not failure. That burn is literally the physical sensation of dendritic spines remodeling in your cortex. Endure the friction.',
    author: 'Synaptic Stamina Manual',
    theme: 'Neural Plasticity',
    tag: '🔥 Dendritic Remodeling',
    actionDirective: 'When you hit confusion, sit with it for 3 full minutes before looking at the solution.',
    iconType: 'flame',
  },
  {
    id: 'as-5',
    quote: 'Can you explain this mechanism in 30 seconds to an angry five-year-old right now without peeking? If you stutter, you do not own it yet.',
    author: 'The Angry Scholar',
    theme: 'Feynman Stress Test',
    tag: '🎙️ Feynman Protocol',
    actionDirective: 'Speak the mechanism aloud into the room in plain English. No buzzword crutches.',
    iconType: 'brain',
  },
  {
    id: 'as-6',
    quote: 'Stop highlighting fluorescent yellow stripes across your textbook like an interior decorator. Real mastery is carved on blank white paper from scratch.',
    author: 'Anti-Illusion Directive',
    theme: 'Closed-Book Blurting',
    tag: '🛑 Ban Highlighting',
    actionDirective: 'Put away the highlighter. Sketch the entire pathway or formula hierarchy blind.',
    iconType: 'shield',
  },
  {
    id: 'as-7',
    quote: 'Every mistake caught and dissected during practice is an exam landmine safely disarmed before it can detonate on your grade sheet.',
    author: 'Mistakes Vault Manifesto',
    theme: 'Error Immunity',
    tag: '🛡️ Landmine Disarmament',
    actionDirective: 'Check your Mistakes Vault. Identify the single distractor trap you fall for most.',
    iconType: 'shield',
  },
  {
    id: 'as-8',
    quote: 'Ten minutes of distraction-free, agonizing active recall destroys four hours of sleepy, music-blasting note-gazing every single time.',
    author: 'The 10-Minute Blurt Doctrine',
    theme: 'Time Efficiency',
    tag: '⏱️ High-Density Focus',
    actionDirective: 'Set a 10-minute timer. Write everything you know about your weakest topic without stopping.',
    iconType: 'zap',
  },
  {
    id: 'as-9',
    quote: 'Your brain is an energy-conserving organ. It will lie to you, whisper that you’re "ready", and beg you to stop just to avoid retrieval strain. Don’t fall for the trap.',
    author: 'Academic War Room',
    theme: 'Biochemical Discipline',
    tag: '🧬 Energy Resistance',
    actionDirective: 'Do one more question when your mind whispers that you’ve done enough.',
    iconType: 'brain',
  },
  {
    id: 'as-10',
    quote: 'A 50-day streak is meaningless if you only answered comfortable questions. Push into the uncomfortable frontier where you feel stupid.',
    author: 'The Hard Frontier Principle',
    theme: 'Edge-of-Ability Training',
    tag: '📈 Frontier Hunting',
    actionDirective: 'Skip the easy review cards. Target the lowest-accuracy tag in your performance map.',
    iconType: 'target',
  },
  {
    id: 'as-11',
    quote: 'Blocking six hours on one subject feels smooth because working memory is carrying you. Interleave three subjects today and force your brain to discriminate.',
    author: 'Interleaved Practice Codex',
    theme: 'Interleaving Law',
    tag: '🔀 Interleaved Drills',
    actionDirective: 'Switch topics after 25 minutes to break short-term memory illusions.',
    iconType: 'zap',
  },
  {
    id: 'as-12',
    quote: 'Stop negotiating with fatigue when the problem set is only half-finished. Complete the derivation first; rest when the answer is secured.',
    author: 'Spartan Scholar Cadence',
    theme: 'Academic Grit',
    tag: '⚔️ Spartan Grit',
    actionDirective: 'Lock your eyes on the current problem. No tab-switching until the final step is verified.',
    iconType: 'flame',
  },
  {
    id: 'as-13',
    quote: 'If you hesitated for more than five seconds on that concept, demote it immediately. Hesitation on test day is a guaranteed point deduction.',
    author: 'Strict Recall Mandate',
    theme: 'Speed & Automaticity',
    tag: '⚡ Zero Hesitation',
    actionDirective: 'Demote any flashcard you paused on to Box 1. Ruthless honesty builds perfect scores.',
    iconType: 'zap',
  },
  {
    id: 'as-14',
    quote: 'Reading the answer key and nodding "Ah, I knew that" is the most dangerous lie in academia. You didn’t know it. Cover it and write it yourself.',
    author: 'The Recognition Trap',
    theme: 'Recognition vs Recall',
    tag: '🚨 Recognition Trap',
    actionDirective: 'Cover the answer key completely. Re-derive the whole solution with clean hands.',
    iconType: 'shield',
  },
  {
    id: 'as-15',
    quote: 'Mastery is not when you get it right once. Mastery is when you have drilled the distractor traps so thoroughly that you physically cannot get it wrong.',
    author: 'Examination Board Standards',
    theme: 'Flawless Execution',
    tag: '🎯 Flawless Execution',
    actionDirective: 'Explain why each wrong answer in your last quiz was designed to fool you.',
    iconType: 'target',
  },
  {
    id: 'as-16',
    quote: 'Pre-test on the hardest past paper questions before reading the chapter. The sting of getting tricked primes your synapses to lock in the true mechanisms.',
    author: 'Hypercorrection Protocol',
    theme: 'Pre-Testing Priming',
    tag: '🧪 Hypercorrection',
    actionDirective: 'Take a 3-question diagnostic on today’s lecture topic before opening the text.',
    iconType: 'brain',
  },
  {
    id: 'as-17',
    quote: 'The student who embraces confusion in ordinary practice never panics in exam season. Suffer the confusion now so you can execute with cold precision later.',
    author: 'The Angry Examiner',
    theme: 'Mental Fortitude',
    tag: '🧊 Cold Precision',
    actionDirective: 'Treat every tricky exam question as a welcome puzzle, not an insult.',
    iconType: 'flame',
  },
  {
    id: 'as-18',
    quote: 'Do not celebrate finishing the lecture video. Watching someone else do math or biology is entertainment, not synthesis. Now solve five problems unassisted.',
    author: 'Active Engagement Protocol',
    theme: 'Kinesthetic Synthesis',
    tag: '✍️ Independent Synthesis',
    actionDirective: 'Step away from the video. Write down the 2 governing equations without glancing.',
    iconType: 'zap',
  },
  {
    id: 'as-19',
    quote: 'Distractor Autopsy: Explaining why the correct option is right is child’s play. Prove why each of the other three options is a toxic distractor trap.',
    author: 'The Examiner’s Trap Manual',
    theme: 'Distractor Elimination',
    tag: '🔬 Distractor Autopsy',
    actionDirective: 'Annotate the specific flaw in every distractor choice on your next quiz question.',
    iconType: 'shield',
  },
  {
    id: 'as-20',
    quote: 'You don’t need "motivation" to sit in the chair. You need an immovable schedule, a timer ticking down, and the stubborn refusal to quit mid-drill.',
    author: 'Academic Grit Protocol',
    theme: 'Discipline Over Emotion',
    tag: '🧱 Schedule Over Mood',
    actionDirective: 'Start the study timer right now. Don’t wait for inspiration to strike.',
    iconType: 'target',
  },
  {
    id: 'as-21',
    quote: 'Sleep is non-negotiable hippocampal consolidation. Don’t trade 3 hours of late-night delirium for tomorrow’s cognitive clarity. Drill hard now, sleep deep tonight.',
    author: 'Cognitive Recovery Mandate',
    theme: 'Synaptic Consolidation',
    tag: '🌙 Memory Consolidation',
    actionDirective: 'Finish today’s target minutes before midnight so your memory circuits can crystallize.',
    iconType: 'brain',
  },
  {
    id: 'as-22',
    quote: 'Put the phone in another room. Every notification ding resets your deep-work attentional state by 23 minutes. Defend your focus like an exam hall proctor.',
    author: 'Deep Focus Citadel',
    theme: 'Distraction Defense',
    tag: '📵 Fortress of Focus',
    actionDirective: 'Engage airplane mode or move your phone out of arm’s reach during study sprints.',
    iconType: 'shield',
  },
  {
    id: 'as-23',
    quote: 'A single equation or concept recalled under pressure without assistance is worth fifty pages of passive recognition.',
    author: 'The Active Recall Core',
    theme: 'Pressure Testing',
    tag: '💎 High-Yield Yield',
    actionDirective: 'Test yourself on the toughest formula of your exam right this second.',
    iconType: 'zap',
  },
  {
    id: 'as-24',
    quote: 'Stop waiting for the "perfect mood" to start studying. The feeling of readiness follows the work; it never precedes it. Open the first question now.',
    author: 'The Resistance Breaker',
    theme: 'Action-First Cadence',
    tag: '🚀 Action Precedes Mood',
    actionDirective: 'Answer 1 practice question immediately to break task inertia.',
    iconType: 'flame',
  },
];

interface DailyMotivationalQuoteProps {
  className?: string;
  activeTab?: string;
}

export const DailyMotivationalQuote: React.FC<DailyMotivationalQuoteProps> = ({
  className = '',
  activeTab,
}) => {
  // Compute deterministic index based on day of year
  const getDailyIndex = (): number => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = now.getTime() - start.getTime();
    const oneDay = 1000 * 60 * 60 * 24;
    const dayOfYear = Math.floor(diff / oneDay);
    return Math.abs(dayOfYear) % ANGRY_SCHOLAR_QUOTES.length;
  };

  const [currentIndex, setCurrentIndex] = useState<number>(getDailyIndex);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    try {
      return localStorage.getItem('angry_scholar_quote_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const [copied, setCopied] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  const currentQuote = useMemo(() => {
    return ANGRY_SCHOLAR_QUOTES[currentIndex % ANGRY_SCHOLAR_QUOTES.length];
  }, [currentIndex]);

  const toggleCollapsed = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('angry_scholar_quote_collapsed', String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const handleNextQuote = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    stopSpeaking();
    setIsSpeaking(false);
    playStreakFlameSound();
    setCurrentIndex((prev) => (prev + 1) % ANGRY_SCHOLAR_QUOTES.length);
  };

  const handleCopyQuote = (e: React.MouseEvent) => {
    e.stopPropagation();
    const textToCopy = `"${currentQuote.quote}" — ${currentQuote.author} (${currentQuote.theme})`;
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleToggleSpeak = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSpeaking) {
      stopSpeaking();
      setIsSpeaking(false);
    } else {
      setIsSpeaking(true);
      speakExaminerVoice(`${currentQuote.quote} ... By ${currentQuote.author}. Directive: ${currentQuote.actionDirective}`, () => {
        setIsSpeaking(false);
      });
    }
  };

  // Clean up speech on unmount
  useEffect(() => {
    return () => {
      stopSpeaking();
    };
  }, []);

  const renderIcon = (type?: string) => {
    switch (type) {
      case 'zap':
        return <Zap className="w-4 h-4 text-amber-400" />;
      case 'brain':
        return <Brain className="w-4 h-4 text-rose-400" />;
      case 'target':
        return <Target className="w-4 h-4 text-cyan-400" />;
      case 'shield':
        return <ShieldAlert className="w-4 h-4 text-emerald-400" />;
      case 'flame':
      default:
        return <Flame className="w-4 h-4 text-amber-500 fill-amber-500/20" />;
    }
  };

  return (
    <div
      className={`relative rounded-2xl transition-all duration-300 overflow-hidden border ${
        isCollapsed
          ? 'bg-slate-900/80 border-slate-800 hover:border-amber-500/30'
          : 'bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950/25 border-amber-500/30 shadow-lg shadow-amber-950/20'
      } ${className}`}
    >
      {/* Glow highlight */}
      <div className="absolute -top-16 -right-16 w-40 h-40 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-40 h-40 bg-rose-500/5 rounded-full blur-2xl pointer-events-none" />

      {/* COLLAPSED VIEW */}
      {isCollapsed ? (
        <div className="px-4 py-2.5 flex items-center justify-between gap-3 relative z-10 text-xs">
          <div
            onClick={toggleCollapsed}
            className="flex items-center gap-2.5 min-w-0 cursor-pointer group flex-1"
            title="Click to expand today's full academic grit directive"
          >
            <div className="p-1 rounded-lg bg-amber-500/15 text-amber-400 shrink-0 border border-amber-500/30">
              {renderIcon(currentQuote.iconType)}
            </div>
            <div className="flex items-center gap-2 truncate">
              <span className="font-bold font-mono text-[10px] uppercase tracking-wider text-amber-400 shrink-0">
                Daily Grit:
              </span>
              <span className="text-slate-300 truncate italic font-serif">
                "{currentQuote.quote}"
              </span>
              <span className="text-slate-500 hidden sm:inline shrink-0 font-medium">
                — {currentQuote.author}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleNextQuote}
              className="p-1.5 rounded-lg text-slate-400 hover:text-amber-300 hover:bg-slate-800 transition-colors cursor-pointer"
              title="Next Angry Scholar quote"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={toggleCollapsed}
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer text-[11px] font-semibold"
              title="Expand quote card"
            >
              <span>Expand</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>
          </div>
        </div>
      ) : (
        /* EXPANDED VIEW */
        <div className="p-4 sm:p-5 relative z-10 space-y-3.5">
          {/* Header Row */}
          <div className="flex items-center justify-between gap-2 sm:gap-3 border-b border-slate-800/80 pb-2.5 min-w-0">
            <div className="flex items-center gap-2 flex-wrap min-w-0">
              <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] font-black uppercase tracking-wider shrink-0">
                {renderIcon(currentQuote.iconType)}
                <span>Daily Academic Grit Directive</span>
              </div>

              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700/80 text-[10px] font-mono font-medium text-slate-300 shrink-0">
                <Sparkles className="w-3 h-3 text-amber-400" />
                {currentQuote.tag}
              </span>

              <span className="hidden lg:inline-block text-[11px] text-slate-500 font-mono shrink-0">
                Quote #{currentIndex + 1} of {ANGRY_SCHOLAR_QUOTES.length}
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-1 shrink-0">
              {/* Text-to-Speech Examiner Voice */}
              <button
                type="button"
                onClick={handleToggleSpeak}
                className={`p-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  isSpeaking
                    ? 'bg-rose-500/20 border-rose-500/50 text-rose-300 animate-pulse'
                    : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300 hover:text-white'
                }`}
                title={isSpeaking ? 'Stop speaking' : 'Hear The Angry Examiner read this quote'}
              >
                {isSpeaking ? (
                  <>
                    <VolumeX className="w-3.5 h-3.5 text-rose-400" />
                    <span className="text-[10px] hidden sm:inline">Mute</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-[10px] hidden sm:inline">Dictate</span>
                  </>
                )}
              </button>

              {/* Copy Quote */}
              <button
                type="button"
                onClick={handleCopyQuote}
                className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                title={copied ? 'Copied to clipboard!' : 'Copy quote text'}
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>

              {/* Reroll / Next Quote */}
              <button
                type="button"
                onClick={handleNextQuote}
                className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-amber-300 transition-colors cursor-pointer"
                title="Shuffle next Angry Scholar quote"
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>

              {/* Collapse Button */}
              <button
                type="button"
                onClick={toggleCollapsed}
                className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                title="Minimize daily quote banner"
              >
                <ChevronUp className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Quote Body */}
          <div className="relative pl-6 sm:pl-7">
            {/* Decorative Quote Mark */}
            <Quote className="w-5 h-5 text-amber-500/30 absolute left-0 top-0.5 transform -scale-x-100" />

            <div className="space-y-2">
              <blockquote className="text-sm sm:text-base md:text-lg font-medium text-slate-100 leading-relaxed font-serif tracking-normal">
                "{currentQuote.quote}"
              </blockquote>

              <div className="flex items-center gap-3 flex-wrap text-xs">
                <span className="font-bold text-amber-400 font-display tracking-wide">
                  — {currentQuote.author}
                </span>
                <span className="text-slate-600">·</span>
                <span className="text-slate-400 font-mono text-[11px]">
                  Focus Area: <strong className="text-slate-300 font-semibold">{currentQuote.theme}</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Immediate Action Directive Strip */}
          <div className="flex items-start sm:items-center gap-2.5 px-3 py-2 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs">
            <div className="p-1 rounded-md bg-rose-500/15 text-rose-400 shrink-0 mt-0.5 sm:mt-0">
              <Zap className="w-3.5 h-3.5" />
            </div>
            <div className="text-slate-300 flex-1 leading-snug">
              <span className="text-rose-400 font-bold uppercase tracking-wider text-[10px] mr-1.5">
                Immediate Action:
              </span>
              <span>{currentQuote.actionDirective}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
