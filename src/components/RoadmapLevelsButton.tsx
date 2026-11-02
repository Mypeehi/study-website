import React, { useState, useEffect } from 'react';
import {
  Layers,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Zap,
  Target,
  X,
  Flame,
  Award,
  HelpCircle,
  Map,
  List
} from 'lucide-react';
import { ExamMilestone } from '../types';
import { playCorrectSound, playStreakFlameSound, playIncorrectSound } from '../utils/audio';
import { DEFAULT_EXAM_PLAN } from '../utils/storage';
import { CosmicRoadmapLevelMap } from './CosmicRoadmapLevelMap';

interface RoadmapLevelsButtonProps {
  milestones?: ExamMilestone[];
  completedLevels?: number[];
  activeLevelIndex?: number;
  onSelectLevel?: (index: number) => void;
  onToggleCompleteLevel?: (index: number) => void;
  onStartStudyForLevel?: (milestone: ExamMilestone, levelIndex: number) => void;
  onViewFullRoadmap?: () => void;
  onOpenLevelPractice?: (index: number) => void;
  className?: string;
  isCompact?: boolean;
}

export const RoadmapLevelsButton: React.FC<RoadmapLevelsButtonProps> = ({
  milestones,
  completedLevels = [],
  activeLevelIndex = 0,
  onSelectLevel,
  onToggleCompleteLevel,
  onStartStudyForLevel,
  onViewFullRoadmap,
  onOpenLevelPractice,
  className = '',
  isCompact = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');

  // Guarantee we always have levels to display even if initial plan is pending
  const effectiveMilestones = (milestones && milestones.length > 0)
    ? milestones
    : DEFAULT_EXAM_PLAN.milestones;

  const totalLevels = effectiveMilestones.length;
  const completedCount = completedLevels.length;
  const currentLevelNum = Math.min(totalLevels, activeLevelIndex + 1);

  // Handle escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleOpenModal = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    playStreakFlameSound();
    setIsOpen(true);
  };

  const handleSelectLevel = (idx: number) => {
    onSelectLevel?.(idx);
    playStreakFlameSound();
    setIsOpen(false);
    onOpenLevelPractice?.(idx);
  };

  const handleToggleComplete = (e: React.MouseEvent, idx: number) => {
    e.stopPropagation();
    onToggleCompleteLevel?.(idx);
    playCorrectSound();
  };

  const handleStudy = (e: React.MouseEvent, ms: ExamMilestone, idx: number) => {
    e.stopPropagation();
    setIsOpen(false);
    onStartStudyForLevel?.(ms, idx);
  };

  const handleFullRoadmap = () => {
    setIsOpen(false);
    onViewFullRoadmap?.();
  };

  return (
    <>
      {/* THE ROADMAP LEVELS BUTTON (COMPACT OR FULL) */}
      {isCompact ? (
        <button
          type="button"
          onClick={handleOpenModal}
          className={`w-10 h-10 mx-auto rounded-xl bg-gradient-to-r from-cyan-950 via-slate-900 to-cyan-950 hover:from-cyan-900 hover:to-cyan-900 border-2 border-cyan-500/60 hover:border-cyan-400 text-cyan-200 flex items-center justify-center cursor-pointer transition-all shadow-md group relative shrink-0 ${className}`}
          title={`Roadmap Levels: Level ${currentLevelNum} of ${totalLevels} (Click to open)`}
        >
          <Layers className="w-5 h-5 text-cyan-300 group-hover:rotate-12 transition-transform" />
          <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-cyan-500 text-slate-950 font-black text-[9px] flex items-center justify-center border border-slate-950 shadow-sm">
            {currentLevelNum}
          </span>
        </button>
      ) : (
        <button
          type="button"
          onClick={handleOpenModal}
          className={`px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-950 via-slate-900 to-cyan-950 hover:from-cyan-900 hover:to-cyan-900 border-2 border-cyan-500/60 hover:border-cyan-400 text-cyan-200 text-xs font-bold transition-all shadow-lg flex items-center gap-2 cursor-pointer group shrink-0 ${className}`}
          title="Click to view AI Step-by-Step Study Roadmap Levels"
        >
          <div className="w-5 h-5 rounded-lg bg-cyan-500/25 border border-cyan-500/50 flex items-center justify-center text-cyan-300 shrink-0">
            <Layers className="w-3.5 h-3.5 text-cyan-300 group-hover:rotate-12 transition-transform" />
          </div>

          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <span className="font-extrabold text-cyan-100">Roadmap Levels</span>
            <span className="px-1.5 py-0.5 rounded-full bg-cyan-500/25 border border-cyan-500/40 text-cyan-300 font-mono-numbers text-[10px] font-bold">
              Level {currentLevelNum} of {totalLevels}
            </span>
            {completedCount > 0 && (
              <span className="text-[10px] text-emerald-400 font-mono-numbers font-bold">
                ({completedCount}✓)
              </span>
            )}
          </div>
        </button>
      )}

      {/* FIXED PORTAL MODAL (IMMUNE TO CLIPPING BY OVERFLOW-HIDDEN OR NAVBAR SCROLL) */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="bg-slate-950 border-2 border-cyan-500/40 rounded-3xl p-5 sm:p-7 max-w-4xl w-full shadow-2xl space-y-4 text-slate-200 relative overflow-hidden max-h-[92vh] flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300 shadow-md">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white font-display flex items-center gap-2">
                    <span>AI Study Roadmap Levels</span>
                    <span className="text-xs font-mono-numbers px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800">
                      {completedCount} / {totalLevels} Mastered
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Step-by-step phased mastery generated by AI for your exam
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* View Mode Toggle: Constellation Map vs List */}
                <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setViewMode('map')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      viewMode === 'map'
                        ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Map className="w-3.5 h-3.5" />
                    <span>Constellation Map</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('list')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      viewMode === 'list'
                        ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <List className="w-3.5 h-3.5" />
                    <span>Phase Details</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
                  title="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Body: Map View or Detailed List View */}
            {viewMode === 'map' ? (
              <div className="overflow-y-auto pr-1 flex-1">
                <CosmicRoadmapLevelMap
                  milestones={effectiveMilestones}
                  completedLevels={completedLevels}
                  activeLevelIndex={activeLevelIndex}
                  onSelectLevel={(idx) => onSelectLevel?.(idx)}
                  onToggleCompleteLevel={onToggleCompleteLevel}
                  onOpenLevelPractice={(idx) => {
                    setIsOpen(false);
                    onOpenLevelPractice?.(idx);
                  }}
                  onStartStudyForLevel={(ms, idx) => {
                    setIsOpen(false);
                    onStartStudyForLevel?.(ms, idx);
                  }}
                />
              </div>
            ) : (
              /* Scrollable Levels List */
              <div className="space-y-3 overflow-y-auto pr-1 flex-1">
              {effectiveMilestones.map((ms, idx) => {
                const levelNum = idx + 1;
                const isCompleted = completedLevels.includes(idx);
                const isSelected = activeLevelIndex === idx;
                const isCurrent = !isCompleted && (idx === 0 || completedLevels.includes(idx - 1));

                return (
                  <div
                    key={idx}
                    onClick={() => handleSelectLevel(idx)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer relative group text-left ${
                      isSelected
                        ? 'bg-slate-900 border-amber-500 shadow-lg shadow-amber-950/30 ring-1 ring-amber-500/40'
                        : isCompleted
                        ? 'bg-slate-950 border-emerald-500/40 hover:border-emerald-500/70 hover:bg-slate-900'
                        : isCurrent
                        ? 'bg-slate-950 border-cyan-500/50 hover:border-cyan-400 hover:bg-slate-900'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {/* Level Badge + Phase Info */}
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center font-mono-numbers font-bold text-xs shrink-0 shadow-sm ${
                            isCompleted
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                              : isSelected || isCurrent
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              : 'bg-slate-800 text-slate-400 border border-slate-700'
                          }`}
                        >
                          {isCompleted ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : `L${levelNum}`}
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider block">
                            Level {levelNum}: {ms.phase}
                          </span>
                          <h4 className="text-xs sm:text-sm font-bold text-white font-display">
                            {ms.title}
                          </h4>
                        </div>
                      </div>

                      <span className="text-xs font-mono-numbers font-semibold text-slate-400 px-2.5 py-0.5 rounded-full bg-slate-900 border border-slate-800 shrink-0">
                        {ms.dayRange}
                      </span>
                    </div>

                    {/* Focus Description */}
                    <p className="text-xs text-slate-300 leading-relaxed font-sans pl-10 mb-3">
                      {ms.focus}
                    </p>

                    {/* Action Items List */}
                    {ms.actionItems && ms.actionItems.length > 0 && (
                      <div className="pl-10 space-y-1 mb-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                            Level Mission Actions:
                          </span>
                          <span className="text-[10px] text-amber-400 font-semibold flex items-center gap-1">
                            <Sparkles className="w-3 h-3" /> Gamified Workbenches
                          </span>
                        </div>
                        <div className="space-y-1">
                          {ms.actionItems.map((action, aIdx) => (
                            <div key={aIdx} className="text-xs text-slate-300 flex items-start gap-1.5">
                              <span className="text-amber-400 font-bold shrink-0">·</span>
                              <span>{action}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Level Footer Controls */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pl-10 pt-2 border-t border-slate-800/80 text-xs">
                      <div className="flex items-center gap-1.5">
                        {isCompleted ? (
                          <span className="text-emerald-400 font-semibold flex items-center gap-1 text-[11px]">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Level Mastered (+150 XP)
                          </span>
                        ) : isCurrent ? (
                          <span className="text-cyan-400 font-semibold flex items-center gap-1 text-[11px] animate-pulse">
                            <Zap className="w-3.5 h-3.5" /> Current Mission
                          </span>
                        ) : (
                          <span className="text-slate-500 flex items-center gap-1 text-[11px]">
                            <Target className="w-3.5 h-3.5" /> Next Level Up
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {onToggleCompleteLevel && (
                          <button
                            type="button"
                            onClick={(e) => handleToggleComplete(e, idx)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer border ${
                              isCompleted
                                ? 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                                : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/25'
                            }`}
                          >
                            {isCompleted ? 'Mark Incomplete' : 'Complete (+150 XP) ✓'}
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsOpen(false);
                            onSelectLevel?.(idx);
                            onOpenLevelPractice?.(idx);
                          }}
                          className="px-3 py-1 rounded-lg bg-gradient-to-r from-cyan-500 to-amber-500 hover:from-cyan-400 hover:to-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1 transition-all cursor-pointer shadow-md"
                        >
                          <HelpCircle className="w-3 h-3 fill-slate-950" />
                          <span>Practice Questions</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>

                        {onStartStudyForLevel && (
                          <button
                            type="button"
                            onClick={(e) => handleStudy(e, ms, idx)}
                            className="px-3 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-bold text-xs flex items-center gap-1 transition-all cursor-pointer"
                          >
                            <Sparkles className="w-3 h-3 text-amber-400" />
                            <span>Study</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            )}

            {/* Modal Bottom Bar */}
            <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
              <span className="text-xs text-slate-400">
                Click any level to set as your active mission.
              </span>

              {onViewFullRoadmap && (
                <button
                  type="button"
                  onClick={handleFullRoadmap}
                  className="px-4 py-2 rounded-xl bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm"
                >
                  <span>Go to Full Step-by-Step Roadmap</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
