import React, { useState, useRef, useEffect } from 'react';
import {
  Calendar,
  Sparkles,
  AlertTriangle,
  Flame,
  CheckCircle2,
  BookOpen,
  HelpCircle,
  FileText,
  Globe,
  GraduationCap,
  Layers,
  Upload,
  Image as ImageIcon,
  X,
  Plus,
  ArrowRight,
  ArrowUp,
  Pencil,
  Send,
  Bot,
  User,
  MessageSquare,
  Check,
  RotateCcw,
  Copy,
  Volume2,
  VolumeX,
  Mic,
  MicOff
} from 'lucide-react';
import { ExamProfile, ExamPlan } from '../types';
import {
  playVivaGavelSound,
  playStreakFlameSound,
  playIncorrectSound,
  playCorrectSound,
  speakExaminerVoice,
  speakSideTalkThenQuestion,
  stopSpeaking
} from '../utils/audio';
import { ActiveStudyScheduler } from './ActiveStudyScheduler';
import { AntiMotivationProtocolCard } from './AntiMotivationProtocolCard';
import { NeurologicalSoundscapePlayer } from './NeurologicalSoundscapePlayer';
import { TypewriterText } from './TypewriterText';
import { RoadmapLevelsBar } from './RoadmapLevelsBar';
import { RoadmapLevelsButton } from './RoadmapLevelsButton';
import { HandDrawnSmileyIcon } from './HandDrawnSmileyIcon';
import { generateLocalExamPlan } from '../utils/localPlanGenerator';

interface ExamPlanBuilderProps {
  currentPlan?: ExamPlan | null;
  onPlanGenerated: (plan: ExamPlan) => void;
  onDismiss?: () => void;
  onStartStudySession?: () => void;
  isInitialOnboarding?: boolean;
  onResetProgress?: () => void;
  completedMilestones?: number[];
  onToggleCompleteMilestone?: (index: number) => void;
  activeMilestoneIndex?: number;
  onSelectMilestoneIndex?: (index: number) => void;
  onOpenLevelPractice?: (index: number) => void;
  onRecordXp?: (amount: number) => void;
}

export const CORE_INTERVIEW_COURSES = [
  { id: 'english', name: 'English', icon: '📚', tag: 'Literature & Rhetoric', defaultTopics: ['English', 'Rhetorical Devices & Textual Inferences', 'Author Tone, Purpose & Rhetorical Perspective', 'Complex Reading Passage Analysis & Evidence Pairing'] },
  { id: 'calculus', name: 'Calculus', icon: '📐', tag: 'Limits, Derivatives & FTC', defaultTopics: ['Calculus', 'Limits, Continuity & Squeeze Theorem', 'Derivatives, Product Rule & Chain Rule', 'Fundamental Theorem of Calculus (FTC)'] },
  { id: 'algebra1', name: 'Algebra 1', icon: '🔢', tag: 'Linear, Systems & Quadratics', defaultTopics: ['Algebra 1', 'Linear Equations & Multi-Step Inequalities', 'Systems of Linear Equations (Elimination & Substitution)', 'Quadratic Formula & Vertex Form of Parabolas'] },
  { id: 'algebra2', name: 'Algebra 2', icon: '📈', tag: 'Polynomials & Logarithms', defaultTopics: ['Algebra 2', 'Polynomial Functions, Roots & End Behavior', 'Complex Numbers & Fundamental Theorem of Algebra', 'Exponential Growth & Logarithmic Equations'] },
  { id: 'geometry', name: 'Geometry', icon: '📏', tag: 'Proofs, Circles & Triangles', defaultTopics: ['Geometry', 'Triangle Congruence & Similarity Proofs (SAS, SSS, AA)', 'Pythagorean Theorem & Special Right Triangles (30-60-90, 45-45-90)', 'Circle Theorems (Chords, Tangents & Inscribed Angles)'] },
];

const COMMON_SUBJECT_SUGGESTIONS = [
  'English',
  'Calculus',
  'Algebra 1',
  'Algebra 2',
  'Geometry',
  'Biology',
  'Chemistry',
  'Physics',
  'Human Physiology',
  'World History',
];

export function getRecommendedTopicsForSubject(subjectName: string): string[] {
  const s = (subjectName || '').toLowerCase();
  if (s.includes('english') || s.includes('literature') || s.includes('reading') || s.includes('writing') || s.includes('language')) {
    return [
      'English',
      'Rhetorical Devices & Textual Inferences',
      'Author Tone, Purpose & Rhetorical Perspective',
      'Theme, Character Arc & Literary Synthesis',
      'Complex Reading Passage Analysis & Evidence Pairing',
      'Grammar, Punctuation & Sentence Mechanics',
      'Vocabulary in Context & Nuance Analysis',
      'English Essay Writing & Thesis Defense',
      'Poetry Analysis & Figurative Language',
    ];
  }
  if (s.includes('calculus')) {
    return [
      'Calculus',
      'Limits, Continuity & Squeeze Theorem',
      'Derivatives, Product Rule & Chain Rule',
      'Related Rates & Geometric Optimization',
      'Definite Integrals & Riemann Sums',
      'Fundamental Theorem of Calculus (FTC)',
      'Differential Equations & Slope Fields',
      'U-Substitution & Integration by Parts',
    ];
  }
  if (s.includes('algebra 1') || s.includes('algebra1') || s.includes('elementary algebra')) {
    return [
      'Algebra 1',
      'Linear Equations & Multi-Step Inequalities',
      'Systems of Linear Equations (Elimination & Substitution)',
      'Slope-Intercept Form & Graphing Linear Functions',
      'Factoring Trinomials & Difference of Squares',
      'Quadratic Formula & Vertex Form of Parabolas',
      'Exponent Properties, Radicals & Scientific Notation',
      'Linear Word Problems & Modeling',
    ];
  }
  if (s.includes('algebra 2') || s.includes('algebra2') || s.includes('intermediate algebra')) {
    return [
      'Algebra 2',
      'Polynomial Functions, Roots & End Behavior',
      'Complex Numbers & Fundamental Theorem of Algebra',
      'Rational Expressions & Vertical/Horizontal Asymptotes',
      'Exponential Growth & Logarithmic Equations',
      'Function Transformations & Inverse Functions',
      'Arithmetic & Geometric Sequences and Series',
      'Conic Sections & Systems',
    ];
  }
  if (s.includes('geometry')) {
    return [
      'Geometry',
      'Triangle Congruence & Similarity Proofs (SAS, SSS, AA)',
      'Pythagorean Theorem & Special Right Triangles (30-60-90, 45-45-90)',
      'Circle Theorems (Chords, Tangents & Inscribed Angles)',
      'Area, Surface Area & 3D Composite Volume',
      'Coordinate Geometry Proofs & Distance Formula',
      'Trigonometric Ratios (Sine, Cosine, Tangent / SOH-CAH-TOA)',
      'Parallel Lines Cut by a Transversal',
    ];
  }
  if (s.includes('history') || s.includes('civics') || s.includes('government') || s.includes('social studies')) {
    return [
      'Primary Source Document Analysis',
      'Causes, Catalysts & Outcomes of Major Conflicts',
      'Constitutional Principles & Separation of Powers',
      'Industrialization, Market Revolutions & Trade',
      'Civil Rights Movements & Societal Reforms',
      'Historiographical Bias & Perspective Evaluation',
    ];
  }
  if (s.includes('chemistry')) {
    return [
      'Atomic Structure & Periodic Trends',
      'Chemical Bonding & Molecular Geometry (VSEPR)',
      'Stoichiometry & Limiting Reactants',
      'Thermodynamics, Enthalpy & Hess\'s Law',
      'Chemical Equilibrium & Le Chatelier\'s Principle',
      'Acids, Bases, pH & Buffer Solutions',
    ];
  }
  if (s.includes('physics')) {
    return [
      'Kinematics, Velocity & Projectile Motion',
      'Newton\'s Laws of Motion & Free Body Diagrams',
      'Work, Kinetic Energy & Conservation of Momentum',
      'Rotational Dynamics, Torque & Angular Momentum',
      'Electric Circuits, Resistance & Ohm\'s Law',
      'Simple Harmonic Motion, Wave Interference & Optics',
    ];
  }
  if (s.includes('biology') || s.includes('physiology') || s.includes('anatomy') || s.includes('life science')) {
    return [
      'Cell Structure, Organelles & Membrane Transport',
      'Enzyme Kinetics, Glycolysis & Cellular Respiration',
      'DNA Replication, Transcription & Protein Translation',
      'Mendelian Genetics, Punnett Squares & Pedigrees',
      'Action Potentials & Synaptic Neurotransmission',
      'Homeostasis, Circulatory & Renal Regulation',
    ];
  }
  // Balanced Academic Default Topics
  return [
    'Core Principles & Foundational Theorems',
    'Critical Analysis & Applied Problem Solving',
    'Key Formulas & Methodological Proofs',
    'Examiner Traps & Conceptual Distractors',
    'Speed Execution & Timed Drill Mastery',
  ];
}

