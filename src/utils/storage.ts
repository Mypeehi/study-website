import {
  UserStudyState,
  ExamPlan,
  SubTopicPerformance,
  StudyLogEntry,
  MistakeRecord,
  RankTierDefinition,
  LeaderboardEntry,
  StickFigureConfig,
  UserProfileCustomization,
} from '../types';
import { DEFAULT_USER_PROFILE, DEFAULT_STICK_FIGURE } from '../components/StickFigureAvatar';

const STORAGE_KEY = 'the_angry_scholar_state_v1';

export const DEFAULT_SUBTOPIC_PERFORMANCE: Record<string, SubTopicPerformance> = {
  'Enzyme Inhibition & Lineweaver-Burk': {
    subTopic: 'Enzyme Inhibition & Lineweaver-Burk',
    parentTopic: 'Metabolism & Bioenergetics',
    subject: 'Biology / Biochemistry',
    incorrectAnswers: 8,
    correctAnswers: 3,
    totalAttempts: 11,
    errorRate: 73,
    commonTrapSummary: 'Confusing Vmax preservation with Km shifts in competitive vs allosteric regulation.',
    lastAttemptedDate: '2026-10-04',
    severity: 'Critical Gap',
  },
  'Action Potential Refractory Period': {
    subTopic: 'Action Potential Refractory Period',
    parentTopic: 'Neuroscience & Electrophysiology',
    subject: 'Biology & Human Physiology',
    incorrectAnswers: 7,
    correctAnswers: 4,
    totalAttempts: 11,
    errorRate: 64,
    commonTrapSummary: 'Mistaking absolute refractory Na+ channel inactivation gates for relative K+ hyperpolarization.',
    lastAttemptedDate: '2026-10-03',
    severity: 'Critical Gap',
  },
  'Rhetorical Antithesis & Speaker Tone': {
    subTopic: 'Rhetorical Antithesis & Speaker Tone',
    parentTopic: 'Rhetorical Devices & Textual Inferences',
    subject: 'English',
    incorrectAnswers: 9,
    correctAnswers: 4,
    totalAttempts: 13,
    errorRate: 69,
    commonTrapSummary: 'Mistaking rhetorical politeness in opening remarks for deferential consensus, missing sharp antithesis.',
    lastAttemptedDate: '2026-10-05',
    severity: 'Critical Gap',
  },
  'Vocabulary-in-Context Nuance': {
    subTopic: 'Vocabulary-in-Context Nuance',
    parentTopic: 'Vocabulary in Context & Nuance Analysis',
    subject: 'English',
    incorrectAnswers: 5,
    correctAnswers: 6,
    totalAttempts: 11,
    errorRate: 45,
    commonTrapSummary: 'Falling for literal primary dictionary definitions instead of secondary archaic or figurative connotations.',
    lastAttemptedDate: '2026-10-04',
    severity: 'Moderate Weakness',
  },
  'Related Rates & Conical Tank Geometry': {
    subTopic: 'Related Rates & Conical Tank Geometry',
    parentTopic: 'Related Rates & Optimization',
    subject: 'Calculus',
    incorrectAnswers: 8,
    correctAnswers: 2,
    totalAttempts: 10,
    errorRate: 80,
    commonTrapSummary: 'Treating conical volume like a constant-radius cylinder; failing to substitute r in terms of h before differentiating.',
    lastAttemptedDate: '2026-10-05',
    severity: 'Critical Gap',
  },
  'Fundamental Theorem & Chain Rule Limits': {
    subTopic: 'Fundamental Theorem & Chain Rule Limits',
    parentTopic: 'Definite Integrals & FTC Part 1/2',
    subject: 'Calculus',
    incorrectAnswers: 6,
    correctAnswers: 5,
    totalAttempts: 11,
    errorRate: 55,
    commonTrapSummary: 'Forgetting to multiply by the inner composite derivative u\'(x) when upper integration limits are variable functions.',
    lastAttemptedDate: '2026-10-04',
    severity: 'Critical Gap',
  },
  'Quadratic Optimization & Vertex Modeling': {
    subTopic: 'Quadratic Optimization & Vertex Modeling',
    parentTopic: 'Quadratic Relations & Polynomial Modeling',
    subject: 'Algebra',
    incorrectAnswers: 6,
    correctAnswers: 5,
    totalAttempts: 11,
    errorRate: 55,
    commonTrapSummary: 'Confusing break-even roots (P(x) = 0) with the maximum profit vertex (-b / (2a)).',
    lastAttemptedDate: '2026-10-03',
    severity: 'Critical Gap',
  },
  'Rational Function Asymptote Singularities': {
    subTopic: 'Rational Function Asymptote Singularities',
    parentTopic: 'Rational Expressions & Asymptotes',
    subject: 'Algebra',
    incorrectAnswers: 3,
    correctAnswers: 8,
    totalAttempts: 11,
    errorRate: 27,
    commonTrapSummary: 'Forgetting to cancel common factors before identifying vertical asymptotes vs removable holes.',
    lastAttemptedDate: '2026-10-02',
    severity: 'Stable',
  },
  'Inscribed Angles & Tangent Theorems': {
    subTopic: 'Inscribed Angles & Tangent Theorems',
    parentTopic: 'Circle Theorems & Inscribed Angles',
    subject: 'Geometry',
    incorrectAnswers: 7,
    correctAnswers: 3,
    totalAttempts: 10,
    errorRate: 70,
    commonTrapSummary: 'Equating inscribed angles directly to central angles instead of dividing the intercepted arc by 2.',
    lastAttemptedDate: '2026-10-04',
    severity: 'Critical Gap',
  },
  'Henderson-Hasselbalch Ratio Inversion': {
    subTopic: 'Henderson-Hasselbalch Ratio Inversion',
    parentTopic: 'Respiratory & Acid-Base Physiology',
    subject: 'Chemistry / Physiology',
    incorrectAnswers: 6,
    correctAnswers: 5,
    totalAttempts: 11,
    errorRate: 55,
    commonTrapSummary: 'Inverting the [base]/[acid] logarithmic ratio during acute metabolic compensation calculations.',
    lastAttemptedDate: '2026-10-03',
    severity: 'Critical Gap',
  },
  'Projectile Velocity Vector Decoupling': {
    subTopic: 'Projectile Velocity Vector Decoupling',
    parentTopic: 'Kinematics & Vector Motion',
    subject: 'Physics',
    incorrectAnswers: 4,
    correctAnswers: 7,
    totalAttempts: 11,
    errorRate: 36,
    commonTrapSummary: 'Applying gravitational acceleration to horizontal velocity components during 2D ballistic trajectories.',
    lastAttemptedDate: '2026-10-01',
    severity: 'Moderate Weakness',
  },
  'Historical Causation vs Temporal Succession': {
    subTopic: 'Historical Causation vs Temporal Succession',
    parentTopic: 'Primary Source Document Analysis',
    subject: 'History',
    incorrectAnswers: 3,
    correctAnswers: 8,
    totalAttempts: 11,
    errorRate: 27,
    commonTrapSummary: 'Committing post hoc ergo propter hoc fallacy when analyzing sequential historical proclamations.',
    lastAttemptedDate: '2026-09-30',
    severity: 'Stable',
  },
};

