import React, { useState, useEffect } from 'react';
import {
  Layers,
  Sparkles,
  CheckCircle2,
  Circle,
  HelpCircle,
  ArrowRight,
  Flame,
  Award,
  RefreshCw,
  AlertTriangle,
  Zap,
  Target,
  ChevronLeft,
  ChevronRight,
  Check,
  BookOpen,
  ArrowLeft,
  Maximize2,
  Minimize2,
  Map,
  TrendingUp,
  TrendingDown,
  Activity,
  Brain,
  ShieldAlert,
  Gauge,
  Wand2
} from 'lucide-react';
import { ExamMilestone, ExamPlan } from '../types';
import { playCorrectSound, playIncorrectSound, playStreakFlameSound } from '../utils/audio';
import { DEFAULT_EXAM_PLAN } from '../utils/storage';
import { RoadmapActionItemsDeck } from './RoadmapActionItemSection';
import { CosmicRoadmapLevelMap } from './CosmicRoadmapLevelMap';
import {
  calculateAdaptiveProgression,
  DIFFICULTY_TIERS,
  ORDERED_TIERS,
  AdaptiveDifficultyTier,
  AdaptiveResult,
  getCuratedAdaptiveQuestion
} from '../utils/adaptiveEngine';
import { getDetailedAnswerExplanation } from '../utils/answerExplanation';
import { WrongAnswerBreakdownCard } from './WrongAnswerBreakdownCard';
import { QuestionCreatorStudio } from './QuestionCreatorStudio';

export interface MissionQuestion {
  id: string;
  topic: string;
  question: string;
  options: string[];
  correctIndex: number;
  angryExplanation: string;
  examinerTrapNotes: string;
  distractorExplanations?: string[];
  levelTip?: string;
  difficulty?: string;
  passage?: string;
  passageTitle?: string;
}

interface RoadmapLevelPracticePageProps {
  milestones?: ExamMilestone[];
  activeLevelIndex: number;
  onSelectLevelIndex: (index: number) => void;
  completedLevels: number[];
  onToggleCompleteLevel: (index: number) => void;
  onRecordXp?: (amount: number) => void;
  onRecordQuestionAnswered?: (isCorrect: boolean) => void;
  onRecordSubTopicResult?: (subTopic: string, parentTopic: string, isCorrect: boolean, trapNote?: string, subject?: string) => void;
  onRecordMistake?: (mistake: {
    question: string;
    passage?: string;
    passageTitle?: string;
    topic: string;
    subject?: string;
    options?: string[];
    selectedAnswer: string;
    correctAnswer: string;
    examinerExplanation: string;
    whyPickedWrong?: string;
    trapNote?: string;
    source: 'level-drill';
  }) => void;
  activeExamPlan?: ExamPlan | null;
  onBackToPlan?: () => void;
  onStartStudySession?: () => void;
}