const QUESTION_TYPE_OPTIONS = [
  { id: 'Multiple Choice Questions', label: 'Multiple Choice (MCQs)', desc: 'Pick the single correct answer from options' },
  { id: 'Reading Passage', label: 'Reading Passage (Standard 2–4 Paragraphs)', desc: 'Dense literary excerpts, mathematical modeling problems, or scientific assays with complex multi-clause answer choices' },
  { id: 'Long Reading Passage (6+ Paragraphs)', label: 'Long Reading Passage (6+ Paragraphs)', desc: 'Full-length 6+ paragraph extensive texts requiring cross-paragraph analytical synthesis and subtle distractor elimination' },
  { id: 'Short Answer & Definitions', label: 'Short Answer & Explanations', desc: '1 to 5 sentence written mechanisms' },
  { id: 'Long Essays & Diagram Problems', label: 'Long Essays & Diagrams', desc: 'Detailed multi-step written responses' },
  { id: 'Oral Speaking Exam & Questions', label: 'Oral Speaking Test / Interview', desc: 'Explaining concepts out loud to the examiner' },
];

const GRADE_LEVELS = [
  'Grade 5 (Elementary / Primary)',
  'Grade 6 (Middle School)',
  'Grade 7 (Middle School)',
  'Grade 8 (Middle School)',
  'Grade 9-10 (High School / GCSE / Pre-IB)',
  'Grade 11-12 (A-Levels / AP / IB Diploma)',
  'College / University Undergraduate (BSc / BA)',
  'Medical School / Pre-Med / USMLE',
  'Graduate / Postgraduate',
];

const COUNTRIES = [
  'United Kingdom (AQA / Edexcel / OCR / University)',
  'United States (State Standards / AP / College Board / USMLE)',
  'Canada (Provincial Curriculum / University)',
  'Australia (ATAR / VCE / HSC / QCE / University)',
  'New Zealand (NCEA / University)',
  'India (CBSE / ICSE / State Boards / NEET / JEE)',
  'Ireland (Leaving Certificate / University)',
  'Singapore (O-Levels / A-Levels / MOE / University)',
  'Malaysia (SPM / STPM / Matriculation)',
  'Indonesia (Kurikulum Merdeka / UTBK)',
  'Pakistan (Federal Board / FBISE / Matric / FSc / MDCAT)',
  'Bangladesh (HSC / SSC / University Admissions)',
  'Nigeria (WAEC / NECO / JAMB / UTME)',
  'Kenya (KCSE / KNEC / University)',
  'Ghana (WASSCE / GES)',
  'Egypt (Thanaweya Amma / University)',
  'South Africa (CAPS / NSC / Matric)',
  'Philippines (DepEd / K-12 / UPCAT)',
  'UAE / Saudi Arabia / Middle East (CBSE / British / American)',
  'Germany (Abitur / Gymnasium / Uni)',
  'France (Baccalauréat / Université)',
  'Spain (Bachillerato / Selectividad / EVAU)',
  'Italy (Maturità / Università)',
  'Netherlands (VWO / HAVO / Universiteit)',
  'Switzerland (Matura / Maturité / Gymnasiale Maturität)',
  'Sweden (Gymnasieskola / Högskoleprovet)',
  'Norway (Videregående / Samordna opptak)',
  'Denmark (STX / Gymnasiet)',
  'Finland (Ylioppilastutkinto / Lukio)',
  'Poland (Matura / Uniwersytet)',
  'Turkey (YKS / TYT-AYT / Lise)',
  'Vietnam (THPT Quốc Gia / Đại học)',
  'Thailand (TCAS / A-Level / TGAT-TPAT)',
  'Japan (Common Test / Center Exam / University)',
  'South Korea (CSAT / Suneung)',
  'China / Hong Kong (Gaokao / HKDSE)',
  'Brazil (ENEM / Vestibular)',
  'Mexico (UNAM / Ceneval / Bachillerato)',
  'Argentina (Secundario / CBC / UBA)',
  'Colombia (Saber 11 / ICFES)',
  'Chile (PAES / Educación Media)',
  'Other (Type Your Country)',
];