export const DEFAULT_EXAM_PLAN: ExamPlan = {
  id: 'plan-default-biology',
  createdAt: new Date().toISOString(),
  profile: {
    subject: 'Biology & Human Physiology',
    topics: ['Cell Structure & Energy', 'Photosynthesis & Respiration', 'Genetics & DNA'],
    questionTypes: ['Multiple Choice Questions', 'Short Answer & Definitions', 'Oral Speaking Exam & Questions'],
    examDate: new Date(Date.now() + 21 * 86400000).toISOString().split('T')[0],
    gradeLevel: 'College / University Undergraduate',
    country: 'United States',
  },
  examinerRoastSummary: 'You have 21 days until the exam. Stop passively highlighting slides. The examiner tests core mechanisms and tricky exceptions, not vague buzzwords. Follow this step-by-step level progression daily to pass with 1st Class Honors.',
  daysRemaining: 21,
  dailyStudyTargetMinutes: 60,
  milestones: [
    {
      phase: 'Phase 1: Foundation & Trap Recon',
      title: 'Cell Membranes, Transporters & Action Potentials',
      dayRange: 'Days 1–7',
      focus: 'Master basic phospholipid architecture, sodium-potassium ATPase ion gradients, and absolute refractory periods without getting fooled by distractor traps.',
      actionItems: [
        'Complete 10 daily practice questions on cell membrane transport',
        'Review the 1-minute Action Potential mechanism diagram',
        'Pass 1 strict viva drill with The Angry Examiner on Bohr Effect'
      ]
    },
    {
      phase: 'Phase 2: High-Yield Mechanism Drill',
      title: 'Metabolic Cycles, Respiration & Enzyme Kinetics',
      dayRange: 'Days 8–15',
      focus: 'Drill rate-limiting steps (Phosphofructokinase-1), uncoupling oxidative phosphorylation, and allosteric enzyme inhibition curves.',
      actionItems: [
        'Solve 15 timed multiple-choice questions focusing on glycolysis traps',
        'Explain non-competitive vs competitive inhibition without notes',
        'Complete 20 spaced repetition flashcards on metabolic pathways'
      ]
    },
    {
      phase: 'Phase 3: Brutal Exam Simulation & Polish',
      title: 'Full Cross-Examination & Speed Crucible',
      dayRange: 'Days 16–21',
      focus: 'Endurance testing under strict 60-second pressure timers. Identify examiner traps instantly and eliminate vague waffle phrasing.',
      actionItems: [
        'Simulate a full 60-second pressure interview with the Angry Examiner',
        'Score at least 8/10 on the comprehensive mixed syllabus quiz',
        'Review all flagged bookmarked traps and weak retention areas'
      ]
    }
  ],
  highYieldFocalPoints: [
    'Sodium-Potassium ATPase: 3 Na+ out, 2 K+ in, electrogenic gradient.',
    'Hemoglobin Bohr Shift: Lower pH and higher CO2 shift curve right (lower affinity).',
    'Enzyme Inhibition: Competitive raises Km (Vmax unchanged), Noncompetitive lowers Vmax (Km unchanged).',
    'Cellular Respiration: Complex IV cyanide block vs DNP uncoupling heat dissipation.'
  ],
  recommendedSyllabusTopics: [
    'Neuroscience & Electrophysiology',
    'Respiratory & Acid-Base Physiology',
    'Metabolism & Bioenergetics'
  ]
};

export function getTodayDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export const EXP_RANK_TIERS: RankTierDefinition[] = [
  {
    tierNumber: 1,
    name: 'Confused Freshman',
    minXp: 0,
    maxXp: 300,
    badgeIcon: '🌱',
    color: 'text-slate-300 border-slate-500/40 bg-slate-800/40',
    bgGradient: 'from-slate-700/30 to-slate-900/50',
    motto: 'Stumbling through lecture notes and deciphering the syllabus.',
    perks: ['Access to Standard Practice Drills', 'Basic Active Recall Schedule', 'Mistake Vault logging'],
    divisionTitles: ['Freshman III', 'Freshman II', 'Freshman I'],
  },
  {
    tierNumber: 2,
    name: 'Caffeine-Fueled Crammer',
    minXp: 300,
    maxXp: 800,
    badgeIcon: '☕',
    color: 'text-amber-300 border-amber-500/40 bg-amber-950/40',
    bgGradient: 'from-amber-600/20 to-amber-950/40',
    motto: 'Night owl grinding mechanism flashcards with high caffeine velocity.',
    perks: ['Unlock Spaced Repetition Leitner Boxes', '+5% Bonus XP on daily streak drills', 'Soundscape focus booster presets'],
    divisionTitles: ['Crammer III', 'Crammer II', 'Crammer I'],
  },
  {
    tierNumber: 3,
    name: 'Mechanism Memorizer',
    minXp: 800,
    maxXp: 1600,
    badgeIcon: '⚡',
    color: 'text-cyan-300 border-cyan-500/40 bg-cyan-950/40',
    bgGradient: 'from-cyan-600/20 to-cyan-950/40',
    motto: 'Connecting physiological pathways, ion flows, and feedback loops.',
    perks: ['Adaptive AI Question escalations enabled', 'Unlock Deep Work Pomodoro sessions', 'Sub-topic error analytics breakdown'],
    divisionTitles: ['Scholar III', 'Scholar II', 'Scholar I'],
  },
  {
    tierNumber: 4,
    name: 'Honors Scholar',
    minXp: 1600,
    maxXp: 2800,
    badgeIcon: '🏆',
    color: 'text-purple-300 border-purple-500/40 bg-purple-950/40',
    bgGradient: 'from-purple-600/20 to-purple-950/40',
    motto: 'Effortlessly destroying distractor traps and spotting flaw fallacies.',
    perks: ['Brutal Viva interview mode unlocked', 'Freeze Shield capacity +1', 'Leaderboard Honors Scholar Badge'],
    divisionTitles: ['Honors III', 'Honors II', 'Honors I'],
  },
  {
    tierNumber: 5,
    name: "Examiner's Worst Nightmare",
    minXp: 2800,
    maxXp: 4500,
    badgeIcon: '🔥',
    color: 'text-rose-400 border-rose-500/50 bg-rose-950/50',
    bgGradient: 'from-rose-600/25 to-rose-950/50',
    motto: 'Unshakeable mastery. Stumps the Angry Examiner with razor-sharp precision.',
    perks: ['Nightmare Tier adaptive question crucible', 'Hall of Fame Leaderboard rank', 'Custom Examiner debate gauntlets'],
    divisionTitles: ['Nightmare III', 'Nightmare II', 'Nightmare I'],
  },
  {
    tierNumber: 6,
    name: 'Grandmaster Polymath',
    minXp: 4500,
    maxXp: 10000,
    badgeIcon: '👑',
    color: 'text-amber-400 border-amber-400/60 bg-amber-950/60',
    bgGradient: 'from-amber-500/30 to-rose-950/60',
    motto: 'Apex rank. Complete syllabus retention and universal concept synthesis.',
    perks: ['Crown Icon on global leaderboard', 'Unlimited Streak Shields', 'Honorary Dean of High-Yield Studies'],
    divisionTitles: ['Grandmaster III', 'Grandmaster II', 'Grandmaster I'],
  },
];

export function getRankTierForXp(xp: number): RankTierDefinition {
  const tier = EXP_RANK_TIERS.find(t => xp >= t.minXp && xp < t.maxXp);
  return tier || EXP_RANK_TIERS[EXP_RANK_TIERS.length - 1];
}

export function getLevelInfo(xp: number): {
  level: number;
  title: string;
  nextLevelXp: number;
  progressPercent: number;
  division: string;
  badgeIcon: string;
  currentTier: RankTierDefinition;
  nextTier?: RankTierDefinition;
} {
  const currentTier = getRankTierForXp(xp);
  const nextTierIndex = EXP_RANK_TIERS.findIndex(t => t.tierNumber === currentTier.tierNumber) + 1;
  const nextTier = nextTierIndex < EXP_RANK_TIERS.length ? EXP_RANK_TIERS[nextTierIndex] : undefined;

  const nextLevelXp = currentTier.maxXp;
  const range = currentTier.maxXp - currentTier.minXp;
  const clampedXp = Math.max(currentTier.minXp, xp);
  const progressPercent = Math.min(100, Math.max(0, Math.round(((clampedXp - currentTier.minXp) / range) * 100)));

  // Calculate division within the tier (e.g. III, II, I)
  const divisionIndex = Math.min(
    currentTier.divisionTitles.length - 1,
    Math.floor(((clampedXp - currentTier.minXp) / range) * currentTier.divisionTitles.length)
  );
  const division = currentTier.divisionTitles[divisionIndex] || currentTier.divisionTitles[0];

  return {
    level: currentTier.tierNumber,
    title: currentTier.name,
    nextLevelXp,
    progressPercent,
    division,
    badgeIcon: currentTier.badgeIcon,
    currentTier,
    nextTier,
  };
}

