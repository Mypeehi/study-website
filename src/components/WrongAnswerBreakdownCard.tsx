import React from 'react';
import { XCircle, CheckCircle2, AlertTriangle, Target, Lightbulb, Flame } from 'lucide-react';
import { AnswerExplanation } from '../utils/answerExplanation';

interface WrongAnswerBreakdownCardProps {
  explanation: AnswerExplanation;
  compact?: boolean;
}

export const WrongAnswerBreakdownCard: React.FC<WrongAnswerBreakdownCardProps> = ({
  explanation,
  compact = false,
}) => {
  if (explanation.isCorrect) {
    return (
      <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-100 space-y-2 animate-fadeIn shadow-md">
        <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Correct Answer Verified (+15 XP)</span>
        </div>
        <div className="text-xs sm:text-sm text-slate-200 leading-relaxed font-sans">
          <strong className="text-emerald-300">Option {explanation.correctLetter}: </strong>
          {explanation.correctText}
        </div>
        <p className="text-xs text-slate-300 leading-relaxed pt-1 border-t border-emerald-500/20">
          {explanation.whyCorrect}
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-3 animate-fadeIn ${compact ? 'mt-3' : 'mt-4'}`}>
      {/* 1. WHY PICKED IS WRONG (Red / Rose card) */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-rose-950/40 border border-rose-500/50 text-rose-100 space-y-2 shadow-inner">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-rose-500/20 pb-2">
          <div className="flex items-center gap-2 text-xs font-bold text-rose-400 uppercase tracking-wider">
            <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>Why Your Choice (Option {explanation.pickedLetter}) Is Wrong:</span>
          </div>
          <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/30">
            {explanation.fallacyTag}
          </span>
        </div>

        <div className="text-xs text-rose-200/90 font-medium italic bg-rose-950/60 p-2.5 rounded-xl border border-rose-500/30">
          <span className="font-bold text-rose-300 not-italic uppercase text-[10px] block mb-0.5">
            Your Selected Answer:
          </span>
          "{explanation.pickedText}"
        </div>

        <div className="text-xs sm:text-sm text-slate-200 leading-relaxed font-sans pt-0.5">
          <p className="leading-relaxed text-slate-200">
            {explanation.whyPickedWrong}
          </p>
        </div>
      </div>

      {/* 2. WHY CORRECT IS RIGHT (Emerald / Green card) */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/50 text-emerald-100 space-y-2 shadow-inner">
        <div className="flex items-center justify-between gap-2 border-b border-emerald-500/20 pb-2">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Why Option {explanation.correctLetter} Is The True Answer:</span>
          </div>
          <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            Target Principle
          </span>
        </div>

        <div className="text-xs text-emerald-200/90 font-medium bg-emerald-950/50 p-2.5 rounded-xl border border-emerald-500/30">
          <span className="font-bold text-emerald-300 uppercase text-[10px] block mb-0.5">
            Indisputable Correct Mechanism:
          </span>
          "{explanation.correctText}"
        </div>

        <div className="text-xs sm:text-sm text-slate-200 leading-relaxed font-sans pt-0.5">
          <p className="leading-relaxed text-slate-200">
            {explanation.whyCorrect}
          </p>
        </div>
      </div>

      {/* 3. EXAMINER TRAP TACTICAL TAKEAWAY (Amber card) */}
      {explanation.trapWarning && (
        <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/40 text-xs text-amber-200/90 flex items-start gap-2.5 leading-relaxed shadow-sm">
          <Target className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <strong className="text-amber-300 font-bold uppercase tracking-wider text-[11px] block">
              Examiner's Tactical Warning:
            </strong>
            <p className="text-slate-300 text-xs leading-relaxed">
              {explanation.trapWarning}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
