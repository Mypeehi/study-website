import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  Cell,
} from 'recharts';
import {
  TrendingUp,
  Target,
  Flame,
  CheckCircle2,
  Clock,
  Zap,
  Calendar,
  X,
  Award,
  AlertTriangle,
  Sparkles,
  BarChart3,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';
import { UserStudyState, StudyLogEntry } from '../types';

export interface WeeklyPerformanceSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  studyState: UserStudyState;
  onNavigateToSession?: () => void;
  onNavigateToQuiz?: () => void;
}

interface DayMetric {
  dateStr: string;
  dayName: string;
  dayShort: string;
  dateFormatted: string;
  minutesSpent: number;
  dailyTarget: number;
  xpEarned: number;
  quizzesCount: number;
  vivaCount: number;
  isToday: boolean;
  isTargetMet: boolean;
  cumulativeMinutes: number;
  cumulativeTarget: number;
}

export const WeeklyPerformanceSummaryModal: React.FC<WeeklyPerformanceSummaryModalProps> = ({
  isOpen,
  onClose,
  studyState,
  onNavigateToSession,
  onNavigateToQuiz,
}) => {
  const [activeChartTab, setActiveChartTab] = useState<'daily' | 'cumulative'>('daily');

  // Daily target minutes from study state or fallback
  const dailyTargetMinutes =
    studyState.dailyStudyGoal?.targetMinutes ||
    (studyState.dailyStudyGoal?.targetHours ? Math.round(studyState.dailyStudyGoal.targetHours * 60) : 90);

  const weeklyTargetMinutes = dailyTargetMinutes * 7;

  // Compute 7 days data ending today
  const { weekData, totalMinutes, totalXp, activeDaysCount, targetMetDaysCount, weeklyProgressPercent } =
    useMemo(() => {
      const now = new Date();
      const list: DayMetric[] = [];
      let runningCumulativeMinutes = 0;
      let runningCumulativeTarget = 0;

      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        const iso = d.toISOString().split('T')[0];
        const isToday = i === 0;

        const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
        const dateFormatted = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

        const logEntry: StudyLogEntry | undefined = studyState.studyLog[iso];

        // For today, incorporate live completedMinutes if higher
        let minutesSpent = logEntry?.minutesSpent || 0;
        if (isToday && studyState.dailyStudyGoal?.completedMinutes) {
          minutesSpent = Math.max(minutesSpent, studyState.dailyStudyGoal.completedMinutes);
        }

        // If no log entry existed for past day, check if it had activity pattern
        const xpEarned = logEntry?.xpEarned || (minutesSpent > 0 ? minutesSpent * 2 : 0);
        const quizzesCount = logEntry?.quizzesCount || 0;
        const vivaCount = logEntry?.vivaCount || 0;

        const isTargetMet = minutesSpent >= dailyTargetMinutes;
        runningCumulativeMinutes += minutesSpent;
        runningCumulativeTarget += dailyTargetMinutes;

        list.push({
          dateStr: iso,
          dayName,
          dayShort: `${dayName} ${d.getDate()}`,
          dateFormatted,
          minutesSpent,
          dailyTarget: dailyTargetMinutes,
          xpEarned,
          quizzesCount,
          vivaCount,
          isToday,
          isTargetMet,
          cumulativeMinutes: runningCumulativeMinutes,
          cumulativeTarget: runningCumulativeTarget,
        });
      }

      const totalMins = list.reduce((acc, cur) => acc + cur.minutesSpent, 0);
      const totalXpEarned = list.reduce((acc, cur) => acc + cur.xpEarned, 0);
      const activeDays = list.filter((cur) => cur.minutesSpent > 0).length;
      const targetMetDays = list.filter((cur) => cur.isTargetMet).length;
      const progressPercent = Math.min(100, Math.round((totalMins / Math.max(1, weeklyTargetMinutes)) * 100));

      return {
        weekData: list,
        totalMinutes: totalMins,
        totalXp: totalXpEarned,
        activeDaysCount: activeDays,
        targetMetDaysCount: targetMetDays,
        weeklyProgressPercent: progressPercent,
      };
    }, [studyState.studyLog, studyState.dailyStudyGoal, dailyTargetMinutes, weeklyTargetMinutes]);

  const consistencyRate = Math.round((activeDaysCount / 7) * 100);

  // Date range label
  const dateRangeLabel = useMemo(() => {
    if (weekData.length < 7) return 'Past 7 Days';
    const first = weekData[0].dateFormatted;
    const last = weekData[6].dateFormatted;
    return `${first} – ${last}`;
  }, [weekData]);

  if (!isOpen) return null;

  // Custom Tooltip for Daily Bar Chart
  const CustomDailyTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data: DayMetric = payload[0].payload;
      return (
        <div className="bg-slate-950 border border-slate-700/80 rounded-xl p-3 shadow-2xl backdrop-blur-md text-xs space-y-1.5 z-50">
          <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-1.5">
            <span className="font-bold text-white font-display">
              {data.dayName}, {data.dateFormatted} {data.isToday && '(Today)'}
            </span>
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                data.isTargetMet
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : data.minutesSpent > 0
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {data.isTargetMet ? 'Goal Met ✓' : data.minutesSpent > 0 ? 'Active' : 'No Study'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-1 font-mono-numbers">
            <div className="text-slate-400">Minutes Studied:</div>
            <div className="text-white font-bold text-right">{data.minutesSpent} min</div>

            <div className="text-slate-400">Daily Target:</div>
            <div className="text-amber-400 font-medium text-right">{data.dailyTarget} min</div>

            <div className="text-slate-400">Knowledge XP:</div>
            <div className="text-amber-300 text-right">+{data.xpEarned} XP</div>

            <div className="text-slate-400">Drills & Vivas:</div>
            <div className="text-cyan-300 text-right">
              {data.quizzesCount + data.vivaCount} sessions
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom Tooltip for Cumulative Area Chart
  const CustomCumulativeTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data: DayMetric = payload[0].payload;
      const percent = Math.min(100, Math.round((data.cumulativeMinutes / weeklyTargetMinutes) * 100));
      return (
        <div className="bg-slate-950 border border-slate-700/80 rounded-xl p-3 shadow-2xl backdrop-blur-md text-xs space-y-1.5 z-50">
          <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-1.5">
            <span className="font-bold text-white font-display">
              Through {data.dayName}, {data.dateFormatted}
            </span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              {percent}% of Weekly Target
            </span>
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-1 font-mono-numbers">
            <div className="text-slate-400">Accumulated Study:</div>
            <div className="text-white font-bold text-right">
              {data.cumulativeMinutes} min ({(data.cumulativeMinutes / 60).toFixed(1)} hrs)
            </div>

            <div className="text-slate-400">Weekly Target:</div>
            <div className="text-emerald-400 font-medium text-right">
              {weeklyTargetMinutes} min ({(weeklyTargetMinutes / 60).toFixed(1)} hrs)
            </div>

            <div className="text-slate-400">Remaining to Goal:</div>
            <div className="text-amber-300 text-right">
              {Math.max(0, weeklyTargetMinutes - data.cumulativeMinutes)} min
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-fadeIn overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-3xl w-full shadow-2xl overflow-hidden relative my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Banner */}
        <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/40 p-5 sm:p-6 border-b border-slate-800">
          <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] font-bold uppercase tracking-wider">
                <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
                <span>Weekly Active Recall Metrics</span>
                <span className="text-slate-600">·</span>
                <span className="text-slate-300 font-mono-numbers">{dateRangeLabel}</span>
              </div>

              <h2 className="text-xl sm:text-2xl font-black font-display text-white tracking-tight flex items-center gap-2.5">
                <BarChart3 className="w-6 h-6 text-amber-400" />
                <span>Weekly Performance Summary</span>
              </h2>

              <p className="text-xs text-slate-300 max-w-xl">
                Visual analysis of your study consistency, active recall volume, and progress towards your weekly knowledge target.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
              title="Close Weekly Summary"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Key KPI Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Total Minutes Studied */}
            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800">
              <div className="flex items-center justify-between text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">
                <span>Total Study Time</span>
                <Clock className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <div className="text-lg sm:text-xl font-black font-mono-numbers text-white">
                {totalMinutes} <span className="text-xs font-normal text-slate-400">min</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                {(totalMinutes / 60).toFixed(1)} hrs logged
              </div>
            </div>

            {/* Target Progress */}
            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800">
              <div className="flex items-center justify-between text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">
                <span>Weekly Target</span>
                <Target className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="text-lg sm:text-xl font-black font-mono-numbers text-emerald-400">
                {weeklyProgressPercent}%
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5 font-mono-numbers">
                {totalMinutes} / {weeklyTargetMinutes} min
              </div>
            </div>

            {/* Consistency Rate */}
            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800">
              <div className="flex items-center justify-between text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">
                <span>Consistency</span>
                <Flame className="w-3.5 h-3.5 text-orange-400" />
              </div>
              <div className="text-lg sm:text-xl font-black font-mono-numbers text-orange-400">
                {activeDaysCount} / 7 <span className="text-xs font-normal text-slate-400">Days</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                {consistencyRate}% active rate
              </div>
            </div>

            {/* Knowledge XP */}
            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800">
              <div className="flex items-center justify-between text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">
                <span>Weekly XP</span>
                <Zap className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <div className="text-lg sm:text-xl font-black font-mono-numbers text-amber-300">
                +{totalXp.toLocaleString()}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                {targetMetDaysCount} target hits
              </div>
            </div>
          </div>

          {/* Visual Charts Container with Recharts */}
          <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
            {/* Chart Mode Navigation Tabs */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
              <div>
                <h3 className="text-sm font-bold font-display text-white">
                  {activeChartTab === 'daily'
                    ? 'Daily Active Study Minutes vs. Daily Goal Benchmark'
                    : 'Cumulative Weekly Minutes Climb vs. Weekly Target Goal'}
                </h3>
                <p className="text-[11px] text-slate-400">
                  {activeChartTab === 'daily'
                    ? `Dashed line marks your ${dailyTargetMinutes} min/day daily target threshold.`
                    : `Tracking progress toward the ${weeklyTargetMinutes} min (${(weeklyTargetMinutes / 60).toFixed(1)} hrs) weekly target.`}
                </p>
              </div>

              {/* Tabs Switcher */}
              <div className="flex items-center p-1 bg-slate-900 rounded-xl border border-slate-800 text-xs shrink-0">
                <button
                  type="button"
                  onClick={() => setActiveChartTab('daily')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                    activeChartTab === 'daily'
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Daily Breakdown
                </button>
                <button
                  type="button"
                  onClick={() => setActiveChartTab('cumulative')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                    activeChartTab === 'cumulative'
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Weekly Target Climb
                </button>
              </div>
            </div>

            {/* Recharts Chart Canvas */}
            <div className="h-64 sm:h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                {activeChartTab === 'daily' ? (
                  <BarChart data={weekData} margin={{ top: 18, right: 12, left: -18, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.6} />
                    <XAxis
                      dataKey="dayShort"
                      stroke="#64748b"
                      fontSize={11}
                      tickLine={false}
                    />
                    <YAxis
                      stroke="#64748b"
                      fontSize={11}
                      tickLine={false}
                      domain={[0, (dataMax: number) => Math.max(dataMax + 20, dailyTargetMinutes + 25)]}
                      unit="m"
                    />
                    <Tooltip content={<CustomDailyTooltip />} />

                    {/* Daily Target Benchmark Line */}
                    <ReferenceLine
                      y={dailyTargetMinutes}
                      stroke="#f59e0b"
                      strokeWidth={1.5}
                      strokeDasharray="4 4"
                      label={{
                        value: `Target: ${dailyTargetMinutes}m`,
                        fill: '#f59e0b',
                        fontSize: 10,
                        position: 'top',
                      }}
                    />

                    <Bar dataKey="minutesSpent" radius={[6, 6, 0, 0]} maxBarSize={48}>
                      {weekData.map((entry, index) => {
                        const isMet = entry.minutesSpent >= dailyTargetMinutes;
                        const isZero = entry.minutesSpent === 0;
                        const color = isMet
                          ? '#10b981' // Emerald
                          : isZero
                          ? '#1e293b' // Dark slate for rest
                          : '#f59e0b'; // Amber
                        return <Cell key={`cell-${index}`} fill={color} />;
                      })}
                    </Bar>
                  </BarChart>
                ) : (
                  <AreaChart data={weekData} margin={{ top: 18, right: 12, left: -18, bottom: 4 }}>
                    <defs>
                      <linearGradient id="weeklyGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.6} />
                    <XAxis
                      dataKey="dayShort"
                      stroke="#64748b"
                      fontSize={11}
                      tickLine={false}
                    />
                    <YAxis
                      stroke="#64748b"
                      fontSize={11}
                      tickLine={false}
                      domain={[0, (dataMax: number) => Math.max(dataMax + 40, weeklyTargetMinutes + 40)]}
                      unit="m"
                    />
                    <Tooltip content={<CustomCumulativeTooltip />} />

                    {/* Weekly Target Goal Threshold */}
                    <ReferenceLine
                      y={weeklyTargetMinutes}
                      stroke="#10b981"
                      strokeWidth={1.5}
                      strokeDasharray="4 4"
                      label={{
                        value: `Weekly Goal: ${weeklyTargetMinutes}m`,
                        fill: '#10b981',
                        fontSize: 10,
                        position: 'top',
                      }}
                    />

                    <Area
                      type="monotone"
                      dataKey="cumulativeMinutes"
                      stroke="#f59e0b"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#weeklyGradient)"
                    />
                  </AreaChart>
                )}
              </ResponsiveContainer>
            </div>

            {/* Chart Legend & Legend Tags */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800/80 text-xs text-slate-400">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-emerald-500 inline-block" />
                  <span>Target Met (≥ {dailyTargetMinutes}m)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-amber-500 inline-block" />
                  <span>In Progress</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-1 bg-amber-400 inline-block border-b border-dashed" />
                  <span>Target Threshold</span>
                </div>
              </div>

              <div className="text-[11px] font-mono-numbers text-slate-400">
                Weekly Target: <strong>{weeklyTargetMinutes} min</strong> ({(weeklyTargetMinutes / 60).toFixed(1)} hrs)
              </div>
            </div>
          </div>

          {/* 7-Day Consistency Matrix Strip */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              <span>7-Day Active Recall Consistency Breakdown</span>
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-7 gap-2">
              {weekData.map((day, idx) => (
                <div
                  key={idx}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    day.isTargetMet
                      ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300'
                      : day.minutesSpent > 0
                      ? 'bg-amber-950/20 border-amber-500/30 text-amber-200'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400'
                  }`}
                >
                  <div className="text-[10px] font-bold uppercase tracking-wider">
                    {day.dayName} {day.isToday && '• Today'}
                  </div>
                  <div className="text-xs font-black font-mono-numbers mt-1">
                    {day.minutesSpent}m
                  </div>
                  <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                    +{day.xpEarned} XP
                  </div>
                  <div className="mt-1 flex items-center justify-center">
                    {day.isTargetMet ? (
                      <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-0.5">
                        <CheckCircle2 className="w-3 h-3" /> Met
                      </span>
                    ) : day.minutesSpent > 0 ? (
                      <span className="text-[10px] text-amber-400 font-medium flex items-center gap-0.5">
                        <Flame className="w-3 h-3 fill-amber-500/30" /> Done
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-500">Rest</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* The Angry Scholar Weekly Retention Assessment Card */}
          <div className="rounded-2xl p-4 bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950/30 border border-amber-500/30 flex items-start gap-3.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0 text-base shadow-sm">
              😠
            </div>
            <div className="space-y-1">
              <div className="text-[11px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <span>The Angry Scholar's Weekly Assessment</span>
                <span className="text-slate-500">·</span>
                <span className="text-slate-300">Active Recall Efficiency Verdict</span>
              </div>
              <p className="text-xs text-slate-200 leading-relaxed font-sans">
                {weeklyProgressPercent >= 100
                  ? `Masterclass execution! You logged ${totalMinutes} active study minutes, beating your ${weeklyTargetMinutes}m quota. Synaptic connections for your exam are hardening against the Ebbinghaus forgetting curve.`
                  : weeklyProgressPercent >= 70
                  ? `Solid momentum with ${totalMinutes} minutes logged (${weeklyProgressPercent}% of weekly goal). You're only ${weeklyTargetMinutes - totalMinutes}m away from total weekly quota mastery. Don't let your guard down on rest days!`
                  : `Cognitive retention alert! You've logged ${totalMinutes}m of your ${weeklyTargetMinutes}m target (${weeklyProgressPercent}%). Passive reading won't save you on test day—drill active recall questions today to stay on track!`}
              </p>
            </div>
          </div>
        </div>

        {/* Modal Action Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950/80 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-400 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Weekly progress resets every Sunday at midnight.</span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            {onNavigateToSession && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onNavigateToSession();
                }}
                className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Zap className="w-3.5 h-3.5 fill-slate-950" />
                <span>Launch Study Session</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer text-center"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
