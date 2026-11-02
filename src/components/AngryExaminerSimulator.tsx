import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Send,
  RotateCcw,
  Volume2,
  VolumeX,
  Clock,
  Sparkles,
  HelpCircle,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Flame,
  ArrowRight,
  BookOpen,
  MessageSquare,
  SlidersHorizontal,
  Lightbulb,
  Bot,
  User,
  Copy,
  Check,
  ArrowUp
} from 'lucide-react';
import { Lecture, VivaScenario, ExaminerEvaluation } from '../types';
import {
  playVivaGavelSound,
  playCorrectSound,
  playIncorrectSound,
  playTimerTickSound,
  playStreakFlameSound,
  speakExaminerVoice,
  speakSideTalkThenQuestion,
  stopSpeaking
} from '../utils/audio';
import { getExaminerInterviewIntro, getExaminerFollowUpBanter } from '../utils/aiPersonality';
import { TypewriterText } from './TypewriterText';
import { HandDrawnSmileyIcon } from './HandDrawnSmileyIcon';

interface AngryExaminerSimulatorProps {
  lectures: Lecture[];
  selectedTopic?: string;
  onRecordResult: (topic: string, score: number, verdict: string) => void;
}

interface InterviewChatMessage {
  id: string;
  sender: 'examiner' | 'candidate';
  text: string;
  timestamp: string;
  isQuestion?: boolean;
  questionData?: {
    topic: string;
    title: string;
    difficulty: string;
    flawedExample?: string;
  };
  evaluationData?: ExaminerEvaluation;
  sideTalk?: string;
  isTyping?: boolean;
}