export const ExamPlanBuilder: React.FC<ExamPlanBuilderProps> = ({
  currentPlan,
  onPlanGenerated,
  onDismiss,
  onStartStudySession,
  isInitialOnboarding = false,
  onResetProgress,
  completedMilestones = [],
  onToggleCompleteMilestone,
  activeMilestoneIndex = 0,
  onSelectMilestoneIndex,
  onOpenLevelPractice,
  onRecordXp,
}) => {
  const [isEditing, setIsEditing] = useState(!currentPlan);
  const [chatStep, setChatStep] = useState<number>(1);
  const [chatInput, setChatInput] = useState<string>('');
  const [showResetModal, setShowResetModal] = useState<boolean>(false);
  const [selectedMilestoneIdx, setSelectedMilestoneIdx] = useState<number>(activeMilestoneIndex);
  const roadmapSectionRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Form states: type the subject freely
  const [subject, setSubject] = useState(currentPlan?.profile.subject || 'Biology');
  const [selectedTopics, setSelectedTopics] = useState<string[]>(
    currentPlan?.profile.topics || ['Cell Structure & Energy', 'Photosynthesis & Respiration', 'Genetics & DNA']
  );
  const [customTopicInput, setCustomTopicInput] = useState('');

  const [questionTypes, setQuestionTypes] = useState<string[]>(
    currentPlan?.profile.questionTypes || ['Multiple Choice Questions', 'Short Answer & Definitions', 'Oral Speaking Exam & Questions']
  );

  const defaultExamDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 28);
    return d.toISOString().split('T')[0];
  };

  const [examDate, setExamDate] = useState(currentPlan?.profile.examDate || defaultExamDate());
  const [gradeLevel, setGradeLevel] = useState(currentPlan?.profile.gradeLevel || 'Grade 9-10 (High School / GCSE / Pre-IB)');
  const [country, setCountry] = useState(currentPlan?.profile.country || 'United Kingdom (AQA / Edexcel / OCR / University)');
  const [customCountry, setCustomCountry] = useState('');
  const [pastPaperContext, setPastPaperContext] = useState(currentPlan?.profile.pastPaperContext || '');

  // Past paper image uploads
  const [pastPaperImages, setPastPaperImages] = useState<string[]>(currentPlan?.profile.pastPaperImages || []);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [passageLengthPreference, setPassageLengthPreference] = useState<'standard' | 'long-6-plus'>(
    currentPlan?.profile.passageLengthPreference ||
    (currentPlan?.profile.questionTypes?.some(qt => qt.toLowerCase().includes('6+')) ? 'long-6-plus' : 'standard')
  );

  // Generation loading states
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);

  // ChatGPT style candidate typing bubble & AI thinking states
  const [typingStep, setTypingStep] = useState<number | null>(null);
  const [isAiThinking, setIsAiThinking] = useState<boolean>(false);

  // Auto-scroll chat feed as conversation progresses
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatStep, typingStep, isAiThinking, selectedTopics.length, isGenerating]);

  // ChatGPT style voice dictation and copy feedback
  const [copiedStep, setCopiedStep] = useState<number | null>(null);
  const [speakingStep, setSpeakingStep] = useState<number | null>(null);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRec) {
        const recog = new SpeechRec();
        recog.continuous = false;
        recog.interimResults = false;
        recog.lang = 'en-US';

        recog.onresult = (event: any) => {
          const transcript = event.results[0]?.[0]?.transcript || '';
          if (transcript) {
            setChatInput(prev => prev ? `${prev} ${transcript}` : transcript);
          }
          setIsListening(false);
        };

        recog.onerror = () => setIsListening(false);
        recog.onend = () => setIsListening(false);
        recognitionRef.current = recog;
      }
    }
    return () => {
      stopSpeaking();
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch (e) {}
      }
    };
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        setIsListening(false);
      }
    }
  };

  // Tracks whether mentor side talk has completed so interview questions are asked
  const [sideTalkDone, setSideTalkDone] = useState<{ [step: number]: boolean }>({
    1: false,
    2: false,
    3: false,
    4: false,
  });

  const isStepQuestionReady = (step: number) => chatStep > step || !!sideTalkDone[step];

  const handleVoicePlaySequence = (sideTalkText: string, questionText: string, stepNum: number) => {
    if (speakingStep === stepNum) {
      stopSpeaking();
      setSpeakingStep(null);
    } else {
      setSpeakingStep(stepNum);
      speakSideTalkThenQuestion(
        sideTalkText,
        questionText,
        () => {
          // When side talk finishes, immediately reveal and ask the interview question!
          setSideTalkDone(prev => ({ ...prev, [stepNum]: true }));
        },
        () => {
          setSpeakingStep(null);
        }
      );
    }
  };

  const handleChooseSubject = (selectedSubj: string, defaultTops?: string[]) => {
    setSubject(selectedSubj);
    if (defaultTops && defaultTops.length > 0) {
      setSelectedTopics(defaultTops);
    } else {
      const recs = getRecommendedTopicsForSubject(selectedSubj);
      setSelectedTopics(recs.slice(0, 3));
    }
    setTypingStep(1);
    playStreakFlameSound();

    setTimeout(() => {
      setTypingStep(null);
      setIsAiThinking(true);
      setTimeout(() => {
        setIsAiThinking(false);
        setChatStep(2);
        playCorrectSound();
      }, 550);
    }, 850);
  };

  const handleConfirmTopics = () => {
    if (selectedTopics.length === 0) return;
    setTypingStep(2);
    playStreakFlameSound();

    setTimeout(() => {
      setTypingStep(null);
      setIsAiThinking(true);
      setTimeout(() => {
        setIsAiThinking(false);
        setChatStep(3);
        playCorrectSound();
      }, 550);
    }, 850);
  };

  const handleConfirmFormat = () => {
    setTypingStep(3);
    playStreakFlameSound();

    setTimeout(() => {
      setTypingStep(null);
      setIsAiThinking(true);
      setTimeout(() => {
        setIsAiThinking(false);
        setChatStep(4);
        playCorrectSound();
      }, 550);
    }, 850);
  };

  const handleConfirmDateAndGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    setTypingStep(4);
    playStreakFlameSound();

    setTimeout(() => {
      setTypingStep(null);
      handleBuildWarPlan(e as any);
    }, 950);
  };

  const handleSendChatPrompt = () => {
    const trimmed = chatInput.trim();
    if (!trimmed) {
      if (chatStep === 4 && selectedTopics.length > 0) {
        handleConfirmDateAndGenerate({ preventDefault: () => {} } as any);
      }
      return;
    }

    if (chatStep === 1) {
      handleChooseSubject(trimmed);
      setChatInput('');
    } else if (chatStep === 2) {
      if (!selectedTopics.includes(trimmed)) {
        setSelectedTopics(prev => [...prev, trimmed]);
        playStreakFlameSound();
      }
      setChatInput('');
    } else if (chatStep === 3) {
      setPastPaperContext(prev => prev ? `${prev}\n${trimmed}` : trimmed);
      setChatInput('');
      playStreakFlameSound();
    } else if (chatStep === 4) {
      handleConfirmDateAndGenerate({ preventDefault: () => {} } as any);
    }
  };

  // If plan is cleared (e.g. on reset), immediately enter AI intake interview mode at Step 1
  useEffect(() => {
    if (!currentPlan) {
      setIsEditing(true);
      setChatStep(1);
      setChatInput('');
      setSubject('Biology');
      setSelectedTopics([]);
      setCustomTopicInput('');
      setQuestionTypes(['Multiple Choice Questions', 'Short Answer & Definitions']);
      setPastPaperImages([]);
      setPastPaperContext('');
      setPassageLengthPreference('standard');
    }
  }, [currentPlan]);

  const calculateDaysRemaining = () => {
    if (!examDate) return 28;
    const target = new Date(examDate).getTime();
    const now = new Date().getTime();
    return Math.max(1, Math.ceil((target - now) / (1000 * 60 * 60 * 24)));
  };

  const daysRemaining = calculateDaysRemaining();

  const handleAddCustomTopic = (e: React.KeyboardEvent | React.MouseEvent) => {
    if ('key' in e && e.key !== 'Enter') return;
    e.preventDefault();
    const trimmed = customTopicInput.trim();
    if (trimmed && !selectedTopics.includes(trimmed)) {
      setSelectedTopics(prev => [...prev, trimmed]);
      setCustomTopicInput('');
    }
  };

  const handleToggleTopic = (top: string) => {
    setSelectedTopics(prev =>
      prev.includes(top) ? prev.filter(t => t !== top) : [...prev, top]
    );
  };

  const handleToggleQuestionType = (typeId: string) => {
    setQuestionTypes(prev => {
      const isSelected = prev.includes(typeId);
      const next = isSelected
        ? prev.length > 1
          ? prev.filter(t => t !== typeId)
          : prev
        : [...prev, typeId];

      if (typeId === 'Long Reading Passage (6+ Paragraphs)') {
        if (!isSelected) {
          setPassageLengthPreference('long-6-plus');
        } else {
          setPassageLengthPreference('standard');
        }
      }
      return next;
    });
  };

  // Image upload handler
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach(file => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = event => {
        const base64 = event.target?.result as string;
        if (base64) {
          setPastPaperImages(prev => [...prev.slice(0, 4), base64]); // max 5 images
        }
      };
      reader.readAsDataURL(file);
    });

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = (index: number) => {
    setPastPaperImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleBuildWarPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || selectedTopics.length === 0 || questionTypes.length === 0 || isGenerating) return;

    playVivaGavelSound();
    setIsGenerating(true);
    setLoadingStep(0);

    const stepInterval = setInterval(() => {
      setLoadingStep(s => (s + 1) % 4);
    }, 1500);

    const finalCountry = country === 'Other (Type Your Country)'
      ? (customCountry.trim() || 'International Board')
      : country;

    const profile: ExamProfile = {
      subject: subject.trim(),
      topics: selectedTopics,
      questionTypes,
      examDate,
      gradeLevel,
      country: finalCountry,
      pastPaperContext: pastPaperContext.trim() || undefined,
      pastPaperImages: pastPaperImages.length > 0 ? pastPaperImages : undefined,
      passageLengthPreference,
    };

    try {
      // Step simulation for realistic, smooth analytical feedback (800ms)
      await new Promise(resolve => setTimeout(resolve, 800));

      // Generate active study plan 100% locally with zero connection required
      const plan: ExamPlan = generateLocalExamPlan(profile);

      clearInterval(stepInterval);
      playStreakFlameSound();
      onPlanGenerated(plan);
      setIsEditing(false);
    } catch (err) {
      console.error('Error generating local active study plan:', err);
      clearInterval(stepInterval);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleChatSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = chatInput.trim();

    if (chatStep === 1) {
      if (trimmed) {
        setSubject(trimmed);
        const recs = getRecommendedTopicsForSubject(trimmed);
        setSelectedTopics(recs.slice(0, 3));
        setChatInput('');
        setChatStep(2);
        playCorrectSound();
      } else if (subject.trim()) {
        setChatStep(2);
        playCorrectSound();
      }
    } else if (chatStep === 2) {
      if (trimmed) {
        if (!selectedTopics.includes(trimmed)) {
          setSelectedTopics(prev => [...prev, trimmed]);
        }
        setChatInput('');
        playCorrectSound();
      } else if (selectedTopics.length > 0) {
        setChatStep(3);
        playCorrectSound();
      }
    } else if (chatStep === 3) {
      setChatStep(4);
      playCorrectSound();
    } else if (chatStep === 4) {
      handleBuildWarPlan(e as any);
    }
  };

  const loadingQuotes = [
    'Reviewing your subject syllabus and topics...',
    'Checking common student mistakes and exam traps...',
    'Analyzing past paper question styles...',
    'Creating your daily study countdown plan...',
  ];

  // ACTIVE WAR PLAN VIEW (when plan already exists and not editing)
  if (currentPlan && !isEditing) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8 animate-fadeIn">
        {/* Post-Interview AI Study Session Banner */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500/20 via-slate-900 to-rose-500/20 border-2 border-amber-500/40 p-6 md:p-7 shadow-2xl space-y-4 animate-fadeIn">
          <div className="space-y-2 max-w-2xl text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 fill-amber-400" />
              <span>Interview Complete · Recommended Next Step</span>
            </div>
            <h2 className="text-xl md:text-2xl font-bold font-display text-white">
              Ready to Study? Let the AI Run Your Study Session
            </h2>
            <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
              Click below to start an interactive study session with a timer you can set. The AI will automatically generate targeted flashcards, exam practice questions, and alert you when to take a brain break.
            </p>
          </div>

          {/* Action button on the left side */}
          {onStartStudySession && (
            <div className="flex items-center justify-start pt-1">
              <button
                onClick={onStartStudySession}
                className="w-full sm:w-auto px-7 py-3.5 bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-slate-950 font-extrabold text-sm rounded-xl shadow-xl flex items-center justify-center gap-2.5 transition-all transform hover:scale-[1.02] cursor-pointer"
              >
                <Sparkles className="w-4 h-4 fill-slate-950" />
                <span>Start AI Study Session (With Timer)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Banner: Days remaining and quick edit */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-stone-950 via-slate-900 to-rose-950/40 border border-slate-800 p-6 md:p-8 shadow-xl space-y-5">
          <div className="text-left space-y-2">
            <div className="flex items-center gap-2 text-xs text-rose-400 font-semibold tracking-wider uppercase">
              <span>The Angry Examiner Study Plan</span>
              <span aria-hidden="true">·</span>
              <span>{currentPlan.profile.gradeLevel}</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold font-display text-white tracking-tight">
              {currentPlan.daysRemaining} Days Until {currentPlan.profile.subject} Exam
            </h1>
            <p className="text-slate-400 text-sm max-w-xl">
              Exam Date: <strong className="text-slate-200">{currentPlan.profile.examDate}</strong> ({currentPlan.profile.country}). Daily goal: <span className="font-mono-numbers text-amber-400 font-bold">{currentPlan.dailyStudyTargetMinutes} minutes/day</span> of active practice.
            </p>
          </div>

          {/* Action Buttons on the Left Side */}
          <div className="flex flex-wrap items-center justify-start gap-3 pt-1">
            {/* The AI Roadmap Levels Button */}
            {currentPlan.milestones && currentPlan.milestones.length > 0 && (
              <RoadmapLevelsButton
                milestones={currentPlan.milestones}
                completedLevels={completedMilestones}
                activeLevelIndex={selectedMilestoneIdx}
                onSelectLevel={(idx) => {
                  setSelectedMilestoneIdx(idx);
                  onSelectMilestoneIndex?.(idx);
                  roadmapSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
                }}
                onToggleCompleteLevel={onToggleCompleteMilestone}
                onStartStudyForLevel={() => onStartStudySession?.()}
                onViewFullRoadmap={() => roadmapSectionRef.current?.scrollIntoView({ behavior: 'smooth' })}
                onOpenLevelPractice={onOpenLevelPractice}
              />
            )}

            {onStartStudySession && (
              <button
                onClick={onStartStudySession}
                className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-slate-950 font-bold text-xs rounded-xl shadow-lg flex items-center gap-2 cursor-pointer transition-all"
              >
                <Sparkles className="w-4 h-4 fill-slate-950" />
                <span>Start AI Study Session (With Timer)</span>
              </button>
            )}

            <button
              onClick={() => {
                setIsEditing(true);
                setChatStep(1);
              }}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
            >
              Change Exam Date or Topics (AI Interview)
            </button>

            {onResetProgress && (
              <button
                type="button"
                onClick={() => setShowResetModal(true)}
                className="px-4 py-2 bg-rose-950/60 hover:bg-rose-900/60 border border-rose-600/40 text-rose-300 text-xs font-semibold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
                title="Restart student's entire progress on the app"
              >
                <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
                <span>Restart Progress</span>
              </button>
            )}

            {onDismiss && (
              <button
                onClick={onDismiss}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer shadow-sm"
              >
                Start Studying Now →
              </button>
            )}
          </div>
        </div>

        {/* The Examiner's Reality Check Summary */}
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-rose-500/20 space-y-3 shadow-lg">
          <div className="flex items-center gap-2 text-xs font-bold text-rose-400 uppercase tracking-wider">
            <Flame className="w-4 h-4 text-rose-500" /> The Examiner's Honest Assessment
          </div>
          <p className="text-sm md:text-base text-slate-200 italic font-serif leading-relaxed">
            "{currentPlan.examinerRoastSummary}"
          </p>
        </div>

        {/* Attached past paper images note */}
        {currentPlan.profile.pastPaperImages && currentPlan.profile.pastPaperImages.length > 0 && (
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
            <div className="text-xs font-bold text-slate-300 flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-amber-400" /> Attached Past Paper Photos ({currentPlan.profile.pastPaperImages.length})
            </div>
            <div className="flex gap-2 overflow-x-auto py-1">
              {currentPlan.profile.pastPaperImages.map((img, i) => (
                <img
                  key={i}
                  src={img}
                  alt={`Past paper ${i + 1}`}
                  className="w-20 h-20 object-cover rounded-lg border border-slate-700"
                />
              ))}
            </div>
          </div>
        )}

        {/* High-Yield Focal Points */}
        <div className="space-y-3">
          <h2 className="text-base font-bold text-white font-display flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            Key Concepts You Must Master
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {currentPlan.highYieldFocalPoints.map((point, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs md:text-sm text-slate-300 flex items-start gap-2.5"
              >
                <span className="text-amber-400 font-mono-numbers font-bold shrink-0">0{idx + 1}.</span>
                <span className="leading-relaxed">{point}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 3-Phase Milestone Roadmap / Step-by-Step Study Levels */}
        <div ref={roadmapSectionRef} className="space-y-4">
          <RoadmapLevelsBar
            milestones={currentPlan.milestones}
            completedLevels={completedMilestones}
            activeLevelIndex={selectedMilestoneIdx}
            onSelectLevel={idx => {
              setSelectedMilestoneIdx(idx);
              onSelectMilestoneIndex?.(idx);
            }}
            onToggleCompleteLevel={idx => {
              onToggleCompleteMilestone?.(idx);
            }}
            onStartStudyForLevel={() => {
              onStartStudySession?.();
            }}
            onOpenLevelPractice={onOpenLevelPractice}
          />
        </div>

        {/* 4. Active Study Schedule Timeline (Phased Recall Planner) */}
        <ActiveStudyScheduler
          defaultHours={Math.max(1, Math.min(4, Math.round(currentPlan.dailyStudyTargetMinutes / 30) / 2))}
          defaultSubject={
            currentPlan.profile.subject.toLowerCase().includes('read') || currentPlan.profile.subject.toLowerCase().includes('writ') || currentPlan.profile.subject.toLowerCase().includes('hist') || currentPlan.profile.subject.toLowerCase().includes('eng')
              ? 'Reading/Writing'
              : 'Math/Science'
          }
          dailyTargetMinutes={currentPlan.dailyStudyTargetMinutes}
          onRecordXp={onRecordXp}
          onStartSession={() => onStartStudySession?.()}
        />

        {/* 5. Part 1: The Anti-Motivation Protocol Toolbox */}
        <AntiMotivationProtocolCard
          topic={currentPlan.profile.subject}
          onFiveMinuteSuccess={() => onStartStudySession?.()}
        />

        {/* 6. Part 2: The Neurological Soundscape Engine */}
        <NeurologicalSoundscapePlayer />

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
          {onStartStudySession && (
            <button
              onClick={onStartStudySession}
              className="px-8 py-3.5 bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-slate-950 font-bold text-sm rounded-xl transition-all shadow-xl cursor-pointer flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 fill-slate-950" />
              <span>Launch AI-Run Study Session (With Timer & Break Alerts)</span>
            </button>
          )}
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-semibold text-xs rounded-xl transition-all cursor-pointer"
            >
              Browse Syllabus Notes →
            </button>
          )}
        </div>
      </div>
    );
  }

  // INTAKE FORM
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="text-left space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold uppercase tracking-wider">
          <Flame className="w-3.5 h-3.5 text-rose-500" /> Inspired by angryexaminer.com/app
        </div>
        <h1 className="text-3xl md:text-4xl font-bold font-display text-white tracking-tight">
          Create Your Exam Preparation Plan
        </h1>
        <p className="text-slate-400 text-sm max-w-xl leading-relaxed">
          Type the subject and topics you find tough. We will build a daily practice schedule to prepare you for your test day.
        </p>

        {/* ChatGPT Style Mode Pill */}
        <div className="flex items-center justify-start gap-2 pt-1">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-xs font-semibold shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-white font-bold">1-on-1 AI Intake Interview</span>
            <span className="text-slate-500">·</span>
            <span className="text-emerald-400 font-mono text-[11px]">ChatGPT Style</span>
          </div>
        </div>
      </div>

      {/* AI INTAKE INTERVIEW CHAT (INTERVIEW ONLY) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-8 space-y-6 shadow-2xl">
          {/* Header row in interview card */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border-2 border-amber-400/40 flex items-center justify-center text-amber-400 shadow-md">
                <HandDrawnSmileyIcon className="w-6 h-6 text-amber-400" mood="happy" />
              </div>
              <div>
                <span className="font-bold text-white font-display text-sm sm:text-base">AI Academic Mentor</span>
                <p className="text-[11px] text-slate-400">Interactive 1-on-1 interview & battle plan setup</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {onResetProgress && (
                <button
                  type="button"
                  onClick={() => setShowResetModal(true)}
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 hover:text-rose-200 text-xs font-semibold transition-colors cursor-pointer"
                  title="Restart student's entire progress on the app"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
                  <span>Restart Progress</span>
                </button>
              )}
              <div className="text-right">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Interview Progress</span>
                <div className="text-xs font-bold text-amber-400 font-mono-numbers">
                  Stage {chatStep} of 4
                </div>
              </div>
            </div>
          </div>

          {/* CHAT THREAD */}
          <div className="space-y-6">
            {/* STEP 1: SUBJECT */}
            <div className="space-y-3 animate-fadeIn">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-400/40 flex items-center justify-center text-amber-400 shrink-0 mt-0.5 shadow-sm">
                  <HandDrawnSmileyIcon className="w-5 h-5 text-amber-400" mood="happy" />
                </div>
                <div className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl rounded-tl-sm p-4 sm:p-5 text-slate-200 space-y-3">
                  {/* Mentor Intro Bubble without meta labels */}
                  <div className="p-3.5 rounded-2xl bg-amber-950/30 border border-amber-500/30 text-amber-100 text-xs sm:text-sm italic font-serif leading-relaxed flex items-start gap-2.5 shadow-inner">
                    <span className="text-amber-400 text-base shrink-0 select-none">💬</span>
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-semibold text-amber-300 not-italic font-sans">
                          Academic Mentor
                        </span>
                        <div className="flex items-center gap-2">
                          {!isStepQuestionReady(1) && (
                            <button
                              type="button"
                              onClick={() => setSideTalkDone(prev => ({ ...prev, 1: true }))}
                              className="text-[10px] text-slate-400 hover:text-amber-300 px-1.5 py-0.5 rounded cursor-pointer transition-colors"
                            >
                              Skip to question →
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() =>
                              handleVoicePlaySequence(
                                "Welcome to Smart Study! Before we dive in: be honest with me—is this an exam you've known about for 3 months, or did you just find out it's in 2 weeks? Either way, we've got you covered.",
                                "What subject or upcoming exam are we conquering?",
                                1
                              )
                            }
                            className="text-[10px] text-amber-300 hover:text-amber-100 flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 cursor-pointer transition-colors"
                            title="Listen to interview question"
                          >
                            <Volume2 className="w-3 h-3 text-amber-300" />
                            <span>{speakingStep === 1 ? 'Speaking...' : 'Listen'}</span>
                          </button>
                        </div>
                      </div>
                      <div className="text-amber-100 font-serif">
                        "<TypewriterText
                          text="Welcome to Smart Study! Before we dive in: be honest with me—is this an exam you've known about for 3 months, or did you just find out it's in 2 weeks? Either way, we've got you covered."
                          speed={38}
                          cursorColor="text-amber-400"
                          onComplete={() => setSideTalkDone(prev => ({ ...prev, 1: true }))}
                        />"
                      </div>
                    </div>
                  </div>

                  {/* Question 1: Asks interview question when mentor finishes saying the side talk */}
                  {isStepQuestionReady(1) ? (
                    <div className="space-y-3 pt-1 animate-fadeIn">
                      <div className="text-sm sm:text-base font-bold text-white leading-relaxed flex items-start gap-2">
                        <span className="text-amber-400 font-mono text-xs uppercase px-2 py-0.5 rounded bg-slate-900 border border-slate-800 shrink-0 mt-0.5">
                          Question 1:
                        </span>
                        <div className="flex-1">
                          <TypewriterText text="What subject or upcoming exam are we conquering?" speed={44} cursorColor="text-white" />
                        </div>
                      </div>

                      <div className="space-y-2 pt-1">
                        <input
                          type="text"
                          value={subject}
                          onChange={e => setSubject(e.target.value)}
                          placeholder="Type your subject (e.g. English, Calculus, Algebra 1, Algebra 2, Geometry)..."
                          className="w-full bg-slate-900 border border-slate-700 focus:border-amber-500 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 outline-none"
                        />

                        {/* Core Requested Courses */}
                        <div className="space-y-1.5 pt-1">
                          <span className="text-[11px] text-amber-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Core Disciplines (Click to answer & type chat bubble):</span>
                          </span>
                          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                            {CORE_INTERVIEW_COURSES.map(course => {
                              const isSelected = subject.toLowerCase() === course.name.toLowerCase();
                              return (
                                <button
                                  key={course.id}
                                  type="button"
                                  onClick={() => handleChooseSubject(course.name, course.defaultTopics)}
                                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                                    isSelected
                                      ? 'bg-amber-500/20 border-amber-500 text-amber-200 ring-2 ring-amber-500/40 shadow-md'
                                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
                                  }`}
                                >
                                  <div className="flex items-center gap-1.5 font-bold text-xs sm:text-sm">
                                    <span>{course.icon}</span>
                                    <span>{course.name}</span>
                                  </div>
                                  <span className="text-[10px] text-slate-400 mt-1 truncate">{course.tag}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Additional Subject Suggestions */}
                        <div className="space-y-1 pt-1">
                          <span className="text-[11px] text-slate-400 font-medium">Other subjects or type above:</span>
                          <div className="flex flex-wrap gap-1.5">
                            {COMMON_SUBJECT_SUGGESTIONS.slice(5).map(s => {
                              const isSelected = subject.toLowerCase() === s.toLowerCase();
                              return (
                                <button
                                  key={s}
                                  type="button"
                                  onClick={() => handleChooseSubject(s)}
                                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                                    isSelected
                                      ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold shadow-sm'
                                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
                                  }`}
                                >
                                  {s}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {chatStep === 1 && (
                        <div className="pt-2 flex justify-end">
                          <button
                            type="button"
                            onClick={() => {
                              if (subject.trim()) {
                                handleChooseSubject(subject.trim());
                              }
                            }}
                            disabled={!subject.trim()}
                            className="px-5 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-md transition-all"
                          >
                            <span>Confirm Subject & Continue</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-xs text-amber-400/80 font-mono py-1 px-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                      <span className="italic">Mentor speaking... asking interview question when finished</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Candidate Typed Text Bubble (ChatGPT style) */}
              {(typingStep === 1 || chatStep > 1) && (
                <div className="flex justify-end items-start gap-3 animate-fadeIn pt-1">
                  <div className="bg-slate-800/95 border border-slate-700/80 text-slate-100 rounded-3xl rounded-tr-sm p-4 sm:p-5 max-w-[85%] shadow-xl space-y-2">
                    <div className="flex items-center justify-between gap-3 pb-1 border-b border-white/5 text-[11px] text-slate-400">
                      <span className="font-semibold text-indigo-300 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5" /> Candidate (You)
                      </span>
                      {chatStep > 1 && (
                        <button
                          type="button"
                          onClick={() => setChatStep(1)}
                          className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
                          title="Edit chosen subject"
                        >
                          <Pencil className="w-3 h-3" />
                          <span>Edit</span>
                        </button>
                      )}
                    </div>

                    <div className="text-xs sm:text-sm text-slate-100 font-sans leading-relaxed">
                      <TypewriterText
                        text={`I'm preparing for my upcoming exam in ${subject}.`}
                        speed={28}
                        cursorColor="text-indigo-300"
                      />
                    </div>
                  </div>

                  <div className="w-8 h-8 rounded-full bg-indigo-600 border border-indigo-400/50 flex items-center justify-center text-white shrink-0 shadow-md mt-1">
                    <User className="w-4 h-4" />
                  </div>
                </div>
              )}

              {/* AI Mentor Thinking Indicator */}
              {isAiThinking && chatStep === 1 && (
                <div className="flex items-center gap-3 animate-fadeIn pt-1">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-400/40 flex items-center justify-center text-amber-400 shadow-sm">
                    <HandDrawnSmileyIcon className="w-5 h-5 text-amber-400" mood="wink" />
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-300 flex items-center gap-2 shadow-md">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
                    <span className="italic">AI Academic Mentor is calibrating diagnostic question...</span>
                  </div>
                </div>
              )}
            </div>

            {/* STEP 2: TOPICS */}
            {chatStep >= 2 && (
              <div className="space-y-3 animate-fadeIn">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-400/40 flex items-center justify-center text-amber-400 shrink-0 mt-0.5 shadow-sm">
                    <HandDrawnSmileyIcon className="w-5 h-5 text-amber-400" mood="happy" />
                  </div>
                  <div className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl rounded-tl-sm p-4 sm:p-5 text-slate-200 space-y-3">
                    {/* Mentor Intro Bubble without meta labels */}
                    <div className="p-3.5 rounded-2xl bg-amber-950/30 border border-amber-500/30 text-amber-100 text-xs sm:text-sm italic font-serif leading-relaxed flex items-start gap-2.5 shadow-inner">
                      <span className="text-amber-400 text-base shrink-0 select-none">💬</span>
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-semibold text-amber-300 not-italic font-sans">
                            Academic Mentor
                          </span>
                          <div className="flex items-center gap-2">
                            {!isStepQuestionReady(2) && (
                              <button
                                type="button"
                                onClick={() => setSideTalkDone(prev => ({ ...prev, 2: true }))}
                                className="text-[10px] text-slate-400 hover:text-amber-300 px-1.5 py-0.5 rounded cursor-pointer transition-colors"
                              >
                                Skip to question →
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() =>
                                handleVoicePlaySequence(
                                  `Great choice with ${subject}! Pro tip: don't just pick easy topics to feel accomplished. Pick the specific ones where your brain usually feels like dial-up internet!`,
                                  "Which topics are giving you the biggest headache?",
                                  2
                                )
                              }
                              className="text-[10px] text-amber-300 hover:text-amber-100 flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 cursor-pointer transition-colors"
                              title="Listen to interview question"
                            >
                              <Volume2 className="w-3 h-3 text-amber-300" />
                              <span>{speakingStep === 2 ? 'Speaking...' : 'Listen'}</span>
                            </button>
                          </div>
                        </div>
                        <div className="text-amber-100 font-serif">
                          "<TypewriterText
                            text={`Great choice with ${subject}! Pro tip: don't just pick easy topics to feel accomplished. Pick the specific ones where your brain usually feels like dial-up internet!`}
                            speed={38}
                            cursorColor="text-amber-400"
                            onComplete={() => setSideTalkDone(prev => ({ ...prev, 2: true }))}
                          />"
                        </div>
                      </div>
                    </div>

                    {/* Question 2: Asks interview question when mentor finishes saying the side talk */}
                    {isStepQuestionReady(2) ? (
                      <div className="space-y-3 pt-1 animate-fadeIn">
                        <div className="text-sm sm:text-base font-bold text-white leading-relaxed flex items-start gap-2">
                          <span className="text-amber-400 font-mono text-xs uppercase px-2 py-0.5 rounded bg-slate-900 border border-slate-800 shrink-0 mt-0.5">
                            Question 2:
                          </span>
                          <div className="flex-1">
                            <TypewriterText text="Which topics are giving you the biggest headache?" speed={44} cursorColor="text-white" />
                          </div>
                        </div>

                    <div className="space-y-3 pt-1">
                      {/* 1-Click Fast Course Topic Pills */}
                      <div className="space-y-1.5 pb-1">
                        <span className="text-[11px] text-amber-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Core Course Topics (Click to add as topic or switch discipline):</span>
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {CORE_INTERVIEW_COURSES.map(course => {
                            const isTopicSelected = selectedTopics.includes(course.name);
                            const isCurrentSubj = subject.toLowerCase() === course.name.toLowerCase();
                            return (
                              <button
                                key={course.id}
                                type="button"
                                onClick={() => {
                                  handleToggleTopic(course.name);
                                  if (!isCurrentSubj) {
                                    setSubject(course.name);
                                  }
                                }}
                                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
                                  isTopicSelected
                                    ? 'bg-amber-500/25 border-amber-500 text-amber-200 ring-2 ring-amber-500/40 shadow-sm'
                                    : isCurrentSubj
                                    ? 'bg-slate-800 border-amber-500/50 text-slate-200'
                                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
                                }`}
                              >
                                <span>{course.icon}</span>
                                <span>{course.name}</span>
                                <span className={`text-[10px] px-1.5 py-0.5 rounded ${isTopicSelected ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-950/60 text-slate-400'}`}>
                                  {isTopicSelected ? '✓ Selected' : '+ Add'}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Selected topics pills */}
                      <div className="flex flex-wrap gap-1.5 p-2.5 bg-slate-900 rounded-xl border border-slate-800 min-h-[44px] items-center">
                        {selectedTopics.map((top, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-700 text-slate-200 text-xs font-medium"
                          >
                            <span>{top}</span>
                            <button
                              type="button"
                              onClick={() => handleToggleTopic(top)}
                              className="text-slate-500 hover:text-rose-400 ml-1 cursor-pointer"
                            >
                              ✕
                            </button>
                          </span>
                        ))}

                        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                          <input
                            type="text"
                            value={customTopicInput}
                            onChange={e => setCustomTopicInput(e.target.value)}
                            onKeyDown={handleAddCustomTopic}
                            placeholder="Type a topic and press Enter..."
                            className="bg-transparent text-xs text-slate-200 placeholder:text-slate-500 outline-none w-full"
                          />
                          <button
                            type="button"
                            onClick={handleAddCustomTopic}
                            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs cursor-pointer"
                          >
                            Add
                          </button>
                        </div>
                      </div>

                      {/* Recommended topics for the chosen subject */}
                      <div className="space-y-1.5 pt-2">
                        <span className="text-[11px] font-semibold text-slate-400 block">
                          Recommended topics for <strong className="text-amber-300">{subject || 'your subject'}</strong> (click to toggle):
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {getRecommendedTopicsForSubject(subject).map(rec => {
                            const isSelected = selectedTopics.includes(rec);
                            return (
                              <button
                                key={rec}
                                type="button"
                                onClick={() => handleToggleTopic(rec)}
                                className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all cursor-pointer flex items-center gap-1.5 ${
                                  isSelected
                                    ? 'bg-amber-500/20 border-amber-500/60 text-amber-200 ring-1 ring-amber-500/30'
                                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                                }`}
                              >
                                <span className="font-bold">{isSelected ? '✓' : '+'}</span>
                                <span>{rec}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {chatStep === 2 && (
                      <div className="pt-2 flex justify-between items-center">
                        <button
                          type="button"
                          onClick={() => setChatStep(1)}
                          className="text-xs text-slate-400 hover:text-slate-200 cursor-pointer"
                        >
                          ← Back
                        </button>
                        <button
                          type="button"
                          onClick={handleConfirmTopics}
                          disabled={selectedTopics.length === 0}
                          className="px-5 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-md transition-all"
                        >
                          <span>Confirm Topics & Continue</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-xs text-amber-400/80 font-mono py-1 px-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                    <span className="italic">Mentor speaking... asking interview question when finished</span>
                  </div>
                )}
              </div>
            </div>

                {/* Candidate Typed Text Bubble for Step 2 (ChatGPT style) */}
                {(typingStep === 2 || chatStep > 2) && (
                  <div className="flex justify-end items-start gap-3 animate-fadeIn pt-1">
                    <div className="bg-slate-800/95 border border-slate-700/80 text-slate-100 rounded-3xl rounded-tr-sm p-4 sm:p-5 max-w-[85%] shadow-xl space-y-2">
                      <div className="flex items-center justify-between gap-3 pb-1 border-b border-white/5 text-[11px] text-slate-400">
                        <span className="font-semibold text-indigo-300 flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5" /> Candidate (You)
                        </span>
                        {chatStep > 2 && (
                          <button
                            type="button"
                            onClick={() => setChatStep(2)}
                            className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
                            title="Edit chosen topics"
                          >
                            <Pencil className="w-3 h-3" />
                            <span>Edit</span>
                          </button>
                        )}
                      </div>

                      <div className="text-xs sm:text-sm text-slate-100 font-sans leading-relaxed">
                        <TypewriterText
                          text={`The hardest topics I need to master are: ${selectedTopics.join(', ')}.`}
                          speed={28}
                          cursorColor="text-indigo-300"
                        />
                      </div>
                    </div>

                    <div className="w-8 h-8 rounded-full bg-indigo-600 border border-indigo-400/50 flex items-center justify-center text-white shrink-0 shadow-md mt-1">
                      <User className="w-4 h-4" />
                    </div>
                  </div>
                )}

                {/* AI Mentor Thinking Indicator */}
                {isAiThinking && chatStep === 2 && (
                  <div className="flex items-center gap-3 animate-fadeIn pt-1">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-400/40 flex items-center justify-center text-amber-400 shadow-sm">
                      <HandDrawnSmileyIcon className="w-5 h-5 text-amber-400" mood="wink" />
                    </div>
                    <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-300 flex items-center gap-2 shadow-md">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
                      <span className="italic">AI Academic Mentor is assessing testing format standards...</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* STEP 3: GRADE LEVEL & QUESTION FORMATS */}
            {chatStep >= 3 && (
              <div className="space-y-3 animate-fadeIn">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-400/40 flex items-center justify-center text-amber-400 shrink-0 mt-0.5 shadow-sm">
                    <HandDrawnSmileyIcon className="w-5 h-5 text-amber-400" mood="happy" />
                  </div>
                  <div className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl rounded-tl-sm p-4 sm:p-5 text-slate-200 space-y-3">
                    {/* Mentor Intro Bubble without meta labels */}
                    <div className="p-3.5 rounded-2xl bg-amber-950/30 border border-amber-500/30 text-amber-100 text-xs sm:text-sm italic font-serif leading-relaxed flex items-start gap-2.5 shadow-inner">
                      <span className="text-amber-400 text-base shrink-0 select-none">💬</span>
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-semibold text-amber-300 not-italic font-sans">
                            Academic Mentor
                          </span>
                          <div className="flex items-center gap-2">
                            {!isStepQuestionReady(3) && (
                              <button
                                type="button"
                                onClick={() => setSideTalkDone(prev => ({ ...prev, 3: true }))}
                                className="text-[10px] text-slate-400 hover:text-amber-300 px-1.5 py-0.5 rounded cursor-pointer transition-colors"
                              >
                                Skip to question →
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() =>
                                handleVoicePlaySequence(
                                  "If your exam has an oral board or speaking interview component, The Angry Examiner simulator is about to become your best friend!",
                                  "What grade level are you preparing for, and what question formats will you be tested on?",
                                  3
                                )
                              }
                              className="text-[10px] text-amber-300 hover:text-amber-100 flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 cursor-pointer transition-colors"
                              title="Listen to interview question"
                            >
                              <Volume2 className="w-3 h-3 text-amber-300" />
                              <span>{speakingStep === 3 ? 'Speaking...' : 'Listen'}</span>
                            </button>
                          </div>
                        </div>
                        <div className="text-amber-100 font-serif">
                          "<TypewriterText
                            text="If your exam has an oral board or speaking interview component, The Angry Examiner simulator is about to become your best friend!"
                            speed={38}
                            cursorColor="text-amber-400"
                            onComplete={() => setSideTalkDone(prev => ({ ...prev, 3: true }))}
                          />"
                        </div>
                      </div>
                    </div>

                    {/* Question 3: Asks interview question when mentor finishes saying the side talk */}
                    {isStepQuestionReady(3) ? (
                      <div className="space-y-3 pt-1 animate-fadeIn">
                        <div className="text-sm sm:text-base font-bold text-white leading-relaxed flex items-start gap-2">
                          <span className="text-amber-400 font-mono text-xs uppercase px-2 py-0.5 rounded bg-slate-900 border border-slate-800 shrink-0 mt-0.5">
                            Question 3:
                          </span>
                          <div className="flex-1">
                            <TypewriterText text="What grade level are you preparing for, and what question formats will you be tested on?" speed={44} cursorColor="text-white" />
                          </div>
                        </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div>
                        <label className="text-[11px] text-slate-400 uppercase font-semibold block mb-1">
                          Grade / Academic Level:
                        </label>
                        <select
                          value={gradeLevel}
                          onChange={e => setGradeLevel(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none"
                        >
                          {GRADE_LEVELS.map(g => (
                            <option key={g} value={g}>{g}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-[11px] text-slate-400 uppercase font-semibold block mb-1">
                          Country / Board:
                        </label>
                        <select
                          value={country}
                          onChange={e => setCountry(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none"
                        >
                          {COUNTRIES.slice(0, 15).map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Question formats */}
                    <div className="pt-2">
                      <label className="text-[11px] text-slate-400 uppercase font-semibold block mb-1.5">
                        Exam Question Types:
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {QUESTION_TYPE_OPTIONS.map(qt => {
                          const isChecked = questionTypes.includes(qt.id);
                          return (
                            <button
                              key={qt.id}
                              type="button"
                              onClick={() => handleToggleQuestionType(qt.id)}
                              className={`p-2.5 rounded-xl border text-left transition-colors cursor-pointer flex items-center justify-between ${
                                isChecked
                                  ? 'bg-amber-500/15 border-amber-500/50 text-amber-200'
                                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                              }`}
                            >
                              <span className="text-xs font-medium">{qt.label}</span>
                              {isChecked && <Check className="w-3.5 h-3.5 text-amber-400" />}
                            </button>
                          );
                        })}
                      </div>

                      {/* Interactive Passage Length & Depth Selector */}
                      {(questionTypes.some(qt => qt.toLowerCase().includes('passage')) || passageLengthPreference === 'long-6-plus') && (
                        <div className="mt-3 p-3.5 rounded-2xl bg-cyan-950/40 border border-cyan-500/40 space-y-3 animate-fadeIn">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-xs font-bold text-cyan-300">
                              <BookOpen className="w-4 h-4 text-cyan-400" />
                              <span>Passage Generator Length & Depth:</span>
                            </div>
                            <span className="text-[10px] uppercase font-mono-numbers px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                              {passageLengthPreference === 'long-6-plus' ? '6+ Paragraphs' : 'Standard Length'}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setPassageLengthPreference('standard');
                                if (!questionTypes.includes('Reading Passage')) {
                                  setQuestionTypes(prev => [...prev.filter(t => t !== 'Long Reading Passage (6+ Paragraphs)'), 'Reading Passage']);
                                } else {
                                  setQuestionTypes(prev => prev.filter(t => t !== 'Long Reading Passage (6+ Paragraphs)'));
                                }
                              }}
                              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                                passageLengthPreference === 'standard' && !questionTypes.includes('Long Reading Passage (6+ Paragraphs)')
                                  ? 'bg-cyan-500/20 border-cyan-400 text-cyan-100 ring-1 ring-cyan-400/40 shadow-sm'
                                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-bold">Standard Passages</span>
                                <span className="text-[10px] text-slate-400 font-mono-numbers">2–4 Paragraphs</span>
                              </div>
                              <p className="text-[11px] text-slate-400 leading-snug">
                                Focused excerpts with dense analytical multi-clause answer choices.
                              </p>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setPassageLengthPreference('long-6-plus');
                                if (!questionTypes.includes('Long Reading Passage (6+ Paragraphs)')) {
                                  setQuestionTypes(prev => [...prev, 'Long Reading Passage (6+ Paragraphs)']);
                                }
                              }}
                              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                                passageLengthPreference === 'long-6-plus' || questionTypes.includes('Long Reading Passage (6+ Paragraphs)')
                                  ? 'bg-amber-500/20 border-amber-400 text-amber-100 ring-1 ring-amber-400/40 shadow-sm'
                                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-bold text-amber-300 flex items-center gap-1">
                                  <span>⚡ Long Passages (6+ Paragraphs)</span>
                                </span>
                                <span className="text-[10px] text-amber-400 font-bold font-mono-numbers">6+ Paragraphs</span>
                              </div>
                              <p className="text-[11px] text-slate-400 leading-snug">
                                Full-length 6+ paragraph texts testing cross-paragraph synthesis and trap elimination.
                              </p>
                            </button>
                          </div>

                          <div className="text-[11px] text-slate-300 leading-relaxed bg-slate-950/70 p-2 rounded-xl border border-slate-800/80">
                            {passageLengthPreference === 'long-6-plus' || questionTypes.includes('Long Reading Passage (6+ Paragraphs)') ? (
                              <span className="text-amber-300">
                                <strong>6+ Paragraph Reading Passage Active:</strong> The Question AI will generate extensive texts consisting of at least 6 distinct paragraphs with cross-paragraph references and complex multi-clause answer choices.
                              </span>
                            ) : (
                              <span>
                                <strong>Standard Passage Active:</strong> 2 to 4 paragraphs focused on high-yield core mechanisms and analytical deductions.
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {chatStep === 3 && (
                      <div className="pt-2 flex justify-between items-center">
                        <button
                          type="button"
                          onClick={() => setChatStep(2)}
                          className="text-xs text-slate-400 hover:text-slate-200 cursor-pointer"
                        >
                          ← Back
                        </button>
                        <button
                          type="button"
                          onClick={handleConfirmFormat}
                          className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-md transition-all"
                        >
                          <span>Confirm Format & Continue</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-xs text-amber-400/80 font-mono py-1 px-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                    <span className="italic">Mentor speaking... asking interview question when finished</span>
                  </div>
                )}
              </div>
            </div>

                {/* Candidate Typed Text Bubble for Step 3 (ChatGPT style) */}
                {(typingStep === 3 || chatStep > 3) && (
                  <div className="flex justify-end items-start gap-3 animate-fadeIn pt-1">
                    <div className="bg-slate-800/95 border border-slate-700/80 text-slate-100 rounded-3xl rounded-tr-sm p-4 sm:p-5 max-w-[85%] shadow-xl space-y-2">
                      <div className="flex items-center justify-between gap-3 pb-1 border-b border-white/5 text-[11px] text-slate-400">
                        <span className="font-semibold text-indigo-300 flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5" /> Candidate (You)
                        </span>
                        {chatStep > 3 && (
                          <button
                            type="button"
                            onClick={() => setChatStep(3)}
                            className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
                            title="Edit format and academic level"
                          >
                            <Pencil className="w-3 h-3" />
                            <span>Edit</span>
                          </button>
                        )}
                      </div>

                      <div className="text-xs sm:text-sm text-slate-100 font-sans leading-relaxed">
                        <TypewriterText
                          text={`I'm preparing at the ${gradeLevel} level (${country}). My exam tests: ${questionTypes.join(', ')}.`}
                          speed={28}
                          cursorColor="text-indigo-300"
                        />
                      </div>
                    </div>

                    <div className="w-8 h-8 rounded-full bg-indigo-600 border border-indigo-400/50 flex items-center justify-center text-white shrink-0 shadow-md mt-1">
                      <User className="w-4 h-4" />
                    </div>
                  </div>
                )}

                {/* AI Mentor Thinking Indicator */}
                {isAiThinking && chatStep === 3 && (
                  <div className="flex items-center gap-3 animate-fadeIn pt-1">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-400/40 flex items-center justify-center text-amber-400 shadow-sm">
                      <HandDrawnSmileyIcon className="w-5 h-5 text-amber-400" mood="wink" />
                    </div>
                    <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-300 flex items-center gap-2 shadow-md">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
                      <span className="italic">AI Academic Mentor is calibrating countdown timeline...</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* STEP 4: DATE & GENERATION */}
            {chatStep >= 4 && (
              <div className="space-y-4 animate-fadeIn">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-400/40 flex items-center justify-center text-amber-400 shrink-0 mt-0.5 shadow-sm">
                    <HandDrawnSmileyIcon className="w-5 h-5 text-amber-400" mood="happy" />
                  </div>
                  <div className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl rounded-tl-sm p-4 sm:p-5 text-slate-200 space-y-4">
                    {/* Mentor Intro Bubble without meta labels */}
                    <div className="p-3.5 rounded-2xl bg-amber-950/40 border border-amber-500/40 text-amber-200 text-xs sm:text-sm italic font-serif leading-relaxed flex items-start gap-2.5 shadow-inner">
                      <span className="text-amber-400 text-base shrink-0 select-none">💬</span>
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-semibold text-amber-300 not-italic font-sans">
                            Academic Mentor
                          </span>
                          <div className="flex items-center gap-2">
                            {!isStepQuestionReady(4) && (
                              <button
                                type="button"
                                onClick={() => setSideTalkDone(prev => ({ ...prev, 4: true }))}
                                className="text-[10px] text-slate-400 hover:text-amber-300 px-1.5 py-0.5 rounded cursor-pointer transition-colors"
                              >
                                Skip to question →
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() =>
                                handleVoicePlaySequence(
                                  "The countdown is real! Every day you do active recall instead of passive reading raises your retention by 40%.",
                                  "Final question: When is the moment of truth—what is your official exam date?",
                                  4
                                )
                              }
                              className="text-[10px] text-amber-300 hover:text-amber-100 flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 cursor-pointer transition-colors"
                              title="Listen to interview question"
                            >
                              <Volume2 className="w-3 h-3 text-amber-300" />
                              <span>{speakingStep === 4 ? 'Speaking...' : 'Listen'}</span>
                            </button>
                          </div>
                        </div>
                        <div className="text-amber-100 font-serif">
                          "<TypewriterText
                            text="The countdown is real! Every day you do active recall instead of passive reading raises your retention by 40%."
                            speed={38}
                            cursorColor="text-amber-400"
                            onComplete={() => setSideTalkDone(prev => ({ ...prev, 4: true }))}
                          />"
                        </div>
                      </div>
                    </div>

                    {/* Question 4: Asks interview question when mentor finishes speaking/typing */}
                    {isStepQuestionReady(4) ? (
                      <div className="space-y-4 pt-1 animate-fadeIn">
                        <div className="text-sm sm:text-base font-bold text-white leading-relaxed flex items-start gap-2">
                          <span className="text-amber-400 font-mono text-xs uppercase px-2 py-0.5 rounded bg-slate-900 border border-slate-800 shrink-0 mt-0.5">
                            Question 4:
                          </span>
                          <div className="flex-1">
                            <TypewriterText text="Final question: When is the moment of truth—what is your official exam date?" speed={44} cursorColor="text-white" />
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center gap-3">
                          <input
                            type="date"
                            value={examDate}
                            onChange={e => setExamDate(e.target.value)}
                            className="w-full sm:w-auto bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-slate-200 outline-none"
                          />

                          <div className="px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono-numbers font-semibold">
                            ⏳ {daysRemaining} Days Countdown to Exam
                          </div>
                        </div>

                        {/* Final Trigger Button */}
                        <div className="pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3">
                          <button
                            type="button"
                            onClick={() => setChatStep(3)}
                            className="text-xs text-slate-400 hover:text-slate-200 cursor-pointer"
                          >
                            ← Back to Formats
                          </button>

                          <button
                            type="button"
                            disabled={isGenerating || selectedTopics.length === 0}
                            onClick={e => handleConfirmDateAndGenerate(e as any)}
                            className="w-full sm:w-auto px-8 py-3 rounded-xl bg-gradient-to-r from-amber-500 via-rose-500 to-amber-500 hover:from-amber-400 hover:to-rose-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 cursor-pointer shadow-xl transition-all hover:scale-[1.02]"
                          >
                            {isGenerating ? (
                              <>
                                <Sparkles className="w-4 h-4 animate-spin text-slate-950" />
                                <span>{loadingQuotes[loadingStep]}</span>
                              </>
                            ) : (
                              <>
                                <Flame className="w-4 h-4" />
                                <span>Generate My Active Study Plan 🚀</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-xs text-amber-400/80 font-mono py-1 px-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                        <span className="italic">Mentor speaking... asking interview question when finished</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Candidate Typed Text Bubble for Step 4 / Generating (ChatGPT style) */}
            {(typingStep === 4 || isGenerating) && (
              <div className="flex justify-end items-start gap-3 animate-fadeIn pt-1">
                <div className="bg-slate-800/95 border border-slate-700/80 text-slate-100 rounded-3xl rounded-tr-sm p-4 sm:p-5 max-w-[85%] shadow-xl space-y-2">
                  <div className="flex items-center justify-between gap-3 pb-1 border-b border-white/5 text-[11px] text-slate-400">
                    <span className="font-semibold text-indigo-300 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5" /> Candidate (You)
                    </span>
                    <span className="text-[10px] text-amber-400 font-mono font-semibold">Ready for battle</span>
                  </div>

                  <div className="text-xs sm:text-sm text-slate-100 font-sans leading-relaxed">
                    <TypewriterText
                      text={`My exam date is set for ${examDate} (~${daysRemaining} days countdown). Let's generate the active study roadmap!`}
                      speed={12}
                      cursorColor="text-indigo-300"
                    />
                  </div>
                </div>

                <div className="w-8 h-8 rounded-full bg-indigo-600 border border-indigo-400/50 flex items-center justify-center text-white shrink-0 shadow-md mt-1">
                  <User className="w-4 h-4" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* ChatGPT Style Floating Prompt Dock */}
          <div className="pt-3 border-t border-slate-800/80 space-y-2">
            <div className="bg-slate-950 border border-slate-800 focus-within:border-amber-500/60 focus-within:ring-1 focus-within:ring-amber-500/20 rounded-3xl p-2 pl-4 sm:pl-5 flex items-center gap-2 shadow-inner transition-all">
              <input
                type="text"
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSendChatPrompt();
                  }
                }}
                placeholder={
                  chatStep === 1
                    ? "Message AI Mentor: Type your subject (e.g. Calculus, Biology, World History)..."
                    : chatStep === 2
                    ? "Message AI Mentor: Type a difficult topic and press Enter..."
                    : chatStep === 3
                    ? "Message AI Mentor: Type past question notes or hints..."
                    : "Message AI Mentor: Type target notes or press Enter to generate..."
                }
                className="flex-1 bg-transparent text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 outline-none"
              />

              {/* Mic / Dictation button */}
              <button
                type="button"
                onClick={toggleListening}
                className={`p-2 rounded-full transition-colors cursor-pointer ${
                  isListening
                    ? 'bg-rose-600 text-white animate-pulse'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
                title={isListening ? "Listening (Voice dictation active)..." : "Dictate with voice"}
              >
                {isListening ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
              </button>

              {/* ChatGPT Signature Circular Send Button */}
              <button
                type="button"
                disabled={!chatInput.trim() && !(chatStep === 4 && selectedTopics.length > 0)}
                onClick={handleSendChatPrompt}
                className="w-9 h-9 rounded-full bg-white hover:bg-slate-200 disabled:opacity-20 disabled:bg-slate-800 text-slate-950 disabled:text-slate-500 flex items-center justify-center transition-all cursor-pointer shadow-md shrink-0"
                title="Send message to AI Mentor (Enter)"
              >
                <ArrowUp className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 px-2 gap-1">
              <span className="hidden sm:inline">Press <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-mono text-[10px]">Enter</kbd> to send</span>
              <span className="text-[10px] text-slate-500">Smart Study AI Mentor can make mistakes. Verify exam board specifications.</span>
            </div>
          </div>
        </div>

      {/* Reset Entire Progress Confirmation Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl space-y-5 text-center relative overflow-hidden">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-bold font-display text-white">
                Restart All Student Progress?
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                This will reset your study streak, earned XP, daily question goals, and exam battle plan back to Day 1. You will start fresh as a new student.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                className="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => {
                  playIncorrectSound();
                  setShowResetModal(false);
                  setIsEditing(true);
                  setChatStep(1);
                  setSubject('Biology');
                  setSelectedTopics([]);
                  setCustomTopicInput('');
                  setQuestionTypes(['Multiple Choice Questions', 'Short Answer & Definitions']);
                  setPastPaperImages([]);
                  setPastPaperContext('');
                  onResetProgress?.();
                }}
                className="py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors cursor-pointer shadow-lg shadow-rose-950/40"
              >
                Yes, Reset All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