export function generateInitialStudyLog(): {
  log: Record<string, StudyLogEntry>;
  milestoneCompletionDates: Record<number, string>;
  completedMilestones: number[];
} {
  const log: Record<string, StudyLogEntry> = {};
  const milestoneCompletionDates: Record<number, string> = {};
  const completedMilestones: number[] = [0];

  const now = new Date();

  // Helper to format date offset from today
  const getDateStr = (offsetDays: number): string => {
    const d = new Date(now);
    d.setDate(now.getDate() - offsetDays);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Seed realistic consistency matrix for the past 26 days
  const historyPatterns = [
    { offset: 1, quizzes: 3, vivas: 1, xp: 140, minutes: 45 },
    { offset: 2, quizzes: 2, vivas: 1, xp: 110, minutes: 35 },
    { offset: 3, quizzes: 4, vivas: 2, xp: 190, minutes: 60 },
    { offset: 4, quizzes: 5, vivas: 2, xp: 260, minutes: 75, milestoneIndex: 0 }, // Landmark milestone day!
    { offset: 5, quizzes: 2, vivas: 0, xp: 70, minutes: 25 },
    { offset: 6, quizzes: 3, vivas: 1, xp: 130, minutes: 40 },
    { offset: 8, quizzes: 1, vivas: 1, xp: 80, minutes: 20 },
    { offset: 9, quizzes: 4, vivas: 1, xp: 170, minutes: 55 },
    { offset: 11, quizzes: 2, vivas: 1, xp: 100, minutes: 30 },
    { offset: 12, quizzes: 3, vivas: 0, xp: 90, minutes: 30 },
    { offset: 14, quizzes: 2, vivas: 1, xp: 95, minutes: 30 },
    { offset: 15, quizzes: 4, vivas: 2, xp: 200, minutes: 65 },
    { offset: 17, quizzes: 2, vivas: 0, xp: 70, minutes: 20 },
    { offset: 18, quizzes: 3, vivas: 1, xp: 130, minutes: 40 },
    { offset: 20, quizzes: 2, vivas: 1, xp: 90, minutes: 30 },
    { offset: 22, quizzes: 1, vivas: 0, xp: 45, minutes: 15 },
    { offset: 24, quizzes: 3, vivas: 1, xp: 135, minutes: 45 },
    { offset: 25, quizzes: 2, vivas: 1, xp: 105, minutes: 35 },
  ];

  historyPatterns.forEach(item => {
    const dateStr = getDateStr(item.offset);
    const entry: StudyLogEntry = {
      quizzesCount: item.quizzes,
      vivaCount: item.vivas,
      xpEarned: item.xp,
      minutesSpent: item.minutes,
    };

    if (item.milestoneIndex !== undefined) {
      milestoneCompletionDates[item.milestoneIndex] = dateStr;
      entry.milestoneAchieved = {
        index: item.milestoneIndex,
        phase: DEFAULT_EXAM_PLAN.milestones[item.milestoneIndex]?.phase || 'Phase 1: Foundation & Trap Recon',
        title: DEFAULT_EXAM_PLAN.milestones[item.milestoneIndex]?.title || 'Cell Membranes, Transporters & Action Potentials',
      };
    }

    log[dateStr] = entry;
  });

  return { log, milestoneCompletionDates, completedMilestones };
}

export const DEFAULT_MISTAKES_LOG: MistakeRecord[] = [
  {
    id: 'mistake-seed-1',
    source: 'quiz',
    question: 'During active axonal transport, what is the exact net charge movement produced per ATP hydrolyzed by the Na+/K+ ATPase pump?',
    topic: 'Neuroscience & Electrophysiology',
    subject: 'Biology & Physiology',
    options: [
      '3 Na+ extruded, 2 K+ imported (Net +1 outward positive charge)',
      '2 Na+ extruded, 3 K+ imported (Net -1 outward positive charge)',
      '3 Na+ imported, 2 K+ extruded (Net +1 inward positive charge)',
      'Equal exchange of 3 Na+ and 3 K+ (Electroneutral transport)'
    ],
    selectedAnswer: 'Equal exchange of 3 Na+ and 3 K+ (Electroneutral transport)',
    correctAnswer: '3 Na+ extruded, 2 K+ imported (Net +1 outward positive charge)',
    examinerExplanation: 'The Na+/K+ pump is strictly electrogenic. For each molecule of ATP hydrolyzed, it pumps 3 Na+ ions out of the cell and 2 K+ ions into the cell. This net ejection of 1 positive charge directly contributes to maintaining the negative resting membrane potential.',
    trapNote: 'Students frequently confuse electrogenic active transport with electroneutral co-transporters (like NKCC). Remember the 3-2-1 rule: 3 Na OUT, 2 K IN, 1 ATP consumed.',
    timestamp: 'Yesterday at 16:42',
    fixed: false,
    attemptsCount: 1,
  },
  {
    id: 'mistake-seed-2',
    source: 'level-drill',
    question: 'In severe diabetic ketoacidosis with high blood [H+] and elevated CO2, what happens to hemoglobin’s P50 and oxygen affinity?',
    topic: 'Respiratory & Acid-Base Physiology',
    subject: 'Physiology',
    options: [
      'Affinity decreases, P50 increases (Right shift / Bohr effect)',
      'Affinity increases, P50 decreases (Left shift)',
      'Affinity decreases, P50 decreases',
      'Affinity increases, P50 increases'
    ],
    selectedAnswer: 'Affinity increases, P50 decreases (Left shift)',
    correctAnswer: 'Affinity decreases, P50 increases (Right shift / Bohr effect)',
    examinerExplanation: 'Acidosis (high H+) and hypercapnia (high CO2) allosterically stabilize the T (taut/tense) state of deoxyhemoglobin via salt bridges. This shifts the oxygen dissociation curve to the right, lowering affinity so oxygen is unloaded into suffocating peripheral tissues. Because affinity is lower, a HIGHER partial pressure of O2 is required for 50% saturation (P50 increases).',
    trapNote: 'Trap: Inverting the P50 relationship. Remember: higher P50 means WEAKER affinity (it takes more pressure to bind 50%). CADET face right (CO2, Acid, 2,3-DPG, Exercise, Temp).',
    timestamp: 'Yesterday at 18:15',
    fixed: false,
    attemptsCount: 1,
  },
  {
    id: 'mistake-seed-3',
    source: 'session',
    question: 'A pharmacologist adds a reversible competitive inhibitor to an enzyme assay. How does this alter the Lineweaver-Burk double reciprocal plot?',
    topic: 'Enzymology & Pharmacology',
    subject: 'Biochemistry',
    options: [
      'The slope increases; the X-intercept shifts closer to zero; the Y-intercept remains unchanged',
      'The Y-intercept shifts upward; the X-intercept remains unchanged',
      'Both the X-intercept and Y-intercept shift upward by identical factors',
      'The slope decreases while Vmax is permanently halved'
    ],
    selectedAnswer: 'The Y-intercept shifts upward; the X-intercept remains unchanged',
    correctAnswer: 'The slope increases; the X-intercept shifts closer to zero; the Y-intercept remains unchanged',
    examinerExplanation: 'In competitive inhibition, Vmax is unchanged because saturating substrate out-competes the inhibitor. On a Lineweaver-Burk plot (1/v vs 1/[S]), the Y-intercept is 1/Vmax—so it remains unchanged. Km increases, making 1/Km smaller, shifting the negative X-intercept (-1/Km) closer to zero.',
    trapNote: 'Trap: Forgetting that Y-intercept = 1/Vmax and X-intercept = -1/Km. Since Vmax does not change in competitive inhibition, the Y-intercept cannot move!',
    timestamp: '2 days ago',
    fixed: false,
    attemptsCount: 2,
  },
  {
    id: 'mistake-seed-4',
    source: 'examiner',
    question: 'Explain why 2,4-Dinitrophenol (DNP) intoxication causes fatal hyperthermia while Oligomycin causes cellular energy collapse without fever.',
    topic: 'Metabolism & Bioenergetics',
    subject: 'Cell Biology',
    options: [
      'DNP dissipates the inner membrane proton gradient as heat while respiration races uninhibited; Oligomycin blocks ATP synthase directly, halting ETC flux',
      'DNP halts cytochrome c oxidase while Oligomycin uncouples glycolysis',
      'Both agents halt mitochondrial oxygen consumption completely',
      'Oligomycin converts ATP into thermal energy while DNP freezes Complex I'
    ],
    selectedAnswer: 'Both agents halt mitochondrial oxygen consumption completely',
    correctAnswer: 'DNP dissipates the inner membrane proton gradient as heat while respiration races uninhibited; Oligomycin blocks ATP synthase directly, halting ETC flux',
    examinerExplanation: 'DNP is a lipid-soluble proton ionophore that shuttles H+ across the inner mitochondrial membrane, dissipating the proton motive force. The respiratory chain races at maximum velocity trying to pump protons that leak back instantly, dissipating free energy as pure heat. Oligomycin blocks the F0 subunit of ATP synthase, preserving the high gradient which builds up backpressure that stalls the ETC.',
    trapNote: 'Trap: Calling both "respiratory poisons." DNP speeds up oxygen consumption; Oligomycin halts it via respiratory control backpressure.',
    timestamp: '3 days ago',
    fixed: true,
    fixedAt: 'Yesterday at 19:30',
    attemptsCount: 2,
  }
];

export function getDefaultUserStudyState(): UserStudyState {
  const today = getTodayDateString();
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterday = yesterdayDate.toISOString().split('T')[0];
  const initial = generateInitialStudyLog();

  return {
    streak: 4, // Welcoming active streak
    longestStreak: 7,
    lastStudiedDate: yesterday,
    freezeTokens: 2,
    totalXp: 860,
    level: 3,
    levelTitle: 'Mechanism Memorizer',
    todayCompleted: {
      dailyQuiz: false,
      vivaDrill: false,
      flashcards: false,
      lectureNotes: false,
    },
    studyLog: initial.log,
    milestoneCompletionDates: initial.milestoneCompletionDates,
    completedMilestones: initial.completedMilestones,
    topicMastery: {
      'Neuroscience & Electrophysiology': {
        retentionPercent: 88,
        lastReviewedDaysAgo: 1,
        quizzesAttempted: 5,
        vivaAttempted: 2,
      },
      'Metabolism & Bioenergetics': {
        retentionPercent: 74,
        lastReviewedDaysAgo: 3,
        quizzesAttempted: 3,
        vivaAttempted: 1,
      },
      'Respiratory & Acid-Base Physiology': {
        retentionPercent: 92,
        lastReviewedDaysAgo: 0,
        quizzesAttempted: 4,
        vivaAttempted: 2,
      },
      'Renal Physiology': {
        retentionPercent: 65,
        lastReviewedDaysAgo: 4,
        quizzesAttempted: 2,
        vivaAttempted: 1,
      },
      'Cardiovascular Dynamics': {
        retentionPercent: 82,
        lastReviewedDaysAgo: 2,
        quizzesAttempted: 3,
        vivaAttempted: 1,
      },
      'Enzymology & Pharmacology': {
        retentionPercent: 79,
        lastReviewedDaysAgo: 2,
        quizzesAttempted: 2,
        vivaAttempted: 1,
      },
    },
    subTopicPerformance: DEFAULT_SUBTOPIC_PERFORMANCE,
    bookmarkedLectures: ['lec-action-potential', 'lec-acid-base-bohr'],
    recentExaminerScores: [
      { date: yesterday, topic: 'The Bohr Effect', score: 8, verdict: 'SOLID PASS' },
      { date: yesterday, topic: 'Action Potential Gates', score: 6, verdict: 'BORDERLINE PASS' },
    ],
    dailyStudyGoal: {
      targetQuestions: 10,
      targetFlashcards: 15,
      completedQuestions: 4,
      completedFlashcards: 8,
      targetHours: 1.5,
      targetMinutes: 90,
      completedMinutes: 50,
      goalMetricType: 'both',
      lastGoalDate: today,
    },
    activeExamPlan: DEFAULT_EXAM_PLAN,
    activeMilestoneIndex: 0,
    mistakesLog: DEFAULT_MISTAKES_LOG,
    userProfile: DEFAULT_USER_PROFILE,
  };
}

export function loadUserStudyState(): UserStudyState {
  if (typeof window === 'undefined') return getDefaultUserStudyState();

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const def = getDefaultUserStudyState();
      saveUserStudyState(def);
      return def;
    }
    const parsed: UserStudyState = JSON.parse(raw);
    const today = getTodayDateString();

    if (!parsed.userProfile) {
      parsed.userProfile = DEFAULT_USER_PROFILE;
    }

    // Ensure subTopicPerformance exists
    if (!parsed.subTopicPerformance || Object.keys(parsed.subTopicPerformance).length === 0) {
      parsed.subTopicPerformance = DEFAULT_SUBTOPIC_PERFORMANCE;
    }

    // Ensure dailyStudyGoal exists and resets daily
    if (!parsed.dailyStudyGoal) {
      parsed.dailyStudyGoal = {
        targetQuestions: 10,
        targetFlashcards: 15,
        completedQuestions: 0,
        completedFlashcards: 0,
        targetHours: 1.0,
        targetMinutes: 60,
        completedMinutes: 0,
        goalMetricType: 'questions',
        lastGoalDate: today,
      };
    } else {
      if (parsed.dailyStudyGoal.targetHours === undefined) parsed.dailyStudyGoal.targetHours = 1.0;
      if (parsed.dailyStudyGoal.targetMinutes === undefined) {
        parsed.dailyStudyGoal.targetMinutes = Math.round((parsed.dailyStudyGoal.targetHours || 1.0) * 60);
      }
      if (parsed.dailyStudyGoal.completedMinutes === undefined) parsed.dailyStudyGoal.completedMinutes = 0;
      if (!parsed.dailyStudyGoal.goalMetricType) parsed.dailyStudyGoal.goalMetricType = 'questions';

      if (parsed.dailyStudyGoal.lastGoalDate !== today) {
        parsed.dailyStudyGoal.completedQuestions = 0;
        parsed.dailyStudyGoal.completedFlashcards = 0;
        parsed.dailyStudyGoal.completedMinutes = 0;
        parsed.dailyStudyGoal.lastGoalDate = today;
      }
    }

    // Ensure activeExamPlan exists and has valid milestones
    if (!parsed.activeExamPlan || !parsed.activeExamPlan.milestones || parsed.activeExamPlan.milestones.length === 0) {
      parsed.activeExamPlan = DEFAULT_EXAM_PLAN;
    } else if (parsed.activeExamPlan.profile?.examDate) {
      const target = new Date(parsed.activeExamPlan.profile.examDate).getTime();
      const now = new Date().getTime();
      parsed.activeExamPlan.daysRemaining = Math.max(1, Math.ceil((target - now) / (1000 * 60 * 60 * 24)));
    }

    // Reset daily checkboxes if last studied date is not today
    if (parsed.lastStudiedDate !== today) {
      // Check streak continuity
      const lastDate = new Date(parsed.lastStudiedDate);
      const todayDate = new Date(today);
      const diffTime = Math.abs(todayDate.getTime() - lastDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays > 2) {
        // Missed more than 1 day
        if (parsed.freezeTokens > 0) {
          parsed.freezeTokens -= 1;
          // streak preserved by freeze shield!
        } else {
          parsed.streak = 0;
        }
      }

      parsed.todayCompleted = {
        dailyQuiz: false,
        vivaDrill: false,
        flashcards: false,
        lectureNotes: false,
      };
    }

    // Ensure studyLog is richly populated for consistent calendar heatmap visualization
    if (!parsed.studyLog || Object.keys(parsed.studyLog).length <= 2) {
      const initial = generateInitialStudyLog();
      parsed.studyLog = { ...initial.log, ...(parsed.studyLog || {}) };
      if (!parsed.completedMilestones || parsed.completedMilestones.length === 0) {
        parsed.completedMilestones = initial.completedMilestones;
      }
      if (!parsed.milestoneCompletionDates || Object.keys(parsed.milestoneCompletionDates).length === 0) {
        parsed.milestoneCompletionDates = initial.milestoneCompletionDates;
      }
    }
    if (!parsed.milestoneCompletionDates) {
      parsed.milestoneCompletionDates = {};
      if (parsed.completedMilestones && parsed.completedMilestones.length > 0) {
        const initial = generateInitialStudyLog();
        parsed.milestoneCompletionDates = initial.milestoneCompletionDates;
      }
    }

    if (!parsed.mistakesLog || !Array.isArray(parsed.mistakesLog) || parsed.mistakesLog.length === 0) {
      parsed.mistakesLog = DEFAULT_MISTAKES_LOG;
    }

    return parsed;
  } catch (e) {
    console.error('Failed to parse user study state:', e);
    return getDefaultUserStudyState();
  }
}

