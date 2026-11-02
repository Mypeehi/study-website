import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Crown, Sparkles, Flame, RotateCw, Lightbulb, Zap, ShieldAlert } from 'lucide-react';

export interface AngryScholarTip {
  rule: string;
  quote: string;
  technique: string;
}

export const ANGRY_SCHOLAR_TIPS: AngryScholarTip[] = [
  {
    rule: 'Coloring ≠ Studying',
    quote: 'Drop the fluorescent highlighters! Coloring pages gives you the fake illusion of competence. Close the book and force your brain to retrieve the mechanism from pure vacuum.',
    technique: 'Closed-Book Blurting',
  },
  {
    rule: 'Explain It in 30 Seconds',
    quote: 'If you need ten minutes and twenty buzzwords to explain a concept, you do not understand it. Explain the mechanism out loud in 30 seconds as if teaching a confused freshman.',
    technique: 'Feynman Protocol',
  },
  {
    rule: 'The 5-Second Flashcard Law',
    quote: 'If you hesitated on a flashcard for more than 5 seconds, you did NOT know it. Stop lying to yourself and demote the card back to Box 1 immediately!',
    technique: 'Strict Leitner Spaced Repetition',
  },
  {
    rule: 'Interleave or Deceive',
    quote: 'Blocking 6 hours on a single topic feels smooth because short-term working memory is carrying you. Mix 3 distinct topics to force actual neural discrimination.',
    technique: 'Interleaved Practice',
  },
  {
    rule: 'Question Generator Rule',
    quote: 'Finished reading a page? Do not turn it until you have written 2 brutal exam questions testing exceptions and distractor traps.',
    technique: 'Elaborative Interrogation',
  },
  {
    rule: 'Pre-Testing Priming',
    quote: 'Attempt hardest questions BEFORE reading the notes. Getting trapped in distractors triggers prediction-error signals so correct facts stick like superglue.',
    technique: 'Hypercorrection Effect',
  },
  {
    rule: 'Friction Means Synaptic Growth',
    quote: 'Studying is not supposed to feel cozy! Mental friction is literally the physical sensation of dendritic spines remodeling in your synapses. Embrace the struggle.',
    technique: 'Desirable Difficulties',
  },
  {
    rule: 'Distractor Autopsy',
    quote: 'Picking the right answer is only 25% of mastery. Explain specifically why each of the other 3 distractors is false, or you will fall into the examiner trap on test day.',
    technique: 'Distractor Elimination Viva',
  },
  {
    rule: 'Cramming Is Memory Suicide',
    quote: 'All-nighters destroy hippocampal consolidation. Study in 4 intense 25-minute Pomodoro sprints with zero phone distractions, then let sleep wire the connections.',
    technique: 'Memory Consolidation Cycle',
  },
  {
    rule: 'Active Dual-Coding',
    quote: 'Stop relying solely on walls of text! Close your eyes and sketch the anatomical flow, metabolic cycle, or decision tree entirely from memory without peeking.',
    technique: 'Active Dual-Coding',
  },
  {
    rule: '24-Hour Forgetting Curve Strike',
    quote: 'Ebbinghaus curve wipes 70% of newly learned facts within 24 hours. Drill this topic tomorrow for 3 minutes or waste all the hours you spent studying it today.',
    technique: 'Forgetting Curve Counterstrike',
  },
  {
    rule: 'Timed Mock Pressure',
    quote: 'Open-notes untimed practice creates delusions of grandeur. Cut test time by 20% and solve in silence. The exam hall will not offer you mercy.',
    technique: 'Stress Inoculation Testing',
  },
];

export interface WeeklyTopScholarBadgeProps {
  size?: 'xs' | 'sm' | 'md' | 'lg';
  tooltipPlacement?: 'top' | 'bottom' | 'auto';
  className?: string;
  showSparkles?: boolean;
}

