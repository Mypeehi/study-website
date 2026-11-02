import React, { useState, useEffect, useRef } from 'react';
import {
  CheckCircle2,
  XCircle,
  HelpCircle,
  ArrowRight,
  RotateCcw,
  Sparkles,
  Flame,
  Award,
  BookOpen,
  MessageSquare,
  Send,
  Volume2,
  VolumeX,
  Bot,
  User,
  SlidersHorizontal,
  Lightbulb,
  CornerDownLeft,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Gauge,
  Brain,
  Zap,
  Wand2
} from 'lucide-react';
import { QuizQuestion } from '../types';
import {
  calculateAdaptiveProgression,
  DIFFICULTY_TIERS,
  AdaptiveDifficultyTier,
  AdaptiveResult,
  getCuratedAdaptiveQuestion
} from '../utils/adaptiveEngine';
import {
  playCorrectSound,
  playIncorrectSound,
  playStreakFlameSound,
  speakExaminerVoice,
  stopSpeaking
} from '../utils/audio';
import { AILoadingBar } from './AILoadingBar';
import {
  ChatMessage,
  getQuestionIntroSideTalk,
  getAnswerReaction
} from '../utils/aiPersonality';
import { getDetailedAnswerExplanation } from '../utils/answerExplanation';
import { WrongAnswerBreakdownCard } from './WrongAnswerBreakdownCard';
import { QuestionCreatorStudio } from './QuestionCreatorStudio';

interface DailyQuizDrillProps {
  questions: QuizQuestion[];
  topicTitle?: string;
  subject?: string;
  passageLengthPreference?: 'standard' | 'long-6-plus';
  questionTypes?: string[];
  onCompleteQuiz: (score: number, total: number, topic: string) => void;
  onNavigateToExaminer: (topic: string) => void;
  onGenerateMoreQuestions?: () => Promise<void>;
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
    source: 'quiz';
  }) => void;
}