export function saveUserStudyState(state: UserStudyState): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save state to localStorage:', e);
  }
}

export function recordStudyActivity(
  state: UserStudyState,
  action: 'quiz' | 'viva' | 'flashcard' | 'lecture',
  earnedXp: number,
  topic?: string,
  examinerScore?: { topic: string; score: number; verdict: string },
  count: number = 1
): UserStudyState {
  const today = getTodayDateString();
  const newState = { ...state };

  // Update streak if today is first activity
  if (newState.lastStudiedDate !== today) {
    newState.streak += 1;
    if (newState.streak > newState.longestStreak) {
      newState.longestStreak = newState.streak;
    }
    newState.lastStudiedDate = today;

    // Milestone bonus: every 5 days streak awards 1 freeze shield
    if (newState.streak % 5 === 0) {
      newState.freezeTokens += 1;
    }
  }

  // Mark daily checklist
  if (action === 'quiz') newState.todayCompleted.dailyQuiz = true;
  if (action === 'viva') newState.todayCompleted.vivaDrill = true;
  if (action === 'flashcard') newState.todayCompleted.flashcards = true;
  if (action === 'lecture') newState.todayCompleted.lectureNotes = true;

  // Track daily study goals
  if (!newState.dailyStudyGoal) {
    newState.dailyStudyGoal = {
      targetQuestions: 10,
      targetFlashcards: 15,
      completedQuestions: 0,
      completedFlashcards: 0,
      lastGoalDate: today,
    };
  }
  if (action === 'quiz') {
    newState.dailyStudyGoal.completedQuestions = (newState.dailyStudyGoal.completedQuestions || 0) + count;
  }
  if (action === 'flashcard') {
    newState.dailyStudyGoal.completedFlashcards = (newState.dailyStudyGoal.completedFlashcards || 0) + count;
  }

  // Add XP and recalculate level
  newState.totalXp += earnedXp;
  const levelInfo = getLevelInfo(newState.totalXp);
  newState.level = levelInfo.level;
  newState.levelTitle = levelInfo.title;

  // Record in study log
  if (!newState.studyLog[today]) {
    newState.studyLog[today] = { quizzesCount: 0, vivaCount: 0, xpEarned: 0 };
  }
  if (action === 'quiz') newState.studyLog[today].quizzesCount += count;
  if (action === 'viva') newState.studyLog[today].vivaCount += 1;
  newState.studyLog[today].xpEarned += earnedXp;

  // Update topic mastery
  if (topic) {
    const existing = newState.topicMastery[topic] || {
      retentionPercent: 50,
      lastReviewedDaysAgo: 0,
      quizzesAttempted: 0,
      vivaAttempted: 0,
    };

    const boostedRetention = Math.min(100, existing.retentionPercent + (action === 'viva' ? 20 : 15));
    newState.topicMastery[topic] = {
      ...existing,
      retentionPercent: boostedRetention,
      lastReviewedDaysAgo: 0,
      quizzesAttempted: existing.quizzesAttempted + (action === 'quiz' ? count : 0),
      vivaAttempted: existing.vivaAttempted + (action === 'viva' ? 1 : 0),
    };
  }

  // Record recent examiner score
  if (examinerScore) {
    newState.recentExaminerScores = [
      { date: today, ...examinerScore },
      ...newState.recentExaminerScores.slice(0, 9),
    ];
  }

  saveUserStudyState(newState);
  return newState;
}

