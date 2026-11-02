import React, { useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Search,
  Filter,
  Play,
  Plus,
  Trash2,
  Award,
  Zap,
  Target,
  ArrowRight,
  HelpCircle,
  BookOpen,
  Sparkles,
  ChevronDown,
  ChevronUp,
  X,
  Volume2
} from 'lucide-react';
import { MistakeRecord, UserStudyState } from '../types';
import {
  recordMistakeAttempt,
  markMistakeFixed,
  deleteMistake,
  clearMasteredMistakes,
  addCustomMistake
} from '../utils/storage';
import { playCorrectSound, playIncorrectSound, playStreakFlameSound, playDeepWorkGongSound } from '../utils/audio';

interface MistakesVaultPageProps {
  studyState: UserStudyState;
  setStudyState: React.Dispatch<React.SetStateAction<UserStudyState>>;
  onRecordXp: (amount: number) => void;
  onOpenLevelPractice?: (index: number) => void;
}

export const MistakesVaultPage: React.FC<MistakesVaultPageProps> = ({
  studyState,
  setStudyState,
  onRecordXp,
  onOpenLevelPractice,
}) => {
  const mistakes = studyState.mistakesLog || [];

  // Filter & Search states
  const [filterMode, setFilterMode] = useState<'all' | 'unfixed' | 'fixed'>('unfixed');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTopic, setSelectedTopic] = useState<string>('all');
  const [selectedSource, setSelectedSource] = useState<string>('all');

  // Interactive re-test card state: mistakeId -> selectedOptionIdx | null
  const [activeRetryCardId, setActiveRetryCardId] = useState<string | null>(null);
  const [selectedRetryIdx, setSelectedRetryIdx] = useState<number | null>(null);
  const [retryEvaluated, setRetryEvaluated] = useState<boolean>(false);
  const [retryFeedback, setRetryFeedback] = useState<string | null>(null);

  // Gauntlet Modal State
  const [isGauntletOpen, setIsGauntletOpen] = useState(false);
  const [gauntletIndex, setGauntletIndex] = useState(0);
  const [gauntletSelectedOption, setGauntletSelectedOption] = useState<number | null>(null);
  const [gauntletAnswered, setGauntletAnswered] = useState(false);
  const [gauntletFixedCount, setGauntletFixedCount] = useState(0);

  // Custom Mistake Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newQuestion, setNewQuestion] = useState('');
  const [newTopic, setNewTopic] = useState('');
  const [newCorrectAnswer, setNewCorrectAnswer] = useState('');
  const [newSelectedAnswer, setNewSelectedAnswer] = useState('');
  const [newTrapNote, setNewTrapNote] = useState('');
  const [newExplanation, setNewExplanation] = useState('');

  // Stats calculation
  const totalCount = mistakes.length;
  const unfixedCount = mistakes.filter(m => !m.fixed).length;
  const fixedCount = mistakes.filter(m => m.fixed).length;
  const fixRate = totalCount > 0 ? Math.round((fixedCount / totalCount) * 100) : 100;

  // Filtered list
  const filteredMistakes = mistakes.filter(m => {
    if (filterMode === 'unfixed' && m.fixed) return false;
    if (filterMode === 'fixed' && !m.fixed) return false;
    if (selectedTopic !== 'all' && m.topic !== selectedTopic) return false;
    if (selectedSource !== 'all' && m.source !== selectedSource) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchQ = m.question.toLowerCase().includes(q);
      const matchT = m.topic.toLowerCase().includes(q);
      const matchTrap = (m.trapNote || '').toLowerCase().includes(q);
      const matchExp = m.examinerExplanation.toLowerCase().includes(q);
      if (!matchQ && !matchT && !matchTrap && !matchExp) return false;
    }
    return true;
  });

  // Extract unique topics for filter dropdown
  const uniqueTopics = Array.from(new Set(mistakes.map(m => m.topic))).filter(Boolean);

  // Handle single card retry action
  const handleStartCardRetry = (mistakeId: string) => {
    setActiveRetryCardId(mistakeId);
    setSelectedRetryIdx(null);
    setRetryEvaluated(false);
    setRetryFeedback(null);
  };

  const handleSubmitCardRetry = (mistake: MistakeRecord, chosenOptionText: string) => {
    const isCorrect = chosenOptionText.trim().toLowerCase() === mistake.correctAnswer.trim().toLowerCase();

    if (isCorrect) {
      playCorrectSound();
      playStreakFlameSound();
      setRetryFeedback('🎉 Mistake Conquered! (+25 XP) Superb correction—you dismantled the trap.');
      onRecordXp(25);

      const { updatedState } = recordMistakeAttempt(studyState, mistake.id, true);
      setStudyState(updatedState);
    } else {
      playIncorrectSound();
      setRetryFeedback('❌ Still an examiner distractor. Examine the trap note below and re-think the mechanism.');
      const { updatedState } = recordMistakeAttempt(studyState, mistake.id, false);
      setStudyState(updatedState);
    }
    setRetryEvaluated(true);
  };

  const handleToggleManualFix = (mistakeId: string, currentFixed: boolean) => {
    if (!currentFixed) {
      playCorrectSound();
      onRecordXp(15);
      const updated = markMistakeFixed(studyState, mistakeId);
      setStudyState(updated);
    } else {
      // Re-open mistake
      setStudyState(prev => {
        const logs = (prev.mistakesLog || []).map(m => m.id === mistakeId ? { ...m, fixed: false } : m);
        return { ...prev, mistakesLog: logs };
      });
    }
  };

  const handleDelete = (mistakeId: string) => {
    const updated = deleteMistake(studyState, mistakeId);
    setStudyState(updated);
    if (activeRetryCardId === mistakeId) {
      setActiveRetryCardId(null);
    }
  };

  const handleClearMastered = () => {
    if (window.confirm('Archive all mastered mistakes? Only unfixed mistakes will remain in your active log.')) {
      const updated = clearMasteredMistakes(studyState);
      setStudyState(updated);
    }
  };

  // Gauntlet / Rapid Mistake Drill Handler
  const unfixedList = mistakes.filter(m => !m.fixed);
  const currentGauntletItem = unfixedList[gauntletIndex];

  const handleStartGauntlet = () => {
    if (unfixedList.length === 0) return;
    setGauntletIndex(0);
    setGauntletSelectedOption(null);
    setGauntletAnswered(false);
    setGauntletFixedCount(0);
    setIsGauntletOpen(true);
  };

  const handleGauntletSelectOption = (idx: number) => {
    if (gauntletAnswered || !currentGauntletItem) return;
    setGauntletSelectedOption(idx);
    setGauntletAnswered(true);

    const options = currentGauntletItem.options || [
      currentGauntletItem.correctAnswer,
      currentGauntletItem.selectedAnswer,
    ];
    const chosen = options[idx];
    const isCorrect = chosen.trim().toLowerCase() === currentGauntletItem.correctAnswer.trim().toLowerCase();

    if (isCorrect) {
      playCorrectSound();
      playStreakFlameSound();
      onRecordXp(25);
      setGauntletFixedCount(prev => prev + 1);
      const { updatedState } = recordMistakeAttempt(studyState, currentGauntletItem.id, true);
      setStudyState(updatedState);
    } else {
      playIncorrectSound();
      const { updatedState } = recordMistakeAttempt(studyState, currentGauntletItem.id, false);
      setStudyState(updatedState);
    }
  };

  const handleGauntletNext = () => {
    if (gauntletIndex + 1 < unfixedList.length) {
      setGauntletIndex(prev => prev + 1);
      setGauntletSelectedOption(null);
      setGauntletAnswered(false);
    } else {
      // Completed gauntlet
      setIsGauntletOpen(false);
      playDeepWorkGongSound();
      onRecordXp(50);
    }
  };

  const handleSaveCustomMistake = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestion.trim() || !newCorrectAnswer.trim()) return;

    const options = [
      newCorrectAnswer.trim(),
      newSelectedAnswer.trim() || 'Intuitive distractor',
      'Common misreading trap',
      'Opposite directional shift',
    ].filter(Boolean);

    const updated = addCustomMistake(studyState, {
      question: newQuestion.trim(),
      topic: newTopic.trim() || 'Custom Practice Problem',
      subject: studyState.activeExamPlan?.profile?.subject || 'Exam Preparation',
      options,
      selectedAnswer: newSelectedAnswer.trim() || 'My previous incorrect attempt',
      correctAnswer: newCorrectAnswer.trim(),
      examinerExplanation: newExplanation.trim() || 'Review fundamental core concepts and step-by-step reasoning.',
      trapNote: newTrapNote.trim() || 'Examiner distractor trap noted from practice session.',
      source: 'manual',
    });

    setStudyState(updated);
    setIsAddModalOpen(false);
    setNewQuestion('');
    setNewTopic('');
    setNewCorrectAnswer('');
    setNewSelectedAnswer('');
    setNewTrapNote('');
    setNewExplanation('');
    playCorrectSound();
  };

  const getSourceBadge = (source: MistakeRecord['source']) => {
    switch (source) {
      case 'level-drill':
        return { label: 'Level Drill', color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' };
      case 'quiz':
        return { label: 'Daily Quiz', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' };
      case 'examiner':
        return { label: 'Angry Examiner', color: 'bg-rose-500/10 text-rose-400 border-rose-500/20' };
      case 'session':
        return { label: 'Study Session', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' };
      case 'manual':
      default:
        return { label: 'Logged Mistake', color: 'bg-slate-700/40 text-slate-300 border-slate-600/40' };
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* 1. Header Banner & Mastery Metrics */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-rose-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/30 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" />
                Mistake Vault & Error Clinic
              </span>
              <span className="text-xs text-slate-400 font-medium">
                Active Recall Error Dismantling
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              See & Fix Your Exam Mistakes
            </h1>
            <p className="text-sm text-slate-400 max-w-2xl leading-relaxed">
              Every error is high-yield data. Re-test your missed questions without spoilers, dissect examiner trap mechanisms, and turn former weaknesses into exam day certainty.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            {unfixedCount > 0 && (
              <button
                type="button"
                onClick={handleStartGauntlet}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-400 hover:to-amber-400 text-white font-bold text-xs sm:text-sm shadow-lg shadow-rose-500/25 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Fix All Unfixed ({unfixedCount})</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-white font-bold text-xs sm:text-sm transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-cyan-400" />
              <span>Log Past Paper Mistake</span>
            </button>

            {fixedCount > 0 && (
              <button
                type="button"
                onClick={handleClearMastered}
                title="Archive Mastered Mistakes"
                className="px-3 py-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-rose-400 text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Clean Mastered</span>
              </button>
            )}
          </div>
        </div>

        {/* Live Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-6 pt-6 border-t border-slate-800/80">
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-3.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Total Logged
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-white font-mono-numbers">{totalCount}</span>
              <span className="text-xs text-slate-500">questions</span>
            </div>
          </div>

          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-3.5">
            <span className="text-[11px] font-bold text-rose-400 uppercase tracking-wider block">
              Needs Fixing
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-rose-400 font-mono-numbers">{unfixedCount}</span>
              <span className="text-xs text-rose-400/70">unresolved</span>
            </div>
          </div>

          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-3.5">
            <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block">
              Mastered & Fixed
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-emerald-400 font-mono-numbers">{fixedCount}</span>
              <span className="text-xs text-emerald-400/70">neutralized</span>
            </div>
          </div>

          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-3.5">
            <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider block">
              Resolution Rate
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-cyan-400 font-mono-numbers">{fixRate}%</span>
              <span className="text-xs text-cyan-400/70">efficiency</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Controls, Search & Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-md">
        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 overflow-x-auto">
          <button
            type="button"
            onClick={() => setFilterMode('unfixed')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              filterMode === 'unfixed'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Needs Fixing ({unfixedCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              filterMode === 'all'
                ? 'bg-slate-800 text-white border border-slate-700 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All Mistakes ({totalCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('fixed')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              filterMode === 'fixed'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Mastered ({fixedCount})
          </button>
        </div>

        {/* Search & Topic Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search Input */}
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search questions or traps..."
              className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Topic Dropdown */}
          {uniqueTopics.length > 0 && (
            <select
              value={selectedTopic}
              onChange={e => setSelectedTopic(e.target.value)}
              className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-cyan-500 cursor-pointer"
            >
              <option value="all">All Topics</option>
              {uniqueTopics.map(t => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          )}

          {/* Source Dropdown */}
          <select
            value={selectedSource}
            onChange={e => setSelectedSource(e.target.value)}
            className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-cyan-500 cursor-pointer"
          >
            <option value="all">All Sources</option>
            <option value="quiz">Daily Quiz</option>
            <option value="level-drill">Level Drill</option>
            <option value="examiner">Angry Examiner</option>
            <option value="session">Study Session</option>
            <option value="manual">Logged Mistake</option>
          </select>
        </div>
      </div>

      {/* 3. Mistakes List Cards */}
      {filteredMistakes.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h3 className="text-lg font-bold text-white">
              {filterMode === 'unfixed' ? 'Zero Unfixed Mistakes!' : 'No Mistakes Found'}
            </h3>
            <p className="text-xs text-slate-400">
              {filterMode === 'unfixed'
                ? 'All logged mistakes have been successfully corrected and mastered. Keep drilling in the Daily Quiz or Level Missions to stress-test your knowledge!'
                : 'No mistakes match the active search and filter criteria.'}
            </p>
          </div>
          {filterMode === 'unfixed' && totalCount > 0 && (
            <button
              type="button"
              onClick={() => setFilterMode('all')}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors cursor-pointer"
            >
              Review All {totalCount} Previous Mistakes
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredMistakes.map((mistake, idx) => {
            const isRetrying = activeRetryCardId === mistake.id;
            const src = getSourceBadge(mistake.source);
            const options = mistake.options || [
              mistake.correctAnswer,
              mistake.selectedAnswer,
              'Alternative distractor',
              'Sub-optimal phrasing'
            ];

            return (
              <div
                key={mistake.id}
                className={`bg-slate-900 border rounded-2xl p-5 sm:p-6 transition-all shadow-lg space-y-4 ${
                  mistake.fixed
                    ? 'border-emerald-500/30 bg-emerald-950/10'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Card Top Metadata Header */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${src.color}`}>
                      {src.label}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-300 px-2 py-0.5 rounded-lg bg-slate-800 border border-slate-700">
                      {mistake.topic}
                    </span>
                    {mistake.subject && (
                      <span className="text-[10px] text-slate-500 hidden sm:inline">
                        · {mistake.subject}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-500 font-mono-numbers">
                      {mistake.timestamp}
                    </span>
                    {mistake.attemptsCount > 1 && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono-numbers">
                        {mistake.attemptsCount} attempts
                      </span>
                    )}
                    {mistake.fixed ? (
                      <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center gap-1 font-mono-numbers">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Mastered</span>
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full bg-rose-500/15 text-rose-300 border border-rose-500/30 text-xs font-bold flex items-center gap-1 font-mono-numbers">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>Needs Fixing</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Question Prompt */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">
                    Question Missed
                  </span>
                  <p className="text-sm sm:text-base font-semibold text-white leading-relaxed">
                    {mistake.question}
                  </p>
                </div>

                {/* What you originally selected vs reality with specific reason why */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1 font-mono">
                        <X className="w-3.5 h-3.5" />
                        Why Your Choice Was Wrong:
                      </span>
                    </div>
                    <div className="text-xs text-rose-200 line-through opacity-85 font-mono bg-rose-950/40 p-1.5 rounded-lg border border-rose-500/20">
                      "{mistake.selectedAnswer}"
                    </div>
                    <p className="text-xs text-slate-200 leading-relaxed font-sans">
                      {mistake.whyPickedWrong || `This choice was a distractor trap. It inverts the true governing rule or rate-limiting mechanism, causing students to confuse an acute effect with the fundamental cause.`}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1 font-mono">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Why The Target Principle Is Correct:
                    </span>
                    <div className="text-xs text-emerald-300 font-medium font-mono bg-emerald-950/40 p-1.5 rounded-lg border border-emerald-500/20">
                      {mistake.fixed || isRetrying ? `"${mistake.correctAnswer}"` : '•••••••• Hidden for Interactive Re-test (Click Fix below)'}
                    </div>
                    <p className="text-xs text-slate-200 leading-relaxed font-sans">
                      {mistake.examinerExplanation}
                    </p>
                  </div>
                </div>

                {/* Examiner's Trap Anatomy & Nuance Breakdown */}
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 space-y-1 text-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1">
                    <Target className="w-3 h-3" />
                    Examiner Trap Breakdown:
                  </span>
                  {mistake.trapNote && (
                    <p className="text-amber-200 font-medium leading-relaxed">
                      {mistake.trapNote}
                    </p>
                  )}
                  <p className="text-slate-300 text-[11px] leading-relaxed pt-1 border-t border-amber-500/20">
                    <strong className="text-amber-300">Biological / Theoretical Reality:</strong> {mistake.examinerExplanation}
                  </p>
                </div>

                {/* Interactive Re-Test Area */}
                {isRetrying && (
                  <div className="mt-3 p-4 rounded-xl bg-slate-950 border border-cyan-500/40 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                        Interactive Fix Drill: Select the Correct Answer Now
                      </span>
                      <button
                        type="button"
                        onClick={() => setActiveRetryCardId(null)}
                        className="text-slate-400 hover:text-white text-xs"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="space-y-2">
                      {options.map((optText, optIdx) => {
                        const letter = String.fromCharCode(65 + optIdx);
                        const isSelected = selectedRetryIdx === optIdx;
                        return (
                          <button
                            key={optIdx}
                            type="button"
                            onClick={() => {
                              setSelectedRetryIdx(optIdx);
                              handleSubmitCardRetry(mistake, optText);
                            }}
                            className={`w-full text-left p-3 rounded-xl border text-xs sm:text-sm transition-all flex items-start gap-2.5 cursor-pointer ${
                              isSelected
                                ? 'bg-cyan-500/20 border-cyan-500 text-white font-semibold'
                                : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-200'
                            }`}
                          >
                            <span className="w-5 h-5 rounded-md bg-slate-800 text-slate-300 text-xs font-bold flex items-center justify-center shrink-0">
                              {letter}
                            </span>
                            <span className="flex-1">{optText}</span>
                          </button>
                        );
                      })}
                    </div>

                    {retryFeedback && (
                      <div className={`p-3 rounded-xl text-xs font-medium ${
                        retryFeedback.includes('🎉')
                          ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/40'
                          : 'bg-rose-500/20 text-rose-200 border border-rose-500/40'
                      }`}>
                        {retryFeedback}
                      </div>
                    )}
                  </div>
                )}

                {/* Footer Action Buttons */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <div className="flex items-center gap-2">
                    {!isRetrying && (
                      <button
                        type="button"
                        onClick={() => handleStartCardRetry(mistake.id)}
                        className="px-3 py-1.5 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>{mistake.fixed ? 'Re-Test Mastery' : 'Fix This Mistake Now'}</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleToggleManualFix(mistake.id, mistake.fixed)}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                        mistake.fixed
                          ? 'bg-slate-800 border-slate-700 text-slate-400 hover:text-rose-400'
                          : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/25'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{mistake.fixed ? 'Mark as Unfixed' : 'Mark as Mastered'}</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDelete(mistake.id)}
                    title="Remove from Mistake Vault"
                    className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 4. Rapid Gauntlet Modal (Fix All Unfixed Sequential Drill) */}
      {isGauntletOpen && currentGauntletItem && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/30">
                  Mistake Gauntlet
                </span>
                <span className="text-xs text-slate-400 font-mono-numbers">
                  Item {gauntletIndex + 1} of {unfixedList.length}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsGauntletOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Question */}
            <div className="space-y-2">
              <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider block">
                {currentGauntletItem.topic}
              </span>
              <h3 className="text-base sm:text-lg font-bold text-white leading-relaxed">
                {currentGauntletItem.question}
              </h3>
            </div>

            {/* Options */}
            <div className="space-y-2.5">
              {(
                currentGauntletItem.options || [
                  currentGauntletItem.correctAnswer,
                  currentGauntletItem.selectedAnswer,
                ]
              ).map((opt, oIdx) => {
                const isSelected = gauntletSelectedOption === oIdx;
                const isCorrect = opt.trim().toLowerCase() === currentGauntletItem.correctAnswer.trim().toLowerCase();

                let btnStyle = 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-200';
                if (gauntletAnswered) {
                  if (isCorrect) {
                    btnStyle = 'bg-emerald-950/40 border-emerald-500 text-emerald-100 font-semibold ring-1 ring-emerald-500/50';
                  } else if (isSelected && !isCorrect) {
                    btnStyle = 'bg-rose-950/40 border-rose-500 text-rose-200 ring-1 ring-rose-500/50';
                  }
                }

                return (
                  <button
                    key={oIdx}
                    type="button"
                    disabled={gauntletAnswered}
                    onClick={() => handleGauntletSelectOption(oIdx)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-start gap-3 cursor-pointer ${btnStyle}`}
                  >
                    <span className="w-6 h-6 rounded-lg bg-slate-800 text-slate-300 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 font-mono-numbers">
                      {String.fromCharCode(65 + oIdx)}
                    </span>
                    <span className="text-xs sm:text-sm leading-relaxed">{opt}</span>
                  </button>
                );
              })}
            </div>

            {/* Feedback & Trap notes */}
            {gauntletAnswered && (
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 animate-fadeIn">
                <span className="text-xs font-bold text-emerald-400 block">
                  Examiner Clarification:
                </span>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {currentGauntletItem.examinerExplanation}
                </p>
                {currentGauntletItem.trapNote && (
                  <p className="text-[11px] text-amber-300/90 leading-relaxed">
                    ⚠️ {currentGauntletItem.trapNote}
                  </p>
                )}
              </div>
            )}

            {/* Gauntlet Footer */}
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-slate-500">
                Fixed in this session: <strong className="text-emerald-400">{gauntletFixedCount}</strong>
              </span>

              {gauntletAnswered && (
                <button
                  type="button"
                  onClick={handleGauntletNext}
                  className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs sm:text-sm shadow-lg shadow-cyan-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <span>{gauntletIndex + 1 < unfixedList.length ? 'Next Mistake' : 'Finish Gauntlet (+50 XP)'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 5. Add Custom Mistake Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 sm:p-7 space-y-5 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
                  Manual Entry
                </span>
                <h3 className="text-base font-bold text-white">Log Past Paper Mistake</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomMistake} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-300 block">
                  Question or Problem Missed *
                </label>
                <textarea
                  rows={2}
                  required
                  value={newQuestion}
                  onChange={e => setNewQuestion(e.target.value)}
                  placeholder="e.g. During active axonal transport, what is the exact net charge movement per ATP?"
                  className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-300 block">
                    Topic / Sub-Topic
                  </label>
                  <input
                    type="text"
                    value={newTopic}
                    onChange={e => setNewTopic(e.target.value)}
                    placeholder="e.g. Membrane Transport"
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-rose-300 block">
                    Your Incorrect Answer
                  </label>
                  <input
                    type="text"
                    value={newSelectedAnswer}
                    onChange={e => setNewSelectedAnswer(e.target.value)}
                    placeholder="e.g. Electroneutral exchange"
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-emerald-300 block">
                  Correct Answer & Principle *
                </label>
                <input
                  type="text"
                  required
                  value={newCorrectAnswer}
                  onChange={e => setNewCorrectAnswer(e.target.value)}
                  placeholder="e.g. 3 Na+ out, 2 K+ in (Net +1 outward)"
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-amber-300 block">
                  Why Did You Miss It? (Trap Breakdown)
                </label>
                <input
                  type="text"
                  value={newTrapNote}
                  onChange={e => setNewTrapNote(e.target.value)}
                  placeholder="e.g. Confused with NKCC co-transporters"
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-300 block">
                  Detailed Explanation / Memory Hook
                </label>
                <textarea
                  rows={2}
                  value={newExplanation}
                  onChange={e => setNewExplanation(e.target.value)}
                  placeholder="e.g. 3-2-1 rule: 3 Na+ out, 2 K+ in, 1 ATP consumed."
                  className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition-all shadow-md shadow-cyan-500/20 cursor-pointer"
                >
                  Save to Vault
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
