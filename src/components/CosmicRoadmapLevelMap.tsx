import React, { useState, useMemo } from 'react';
import {
  Play,
  Lock,
  CheckCircle2,
  Sparkles,
  Zap,
  Target,
  ArrowRight,
  HelpCircle,
  BookOpen,
  X,
  Layers,
  ChevronRight,
  Info
} from 'lucide-react';
import { ExamMilestone } from '../types';
import { playCorrectSound, playStreakFlameSound } from '../utils/audio';

interface CosmicRoadmapLevelMapProps {
  milestones: ExamMilestone[];
  completedLevels: number[];
  activeLevelIndex: number;
  onSelectLevel: (index: number) => void;
  onToggleCompleteLevel?: (index: number) => void;
  onOpenLevelPractice?: (index: number) => void;
  onStartStudyForLevel?: (milestone: ExamMilestone, index: number) => void;
  className?: string;
  showCardDetails?: boolean;
}

// Red stickman character standing on top of the active level node (matching the user's screenshot)
const RedStickmanAvatar: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    viewBox="0 0 36 46"
    className={`w-8 h-10 pointer-events-none drop-shadow-[0_0_8px_rgba(244,63,94,0.7)] ${className}`}
    fill="none"
    stroke="#f43f5e"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {/* Head */}
    <circle cx="18" cy="8" r="5.5" />
    {/* Subtle smiling / determined face line */}
    <path d="M15 8h.5 M20.5 8h.5" stroke="#f43f5e" strokeWidth="1.8" />
    {/* Torso */}
    <line x1="18" y1="13.5" x2="18" y2="29" />
    {/* Arms */}
    <line x1="18" y1="19" x2="8" y2="24" />
    <line x1="18" y1="19" x2="28" y2="24" />
    {/* Legs planted firmly on the circular node */}
    <line x1="18" y1="29" x2="10.5" y2="44" />
    <line x1="18" y1="29" x2="25.5" y2="44" />
  </svg>
);