export function recordSubTopicQuizResult(
  state: UserStudyState,
  subTopic: string,
  parentTopic: string,
  isCorrect: boolean,
  trapNote?: string,
  subjectOverride?: string
): UserStudyState {
  const today = getTodayDateString();
  const currentMap = state.subTopicPerformance ? { ...state.subTopicPerformance } : { ...DEFAULT_SUBTOPIC_PERFORMANCE };
  const existing = currentMap[subTopic] || {
    subTopic,
    parentTopic: parentTopic || 'General Study',
    subject: subjectOverride || state.activeExamPlan?.profile?.subject || 'General Academic',
    incorrectAnswers: 0,
    correctAnswers: 0,
    totalAttempts: 0,
    errorRate: 0,
    commonTrapSummary: trapNote || 'Conceptual distractor during active recall test.',
    lastAttemptedDate: today,
    severity: 'Stable' as const,
  };

  const newIncorrect = existing.incorrectAnswers + (isCorrect ? 0 : 1);
  const newCorrect = existing.correctAnswers + (isCorrect ? 1 : 0);
  const newTotal = existing.totalAttempts + 1;
  const newErrorRate = Math.round((newIncorrect / newTotal) * 100);

  const newSeverity: 'Critical Gap' | 'Moderate Weakness' | 'Stable' =
    newErrorRate >= 50 && newIncorrect >= 3
      ? 'Critical Gap'
      : newErrorRate >= 30
      ? 'Moderate Weakness'
      : 'Stable';

  const updatedPerf: SubTopicPerformance = {
    ...existing,
    parentTopic: parentTopic || existing.parentTopic,
    subject: subjectOverride || existing.subject,
    incorrectAnswers: newIncorrect,
    correctAnswers: newCorrect,
    totalAttempts: newTotal,
    errorRate: newErrorRate,
    commonTrapSummary: trapNote || existing.commonTrapSummary,
    lastAttemptedDate: today,
    severity: newSeverity,
  };

  const updatedState: UserStudyState = {
    ...state,
    subTopicPerformance: {
      ...currentMap,
      [subTopic]: updatedPerf,
    },
  };

  saveUserStudyState(updatedState);
  return updatedState;
}

export function updateDailyStudyGoal(
  state: UserStudyState,
  targetQuestions: number,
  targetFlashcards: number = 15,
  targetHours: number = 1.0,
  goalMetricType: 'questions' | 'hours' | 'both' = 'questions'
): UserStudyState {
  const today = getTodayDateString();
  const current = state.dailyStudyGoal || {
    targetQuestions: 10,
    targetFlashcards: 15,
    completedQuestions: 0,
    completedFlashcards: 0,
    targetHours: 1.0,
    targetMinutes: 60,
    completedMinutes: 0,
    goalMetricType: 'questions',
    lastGoalDate: today,
  };

  const hours = Math.max(0.25, Math.round(targetHours * 100) / 100);
  const minutes = Math.round(hours * 60);

  const updated: UserStudyState = {
    ...state,
    dailyStudyGoal: {
      ...current,
      targetQuestions: Math.max(1, targetQuestions),
      targetFlashcards: Math.max(1, targetFlashcards),
      targetHours: hours,
      targetMinutes: minutes,
      goalMetricType,
    },
  };

  saveUserStudyState(updated);
  return updated;
}

export function updateDailyStudyTargetMinutes(
  state: UserStudyState,
  targetMinutes: number
): UserStudyState {
  const today = getTodayDateString();
  const current = state.dailyStudyGoal || {
    targetQuestions: 10,
    targetFlashcards: 15,
    completedQuestions: 0,
    completedFlashcards: 0,
    targetHours: 1.0,
    targetMinutes: 60,
    completedMinutes: 0,
    goalMetricType: 'hours',
    lastGoalDate: today,
  };

  const clampedMinutes = Math.max(5, Math.min(720, Math.round(targetMinutes)));
  const updated: UserStudyState = {
    ...state,
    dailyStudyGoal: {
      ...current,
      targetMinutes: clampedMinutes,
      targetHours: Math.round((clampedMinutes / 60) * 100) / 100,
    },
  };

  saveUserStudyState(updated);
  return updated;
}

