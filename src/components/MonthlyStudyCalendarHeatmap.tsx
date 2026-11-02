import React, { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Trophy,
  Flame,
  Award,
  Sparkles,
  Zap,
  CheckCircle2,
  BookOpen,
  Mic,
  Clock,
  ArrowRight,
  Info,
  Shield,
  Layers
} from 'lucide-react';
import { UserStudyState, StudyLogEntry } from '../types';
import { playCorrectSound, playStreakFlameSound } from '../utils/audio';

interface MonthlyStudyCalendarHeatmapProps {
  studyState: UserStudyState;
  onNavigateToQuiz?: (topic?: string) => void;
  onNavigateToExaminer?: (topic?: string) => void;
  onNavigateToPlan?: () => void;
}

export const MonthlyStudyCalendarHeatmap: React.FC<MonthlyStudyCalendarHeatmapProps> = ({
  studyState,
  onNavigateToQuiz,
  onNavigateToExaminer,
  onNavigateToPlan,
}) => {
  // Current month being viewed in calendar (defaults to current local date)
  const [viewDate, setViewDate] = useState<Date>(() => new Date());
  // Selected date ISO string for the day inspector
  const todayIso = useMemo(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  const [selectedDateIso, setSelectedDateIso] = useState<string>(todayIso);
  const [highlightMilestonesOnly, setHighlightMilestonesOnly] = useState<boolean>(false);

  // Helper to format ISO strings
  const formatDateToIso = (d: Date): string => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Month navigation handlers
  const handlePrevMonth = () => {
    setViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleJumpToToday = () => {
    const now = new Date();
    setViewDate(new Date(now.getFullYear(), now.getMonth(), 1));
    setSelectedDateIso(todayIso);
    playStreakFlameSound();
  };

  // Build calendar matrix for current viewDate
  const calendarDays = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth(); // 0-indexed

    // First day of month
    const firstDay = new Date(year, month, 1);
    // Number of days in current month
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Day of week for first day (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
    // Convert to Monday-start (0 = Mon, 6 = Sun)
    let startDayOfWeek = firstDay.getDay() - 1;
    if (startDayOfWeek === -1) startDayOfWeek = 6;

    // Number of days in previous month
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const days = [];

    // 1. Previous month trailing days
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, daysInPrevMonth - i);
      const iso = formatDateToIso(d);
      days.push({
        date: d,
        iso,
        dayNum: d.getDate(),
        isCurrentMonth: false,
        isPrevMonth: true,
      });
    }

    // 2. Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(year, month, day);
      const iso = formatDateToIso(d);
      days.push({
        date: d,
        iso,
        dayNum: day,
        isCurrentMonth: true,
        isPrevMonth: false,
      });
    }

    // 3. Next month leading days to complete full grid (multiple of 7)
    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i);
      const iso = formatDateToIso(d);
      days.push({
        date: d,
        iso,
        dayNum: i,
        isCurrentMonth: false,
        isPrevMonth: false,
      });
    }

    return days;
  }, [viewDate]);

  // Aggregate milestone completion mapping: iso -> milestone data
  const milestoneDateMap = useMemo(() => {
    const map: Record<string, {
      index: number;
      title: string;
      phase: string;
      focus?: string;
    }> = {};

    const plan = studyState.activeExamPlan;
    const completedIndices = studyState.completedMilestones || [];
    const dates = studyState.milestoneCompletionDates || {};

    // 1. Check milestoneCompletionDates
    completedIndices.forEach(idx => {
      const dateStr = dates[idx];
      const milestone = plan?.milestones[idx];
      if (dateStr && milestone) {
        map[dateStr] = {
          index: idx,
          title: milestone.title,
          phase: milestone.phase,
          focus: milestone.focus,
        };
      }
    });

    // 2. Also check studyLog for explicit milestoneAchieved entries
    Object.entries(studyState.studyLog || {}).forEach(([dateStr, entry]) => {
      if (entry?.milestoneAchieved && !map[dateStr]) {
        map[dateStr] = {
          index: entry.milestoneAchieved.index,
          title: entry.milestoneAchieved.title,
          phase: entry.milestoneAchieved.phase,
          focus: plan?.milestones[entry.milestoneAchieved.index]?.focus,
        };
      }
    });

    return map;
  }, [studyState.completedMilestones, studyState.milestoneCompletionDates, studyState.studyLog, studyState.activeExamPlan]);

  // Monthly summary metrics for the currently viewed month
  const monthlyMetrics = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    let activeDaysCount = 0;
    let totalXp = 0;
    let totalQuizzes = 0;
    let totalVivas = 0;
    let totalMinutes = 0;
    let milestonesInMonthCount = 0;

    for (let d = 1; d <= daysInMonth; d++) {
      const curDate = new Date(year, month, d);
      const iso = formatDateToIso(curDate);
      const entry = studyState.studyLog[iso];
      const hasMilestone = !!milestoneDateMap[iso];

      if (hasMilestone) {
        milestonesInMonthCount++;
      }

      if (entry && (entry.quizzesCount > 0 || entry.vivaCount > 0 || entry.xpEarned > 0)) {
        activeDaysCount++;
        totalXp += entry.xpEarned || 0;
        totalQuizzes += entry.quizzesCount || 0;
        totalVivas += entry.vivaCount || 0;
        totalMinutes += entry.minutesSpent || (entry.quizzesCount * 5 + entry.vivaCount * 10);
      }
    }

    const consistencyPercent = Math.round((activeDaysCount / daysInMonth) * 100);

    return {
      activeDaysCount,
      daysInMonth,
      consistencyPercent,
      totalXp,
      totalQuizzes,
      totalVivas,
      totalMinutes,
      milestonesInMonthCount,
    };
  }, [viewDate, studyState.studyLog, milestoneDateMap]);

  // Selected Day Details
  const selectedDayInfo = useMemo(() => {
    const entry = studyState.studyLog[selectedDateIso] as StudyLogEntry | undefined;
    const milestone = milestoneDateMap[selectedDateIso];
    const isToday = selectedDateIso === todayIso;

    // Parse friendly date label
    const parts = selectedDateIso.split('-');
    let dateObj = new Date();
    if (parts.length === 3) {
      dateObj = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    }

    const formattedLabel = dateObj.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });

    return {
      iso: selectedDateIso,
      formattedLabel,
      isToday,
      entry,
      milestone,
      quizzes: entry?.quizzesCount || 0,
      vivas: entry?.vivaCount || 0,
      xp: entry?.xpEarned || 0,
      minutes: entry?.minutesSpent || (entry ? (entry.quizzesCount * 5 + entry.vivaCount * 10) : 0),
    };
  }, [selectedDateIso, studyState.studyLog, milestoneDateMap, todayIso]);

  // Compute activity intensity level: 0 (none), 1 (light), 2 (moderate), 3 (deep)
  const getIntensityLevel = (entry?: StudyLogEntry): number => {
    if (!entry) return 0;
    const totalDrills = (entry.quizzesCount || 0) + (entry.vivaCount || 0);
    const xp = entry.xpEarned || 0;

    if (totalDrills >= 4 || xp >= 140) return 3;
    if (totalDrills >= 2 || xp >= 70) return 2;
    if (totalDrills >= 1 || xp > 0) return 1;
    return 0;
  };

  const monthName = viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 space-y-7 shadow-2xl relative overflow-hidden">
      {/* Decorative gradient flare */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider mb-1">
            <CalendarIcon className="w-4 h-4 text-amber-400" />
            <span>Academic Retention Consistency</span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold font-display text-white">
            Monthly Study Activity & Milestone Heatmap
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xl leading-relaxed">
            Tracks daily spaced repetition habits and highlights milestone achievements. Darker amber blocks represent multi-drill focus sessions; golden trophy badges celebrate curriculum milestones unlocked.
          </p>
        </div>

        {/* Month Selector Controls */}
        <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 p-1.5 rounded-xl self-stretch sm:self-auto">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Previous Month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="text-xs font-bold font-display text-white px-3 min-w-[130px] text-center select-none">
            {monthName}
          </span>

          <button
            type="button"
            onClick={handleNextMonth}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Next Month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleJumpToToday}
            className="ml-1 px-2.5 py-1 text-[11px] font-semibold bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
            title="Jump to Today"
          >
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>Today</span>
          </button>
        </div>
      </div>

      {/* Monthly Overview Performance Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {/* Metric 1: Consistency Rate */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Study Consistency</span>
            <span className="text-amber-400 font-bold font-mono-numbers">
              {monthlyMetrics.consistencyPercent}%
            </span>
          </div>
          <div className="text-lg md:text-xl font-bold font-mono-numbers text-white">
            {monthlyMetrics.activeDaysCount} / {monthlyMetrics.daysInMonth} Days
          </div>
          <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-amber-500 to-amber-300 h-full rounded-full transition-all duration-500"
              style={{ width: `${monthlyMetrics.consistencyPercent}%` }}
            />
          </div>
        </div>

        {/* Metric 2: Monthly Knowledge XP */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Monthly Knowledge XP</span>
            <Zap className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-lg md:text-xl font-bold font-mono-numbers text-amber-300">
            +{monthlyMetrics.totalXp} XP
          </div>
          <div className="text-[11px] text-slate-500 truncate">
            {monthlyMetrics.totalQuizzes} quizzes · {monthlyMetrics.totalVivas} vivas
          </div>
        </div>

        {/* Metric 3: Milestones Achieved This Month */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Milestone Landmarks</span>
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-lg md:text-xl font-bold font-mono-numbers text-white flex items-center gap-1.5">
            <span>{monthlyMetrics.milestonesInMonthCount}</span>
            <span className="text-xs text-amber-400 font-normal">Unlocked</span>
          </div>
          <div className="text-[11px] text-slate-500 truncate">
            {studyState.completedMilestones?.length || 0} total curriculum landmarks
          </div>
        </div>

        {/* Metric 4: Estimated Study Time */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Focused Time</span>
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="text-lg md:text-xl font-bold font-mono-numbers text-white">
            {Math.floor(monthlyMetrics.totalMinutes / 60)}h {monthlyMetrics.totalMinutes % 60}m
          </div>
          <div className="text-[11px] text-slate-500 truncate">
            Active recall & oral drills
          </div>
        </div>
      </div>

      {/* Calendar Heatmap Grid */}
      <div className="space-y-3">
        {/* Days of Week Header */}
        <div className="grid grid-cols-7 gap-1.5 md:gap-2 text-center text-xs font-semibold text-slate-400">
          <div>Mon</div>
          <div>Tue</div>
          <div>Wed</div>
          <div>Thu</div>
          <div>Fri</div>
          <div className="text-slate-500">Sat</div>
          <div className="text-slate-500">Sun</div>
        </div>

        {/* Calendar Day Cells */}
        <div className="grid grid-cols-7 gap-1.5 md:gap-2">
          {calendarDays.map((dayItem, idx) => {
            const entry = studyState.studyLog[dayItem.iso] as StudyLogEntry | undefined;
            const milestone = milestoneDateMap[dayItem.iso];
            const intensity = getIntensityLevel(entry);
            const isToday = dayItem.iso === todayIso;
            const isSelected = dayItem.iso === selectedDateIso;

            // Heatmap color logic
            let colorClasses = 'bg-slate-950/70 border-slate-800/80 text-slate-400 hover:border-slate-700';
            if (intensity === 3) {
              colorClasses = 'bg-gradient-to-br from-amber-500/90 to-amber-600 border-amber-400 text-slate-950 font-bold shadow-md shadow-amber-500/20';
            } else if (intensity === 2) {
              colorClasses = 'bg-amber-600/30 border-amber-500/50 text-amber-200 hover:bg-amber-600/40';
            } else if (intensity === 1) {
              colorClasses = 'bg-amber-950/40 border-amber-500/30 text-amber-300 hover:bg-amber-950/60';
            }

            // Milestone highlighting
            const isMilestoneDay = !!milestone;
            const isFaded = !dayItem.isCurrentMonth;

            return (
              <div
                key={idx}
                onClick={() => {
                  setSelectedDateIso(dayItem.iso);
                  if (entry || isMilestoneDay) playCorrectSound();
                }}
                className={`min-h-[64px] sm:min-h-[76px] md:min-h-[88px] p-2 rounded-xl border flex flex-col justify-between transition-all cursor-pointer relative group ${colorClasses} ${
                  isFaded ? 'opacity-35 pointer-events-none sm:pointer-events-auto' : ''
                } ${
                  isSelected ? 'ring-2 ring-amber-400 ring-offset-2 ring-offset-slate-900 scale-[1.02] z-10' : ''
                } ${
                  isToday ? 'border-cyan-400/90 shadow-sm shadow-cyan-500/20' : ''
                } ${
                  isMilestoneDay
                    ? 'ring-2 ring-amber-400/90 shadow-lg shadow-amber-500/30 font-bold'
                    : ''
                } ${
                  highlightMilestonesOnly && !isMilestoneDay ? 'opacity-30' : ''
                }`}
                title={`${dayItem.iso}: ${
                  isMilestoneDay ? `🏆 Milestone Landmark: ${milestone.title}. ` : ''
                }${
                  entry ? `${entry.quizzesCount} quizzes, ${entry.vivaCount} vivas, +${entry.xpEarned} XP` : 'No study logged'
                }`}
              >
                {/* Top Row: Day number and Landmark Trophy Icon */}
                <div className="flex items-center justify-between w-full">
                  <span
                    className={`text-xs font-mono-numbers font-semibold ${
                      intensity === 3 ? 'text-slate-950 font-bold' : isToday ? 'text-cyan-300 font-bold' : 'text-slate-300'
                    }`}
                  >
                    {dayItem.dayNum}
                  </span>

                  {/* Milestone Landmark Trophy Badge */}
                  {isMilestoneDay && (
                    <div
                      className="flex items-center justify-center p-0.5 rounded-full bg-amber-400 text-slate-950 shadow-md animate-bounce"
                      title={`🏆 Milestone Landmark Achieved: ${milestone.title}`}
                    >
                      <Trophy className="w-3 h-3 fill-slate-950" />
                    </div>
                  )}

                  {!isMilestoneDay && isToday && (
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" title="Today" />
                  )}
                </div>

                {/* Middle / Bottom: Study Activity Badges */}
                <div className="space-y-1 mt-1">
                  {/* Milestone Title Pill on larger screens */}
                  {isMilestoneDay && (
                    <div className="hidden sm:block">
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-950/80 text-amber-300 border border-amber-400/40 line-clamp-1 font-bold">
                        🏆 Phase {milestone.index + 1}
                      </span>
                    </div>
                  )}

                  {/* Activity Metrics (Drills & XP) */}
                  {entry && (entry.quizzesCount > 0 || entry.vivaCount > 0) ? (
                    <div className="flex items-center justify-between text-[10px] font-mono-numbers">
                      <span
                        className={`${
                          intensity === 3 ? 'text-slate-950 font-bold' : 'text-slate-300'
                        }`}
                      >
                        {entry.quizzesCount}Q{entry.vivaCount > 0 ? ` · ${entry.vivaCount}V` : ''}
                      </span>
                      <span
                        className={`font-semibold ${
                          intensity === 3 ? 'text-slate-950' : 'text-amber-400'
                        }`}
                      >
                        +{entry.xpEarned}
                      </span>
                    </div>
                  ) : (
                    <div className="h-3" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Heatmap Legend & Milestone Landmark Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-800/80 text-xs text-slate-400">
        {/* Heat Intensity Legend */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-slate-500 font-medium">Activity Level:</span>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md bg-slate-950 border border-slate-800" title="Rest / No Activity" />
            <span className="text-[11px] text-slate-500">Rest</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md bg-amber-950/50 border border-amber-500/30" title="Light: 1-2 drills" />
            <span className="text-[11px]">1–2 Drills</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md bg-amber-600/30 border border-amber-500/50" title="Solid: 3-4 drills" />
            <span className="text-[11px]">3–4 Drills</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md bg-amber-500 border border-amber-300" title="Deep Study: 5+ drills" />
            <span className="text-[11px] font-semibold text-amber-300">Deep Focus</span>
          </div>
        </div>

        {/* Milestone Indicator & Toggle Filter */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-amber-400 font-semibold">
            <Trophy className="w-3.5 h-3.5" />
            <span>Milestone Landmark</span>
          </div>

          <button
            type="button"
            onClick={() => setHighlightMilestonesOnly(!highlightMilestonesOnly)}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer border ${
              highlightMilestonesOnly
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            {highlightMilestonesOnly ? 'Show All Days' : 'Filter Landmarks'}
          </button>
        </div>
      </div>

      {/* Selected Day Activity Inspector Card */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 md:p-6 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold font-mono-numbers text-sm ${
                selectedDayInfo.milestone
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30'
                  : selectedDayInfo.entry
                  ? 'bg-amber-500/20 border border-amber-500/30 text-amber-300'
                  : 'bg-slate-900 border border-slate-800 text-slate-500'
              }`}
            >
              {selectedDayInfo.milestone ? (
                <Trophy className="w-4 h-4 fill-slate-950" />
              ) : selectedDayInfo.isToday ? (
                <Sparkles className="w-4 h-4 text-cyan-400" />
              ) : (
                <CalendarIcon className="w-4 h-4" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm md:text-base font-bold text-white">
                  {selectedDayInfo.formattedLabel}
                </h3>
                {selectedDayInfo.isToday && (
                  <span className="px-2 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-[10px] font-bold">
                    TODAY
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {selectedDayInfo.milestone
                  ? '🏆 Curriculum Milestone Landmark achieved on this day!'
                  : selectedDayInfo.entry
                  ? 'Active study session logged with spaced repetition.'
                  : 'Rest day / No active drills recorded for this calendar date.'}
              </p>
            </div>
          </div>

          {/* Quick Jump back to Today if viewing other date */}
          {!selectedDayInfo.isToday && (
            <button
              type="button"
              onClick={handleJumpToToday}
              className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 cursor-pointer self-start sm:self-auto"
            >
              <span>Back to Today</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Milestone Callout Box if Achieved on this day */}
        {selectedDayInfo.milestone && (
          <div className="p-4 rounded-xl bg-gradient-to-r from-amber-950/40 via-amber-900/20 to-slate-950 border border-amber-500/40 space-y-2 shadow-lg animate-fadeIn">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold">
                  <Trophy className="w-4 h-4 fill-slate-950" />
                </span>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                    Curriculum Milestone Achieved
                  </span>
                  <h4 className="text-sm font-bold text-white">
                    {selectedDayInfo.milestone.phase}: {selectedDayInfo.milestone.title}
                  </h4>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-mono-numbers font-bold">
                +150 XP Bonus Awarded
              </span>
            </div>

            {selectedDayInfo.milestone.focus && (
              <p className="text-xs text-slate-300 pl-9 leading-relaxed">
                <strong className="text-amber-400">Key Focus Conquered: </strong>
                {selectedDayInfo.milestone.focus}
              </p>
            )}
          </div>
        )}

        {/* Day Metrics Breakdown Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800/80">
            <span className="text-[11px] text-slate-400 block mb-0.5">Practice Quizzes</span>
            <span className="text-base font-bold font-mono-numbers text-white">
              {selectedDayInfo.quizzes} Completed
            </span>
          </div>

          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800/80">
            <span className="text-[11px] text-slate-400 block mb-0.5">Examiner Vivas</span>
            <span className="text-base font-bold font-mono-numbers text-rose-300">
              {selectedDayInfo.vivas} Survived
            </span>
          </div>

          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800/80">
            <span className="text-[11px] text-slate-400 block mb-0.5">Knowledge XP Earned</span>
            <span className="text-base font-bold font-mono-numbers text-amber-400">
              +{selectedDayInfo.xp} XP
            </span>
          </div>

          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800/80">
            <span className="text-[11px] text-slate-400 block mb-0.5">Focused Time</span>
            <span className="text-base font-bold font-mono-numbers text-cyan-300">
              {selectedDayInfo.minutes} Minutes
            </span>
          </div>
        </div>

        {/* Quick Action Buttons for Selected Date */}
        {selectedDayInfo.isToday && (
          <div className="flex flex-wrap items-center gap-3 pt-2">
            {onNavigateToQuiz && (
              <button
                type="button"
                onClick={() => onNavigateToQuiz()}
                className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Start Today's Quiz (+50 XP)</span>
              </button>
            )}

            {onNavigateToExaminer && (
              <button
                type="button"
                onClick={() => onNavigateToExaminer()}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
              >
                <Mic className="w-3.5 h-3.5" />
                <span>Survive Angry Examiner (+75 XP)</span>
              </button>
            )}

            {onNavigateToPlan && (
              <button
                type="button"
                onClick={onNavigateToPlan}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Layers className="w-3.5 h-3.5 text-amber-400" />
                <span>View Full War Plan Roadmap</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* All Milestones Roadmap Status Tracker */}
      {studyState.activeExamPlan?.milestones && studyState.activeExamPlan.milestones.length > 0 && (
        <div className="pt-2 border-t border-slate-800/80">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-400" />
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Active Exam Milestones & Landmark Days
              </h4>
            </div>
            {onNavigateToPlan && (
              <button
                type="button"
                onClick={onNavigateToPlan}
                className="text-xs text-amber-400 hover:text-amber-300 font-semibold cursor-pointer"
              >
                Manage in War Plan →
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {studyState.activeExamPlan.milestones.map((m, idx) => {
              const isCompleted = studyState.completedMilestones?.includes(idx);
              const completionDate = studyState.milestoneCompletionDates?.[idx];

              return (
                <div
                  key={idx}
                  onClick={() => {
                    if (completionDate) {
                      setSelectedDateIso(completionDate);
                      const parts = completionDate.split('-');
                      if (parts.length === 3) {
                        setViewDate(new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, 1));
                      }
                      playCorrectSound();
                    }
                  }}
                  className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between space-y-2 ${
                    isCompleted
                      ? 'bg-amber-950/20 border-amber-500/40 text-amber-300 hover:border-amber-400 cursor-pointer shadow-sm'
                      : 'bg-slate-950 border-slate-800/80 text-slate-400'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-semibold uppercase tracking-wider">
                        {m.phase}
                      </span>
                      {isCompleted ? (
                        <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Achieved</span>
                        </span>
                      ) : (
                        <span className="text-slate-500 font-mono-numbers">{m.dayRange}</span>
                      )}
                    </div>
                    <h5 className="text-xs font-bold text-white line-clamp-1">{m.title}</h5>
                    <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                      {m.focus}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
                    <span className="text-slate-500">
                      {completionDate ? `Completed: ${completionDate}` : 'In Progress'}
                    </span>
                    {completionDate && (
                      <span className="text-amber-400 font-semibold underline">
                        View in Calendar
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
