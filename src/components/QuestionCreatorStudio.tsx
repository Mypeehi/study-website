import React, { useState, useRef } from 'react';
import {
  Sparkles,
  Image as ImageIcon,
  Search,
  Brain,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Upload,
  X,
  ArrowRight,
  RotateCcw,
  BookOpen,
  Sliders,
  ExternalLink,
  Copy,
  Check,
  Zap,
  Target,
  Wand2,
  FileText
} from 'lucide-react';
import { QuizQuestion } from '../types';
import { WrongAnswerBreakdownCard } from './WrongAnswerBreakdownCard';
import { getDetailedAnswerExplanation } from '../utils/answerExplanation';
import { playCorrectSound, playIncorrectSound, playStreakFlameSound } from '../utils/audio';

interface QuestionCreatorStudioProps {
  initialSubject?: string;
  initialTopic?: string;
  onAddQuestionToQuiz?: (question: QuizQuestion) => void;
  onAddQuestionToLevel?: (question: QuizQuestion) => void;
  onSaveToMistakes?: (question: QuizQuestion) => void;
  isModal?: boolean;
  onClose?: () => void;
}

const TEMPLATE_PROMPTS = [
  {
    title: 'Kinetic Trap',
    prompt: 'Create a question that tricks students who confuse thermodynamic equilibrium with kinetic reaction rates (Vmax vs Km).',
    subject: 'Chemistry / Biochemistry',
  },
  {
    title: 'Inverted Causality',
    prompt: 'Design a physiological question where the primary distractor swaps cause and effect in homeostatic feedback.',
    subject: 'Biology / Physiology',
  },
  {
    title: 'Rhetorical Shift',
    prompt: 'Examine authorial tone shifts between paragraph 2 and 5, focusing on syntactic cadence and figurative irony.',
    subject: 'English & Rhetoric',
  },
  {
    title: 'Calculus Optimization',
    prompt: 'Formulate a constrained optimization problem testing second-derivative concavity where the boundary conditions create an attractive trap.',
    subject: 'Calculus / Mathematics',
  },
  {
    title: '6+ Paragraph Synthesis',
    prompt: 'Generate an extensive 6+ paragraph reading passage analyzing primary constitutional documents with cross-paragraph synthesis distractors.',
    subject: 'History & Social Studies',
  },
];

const SUBJECT_OPTIONS = [
  'Biology & Medicine',
  'Calculus & Higher Mathematics',
  'Physics & Mechanics',
  'Chemistry & Biochemistry',
  'English & Rhetorical Analysis',
  'History & Political Science',
  'Computer Science & Algorithms',
  'World Languages & Linguistics',
  'General Academic Mastery',
];

const VOICE_OPTIONS = [
  { id: 'Charon', label: 'Charon (Stern Examiner)', desc: 'Deep, rigorous, commanding' },
  { id: 'Fenrir', label: 'Fenrir (British Don)', desc: 'Crisp, authoritative academic' },
  { id: 'Puck', label: 'Puck (Witty Critic)', desc: 'Dynamic, sharp, energetic' },
  { id: 'Kore', label: 'Kore (Precise Lecturer)', desc: 'Clear, articulate, textbook-tone' },
  { id: 'Zephyr', label: 'Zephyr (Mentor)', desc: 'Calm, measured, analytical' },
];