export function recordStudyMinutes(
  state: UserStudyState,
  minutesToAdd: number
): UserStudyState {
  const today = getTodayDateString();
  const current = state.dailyStudyGoal || {
    targetQuestions: 10,
    targetFlashcards: 15,
    completedQuestions: 0,
    completedFlashcards: 0,
    targetHours: 1.0,
    targetMinutes: 60,
    completedMinutes: 0,
    goalMetricType: 'hours',
    lastGoalDate: today,
  };

  const earnedXp = Math.round(minutesToAdd * 2); // 2 XP per minute of active study
  const newMinutes = Math.max(0, (current.completedMinutes || 0) + minutesToAdd);

  // Update streak if today is first activity
  let streak = state.streak;
  let longestStreak = state.longestStreak;
  let lastStudiedDate = state.lastStudiedDate;
  if (lastStudiedDate !== today && minutesToAdd > 0) {
    streak += 1;
    if (streak > longestStreak) longestStreak = streak;
    lastStudiedDate = today;
  }

  const updatedStudyLog = { ...state.studyLog };
  if (!updatedStudyLog[today]) {
    updatedStudyLog[today] = { quizzesCount: 0, vivaCount: 0, xpEarned: 0, minutesSpent: 0 };
  }
  updatedStudyLog[today].minutesSpent = (updatedStudyLog[today].minutesSpent || 0) + minutesToAdd;
  updatedStudyLog[today].xpEarned += earnedXp;

  const newTotalXp = state.totalXp + earnedXp;
  const levelInfo = getLevelInfo(newTotalXp);

  const updated: UserStudyState = {
    ...state,
    streak,
    longestStreak,
    lastStudiedDate,
    totalXp: newTotalXp,
    level: levelInfo.level,
    levelTitle: levelInfo.title,
    studyLog: updatedStudyLog,
    dailyStudyGoal: {
      ...current,
      completedMinutes: newMinutes,
    },
  };

  saveUserStudyState(updated);
  return updated;
}

export function recordQuickQuestionCount(
  state: UserStudyState,
  countToAdd: number
): UserStudyState {
  const today = getTodayDateString();
  const current = state.dailyStudyGoal || {
    targetQuestions: 10,
    targetFlashcards: 15,
    completedQuestions: 0,
    completedFlashcards: 0,
    targetHours: 1.0,
    completedMinutes: 0,
    goalMetricType: 'questions',
    lastGoalDate: today,
  };

  const updated: UserStudyState = {
    ...state,
    dailyStudyGoal: {
      ...current,
      completedQuestions: Math.max(0, (current.completedQuestions || 0) + countToAdd),
    },
  };

  saveUserStudyState(updated);
  return updated;
}

export function recordDeepWorkPomodoroCompletion(
  state: UserStudyState,
  minutesCompleted: number,
  isUninterrupted: boolean,
  completedCycles: number,
  topic?: string
): { updatedState: UserStudyState; xpAwarded: number; earnedFreezeShield: boolean } {
  const today = getTodayDateString();
  const newState = { ...state };
  let xpAwarded = Math.round(minutesCompleted * 2); // 2 XP per focus minute

  if (isUninterrupted) {
    xpAwarded = Math.round(xpAwarded * 1.25); // +25% bonus for zero tab-switching
  }

  // Update streak if today is first activity
  if (newState.lastStudiedDate !== today) {
    newState.streak += 1;
    newState.lastStudiedDate = today;
    if (newState.streak > newState.longestStreak) {
      newState.longestStreak = newState.streak;
    }
  }

  // Record study minutes in daily goal
  if (!newState.dailyStudyGoal) {
    newState.dailyStudyGoal = {
      targetQuestions: 10,
      targetFlashcards: 15,
      completedQuestions: 0,
      completedFlashcards: 0,
      targetHours: 1.0,
      completedMinutes: 0,
      goalMetricType: 'hours',
      lastGoalDate: today,
    };
  }
  newState.dailyStudyGoal.completedMinutes = (newState.dailyStudyGoal.completedMinutes || 0) + minutesCompleted;

  // Award knowledge XP and update level
  newState.totalXp += xpAwarded;
  const levelInfo = getLevelInfo(newState.totalXp);
  newState.level = levelInfo.level;
  newState.levelTitle = levelInfo.title;

  // Record in study log
  if (!newState.studyLog[today]) {
    newState.studyLog[today] = { quizzesCount: 0, vivaCount: 0, xpEarned: 0, minutesSpent: 0 };
  }
  newState.studyLog[today].xpEarned += xpAwarded;
  newState.studyLog[today].minutesSpent = (newState.studyLog[today].minutesSpent || 0) + minutesCompleted;

  // Freeze shield milestone reward: 4 completed cycles grant +1 freeze shield
  let earnedFreezeShield = false;
  if (completedCycles > 0 && completedCycles % 4 === 0 && isUninterrupted) {
    newState.freezeTokens += 1;
    earnedFreezeShield = true;
  }

  saveUserStudyState(newState);
  return { updatedState: newState, xpAwarded, earnedFreezeShield };
}

export function resetEntireProgress(): UserStudyState {
  const today = getTodayDateString();
  const resetState: UserStudyState = {
    streak: 0,
    longestStreak: 0,
    lastStudiedDate: '',
    freezeTokens: 1,
    totalXp: 0,
    level: 1,
    levelTitle: 'Confused Freshman',
    todayCompleted: {
      dailyQuiz: false,
      vivaDrill: false,
      flashcards: false,
      lectureNotes: false,
    },
    dailyStudyGoal: {
      targetQuestions: 10,
      targetFlashcards: 15,
      completedQuestions: 0,
      completedFlashcards: 0,
      lastGoalDate: today,
    },
    studyLog: {},
    topicMastery: {},
    subTopicPerformance: DEFAULT_SUBTOPIC_PERFORMANCE,
    bookmarkedLectures: [],
    recentExaminerScores: [],
    activeExamPlan: null,
    completedMilestones: [],
    activeMilestoneIndex: 0,
    mistakesLog: DEFAULT_MISTAKES_LOG,
  };

  saveUserStudyState(resetState);

  try {
    localStorage.removeItem('the_angry_scholar_custom_cards');
  } catch (e) {}

  return resetState;
}

export function toggleMilestoneCompletion(
  state: UserStudyState,
  milestoneIndex: number,
  rewardXp = 150
): UserStudyState {
  const currentCompleted = state.completedMilestones || [];
  const isAlreadyCompleted = currentCompleted.includes(milestoneIndex);
  const today = getTodayDateString();

  let updatedCompleted: number[];
  const updatedDates: Record<number, string> = { ...(state.milestoneCompletionDates || {}) };
  const updatedStudyLog: Record<string, StudyLogEntry> = { ...state.studyLog };
  let xpDiff = 0;

  if (isAlreadyCompleted) {
    updatedCompleted = currentCompleted.filter(i => i !== milestoneIndex);
    const prevDate = updatedDates[milestoneIndex];
    delete updatedDates[milestoneIndex];
    if (prevDate && updatedStudyLog[prevDate]?.milestoneAchieved?.index === milestoneIndex) {
      delete updatedStudyLog[prevDate].milestoneAchieved;
    }
    xpDiff = -rewardXp;
  } else {
    updatedCompleted = [...currentCompleted, milestoneIndex];
    updatedDates[milestoneIndex] = today;
    xpDiff = rewardXp;

    // Record milestone unlock in today's study log entry
    const milestoneInfo = state.activeExamPlan?.milestones[milestoneIndex];
    if (!updatedStudyLog[today]) {
      updatedStudyLog[today] = { quizzesCount: 0, vivaCount: 0, xpEarned: rewardXp, minutesSpent: 15 };
    } else {
      updatedStudyLog[today].xpEarned += rewardXp;
    }
    if (milestoneInfo) {
      updatedStudyLog[today].milestoneAchieved = {
        index: milestoneIndex,
        phase: milestoneInfo.phase,
        title: milestoneInfo.title,
      };
    }
  }

  const updated: UserStudyState = {
    ...state,
    completedMilestones: updatedCompleted,
    milestoneCompletionDates: updatedDates,
    studyLog: updatedStudyLog,
    totalXp: Math.max(0, state.totalXp + xpDiff),
  };

  saveUserStudyState(updated);
  return updated;
}

export function setActiveMilestoneLevel(
  state: UserStudyState,
  milestoneIndex: number
): UserStudyState {
  const updated: UserStudyState = {
    ...state,
    activeMilestoneIndex: milestoneIndex,
  };
  saveUserStudyState(updated);
  return updated;
}

