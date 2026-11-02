export interface Lecture {
  id: string;
  title: string;
  topic: string;
  difficulty: 'Foundation' | 'High-Yield' | 'Brutal Exam Level';
  youtubeUrl: string;
  youtubeId: string;
  duration: string;
  summary: string;
  theTrap: string;
  coreMechanism: string[];
  analogy: string;
  highYieldBullets: string[];
  imagePath?: string;
  tags: string[];
  quiz: QuizQuestion[];
  vivaQuestions: VivaScenario[];
}

export interface QuizQuestion {
  id: string;
  lectureId?: string;
  topic: string;
  question: string;
  options: string[];
  correctIndex: number;
  angryExplanation: string;
  examinerTrapNotes: string;
  distractorExplanations?: string[];
  passage?: string;
  passageTitle?: string;
  difficulty?: string;
  imageUrl?: string;
  visualAnalysis?: string;
  audioData?: string; // base64 WAV audio from Gemini TTS
  voiceName?: string;
  thinkingProcess?: string;
  searchSources?: { title: string; url?: string }[];
  fallacyTags?: string[];
}

export interface VivaScenario {
  id: string;
  topic: string;
  title: string;
  difficulty: 'Moderate' | 'Strict' | 'Savage';
  examinerPrompt: string;
  flawedExample?: string; // for "Spot the Flaw" mode
  requiredKeywords: string[];
  sampleModelAnswer: string;
  followUpPrompt: string;
}

export interface ExaminerEvaluation {
  score: number; // 0 - 10
  verdict: 'FAIL - VAGUE FLUFF' | 'BORDERLINE PASS' | 'SOLID PASS' | '1ST CLASS HONORS';
  roastCritique: string;
  whatYouMissed: string[];
  modelAnswer: string;
  followUpQuestion: string;
  bonusTip: string;
  examinerAudioText?: string;
}

export interface ExamProfile {
  subject: string;
  topics: string[];
  questionTypes: string[];
  examDate: string; // 'YYYY-MM-DD'
  gradeLevel: string;
  country: string;
  pastPaperContext?: string;
  pastPaperImages?: string[]; // base64 images
  passageLengthPreference?: 'standard' | 'long-6-plus';
}

export interface SubTopicPerformance {
  subTopic: string;
  parentTopic: string;
  subject: string;
  incorrectAnswers: number;
  correctAnswers: number;
  totalAttempts: number;
  errorRate: number; // 0 - 100 percentage
  commonTrapSummary: string;
  lastAttemptedDate: string;
  severity: 'Critical Gap' | 'Moderate Weakness' | 'Stable';
}

export interface MistakeRecord {
  id: string;
  source: 'quiz' | 'level-drill' | 'session' | 'examiner' | 'manual';
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
  timestamp: string;
  fixed: boolean;
  fixedAt?: string;
  attemptsCount: number;
}

export interface ExamMilestone {
  phase: string;
  title: string;
  dayRange: string;
  focus: string;
  actionItems: string[];
}

export interface ExamPlan {
  id: string;
  createdAt: string;
  profile: ExamProfile;
  examinerRoastSummary: string;
  daysRemaining: number;
  dailyStudyTargetMinutes: number;
  milestones: ExamMilestone[];
  highYieldFocalPoints: string[];
  recommendedSyllabusTopics: string[];
}

export interface DailyStudyGoal {
  targetQuestions: number;
  targetFlashcards: number;
  completedQuestions: number;
  completedFlashcards: number;
  lastGoalDate: string;
  targetHours?: number; // target daily study hours (e.g. 1.0, 2.0)
  targetMinutes?: number; // target daily study minutes (e.g. 30, 45, 60, 90)
  completedMinutes?: number; // accumulated study minutes today
  goalMetricType?: 'questions' | 'hours' | 'both';
}

export interface StudyLogEntry {
  quizzesCount: number;
  vivaCount: number;
  xpEarned: number;
  flashcardsCount?: number;
  minutesSpent?: number;
  milestoneAchieved?: {
    index: number;
    title: string;
    phase: string;
  };
}

export interface UserStudyState {
  streak: number;
  longestStreak: number;
  lastStudiedDate: string; // ISO date string 'YYYY-MM-DD'
  freezeTokens: number;
  totalXp: number;
  level: number;
  levelTitle: string;
  todayCompleted: {
    dailyQuiz: boolean;
    vivaDrill: boolean;
    flashcards: boolean;
    lectureNotes: boolean;
  };
  dailyStudyGoal?: DailyStudyGoal;
  studyLog: Record<string, StudyLogEntry>;
  topicMastery: Record<string, {
    retentionPercent: number; // 0 - 100
    lastReviewedDaysAgo: number;
    quizzesAttempted: number;
    vivaAttempted: number;
  }>;
  subTopicPerformance?: Record<string, SubTopicPerformance>;
  bookmarkedLectures: string[];
  recentExaminerScores: { date: string; topic: string; score: number; verdict: string }[];
  activeExamPlan?: ExamPlan | null;
  completedMilestones?: number[];
  milestoneCompletionDates?: Record<number, string>; // milestoneIndex -> 'YYYY-MM-DD'
  activeMilestoneIndex?: number;
  mistakesLog?: MistakeRecord[];
  userProfile?: UserProfileCustomization;
  achievements?: Record<string, ClaimedAchievementRecord>;
}

export interface Flashcard {
  id: string;
  topic: string;
  front: string;
  back: string;
  trap: string;
  box: number; // Leitner box 1, 2, 3, 4, 5
  nextReviewDate: string;
}

export type StudyPhase = 'Pretest' | 'Core Sprint' | 'Blurting' | 'Application' | 'Teach-Back' | 'Break';