export const RoadmapLevelPracticePage: React.FC<RoadmapLevelPracticePageProps> = ({
  milestones,
  activeLevelIndex = 0,
  onSelectLevelIndex,
  completedLevels = [],
  onToggleCompleteLevel,
  onRecordXp,
  onRecordQuestionAnswered,
  onRecordSubTopicResult,
  onRecordMistake,
  activeExamPlan,
  onBackToPlan,
  onStartStudySession,
}) => {
  // Ensure we always have milestones to select from
  const effectiveMilestones = (milestones && milestones.length > 0)
    ? milestones
    : (activeExamPlan?.milestones && activeExamPlan.milestones.length > 0)
    ? activeExamPlan.milestones
    : DEFAULT_EXAM_PLAN.milestones;

  const currentMilestone = effectiveMilestones[activeLevelIndex] || effectiveMilestones[0];
  const levelNum = activeLevelIndex + 1;
  const isCurrentLevelCompleted = completedLevels.includes(activeLevelIndex);

  // Quiz state
  const [questions, setQuestions] = useState<MissionQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [checkedActionItems, setCheckedActionItems] = useState<Record<string, boolean>>({});

  const prefersPassage = Boolean(
    activeExamPlan?.profile?.questionTypes?.some(qt => qt.toLowerCase().includes('passage'))
  );
  const [includeReadingPassage, setIncludeReadingPassage] = useState<boolean>(prefersPassage);

  // Default passage length from exam plan
  const defaultPassageLength = activeExamPlan?.profile?.passageLengthPreference ||
    (activeExamPlan?.profile?.questionTypes?.some(qt => qt.toLowerCase().includes('6+')) ? 'long-6-plus' : 'standard');
  const [passageLength, setPassageLength] = useState<'standard' | 'long-6-plus'>(defaultPassageLength);
  const [isPassageExpanded, setIsPassageExpanded] = useState<boolean>(false);
  const [showCosmicMap, setShowCosmicMap] = useState<boolean>(false);
  const [showCreatorModal, setShowCreatorModal] = useState<boolean>(false);

  // Adaptive Difficulty State (AI changes difficulty based on performance)
  const [isAdaptiveMode, setIsAdaptiveMode] = useState<boolean>(true);
  const [currentTier, setCurrentTier] = useState<AdaptiveDifficultyTier>('Standard');
  const [skillRating, setSkillRating] = useState<number>(1200);
  const [streak, setStreak] = useState<number>(0);
  const [lastAdaptiveResult, setLastAdaptiveResult] = useState<AdaptiveResult | null>(null);
  const [isFetchingAdaptiveNext, setIsFetchingAdaptiveNext] = useState<boolean>(false);
  const [adaptiveHistory, setAdaptiveHistory] = useState<Array<{
    qNum: number;
    questionText: string;
    tier: AdaptiveDifficultyTier;
    wasCorrect: boolean;
    nextTier: AdaptiveDifficultyTier;
    deltaRating: number;
    rationale: string;
  }>>([]);

  useEffect(() => {
    setIncludeReadingPassage(prefersPassage);
    if (activeExamPlan?.profile?.passageLengthPreference) {
      setPassageLength(activeExamPlan.profile.passageLengthPreference);
    }
  }, [prefersPassage, activeExamPlan?.profile?.passageLengthPreference]);

  // Generate / Load questions whenever activeLevelIndex changes
  useEffect(() => {
    fetchLevelQuestions(currentMilestone, activeLevelIndex, includeReadingPassage, passageLength);
  }, [activeLevelIndex]);

  const fetchLevelQuestions = async (
    ms: ExamMilestone,
    lvlIdx: number,
    passageActive?: boolean,
    lengthPref?: 'standard' | 'long-6-plus'
  ) => {
    const usePassage = passageActive !== undefined ? passageActive : includeReadingPassage;
    const useLength = lengthPref !== undefined ? lengthPref : passageLength;
    setLoading(true);
    setCurrentIndex(0);
    setSelectedOption(null);
    setHasAnswered(false);
    setScore(0);
    setIsFinished(false);
    setCurrentTier('Standard');
    setStreak(0);
    setLastAdaptiveResult(null);
    setAdaptiveHistory([]);

    try {
      const res = await fetch('/api/roadmap/generate-level-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          milestone: ms,
          levelIndex: lvlIdx,
          subject: activeExamPlan?.profile?.subject || 'Science / Academic Exam',
          gradeLevel: activeExamPlan?.profile?.gradeLevel || 'College / University',
          questionTypes: activeExamPlan?.profile?.questionTypes || ['Multiple Choice Questions'],
          includeReadingPassage: usePassage,
          passageLengthPreference: useLength,
          isLongPassage: useLength === 'long-6-plus',
          count: 5,
        }),
      });

      if (!res.ok) throw new Error('Failed to generate questions');
      const data = await res.json();
      if (data.questions && Array.isArray(data.questions) && data.questions.length > 0) {
        setQuestions(data.questions);
      } else {
        throw new Error('No questions returned');
      }
    } catch (err) {
      console.error('Error loading level mission questions:', err);
      // Fallback questions built directly for this level
      setQuestions([
        {
          id: `fallback-${Date.now()}-1`,
          topic: ms.title,
          difficulty: 'Standard',
          question: `Regarding ${ms.title}: what is the decisive rate-limiting checkpoint or regulatory constraint?`,
          options: [
            'The initial committed step that requires the highest activation energy and controls pathway velocity',
            'A random passive leak that operates identically under all conditions without energy input',
            'An unmonitored backward reaction that spontaneously destroys all intermediates',
            'An instantaneous reaction with zero intermediate states'
          ],
          correctIndex: 0,
          angryExplanation: `Correct! Every single system in ${ms.title} controls the committed step to conserve cellular resources and prevent runaway excitation.`,
          examinerTrapNotes: 'Examiners always target the committed step. Do not pick passive uninhibited options.',
          levelTip: `Mission Priority: ${ms.focus}`
        },
        {
          id: `fallback-${Date.now()}-2`,
          topic: ms.title,
          difficulty: 'Challenging',
          question: `What primary mistake causes students to fail questions on ${ms.title}?`,
          options: [
            'Confusing cause and effect by treating an acute response as a baseline maintenance pump',
            'Assuming that chemical reactions follow thermodynamic conservation laws',
            'Stating that biological systems maintain strict negative feedback',
            'Identifying specific receptor subunits and ions'
          ],
          correctIndex: 0,
          angryExplanation: `Spot on! Examiners routinely set distractor traps where the answer is the trigger rather than the downstream restorative mechanism.`,
          examinerTrapNotes: 'Never confuse the trigger with the consequence on multiple-choice questions.',
          levelTip: 'Always trace: Trigger -> Conformational shift -> Effector -> Reset.'
        },
        {
          id: `fallback-${Date.now()}-3`,
          topic: ms.title,
          difficulty: 'Brutal Trap',
          question: `If an antagonist blocks the mandatory shut-off or repolarization mechanism in ${ms.title}, what will occur?`,
          options: [
            'Runaway excitation or toxic metabolic accumulation occurs because the shut-off gate is blocked',
            'The pathway immediately shuts down completely and permanently',
            'ATP production increases exponentially with zero oxygen consumption',
            'The baseline electrochemical gradient reverses without ion movement'
          ],
          correctIndex: 0,
          angryExplanation: `Exact! Biological pathways require a termination signal. Without negative feedback or inactivation, runaway excitation or metabolic crisis occurs.`,
          examinerTrapNotes: 'Remember the dam principle: block the shut-off gate and downstream effects run out of control.',
          levelTip: 'Every high-scoring answer must include how the pathway shuts down safely.'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectLevel = (idx: number) => {
    if (idx === activeLevelIndex) return;
    playStreakFlameSound();
    onSelectLevelIndex(idx);
  };

  const handleAnswerOption = (idx: number) => {
    if (hasAnswered) return;
    setSelectedOption(idx);
    setHasAnswered(true);

    const currentQ = questions[currentIndex];
    const isCorrect = idx === currentQ.correctIndex;

    if (isCorrect) {
      playCorrectSound();
      setScore(prev => prev + 1);
      onRecordXp?.(25);
      onRecordQuestionAnswered?.(true);
    } else {
      playIncorrectSound();
      onRecordQuestionAnswered?.(false);
    }

    // Adaptive Progression Calculation
    if (isAdaptiveMode) {
      const result = calculateAdaptiveProgression(
        currentTier,
        isCorrect,
        streak,
        skillRating,
        currentQ.examinerTrapNotes
      );
      setStreak(result.streak);
      setSkillRating(result.newSkillRating);
      setLastAdaptiveResult(result);
      setAdaptiveHistory(prev => [
        ...prev,
        {
          qNum: currentIndex + 1,
          questionText: currentQ.question,
          tier: currentTier,
          wasCorrect: isCorrect,
          nextTier: result.nextTier,
          deltaRating: result.deltaRating,
          rationale: result.rationale,
        }
      ]);

      if (result.direction === 'up') {
        playStreakFlameSound();
      }
    }

    if (onRecordSubTopicResult) {
      onRecordSubTopicResult(
        currentQ.topic || currentMilestone.title,
        currentMilestone.title,
        isCorrect,
        currentQ.examinerTrapNotes,
        activeExamPlan?.profile?.subject
      );
    }

    if (!isCorrect && onRecordMistake) {
      onRecordMistake({
        question: currentQ.question,
        passage: currentQ.passage,
        passageTitle: currentQ.passageTitle,
        topic: currentQ.topic || currentMilestone.title,
        subject: activeExamPlan?.profile?.subject,
        options: currentQ.options,
        selectedAnswer: currentQ.options[idx],
        correctAnswer: currentQ.options[currentQ.correctIndex],
        examinerExplanation: currentQ.angryExplanation,
        trapNote: currentQ.examinerTrapNotes,
        source: 'level-drill',
      });
    }
  };

  const handleNextQuestion = async () => {
    if (currentIndex + 1 < questions.length) {
      if (isAdaptiveMode && lastAdaptiveResult) {
        const targetTier = lastAdaptiveResult.nextTier;
        setIsFetchingAdaptiveNext(true);
        try {
          const res = await fetch('/api/adaptive/next-question', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              subject: activeExamPlan?.profile?.subject || 'Science / Academic Exam',
              topic: currentMilestone.title,
              milestoneTitle: currentMilestone.title,
              currentDifficulty: currentTier,
              wasCorrect: selectedOption === currentQ.correctIndex,
              streak: lastAdaptiveResult.streak,
              lastTrapNote: currentQ.examinerTrapNotes,
              includeReadingPassage,
              passageLengthPreference: passageLength,
              questionTypes: activeExamPlan?.profile?.questionTypes || ['Multiple Choice Questions'],
            }),
          });
          if (res.ok) {
            const data = await res.json();
            if (data.question) {
              setQuestions(prev => {
                const nextQs = [...prev];
                nextQs[currentIndex + 1] = {
                  ...nextQs[currentIndex + 1],
                  ...data.question,
                  difficulty: targetTier,
                };
                return nextQs;
              });
            }
          }
        } catch (err) {
          console.warn('Adaptive API failed, using curated tier question:', err);
          const fallback = getCuratedAdaptiveQuestion(currentMilestone.title, targetTier, activeExamPlan?.profile?.subject);
          setQuestions(prev => {
            const nextQs = [...prev];
            nextQs[currentIndex + 1] = {
              ...nextQs[currentIndex + 1],
              ...fallback,
            };
            return nextQs;
          });
        } finally {
          setIsFetchingAdaptiveNext(false);
          setCurrentTier(targetTier);
          setCurrentIndex(prev => prev + 1);
          setSelectedOption(null);
          setHasAnswered(false);
          setLastAdaptiveResult(null);
        }
      } else {
        setCurrentIndex(prev => prev + 1);
        setSelectedOption(null);
        setHasAnswered(false);
      }
    } else {
      setIsFinished(true);
      playStreakFlameSound();
      if (score >= Math.ceil(questions.length * 0.7)) {
        onRecordXp?.(100);
      }
    }
  };

  // Continue Infinite Adaptive Sparring
  const handleContinueAdaptiveDrill = async () => {
    setIsFetchingAdaptiveNext(true);
    const targetTier = currentTier;
    try {
      const res = await fetch('/api/adaptive/next-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: activeExamPlan?.profile?.subject || 'Science / Academic Exam',
          topic: currentMilestone.title,
          milestoneTitle: currentMilestone.title,
          currentDifficulty: targetTier,
          wasCorrect: true,
          streak,
          includeReadingPassage,
          passageLengthPreference: passageLength,
          questionTypes: activeExamPlan?.profile?.questionTypes || ['Multiple Choice Questions'],
        }),
      });
      let newQ: MissionQuestion;
      if (res.ok) {
        const data = await res.json();
        newQ = data.question;
      } else {
        newQ = getCuratedAdaptiveQuestion(currentMilestone.title, targetTier, activeExamPlan?.profile?.subject);
      }
      setQuestions(prev => [...prev, newQ]);
      setCurrentIndex(questions.length);
      setSelectedOption(null);
      setHasAnswered(false);
      setLastAdaptiveResult(null);
      setIsFinished(false);
    } catch {
      const fallback = getCuratedAdaptiveQuestion(currentMilestone.title, targetTier, activeExamPlan?.profile?.subject);
      setQuestions(prev => [...prev, fallback]);
      setCurrentIndex(questions.length);
      setSelectedOption(null);
      setHasAnswered(false);
      setLastAdaptiveResult(null);
      setIsFinished(false);
    } finally {
      setIsFetchingAdaptiveNext(false);
    }
  };

  const toggleActionItem = (actionIdx: number) => {
    const key = `${activeLevelIndex}-${actionIdx}`;
    setCheckedActionItems(prev => {
      const next = !prev[key];
      if (next) playStreakFlameSound();
      return { ...prev, [key]: next };
    });
  };

  const currentQ = questions[currentIndex];

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fadeIn py-2 sm:py-4">
      {/* Top Breadcrumb & Return to Plan */}
      <div className="flex items-center justify-between gap-3 text-xs">
        <button
          type="button"
          onClick={onBackToPlan}
          className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors cursor-pointer group px-2 py-1 rounded-lg hover:bg-slate-900"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Back to Exam War Plan</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-slate-500 font-mono-numbers">
            {completedLevels.length} of {effectiveMilestones.length} Levels Mastered
          </span>
          {isCurrentLevelCompleted && (
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-[11px] border border-emerald-500/40 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              Mastered
            </span>
          )}
        </div>
      </div>

      {/* 1. INTERACTIVE LEVEL SELECTOR BAR */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs uppercase font-extrabold text-cyan-400 tracking-wider block">
                AI Roadmap Level Select
              </span>
              <span className="text-[11px] text-slate-400">
                Click any mission level to generate and practice its targeted exam questions
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowCosmicMap(prev => !prev)}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                showCosmicMap
                  ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-md shadow-cyan-500/20'
                  : 'bg-slate-950/80 border-slate-700 text-slate-300 hover:text-white'
              }`}
            >
              <Map className="w-3.5 h-3.5" />
              <span>{showCosmicMap ? 'Hide Cosmic Map' : 'Cosmic Map View'}</span>
            </button>

            <span className="text-xs font-mono-numbers font-bold text-amber-300 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20">
              Level {levelNum} of {effectiveMilestones.length}
            </span>
          </div>
        </div>

        {/* Optional Collapsible Cosmic Level Map */}
        {showCosmicMap && (
          <div className="pt-2 animate-fadeIn">
            <CosmicRoadmapLevelMap
              milestones={effectiveMilestones}
              completedLevels={completedLevels}
              activeLevelIndex={activeLevelIndex}
              onSelectLevel={handleSelectLevel}
              onToggleCompleteLevel={onToggleCompleteLevel}
              showCardDetails={false}
            />
          </div>
        )}

        {/* Level Select Tiles */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
          {effectiveMilestones.map((ms, idx) => {
            const isSelected = activeLevelIndex === idx;
            const isCompleted = completedLevels.includes(idx);
            const num = idx + 1;

            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectLevel(idx)}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer relative group flex flex-col justify-between space-y-2 ${
                  isSelected
                    ? 'bg-gradient-to-br from-cyan-950/80 via-slate-900 to-slate-900 border-cyan-400 shadow-lg shadow-cyan-950/30 ring-2 ring-cyan-500/30'
                    : isCompleted
                    ? 'bg-slate-950 border-emerald-500/30 hover:border-emerald-500/60 hover:bg-slate-900'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center font-mono-numbers font-extrabold text-xs shrink-0 ${
                        isCompleted
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                          : isSelected
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                    >
                      {isCompleted ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : `L${num}`}
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase text-amber-400/90 tracking-wider block">
                        Level {num}
                      </span>
                      <span className={`text-xs font-bold truncate block ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                        {ms.title}
                      </span>
                    </div>
                  </div>

                  <span className="text-[10px] font-mono-numbers px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 shrink-0 text-slate-400">
                    {ms.dayRange}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-800/80">
                  <span className="text-slate-400 truncate max-w-[170px]">
                    {ms.phase}
                  </span>
                  <span className={`font-semibold ${isSelected ? 'text-cyan-400' : 'text-slate-500'}`}>
                    {isSelected ? 'Active Drill ⚡' : 'Select →'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. SELECTED MISSION BRIEFING CARD */}
      <div className="bg-gradient-to-r from-stone-950 via-slate-900 to-cyan-950/40 border border-cyan-500/30 rounded-3xl p-5 sm:p-7 space-y-5 shadow-2xl relative overflow-hidden">
        {/* Glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-4 relative z-10">
          <div className="space-y-1.5 text-left">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold font-mono-numbers text-xs border border-cyan-500/30">
                LEVEL {levelNum} MISSION TARGET
              </span>
              <span className="text-xs text-slate-400 font-mono-numbers">
                {currentMilestone.dayRange}
              </span>
              <span className="text-xs text-slate-400">·</span>
              <span className="text-xs text-amber-300/90 font-medium">
                {currentMilestone.phase}
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-bold font-display text-white">
              {currentMilestone.title}
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-3xl">
              {currentMilestone.focus}
            </p>
          </div>

          {/* Mastered Button on the Left/Responsive */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0 self-start md:self-auto">
            <button
              type="button"
              onClick={() => onToggleCompleteLevel(activeLevelIndex)}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm ${
                isCurrentLevelCompleted
                  ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{isCurrentLevelCompleted ? 'Level Mastered (Undo)' : `Mark Level ${levelNum} Complete (+150 XP)`}</span>
            </button>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  const nextVal = !includeReadingPassage;
                  setIncludeReadingPassage(nextVal);
                  fetchLevelQuestions(currentMilestone, activeLevelIndex, nextVal, passageLength);
                }}
                disabled={loading}
                className={`px-3 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  includeReadingPassage
                    ? 'bg-cyan-950/80 border-cyan-500/70 text-cyan-200 ring-1 ring-cyan-500/40 shadow-sm'
                    : 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-300'
                }`}
                title="Toggle Reading Passage mode"
              >
                <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
                <span>{includeReadingPassage ? 'Passages: ON' : 'Add Passage'}</span>
              </button>

              {includeReadingPassage && (
                <button
                  type="button"
                  onClick={() => {
                    const nextPref = passageLength === 'long-6-plus' ? 'standard' : 'long-6-plus';
                    setPassageLength(nextPref);
                    fetchLevelQuestions(currentMilestone, activeLevelIndex, true, nextPref);
                  }}
                  disabled={loading}
                  className={`px-2.5 py-2 rounded-xl border text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                    passageLength === 'long-6-plus'
                      ? 'bg-amber-500/20 border-amber-400 text-amber-200 ring-1 ring-amber-400/30'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                  title="Toggle between standard 2-4 paragraphs and extended 6+ paragraph passages"
                >
                  <span>{passageLength === 'long-6-plus' ? '⚡ 6+ Paragraphs' : 'Standard Length'}</span>
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowCreatorModal(true)}
              className="px-3 py-2 rounded-xl bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-500/40 hover:border-cyan-400 text-cyan-300 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
              title="Create custom questions for this mission with full Gemini AI (Vision, Search Grounding, Thinking Level, TTS)"
            >
              <Wand2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>Gemini Studio</span>
            </button>

            <button
              type="button"
              onClick={() => fetchLevelQuestions(currentMilestone, activeLevelIndex, includeReadingPassage, passageLength)}
              disabled={loading}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Regenerate new AI questions for this mission"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* Dedicated Interactive Gamified Sections for Each Action Item */}
        {currentMilestone.actionItems && currentMilestone.actionItems.length > 0 && (
          <div className="pt-2">
            <RoadmapActionItemsDeck
              actionItems={currentMilestone.actionItems}
              levelIndex={activeLevelIndex}
              levelTitle={currentMilestone.title}
              levelPhase={currentMilestone.phase}
              checkedActions={checkedActionItems}
              onToggleAction={(_, aIdx) => toggleActionItem(aIdx)}
              onRecordXp={onRecordXp}
              onStartStudySession={onStartStudySession}
            />
          </div>
        )}
      </div>

      {/* 3. AI QUESTION GENERATION DRILL CONTAINER */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-6">
        
        {/* TOP ADAPTIVE DIFFICULTY HUD BAR */}
        <div className="bg-slate-950/90 border border-slate-800/90 rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500 to-indigo-600 flex items-center justify-center text-slate-950 shadow-md">
                <Brain className="w-4 h-4 stroke-[2.5]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white uppercase tracking-wider font-display">
                    AI Adaptive Difficulty Engine
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 ${
                    isAdaptiveMode 
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 animate-pulse' 
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}>
                    <Activity className="w-3 h-3 text-emerald-400" />
                    {isAdaptiveMode ? 'LIVE ADAPTIVE' : 'FIXED BATCH'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">
                  The AI dynamically adjusts question difficulty based on whether you get questions correct or miss them.
                </p>
              </div>
            </div>

            {/* Right Controls: Skill Elo, Streak, Mode Toggle */}
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono-numbers text-slate-200 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span className="font-bold text-white">{skillRating}</span>
                <span className="text-[10px] text-slate-400">Elo</span>
              </div>

              <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono-numbers text-amber-300 flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                <span className="font-bold">{streak > 0 ? `+${streak}` : streak}</span>
                <span className="text-[10px] text-slate-400">{streak >= 0 ? 'Streak' : 'Missed'}</span>
              </div>

              <button
                type="button"
                onClick={() => setIsAdaptiveMode(prev => !prev)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  isAdaptiveMode
                    ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/30'
                    : 'bg-slate-800 border-slate-750 text-slate-400 hover:text-white'
                }`}
                title="Toggle between real-time adaptive difficulty and fixed questions"
              >
                {isAdaptiveMode ? 'Adaptive: ON' : 'Adaptive: OFF'}
              </button>
            </div>
          </div>

          {/* 5-TIER DIFFICULTY PROGRESSION LADDER */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
            {ORDERED_TIERS.map((tierName, idx) => {
              const meta = DIFFICULTY_TIERS[tierName];
              const isActive = currentTier === tierName;
              return (
                <div
                  key={tierName}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    isActive
                      ? `${meta.badgeColor} ${meta.bgGlow} ring-1 ring-white/20 scale-[1.02]`
                      : 'bg-slate-900/60 border-slate-800/80 text-slate-400 hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] mb-1 font-mono-numbers">
                    <span className="opacity-70">Tier {idx + 1}</span>
                    {isActive && (
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                    )}
                  </div>
                  <div className="text-xs font-bold truncate">
                    {tierName}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {loading ? (
          /* Loading State */
          <div className="py-16 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-cyan-500/20 border-2 border-cyan-500/40 flex items-center justify-center text-cyan-300 mx-auto animate-bounce shadow-lg">
              <Sparkles className="w-7 h-7" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-base sm:text-lg font-bold text-white font-display">
                Generating Questions for Level {levelNum}...
              </h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Gemini AI is analyzing "{currentMilestone.title}" and synthesizing high-yield exam trap questions based on this mission's focus.
              </p>
            </div>
          </div>
        ) : isFinished ? (
          /* Completion Screen with Adaptive Trajectory Summary */
          <div className="py-8 text-center space-y-6 animate-fadeIn">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-500 to-rose-600 flex items-center justify-center text-slate-950 font-black text-2xl mx-auto shadow-xl shadow-amber-950/40">
              <Award className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl sm:text-2xl font-bold font-display text-white">
                Level {levelNum} Mission Drill Complete!
              </h3>
              <p className="text-sm text-slate-300">
                You scored <span className="font-bold text-amber-300 font-mono-numbers">{score}</span> out of{' '}
                <span className="font-bold font-mono-numbers">{questions.length}</span> ({Math.round((score / questions.length) * 100)}%)
              </p>
              <div className="flex items-center justify-center gap-3 text-xs pt-1">
                <span className="px-3 py-1 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 font-mono-numbers">
                  Final Skill Elo: <strong className="text-cyan-400">{skillRating}</strong>
                </span>
                <span className="px-3 py-1 rounded-xl bg-slate-950 border border-slate-800 text-slate-300">
                  Peak Tier: <strong className="text-amber-400">{currentTier}</strong>
                </span>
              </div>
            </div>

            {/* Adaptive Trajectory Step-by-Step Breakdown */}
            {adaptiveHistory.length > 0 && (
              <div className="max-w-2xl mx-auto bg-slate-950/80 border border-slate-800 rounded-2xl p-4 sm:p-5 text-left space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-slate-300 border-b border-slate-800 pb-2">
                  <span className="flex items-center gap-1.5 text-cyan-400">
                    <TrendingUp className="w-4 h-4" /> AI Adaptive Trajectory
                  </span>
                  <span className="text-[11px] text-slate-400 font-normal">
                    Real-time difficulty adjustments
                  </span>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {adaptiveHistory.map((step, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 text-xs flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                          step.wasCorrect ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                        }`}>
                          {step.wasCorrect ? '✓' : '✗'}
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-slate-200 font-bold">Q{step.qNum}</span>
                            <span className="text-slate-400 text-[11px]">Started at {step.tier}</span>
                            <span className="text-slate-500 text-[10px]">➔</span>
                            <span className={`font-bold text-[11px] ${step.wasCorrect ? 'text-emerald-400' : 'text-amber-400'}`}>
                              Adapted to {step.nextTier}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                            {step.rationale}
                          </p>
                        </div>
                      </div>

                      <span className={`font-mono-numbers text-xs font-bold shrink-0 ${
                        step.deltaRating >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}>
                        {step.deltaRating >= 0 ? `+${step.deltaRating}` : step.deltaRating} Elo
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
              <button
                type="button"
                onClick={handleContinueAdaptiveDrill}
                disabled={isFetchingAdaptiveNext}
                className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-bold text-xs rounded-xl shadow-lg flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isFetchingAdaptiveNext ? 'AI Calibrating Next Question...' : `Continue Infinite Adaptive Sparring (Tier: ${currentTier})`}</span>
              </button>

              {!isCurrentLevelCompleted && (
                <button
                  type="button"
                  onClick={() => onToggleCompleteLevel(activeLevelIndex)}
                  className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-xs rounded-xl shadow-lg flex items-center gap-2 cursor-pointer transition-all"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Mark Level {levelNum} Mastered (+150 XP)</span>
                </button>
              )}

              {activeLevelIndex + 1 < effectiveMilestones.length && (
                <button
                  type="button"
                  onClick={() => handleSelectLevel(activeLevelIndex + 1)}
                  className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-slate-950 font-bold text-xs rounded-xl shadow-lg flex items-center gap-2 cursor-pointer transition-all"
                >
                  <span>Advance to Level {levelNum + 1} Mission Drill</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}

              <button
                type="button"
                onClick={() => fetchLevelQuestions(currentMilestone, activeLevelIndex)}
                className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-semibold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Restart Level {levelNum} Questions</span>
              </button>

              {onStartStudySession && (
                <button
                  type="button"
                  onClick={onStartStudySession}
                  className="px-4 py-2.5 bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 font-semibold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Start AI Study Session</span>
                </button>
              )}
            </div>
          </div>
        ) : currentQ ? (
          /* Active Question Interface */
          <div className="space-y-6 text-left">
            {/* Question Header & Progress Bar */}
            <div className="space-y-2 border-b border-slate-800 pb-3">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-cyan-400 font-mono-numbers">
                    Question {currentIndex + 1} of {questions.length}
                  </span>
                  
                  {/* Active Adaptive Difficulty Badge */}
                  <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold border flex items-center gap-1.5 ${
                    DIFFICULTY_TIERS[currentTier]?.badgeColor || 'bg-slate-800 text-slate-300'
                  }`}>
                    <Gauge className="w-3 h-3" />
                    <span>{currentTier}</span>
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-amber-400 font-mono-numbers font-bold flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5" /> Score: {score}/{currentIndex + (hasAnswered ? 1 : 0)}
                  </span>
                  <span className="text-cyan-400 font-mono-numbers font-bold flex items-center gap-1 text-[11px]">
                    <Zap className="w-3 h-3" /> {skillRating} Elo
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-cyan-500 via-amber-500 to-indigo-500 h-full transition-all duration-300"
                  style={{ width: `${((currentIndex + (hasAnswered ? 1 : 0)) / questions.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Reading Passage & Protocol Data (if present) */}
            {currentQ.passage && (
              <div className="bg-slate-950/90 border border-cyan-500/40 rounded-2xl p-4 sm:p-6 space-y-3 shadow-xl relative overflow-hidden animate-fadeIn">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                      <BookOpen className="w-4 h-4" />
                    </span>
                    <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider font-mono-numbers">
                      {currentQ.passageTitle || 'Reading Passage & Analytical Protocol'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-[10px] text-amber-300/90 font-semibold flex items-center gap-1 font-mono-numbers">
                      <Sparkles className="w-3 h-3 text-amber-400" />
                      {currentQ.passage.split('\n\n').length >= 5 ? '6+ Paragraphs Extended' : 'Analytical Text'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsPassageExpanded(prev => !prev)}
                      className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-750 text-slate-300 text-[10px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                      title={isPassageExpanded ? 'Compress View' : 'Expand View for Comfort Reading'}
                    >
                      {isPassageExpanded ? (
                        <>
                          <Minimize2 className="w-3 h-3 text-cyan-400" />
                          <span>Compress</span>
                        </>
                      ) : (
                        <>
                          <Maximize2 className="w-3 h-3 text-cyan-400" />
                          <span>Expand</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div
                  className={`text-xs sm:text-sm text-slate-200 leading-relaxed font-serif space-y-3 whitespace-pre-line overflow-y-auto pr-2 scrollbar-thin transition-all duration-200 ${
                    isPassageExpanded ? 'max-h-[38rem]' : 'max-h-80'
                  }`}
                >
                  {currentQ.passage}
                </div>
              </div>
            )}

            {/* Question Text */}
            <div className="space-y-1.5">
              {currentQ.passage && (
                <div className="text-[11px] font-bold uppercase tracking-wider text-amber-400/90 flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-amber-400" />
                  <span>Target Question & Analytical Deduction:</span>
                </div>
              )}
              <h3 className="text-base sm:text-lg font-bold font-display text-white leading-relaxed">
                {currentQ.question}
              </h3>
              {currentQ.levelTip && (
                <p className="text-xs text-cyan-300/80 font-mono-numbers">
                  💡 {currentQ.levelTip}
                </p>
              )}
            </div>

            {/* Options */}
            <div className="space-y-2.5">
              {currentQ.options.map((opt, optIdx) => {
                const isSelected = selectedOption === optIdx;
                const isCorrect = optIdx === currentQ.correctIndex;

                let optionStyles = 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-300 hover:bg-slate-900';
                if (hasAnswered) {
                  if (isCorrect) {
                    optionStyles = 'bg-emerald-950/60 border-emerald-500 text-emerald-100 font-medium ring-1 ring-emerald-500/50';
                  } else if (isSelected) {
                    optionStyles = 'bg-rose-950/60 border-rose-500 text-rose-200 ring-1 ring-rose-500/50';
                  } else {
                    optionStyles = 'bg-slate-950/60 border-slate-900 text-slate-500 opacity-60';
                  }
                }

                return (
                  <button
                    key={optIdx}
                    type="button"
                    onClick={() => handleAnswerOption(optIdx)}
                    disabled={hasAnswered}
                    className={`w-full p-4 rounded-2xl border text-left text-xs sm:text-sm transition-all cursor-pointer flex items-start gap-3 relative ${optionStyles}`}
                  >
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 ${
                      hasAnswered
                        ? isCorrect
                          ? 'bg-emerald-500 text-slate-950'
                          : isSelected
                          ? 'bg-rose-500 text-white'
                          : 'bg-slate-800 text-slate-400'
                        : 'bg-slate-900 border border-slate-700 text-slate-400'
                    }`}>
                      {String.fromCharCode(65 + optIdx)}
                    </div>
                    <span className="leading-relaxed flex-1">{opt}</span>
                  </button>
                );
              })}
            </div>

            {/* Answer Feedback & Live Adaptive Shift Alert */}
            {hasAnswered && (
              <div className="space-y-3 animate-fadeIn">
                {/* LIVE ADAPTIVE DIFFICULTY SHIFT BANNER */}
                {isAdaptiveMode && lastAdaptiveResult && (
                  <div className={`p-4 rounded-2xl border shadow-xl flex items-center justify-between gap-3 ${
                    lastAdaptiveResult.direction === 'up'
                      ? 'bg-gradient-to-r from-emerald-950/80 via-teal-950/60 to-slate-950 border-emerald-500/40 text-emerald-200'
                      : lastAdaptiveResult.direction === 'down'
                      ? 'bg-gradient-to-r from-amber-950/80 via-orange-950/60 to-slate-950 border-amber-500/40 text-amber-200'
                      : 'bg-gradient-to-r from-blue-950/80 via-indigo-950/60 to-slate-950 border-blue-500/40 text-blue-200'
                  }`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                        lastAdaptiveResult.direction === 'up'
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                          : lastAdaptiveResult.direction === 'down'
                          ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                          : 'bg-blue-500/20 text-blue-400 border-blue-500/40'
                      }`}>
                        {lastAdaptiveResult.direction === 'up' ? (
                          <TrendingUp className="w-5 h-5 stroke-[2.5]" />
                        ) : lastAdaptiveResult.direction === 'down' ? (
                          <TrendingDown className="w-5 h-5 stroke-[2.5]" />
                        ) : (
                          <Gauge className="w-5 h-5 stroke-[2.5]" />
                        )}
                      </div>

                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black uppercase tracking-wider">
                            {lastAdaptiveResult.direction === 'up'
                              ? '⚡ AI Difficulty Ramped Up (+1 Tier)'
                              : lastAdaptiveResult.direction === 'down'
                              ? '📉 AI Difficulty Calibrated Down'
                              : '🎯 Target Difficulty Maintained'}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/10 border border-white/20">
                            Next: {lastAdaptiveResult.nextTier}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 leading-snug">
                          {lastAdaptiveResult.rationale}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className={`text-xs font-black font-mono-numbers block ${
                        lastAdaptiveResult.deltaRating >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}>
                        {lastAdaptiveResult.deltaRating >= 0 ? `+${lastAdaptiveResult.deltaRating}` : lastAdaptiveResult.deltaRating} Elo
                      </span>
                      <span className="text-[10px] text-slate-400">Skill Rating</span>
                    </div>
                  </div>
                )}

                {/* Examiner Explanation & Specific Wrong Option Breakdown */}
                {selectedOption !== null && (
                  <WrongAnswerBreakdownCard
                    explanation={getDetailedAnswerExplanation(
                      currentQ as any,
                      selectedOption,
                      activeExamPlan?.profile?.subject || currentMilestone.title
                    )}
                  />
                )}

                <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={handleNextQuestion}
                      disabled={isFetchingAdaptiveNext}
                      className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 via-amber-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer transition-all disabled:opacity-50"
                    >
                      {isFetchingAdaptiveNext ? (
                        <>
                          <Sparkles className="w-3.5 h-3.5 animate-spin" />
                          <span>AI Adapting Next Question...</span>
                        </>
                      ) : (
                        <>
                          <span>
                            {currentIndex + 1 < questions.length
                              ? isAdaptiveMode && lastAdaptiveResult
                                ? `Proceed to ${lastAdaptiveResult.nextTier} Question`
                                : 'Next Question'
                              : 'View Mission Results'}
                          </span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
            )}
          </div>
        ) : null}
      </div>

      {showCreatorModal && (
        <QuestionCreatorStudio
          isModal={true}
          initialSubject={activeExamPlan?.profile?.subject || currentMilestone.title}
          initialTopic={currentMilestone.title}
          onClose={() => setShowCreatorModal(false)}
          onAddQuestionToLevel={(newQ) => {
            setQuestions(prev => [newQ as any, ...prev]);
            setCurrentIndex(0);
            setSelectedOption(null);
            setHasAnswered(false);
            setShowCreatorModal(false);
            playCorrectSound();
          }}
          onSaveToMistakes={onRecordMistake ? (newQ) => {
            onRecordMistake({
              question: newQ.question,
              passage: newQ.passage,
              passageTitle: newQ.passageTitle,
              topic: newQ.topic,
              subject: activeExamPlan?.profile?.subject,
              options: newQ.options,
              selectedAnswer: newQ.options[newQ.correctIndex === 0 ? 1 : 0],
              correctAnswer: newQ.options[newQ.correctIndex],
              examinerExplanation: newQ.angryExplanation,
              whyPickedWrong: newQ.distractorExplanations?.[newQ.correctIndex === 0 ? 1 : 0],
              trapNote: newQ.examinerTrapNotes,
              source: 'level-drill',
            });
          } : undefined}
        />
      )}
    </div>
  );
};