export const CosmicRoadmapLevelMap: React.FC<CosmicRoadmapLevelMapProps> = ({
  milestones,
  completedLevels,
  activeLevelIndex,
  onSelectLevel,
  onToggleCompleteLevel,
  onOpenLevelPractice,
  onStartStudyForLevel,
  className = '',
  showCardDetails = true,
}) => {
  const [selectedNodeIdx, setSelectedNodeIdx] = useState<number>(activeLevelIndex);
  const [hoveredNodeIdx, setHoveredNodeIdx] = useState<number | null>(null);

  const totalLevels = milestones.length;

  // Compute winding node positions (percentages in 0..100)
  // Replicating the screenshot's winding trajectory:
  // Starts bottom-left -> curves mid-right -> curves center-left -> curves top-right
  const nodePositions = useMemo(() => {
    if (totalLevels === 0) return [];
    if (totalLevels === 1) return [{ x: 50, y: 50 }];
    if (totalLevels === 2) return [{ x: 25, y: 75 }, { x: 75, y: 25 }];
    if (totalLevels === 3) return [{ x: 20, y: 80 }, { x: 55, y: 50 }, { x: 85, y: 20 }];
    if (totalLevels === 4) {
      return [
        { x: 18, y: 84 }, // Level 1 (bottom left)
        { x: 70, y: 64 }, // Level 2 (mid right)
        { x: 48, y: 38 }, // Level 3 (mid center)
        { x: 86, y: 16 }, // Level 4 (top right - active in screenshot)
      ];
    }

    // Dynamic serpentine calculation for 5+ milestones
    return milestones.map((_, idx) => {
      const progress = idx / (totalLevels - 1);
      // y descends from 84% down to 16%
      const y = 84 - progress * 68;
      // x alternates in a meander
      let x = 50;
      if (idx % 2 === 0) {
        x = 22 + (idx / totalLevels) * 20;
      } else {
        x = 78 - (idx / totalLevels) * 15;
      }
      // Ensure top node lands near top-right like screenshot
      if (idx === totalLevels - 1) {
        x = 86;
        return { x, y: 16 };
      }
      return { x, y };
    });
  }, [totalLevels, milestones]);

  // Build SVG path string connecting node positions with smooth bezier curves
  const pathD = useMemo(() => {
    if (nodePositions.length < 2) return '';
    let d = `M ${nodePositions[0].x} ${nodePositions[0].y}`;
    for (let i = 0; i < nodePositions.length - 1; i++) {
      const p0 = nodePositions[i];
      const p1 = nodePositions[i + 1];
      // Control points for smooth horizontal S-curve meander
      const dx = p1.x - p0.x;
      const dy = p1.y - p0.y;
      const cp1x = p0.x + dx * 0.5;
      const cp1y = p0.y + dy * 0.1;
      const cp2x = p1.x - dx * 0.2;
      const cp2y = p1.y - dy * 0.5;
      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p1.x} ${p1.y}`;
    }
    return d;
  }, [nodePositions]);

  // Generate deterministic stars for starry space background
  const stars = useMemo(() => {
    return Array.from({ length: 45 }, (_, i) => {
      // pseudo-random distribution
      const x = (i * 37) % 97 + 1.5;
      const y = (i * 53) % 95 + 2.5;
      const size = (i % 4 === 0) ? 2 : (i % 3 === 0) ? 1.5 : 1;
      const opacity = 0.25 + ((i * 19) % 70) / 100;
      const isCyan = i % 5 === 0;
      return { x, y, size, opacity, isCyan };
    });
  }, []);

  const handleNodeClick = (idx: number) => {
    setSelectedNodeIdx(idx);
    onSelectLevel(idx);
    playStreakFlameSound();
  };

  const activeMilestone = milestones[selectedNodeIdx] || milestones[activeLevelIndex] || milestones[0];
  const isSelectedCompleted = completedLevels.includes(selectedNodeIdx);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 1. COSMIC LEVEL MAP CANVAS (EXACT MATCH TO USER SCREENSHOT) */}
      <div className="relative w-full h-[400px] sm:h-[450px] md:h-[480px] bg-[#030712] rounded-3xl border border-slate-800/80 overflow-hidden shadow-2xl select-none">
        {/* Ambient Cosmic Background Nebula Lighting */}
        <div className="absolute inset-0 bg-radial-[at_85%_18%] from-cyan-500/20 via-transparent to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-radial-[at_15%_85%] from-blue-950/40 via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-cyan-950/20 rounded-full blur-3xl pointer-events-none" />

        {/* Ambient Twinkling Stars */}
        <div className="absolute inset-0 pointer-events-none">
          {stars.map((star, i) => (
            <div
              key={i}
              className={`absolute rounded-full transition-opacity duration-1000 ${
                star.isCyan ? 'bg-cyan-300' : 'bg-white'
              }`}
              style={{
                left: `${star.x}%`,
                top: `${star.y}%`,
                width: `${star.size}px`,
                height: `${star.size}px`,
                opacity: star.opacity,
                boxShadow: star.isCyan ? '0 0 6px rgba(34, 211, 238, 0.8)' : undefined,
              }}
            />
          ))}
        </div>

        {/* SCREENSHOT DETAIL: Floating Glowing Cyan Ring (near the top-middle) */}
        <div
          className="absolute pointer-events-none rounded-full border-2 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.8),inset_0_0_8px_rgba(6,182,212,0.5)] animate-pulse"
          style={{
            left: '58%',
            top: '26%',
            width: '26px',
            height: '26px',
          }}
        />

        {/* SCREENSHOT DETAIL: Small Bright Cyan Star Accent */}
        <div
          className="absolute pointer-events-none rounded-full bg-cyan-400 shadow-[0_0_10px_#22d3ee]"
          style={{
            left: '54%',
            top: '21%',
            width: '4px',
            height: '4px',
          }}
        />

        {/* SVG Meandering Constellation Path */}
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="absolute inset-0 w-full h-full pointer-events-none z-10"
        >
          <defs>
            {/* Glowing trajectory gradient */}
            <linearGradient id="cosmicTrailGlow" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.3" />
              <stop offset="60%" stopColor="#22d3ee" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.9" />
            </linearGradient>

            {/* Glowing arc filter */}
            <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="1.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* SCREENSHOT DETAIL: Faint green trajectory arc shooting near the active top node */}
          <path
            d="M 60 10 C 72 12, 80 14, 98 17"
            fill="none"
            stroke="rgba(52, 211, 153, 0.45)"
            strokeWidth="0.8"
            filter="url(#neonGlow)"
          />

          {/* Background glowing haze under path */}
          <path
            d={pathD}
            fill="none"
            stroke="rgba(6, 182, 212, 0.15)"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* SCREENSHOT DETAIL: Main winding dashed path */}
          <path
            d={pathD}
            fill="none"
            stroke="rgba(148, 163, 184, 0.35)"
            strokeWidth="0.6"
            strokeDasharray="1.2 1.8"
            strokeLinecap="round"
          />

          {/* Illuminated section leading up to the active level */}
          <path
            d={pathD}
            fill="none"
            stroke="url(#cosmicTrailGlow)"
            strokeWidth="0.8"
            strokeDasharray="1.2 1.8"
            strokeLinecap="round"
            opacity="0.8"
          />
        </svg>

        {/* INTERACTIVE LEVEL NODES */}
        <div className="absolute inset-0 z-20">
          {milestones.map((ms, idx) => {
            const pos = nodePositions[idx] || { x: 50, y: 50 };
            const isCompleted = completedLevels.includes(idx);
            const isCurrentActive = activeLevelIndex === idx;
            const isSelected = selectedNodeIdx === idx;
            const isHovered = hoveredNodeIdx === idx;

            // In our gamified logic, a level is unlocked if it's completed, active, or level 0
            const isUnlocked = isCompleted || isCurrentActive || idx === 0 || completedLevels.includes(idx - 1);

            return (
              <div
                key={idx}
                className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
                style={{
                  left: `${pos.x}%`,
                  top: `${pos.y}%`,
                }}
                onClick={() => handleNodeClick(idx)}
                onMouseEnter={() => setHoveredNodeIdx(idx)}
                onMouseLeave={() => setHoveredNodeIdx(null)}
              >
                {/* 1. ACTIVE NODE (SCREENSHOT: Bright glowing cyan circle with Play icon and red stickman on top) */}
                {isCurrentActive ? (
                  <div className="relative flex flex-col items-center">
                    {/* RED STICKMAN CHARACTER AVATAR STANDING ON TOP */}
                    <div className="absolute -top-9 z-30 transition-transform duration-300 group-hover:scale-110">
                      <RedStickmanAvatar className="animate-bounce" />
                    </div>

                    {/* Radial Outer Glow Bloom (intense cyan halo) */}
                    <div className="absolute inset-0 -m-3 rounded-full bg-cyan-400/40 blur-xl animate-pulse pointer-events-none" />
                    <div className="absolute inset-0 -m-6 rounded-full bg-cyan-500/25 blur-2xl pointer-events-none" />

                    {/* The Active Cyan Play Circle */}
                    <button
                      type="button"
                      className="w-13 h-13 sm:w-15 sm:h-15 rounded-full bg-gradient-to-tr from-cyan-400 to-cyan-300 text-slate-950 flex items-center justify-center shadow-[0_0_35px_8px_rgba(6,182,212,0.9),0_0_70px_20px_rgba(6,182,212,0.45)] border-2 border-white/60 hover:scale-105 active:scale-95 transition-all cursor-pointer relative z-10"
                      title={`Level ${idx + 1}: ${ms.title} (Active Level Mission)`}
                    >
                      {/* Black Play Arrow Icon */}
                      <Play className="w-6 h-6 sm:w-7 sm:h-7 fill-slate-950 text-slate-950 ml-0.5" />
                    </button>

                    {/* Level Number Pill Badge */}
                    <div className="absolute -bottom-6 whitespace-nowrap z-20">
                      <span className="px-2 py-0.5 rounded-full bg-slate-950/90 text-cyan-300 border border-cyan-500/50 text-[10px] font-bold font-mono-numbers shadow-lg flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                        Level {idx + 1}
                      </span>
                    </div>
                  </div>
                ) : isCompleted ? (
                  /* 2. COMPLETED NODE (Mastered Level with emerald / cyan glow) */
                  <div className="relative flex flex-col items-center">
                    <button
                      type="button"
                      className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-slate-950/90 border-2 border-emerald-400 text-emerald-400 flex items-center justify-center shadow-[0_0_20px_rgba(52,211,153,0.5)] hover:scale-110 active:scale-95 transition-all cursor-pointer z-10 group-hover:border-emerald-300"
                      title={`Level ${idx + 1}: Mastered`}
                    >
                      <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400 fill-emerald-500/20" />
                    </button>

                    <div className="absolute -bottom-6 whitespace-nowrap z-20">
                      <span className="px-2 py-0.5 rounded-full bg-slate-950/90 text-emerald-400 border border-emerald-500/40 text-[10px] font-bold font-mono-numbers shadow-md">
                        L{idx + 1} ✓
                      </span>
                    </div>
                  </div>
                ) : (
                  /* 3. LOCKED NODE (SCREENSHOT: Dark circular disc with padlock icon) */
                  <div className="relative flex flex-col items-center">
                    <button
                      type="button"
                      className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#141b2d] border border-slate-700/80 text-slate-400 flex items-center justify-center shadow-lg hover:border-slate-500 hover:text-slate-300 active:scale-95 transition-all cursor-pointer z-10"
                      title={`Level ${idx + 1}: Locked (Complete previous levels)`}
                    >
                      {/* Padlock Icon */}
                      <Lock className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-slate-400 group-hover:text-cyan-400 transition-colors" />
                    </button>

                    <div className="absolute -bottom-6 whitespace-nowrap z-20">
                      <span className="px-2 py-0.5 rounded-full bg-slate-950/80 text-slate-400 border border-slate-800 text-[10px] font-bold font-mono-numbers">
                        Level {idx + 1}
                      </span>
                    </div>
                  </div>
                )}

                {/* Hover Quick Tooltip */}
                {(isHovered || isSelected) && (
                  <div
                    className={`absolute z-40 w-52 sm:w-64 p-3 rounded-xl bg-slate-950/95 border border-cyan-500/40 shadow-2xl backdrop-blur-md pointer-events-none transition-all ${
                      pos.y > 60 ? 'bottom-16' : 'top-16'
                    } left-1/2 -translate-x-1/2 text-left`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                        {ms.phase}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono-numbers">
                        {ms.dayRange}
                      </span>
                    </div>
                    <h5 className="text-xs sm:text-sm font-bold text-white line-clamp-2 leading-tight">
                      {ms.title}
                    </h5>
                    <p className="text-[11px] text-slate-300 mt-1 line-clamp-2 leading-relaxed">
                      {ms.focus}
                    </p>
                    <div className="mt-2 pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
                      <span>Click to inspect</span>
                      <span className="text-cyan-400 font-semibold flex items-center gap-0.5">
                        Select Mission <ChevronRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Top-Right HUD Badge & Level Indicator */}
        <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-slate-900/90 text-cyan-300 border border-cyan-500/40 backdrop-blur-md shadow-lg flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            Constellation Level System
          </span>
        </div>

        <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
          <span className="text-xs font-mono-numbers text-slate-300 px-3 py-1 rounded-full bg-slate-900/80 border border-slate-700/60 backdrop-blur-md shadow-md">
            Level {activeLevelIndex + 1} of {totalLevels} Active
          </span>
        </div>

        {/* Bottom Legend */}
        <div className="absolute bottom-3 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400 pointer-events-none">
          <div className="flex items-center gap-4 bg-slate-950/70 backdrop-blur-sm px-3 py-1 rounded-full border border-slate-800">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-cyan-400 shadow-[0_0_6px_#22d3ee] inline-block" />
              <strong className="text-cyan-300 font-semibold">Active Node</strong>
            </span>
            <span className="flex items-center gap-1.5">
              <Lock className="w-3 h-3 text-slate-400 inline-block" />
              <span>Locked</span>
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3 h-3 text-emerald-400 inline-block" />
              <span className="text-emerald-400 font-semibold">Mastered</span>
            </span>
          </div>
          <span className="hidden sm:inline bg-slate-950/70 backdrop-blur-sm px-3 py-1 rounded-full border border-slate-800 text-[10px]">
            Follow the winding trail to conquer all exam phases
          </span>
        </div>
      </div>

      {/* 2. SELECTED LEVEL DETAIL CARD (EXPANDED WORKBENCH & PRACTICE LAUNCHER) */}
      {showCardDetails && activeMilestone && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                  Level {selectedNodeIdx + 1}: {activeMilestone.phase}
                </span>
                <span className="text-xs text-slate-400 font-mono-numbers">
                  {activeMilestone.dayRange}
                </span>
                {isSelectedCompleted && (
                  <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                    <CheckCircle2 className="w-3 h-3" /> Mastered
                  </span>
                )}
              </div>
              <h4 className="text-base sm:text-lg font-bold text-white font-display">
                {activeMilestone.title}
              </h4>
            </div>

            {/* Action Buttons for Selected Level */}
            <div className="flex flex-wrap items-center gap-2">
              {onToggleCompleteLevel && (
                <button
                  type="button"
                  onClick={() => onToggleCompleteLevel(selectedNodeIdx)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                    isSelectedCompleted
                      ? 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                      : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/25'
                  }`}
                >
                  {isSelectedCompleted ? 'Mark Incomplete' : 'Complete (+150 XP) ✓'}
                </button>
              )}

              {onOpenLevelPractice && (
                <button
                  type="button"
                  onClick={() => onOpenLevelPractice(selectedNodeIdx)}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-amber-500 hover:from-cyan-400 hover:to-amber-400 text-slate-950 font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-lg shadow-cyan-500/20 transition-all cursor-pointer active:scale-95"
                >
                  <Play className="w-4 h-4 fill-slate-950" />
                  <span>Play Level Mission Drill</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
                </button>
              )}

              {onStartStudyForLevel && (
                <button
                  type="button"
                  onClick={() => onStartStudyForLevel(activeMilestone, selectedNodeIdx)}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Study Session</span>
                </button>
              )}
            </div>
          </div>

          {/* Focus & Guidance */}
          <div className="text-xs text-slate-300 leading-relaxed font-sans bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
            <span className="text-[10px] font-bold uppercase text-amber-400 tracking-wider block mb-1">
              Mission Focus:
            </span>
            {activeMilestone.focus}
          </div>

          {/* Action Items List */}
          {activeMilestone.actionItems && activeMilestone.actionItems.length > 0 && (
            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block">
                Level Gamified Action Items:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {activeMilestone.actionItems.map((item, aIdx) => (
                  <div
                    key={aIdx}
                    className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 flex items-start gap-2"
                  >
                    <span className="w-5 h-5 rounded-md bg-amber-500/15 text-amber-300 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5 font-mono-numbers">
                      {aIdx + 1}
                    </span>
                    <span className="leading-relaxed flex-1">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