export const QuestionCreatorStudio: React.FC<QuestionCreatorStudioProps> = ({
  initialSubject = 'Biology & Medicine',
  initialTopic = '',
  onAddQuestionToQuiz,
  onAddQuestionToLevel,
  onSaveToMistakes,
  isModal = false,
  onClose,
}) => {
  // Input Form State
  const [subject, setSubject] = useState<string>(initialSubject);
  const [topic, setTopic] = useState<string>(initialTopic);
  const [prompt, setPrompt] = useState<string>('');
  const [difficulty, setDifficulty] = useState<string>('Brutal Exam Level');
  const [format, setFormat] = useState<'multiple-choice' | 'vignette' | 'quantitative-derivation' | 'passage-synthesis'>('multiple-choice');
  const [passageLength, setPassageLength] = useState<'none' | 'standard' | '6-plus-paragraphs'>('none');
  const [gradeLevel, setGradeLevel] = useState<string>('AP / College Board / Undergraduate');

  // Gemini Advanced Capability Toggles
  const [thinkingLevel, setThinkingLevel] = useState<'HIGH' | 'MEDIUM' | 'LOW'>('HIGH');
  const [enableSearchGrounding, setEnableSearchGrounding] = useState<boolean>(false);
  const [generateAudio, setGenerateAudio] = useState<boolean>(true);
  const [voiceName, setVoiceName] = useState<string>('Charon');

  // Multimodal Image State
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageData, setImageData] = useState<{ data: string; mimeType: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Generation & Results State
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [createdQuestions, setCreatedQuestions] = useState<QuizQuestion[]>([]);
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState<number>(0);

  // Interactive Testing Sandbox State
  const [sandboxSelectedOption, setSandboxSelectedOption] = useState<number | null>(null);
  const [sandboxHasAnswered, setSandboxHasAnswered] = useState<boolean>(false);
  const [hasCopied, setHasCopied] = useState<boolean>(false);
  const [addedQuizIds, setAddedQuizIds] = useState<Set<string>>(new Set());

  // Audio Playback
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please select a valid image file (PNG, JPG, WEBP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setImagePreview(result);
      setImageData({
        data: result,
        mimeType: file.type,
      });
      setErrorMsg(null);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    setImageData(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleApplyTemplate = (tpl: typeof TEMPLATE_PROMPTS[0]) => {
    setPrompt(tpl.prompt);
    setSubject(tpl.subject);
    if (tpl.title.includes('6+ Paragraph')) {
      setPassageLength('6-plus-paragraphs');
      setFormat('passage-synthesis');
    }
    playStreakFlameSound();
  };

  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsGenerating(true);
    setErrorMsg(null);
    setSandboxSelectedOption(null);
    setSandboxHasAnswered(false);

    try {
      const response = await fetch('/api/questions/create-custom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt || topic || subject,
          subject,
          topic: topic || prompt || subject,
          gradeLevel,
          difficulty,
          format,
          passageLength,
          image: imageData,
          enableSearchGrounding,
          thinkingLevel,
          voiceName,
          generateAudio,
          count: 1,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to generate questions');
      }

      if (data.questions && data.questions.length > 0) {
        setCreatedQuestions(data.questions);
        setSelectedQuestionIndex(0);
        playCorrectSound();
      } else {
        throw new Error('No questions returned by Gemini.');
      }
    } catch (err: any) {
      console.error('Error in question generation:', err);
      setErrorMsg(err.message || 'Generation failed. Please try again.');
      playIncorrectSound();
    } finally {
      setIsGenerating(false);
    }
  };

  const currentQ = createdQuestions[selectedQuestionIndex] || null;

  const handleToggleAudio = () => {
    if (!currentQ?.audioData) return;

    if (!audioRef.current) {
      const audio = new Audio(`data:audio/wav;base64,${currentQ.audioData}`);
      audio.onended = () => setIsPlayingAudio(false);
      audio.onerror = () => setIsPlayingAudio(false);
      audioRef.current = audio;
    }

    if (isPlayingAudio) {
      audioRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      audioRef.current.play();
      setIsPlayingAudio(true);
    }
  };

  const handleSelectSandboxOption = (idx: number) => {
    if (sandboxHasAnswered || !currentQ) return;
    setSandboxSelectedOption(idx);
    setSandboxHasAnswered(true);

    if (idx === currentQ.correctIndex) {
      playCorrectSound();
    } else {
      playIncorrectSound();
    }
  };

  const handleResetSandbox = () => {
    setSandboxSelectedOption(null);
    setSandboxHasAnswered(false);
  };

  const handleAddToQuiz = (q: QuizQuestion) => {
    onAddQuestionToQuiz?.(q);
    setAddedQuizIds(prev => new Set(prev).add(q.id));
    playCorrectSound();
  };

  const handleCopyMarkdown = () => {
    if (!currentQ) return;
    let md = `### Question (${currentQ.topic})\n\n`;
    if (currentQ.passage) {
      md += `**${currentQ.passageTitle || 'Reading Passage'}**\n\n${currentQ.passage}\n\n---\n\n`;
    }
    md += `${currentQ.question}\n\n`;
    currentQ.options.forEach((opt, idx) => {
      const letter = String.fromCharCode(65 + idx);
      const mark = idx === currentQ.correctIndex ? ' [CORRECT]' : '';
      md += `${letter}) ${opt}${mark}\n`;
    });
    md += `\n**Proof & Explanation:** ${currentQ.angryExplanation}\n`;
    md += `**Examiner Trap Note:** ${currentQ.examinerTrapNotes}\n`;

    navigator.clipboard.writeText(md);
    setHasCopied(true);
    setTimeout(() => setHasCopied(false), 2000);
  };

  return (
    <div className={`w-full ${isModal ? 'fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto' : ''}`}>
      <div className={`w-full ${isModal ? 'max-w-6xl max-h-[92vh] overflow-y-auto' : 'max-w-7xl mx-auto'} bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col`}>
        
        {/* Header Bar */}
        <div className="p-5 sm:p-6 border-b border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-cyan-500 flex items-center justify-center text-white shadow-lg">
              <Sparkles className="w-6 h-6 stroke-[2.5] animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                  Gemini Question Creator Studio
                </h2>
                <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-cyan-300 border border-cyan-500/30">
                  Gemini 3.8 Flash Engine
                </span>
                <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                  <Brain className="w-3 h-3" /> Extended Thinking
                </span>
                <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
                  <Volume2 className="w-3 h-3" /> Gemini TTS
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Full-capability AI question engine: Multimodal visual inspection, live Google search grounding, high-depth reasoning, and spoken voice synthesis.
              </p>
            </div>
          </div>

          {isModal && onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Studio Body: Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-800 flex-1">
          
          {/* LEFT COLUMN: Controls & Prompt Formulation (5 cols) */}
          <div className="lg:col-span-5 p-5 sm:p-6 space-y-5 bg-slate-950/60 overflow-y-auto">
            
            {/* Template Quick Picks */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Wand2 className="w-3.5 h-3.5 text-cyan-400" />
                  Quick Inspiration Templates
                </label>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {TEMPLATE_PROMPTS.map((tpl, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleApplyTemplate(tpl)}
                    className="text-[11px] px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer flex items-center gap-1"
                  >
                    <span>{tpl.title}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Subject & Difficulty Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Target Subject</label>
                <select
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  className="w-full text-xs bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                >
                  {SUBJECT_OPTIONS.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Difficulty Tier</label>
                <select
                  value={difficulty}
                  onChange={e => setDifficulty(e.target.value)}
                  className="w-full text-xs bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                >
                  <option value="Foundational">Foundational Concept</option>
                  <option value="Standard High-Yield">Standard High-Yield</option>
                  <option value="Brutal Exam Level">Brutal Exam Level (AP / USMLE)</option>
                  <option value="God-Tier Savage">God-Tier Savage (Angry Examiner)</option>
                </select>
              </div>
            </div>

            {/* Prompt / Target Notes / Problem Text */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-indigo-400" />
                  Target Concept, Problem Stem, or Homework Excerpt
                </label>
                <span className="text-[10px] text-slate-500">Gemini will build traps around this</span>
              </div>
              <textarea
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                placeholder="e.g. Test students on the difference between competitive vs noncompetitive enzyme inhibitors with Lineweaver-Burk double reciprocal plots, or paste lecture notes..."
                rows={4}
                className="w-full text-xs sm:text-sm bg-slate-900 border border-slate-800 rounded-xl p-3 text-slate-200 placeholder-slate-600 focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none leading-relaxed transition-all"
              />
            </div>

            {/* MULTIMODAL VISION: Image Uploader */}
            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                    <ImageIcon className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-bold text-white">Multimodal Vision Upload</span>
                </div>
                <span className="text-[10px] text-cyan-300/80 font-medium">Gemini Image Analysis</span>
              </div>

              <p className="text-[11px] text-slate-400 leading-snug">
                Upload a diagram, coordinate graph, biochemical pathway, circuit schematic, or textbook screenshot. Gemini will extract data and formulate questions based on the visual.
              </p>

              {imagePreview ? (
                <div className="relative rounded-xl overflow-hidden border border-slate-700 bg-slate-950 group">
                  <img src={imagePreview} alt="Uploaded diagram" className="w-full max-h-48 object-contain p-2" />
                  <div className="absolute top-2 right-2 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="p-1.5 rounded-lg bg-rose-600/90 text-white hover:bg-rose-500 transition-colors shadow-lg cursor-pointer"
                      title="Remove image"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="p-2 bg-slate-900/90 border-t border-slate-800 text-[10px] text-cyan-300 font-mono">
                    ✓ Image attached for Gemini multimodal inspection
                  </div>
                </div>
              ) : (
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="multimodal-file-input"
                  />
                  <label
                    htmlFor="multimodal-file-input"
                    className="w-full py-3 px-4 rounded-xl border border-dashed border-slate-700 hover:border-cyan-500/60 bg-slate-950/60 hover:bg-slate-900/80 text-slate-400 hover:text-cyan-300 transition-all flex items-center justify-center gap-2 cursor-pointer text-xs font-semibold"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Upload Diagram, Chart, or Homework Image</span>
                  </label>
                </div>
              )}
            </div>

            {/* ADVANCED GEMINI CAPABILITIES GRID */}
            <div className="space-y-3 pt-1">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-purple-400" />
                Gemini Architecture Parameters
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* Thinking Level */}
                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                  <label className="block text-[11px] font-bold text-slate-300 mb-1 flex items-center gap-1">
                    <Brain className="w-3.5 h-3.5 text-purple-400" />
                    Reasoning Depth
                  </label>
                  <select
                    value={thinkingLevel}
                    onChange={e => setThinkingLevel(e.target.value as any)}
                    className="w-full text-xs bg-slate-950 border border-slate-800 text-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-purple-500"
                  >
                    <option value="HIGH">High (Maximum Reasoning)</option>
                    <option value="MEDIUM">Medium (Balanced)</option>
                    <option value="LOW">Low (Rapid Generation)</option>
                  </select>
                </div>

                {/* Question Format */}
                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                  <label className="block text-[11px] font-bold text-slate-300 mb-1 flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5 text-cyan-400" />
                    Question Format
                  </label>
                  <select
                    value={format}
                    onChange={e => setFormat(e.target.value as any)}
                    className="w-full text-xs bg-slate-950 border border-slate-800 text-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-cyan-500"
                  >
                    <option value="multiple-choice">Multiple Choice with Traps</option>
                    <option value="vignette">Scenario / Clinical Vignette</option>
                    <option value="quantitative-derivation">Quantitative Derivation</option>
                    <option value="passage-synthesis">Passage Synthesis</option>
                  </select>
                </div>
              </div>

              {/* Passage Length Selection */}
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-bold text-slate-200 block">Passage Construction</span>
                  <span className="text-[10px] text-slate-400">Generate full-length analytical texts</span>
                </div>
                <select
                  value={passageLength}
                  onChange={e => setPassageLength(e.target.value as any)}
                  className="text-xs bg-slate-950 border border-slate-800 text-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-cyan-500"
                >
                  <option value="none">No Passage (Standalone Stem)</option>
                  <option value="standard">Standard (2–4 Paragraphs)</option>
                  <option value="6-plus-paragraphs">Extended 6+ Paragraphs</option>
                </select>
              </div>

              {/* Google Search Grounding Toggle */}
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
                    <Search className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-200 block">Google Search Grounding</span>
                    <span className="text-[10px] text-slate-400">Ground facts with live web citations</span>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enableSearchGrounding}
                    onChange={e => setEnableSearchGrounding(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {/* Gemini TTS Audio Narration Toggle */}
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                      <Volume2 className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-200 block">Gemini TTS Voice Narration</span>
                      <span className="text-[10px] text-slate-400">Synthesize spoken examiner audio</span>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={generateAudio}
                      onChange={e => setGenerateAudio(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>

                {generateAudio && (
                  <div className="pt-1.5 flex items-center gap-2">
                    <span className="text-[11px] text-slate-400">Voice Persona:</span>
                    <select
                      value={voiceName}
                      onChange={e => setVoiceName(e.target.value)}
                      className="flex-1 text-xs bg-slate-950 border border-slate-800 text-slate-200 rounded-lg p-1.5"
                    >
                      {VOICE_OPTIONS.map(v => (
                        <option key={v.id} value={v.id}>{v.label}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-500/40 text-rose-300 text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Launch Button */}
            <button
              type="button"
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-slate-950 font-black text-sm rounded-xl shadow-xl flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin text-slate-950" />
                  <span>Gemini Reasoning & Formulating Question...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 text-slate-950 fill-current" />
                  <span>Create Question with Full Gemini AI</span>
                </>
              )}
            </button>
          </div>

          {/* RIGHT COLUMN: Interactive Sandbox & Question Inspection (7 cols) */}
          <div className="lg:col-span-7 p-5 sm:p-6 space-y-5 overflow-y-auto bg-slate-900/40">
            {currentQ ? (
              <div className="space-y-5 animate-fadeIn">
                
                {/* Meta Header */}
                <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                      {currentQ.topic}
                    </span>
                    <span className="px-2 py-0.5 rounded-lg text-[11px] font-mono bg-slate-800 text-slate-400 border border-slate-700">
                      {currentQ.difficulty || difficulty}
                    </span>
                  </div>

                  {/* Audio Narration Player if available */}
                  {currentQ.audioData && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleToggleAudio}
                        className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm"
                      >
                        {isPlayingAudio ? (
                          <>
                            <Pause className="w-3.5 h-3.5 fill-current" />
                            <span>Pause Audio ({currentQ.voiceName || voiceName})</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-3.5 h-3.5 fill-current" />
                            <span>Play Spoken Voice ({currentQ.voiceName || voiceName})</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {/* Multimodal Visual Context Callout */}
                {currentQ.visualAnalysis && (
                  <div className="p-3.5 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-cyan-200 text-xs flex items-start gap-2.5">
                    <ImageIcon className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block text-cyan-300 mb-0.5">Gemini Visual Extraction Insight</span>
                      <p className="text-slate-300 leading-relaxed text-[11px]">{currentQ.visualAnalysis}</p>
                    </div>
                  </div>
                )}

                {/* Grounding Search Citations if used */}
                {currentQ.searchSources && currentQ.searchSources.length > 0 && (
                  <div className="p-3 rounded-xl bg-blue-950/30 border border-blue-500/30 text-xs space-y-1">
                    <span className="font-bold text-blue-300 flex items-center gap-1.5 text-[11px]">
                      <Search className="w-3 h-3 text-blue-400" />
                      Google Search Grounding Citations:
                    </span>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {currentQ.searchSources.map((source, sIdx) => (
                        <a
                          key={sIdx}
                          href={source.url}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2 py-0.5 rounded-lg bg-blue-900/50 hover:bg-blue-800 text-blue-200 text-[10px] flex items-center gap-1 border border-blue-700/50 transition-colors"
                        >
                          <span className="truncate max-w-[200px]">{source.title}</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Reading Passage if attached */}
                {currentQ.passage && (
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-2">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                      <span className="font-bold text-slate-300 flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
                        {currentQ.passageTitle || 'Textual Reading Passage'}
                      </span>
                      <span className="text-[10px] text-slate-500">Analysis Required</span>
                    </div>
                    <div className="text-slate-300 leading-relaxed max-h-56 overflow-y-auto whitespace-pre-wrap pr-2 text-[11px] sm:text-xs">
                      {currentQ.passage}
                    </div>
                  </div>
                )}

                {/* Question Stem */}
                <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800">
                  <h3 className="text-sm sm:text-base font-bold text-white leading-relaxed">
                    {currentQ.question}
                  </h3>
                </div>

                {/* Interactive Options Sandbox */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Test your understanding in this sandbox:</span>
                    {sandboxHasAnswered && (
                      <button
                        type="button"
                        onClick={handleResetSandbox}
                        className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 text-[11px] cursor-pointer"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Reset Choices</span>
                      </button>
                    )}
                  </div>

                  {currentQ.options.map((opt, optIdx) => {
                    const isSelected = sandboxSelectedOption === optIdx;
                    const isCorrect = optIdx === currentQ.correctIndex;

                    let btnStyles = 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-300 hover:bg-slate-900';
                    if (sandboxHasAnswered) {
                      if (isCorrect) {
                        btnStyles = 'bg-emerald-950/70 border-emerald-500 text-emerald-100 font-medium ring-1 ring-emerald-500/50';
                      } else if (isSelected) {
                        btnStyles = 'bg-rose-950/70 border-rose-500 text-rose-200 ring-1 ring-rose-500/50';
                      } else {
                        btnStyles = 'bg-slate-950/50 border-slate-900 text-slate-500 opacity-60';
                      }
                    }

                    return (
                      <button
                        key={optIdx}
                        type="button"
                        onClick={() => handleSelectSandboxOption(optIdx)}
                        disabled={sandboxHasAnswered}
                        className={`w-full p-3.5 rounded-xl border text-left text-xs sm:text-sm transition-all cursor-pointer flex items-start gap-3 ${btnStyles}`}
                      >
                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 ${
                          sandboxHasAnswered
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

                {/* WRONG ANSWER DUAL-BREAKDOWN CARD */}
                {sandboxHasAnswered && sandboxSelectedOption !== null && (
                  <WrongAnswerBreakdownCard
                    explanation={getDetailedAnswerExplanation(
                      currentQ,
                      sandboxSelectedOption,
                      subject || currentQ.topic
                    )}
                  />
                )}

                {/* Thinking Process / Pedagogical Blueprint */}
                {currentQ.thinkingProcess && (
                  <div className="p-3.5 rounded-xl bg-purple-950/30 border border-purple-500/30 text-xs space-y-1">
                    <span className="font-bold text-purple-300 flex items-center gap-1.5 text-[11px]">
                      <Brain className="w-3.5 h-3.5 text-purple-400" />
                      Gemini Pedagogical Reasoning & Cognitive Gap Analysis:
                    </span>
                    <p className="text-slate-300 text-[11px] leading-relaxed">
                      {currentQ.thinkingProcess}
                    </p>
                  </div>
                )}

                {/* Action Buttons: Add to Quiz, Add to Level, Copy */}
                <div className="pt-2 flex items-center justify-between flex-wrap gap-2 border-t border-slate-800">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCopyMarkdown}
                      className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      {hasCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{hasCopied ? 'Copied Markdown' : 'Copy Question'}</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    {onAddQuestionToLevel && (
                      <button
                        type="button"
                        onClick={() => onAddQuestionToLevel(currentQ)}
                        className="px-3.5 py-2 rounded-xl bg-cyan-600/30 hover:bg-cyan-600/50 text-cyan-300 border border-cyan-500/40 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Target className="w-3.5 h-3.5" />
                        <span>Add to Mission Drill</span>
                      </button>
                    )}

                    {onAddQuestionToQuiz && (
                      <button
                        type="button"
                        onClick={() => handleAddToQuiz(currentQ)}
                        disabled={addedQuizIds.has(currentQ.id)}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer disabled:opacity-50"
                      >
                        {addedQuizIds.has(currentQ.id) ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Added to Daily Quiz</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add to Daily Quiz Drill</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>

              </div>
            ) : (
              <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center p-8 space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-600">
                  <Brain className="w-8 h-8 stroke-[1.5]" />
                </div>
                <div className="space-y-1.5 max-w-sm">
                  <h3 className="text-base font-bold text-slate-300">
                    Awaiting Gemini Generation
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Select your topic, upload an optional diagram, configure reasoning depth and web grounding, then click "Create Question with Full Gemini AI".
                  </p>
                </div>
                <div className="flex flex-wrap justify-center gap-2 pt-2">
                  <span className="px-2.5 py-1 rounded-lg text-[10px] font-mono bg-slate-950 border border-slate-800 text-cyan-400">
                    ✓ Multimodal Vision
                  </span>
                  <span className="px-2.5 py-1 rounded-lg text-[10px] font-mono bg-slate-950 border border-slate-800 text-purple-400">
                    ✓ Thinking Level
                  </span>
                  <span className="px-2.5 py-1 rounded-lg text-[10px] font-mono bg-slate-950 border border-slate-800 text-blue-400">
                    ✓ Google Search
                  </span>
                  <span className="px-2.5 py-1 rounded-lg text-[10px] font-mono bg-slate-950 border border-slate-800 text-emerald-400">
                    ✓ Gemini TTS Audio
                  </span>
                </div>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