export const AngryExaminerSimulator: React.FC<AngryExaminerSimulatorProps> = ({
  lectures,
  selectedTopic,
  onRecordResult,
}) => {
  // Mode selection
  const [examMode, setExamMode] = useState<'viva' | 'flaw' | 'mechanism' | 'pressure'>('viva');

  // State for message copy feedback
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);

  // Available topics
  const topics = Array.from(new Set(lectures.map(l => l.topic)));
  const [activeTopic, setActiveTopic] = useState<string>(
    selectedTopic && topics.includes(selectedTopic) ? selectedTopic : topics[0] || 'Neuroscience & Electrophysiology'
  );

  // Available questions for active topic
  const matchingLectures = lectures.filter(l => l.topic === activeTopic);
  const currentScenarios: VivaScenario[] = matchingLectures.flatMap(l => l.vivaQuestions);

  const [scenarioIndex, setScenarioIndex] = useState(0);
  const currentScenario: VivaScenario = currentScenarios[scenarioIndex] || {
    id: 'default-exam-question',
    topic: activeTopic,
    title: 'Speaking Exam Question',
    difficulty: 'Strict',
    examinerPrompt: `Candidate, describe the complete regulatory and mechanistic cascade in ${activeTopic}. What is the primary rate-limiting step and what are the clinical consequences of its inhibition?`,
    requiredKeywords: ['mechanism', 'rate-limiting', 'inhibition'],
    sampleModelAnswer: `In ${activeTopic}, the pathway is tightly regulated at the primary committed step.`,
    followUpPrompt: 'What happens when an allosteric inhibitor uncouples this mechanism?'
  };

  // Student answer state
  const [studentAnswer, setStudentAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [evaluation, setEvaluation] = useState<ExaminerEvaluation | null>(null);

  // Chat stream messages
  const [chatMessages, setChatMessages] = useState<InterviewChatMessage[]>([]);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Voice speech-to-text dictation
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Speech-to-speech audio feedback
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);

  // Pressure Chamber timer (60s)
  const [timeLeft, setTimeLeft] = useState(60);
  const [timerRunning, setTimerRunning] = useState(false);
  const [isExaminerQuestionReady, setIsExaminerQuestionReady] = useState(false);

  // Auto-speak questions and commentary toggle
  const [autoSpeakVoice, setAutoSpeakVoice] = useState(false);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatScrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isSubmitting]);

  // Topic sync
  useEffect(() => {
    if (selectedTopic && topics.includes(selectedTopic)) {
      setActiveTopic(selectedTopic);
      setScenarioIndex(0);
      setEvaluation(null);
      setStudentAnswer('');
      setIsExaminerQuestionReady(false);
      setTimerRunning(false);
    }
  }, [selectedTopic]);

  // Initialize/Update AI Interview Chat when topic, scenario, or mode changes
  useEffect(() => {
    const { greeting, sideTalk } = getExaminerInterviewIntro(activeTopic, examMode, currentScenario.title);
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setIsExaminerQuestionReady(false);
    setTimerRunning(false);
    if (examMode === 'pressure') {
      setTimeLeft(60);
    }

    const promptText = examMode === 'flaw' && currentScenario.flawedExample
      ? `${currentScenario.examinerPrompt}\n\n[Exhibit A: Flawed Student Essay to Dissect]\n"${currentScenario.flawedExample}"`
      : currentScenario.examinerPrompt;

    const questionMsgId = `examiner-q-${scenarioIndex}-${Date.now() + 1}`;

    const initialMessages: InterviewChatMessage[] = [
      {
        id: `examiner-intro-${scenarioIndex}-${Date.now()}`,
        sender: 'examiner',
        text: greeting,
        timestamp: now,
      },
      {
        id: questionMsgId,
        sender: 'examiner',
        text: promptText,
        timestamp: now,
        isQuestion: true,
        sideTalk: sideTalk,
        questionData: {
          topic: activeTopic,
          title: currentScenario.title,
          difficulty: currentScenario.difficulty,
          flawedExample: examMode === 'flaw' ? currentScenario.flawedExample : undefined,
        },
      }
    ];

    setChatMessages(initialMessages);

    // If auto-speak is enabled, speak examiner commentary first, then reveal and ask question
    if (autoSpeakVoice) {
      const qText = currentScenario.examinerPrompt.replace(/\[Exhibit A:[^\]]*\]/g, '').replace(/["']/g, '');
      setIsSpeaking(true);
      setSpeakingMsgId(questionMsgId);
      speakSideTalkThenQuestion(
        sideTalk,
        qText,
        () => {
          setIsExaminerQuestionReady(true);
          if (examMode === 'pressure') {
            setTimerRunning(true);
          }
        },
        () => {
          setIsSpeaking(false);
          setSpeakingMsgId(null);
        }
      );
    }
  }, [activeTopic, scenarioIndex, examMode, autoSpeakVoice]);

  // Timer logic for 60s Pressure Chamber
  useEffect(() => {
    let interval: any = null;
    if (examMode === 'pressure' && timerRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 5 && t > 0) {
            playTimerTickSound();
          }
          if (t <= 1) {
            setTimerRunning(false);
            playIncorrectSound();
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [examMode, timerRunning, timeLeft]);

  // Initialize Speech Recognition if supported
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recog = new SpeechRecognition();
        recog.continuous = true;
        recog.interimResults = true;
        recog.lang = 'en-US';

        recog.onresult = (event: any) => {
          let transcript = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript;
          }
          setStudentAnswer(prev => {
            const trimmed = prev.trim();
            return trimmed ? `${trimmed} ${transcript}` : transcript;
          });
        };

        recog.onerror = (err: any) => {
          console.warn('Speech recognition error:', err);
          setIsListening(false);
        };

        recog.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recog;
      }
    }

    return () => {
      stopSpeaking();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {}
      }
    };
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in this browser. Please type your response.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleStartPressureMode = () => {
    setExamMode('pressure');
    setTimeLeft(60);
    setTimerRunning(true);
    setStudentAnswer('');
    setEvaluation(null);
    playVivaGavelSound();
  };

  const getQuickDefenseChoices = (scenario: VivaScenario): string[] => {
    if (!scenario) return [];
    // Choice 1: The model mechanistic claim
    const sentences = (scenario.sampleModelAnswer || '').split('. ');
    const s1 = sentences[0] ? sentences[0].replace(/['"]/g, '').trim() : '';
    const choice1 = s1 ? (s1.endsWith('.') ? s1 : `${s1}.`) : 'Mechanistically, the initial depolarizing flux triggers rapid conformational shifting.';

    // Choice 2: Structured defense using required keywords
    const kwList = scenario.requiredKeywords || [];
    const kwPhrase = kwList.length > 0 ? kwList.slice(0, 3).join(', ') : 'membrane potential, refractory kinetics, allosteric regulation';
    const choice2 = `The defense hinges critically on ${kwPhrase}. Under physiological conditions, this dictates the rate law and prevents catastrophic depolarizing failure.`;

    // Choice 3: Experimental and deductive rationale
    const choice3 = `Biophysically, this can be proven by observing the thermodynamic equilibrium shift and passive ion permeability across the vestibule.`;

    return [choice1, choice2, choice3];
  };

  const handleSelectQuickAnswer = (answerText: string) => {
    if (isSubmitting) return;

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }

    if (timerRunning) {
      setTimerRunning(false);
    }

    playVivaGavelSound();
    playStreakFlameSound();
    setStudentAnswer('');

    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // 1. Post Candidate response bubble in chat with live typing animation (ChatGPT style)
    const candidateMsg: InterviewChatMessage = {
      id: `candidate-ans-${Date.now()}`,
      sender: 'candidate',
      text: answerText,
      timestamp: now,
      isTyping: true,
    };
    setChatMessages(prev => [...prev, candidateMsg]);

    const typingDuration = Math.min(950, answerText.length * 8 + 300);
    setTimeout(() => {
      setChatMessages(prev =>
        prev.map(m => (m.id === candidateMsg.id ? { ...m, isTyping: false } : m))
      );
      handleSubmitAnswer(answerText, false);
    }, typingDuration);
  };

  const handleSubmitAnswer = async (overrideAnswer?: string, shouldPostCandidateMsg = true) => {
    const textToSubmit = (overrideAnswer || studentAnswer).trim();
    if (!textToSubmit || isSubmitting) return;

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }

    if (timerRunning) {
      setTimerRunning(false);
    }

    playVivaGavelSound();
    setIsSubmitting(true);
    setStudentAnswer('');

    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // 1. Post Candidate response bubble in chat if not already posted by quick answer
    if (shouldPostCandidateMsg) {
      const candidateMsg: InterviewChatMessage = {
        id: `candidate-ans-${Date.now()}`,
        sender: 'candidate',
        text: textToSubmit,
        timestamp: now,
        isTyping: true,
      };
      setChatMessages(prev => [...prev, candidateMsg]);
      setTimeout(() => {
        setChatMessages(prev =>
          prev.map(m => (m.id === candidateMsg.id ? { ...m, isTyping: false } : m))
        );
      }, 500);
    }

    try {
      const promptToEvaluate =
        examMode === 'flaw' && currentScenario.flawedExample
          ? `Flawed student text: "${currentScenario.flawedExample}". Task: Spot and dissect the flaw. Question: ${currentScenario.examinerPrompt}`
          : currentScenario.examinerPrompt;

      const res = await fetch('/api/examiner/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: activeTopic,
          question: promptToEvaluate,
          studentAnswer: textToSubmit,
          mode: examMode,
        }),
      });

      const data: ExaminerEvaluation = await res.json();
      setEvaluation(data);

      if (data.score >= 7) {
        playCorrectSound();
      } else {
        playIncorrectSound();
      }

      onRecordResult(activeTopic, data.score, data.verdict);

      // 2. Add Examiner Evaluation and Personality reaction to chat
      const followUpIntro = getExaminerFollowUpBanter(data.score, data.verdict);
      const evalMsgId = `examiner-eval-${Date.now()}`;

      const examinerEvalMsg: InterviewChatMessage = {
        id: evalMsgId,
        sender: 'examiner',
        text: `**Verdict: ${data.verdict} (${data.score}/10)**\n\n"${data.roastCritique}"`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        evaluationData: data,
        sideTalk: followUpIntro,
      };

      setChatMessages(prev => [...prev, examinerEvalMsg]);

      // Auto-speak roast if enabled
      setSpeakingMsgId(evalMsgId);
      setIsSpeaking(true);
      speakExaminerVoice(data.roastCritique, () => {
        setIsSpeaking(false);
        setSpeakingMsgId(null);
      });
    } catch (err) {
      console.error(err);
      alert('Failed to connect to the Angry Examiner. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNextScenario = () => {
    stopSpeaking();
    setIsSpeaking(false);
    setSpeakingMsgId(null);
    setEvaluation(null);
    setStudentAnswer('');
    setIsExaminerQuestionReady(false);
    setTimerRunning(false);
    if (examMode === 'pressure') {
      setTimeLeft(60);
    }
    setScenarioIndex(idx => (idx + 1) % Math.max(1, currentScenarios.length));
  };

  const handleVoiceToggle = (textToSpeak?: string, msgId?: string, sideTalkPrefix?: string) => {
    if (isSpeaking) {
      stopSpeaking();
      setIsSpeaking(false);
      setSpeakingMsgId(null);
    } else {
      if (sideTalkPrefix && textToSpeak) {
        setIsSpeaking(true);
        if (msgId) setSpeakingMsgId(msgId);
        const cleanPrompt = textToSpeak.replace(/\[Exhibit A:[^\]]*\]/g, '').replace(/["']/g, '');
        speakSideTalkThenQuestion(
          sideTalkPrefix,
          cleanPrompt,
          () => {
            setIsExaminerQuestionReady(true);
            if (examMode === 'pressure') {
              setTimerRunning(true);
            }
          },
          () => {
            setIsSpeaking(false);
            setSpeakingMsgId(null);
          }
        );
      } else {
        const speech = textToSpeak || evaluation?.roastCritique;
        if (speech) {
          setIsSpeaking(true);
          if (msgId) setSpeakingMsgId(msgId);
          speakExaminerVoice(speech, () => {
            setIsSpeaking(false);
            setSpeakingMsgId(null);
          });
        }
      }
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      {/* Header Banner: The Angry Examiner Simulator */}
      <div className="bg-gradient-to-r from-stone-950 via-slate-900 to-rose-950/40 border border-slate-800 rounded-2xl p-5 sm:p-7 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
        <div className="flex items-center gap-4 sm:gap-5">
          <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-amber-500/15 border-2 border-amber-400/50 flex items-center justify-center text-amber-400 flex-shrink-0 shadow-lg shadow-amber-950/50">
            <HandDrawnSmileyIcon className="w-10 h-10 sm:w-12 sm:h-12 text-amber-400" mood="cheeky" />
            <div className="absolute bottom-1 left-1 right-1 text-[8px] sm:text-[9px] text-center font-bold text-amber-300 uppercase tracking-wider font-mono">
              Examiner
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2 text-xs text-rose-400 font-semibold tracking-wider uppercase mb-1">
              <span>Oral Board Interview Simulator</span>
              <span aria-hidden="true">·</span>
              <span>Inspired by angryexaminer.com</span>
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold font-display text-white tracking-tight">
              The Angry Examiner
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-1 max-w-xl">
              "No guessing. No vague answers. Give me the real reason, step-by-step, or get ready to try again."
            </p>
          </div>
        </div>

        {/* View Switcher & Exam Mode Selector */}
        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3 w-full md:w-auto">
          {/* ChatGPT Style Persona & Live Status Badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl shadow-sm text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-bold text-white">GPT-4o Viva Simulator</span>
            <span className="text-slate-600">·</span>
            <span className="text-amber-400 font-mono text-[11px] font-semibold">Interview Only</span>
          </div>

          {/* Auto-Speak Questions & Commentary Button */}
          <button
            type="button"
            onClick={() => {
              const nextVal = !autoSpeakVoice;
              setAutoSpeakVoice(nextVal);
              if (nextVal) {
                const { sideTalk } = getExaminerInterviewIntro(activeTopic, examMode, currentScenario.title);
                const qText = currentScenario.examinerPrompt.replace(/\[Exhibit A:[^\]]*\]/g, '').replace(/["']/g, '');
                handleVoiceToggle(qText, undefined, sideTalk);
              } else {
                stopSpeaking();
                setIsSpeaking(false);
              }
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer shadow-sm ${
              autoSpeakVoice
                ? 'bg-amber-500/20 border-amber-400 text-amber-200 ring-1 ring-amber-400/40'
                : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
            title="Automatically speak the examiner commentary and interview questions"
          >
            <Volume2 className={`w-3.5 h-3.5 ${autoSpeakVoice ? 'text-amber-400 animate-pulse' : 'text-slate-500'}`} />
            <span>Auto-Speak Questions: {autoSpeakVoice ? 'ON' : 'OFF'}</span>
          </button>

          {/* Mode Selector Tabs */}
          <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-950/80 border border-slate-800 rounded-xl self-stretch md:self-auto">
            <button
              onClick={() => {
                setExamMode('viva');
                setTimerRunning(false);
              }}
              className={`px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                examMode === 'viva'
                  ? 'bg-rose-500 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Speaking Drill
            </button>
            <button
              onClick={() => {
                setExamMode('flaw');
                setTimerRunning(false);
              }}
              className={`px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                examMode === 'flaw'
                  ? 'bg-rose-500 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Spot Flaw
            </button>
            <button
              onClick={() => {
                setExamMode('mechanism');
                setTimerRunning(false);
              }}
              className={`px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                examMode === 'mechanism'
                  ? 'bg-rose-500 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Mechanism
            </button>
            <button
              onClick={handleStartPressureMode}
              className={`px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                examMode === 'pressure'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                  : 'text-amber-400 hover:text-amber-300'
              }`}
            >
              <Clock className="w-3.5 h-3.5" /> 60s Chamber
            </button>
          </div>
        </div>
      </div>

      {/* Topic Filter Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold whitespace-nowrap pl-1">
          Topic Domain:
        </span>
        {topics.map(t => (
          <button
            key={t}
            onClick={() => {
              setActiveTopic(t);
              setScenarioIndex(0);
              setEvaluation(null);
              setStudentAnswer('');
            }}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
              activeTopic === t
                ? 'bg-slate-800 text-amber-300 border border-amber-500/30'
                : 'bg-slate-950/60 text-slate-400 hover:text-slate-200 border border-slate-900'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 1. CHAT AI STYLE INTERVIEW (DEFAULT) */}
      {/* ------------------------------------------------------------------ */}
        <div className="space-y-4">
          {/* Interview Arena Container */}
          <div className="bg-slate-950/80 border border-slate-800/90 rounded-3xl p-4 sm:p-6 min-h-[500px] max-h-[680px] overflow-y-auto space-y-6 shadow-2xl flex flex-col custom-scrollbar">
            {chatMessages.map(msg => {
              const isExaminer = msg.sender === 'examiner';

              return (
                <div
                  key={msg.id}
                  className={`flex gap-3 sm:gap-4 animate-fadeIn ${
                    isExaminer ? 'items-start' : 'items-end justify-end'
                  }`}
                >
                  {/* Examiner Avatar */}
                  {isExaminer && (
                    <div className="w-9 h-9 rounded-2xl bg-amber-500/15 border-2 border-amber-400/50 flex items-center justify-center text-amber-300 flex-shrink-0 mt-0.5 shadow-md">
                      <HandDrawnSmileyIcon className="w-6 h-6 text-amber-400" mood="cheeky" />
                    </div>
                  )}

                  {/* Message Bubble */}
                  <div
                    className={`max-w-[94%] sm:max-w-[85%] rounded-2xl p-4 sm:p-5 transition-all space-y-3 ${
                      isExaminer
                        ? 'bg-slate-900/95 border border-slate-800 text-slate-200 rounded-tl-sm shadow-xl'
                        : 'bg-gradient-to-br from-indigo-600 to-indigo-700 text-white rounded-tr-sm shadow-md'
                    }`}
                  >
                    {/* Header Row */}
                    <div className="flex items-center justify-between gap-3 pb-2 border-b border-white/5 text-[11px] text-slate-400">
                      <span className="font-semibold flex items-center gap-1.5">
                        {isExaminer ? (
                          <span className="text-rose-400 font-display flex items-center gap-1 font-bold">
                            The Angry Examiner
                          </span>
                        ) : (
                          <span>Candidate (You)</span>
                        )}
                      </span>

                      <div className="flex items-center gap-2">
                        <span className="font-mono-numbers text-[10px] text-slate-500">{msg.timestamp}</span>
                        {isExaminer && (
                          <button
                            onClick={() => handleVoiceToggle(msg.evaluationData?.roastCritique || msg.text, msg.id, msg.sideTalk)}
                            className={`p-1 rounded-md transition-colors cursor-pointer ${
                              speakingMsgId === msg.id && isSpeaking
                                ? 'text-rose-400 bg-rose-500/20'
                                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                            }`}
                            title={msg.sideTalk ? "Listen to Examiner Question & Commentary" : "Hear Examiner Voice"}
                          >
                            {speakingMsgId === msg.id && isSpeaking ? (
                              <VolumeX className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
                            ) : (
                              <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                            )}
                          </button>
                        )}
                        <button
                          onClick={() => {
                            const textToCopy = msg.evaluationData
                              ? `Score: ${msg.evaluationData.score}/10\nVerdict: ${msg.evaluationData.verdict}\nCritique: ${msg.evaluationData.roastCritique}\nModel Answer: ${msg.evaluationData.modelAnswer}`
                              : msg.text;
                            navigator.clipboard.writeText(textToCopy);
                            setCopiedMsgId(msg.id);
                            setTimeout(() => setCopiedMsgId(null), 2000);
                          }}
                          className="p-1 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
                          title="Copy message (ChatGPT style)"
                        >
                          {copiedMsgId === msg.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Commentary Quip */}
                    {msg.sideTalk && !msg.isQuestion && (
                      <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-500/30 text-amber-300 text-xs italic font-serif leading-relaxed flex items-start gap-2">
                        <Flame className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                        <div>
                          <TypewriterText text={msg.sideTalk} speed={38} cursorColor="text-amber-400" />
                        </div>
                      </div>
                    )}

                    {/* Question Card Block */}
                    {msg.isQuestion && msg.questionData && (
                      <div className="p-4 sm:p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3.5">
                        {/* Examiner Commentary / Preamble before Question */}
                        {msg.sideTalk && (
                          <div className="p-3.5 rounded-2xl bg-amber-950/40 border border-amber-500/40 text-amber-200 text-xs italic font-serif leading-relaxed flex items-start gap-2.5 shadow-inner">
                            <span className="text-amber-400 text-base shrink-0 select-none">💬</span>
                            <div className="space-y-1 flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-[11px] font-semibold text-amber-300 not-italic font-sans">
                                  Academic Examiner
                                </span>
                                <div className="flex items-center gap-2">
                                  {!isExaminerQuestionReady && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setIsExaminerQuestionReady(true);
                                        if (examMode === 'pressure') {
                                          setTimerRunning(true);
                                        }
                                      }}
                                      className="text-[10px] text-slate-400 hover:text-amber-300 px-1.5 py-0.5 rounded cursor-pointer transition-colors"
                                    >
                                      Skip to question →
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => handleVoiceToggle(msg.text, msg.id, msg.sideTalk)}
                                    className="text-[10px] text-amber-300 hover:text-amber-100 flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 cursor-pointer transition-colors"
                                    title="Listen to examiner question"
                                  >
                                    <Volume2 className="w-3 h-3 text-amber-300" />
                                    <span>{isSpeaking && speakingMsgId === msg.id ? 'Speaking...' : 'Listen'}</span>
                                  </button>
                                </div>
                              </div>
                              <div className="text-amber-100 font-serif">
                                "<TypewriterText
                                  text={msg.sideTalk}
                                  speed={38}
                                  cursorColor="text-amber-400"
                                  onComplete={() => {
                                    setIsExaminerQuestionReady(true);
                                    if (examMode === 'pressure') {
                                      setTimerRunning(true);
                                    }
                                  }}
                                />"
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Question details revealed when examiner finishes commentary */}
                        {isExaminerQuestionReady ? (
                          <div className="space-y-3.5 animate-fadeIn">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-rose-400 font-bold uppercase tracking-wider">
                                {msg.questionData.title}
                              </span>
                              <span className="text-amber-400 font-mono-numbers text-[11px] font-semibold">
                                Difficulty: {msg.questionData.difficulty}
                              </span>
                            </div>

                            <div className="text-sm sm:text-base font-bold font-display text-white leading-relaxed">
                              "<TypewriterText text={msg.text} speed={40} cursorColor="text-rose-400" />"
                            </div>

                            {/* Flawed Example if spot the flaw */}
                            {msg.questionData.flawedExample && (
                              <div className="p-3.5 rounded-xl bg-rose-950/30 border border-rose-500/30 text-xs text-rose-200 font-mono leading-relaxed">
                                <span className="text-[10px] uppercase font-bold text-rose-400 block mb-1">
                                  [Exhibit A: Flawed Student Essay]
                                </span>
                                "{msg.questionData.flawedExample}"
                              </div>
                            )}

                            {/* Quick Answer Options (1-Click ChatGPT Style) */}
                            {!evaluation && !isSubmitting && (
                              <div className="pt-2 border-t border-slate-800/80 space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-[11px] uppercase font-bold text-amber-400 tracking-wider flex items-center gap-1 font-mono">
                                    <Lightbulb className="w-3 h-3 text-amber-400" /> Choose Answer (Types Chat Bubble):
                                  </span>
                                  <span className="text-[10px] text-slate-500 font-mono">1-Click Answer</span>
                                </div>

                                <div className="grid grid-cols-1 gap-2">
                                  {getQuickDefenseChoices(currentScenario).map((choice, cIdx) => (
                                    <button
                                      key={cIdx}
                                      type="button"
                                      onClick={() => handleSelectQuickAnswer(choice)}
                                      className="text-left p-3 rounded-xl bg-slate-900/90 hover:bg-slate-800/90 border border-slate-800 hover:border-amber-500/50 text-slate-200 text-xs transition-all cursor-pointer flex items-start gap-2.5 group shadow-sm"
                                    >
                                      <span className="w-5 h-5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 font-bold text-[10px] font-mono flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-amber-500 group-hover:text-slate-950 transition-colors">
                                        {String.fromCharCode(65 + cIdx)}
                                      </span>
                                      <span className="leading-relaxed flex-1 group-hover:text-white">
                                        {choice}
                                      </span>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-xs text-amber-400/80 font-mono py-2 px-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                            <span className="italic">Examiner speaking... asking interview question when finished</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Regular Message Text (if not a question card) */}
                    {!msg.isQuestion && !msg.evaluationData && (
                      <div className="text-xs sm:text-sm leading-relaxed whitespace-pre-line font-sans">
                        {isExaminer ? (
                          <TypewriterText text={msg.text} speed={38} cursorColor="text-amber-400" />
                        ) : (
                          <TypewriterText text={msg.text} speed={28} cursorColor="text-indigo-200" />
                        )}
                      </div>
                    )}

                    {/* Evaluation Result Payload */}
                    {msg.evaluationData && (
                      <div className="space-y-4 pt-1">
                        {/* Score Stamp & Verdict */}
                        <div className="flex items-center justify-between p-4 rounded-xl bg-slate-950 border border-slate-800">
                          <div>
                            <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                              Board Verdict
                            </div>
                            <div
                              className={`text-base sm:text-lg font-bold font-display ${
                                msg.evaluationData.score >= 8
                                  ? 'text-emerald-400'
                                  : msg.evaluationData.score >= 5
                                  ? 'text-amber-400'
                                  : 'text-rose-400'
                              }`}
                            >
                              {msg.evaluationData.verdict}
                            </div>
                          </div>

                          <div
                            className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center font-mono-numbers border shadow-inner ${
                              msg.evaluationData.score >= 8
                                ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                                : msg.evaluationData.score >= 5
                                ? 'bg-amber-950/60 border-amber-500/40 text-amber-300'
                                : 'bg-rose-950/60 border-rose-500/40 text-rose-300'
                            }`}
                          >
                            <span className="text-xl font-black leading-none">{msg.evaluationData.score}</span>
                            <span className="text-[9px] uppercase font-bold text-slate-400">/ 10</span>
                          </div>
                        </div>

                        {/* Roast Critique Box */}
                        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                          <span className="text-xs font-bold text-rose-400 flex items-center gap-1.5 uppercase tracking-wider">
                            <Flame className="w-3.5 h-3.5" /> The Roast Critique
                          </span>
                          <p className="text-xs sm:text-sm text-slate-300 italic font-serif leading-relaxed">
                            "<TypewriterText text={msg.evaluationData.roastCritique} speed={18} cursorColor="text-rose-400" />"
                          </p>
                        </div>

                        {/* What was missed */}
                        {msg.evaluationData.whatYouMissed && msg.evaluationData.whatYouMissed.length > 0 && (
                          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-900 space-y-1.5">
                            <span className="text-xs font-semibold text-rose-400 flex items-center gap-1.5 uppercase tracking-wider">
                              <XCircle className="w-3.5 h-3.5" /> Critical Omissions:
                            </span>
                            <ul className="space-y-1 text-xs text-slate-300">
                              {msg.evaluationData.whatYouMissed.map((omission, i) => (
                                <li key={i} className="flex items-start gap-1.5">
                                  <span className="text-rose-400 font-bold">·</span>
                                  <span>{omission}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Model 1st-Class Answer */}
                        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-1">
                          <span className="font-semibold text-emerald-400 flex items-center gap-1.5 uppercase tracking-wider">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Model Answer:
                          </span>
                          <p className="leading-relaxed">{msg.evaluationData.modelAnswer}</p>
                        </div>

                        {/* Follow-up question banner */}
                        {msg.evaluationData.followUpQuestion && (
                          <div className="p-4 rounded-xl bg-gradient-to-r from-rose-950/40 to-amber-950/40 border border-amber-500/30 space-y-2">
                            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
                              Cross-Examination Follow-Up:
                            </span>
                            <p className="text-xs sm:text-sm font-semibold text-white">
                              "<TypewriterText text={msg.evaluationData.followUpQuestion} speed={18} cursorColor="text-amber-400" />"
                            </p>
                            <p className="text-[11px] text-slate-400">
                              Speak or type your answer in the box below to cross-examine further!
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Candidate Avatar */}
                  {!isExaminer && (
                    <div className="w-9 h-9 rounded-2xl bg-indigo-600/30 border border-indigo-500/50 flex items-center justify-center text-indigo-300 shrink-0 mb-0.5">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              );
            })}

            {/* AI Reviewing Indicator */}
            {isSubmitting && (
              <div className="flex items-center gap-3 animate-fadeIn">
                <div className="w-9 h-9 rounded-2xl bg-amber-500/15 border-2 border-amber-400/50 flex items-center justify-center text-amber-300 flex-shrink-0 shadow-md">
                  <HandDrawnSmileyIcon className="w-6 h-6 text-amber-400" mood="smug" />
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-300 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                  <span className="italic">The Examiner is weighing your explanation against board standards...</span>
                </div>
              </div>
            )}

            <div ref={chatScrollRef} />
          </div>

          {/* Action Row & Next Question Button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg">
            <div className="text-xs text-slate-400 flex items-center gap-2">
              <span className="font-semibold text-rose-400 font-mono-numbers">
                Scenario {scenarioIndex + 1} of {Math.max(1, currentScenarios.length)}
              </span>
              <span>·</span>
              <span>{activeTopic}</span>
            </div>

            <button
              onClick={handleNextScenario}
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
            >
              <span>Next Interview Scenario</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* CANDIDATE ANSWER INPUT BAR (VOICE + TEXT) */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-5 space-y-3 shadow-2xl">
            {/* Quick Answer Framing Starters */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-[11px] text-slate-400">
              <span className="shrink-0 flex items-center gap-1 font-semibold text-slate-500">
                <Lightbulb className="w-3 h-3 text-amber-400" /> Starters:
              </span>

              <button
                type="button"
                onClick={() => setStudentAnswer(prev => prev ? `${prev} Mechanistically, the first step is ` : "Mechanistically, the first step is ")}
                className="shrink-0 px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 transition-colors cursor-pointer"
              >
                🔬 "Mechanistically, first..."
              </button>

              <button
                type="button"
                onClick={() => setStudentAnswer(prev => prev ? `${prev} The rate-limiting step involves ` : "The rate-limiting step involves ")}
                className="shrink-0 px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 transition-colors cursor-pointer"
              >
                ⚡ "The rate-limiting step..."
              </button>

              <button
                type="button"
                onClick={() => setStudentAnswer(prev => prev ? `${prev} Under physiological conditions, ` : "Under physiological conditions, ")}
                className="shrink-0 px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 transition-colors cursor-pointer"
              >
                🩺 "Under physiological conditions..."
              </button>
            </div>

            {/* Main Input Field */}
            <div className="flex flex-col sm:flex-row items-stretch gap-2.5">
              <div className="relative flex-1">
                <textarea
                  rows={3}
                  value={studentAnswer}
                  onChange={e => setStudentAnswer(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                      e.preventDefault();
                      handleSubmitAnswer();
                    }
                  }}
                  placeholder="Defend your thesis to The Examiner. State the exact molecular names, rate laws, or gradients..."
                  className="w-full bg-slate-950 border border-slate-800 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/50 rounded-2xl p-3.5 sm:p-4 text-xs sm:text-sm text-slate-200 placeholder:text-slate-500 outline-none transition-all resize-none leading-relaxed"
                />
              </div>

              {/* Action Buttons Column */}
              <div className="flex sm:flex-col justify-end gap-2 shrink-0">
                {/* Voice Dictation Button */}
                <button
                  type="button"
                  onClick={toggleListening}
                  className={`px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    isListening
                      ? 'bg-rose-600 text-white animate-pulse'
                      : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800'
                  }`}
                  title={isListening ? 'Stop Voice Recording' : 'Speak Your Defense (Dictation)'}
                >
                  {isListening ? <Mic className="w-4 h-4 text-white" /> : <MicOff className="w-4 h-4 text-rose-400" />}
                  <span className="sm:hidden">{isListening ? 'Listening' : 'Dictate'}</span>
                </button>

                {/* ChatGPT Circular Send Button */}
                <button
                  type="button"
                  disabled={!studentAnswer.trim() || isSubmitting}
                  onClick={() => handleSubmitAnswer()}
                  className="w-10 h-10 rounded-full bg-white hover:bg-slate-200 disabled:opacity-30 disabled:bg-slate-800 text-slate-950 disabled:text-slate-500 font-bold flex items-center justify-center transition-all cursor-pointer shadow-lg shadow-black/40 self-end sm:self-center"
                  title="Submit answer (Enter or Ctrl+Enter)"
                >
                  <ArrowUp className="w-5 h-5 stroke-[2.5]" />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-800/60">
              <span className="hidden sm:inline">Press <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-mono text-[10px]">Ctrl+Enter</kbd> to defend</span>
              <span className="font-mono-numbers">{studentAnswer.trim().split(/\s+/).filter(Boolean).length} words typed</span>
              <span className="text-[10px] text-slate-500">The Angry Examiner can make mistakes. Verify curriculum facts.</span>
            </div>
          </div>
        </div>
    </div>
  );
};