export const WeeklyTopScholarBadge: React.FC<WeeklyTopScholarBadgeProps> = ({
  size = 'sm',
  tooltipPlacement = 'auto',
  className = '',
  showSparkles = true,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const [isRotating, setIsRotating] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [resolvedPlacement, setResolvedPlacement] = useState<'top' | 'bottom'>('top');

  // Randomize a tip on hover
  const randomizeTip = useCallback(() => {
    setCurrentTipIndex(prev => {
      let nextIndex = Math.floor(Math.random() * ANGRY_SCHOLAR_TIPS.length);
      if (nextIndex === prev && ANGRY_SCHOLAR_TIPS.length > 1) {
        nextIndex = (prev + 1) % ANGRY_SCHOLAR_TIPS.length;
      }
      return nextIndex;
    });
  }, []);

  const handleMouseEnter = () => {
    randomizeTip();
    setIsHovered(true);

    if (tooltipPlacement === 'auto' && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      // If badge is in the top 240px of viewport, place tooltip below to prevent viewport clipping
      if (rect.top < 240) {
        setResolvedPlacement('bottom');
      } else {
        setResolvedPlacement('top');
      }
    } else if (tooltipPlacement !== 'auto') {
      setResolvedPlacement(tooltipPlacement);
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  const handleNextTip = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsRotating(true);
    randomizeTip();
    setTimeout(() => setIsRotating(false), 300);
  };

  const tip = ANGRY_SCHOLAR_TIPS[currentTipIndex];

  // Size styling variants
  const sizeStyles = {
    xs: {
      pill: 'px-2 py-0.5 text-[9px] gap-1',
      crown: 'w-2.5 h-2.5',
      sparkles: 'w-2.5 h-2.5',
    },
    sm: {
      pill: 'px-2.5 py-0.5 text-[10px] gap-1',
      crown: 'w-3 h-3',
      sparkles: 'w-3 h-3',
    },
    md: {
      pill: 'px-3 py-1 text-xs gap-1.5',
      crown: 'w-3.5 h-3.5',
      sparkles: 'w-3 h-3',
    },
    lg: {
      pill: 'px-3.5 py-1 text-xs font-black gap-2 tracking-wider',
      crown: 'w-4 h-4',
      sparkles: 'w-3.5 h-3.5',
    },
  }[size];

  return (
    <div
      ref={containerRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`relative inline-block cursor-help select-none ${className}`}
    >
      {/* Badge Button/Pill */}
      <span
        className={`inline-flex items-center rounded-full bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-slate-950 font-black uppercase tracking-wider shadow-md shadow-amber-400/20 ring-1 ring-amber-200 transition-all duration-200 hover:scale-[1.03] hover:ring-2 hover:ring-amber-300 ${sizeStyles.pill}`}
      >
        <Crown className={`${sizeStyles.crown} fill-slate-950 shrink-0`} />
        <span className="truncate">Weekly Top Scholar</span>
        {showSparkles && <Sparkles className={`${sizeStyles.sparkles} fill-slate-950 shrink-0`} />}
      </span>

      {/* Floating Tooltip */}
      {isHovered && (
        <div
          onClick={e => e.stopPropagation()}
          className={`absolute left-1/2 -translate-x-1/2 z-50 w-72 sm:w-80 p-3.5 rounded-2xl bg-slate-950/95 border-2 border-amber-400/80 text-white shadow-2xl shadow-amber-950/60 backdrop-blur-xl animate-fadeIn pointer-events-auto text-left ${
            resolvedPlacement === 'top'
              ? 'bottom-full mb-2.5'
              : 'top-full mt-2.5'
          }`}
        >
          {/* Tooltip Arrow */}
          <div
            className={`absolute left-1/2 -translate-x-1/2 w-3 h-3 bg-slate-950 border-amber-400/80 rotate-45 ${
              resolvedPlacement === 'top'
                ? 'bottom-[-7px] border-b-2 border-r-2'
                : 'top-[-7px] border-t-2 border-l-2'
            }`}
          />

          {/* Header with Angry Scholar Branding */}
          <div className="flex items-center justify-between gap-2 border-b border-amber-500/30 pb-2 mb-2.5">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="w-5 h-5 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-xs shrink-0">
                😠
              </span>
              <div className="min-w-0">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1">
                  <Flame className="w-3 h-3 text-amber-400 fill-amber-400 shrink-0" />
                  <span>The Angry Scholar</span>
                </span>
                <p className="text-[9px] text-slate-400 font-medium truncate">
                  Active Recall Efficiency Protocol
                </p>
              </div>
            </div>

            {/* Quick Reroll Tip Button */}
            <button
              type="button"
              onClick={handleNextTip}
              className="p-1 rounded-lg bg-slate-900 hover:bg-amber-500/20 text-slate-400 hover:text-amber-300 border border-slate-800 hover:border-amber-400/40 transition-colors cursor-pointer shrink-0"
              title="Get another randomized efficiency tip"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isRotating ? 'animate-spin text-amber-400' : ''}`} />
            </button>
          </div>

          {/* Efficiency Tip Body */}
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-300 font-bold text-[10px]">
              <Zap className="w-3 h-3 fill-amber-400 shrink-0" />
              <span>{tip.rule}</span>
            </div>

            <p className="text-[11px] text-slate-200 leading-relaxed font-sans italic bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/80">
              "{tip.quote}"
            </p>
          </div>

          {/* Footer with Active Recall Method tag */}
          <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
            <span className="flex items-center gap-1 text-emerald-400 font-semibold font-mono text-[9px]">
              <Lightbulb className="w-3 h-3 shrink-0" />
              <span>{tip.technique}</span>
            </span>

            <span className="text-[9px] text-slate-500 font-mono">
              Hover to refresh 🎲
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