export const DailyQuizDrill: React.FC<DailyQuizDrillProps> = ({
  questions,
  topicTitle = 'Daily High-Yield Practice Challenge',
  subject,
  passageLengthPreference,
  questionTypes,
  onCompleteQuiz,
  onNavigateToExaminer,
  onGenerateMoreQuestions,
  onRecordSubTopicResult,
  onRecordMistake,
}) => {
  const [activeQuestions, setActiveQuestions] = useState<QuizQuestion[]>(questions);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // View Mode: Chat AI Style (Default) vs Classic Worksheet
  const [viewMode, setViewMode] = useState<'chat' | 'worksheet'>('chat');
  const [showCreatorModal, setShowCreatorModal] = useState<boolean>(false);

  // Adaptive Difficulty State
  const [isAdaptiveMode, setIsAdaptiveMode] = useState<boolean>(true);
  const [currentDifficultyTier, setCurrentDifficultyTier] = useState<AdaptiveDifficultyTier>('Standard');
  const [skillRating, setSkillRating] = useState<number>(1200);
  const [streak, setStreak] = useState<number>(0);
  const [lastAdaptiveResult, setLastAdaptiveResult] = useState<AdaptiveResult | null>(null);
  const [isFetchingAdaptive, setIsFetchingAdaptive] = useState<boolean>(false);

  // Chat Conversation State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isAiTyping, setIsAiTyping] = useState<boolean>(false);
  const [userChatInput, setUserChatInput] = useState<string>('');
  const [isSendingCustomMsg, setIsSendingCustomMsg] = useState<boolean>(false);
  const [isSpeakingId, setIsSpeakingId] = useState<string | null>(null);
  const [aiMood, setAiMood] = useState<'analytical' | 'provocative' | 'proud' | 'smug' | 'supportive' | 'shocked'>('analytical');

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat to bottom
  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isAiTyping]);

  // Reset or initialize when questions change
  useEffect(() => {
    setActiveQuestions(questions);
    setCurrentIndex(0);
    setSelectedOption(null);
    setHasAnswered(false);
    setCorrectCount(0);
    setQuizFinished(false);
    stopSpeaking();
    setIsSpeakingId(null);

    if (questions && questions.length > 0) {
      initChatForQuestion(0, questions);
    } else {
      setMessages([]);
    }
  }, [questions]);

  // Initialize or step into question in chat flow
  const initChatForQuestion = (qIndex: number, qsList: QuizQuestion[]) => {
    const q = qsList[qIndex];
    if (!q) return;

    const { greeting, sideTalk, mood } = getQuestionIntroSideTalk(q, qIndex, qsList.length);
    setAiMood(mood);

    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // AI greeting + witty side talk
    const introMsg: ChatMessage = {
      id: `ai-intro-${qIndex}-${Date.now()}`,
      sender: 'ai',
      text: `${greeting}\n\n💬 ${sideTalk}`,
      timestamp: now,
      sideComment: sideTalk,
      mood: mood,
    };

    // AI question card message
    const questionMsg: ChatMessage = {
      id: `ai-question-${qIndex}-${Date.now()}`,
      sender: 'ai',
      text: q.question,
      timestamp: now,
      questionPayload: {
        question: q,
        questionIndex: qIndex,
        totalQuestions: qsList.length,
      },
    };

    if (qIndex === 0) {
      setMessages([introMsg, questionMsg]);
    } else {
      setMessages(prev => [...prev, introMsg, questionMsg]);
    }
  };

  const handleGenerateNewQuestions = async () => {
    stopSpeaking();
    setIsGenerating(true);
    try {
      if (onGenerateMoreQuestions) {
        await onGenerateMoreQuestions();
      } else {
        const res = await fetch('/api/quizzes/generate-daily', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subject: subject || topicTitle,
            topics: [topicTitle, subject].filter(Boolean),
            passageLengthPreference,
            questionTypes,
            isLongPassage: passageLengthPreference === 'long-6-plus' || (Array.isArray(questionTypes) && questionTypes.some(qt => qt.toLowerCase().includes('6+'))),
          }),
        });
        const data = await res.json();
        if (data.questions && data.questions.length > 0) {
          setActiveQuestions(data.questions);
          setCurrentIndex(0);
          setSelectedOption(null);
          setHasAnswered(false);
          setCorrectCount(0);
          setQuizFinished(false);
          playStreakFlameSound();
          initChatForQuestion(0, data.questions);
        }
      }
    } catch (e) {
      console.error('Failed to generate daily quiz:', e);
    } finally {
      setIsGenerating(false);
    }
  };

  const currentQ = activeQuestions[currentIndex];

  const handleSelectOption = (idx: number) => {
    if (hasAnswered || !currentQ) return;
    setSelectedOption(idx);
    setHasAnswered(true);

    const isCorrect = idx === currentQ.correctIndex;
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (isCorrect) {
      setCorrectCount(prev => prev + 1);
      playCorrectSound();
    } else {
      playIncorrectSound();
    }

    // Record subtopic performance for Performance Analytics Heatmap
    if (onRecordSubTopicResult) {
      onRecordSubTopicResult(
        currentQ.topic || topicTitle || 'General Practice',
        topicTitle || 'General Quiz',
        isCorrect,
        currentQ.examinerTrapNotes,
        subject
      );
    }

    const detailedExplanation = getDetailedAnswerExplanation(currentQ, idx, subject || topicTitle);

    // Auto-record mistake in Mistake Vault for review and interactive fixing
    if (!isCorrect && onRecordMistake) {
      onRecordMistake({
        question: currentQ.question,
        passage: currentQ.passage,
        passageTitle: currentQ.passageTitle,
        topic: currentQ.topic || topicTitle || 'General Practice',
        subject,
        options: currentQ.options,
        selectedAnswer: currentQ.options[idx],
        correctAnswer: currentQ.options[currentQ.correctIndex],
        examinerExplanation: currentQ.angryExplanation,
        whyPickedWrong: detailedExplanation.whyPickedWrong,
        trapNote: currentQ.examinerTrapNotes,
        source: 'quiz',
      });
    }

    // Calculate adaptive difficulty progression
    const progression = calculateAdaptiveProgression(
      currentDifficultyTier,
      isCorrect,
      streak,
      skillRating,
      currentQ.examinerTrapNotes
    );
    setStreak(progression.streak);
    setSkillRating(progression.newSkillRating);
    setLastAdaptiveResult(progression);

    // 1. Post user's answer message
    const userMsg: ChatMessage = {
      id: `user-answer-${currentIndex}-${Date.now()}`,
      sender: 'user',
      text: `Option ${String.fromCharCode(65 + idx)}: ${currentQ.options[idx]}`,
      timestamp: now,
    };

    setMessages(prev => [...prev, userMsg]);
    setIsAiTyping(true);

    // 2. Prepare AI Personality Reaction after brief realistic typing delay
    setTimeout(() => {
      setIsAiTyping(false);
      const reaction = getAnswerReaction(currentQ, idx, isCorrect);
      setAiMood(reaction.mood);

      let reactionText = `### ${reaction.headline}\n\n${reaction.banter}\n\n`;
      if (!isCorrect) {
        reactionText += `❌ **Why Option ${detailedExplanation.pickedLetter} Is Wrong:**\n${detailedExplanation.whyPickedWrong}\n\n` +
          `✅ **Why Option ${detailedExplanation.correctLetter} Is The Right Answer:**\n${detailedExplanation.whyCorrect}`;
      } else {
        reactionText += `✅ **The Angry Explainer's Reality Check:**\n${currentQ.angryExplanation}`;
      }

      if (currentQ.examinerTrapNotes) {
        reactionText += `\n\n⚠️ **Examiner's Trap Warning:** ${currentQ.examinerTrapNotes}`;
      }

      // Live Adaptive Difficulty Shift Callout
      if (isAdaptiveMode) {
        if (progression.direction === 'up') {
          reactionText += `\n\n⚡ **AI Dynamic Difficulty Escalated (+1 Tier):** Promoted to **${progression.nextTier}** (+${progression.deltaRating} Elo)\n*${progression.rationale}*`;
        } else if (progression.direction === 'down') {
          reactionText += `\n\n📉 **AI Dynamic Difficulty Calibrated Down:** Adjusted to **${progression.nextTier}** (${progression.deltaRating} Elo)\n*${progression.rationale}*`;
        }
      }

      const aiReactionMsg: ChatMessage = {
        id: `ai-reaction-${currentIndex}-${Date.now()}`,
        sender: 'ai',
        text: reactionText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        evaluationPayload: {
          isCorrect,
          selectedOption: currentQ.options[idx],
          correctOption: currentQ.options[currentQ.correctIndex],
          angryExplanation: currentQ.angryExplanation,
          examinerTrapNotes: currentQ.examinerTrapNotes,
          detailedExplanation,
        },
        mood: reaction.mood,
      };

      setMessages(prev => [...prev, aiReactionMsg]);
    }, 450);
  };

  const handleNextQuestion = async () => {
    stopSpeaking();
    setIsSpeakingId(null);

    if (currentIndex + 1 < activeQuestions.length) {
      const nextIdx = currentIndex + 1;
      let nextQuestionsList = [...activeQuestions];

      if (isAdaptiveMode && lastAdaptiveResult) {
        const targetTier = lastAdaptiveResult.nextTier;
        setCurrentDifficultyTier(targetTier);
        setIsFetchingAdaptive(true);

        try {
          const res = await fetch('/api/adaptive/next-question', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              subject: subject || 'Science / Academic Exam',
              topic: currentQ?.topic || topicTitle || 'General Practice',
              milestoneTitle: topicTitle || 'Daily Drill',
              currentDifficulty: currentDifficultyTier,
              wasCorrect: selectedOption === currentQ.correctIndex,
              streak: lastAdaptiveResult.streak,
              lastTrapNote: currentQ.examinerTrapNotes,
              includeReadingPassage: false,
              questionTypes: ['Multiple Choice Questions'],
            }),
          });

          if (res.ok) {
            const data = await res.json();
            if (data.question) {
              nextQuestionsList[nextIdx] = {
                ...nextQuestionsList[nextIdx],
                ...data.question,
                difficulty: targetTier as any,
              };
              setActiveQuestions(nextQuestionsList);
            }
          } else {
            throw new Error('Adaptive response not ok');
          }
        } catch (e) {
          console.warn('Adaptive API failed, using curated tier question:', e);
          const fallback = getCuratedAdaptiveQuestion(
            currentQ?.topic || topicTitle || 'General Practice',
            targetTier,
            subject
          );
          nextQuestionsList[nextIdx] = {
            ...nextQuestionsList[nextIdx],
            ...fallback,
            difficulty: targetTier as any,
          };
          setActiveQuestions(nextQuestionsList);
        } finally {
          setIsFetchingAdaptive(false);
        }
      }

      setCurrentIndex(nextIdx);
      setSelectedOption(null);
      setHasAnswered(false);
      setLastAdaptiveResult(null);
      initChatForQuestion(nextIdx, nextQuestionsList);
    } else {
      setQuizFinished(true);
      playStreakFlameSound();
      const finalCorrect = selectedOption === currentQ?.correctIndex ? correctCount : correctCount;
      onCompleteQuiz(
        finalCorrect,
        activeQuestions.length,
        currentQ?.topic || 'General STEM'
      );
    }
  };

  const handleRestart = () => {
    stopSpeaking();
    setIsSpeakingId(null);
    setCurrentIndex(0);
    setSelectedOption(null);
    setHasAnswered(false);
    setCorrectCount(0);
    setQuizFinished(false);
    initChatForQuestion(0, activeQuestions);
  };

  // Student can ask follow-ups or banter back with the AI tutor
  const handleSendCustomChat = async (promptOverride?: string) => {
    const textToSend = promptOverride || userChatInput.trim();
    if (!textToSend || isSendingCustomMsg) return;

    setUserChatInput('');
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const userMsg: ChatMessage = {
      id: `user-custom-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: now,
    };
    setMessages(prev => [...prev, userMsg]);
    setIsAiTyping(true);
    setIsSendingCustomMsg(true);

    try {
      const res = await fetch('/api/study/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: currentQ?.topic || 'STEM Science',
          currentTopic: currentQ?.topic || topicTitle,
          gradeLevel: 'College / Pre-Med / STEM',
          question: `Regarding question "${currentQ?.question}": ${textToSend}`,
        }),
      });

      const data = await res.json();
      const answer = data.answer || "Focus on the rate-limiting step and what physically binds first!";

      const aiReply: ChatMessage = {
        id: `ai-reply-${Date.now()}`,
        sender: 'ai',
        text: `🤖 **Coach Reply:**\n\n${answer}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        mood: 'supportive',
      };
      setMessages(prev => [...prev, aiReply]);
    } catch (e) {
      const fallbackReply: ChatMessage = {
        id: `ai-reply-${Date.now()}`,
        sender: 'ai',
        text: `🤖 **Coach Reply:**\n\nAlways trace the causal mechanism step-by-step: what triggers the conformational change, what ion or molecule shifts, and what stops the cycle!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        mood: 'supportive',
      };
      setMessages(prev => [...prev, fallbackReply]);
    } finally {
      setIsAiTyping(false);
      setIsSendingCustomMsg(false);
    }
  };

  const handleSpeak = (msgId: string, text: string) => {
    if (isSpeakingId === msgId) {
      stopSpeaking();
      setIsSpeakingId(null);
    } else {
      setIsSpeakingId(msgId);
      speakExaminerVoice(text, () => setIsSpeakingId(null));
    }
  };

  if (isGenerating) {
    return (
      <AILoadingBar
        title="Generating High-Yield Practice Questions"
        subtitle="Formulating multiple-choice questions, realistic distractor traps, and Angry Explainer explanations..."
        itemType="questions"
        topic={topicTitle}
        onCancel={() => setIsGenerating(false)}
      />
    );
  }

  if (!activeQuestions || activeQuestions.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mx-auto">
          <BookOpen className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold font-display text-white">
          No Questions Available
        </h2>
        <p className="text-sm text-slate-400 max-w-md mx-auto">
          Select a lecture from the library to launch its targeted quiz, or generate fresh practice questions with The Angry Explainer.
        </p>
        <div className="pt-2">
          <button
            type="button"
            onClick={handleGenerateNewQuestions}
            className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-2 mx-auto cursor-pointer shadow-lg"
          >
            <Sparkles className="w-4 h-4 fill-slate-950" />
            <span>Generate 5 Practice Questions Now</span>
          </button>
        </div>
      </div>
    );
  }

  // QUIZ FINISHED CELEBRATION SCREEN
  if (quizFinished) {
    const percentage = Math.round((correctCount / activeQuestions.length) * 100);
    const earnedXp = 50 + correctCount * 15;

    let aiFinalAssessment = "";
    if (percentage >= 80) {
      aiFinalAssessment = "“Well, look at that. You didn't just survive my gauntlet—you actually applied high-yield logic. Your synaptic connections are crisp. Keep this momentum and the board examiners won't stand a chance.”";
    } else if (percentage >= 60) {
      aiFinalAssessment = "“Respectable combat! You dodged the biggest traps, but tripped on a few subtle causal steps. Review the angry explanations, do a 3-minute blurt session, and cement those remaining gaps.”";
    } else {
      aiFinalAssessment = "“Oof! The distractors claimed their casualties today. But listen: an error made in practice is an error averted on test day. Retake the drill or step into The Angry Examiner's oral viva to build real resilience.”";
    }

    return (
      <div className="max-w-2xl mx-auto px-4 py-10 animate-fadeIn">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 md:p-10 text-center space-y-6 shadow-2xl relative overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="w-20 h-20 rounded-3xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto shadow-inner">
            <Award className="w-10 h-10 animate-bounce" />
          </div>

          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase tracking-wider mb-2">
              <Flame className="w-3.5 h-3.5 fill-amber-400" /> AI Practice Debrief Complete
            </div>
            <h2 className="text-3xl md:text-4xl font-black font-display text-white tracking-tight">
              {percentage >= 80 ? 'Mastery Verified!' : percentage >= 60 ? 'Solid Synaptic Sprint!' : 'Causal Gaps Identified!'}
            </h2>
            <p className="text-sm text-slate-400 mt-2">
              You answered <span className="font-mono-numbers text-white font-bold">{correctCount}</span> out of{' '}
              <span className="font-mono-numbers text-white font-bold">{activeQuestions.length}</span> questions correctly ({percentage}%)
            </p>
          </div>

          {/* AI Side-Talk Final Verdict */}
          <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 text-left space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-amber-400 font-bold flex items-center gap-1.5 uppercase tracking-wider">
                <Bot className="w-4 h-4 text-amber-400" /> The Angry Explainer's Verdict
              </span>
              <span className="text-[11px] text-slate-500 font-mono-numbers">Session Assessment</span>
            </div>
            <p className="text-xs md:text-sm text-slate-300 italic font-serif leading-relaxed">
              {aiFinalAssessment}
            </p>
          </div>

          {/* Reward Badges */}
          <div className="grid grid-cols-2 gap-3 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
            <div className="text-center">
              <div className="text-[11px] text-slate-500 uppercase tracking-wider">Knowledge XP</div>
              <div className="text-xl font-black text-amber-400 font-mono-numbers">+{earnedXp} XP</div>
            </div>
            <div className="text-center">
              <div className="text-[11px] text-slate-500 uppercase tracking-wider">Daily Goal Progress</div>
              <div className="text-xl font-bold text-emerald-400 flex items-center justify-center gap-1">
                +{activeQuestions.length} Qs Logged
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="space-y-3 pt-2">
            <button
              onClick={() => onNavigateToExaminer(currentQ?.topic || 'General STEM')}
              className="w-full py-3.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-rose-950/50 hover:scale-[1.01]"
            >
              <Flame className="w-4 h-4" /> Face The Angry Examiner's Viva Voce on This Topic
            </button>

            <button
              onClick={handleGenerateNewQuestions}
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-slate-950 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md hover:scale-[1.01]"
            >
              <Sparkles className="w-3.5 h-3.5 fill-slate-950" /> Generate Fresh AI Practice Question Set
            </button>

            <button
              onClick={handleRestart}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Retake This AI Chat Drill
            </button>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // WORKSHEET MODE (CLASSIC ALTERNATIVE)
  // -------------------------------------------------------------
  if (viewMode === 'worksheet') {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-xs text-amber-400 font-semibold uppercase tracking-wider">
              {topicTitle}
            </div>
            <h1 className="text-xl md:text-2xl font-bold font-display text-white">
              Worksheet View
            </h1>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            {/* Adaptive Difficulty Badge */}
            <div className={`px-2.5 py-1 rounded-xl border text-xs font-bold flex items-center gap-1.5 ${
              DIFFICULTY_TIERS[currentDifficultyTier]?.badgeColor || 'bg-slate-950 border-slate-800 text-slate-300'
            }`}>
              <Gauge className="w-3.5 h-3.5" />
              <span>{currentDifficultyTier}</span>
            </div>

            {/* Skill Elo */}
            <div className="px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono-numbers text-slate-200 flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-bold">{skillRating}</span>
            </div>

            {/* Toggle to Chat AI Style */}
            <button
              onClick={() => setViewMode('chat')}
              className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 text-amber-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Switch to AI Chat Style 💬</span>
            </button>

            {/* Gemini Question Studio Button */}
            <button
              type="button"
              onClick={() => setShowCreatorModal(true)}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-500/40 hover:border-cyan-400 text-cyan-300 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
              title="Open Gemini Question Creator Studio with Vision, Web Grounding, Thinking, and TTS"
            >
              <Wand2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>Gemini Studio</span>
            </button>

            <button
              type="button"
              onClick={handleGenerateNewQuestions}
              className="px-3.5 py-1.5 rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>New Set</span>
            </button>

            <div className="text-right">
              <div className="text-[11px] text-slate-400">Question</div>
              <div className="text-sm font-bold font-mono-numbers text-slate-200">
                {currentIndex + 1} / {activeQuestions.length}
              </div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
          <div
            className="bg-amber-400 h-full rounded-full transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / activeQuestions.length) * 100}%` }}
          />
        </div>

        {/* Worksheet Question Card */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 md:p-8 space-y-6 shadow-xl">
          <div className="text-xs text-slate-400 font-medium flex items-center justify-between gap-2">
            <span>Topic: <strong className="text-slate-200">{currentQ?.topic}</strong></span>
            {currentQ?.passage && (
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center gap-1.5 font-mono-numbers">
                <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
                {currentQ.passage.split('\n\n').length >= 5 ? '6+ ¶ Extended Passage' : 'Reading Passage'}
              </span>
            )}
          </div>

          {/* Reading Passage if available */}
          {currentQ?.passage && (
            <div className="bg-slate-950/90 border border-cyan-500/40 rounded-2xl p-4 sm:p-5 space-y-3 shadow-inner animate-fadeIn">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
                <div className="flex items-center gap-2">
                  <span className="p-1 rounded bg-cyan-500/20 text-cyan-300">
                    <BookOpen className="w-4 h-4" />
                  </span>
                  <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider font-mono-numbers">
                    {currentQ.passageTitle || 'Reading Passage & Analytical Context'}
                  </span>
                </div>
                <span className="text-[10px] text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30 font-semibold">
                  Cross-Paragraph Synthesis
                </span>
              </div>
              <div className="text-xs sm:text-sm text-slate-200 leading-relaxed font-serif space-y-2 whitespace-pre-line max-h-80 overflow-y-auto pr-2 scrollbar-thin">
                {currentQ.passage}
              </div>
            </div>
          )}

          <h2 className="text-lg md:text-xl font-bold font-display text-slate-100 leading-relaxed">
            {currentQ?.question}
          </h2>

          <div className="space-y-3">
            {currentQ?.options.map((opt, idx) => {
              const isSelected = selectedOption === idx;
              const isCorrect = currentQ.correctIndex === idx;

              let optionStyle =
                'bg-slate-950/80 border-slate-800 text-slate-200 hover:border-slate-700 hover:bg-slate-900';

              if (hasAnswered) {
                if (isCorrect) {
                  optionStyle = 'bg-emerald-950/40 border-emerald-500/60 text-emerald-200 ring-1 ring-emerald-500/30';
                } else if (isSelected) {
                  optionStyle = 'bg-rose-950/40 border-rose-500/60 text-rose-200 ring-1 ring-rose-500/30';
                } else {
                  optionStyle = 'bg-slate-950/40 border-slate-900 text-slate-500 opacity-60';
                }
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleSelectOption(idx)}
                  disabled={hasAnswered}
                  className={`w-full text-left p-4 rounded-xl border transition-all text-xs md:text-sm font-sans flex items-start gap-3.5 cursor-pointer ${optionStyle}`}
                >
                  <span className="font-mono-numbers font-bold text-xs uppercase px-2 py-0.5 rounded bg-slate-900 border border-slate-800 shrink-0">
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span className="leading-relaxed">{opt}</span>
                </button>
              );
            })}
          </div>

          {hasAnswered && (
            <div className="space-y-4 pt-4 border-t border-slate-800/80 animate-fadeIn">
              {/* LIVE ADAPTIVE DIFFICULTY SHIFT ALERT */}
              {isAdaptiveMode && lastAdaptiveResult && (
                <div className={`p-4 rounded-xl border flex items-center justify-between gap-3 ${
                  lastAdaptiveResult.direction === 'up'
                    ? 'bg-gradient-to-r from-emerald-950/70 via-teal-950/50 to-slate-950 border-emerald-500/40 text-emerald-200'
                    : lastAdaptiveResult.direction === 'down'
                    ? 'bg-gradient-to-r from-amber-950/70 via-orange-950/50 to-slate-950 border-amber-500/40 text-amber-200'
                    : 'bg-gradient-to-r from-blue-950/70 via-indigo-950/50 to-slate-950 border-blue-500/40 text-blue-200'
                }`}>
                  <div className="flex items-center gap-2.5">
                    {lastAdaptiveResult.direction === 'up' ? (
                      <TrendingUp className="w-5 h-5 text-emerald-400 shrink-0" />
                    ) : lastAdaptiveResult.direction === 'down' ? (
                      <TrendingDown className="w-5 h-5 text-amber-400 shrink-0" />
                    ) : (
                      <Gauge className="w-5 h-5 text-blue-400 shrink-0" />
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-xs uppercase tracking-wider">
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
                      <p className="text-xs text-slate-300 mt-0.5">
                        {lastAdaptiveResult.rationale}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className={`text-xs font-mono-numbers font-bold block ${
                      lastAdaptiveResult.deltaRating >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {lastAdaptiveResult.deltaRating >= 0 ? `+${lastAdaptiveResult.deltaRating}` : lastAdaptiveResult.deltaRating} Elo
                    </span>
                    <span className="text-[10px] text-slate-400">Skill Rating</span>
                  </div>
                </div>
              )}

              {selectedOption !== null && (
                <WrongAnswerBreakdownCard
                  explanation={getDetailedAnswerExplanation(currentQ, selectedOption, subject || topicTitle)}
                />
              )}

              <div className="flex justify-end pt-2">
                <button
                  onClick={handleNextQuestion}
                  disabled={isFetchingAdaptive}
                  className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-xl transition-colors flex items-center gap-2 cursor-pointer shadow-md"
                >
                  {isFetchingAdaptive ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Calibrating Difficulty...</span>
                    </>
                  ) : (
                    <>
                      <span>{currentIndex + 1 === activeQuestions.length ? 'Finish Quiz' : 'Next Question'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {showCreatorModal && (
          <QuestionCreatorStudio
            isModal={true}
            initialSubject={subject || topicTitle}
            initialTopic={currentQ?.topic || topicTitle}
            onClose={() => setShowCreatorModal(false)}
            onAddQuestionToQuiz={(newQ) => {
              setActiveQuestions(prev => [newQ, ...prev]);
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
                subject,
                options: newQ.options,
                selectedAnswer: newQ.options[newQ.correctIndex === 0 ? 1 : 0],
                correctAnswer: newQ.options[newQ.correctIndex],
                examinerExplanation: newQ.angryExplanation,
                whyPickedWrong: newQ.distractorExplanations?.[newQ.correctIndex === 0 ? 1 : 0],
                trapNote: newQ.examinerTrapNotes,
                source: 'quiz',
              });
            } : undefined}
          />
        )}
      </div>
    );
  }

  // -------------------------------------------------------------
  // DEFAULT: CHAT AI STYLE QUIZ EXPERIENCE
  // -------------------------------------------------------------
  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-4 py-6 space-y-4">
      {/* Top Bar with AI Status, Progress, and Mode Switcher */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500 to-rose-600 flex items-center justify-center text-slate-950 shadow-md">
              <Bot className="w-6 h-6 stroke-[2.5]" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-slate-900 animate-pulse" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white font-display text-sm sm:text-base">
                The Angry Explainer · AI Tutor
              </span>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
                {aiMood} mode
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Interactive 1-on-1 sparring session with personality & side-talk
            </p>
          </div>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-2 sm:gap-3 self-end sm:self-auto flex-wrap sm:flex-nowrap">
          {/* Adaptive Difficulty Badge */}
          <div className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 ${
            DIFFICULTY_TIERS[currentDifficultyTier]?.badgeColor || 'bg-slate-950 border-slate-800 text-slate-300'
          }`} title="Current dynamic question difficulty tier">
            <Gauge className="w-3.5 h-3.5" />
            <span>{currentDifficultyTier}</span>
          </div>

          {/* Skill Elo Tracker */}
          <div className="px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono-numbers text-slate-200 hidden sm:flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-bold">{skillRating}</span>
            <span className="text-[10px] text-slate-400">Elo</span>
          </div>

          {/* Progress Badge */}
          <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono-numbers text-slate-300">
            Q <strong className="text-amber-400">{currentIndex + 1}</strong> of {activeQuestions.length}
          </div>

          {/* Toggle to Worksheet mode */}
          <button
            onClick={() => setViewMode('worksheet')}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Switch to traditional worksheet test view"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Worksheet View</span>
          </button>

          {/* Gemini Question Studio */}
          <button
            onClick={() => setShowCreatorModal(true)}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-500/40 hover:border-cyan-400 text-cyan-300 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
            title="Create custom questions with full Gemini capabilities (Vision, Web Grounding, Thinking, Voice TTS)"
          >
            <Wand2 className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Gemini Studio</span>
          </button>

          {/* Generate New Set */}
          <button
            onClick={handleGenerateNewQuestions}
            className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 text-amber-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Generate 5 new practice questions with AI"
          >
            <Sparkles className="w-3.5 h-3.5 fill-amber-400" />
            <span className="hidden sm:inline">New Set</span>
          </button>
        </div>
      </div>

      {/* Progress Line */}
      <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden border border-slate-800/80">
        <div
          className="bg-gradient-to-r from-amber-500 via-rose-500 to-amber-400 h-full rounded-full transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / activeQuestions.length) * 100}%` }}
        />
      </div>

      {/* CHAT MESSAGES CONTAINER */}
      <div className="bg-slate-950/70 border border-slate-800/90 rounded-3xl p-4 sm:p-6 min-h-[460px] max-h-[640px] overflow-y-auto space-y-5 shadow-2xl flex flex-col custom-scrollbar">
        {messages.map((msg) => {
          const isAi = msg.sender === 'ai';

          return (
            <div
              key={msg.id}
              className={`flex gap-3 animate-fadeIn ${isAi ? 'items-start' : 'items-end justify-end'}`}
            >
              {/* AI Avatar */}
              {isAi && (
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0 mt-0.5 shadow-sm">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              {/* Message Content Bubble */}
              <div
                className={`max-w-[92%] sm:max-w-[82%] rounded-2xl p-4 sm:p-5 transition-all ${
                  isAi
                    ? 'bg-slate-900/90 border border-slate-800 text-slate-200 rounded-tl-sm shadow-lg'
                    : 'bg-gradient-to-br from-indigo-600 to-indigo-700 text-white rounded-tr-sm shadow-md'
                }`}
              >
                {/* Header row in bubble */}
                <div className="flex items-center justify-between gap-3 mb-2 pb-1.5 border-b border-white/5 text-[11px] text-slate-400">
                  <span className="font-semibold flex items-center gap-1.5">
                    {isAi ? (
                      <span className="text-amber-400 font-display flex items-center gap-1">
                        The Angry Explainer
                      </span>
                    ) : (
                      <span>You (Candidate)</span>
                    )}
                  </span>

                  <div className="flex items-center gap-2">
                    <span className="font-mono-numbers text-[10px] text-slate-500">{msg.timestamp}</span>
                    {isAi && (
                      <button
                        onClick={() => handleSpeak(msg.id, msg.text)}
                        className={`p-1 rounded-md transition-colors cursor-pointer ${
                          isSpeakingId === msg.id
                            ? 'text-amber-400 bg-amber-500/20'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                        }`}
                        title={isSpeakingId === msg.id ? 'Stop voice' : 'Listen to voice'}
                      >
                        {isSpeakingId === msg.id ? (
                          <VolumeX className="w-3.5 h-3.5 animate-pulse" />
                        ) : (
                          <Volume2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Primary Message Text */}
                <div className="text-xs sm:text-sm leading-relaxed whitespace-pre-line font-sans">
                  {msg.text}
                </div>

                {/* Reading Passage in chat if present */}
                {msg.questionPayload?.question.passage && (
                  <div className="mt-3 bg-slate-950/90 border border-cyan-500/40 rounded-xl p-3.5 space-y-2 text-left animate-fadeIn">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 text-xs text-cyan-300 font-bold">
                      <div className="flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
                        <span>{msg.questionPayload.question.passageTitle || 'Reading Passage & Context'}</span>
                      </div>
                      <span className="text-[10px] text-amber-300 font-mono-numbers px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/30">
                        {msg.questionPayload.question.passage.split('\n\n').length >= 5 ? '6+ ¶ Extended' : 'Passage'}
                      </span>
                    </div>
                    <div className="text-xs text-slate-200 leading-relaxed font-serif whitespace-pre-line max-h-64 overflow-y-auto pr-1.5 scrollbar-thin">
                      {msg.questionPayload.question.passage}
                    </div>
                  </div>
                )}

                {/* Question Payload with Interactive Option Buttons */}
                {msg.questionPayload && (
                  <div className="mt-4 pt-3 border-t border-slate-800/90 space-y-3">
                    <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold flex items-center gap-1.5">
                      <Flame className="w-3.5 h-3.5 text-amber-500" />
                      <span>Pick your answer carefully:</span>
                    </div>

                    <div className="space-y-2">
                      {msg.questionPayload.question.options.map((optionText, optIdx) => {
                        const isChosen = selectedOption === optIdx;
                        const isCorrectAnswer = optIdx === msg.questionPayload?.question.correctIndex;

                        let btnStyle = 'bg-slate-950/80 border-slate-800 text-slate-200 hover:border-amber-500/50 hover:bg-slate-900';
                        if (hasAnswered) {
                          if (isCorrectAnswer) {
                            btnStyle = 'bg-emerald-950/60 border-emerald-500/80 text-emerald-200 ring-1 ring-emerald-500/40';
                          } else if (isChosen) {
                            btnStyle = 'bg-rose-950/60 border-rose-500/80 text-rose-200 ring-1 ring-rose-500/40';
                          } else {
                            btnStyle = 'bg-slate-950/40 border-slate-900 text-slate-500 opacity-50';
                          }
                        }

                        return (
                          <button
                            key={optIdx}
                            onClick={() => handleSelectOption(optIdx)}
                            disabled={hasAnswered}
                            className={`w-full text-left p-3 sm:p-3.5 rounded-xl border text-xs sm:text-sm font-sans flex items-start gap-3 transition-all cursor-pointer ${btnStyle}`}
                          >
                            <span className="font-mono-numbers font-bold text-xs uppercase px-2 py-0.5 rounded bg-slate-900 border border-slate-800 shrink-0">
                              {String.fromCharCode(65 + optIdx)}
                            </span>
                            <span className="leading-relaxed">{optionText}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Evaluation payload badges & detailed breakdown */}
                {msg.evaluationPayload && (
                  <div className="mt-3 pt-2 space-y-2.5">
                    <div className="flex items-center gap-2 text-xs font-mono-numbers">
                      {msg.evaluationPayload.isCorrect ? (
                        <span className="inline-flex items-center gap-1.5 text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-1 rounded-xl border border-emerald-500/30">
                          <CheckCircle2 className="w-3.5 h-3.5" /> +15 XP · Correct
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-rose-400 font-bold bg-rose-500/10 px-2.5 py-1 rounded-xl border border-rose-500/30">
                          <XCircle className="w-3.5 h-3.5" /> Trap Sprung · Learning Moment
                        </span>
                      )}
                    </div>

                    {msg.evaluationPayload.detailedExplanation && (
                      <WrongAnswerBreakdownCard
                        explanation={msg.evaluationPayload.detailedExplanation}
                        compact
                      />
                    )}
                  </div>
                )}
              </div>

              {/* User Avatar */}
              {!isAi && (
                <div className="w-8 h-8 rounded-xl bg-indigo-600/30 border border-indigo-500/50 flex items-center justify-center text-indigo-300 shrink-0 mb-0.5">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          );
        })}

        {/* AI Typing Indicator */}
        {isAiTyping && (
          <div className="flex items-center gap-3 animate-fadeIn">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              <span className="italic">The Angry Explainer is preparing personality reaction...</span>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* NEXT QUESTION / ACTION BANNER (When answered) */}
      {hasAnswered && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fadeIn shadow-lg">
          <div className="text-xs text-slate-300">
            <span className="text-amber-400 font-bold">Concept Checked! </span>
            {currentIndex + 1 < activeQuestions.length
              ? `Ready for Question ${currentIndex + 2}? The difficulty ramps up.`
              : 'You have answered all questions in this set!'}
          </div>

          <button
            onClick={handleNextQuestion}
            disabled={isFetchingAdaptive}
            className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md hover:scale-[1.02]"
          >
            {isFetchingAdaptive ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>AI Calibrating Difficulty...</span>
              </>
            ) : (
              <>
                <span>{currentIndex + 1 === activeQuestions.length ? 'View Debrief & XP' : 'Drop Next Question →'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      )}

      {/* QUICK PROMPT CHIPS & FREEFORM CHAT BAR */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 sm:p-4 space-y-3 shadow-xl">
        {/* Quick Follow-up chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-[11px] text-slate-400">
          <span className="shrink-0 flex items-center gap-1 font-semibold text-slate-500">
            <Lightbulb className="w-3 h-3 text-amber-400" /> Follow-up prompts:
          </span>

          <button
            type="button"
            onClick={() => handleSendCustomChat("Give me a sharp 1-sentence mnemonic for this topic")}
            disabled={isSendingCustomMsg}
            className="shrink-0 px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 transition-colors cursor-pointer disabled:opacity-50"
          >
            🧠 1-Sentence Mnemonic
          </button>

          <button
            type="button"
            onClick={() => handleSendCustomChat("Why do professors love asking this trick on exams?")}
            disabled={isSendingCustomMsg}
            className="shrink-0 px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 transition-colors cursor-pointer disabled:opacity-50"
          >
            🎯 Why is this an exam trap?
          </button>

          <button
            type="button"
            onClick={() => handleSendCustomChat("Explain the core mechanism like I'm 10 years old")}
            disabled={isSendingCustomMsg}
            className="shrink-0 px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 transition-colors cursor-pointer disabled:opacity-50"
          >
            👶 Explain like I'm 10
          </button>
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendCustomChat();
          }}
          className="flex items-center gap-2"
        >
          <div className="relative flex-1">
            <input
              type="text"
              value={userChatInput}
              onChange={(e) => setUserChatInput(e.target.value)}
              placeholder="Ask the AI coach a follow-up question or talk back..."
              disabled={isSendingCustomMsg}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={!userChatInput.trim() || isSendingCustomMsg}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-30 disabled:hover:bg-amber-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md shrink-0"
          >
            <span>Send</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>

      {showCreatorModal && (
        <QuestionCreatorStudio
          isModal={true}
          initialSubject={subject || topicTitle}
          initialTopic={currentQ?.topic || topicTitle}
          onClose={() => setShowCreatorModal(false)}
          onAddQuestionToQuiz={(newQ) => {
            setActiveQuestions(prev => [newQ, ...prev]);
            setCurrentIndex(0);
            setSelectedOption(null);
            setHasAnswered(false);
            setShowCreatorModal(false);
            playCorrectSound();
            initChatForQuestion(0, [newQ, ...activeQuestions]);
          }}
          onSaveToMistakes={onRecordMistake ? (newQ) => {
            onRecordMistake({
              question: newQ.question,
              passage: newQ.passage,
              passageTitle: newQ.passageTitle,
              topic: newQ.topic,
              subject,
              options: newQ.options,
              selectedAnswer: newQ.options[newQ.correctIndex === 0 ? 1 : 0],
              correctAnswer: newQ.options[newQ.correctIndex],
              examinerExplanation: newQ.angryExplanation,
              whyPickedWrong: newQ.distractorExplanations?.[newQ.correctIndex === 0 ? 1 : 0],
              trapNote: newQ.examinerTrapNotes,
              source: 'quiz',
            });
          } : undefined}
        />
      )}
    </div>
  );
};
