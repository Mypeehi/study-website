import React, { useState } from 'react';
import {
  Layers,
  CheckCircle2,
  Circle,
  Sparkles,
  ArrowRight,
  Flame,
  Award,
  ChevronDown,
  ChevronUp,
  Clock,
  Target,
  Zap,
  Lock,
  Unlock,
  HelpCircle,
  Map,
  LayoutGrid
} from 'lucide-react';
import { ExamMilestone } from '../types';
import { playCorrectSound, playStreakFlameSound } from '../utils/audio';
import { RoadmapActionItemsDeck } from './RoadmapActionItemSection';
import { CosmicRoadmapLevelMap } from './CosmicRoadmapLevelMap';

interface RoadmapLevelsBarProps {
  milestones: ExamMilestone[];
  completedLevels: number[];
  activeLevelIndex: number;
  onSelectLevel: (index: number) => void;
  onToggleCompleteLevel: (index: number) => void;
  onStartStudyForLevel?: (milestone: ExamMilestone, levelIndex: number) => void;
  onOpenLevelPractice?: (levelIndex: number) => void;
  onRecordXp?: (amount: number) => void;
}

export const RoadmapLevelsBar: React.FC<RoadmapLevelsBarProps> = ({
  milestones,
  completedLevels,
  activeLevelIndex,
  onSelectLevel,
  onToggleCompleteLevel,
  onStartStudyForLevel,
  onOpenLevelPractice,
  onRecordXp,
}) => {
  const [expandedLevel, setExpandedLevel] = useState<number | null>(activeLevelIndex);
  const [checkedActions, setCheckedActions] = useState<Record<string, boolean>>({});
  const [displayMode, setDisplayMode] = useState<'map' | 'cards'>('map');

  const totalLevels = milestones.length;
  const completedCount = completedLevels.length;
  const progressPercent = totalLevels > 0 ? Math.round((completedCount / totalLevels) * 100) : 0;

  const handleToggleAction = (levelIdx: number, actionIdx: number) => {
    const key = `${levelIdx}-${actionIdx}`;
    setCheckedActions(prev => {
      const next = !prev[key];
      if (next) playStreakFlameSound();
      return { ...prev, [key]: next };
    });
  };

  const handleLevelButtonClick = (idx: number) => {
    onSelectLevel(idx);
    setExpandedLevel(expandedLevel === idx ? null : idx);
  };

  const handleCompleteClick = (e: React.MouseEvent, idx: number) => {
    e.stopPropagation();
    onToggleCompleteLevel(idx);
    playCorrectSound();
  };

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 space-y-6 shadow-2xl relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4 relative z-10">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-bold uppercase tracking-wider">
            <Layers className="w-3.5 h-3.5" />
            <span>AI Roadmap Level Progression</span>
          </div>
          <h3 className="text-lg sm:text-xl font-bold font-display text-white flex items-center gap-2">
            <span>Step-by-Step Study Levels</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono-numbers">
              {completedCount} / {totalLevels} Mastered
            </span>
          </h3>
          <p className="text-xs text-slate-400">
            Conquer each AI-tailored level sequentially to systematically build exam mastery.
          </p>
        </div>

        {/* Overall Roadmap Progress Bar & View Toggle */}
        <div className="flex flex-col sm:items-end gap-2.5 shrink-0">
          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 p-1 rounded-xl shadow-inner">
            <button
              type="button"
              onClick={() => setDisplayMode('map')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                displayMode === 'map'
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Map className="w-3.5 h-3.5" />
              <span>Constellation Map</span>
            </button>
            <button
              type="button"
              onClick={() => setDisplayMode('cards')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                displayMode === 'cards'
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Card Grid</span>
            </button>
          </div>

          <div className="w-full sm:w-48">
            <div className="flex items-center sm:justify-end gap-2 text-xs font-mono-numbers mb-1">
              <span className="text-slate-400 font-semibold">Mastery:</span>
              <span className={`font-bold ${progressPercent === 100 ? 'text-emerald-400' : 'text-amber-400'}`}>
                {progressPercent}%
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden p-0.5 border border-slate-700/50">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-amber-400 to-emerald-400 transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* INTERACTIVE LEVEL VIEW: COSMIC MAP (SCREENSHOT STYLE) OR CARD GRID */}
      {displayMode === 'map' ? (
        <div className="relative z-10">
          <CosmicRoadmapLevelMap
            milestones={milestones}
            completedLevels={completedLevels}
            activeLevelIndex={activeLevelIndex}
            onSelectLevel={(idx) => {
              onSelectLevel(idx);
              setExpandedLevel(idx);
            }}
            onToggleCompleteLevel={onToggleCompleteLevel}
            onOpenLevelPractice={onOpenLevelPractice}
            onStartStudyForLevel={onStartStudyForLevel}
            showCardDetails={false}
          />
        </div>
      ) : (
        /* INTERACTIVE LEVEL BUTTONS TRACK (CARD GRID) */
        <div className="relative z-10">
          {/* Horizontal connector line for larger screens */}
          <div className="hidden lg:block absolute top-7 left-12 right-12 h-1 bg-slate-800 z-0" />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 relative z-10">
            {milestones.map((ms, idx) => {
              const levelNum = idx + 1;
              const isCompleted = completedLevels.includes(idx);
              const isSelected = activeLevelIndex === idx;
              const isCurrent = !isCompleted && (idx === 0 || completedLevels.includes(idx - 1));

            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleLevelButtonClick(idx)}
                className={`text-left p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer relative group flex flex-col justify-between ${
                  isSelected
                    ? 'bg-slate-900 border-amber-500/80 shadow-lg shadow-amber-950/30 ring-1 ring-amber-500/40'
                    : isCompleted
                    ? 'bg-slate-950/90 border-emerald-500/40 hover:border-emerald-500/70 hover:bg-slate-900'
                    : isCurrent
                    ? 'bg-slate-950/90 border-amber-500/40 hover:border-amber-500/70 hover:bg-slate-900'
                    : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                {/* Level Badge + Status */}
                <div className="flex items-center justify-between w-full mb-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-mono-numbers font-black text-sm shadow-md transition-transform group-hover:scale-105 ${
                        isCompleted
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                          : isSelected || isCurrent
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                    >
                      {isCompleted ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : `L${levelNum}`}
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-wider block text-slate-400">
                        {ms.phase || `Level ${levelNum}`}
                      </span>
                      <span className="text-xs font-bold text-white font-display line-clamp-1">
                        {ms.title}
                      </span>
                    </div>
                  </div>

                  {/* Day range pill */}
                  <span className="text-[10px] font-mono-numbers font-semibold px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-slate-400 shrink-0">
                    {ms.dayRange}
                  </span>
                </div>

                {/* Level Focus Teaser */}
                <p className="text-xs text-slate-300 font-sans line-clamp-2 mb-3 leading-relaxed">
                  {ms.focus}
                </p>

                {/* Card Footer: Status indicator & Expand toggle */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 w-full text-[11px]">
                  <div className="flex items-center gap-1.5 font-medium">
                    {isCompleted ? (
                      <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Mastered (+150 XP)</span>
                      </span>
                    ) : isCurrent ? (
                      <span className="text-amber-400 flex items-center gap-1 font-semibold animate-pulse">
                        <Zap className="w-3.5 h-3.5" />
                        <span>Active Mission</span>
                      </span>
                    ) : (
                      <span className="text-slate-500 flex items-center gap-1">
                        <Target className="w-3.5 h-3.5" />
                        <span>Upcoming</span>
                      </span>
                    )}
                  </div>

                  <span className="text-slate-400 group-hover:text-amber-400 flex items-center gap-0.5 font-semibold transition-colors">
                    {expandedLevel === idx ? 'Close' : 'View Level'}
                    {expandedLevel === idx ? (
                      <ChevronUp className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
      )}

      {/* EXPANDED LEVEL DETAILS PANEL */}
      {expandedLevel !== null && milestones[expandedLevel] && (() => {
        const ms = milestones[expandedLevel];
        const levelIdx = expandedLevel;
        const levelNum = levelIdx + 1;
        const isCompleted = completedLevels.includes(levelIdx);

        return (
          <div className="bg-slate-950 border-2 border-amber-500/30 rounded-2xl p-5 sm:p-6 space-y-5 animate-fadeIn shadow-2xl relative z-10">
            {/* Header row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-bold font-mono-numbers text-xs">
                    LEVEL {levelNum} MISSION
                  </span>
                  <span className="text-xs text-slate-400 font-mono-numbers">
                    {ms.dayRange}
                  </span>
                </div>
                <h4 className="text-base sm:text-lg font-bold font-display text-white mt-1">
                  {ms.title}
                </h4>
              </div>

              {/* Complete Level Button */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={e => handleCompleteClick(e, levelIdx)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm ${
                    isCompleted
                      ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40'
                      : 'bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-slate-950 shadow-md'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isCompleted ? 'Marked Mastered (Undo)' : `Mark Level ${levelNum} Mastered (+150 XP)`}</span>
                </button>
              </div>
            </div>

            {/* Focus description */}
            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider block">
                Level Objective & Focus:
              </span>
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-sans">
                {ms.focus}
              </p>
            </div>

            {/* Dedicated Interactive Gamified Sections for Each Action Item */}
            <RoadmapActionItemsDeck
              actionItems={ms.actionItems}
              levelIndex={levelIdx}
              levelTitle={ms.title}
              levelPhase={ms.phase}
              checkedActions={checkedActions}
              onToggleAction={handleToggleAction}
              onRecordXp={onRecordXp}
              onStartStudySession={() => onStartStudyForLevel?.(ms, levelIdx)}
              onOpenLevelPractice={() => onOpenLevelPractice?.(levelIdx)}
            />

            {/* Action Bar with buttons on the left side */}
            <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-800/80">
              <div className="flex flex-wrap items-center justify-start gap-2.5">
                {onOpenLevelPractice && (
                  <button
                    type="button"
                    onClick={() => onOpenLevelPractice(levelIdx)}
                    className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-amber-500 hover:from-cyan-400 hover:to-amber-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all"
                  >
                    <HelpCircle className="w-3.5 h-3.5 fill-slate-950" />
                    <span>Practice Level {levelNum} Exam Questions</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}

                {onStartStudyForLevel && (
                  <button
                    type="button"
                    onClick={() => onStartStudyForLevel(ms, levelIdx)}
                    className="w-full sm:w-auto px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-extrabold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Study Session</span>
                  </button>
                )}
              </div>

              <span className="text-xs text-slate-400">
                Tip: Complete these actions daily to crush Level {levelNum}.
              </span>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
