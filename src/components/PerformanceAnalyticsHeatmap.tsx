import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import {
  AlertTriangle,
  Flame,
  ArrowRight,
  Target,
  Sparkles,
  BarChart3,
  HelpCircle,
  TrendingDown,
  Layers,
  ChevronRight,
  BookOpen,
  Filter,
  ArrowUpDown
} from 'lucide-react';
import { SubTopicPerformance, UserStudyState } from '../types';
import { DEFAULT_SUBTOPIC_PERFORMANCE } from '../utils/storage';

interface PerformanceAnalyticsHeatmapProps {
  studyState: UserStudyState;
  onNavigateToQuiz: (topic: string) => void;
  onNavigateToExaminer: (topic: string) => void;
}

export const PerformanceAnalyticsHeatmap: React.FC<PerformanceAnalyticsHeatmapProps> = ({
  studyState,
  onNavigateToQuiz,
  onNavigateToExaminer,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Filters and sorting
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'incorrect' | 'rate' | 'attempts'>('incorrect');
  const [hoveredData, setHoveredData] = useState<{
    subTopic: SubTopicPerformance;
    metricLabel: string;
    value: string;
    x: number;
    y: number;
  } | null>(null);

  // Extract all sub-topics
  const allSubTopics: SubTopicPerformance[] = useMemo(() => {
    const raw = studyState.subTopicPerformance || DEFAULT_SUBTOPIC_PERFORMANCE;
    return Object.values(raw);
  }, [studyState.subTopicPerformance]);

  // Unique subjects for filter
  const availableSubjects = useMemo(() => {
    const set = new Set<string>();
    allSubTopics.forEach(st => {
      if (st.subject) set.add(st.subject);
    });
    return ['All', ...Array.from(set)];
  }, [allSubTopics]);

  // Filtered and sorted sub-topics
  const filteredTopics = useMemo(() => {
    let list = [...allSubTopics];
    if (selectedSubjectFilter !== 'All') {
      list = list.filter(st => st.subject === selectedSubjectFilter);
    }

    list.sort((a, b) => {
      if (sortBy === 'incorrect') {
        return b.incorrectAnswers - a.incorrectAnswers;
      }
      if (sortBy === 'rate') {
        return b.errorRate - a.errorRate;
      }
      return b.totalAttempts - a.totalAttempts;
    });

    return list;
  }, [allSubTopics, selectedSubjectFilter, sortBy]);

  // Summary KPI computations
  const totalIncorrect = useMemo(() => {
    return allSubTopics.reduce((acc, curr) => acc + curr.incorrectAnswers, 0);
  }, [allSubTopics]);

  const criticalGaps = useMemo(() => {
    return allSubTopics.filter(st => st.severity === 'Critical Gap');
  }, [allSubTopics]);

  const topVulnerability = useMemo(() => {
    if (allSubTopics.length === 0) return null;
    return [...allSubTopics].sort((a, b) => b.incorrectAnswers - a.incorrectAnswers)[0];
  }, [allSubTopics]);

  // D3 Heatmap dimensions and columns
  const columns = useMemo(() => [
    { key: 'incorrectAnswers', label: 'Incorrect Answers', desc: 'Raw count of failed questions' },
    { key: 'errorRate', label: 'Error Rate %', desc: 'Percentage of attempts answered incorrectly' },
    { key: 'totalAttempts', label: 'Total Attempts', desc: 'Questions tested on this sub-topic' },
    { key: 'severityIndex', label: 'Knowledge Gap Index', desc: 'Composite synaptic vulnerability score' },
  ], []);

  // Render D3 Heatmap Matrix
  useEffect(() => {
    if (!svgRef.current || filteredTopics.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const margin = { top: 40, right: 30, bottom: 20, left: 240 };
    const containerWidth = containerRef.current ? containerRef.current.clientWidth : 800;
    const width = Math.max(700, containerWidth) - margin.left - margin.right;
    const rowHeight = 38;
    const height = filteredTopics.length * rowHeight;

    svg
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom);

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // X Scale for columns
    const x = d3
      .scaleBand()
      .domain(columns.map(c => c.key))
      .range([0, width])
      .padding(0.06);

    // Y Scale for sub-topics
    const y = d3
      .scaleBand()
      .domain(filteredTopics.map(t => t.subTopic))
      .range([0, height])
      .padding(0.08);

    // Color Scales
    // Incorrect answers color scale: slate dark to intense rose red
    const maxIncorrect = d3.max(filteredTopics, d => d.incorrectAnswers) || 10;
    const incorrectColorScale = d3
      .scaleLinear<string>()
      .domain([0, Math.ceil(maxIncorrect / 2), maxIncorrect])
      .range(['#1e293b', '#eab308', '#f43f5e']);

    // Error rate color scale: green -> yellow -> crimson
    const rateColorScale = d3
      .scaleLinear<string>()
      .domain([0, 30, 60, 100])
      .range(['#065f46', '#0f766e', '#f59e0b', '#e11d48']);

    // Total attempts color scale: slate -> indigo
    const maxAttempts = d3.max(filteredTopics, d => d.totalAttempts) || 15;
    const attemptsColorScale = d3
      .scaleLinear<string>()
      .domain([0, maxAttempts])
      .range(['#1e293b', '#6366f1']);

    // Gap severity color scale:
    const severityColorScale = (severity: string) => {
      if (severity === 'Critical Gap') return '#e11d48';
      if (severity === 'Moderate Weakness') return '#f59e0b';
      return '#10b981';
    };

    // Draw Column Headers
    const columnHeaders = g
      .selectAll('.col-header')
      .data(columns)
      .enter()
      .append('g')
      .attr('class', 'col-header')
      .attr('transform', d => `translate(${x(d.key)! + x.bandwidth() / 2}, -12)`);

    columnHeaders
      .append('text')
      .text(d => d.label)
      .attr('text-anchor', 'middle')
      .attr('fill', '#94a3b8')
      .attr('font-size', '11px')
      .attr('font-weight', '600')
      .attr('letter-spacing', '0.04em');

    // Draw Y Axis Labels (Sub-topic Names)
    const yLabels = svg
      .append('g')
      .attr('transform', `translate(0, ${margin.top})`)
      .selectAll('.row-label')
      .data(filteredTopics)
      .enter()
      .append('g')
      .attr('class', 'row-label')
      .attr('transform', d => `translate(0, ${y(d.subTopic)!})`)
      .style('cursor', 'pointer')
      .on('click', (_, d) => onNavigateToQuiz(d.subTopic));

    // Subject badge
    yLabels
      .append('rect')
      .attr('x', 10)
      .attr('y', 5)
      .attr('width', 64)
      .attr('height', 16)
      .attr('rx', 4)
      .attr('fill', '#1e293b')
      .attr('stroke', '#334155');

    yLabels
      .append('text')
      .attr('x', 42)
      .attr('y', 16)
      .text(d => {
        const s = d.subject || 'STEM';
        return s.length > 8 ? s.slice(0, 7) + '…' : s;
      })
      .attr('text-anchor', 'middle')
      .attr('fill', '#cbd5e1')
      .attr('font-size', '9px')
      .attr('font-weight', 'bold');

    // Sub-topic title
    yLabels
      .append('text')
      .attr('x', 82)
      .attr('y', 22)
      .text(d => {
        const maxLen = 22;
        return d.subTopic.length > maxLen ? d.subTopic.substring(0, maxLen) + '…' : d.subTopic;
      })
      .attr('fill', '#f1f5f9')
      .attr('font-size', '12px')
      .attr('font-weight', '600')
      .append('title')
      .text(d => `${d.subTopic} (${d.parentTopic})`);

    // Render Heatmap Cells
    filteredTopics.forEach(topic => {
      columns.forEach(col => {
        let cellColor = '#1e293b';
        let cellText = '';
        let cellTooltip = '';

        if (col.key === 'incorrectAnswers') {
          cellColor = incorrectColorScale(topic.incorrectAnswers);
          cellText = `${topic.incorrectAnswers} Misses`;
          cellTooltip = `${topic.incorrectAnswers} incorrect quiz answers out of ${topic.totalAttempts} attempts`;
        } else if (col.key === 'errorRate') {
          cellColor = rateColorScale(topic.errorRate);
          cellText = `${topic.errorRate}%`;
          cellTooltip = `${topic.errorRate}% error rate on this specific sub-topic`;
        } else if (col.key === 'totalAttempts') {
          cellColor = attemptsColorScale(topic.totalAttempts);
          cellText = `${topic.totalAttempts} Drills`;
          cellTooltip = `${topic.totalAttempts} total practice questions answered`;
        } else if (col.key === 'severityIndex') {
          cellColor = severityColorScale(topic.severity);
          cellText = topic.severity === 'Critical Gap' ? 'CRITICAL' : topic.severity === 'Moderate Weakness' ? 'MODERATE' : 'STABLE';
          cellTooltip = `Status: ${topic.severity} · ${topic.commonTrapSummary}`;
        }

        const cellGroup = g
          .append('g')
          .attr('transform', `translate(${x(col.key)}, ${y(topic.subTopic)})`)
          .style('cursor', 'pointer');

        // Background Rect
        cellGroup
          .append('rect')
          .attr('width', x.bandwidth())
          .attr('height', y.bandwidth())
          .attr('rx', 6)
          .attr('fill', cellColor)
          .attr('stroke', '#0f172a')
          .attr('stroke-width', 2)
          .attr('opacity', 0.85)
          .on('mouseenter', (event: MouseEvent) => {
            const target = event.currentTarget as SVGRectElement | null;
            if (!target) return;
            d3.select(target)
              .transition()
              .duration(150)
              .attr('opacity', 1)
              .attr('stroke', '#f8fafc')
              .attr('stroke-width', 2);

            const rect = target.getBoundingClientRect();
            setHoveredData({
              subTopic: topic,
              metricLabel: col.label,
              value: cellText,
              x: rect.left + rect.width / 2,
              y: rect.top - 10,
            });
          })
          .on('mouseleave', (event: MouseEvent) => {
            const target = event.currentTarget as SVGRectElement | null;
            if (target) {
              d3.select(target)
                .transition()
                .duration(150)
                .attr('opacity', 0.85)
                .attr('stroke', '#0f172a')
                .attr('stroke-width', 2);
            }

            setHoveredData(null);
          })
          .on('click', () => {
            onNavigateToQuiz(topic.subTopic);
          });

        // Cell Text Label
        cellGroup
          .append('text')
          .attr('x', x.bandwidth() / 2)
          .attr('y', y.bandwidth() / 2 + 4)
          .attr('text-anchor', 'middle')
          .attr('fill', '#ffffff')
          .attr('font-size', '11px')
          .attr('font-weight', '700')
          .attr('letter-spacing', '0.02em')
          .style('pointer-events', 'none')
          .text(cellText);
      });
    });
  }, [filteredTopics, columns, onNavigateToQuiz]);

  return (
    <div id="performance-analytics" className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 space-y-6 shadow-2xl relative overflow-hidden">
      {/* Header & Section Title */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-rose-400 uppercase tracking-wider mb-1">
            <BarChart3 className="w-4 h-4 text-rose-400" />
            <span>Diagnostic Performance Analytics · Error Matrix</span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold font-display text-white flex items-center gap-2.5">
            <span>Performance Analytics</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 font-mono-numbers">
              D3 Heatmap
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            This D3-powered analytical heatmap tracks which specific sub-topics result in the most incorrect quiz answers, isolating your knowledge gaps and conceptual traps.
          </p>
        </div>

        {/* Filter & Sort Controls */}
        <div className="flex flex-wrap items-center gap-2.5 self-stretch md:self-auto">
          {/* Subject Filter */}
          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-300">
            <Filter className="w-3.5 h-3.5 text-amber-400" />
            <select
              value={selectedSubjectFilter}
              onChange={e => setSelectedSubjectFilter(e.target.value)}
              className="bg-transparent text-slate-200 text-xs outline-none cursor-pointer"
            >
              {availableSubjects.map(subj => (
                <option key={subj} value={subj} className="bg-slate-900 text-slate-200">
                  {subj === 'All' ? 'All Subjects' : subj}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Control */}
          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-300">
            <ArrowUpDown className="w-3.5 h-3.5 text-rose-400" />
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="bg-transparent text-slate-200 text-xs outline-none cursor-pointer"
            >
              <option value="incorrect" className="bg-slate-900 text-slate-200">Sort: Most Incorrect</option>
              <option value="rate" className="bg-slate-900 text-slate-200">Sort: Highest Error Rate</option>
              <option value="attempts" className="bg-slate-900 text-slate-200">Sort: Total Attempts</option>
            </select>
          </div>
        </div>
      </div>

      {/* KPI Overview Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-slate-950 border border-rose-500/30 rounded-xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <div className="text-[11px] font-bold text-rose-400 uppercase tracking-wider">Top Vulnerability</div>
            <div className="text-sm font-bold text-white mt-1 truncate max-w-[170px]" title={topVulnerability?.subTopic}>
              {topVulnerability ? topVulnerability.subTopic : 'None'}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5 font-mono-numbers">
              {topVulnerability ? `${topVulnerability.incorrectAnswers} incorrect answers (${topVulnerability.errorRate}%)` : 'All topics mastered'}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">Total Quiz Errors</div>
            <div className="text-2xl font-bold font-mono-numbers text-white mt-0.5">
              {totalIncorrect}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Across {allSubTopics.length} tracked sub-topics
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <TrendingDown className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <div className="text-[11px] font-bold text-rose-400 uppercase tracking-wider">Critical Gaps</div>
            <div className="text-2xl font-bold font-mono-numbers text-rose-300 mt-0.5">
              {criticalGaps.length} Gaps
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Requires immediate recall drill
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
            <Target className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">Mastery Rate</div>
            <div className="text-2xl font-bold font-mono-numbers text-emerald-400 mt-0.5">
              {allSubTopics.length > 0 ? Math.round(((allSubTopics.length - criticalGaps.length) / allSubTopics.length) * 100) : 100}%
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {allSubTopics.length - criticalGaps.length} stable sub-topics
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* D3 Heatmap Canvas Container */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-200">Interactive D3 Sub-Topic Error Heatmap:</span>
            <span>Click any sub-topic or cell to launch an immediate drill</span>
          </div>

          {/* Color Legend */}
          <div className="flex items-center gap-3 text-[11px]">
            <span className="text-slate-500">Error Severity:</span>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-emerald-700 inline-block" />
              <span>Low (Stable)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-amber-500 inline-block" />
              <span>Moderate</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-rose-600 inline-block" />
              <span>High (Critical Gap)</span>
            </div>
          </div>
        </div>

        <div
          ref={containerRef}
          className="w-full overflow-x-auto bg-slate-950 rounded-2xl border border-slate-800 p-4 scrollbar-thin"
        >
          <svg ref={svgRef} className="mx-auto block" />
        </div>
      </div>

      {/* Actionable Knowledge Gap Cards (Top 3 Weaknesses) */}
      <div className="pt-2 border-t border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white font-display flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            <span>High-Yield Knowledge Gap Prescriptions</span>
          </h3>
          <span className="text-xs text-slate-400">
            Ranked by most frequent incorrect quiz submissions
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {filteredTopics.slice(0, 3).map((item, idx) => (
            <div
              key={item.subTopic}
              className="bg-slate-950 border border-slate-800 hover:border-rose-500/50 rounded-xl p-4.5 flex flex-col justify-between transition-all group"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    GAP #{idx + 1} · {item.severity.toUpperCase()}
                  </span>
                  <span className="text-xs font-mono-numbers font-bold text-rose-400">
                    {item.incorrectAnswers} Misses ({item.errorRate}%)
                  </span>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-slate-100 group-hover:text-amber-300 transition-colors">
                    {item.subTopic}
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Parent Domain: <strong className="text-slate-300">{item.parentTopic}</strong> ({item.subject})
                  </p>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-300 space-y-1">
                  <div className="text-amber-400 font-bold flex items-center gap-1">
                    <span>⚠️ The Examiner Trap:</span>
                  </div>
                  <p className="italic text-slate-400 leading-snug">
                    "{item.commonTrapSummary}"
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-900 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => onNavigateToExaminer(item.subTopic)}
                  className="text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  Face Examiner
                </button>
                <button
                  type="button"
                  onClick={() => onNavigateToQuiz(item.subTopic)}
                  className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1 transition-all cursor-pointer shadow-sm"
                >
                  <span>Drill Quiz</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Interactive D3 Tooltip */}
      {hoveredData && (
        <div
          className="fixed z-50 pointer-events-none transform -translate-x-1/2 -translate-y-full mb-3 px-3.5 py-2.5 rounded-xl bg-slate-950/95 border border-slate-700 shadow-2xl backdrop-blur-md text-xs space-y-1.5 min-w-[240px] max-w-xs transition-opacity duration-150 animate-fadeIn"
          style={{
            left: `${hoveredData.x}px`,
            top: `${hoveredData.y}px`,
          }}
        >
          <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-1.5">
            <span className="font-bold text-white truncate">{hoveredData.subTopic.subTopic}</span>
            <span
              className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase ${
                hoveredData.subTopic.severity === 'Critical Gap'
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                  : hoveredData.subTopic.severity === 'Moderate Weakness'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
              }`}
            >
              {hoveredData.subTopic.severity}
            </span>
          </div>
          <div className="text-[11px] text-slate-400">
            Domain: <strong className="text-slate-200">{hoveredData.subTopic.parentTopic}</strong> ({hoveredData.subTopic.subject})
          </div>
          <div className="grid grid-cols-2 gap-2 py-1 bg-slate-900/60 rounded-lg px-2 text-[10px] font-mono-numbers">
            <div>
              <span className="text-slate-400">Incorrect:</span>{' '}
              <strong className="text-rose-400">{hoveredData.subTopic.incorrectAnswers} misses</strong>
            </div>
            <div>
              <span className="text-slate-400">Error Rate:</span>{' '}
              <strong className="text-amber-400">{hoveredData.subTopic.errorRate}%</strong>
            </div>
            <div>
              <span className="text-slate-400">Attempts:</span>{' '}
              <strong className="text-slate-200">{hoveredData.subTopic.totalAttempts} total</strong>
            </div>
            <div>
              <span className="text-slate-400">Cell Value:</span>{' '}
              <strong className="text-cyan-300">{hoveredData.value}</strong>
            </div>
          </div>
          <div className="text-[10px] text-slate-300 pt-1 border-t border-slate-900 flex items-start gap-1">
            <span className="text-amber-400">⚠️</span>
            <span className="italic line-clamp-2">"{hoveredData.subTopic.commonTrapSummary}"</span>
          </div>
          <div className="text-[10px] text-cyan-400 font-semibold text-center pt-0.5">
            Click to launch targeted practice drill →
          </div>
        </div>
      )}
    </div>
  );
};