export interface ScheduleBlock {
  start: number; // in minutes
  end: number;
  phase: StudyPhase;
  duration: number;
  type: 'Active Recall' | 'Break';
}

export interface StudyScheduleData {
  blocks: ScheduleBlock[];
  activeTotal: number;
  breakTotal: number;
  totalMins: number;
}

export type SoundscapeMode = 'off' | 'steady-state' | 'mario-kart' | 'anxiety-killer' | 'math-logic';

export interface StudySessionConfig {
  durationMinutes: number;
  breakIntervalMinutes: number;
  breakDurationMinutes: number;
  subject: string;
  topics: string[];
  gradeLevel: string;
  subjectCategory?: 'Math/Science' | 'Reading/Writing' | 'General';
  deepWorkMode?: boolean;
}

export interface StudySessionData {
  topic: string;
  briefExplanation: string;
  pretestQuestion?: QuizQuestion;
  flashcards: { front: string; back: string; trap: string }[];
  blurtingPrompt?: string;
  blurtingKeyPoints?: string[];
  practiceQuestions: QuizQuestion[];
  teachBackPrompt?: string;
  quickCheckPrompt: string;
  sampleCheckAnswer: string;
  motivationalAdvice: string;
  antiMotivationTips?: {
    fiveMinuteHack: string;
    temptationIdea: string;
    deadManSwitchExample: string;
    thirdPersonPrompt: string;
  };
}

export type ConceptCategory = 'root' | 'mechanism' | 'trap' | 'analogy' | 'pearl' | 'detail';

export interface MindmapConceptNode {
  id: string;
  name: string;
  category: ConceptCategory;
  description?: string;
  examinerNote?: string;
  level: number; // 0 = Root, 1 = Major Pillar, 2 = Subtopic/Step, 3 = Fine Detail
  parentId?: string;
  children?: MindmapConceptNode[];
  // D3 force simulation properties
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
}

export interface MindmapLink {
  source: string | MindmapConceptNode;
  target: string | MindmapConceptNode;
  category?: ConceptCategory;
}

export interface RankTierDefinition {
  tierNumber: number;
  name: string;
  minXp: number;
  maxXp: number;
  badgeIcon: string;
  color: string;
  bgGradient: string;
  perks: string[];
  motto: string;
  divisionTitles: string[]; // e.g. ["Division III", "Division II", "Division I"]
}

export interface LeaderboardEntry {
  id: string;
  username: string;
  displayName: string;
  avatarSeed: string;
  avatarUrl?: string;
  stickFigure?: StickFigureConfig;
  motto?: string;
  totalXp: number;
  weeklyXp: number;
  streakDays: number;
  rankTierName: string;
  tierNumber: number;
  division: string;
  topSubject?: string;
  country: string;
  verifiedOnline: boolean;
  accuracyRate: number; // e.g. 92%
  isCurrentUser?: boolean;
}

export type StickHeadwear =
  | 'none'
  | 'grad-cap'
  | 'beanie'
  | 'baseball-cap'
  | 'crown'
  | 'headband'
  | 'headphones'
  | 'top-hat'
  | 'halo'
  | 'party-hat'
  | 'spiky-hair'
  | 'curly-hair'
  | 'viking-horns';

export type StickFaceExpression =
  | 'happy'
  | 'glasses'
  | 'sunglasses'
  | 'focused'
  | 'sparkle'
  | 'wink'
  | 'monocle'
  | 'sleeping'
  | 'smug'
  | 'derp';

export type StickBodyPose =
  | 'standing'
  | 'hands-on-hips'
  | 'thumbs-up'
  | 'reading'
  | 'coffee'
  | 'pencil'
  | 'victory'
  | 'laptop'
  | 'thinking'
  | 'sword';

export type StickOutfit =
  | 'none'
  | 'tie'
  | 'bowtie'
  | 'hoodie'
  | 'cape'
  | 'scarf'
  | 'lab-coat'
  | 'belt';

export type StickColorTheme =
  | 'chalk'
  | 'amber'
  | 'cyan'
  | 'emerald'
  | 'rose'
  | 'purple'
  | 'blue'
  | 'orange'
  | 'midnight';

export type StickBackgroundShape =
  | 'circle'
  | 'rounded'
  | 'hexagon'
  | 'shield';

export type StickBackgroundBg =
  | 'chalkboard'
  | 'dark-slate'
  | 'amber-glow'
  | 'neon-cyber'
  | 'sunset'
  | 'emerald-mint'
  | 'cosmic-star';

export interface StickFigureConfig {
  headwear: StickHeadwear;
  expression: StickFaceExpression;
  pose: StickBodyPose;
  outfit: StickOutfit;
  colorTheme: StickColorTheme;
  bgShape: StickBackgroundShape;
  bgTheme: StickBackgroundBg;
  lineWidth?: number;
}

export interface UserProfileCustomization {
  displayName: string;
  username: string;
  titleMotto: string;
  stickFigure: StickFigureConfig;
}

export type AchievementCategory = 'streak' | 'mastery' | 'quiz' | 'examiner' | 'consistency' | 'vault';

export type AchievementTier = 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond';

export type AchievementRarity = 'Common' | 'Rare' | 'Epic' | 'Legendary';

export interface AchievementBadge {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  category: AchievementCategory;
  tier: AchievementTier;
  rarity: AchievementRarity;
  icon: string;
  xpReward: number;
  freezeTokenReward?: number;
  currentValue: number;
  targetValue: number;
  unit: string;
  isUnlocked: boolean;
  unlockedAt?: string;
  isClaimed: boolean;
  claimedAt?: string;
  loreQuote: string;
}

export interface ClaimedAchievementRecord {
  unlockedAt: string;
  claimed: boolean;
  claimedAt?: string;
}

