import React, { useState, useEffect } from 'react';
import { Sparkles, Brain, CheckCircle2, ShieldAlert, Zap, Flame } from 'lucide-react';

interface AILoadingBarProps {
  title?: string;
  subtitle?: string;
  itemType?: 'session' | 'questions' | 'flashcards' | 'lecture';
  topic?: string;
  onCancel?: () => void;
}

export const AILoadingBar: React.FC<AILoadingBarProps> = ({
  title = 'Generating Study Content',
  subtitle = 'The Angry Explainer is preparing your active recall materials...',
  itemType = 'session',
  topic,
  onCancel,
}) => {
  const [progress, setProgress] = useState(8);
  const [activeStepIdx, setActiveStepIdx] = useState(0);

  const stepsByItemType: Record<string, string[]> = {
    session: [
      'Deconstructing topic mechanisms & committed rate-limiting steps...',
      'Formulating high-yield flashcards with examiner trap warnings...',
      'Synthesizing diagnostic pretest & application questions...',
      'Verifying scientific consensus (Campbell, Lehninger, Guyton)...',
      'Configuring phased recall timeline & active study timer...'
    ],
    questions: [
      'Scanning topic curriculum for high-frequency examiner traps...',
      'Drafting plausible distractor options and indisputable correct keys...',
      'Formulating The Angry Explainer causal explanations...',
      'Double-checking physiological & mathematical accuracy...',
      'Assembling interactive question challenge set...'
    ],
    flashcards: [
      'Extracting core definitions and fundamental causal chains...',
      'Calibrating question prompts to eliminate hand-waving fluff...',
      'Drafting specific "Examiner Trap Warnings" for every card...',
      'Assigning Leitner Box 1 intervals for spaced repetition...',
      'Finalizing high-retention active recall deck...'
    ],
    lecture: [
      'Analyzing lecture syllabus & obliterating textbook jargon...',
      'Drafting step-by-step chronological causal mechanisms...',
      'Constructing vivid real-world analogies and high-yield pearls...',
      'Generating targeted quiz & oral speaking exam questions...',
      'Packaging comprehensive breakdown note...'
    ]
  };

  const steps = stepsByItemType[itemType] || stepsByItemType.session;

  useEffect(() => {
    // Smooth progress simulation that naturally slows down as it approaches 95%
    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 94) return prev; // Hold at ~94% until parent finishes
        const increment = prev < 30 ? 6 : prev < 65 ? 4 : prev < 85 ? 2.5 : 1;
        const next = Math.min(94, prev + increment);

        // Update step index based on progress
        const stepIndex = Math.min(steps.length - 1, Math.floor((next / 100) * steps.length));
        setActiveStepIdx(stepIndex);

        return next;
      });
    }, 400);

    return () => clearInterval(timer);
  }, [steps.length]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden">
        {/* Background Ambient Glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="text-center space-y-2 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 fill-amber-400 animate-spin" style={{ animationDuration: '3s' }} />
            <span>AI Factual Synthesis Engine</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold font-display text-white tracking-tight">
            {title}
          </h2>

          {topic && (
            <div className="inline-block text-xs font-semibold text-amber-300/90 bg-amber-950/40 border border-amber-500/30 px-3 py-1 rounded-lg">
              Topic: {topic}
            </div>
          )}

          <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
            {subtitle}
          </p>
        </div>

        {/* Animated Loading Bar */}
        <div className="space-y-2.5 relative z-10">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-300 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span>Generating questions & flashcards...</span>
            </span>
            <span className="font-mono-numbers font-bold text-amber-400 text-sm">
              {Math.round(progress)}%
            </span>
          </div>

          {/* Bar track */}
          <div className="w-full h-3 bg-slate-950 rounded-full p-0.5 border border-slate-800 overflow-hidden shadow-inner relative">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-500 via-rose-500 to-amber-400 transition-all duration-300 ease-out relative overflow-hidden"
              style={{ width: `${progress}%` }}
            >
              {/* Shimmer light sweep animation */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
            </div>
          </div>
        </div>

        {/* Step-by-Step Milestones */}
        <div className="space-y-2 pt-2 relative z-10">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Verification & Generation Steps:
          </span>
          <div className="space-y-1.5">
            {steps.map((st, idx) => {
              const isDone = idx < activeStepIdx;
              const isCurrent = idx === activeStepIdx;

              return (
                <div
                  key={idx}
                  className={`flex items-center gap-2.5 p-2 rounded-xl text-xs transition-all ${
                    isCurrent
                      ? 'bg-amber-500/10 border border-amber-500/30 text-amber-200 font-medium'
                      : isDone
                      ? 'text-slate-400 bg-slate-950/40 border border-slate-800/40'
                      : 'text-slate-600 opacity-60'
                  }`}
                >
                  {isDone ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : isCurrent ? (
                    <div className="w-4 h-4 rounded-full border-2 border-amber-400 border-t-transparent animate-spin shrink-0" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-slate-700 shrink-0" />
                  )}
                  <span className="truncate">{st}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* The Angry Explainer Quality Reassurance */}
        <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-start gap-3 relative z-10 text-xs text-slate-300">
          <Flame className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong className="text-amber-400 font-semibold">The Angry Explainer Guarantee: </strong>
            We are verifying textbook consensus so you don't get trapped by inverted ion gradients, sloppy $K_m$ definitions, or vague hand-waving answers.
          </p>
        </div>

        {onCancel && (
          <div className="text-center pt-1">
            <button
              type="button"
              onClick={onCancel}
              className="text-xs text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
            >
              Cancel and return
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