export function recordMistake(
  state: UserStudyState,
  mistake: Omit<MistakeRecord, 'id' | 'timestamp' | 'fixed' | 'attemptsCount'>
): UserStudyState {
  const currentLogs = state.mistakesLog ? [...state.mistakesLog] : [...DEFAULT_MISTAKES_LOG];
  const existingIdx = currentLogs.findIndex(
    m => m.question.toLowerCase().trim() === mistake.question.toLowerCase().trim()
  );

  const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ', Today';

  if (existingIdx >= 0) {
    const existing = currentLogs[existingIdx];
    currentLogs[existingIdx] = {
      ...existing,
      ...mistake,
      fixed: false,
      timestamp,
      attemptsCount: (existing.attemptsCount || 1) + 1,
    };
  } else {
    const newRecord: MistakeRecord = {
      ...mistake,
      id: `mistake-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      timestamp,
      fixed: false,
      attemptsCount: 1,
    };
    currentLogs.unshift(newRecord);
  }

  const updated: UserStudyState = {
    ...state,
    mistakesLog: currentLogs,
  };
  saveUserStudyState(updated);
  return updated;
}

export function markMistakeFixed(
  state: UserStudyState,
  mistakeId: string
): UserStudyState {
  const currentLogs = state.mistakesLog ? [...state.mistakesLog] : [...DEFAULT_MISTAKES_LOG];
  const idx = currentLogs.findIndex(m => m.id === mistakeId);
  if (idx < 0) return state;

  currentLogs[idx] = {
    ...currentLogs[idx],
    fixed: true,
    fixedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ', Today',
  };

  const updated: UserStudyState = {
    ...state,
    mistakesLog: currentLogs,
  };
  saveUserStudyState(updated);
  return updated;
}

export function recordMistakeAttempt(
  state: UserStudyState,
  mistakeId: string,
  isCorrect: boolean
): { updatedState: UserStudyState; isNewlyFixed: boolean } {
  const currentLogs = state.mistakesLog ? [...state.mistakesLog] : [...DEFAULT_MISTAKES_LOG];
  const idx = currentLogs.findIndex(m => m.id === mistakeId);
  if (idx < 0) return { updatedState: state, isNewlyFixed: false };

  const prevFixed = currentLogs[idx].fixed;
  const isNewlyFixed = !prevFixed && isCorrect;

  currentLogs[idx] = {
    ...currentLogs[idx],
    attemptsCount: (currentLogs[idx].attemptsCount || 1) + 1,
    fixed: isCorrect ? true : currentLogs[idx].fixed,
    fixedAt: isCorrect ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ', Today' : currentLogs[idx].fixedAt,
  };

  const updatedState: UserStudyState = {
    ...state,
    mistakesLog: currentLogs,
  };
  saveUserStudyState(updatedState);
  return { updatedState, isNewlyFixed };
}

export function deleteMistake(
  state: UserStudyState,
  mistakeId: string
): UserStudyState {
  const currentLogs = state.mistakesLog ? [...state.mistakesLog] : [...DEFAULT_MISTAKES_LOG];
  const filtered = currentLogs.filter(m => m.id !== mistakeId);
  const updated: UserStudyState = {
    ...state,
    mistakesLog: filtered,
  };
  saveUserStudyState(updated);
  return updated;
}

export function clearMasteredMistakes(
  state: UserStudyState
): UserStudyState {
  const currentLogs = state.mistakesLog ? [...state.mistakesLog] : [...DEFAULT_MISTAKES_LOG];
  const filtered = currentLogs.filter(m => !m.fixed);
  const updated: UserStudyState = {
    ...state,
    mistakesLog: filtered,
  };
  saveUserStudyState(updated);
  return updated;
}

export function addCustomMistake(
  state: UserStudyState,
  mistakeData: {
    question: string;
    topic: string;
    subject?: string;
    options: string[];
    selectedAnswer: string;
    correctAnswer: string;
    examinerExplanation: string;
    trapNote?: string;
    source?: 'quiz' | 'level-drill' | 'session' | 'examiner' | 'manual';
  }
): UserStudyState {
  const currentLogs = state.mistakesLog ? [...state.mistakesLog] : [...DEFAULT_MISTAKES_LOG];
  const newRecord: MistakeRecord = {
    id: `mistake-manual-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    source: mistakeData.source || 'manual',
    question: mistakeData.question,
    topic: mistakeData.topic,
    subject: mistakeData.subject || state.activeExamPlan?.profile?.subject || 'Exam Syllabus',
    options: mistakeData.options,
    selectedAnswer: mistakeData.selectedAnswer,
    correctAnswer: mistakeData.correctAnswer,
    examinerExplanation: mistakeData.examinerExplanation,
    trapNote: mistakeData.trapNote || 'Personal logged mistake from mock exam or problem set.',
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ', Today',
    fixed: false,
    attemptsCount: 1,
  };
  currentLogs.unshift(newRecord);

  const updated: UserStudyState = {
    ...state,
    mistakesLog: currentLogs,
  };
  saveUserStudyState(updated);
  return updated;
}

export const ONLINE_COMMUNITY_MEMBERS: Array<Omit<LeaderboardEntry, 'isCurrentUser'>> = [
  {
    id: 'usr-1',
    username: 'neuro_cadence',
    displayName: 'Aria Vance',
    avatarSeed: 'Aria',
    stickFigure: {
      headwear: 'grad-cap',
      expression: 'sparkle',
      pose: 'reading',
      outfit: 'lab-coat',
      colorTheme: 'purple',
      bgShape: 'hexagon',
      bgTheme: 'cosmic-star',
      lineWidth: 2.5,
    },
    motto: 'Synapses that fire together wire together',
    totalXp: 5420,
    weeklyXp: 1120,
    streakDays: 42,
    rankTierName: 'Grandmaster Polymath',
    tierNumber: 6,
    division: 'Grandmaster II',
    country: 'United States',
    verifiedOnline: true,
    accuracyRate: 96,
  },
  {
    id: 'usr-2',
    username: 'cardio_dr_z',
    displayName: 'Dr. Tariq Al-Mansoor',
    avatarSeed: 'Tariq',
    stickFigure: {
      headwear: 'none',
      expression: 'glasses',
      pose: 'pencil',
      outfit: 'lab-coat',
      colorTheme: 'cyan',
      bgShape: 'shield',
      bgTheme: 'emerald-mint',
      lineWidth: 2.5,
    },
    motto: 'Always know the vector of depolarisation',
    totalXp: 4890,
    weeklyXp: 980,
    streakDays: 31,
    rankTierName: 'Grandmaster Polymath',
    tierNumber: 6,
    division: 'Grandmaster I',
    country: 'United Kingdom',
    verifiedOnline: true,
    accuracyRate: 94,
  },
  {
    id: 'usr-3',
    username: 'biochem_beast',
    displayName: 'Elena Rostova',
    avatarSeed: 'Elena',
    stickFigure: {
      headwear: 'beanie',
      expression: 'happy',
      pose: 'coffee',
      outfit: 'hoodie',
      colorTheme: 'amber',
      bgShape: 'circle',
      bgTheme: 'sunset',
      lineWidth: 2.5,
    },
    motto: 'Caffeine, Krebs Cycle, Repeat',
    totalXp: 3820,
    weeklyXp: 840,
    streakDays: 24,
    rankTierName: "Examiner's Worst Nightmare",
    tierNumber: 5,
    division: 'Nightmare III',
    country: 'Canada',
    verifiedOnline: true,
    accuracyRate: 92,
  },
  {
    id: 'usr-4',
    username: 'calculus_titan',
    displayName: 'Marcus Sterling',
    avatarSeed: 'Marcus',
    stickFigure: {
      headwear: 'headphones',
      expression: 'sunglasses',
      pose: 'laptop',
      outfit: 'cape',
      colorTheme: 'blue',
      bgShape: 'rounded',
      bgTheme: 'neon-cyber',
      lineWidth: 2.5,
    },
    motto: 'Taylor series approximations save lives',
    totalXp: 3340,
    weeklyXp: 720,
    streakDays: 19,
    rankTierName: "Examiner's Worst Nightmare",
    tierNumber: 5,
    division: 'Nightmare II',
    country: 'Australia',
    verifiedOnline: false,
    accuracyRate: 91,
  },
  {
    id: 'usr-5',
    username: 'cell_machinist',
    displayName: 'Soo-Jin Park',
    avatarSeed: 'SooJin',
    stickFigure: {
      headwear: 'curly-hair',
      expression: 'focused',
      pose: 'thumbs-up',
      outfit: 'bowtie',
      colorTheme: 'emerald',
      bgShape: 'shield',
      bgTheme: 'amber-glow',
      lineWidth: 2.5,
    },
    motto: 'Mitochondria: ATP powerhouses unite',
    totalXp: 2610,
    weeklyXp: 610,
    streakDays: 16,
    rankTierName: 'Honors Scholar',
    tierNumber: 4,
    division: 'Honors III',
    country: 'South Korea',
    verifiedOnline: true,
    accuracyRate: 89,
  },
  {
    id: 'usr-6',
    username: 'quantum_scribe',
    displayName: 'Devon Patel',
    avatarSeed: 'Devon',
    stickFigure: {
      headwear: 'spiky-hair',
      expression: 'sparkle',
      pose: 'thinking',
      outfit: 'scarf',
      colorTheme: 'orange',
      bgShape: 'hexagon',
      bgTheme: 'dark-slate',
      lineWidth: 2.5,
    },
    motto: 'Entropy is inevitable; bad grades are not',
    totalXp: 2150,
    weeklyXp: 540,
    streakDays: 14,
    rankTierName: 'Honors Scholar',
    tierNumber: 4,
    division: 'Honors II',
    country: 'India',
    verifiedOnline: true,
    accuracyRate: 88,
  },
  {
    id: 'usr-7',
    username: 'lit_archetype',
    displayName: 'Clara Delacroix',
    avatarSeed: 'Clara',
    stickFigure: {
      headwear: 'top-hat',
      expression: 'monocle',
      pose: 'reading',
      outfit: 'tie',
      colorTheme: 'purple',
      bgShape: 'circle',
      bgTheme: 'cosmic-star',
      lineWidth: 2.5,
    },
    motto: 'Read between the lines and crush the distractors',
    totalXp: 1840,
    weeklyXp: 490,
    streakDays: 12,
    rankTierName: 'Honors Scholar',
    tierNumber: 4,
    division: 'Honors I',
    country: 'France',
    verifiedOnline: false,
    accuracyRate: 87,
  },
  {
    id: 'usr-8',
    username: 'pathology_pro',
    displayName: 'Julian Chen',
    avatarSeed: 'Julian',
    stickFigure: {
      headwear: 'baseball-cap',
      expression: 'happy',
      pose: 'pencil',
      outfit: 'hoodie',
      colorTheme: 'cyan',
      bgShape: 'rounded',
      bgTheme: 'neon-cyber',
      lineWidth: 2.5,
    },
    motto: 'Spot the histological hallmarks',
    totalXp: 1390,
    weeklyXp: 410,
    streakDays: 9,
    rankTierName: 'Mechanism Memorizer',
    tierNumber: 3,
    division: 'Scholar III',
    country: 'Singapore',
    verifiedOnline: true,
    accuracyRate: 86,
  },
  {
    id: 'usr-9',
    username: 'syntax_samurai',
    displayName: 'Mateo Morales',
    avatarSeed: 'Mateo',
    stickFigure: {
      headwear: 'headband',
      expression: 'focused',
      pose: 'sword',
      outfit: 'belt',
      colorTheme: 'rose',
      bgShape: 'hexagon',
      bgTheme: 'chalkboard',
      lineWidth: 2.5,
    },
    motto: 'O(1) lookup or bust',
    totalXp: 980,
    weeklyXp: 350,
    streakDays: 7,
    rankTierName: 'Mechanism Memorizer',
    tierNumber: 3,
    division: 'Scholar II',
    country: 'Spain',
    verifiedOnline: false,
    accuracyRate: 84,
  },
  {
    id: 'usr-10',
    username: 'renal_acid_base',
    displayName: 'Fatima Zahra',
    avatarSeed: 'Fatima',
    stickFigure: {
      headwear: 'none',
      expression: 'glasses',
      pose: 'hands-on-hips',
      outfit: 'tie',
      colorTheme: 'emerald',
      bgShape: 'circle',
      bgTheme: 'amber-glow',
      lineWidth: 2.5,
    },
    motto: 'Bicarbonate buffers will always bail you out',
    totalXp: 720,
    weeklyXp: 290,
    streakDays: 5,
    rankTierName: 'Caffeine-Fueled Crammer',
    tierNumber: 2,
    division: 'Crammer III',
    country: 'Morocco',
    verifiedOnline: true,
    accuracyRate: 82,
  },
  {
    id: 'usr-11',
    username: 'chem_covalent',
    displayName: 'Liam O’Connor',
    avatarSeed: 'Liam',
    stickFigure: {
      headwear: 'beanie',
      expression: 'derp',
      pose: 'thumbs-up',
      outfit: 'scarf',
      colorTheme: 'amber',
      bgShape: 'rounded',
      bgTheme: 'dark-slate',
      lineWidth: 2.5,
    },
    motto: 'Curly arrows only point where electrons go',
    totalXp: 510,
    weeklyXp: 210,
    streakDays: 3,
    rankTierName: 'Caffeine-Fueled Crammer',
    tierNumber: 2,
    division: 'Crammer II',
    country: 'Ireland',
    verifiedOnline: false,
    accuracyRate: 80,
  },
  {
    id: 'usr-12',
    username: 'fresh_aspirant',
    displayName: 'Zoe Lindqvist',
    avatarSeed: 'Zoe',
    stickFigure: {
      headwear: 'party-hat',
      expression: 'happy',
      pose: 'victory',
      outfit: 'none',
      colorTheme: 'chalk',
      bgShape: 'circle',
      bgTheme: 'chalkboard',
      lineWidth: 2.5,
    },
    motto: 'Just started, but aiming for the top podium',
    totalXp: 220,
    weeklyXp: 140,
    streakDays: 2,
    rankTierName: 'Confused Freshman',
    tierNumber: 1,
    division: 'Freshman II',
    country: 'Sweden',
    verifiedOnline: true,
    accuracyRate: 78,
  },
];

export function updateUserProfile(
  state: UserStudyState,
  profile: UserProfileCustomization
): UserStudyState {
  const updated: UserStudyState = {
    ...state,
    userProfile: profile,
  };
  saveUserStudyState(updated);
  return updated;
}

export function getUserProfile(state: UserStudyState): UserProfileCustomization {
  return state.userProfile || DEFAULT_USER_PROFILE;
}

export function getFullLeaderboard(userState: UserStudyState, customUserName?: string): {
  entries: LeaderboardEntry[];
  userRank: number;
  userWeeklyRank: number;
} {
  const userLevel = getLevelInfo(userState.totalXp);
  const profile = userState.userProfile || DEFAULT_USER_PROFILE;
  
  // Estimate user's weekly XP based on recent 7 days in studyLog
  const now = new Date();
  let calculatedWeeklyXp = 0;
  for (let i = 0; i < 7; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const iso = d.toISOString().split('T')[0];
    const log = userState.studyLog[iso];
    if (log) {
      calculatedWeeklyXp += log.xpEarned || 0;
    }
  }
  // Ensure minimum realistic weekly baseline if new
  const userWeeklyXp = Math.max(calculatedWeeklyXp, Math.min(userState.totalXp, 280));

  const currentUserEntry: LeaderboardEntry = {
    id: 'user-current-session',
    username: profile.username || 'you_scholar',
    displayName: customUserName || profile.displayName || 'You (Scholar)',
    avatarSeed: 'You',
    stickFigure: profile.stickFigure || DEFAULT_STICK_FIGURE,
    motto: profile.titleMotto || 'Grinding for 1st Class Honors',
    totalXp: userState.totalXp,
    weeklyXp: userWeeklyXp,
    streakDays: userState.streak,
    rankTierName: userLevel.title,
    tierNumber: userLevel.level,
    division: userLevel.division,
    topSubject: userState.activeExamPlan?.profile?.subject || 'STEM & Medical Physiology',
    country: userState.activeExamPlan?.profile?.country || 'Global Student',
    verifiedOnline: true,
    accuracyRate: 88,
    isCurrentUser: true,
  };

  // Merge community + current user, and sort by total XP
  const allEntries: LeaderboardEntry[] = [
    ...ONLINE_COMMUNITY_MEMBERS.map(m => ({ ...m, isCurrentUser: false })),
    currentUserEntry,
  ];

  // Sorted by total XP descending
  allEntries.sort((a, b) => b.totalXp - a.totalXp);

  const userRank = allEntries.findIndex(e => e.isCurrentUser) + 1;

  // Clone and sort for weekly rank
  const weeklySorted = [...allEntries].sort((a, b) => b.weeklyXp - a.weeklyXp);
  const userWeeklyRank = weeklySorted.findIndex(e => e.isCurrentUser) + 1;

  return {
    entries: allEntries,
    userRank,
    userWeeklyRank,
  };
}

