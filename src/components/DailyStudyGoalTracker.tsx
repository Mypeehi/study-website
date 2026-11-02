import React, { useState } from 'react';
import { Target, Clock, Flame, Check, Sparkles, Plus, Settings2, X, Zap, Trophy } from 'lucide-react';
import { DailyStudyGoal } from '../types';
import { playCorrectSound, playStreakFlameSound } from '../utils/audio';

export interface DailyStudyGoalTrackerProps {
  dailyStudyGoal?: DailyStudyGoal;
  onUpdateTargetMinutes?: (minutes: number) => void;
  onAddStudyMinutes?: (minutes: number) => void;
  variant?: 'desktop-bar' | 'mobile-header' | 'compact' | 'full';
  className?: string;
  onOpenTimer?: () => void;
}

export const DailyStudyGoalTracker: React.FC<DailyStudyGoalTrackerProps> = ({
  dailyStudyGoal,
  onUpdateTargetMinutes,
  onAddStudyMinutes,
  variant = 'desktop-bar',
  className = '',
  onOpenTimer,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMinutes, setSelectedMinutes] = useState(
    dailyStudyGoal?.targetMinutes || (dailyStudyGoal?.targetHours ? Math.round(dailyStudyGoal.targetHours * 60) : 90)
  );

  const targetMinutes = dailyStudyGoal?.targetMinutes || (dailyStudyGoal?.targetHours ? Math.round(dailyStudyGoal.targetHours * 60) : 90);
  const completedMinutes = dailyStudyGoal?.completedMinutes || 0;
  const progressPercent = Math.min(100, Math.round((completedMinutes / Math.max(1, targetMinutes)) * 100));
  const isGoalMet = completedMinutes >= targetMinutes;
  const remainingMinutes = Math.max(0, targetMinutes - completedMinutes);

  const handleSaveGoal = () => {
    if (onUpdateTargetMinutes) {
      onUpdateTargetMinutes(selectedMinutes);
    }
    playStreakFlameSound();
    setIsModalOpen(false);
  };

  const handleQuickAdd = (e: React.MouseEvent, minutes: number) => {
    e.stopPropagation();
    if (onAddStudyMinutes) {
      onAddStudyMinutes(minutes);
      playCorrectSound();
    }
  };

  // SVG Progress Ring calculations
  // Ring geometry
  const ringSize = variant === 'mobile-header' || variant === 'compact' ? 32 : 38;
  const strokeWidth = variant === 'mobile-header' || variant === 'compact' ? 3 : 3.5;
  const radius = (ringSize - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (circumference * progressPercent) / 100;

  // Preset options for modal
  const presets = [15, 30, 45, 60, 90, 120, 180];

  return (
    <>
      {/* DESKTOP BAR VARIANT */}
      {variant === 'desktop-bar' && (
        <div
          onClick={() => {
            setSelectedMinutes(targetMinutes);
            setIsModalOpen(true);
          }}
          className={`group flex items-center gap-3 px-3.5 py-1.5 rounded-2xl bg-slate-900/90 hover:bg-slate-900 border border-slate-800 hover:border-amber-500/40 transition-all duration-200 cursor-pointer shadow-md select-none ${
            isGoalMet
              ? 'ring-1 ring-emerald-500/30 hover:ring-emerald-400/50'
              : 'hover:ring-1 hover:ring-amber-500/30'
          } ${className}`}
          title={`Daily Study Goal: ${completedMinutes}/${targetMinutes} min (${progressPercent}%) - Click to configure`}
        >
          {/* Progress Ring with Center Icon/Text */}
          <div className="relative shrink-0 flex items-center justify-center">
            <svg
              width={ringSize}
              height={ringSize}
              className="-rotate-90 transform transition-transform group-hover:scale-105 duration-300"
            >
              {/* Background Track */}
              <circle
                cx={ringSize / 2}
                cy={ringSize / 2}
                r={radius}
                className="stroke-slate-800"
                strokeWidth={strokeWidth}
                fill="none"
              />
              {/* Progress Stroke */}
              <circle
                cx={ringSize / 2}
                cy={ringSize / 2}
                r={radius}
                className={`transition-all duration-700 ease-out ${
                  isGoalMet
                    ? 'stroke-emerald-400 drop-shadow-[0_0_6px_rgba(52,211,153,0.4)]'
                    : 'stroke-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.3)]'
                }`}
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="none"
              />
            </svg>

            {/* Icon inside the ring */}
            <div className="absolute inset-0 flex items-center justify-center">
              {isGoalMet ? (
                <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" />
              ) : (
                <Target className="w-3.5 h-3.5 text-amber-400 transition-colors group-hover:text-amber-300" />
              )}
            </div>
          </div>

          {/* Goal Label & Metric Info */}
          <div className="min-w-0 flex flex-col justify-center">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 group-hover:text-slate-300 transition-colors">
                Daily Study Goal
              </span>
              <span
                className={`inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-bold font-mono-numbers ${
                  isGoalMet
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                }`}
              >
                {isGoalMet ? '100% ✓' : `${progressPercent}%`}
              </span>
            </div>

            <div className="flex items-baseline gap-1 text-xs font-mono-numbers">
              <span className={`font-black ${isGoalMet ? 'text-emerald-300' : 'text-white'}`}>
                {completedMinutes}m
              </span>
              <span className="text-slate-500 text-[11px]">/ {targetMinutes}m</span>
              <span className="text-[10px] text-slate-400 ml-1 hidden lg:inline">
                {isGoalMet ? '· Target Achieved! 🎉' : `· ${remainingMinutes}m left`}
              </span>
            </div>
          </div>

          {/* Quick Action Button (+15m Log) */}
          {onAddStudyMinutes && (
            <button
              type="button"
              onClick={(e) => handleQuickAdd(e, 15)}
              className="ml-1 hidden xl:flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800/80 hover:bg-amber-500/20 text-slate-300 hover:text-amber-300 border border-slate-700/60 hover:border-amber-500/40 text-[10px] font-bold transition-all cursor-pointer shadow-sm shrink-0"
              title="Quick Log +15 minutes of study"
            >
              <Plus className="w-3 h-3 text-amber-400" />
              <span>+15m</span>
            </button>
          )}

          {/* Settings Icon Indicator */}
          <div className="text-slate-500 group-hover:text-amber-400 transition-colors shrink-0 ml-0.5">
            <Settings2 className="w-3.5 h-3.5" />
          </div>
        </div>
      )}

      {/* MOBILE HEADER VARIANT */}
      {variant === 'mobile-header' && (
        <button
          type="button"
          onClick={() => {
            setSelectedMinutes(targetMinutes);
            setIsModalOpen(true);
          }}
          className={`group flex items-center gap-2 px-2.5 py-1 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-amber-500/40 transition-all cursor-pointer shadow-sm select-none shrink-0 ${
            isGoalMet ? 'ring-1 ring-emerald-500/30' : ''
          } ${className}`}
          title={`Daily Study Goal: ${completedMinutes}/${targetMinutes}m (${progressPercent}%)`}
        >
          {/* Progress Ring */}
          <div className="relative shrink-0 flex items-center justify-center">
            <svg width={ringSize} height={ringSize} className="-rotate-90 transform">
              <circle
                cx={ringSize / 2}
                cy={ringSize / 2}
                r={radius}
                className="stroke-slate-800"
                strokeWidth={strokeWidth}
                fill="none"
              />
              <circle
                cx={ringSize / 2}
                cy={ringSize / 2}
                r={radius}
                className={`transition-all duration-700 ease-out ${
                  isGoalMet ? 'stroke-emerald-400' : 'stroke-amber-400'
                }`}
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="none"
              />
            </svg>

            <div className="absolute inset-0 flex items-center justify-center">
              {isGoalMet ? (
                <Check className="w-3 h-3 text-emerald-400 stroke-[3]" />
              ) : (
                <Target className="w-3 h-3 text-amber-400" />
              )}
            </div>
          </div>

          {/* Minutes & Percent */}
          <div className="text-left font-mono-numbers leading-tight min-w-0">
            <div className="flex items-center gap-1">
              <span className={`text-xs font-black ${isGoalMet ? 'text-emerald-300' : 'text-white'}`}>
                {completedMinutes}m
              </span>
              <span className="text-[10px] text-slate-500">/ {targetMinutes}m</span>
            </div>
            <div className="text-[9px] text-slate-400 font-sans truncate">
              {isGoalMet ? '✓ Done' : `${progressPercent}%`}
            </div>
          </div>
        </button>
      )}

      {/* COMPACT & FULL VARIANTS */}
      {(variant === 'compact' || variant === 'full') && (
        <div
          onClick={() => {
            setSelectedMinutes(targetMinutes);
            setIsModalOpen(true);
          }}
          className={`flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-amber-500/30 transition-all cursor-pointer ${className}`}
        >
          <div className="relative shrink-0 flex items-center justify-center">
            <svg width={ringSize} height={ringSize} className="-rotate-90 transform">
              <circle
                cx={ringSize / 2}
                cy={ringSize / 2}
                r={radius}
                className="stroke-slate-800"
                strokeWidth={strokeWidth}
                fill="none"
              />
              <circle
                cx={ringSize / 2}
                cy={ringSize / 2}
                r={radius}
                className={isGoalMet ? 'stroke-emerald-400' : 'stroke-amber-400'}
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="none"
              />
            </svg>
            <Target className="w-3 h-3 text-amber-400 absolute" />
          </div>

          <div className="text-xs font-mono-numbers">
            <span className="font-bold text-white">{completedMinutes}</span>
            <span className="text-slate-500"> / {targetMinutes}m</span>
            <span className="text-amber-400 ml-1 font-bold">({progressPercent}%)</span>
          </div>
        </div>
      )}

      {/* MODAL: SET TARGET STUDY MINUTES & QUICK LOG */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full shadow-2xl p-6 relative overflow-hidden space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-sm">
                  <Target className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-display">
                    Daily Study Goal Tracker
                  </h3>
                  <p className="text-xs text-slate-400">
                    Set target minutes and log active study time
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Visual Ring Overview Card */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="relative w-14 h-14 shrink-0 flex items-center justify-center">
                  <svg width="56" height="56" className="-rotate-90 transform">
                    <circle
                      cx="28"
                      cy="28"
                      r="22"
                      className="stroke-slate-800"
                      strokeWidth="5"
                      fill="none"
                    />
                    <circle
                      cx="28"
                      cy="28"
                      r="22"
                      className={`transition-all duration-700 ${
                        isGoalMet ? 'stroke-emerald-400' : 'stroke-amber-400'
                      }`}
                      strokeWidth="5"
                      strokeDasharray={138.2}
                      strokeDashoffset={138.2 - (138.2 * progressPercent) / 100}
                      strokeLinecap="round"
                      fill="none"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-xs font-black font-mono-numbers text-white leading-none">
                      {progressPercent}%
                    </span>
                  </div>
                </div>

                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Today's Progress
                  </div>
                  <div className="text-base font-black font-mono-numbers text-white flex items-baseline gap-1 mt-0.5">
                    <span className={isGoalMet ? 'text-emerald-400' : 'text-amber-400'}>
                      {completedMinutes} min
                    </span>
                    <span className="text-xs text-slate-500 font-medium">/ {targetMinutes} min target</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {isGoalMet
                      ? '🎉 Fantastic job! You hit today’s daily study target.'
                      : `⚡ ${remainingMinutes} more minutes needed to hit 100% completion.`}
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Log Action Buttons */}
            {onAddStudyMinutes && (
              <div className="space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                  Log Study Time Right Now:
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={(e) => handleQuickAdd(e, 15)}
                    className="py-2 px-3 rounded-xl bg-slate-800/80 hover:bg-amber-500/20 text-slate-200 hover:text-amber-300 border border-slate-700/80 hover:border-amber-500/40 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5 text-amber-400" />
                    <span>+15 min</span>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleQuickAdd(e, 30)}
                    className="py-2 px-3 rounded-xl bg-slate-800/80 hover:bg-amber-500/20 text-slate-200 hover:text-amber-300 border border-slate-700/80 hover:border-amber-500/40 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5 text-amber-400" />
                    <span>+30 min</span>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleQuickAdd(e, 45)}
                    className="py-2 px-3 rounded-xl bg-slate-800/80 hover:bg-amber-500/20 text-slate-200 hover:text-amber-300 border border-slate-700/80 hover:border-amber-500/40 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5 text-amber-400" />
                    <span>+45 min</span>
                  </button>
                </div>
              </div>
            )}

            {/* Target Duration Selector */}
            <div className="space-y-3 pt-1 border-t border-slate-800/80">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Target Daily Study Duration
                </span>
                <span className="text-xs font-bold font-mono-numbers text-amber-400">
                  {selectedMinutes} minutes ({(selectedMinutes / 60).toFixed(1)} hrs)
                </span>
              </div>

              {/* Preset Buttons */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {presets.map((min) => (
                  <button
                    key={min}
                    type="button"
                    onClick={() => setSelectedMinutes(min)}
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-bold font-mono-numbers transition-all cursor-pointer ${
                      selectedMinutes === min
                        ? 'bg-amber-500 text-slate-950 shadow-md ring-2 ring-amber-400/40'
                        : 'bg-slate-950 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    {min}m
                  </button>
                ))}
              </div>

              {/* Slider */}
              <div className="space-y-1">
                <input
                  type="range"
                  min="10"
                  max="240"
                  step="5"
                  value={selectedMinutes}
                  onChange={(e) => setSelectedMinutes(parseInt(e.target.value, 10))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono-numbers">
                  <span>10m</span>
                  <span>1 hr</span>
                  <span>2 hrs</span>
                  <span>3 hrs</span>
                  <span>4 hrs</span>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveGoal}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-xs transition-all shadow-md cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                <span>Save Daily Target</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
