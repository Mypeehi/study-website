import { UserStudyState, AchievementBadge, AchievementCategory, AchievementTier, AchievementRarity } from '../types';

export interface AchievementConfig {
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
  targetValue: number;
  unit: string;
  loreQuote: string;
  calculateProgress: (state: UserStudyState) => { current: number; isUnlocked: boolean };
}

export interface RarityVisualConfig {
  name: AchievementRarity;
  label: string;
  tagBg: string;
  tagBorder: string;
  tagText: string;
  badgeGlow: string;
  badgeGlowUnlocked: string;
  badgeGlowHover: string;
  borderGradient: string;
  cardBorderGradient: string;
  cardBgGradient: string;
  emblemRing: string;
  accentColor: string;
  sparkleSymbol: string;
  loreLabel: string;
}

export const ACHIEVEMENT_RARITIES: Record<AchievementRarity, RarityVisualConfig> = {
  Common: {
    name: 'Common',
    label: 'Common',
    tagBg: 'bg-slate-800/80',
    tagBorder: 'border-slate-700/80',
    tagText: 'text-slate-300',
    badgeGlow: 'shadow-[0_0_12px_rgba(100,116,139,0.16)]',
    badgeGlowUnlocked: 'shadow-[0_0_20px_rgba(148,163,184,0.35)]',
    badgeGlowHover: 'hover:shadow-[0_0_20px_rgba(148,163,184,0.3)]',
    borderGradient: 'from-slate-700 via-slate-600 to-slate-800',
    cardBorderGradient: 'from-slate-700/60 via-slate-600/40 to-slate-800/60',
    cardBgGradient: 'from-slate-900/90 to-slate-950/90',
    emblemRing: 'border-slate-600/60 shadow-[0_0_10px_rgba(148,163,184,0.15)]',
    accentColor: '#94a3b8',
    sparkleSymbol: '✦',
    loreLabel: 'Foundational Knowledge',
  },
  Rare: {
    name: 'Rare',
    label: 'Rare',
    tagBg: 'bg-cyan-950/70',
    tagBorder: 'border-cyan-500/40',
    tagText: 'text-cyan-300',
    badgeGlow: 'shadow-[0_0_22px_rgba(6,182,212,0.32)]',
    badgeGlowUnlocked: 'shadow-[0_0_35px_rgba(6,182,212,0.6),0_0_12px_rgba(56,189,248,0.45)]',
    badgeGlowHover: 'hover:shadow-[0_0_35px_rgba(6,182,212,0.55),0_0_15px_rgba(56,189,248,0.4)]',
    borderGradient: 'from-cyan-400 via-blue-500 to-indigo-500',
    cardBorderGradient: 'from-cyan-400/80 via-blue-500/60 to-indigo-500/80',
    cardBgGradient: 'from-cyan-950/30 via-slate-950 to-blue-950/20',
    emblemRing: 'border-cyan-400 shadow-[0_0_18px_rgba(6,182,212,0.4)]',
    accentColor: '#22d3ee',
    sparkleSymbol: '💎',
    loreLabel: 'Deep Synaptic Encoding',
  },
  Epic: {
    name: 'Epic',
    label: 'Epic',
    tagBg: 'bg-purple-950/70',
    tagBorder: 'border-purple-500/40',
    tagText: 'text-purple-300',
    badgeGlow: 'shadow-[0_0_26px_rgba(168,85,247,0.38)]',
    badgeGlowUnlocked: 'shadow-[0_0_40px_rgba(168,85,247,0.65),0_0_15px_rgba(236,72,153,0.5)]',
    badgeGlowHover: 'hover:shadow-[0_0_42px_rgba(168,85,247,0.6),0_0_18px_rgba(236,72,153,0.45)]',
    borderGradient: 'from-purple-400 via-fuchsia-500 to-pink-500',
    cardBorderGradient: 'from-purple-400/80 via-fuchsia-500/60 to-pink-500/80',
    cardBgGradient: 'from-purple-950/35 via-slate-950 to-fuchsia-950/20',
    emblemRing: 'border-purple-400 shadow-[0_0_22px_rgba(168,85,247,0.45)]',
    accentColor: '#c084fc',
    sparkleSymbol: '🔮',
    loreLabel: 'Advanced Cognitive Synthesis',
  },
  Legendary: {
    name: 'Legendary',
    label: 'Legendary',
    tagBg: 'bg-amber-950/80',
    tagBorder: 'border-amber-400/70',
    tagText: 'text-amber-300',
    badgeGlow: 'shadow-[0_0_30px_rgba(245,158,11,0.5),0_0_12px_rgba(251,191,36,0.35)]',
    badgeGlowUnlocked: 'shadow-[0_0_48px_rgba(245,158,11,0.75),0_0_20px_rgba(251,191,36,0.6),inset_0_0_15px_rgba(245,158,11,0.25)]',
    badgeGlowHover: 'hover:shadow-[0_0_55px_rgba(245,158,11,0.8),0_0_25px_rgba(251,191,36,0.65)]',
    borderGradient: 'from-amber-400 via-yellow-300 to-orange-500',
    cardBorderGradient: 'from-amber-400 via-yellow-300 to-orange-500',
    cardBgGradient: 'from-amber-950/40 via-slate-950 to-orange-950/25',
    emblemRing: 'border-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.65)] ring-2 ring-amber-400/40',
    accentColor: '#f59e0b',
    sparkleSymbol: '👑',
    loreLabel: 'Grandmaster Intellectual Mastery',
  },
};

export const ACHIEVEMENT_TIERS: Record<AchievementTier, {
  name: AchievementTier;
  label: string;
  badgeBg: string;
  borderColor: string;
  textColor: string;
  glowColor: string;
  ribbonBg: string;
}> = {
  Bronze: {
    name: 'Bronze',
    label: 'Bronze Tier',
    badgeBg: 'from-amber-950/40 via-stone-900 to-amber-900/20',
    borderColor: 'border-amber-700/60',
    textColor: 'text-amber-400',
    glowColor: 'shadow-amber-900/20',
    ribbonBg: 'bg-amber-900/80 text-amber-200 border-amber-700/50',
  },
  Silver: {
    name: 'Silver',
    label: 'Silver Tier',
    badgeBg: 'from-slate-800 via-slate-900 to-slate-800/40',
    borderColor: 'border-slate-400/50',
    textColor: 'text-slate-200',
    glowColor: 'shadow-slate-500/20',
    ribbonBg: 'bg-slate-800 text-slate-200 border-slate-600/50',
  },
  Gold: {
    name: 'Gold',
    label: 'Gold Tier',
    badgeBg: 'from-amber-500/20 via-slate-900 to-yellow-500/10',
    borderColor: 'border-amber-400/80',
    textColor: 'text-amber-300',
    glowColor: 'shadow-amber-500/30',
    ribbonBg: 'bg-amber-500/30 text-amber-200 border-amber-400/60',
  },
  Platinum: {
    name: 'Platinum',
    label: 'Platinum Tier',
    badgeBg: 'from-cyan-950/40 via-slate-900 to-emerald-950/30',
    borderColor: 'border-cyan-400/70',
    textColor: 'text-cyan-300',
    glowColor: 'shadow-cyan-500/25',
    ribbonBg: 'bg-cyan-900/60 text-cyan-200 border-cyan-400/50',
  },
  Diamond: {
    name: 'Diamond',
    label: 'Diamond Tier',
    badgeBg: 'from-indigo-950/50 via-purple-950/30 to-slate-900',
    borderColor: 'border-indigo-400/80',
    textColor: 'text-indigo-200',
    glowColor: 'shadow-indigo-500/35',
    ribbonBg: 'bg-indigo-900/70 text-indigo-200 border-indigo-400/60',
  },
};

export const ACHIEVEMENT_DEFINITIONS: AchievementConfig[] = [
  // 1. Streak Achievements
  {
    id: 'streak-3-days',
    title: 'Synaptic Spark',
    subtitle: '3-Day Active Study Streak',
    description: 'Maintain an active daily study streak for 3 consecutive days.',
    category: 'streak',
    tier: 'Bronze',
    rarity: 'Common',
    icon: 'flame',
    xpReward: 100,
    targetValue: 3,
    unit: 'days',
    loreQuote: 'The hardest part of any academic curriculum is overcoming initial cognitive inertia.',
    calculateProgress: (state) => {
      const current = Math.max(state.streak, state.longestStreak || 0);
      return { current, isUnlocked: current >= 3 };
    },
  },
  {
    id: 'streak-5-days',
    title: 'Unbroken Grit',
    subtitle: '5-Day Study Streak',
    description: 'Maintain an unbroken study streak for 5 consecutive days without skipping.',
    category: 'streak',
    tier: 'Gold',
    rarity: 'Rare',
    icon: 'zap',
    xpReward: 250,
    freezeTokenReward: 1,
    targetValue: 5,
    unit: 'days',
    loreQuote: 'Five days in, synaptic pathways physically thicken. Distractor traps are beginning to look obvious.',
    calculateProgress: (state) => {
      const current = Math.max(state.streak, state.longestStreak || 0);
      return { current, isUnlocked: current >= 5 };
    },
  },
  {
    id: 'streak-7-days',
    title: 'Week of Iron',
    subtitle: '7-Day Study Streak',
    description: 'Complete daily active recall drills for a full 7 consecutive days.',
    category: 'streak',
    tier: 'Platinum',
    rarity: 'Epic',
    icon: 'award',
    xpReward: 400,
    freezeTokenReward: 1,
    targetValue: 7,
    unit: 'days',
    loreQuote: 'Seven straight days without an excuse. Even The Angry Examiner raises an approving eyebrow.',
    calculateProgress: (state) => {
      const current = Math.max(state.streak, state.longestStreak || 0);
      return { current, isUnlocked: current >= 7 };
    },
  },
  {
    id: 'streak-14-days',
    title: 'Fortified Neural Fortress',
    subtitle: '14-Day Study Streak',
    description: 'Achieve a two-week streak of consecutive daily study sessions.',
    category: 'streak',
    tier: 'Diamond',
    rarity: 'Legendary',
    icon: 'shield',
    xpReward: 750,
    freezeTokenReward: 2,
    targetValue: 14,
    unit: 'days',
    loreQuote: 'Automaticity unlocked. You no longer need fleeting motivation when daily discipline is this entrenched.',
    calculateProgress: (state) => {
      const current = Math.max(state.streak, state.longestStreak || 0);
      return { current, isUnlocked: current >= 14 };
    },
  },

  // 2. Topic Mastery Achievements
  {
    id: 'topic-master-1',
    title: 'Synaptic Conqueror',
    subtitle: 'Master 1 Full Lecture Topic',
    description: 'Achieve 85%+ retention in any full lecture topic through repeated spaced repetition drills.',
    category: 'mastery',
    tier: 'Gold',
    rarity: 'Rare',
    icon: 'book-open',
    xpReward: 200,
    targetValue: 1,
    unit: 'topic',
    loreQuote: 'You didn’t just passively highlight notes—you conquered the underlying mechanisms and defused the traps.',
    calculateProgress: (state) => {
      const masteredCount = Object.values(state.topicMastery || {}).filter(t => t.retentionPercent >= 85).length;
      return { current: masteredCount, isUnlocked: masteredCount >= 1 };
    },
  },
  {
    id: 'topic-master-3',
    title: 'Polymath Scholar',
    subtitle: 'Master 3 Lecture Topics',
    description: 'Conquer and retain 3 distinct lecture syllabus topics at 85%+ retention mastery.',
    category: 'mastery',
    tier: 'Platinum',
    rarity: 'Epic',
    icon: 'layers',
    xpReward: 450,
    freezeTokenReward: 1,
    targetValue: 3,
    unit: 'topics',
    loreQuote: 'Cross-topic synthesis unlocked. You transition between electromechanisms and molecular kinetics without blinking.',
    calculateProgress: (state) => {
      const masteredCount = Object.values(state.topicMastery || {}).filter(t => t.retentionPercent >= 85).length;
      return { current: masteredCount, isUnlocked: masteredCount >= 3 };
    },
  },
  {
    id: 'topic-master-all',
    title: 'Curriculum Dominator',
    subtitle: 'Master 5+ Syllabus Topics',
    description: 'Achieve 85%+ retention across 5 or more comprehensive topics.',
    category: 'mastery',
    tier: 'Diamond',
    rarity: 'Legendary',
    icon: 'trophy',
    xpReward: 800,
    freezeTokenReward: 2,
    targetValue: 5,
    unit: 'topics',
    loreQuote: 'The entire syllabus is now locked into permanent long-term potentiation.',
    calculateProgress: (state) => {
      const masteredCount = Object.values(state.topicMastery || {}).filter(t => t.retentionPercent >= 85).length;
      return { current: masteredCount, isUnlocked: masteredCount >= 5 };
    },
  },

  // 3. Quiz & Active Recall Drills
  {
    id: 'quiz-initiation',
    title: 'Diagnostic Inquisitor',
    subtitle: 'First Practice Drill',
    description: 'Complete your first practice quiz drill on any syllabus topic.',
    category: 'quiz',
    tier: 'Bronze',
    rarity: 'Common',
    icon: 'help-circle',
    xpReward: 75,
    targetValue: 1,
    unit: 'quiz',
    loreQuote: 'Every top-tier board score begins with a single question answered under diagnostic pressure.',
    calculateProgress: (state) => {
      let totalQuizzes = 0;
      Object.values(state.studyLog || {}).forEach(entry => {
        totalQuizzes += entry.quizzesCount || 0;
      });
      return { current: Math.max(totalQuizzes, state.todayCompleted?.dailyQuiz ? 1 : 0), isUnlocked: totalQuizzes >= 1 || state.todayCompleted?.dailyQuiz };
    },
  },
  {
    id: 'quiz-veteran',
    title: 'Recall Machine',
    subtitle: '10 Practice Quizzes Completed',
    description: 'Complete 10 adaptive quiz drills across any subjects in the curriculum.',
    category: 'quiz',
    tier: 'Silver',
    rarity: 'Rare',
    icon: 'target',
    xpReward: 200,
    targetValue: 10,
    unit: 'quizzes',
    loreQuote: 'Ten drills deep. Distractor options that used to bait you now stand out like neon signs.',
    calculateProgress: (state) => {
      let totalQuizzes = 0;
      Object.values(state.studyLog || {}).forEach(entry => {
        totalQuizzes += entry.quizzesCount || 0;
      });
      return { current: totalQuizzes, isUnlocked: totalQuizzes >= 10 };
    },
  },
  {
    id: 'quiz-century',
    title: 'Century of Recall',
    subtitle: 'Answer 50+ High-Yield Questions',
    description: 'Answer 50 questions across active practice quizzes and level mission drills.',
    category: 'quiz',
    tier: 'Platinum',
    rarity: 'Epic',
    icon: 'bar-chart',
    xpReward: 500,
    freezeTokenReward: 1,
    targetValue: 50,
    unit: 'questions',
    loreQuote: 'Fifty high-yield traps dissected, reasoned through, and permanently committed to memory.',
    calculateProgress: (state) => {
      let questionsAnswered = (state.dailyStudyGoal?.completedQuestions || 0);
      Object.values(state.studyLog || {}).forEach(entry => {
        questionsAnswered += (entry.quizzesCount || 0) * 4;
      });
      return { current: questionsAnswered, isUnlocked: questionsAnswered >= 50 };
    },
  },

  // 4. The Angry Examiner Viva & Oral Boards
  {
    id: 'examiner-survivor',
    title: 'Boardroom Survivor',
    subtitle: 'First Viva Voce Drill',
    description: 'Face The Angry Examiner in a live oral interview drill and receive an evaluation.',
    category: 'examiner',
    tier: 'Bronze',
    rarity: 'Common',
    icon: 'flame',
    xpReward: 100,
    targetValue: 1,
    unit: 'viva',
    loreQuote: 'You sat in the hot seat, answered under direct cross-examination, and stood your ground.',
    calculateProgress: (state) => {
      const vivaCount = (state.recentExaminerScores?.length || 0) + (state.todayCompleted?.vivaDrill ? 1 : 0);
      return { current: Math.max(vivaCount, (state.recentExaminerScores?.length || 0)), isUnlocked: vivaCount >= 1 };
    },
  },
  {
    id: 'examiner-honors',
    title: 'Grudging Respect',
    subtitle: 'Score 8+ / 10 with The Examiner',
    description: 'Earn a score of 8/10 or higher with a Solid Pass or 1st Class Honors verdict from the Examiner.',
    category: 'examiner',
    tier: 'Gold',
    rarity: 'Legendary',
    icon: 'award',
    xpReward: 300,
    targetValue: 8,
    unit: 'score',
    loreQuote: '“I have no notes,” the professor grumbles. That is the highest praise you will ever receive in this room.',
    calculateProgress: (state) => {
      const topScore = state.recentExaminerScores?.reduce((max, s) => Math.max(max, s.score), 0) || 0;
      return { current: topScore, isUnlocked: topScore >= 8 };
    },
  },

  // 5. Mistakes Vault & Error Remediation
  {
    id: 'mistake-repaired-1',
    title: 'Humble Correction',
    subtitle: 'Fix 1 Mistake in the Vault',
    description: 'Review an examiner trap, re-answer correctly, and fix your first mistake in the Mistakes Vault.',
    category: 'vault',
    tier: 'Bronze',
    rarity: 'Common',
    icon: 'check-circle',
    xpReward: 80,
    targetValue: 1,
    unit: 'mistake',
    loreQuote: 'The amateur conceals their mistakes; the top scholar studies them under a high-power microscope.',
    calculateProgress: (state) => {
      const fixedCount = state.mistakesLog?.filter(m => m.fixed).length || 0;
      return { current: fixedCount, isUnlocked: fixedCount >= 1 };
    },
  },
  {
    id: 'mistake-repaired-3',
    title: 'Vault Cleanser',
    subtitle: 'Fix 3 Mistakes in the Vault',
    description: 'Resolve and master 3 conceptual traps from your personal Mistakes Vault ledger.',
    category: 'vault',
    tier: 'Silver',
    rarity: 'Rare',
    icon: 'shield',
    xpReward: 200,
    targetValue: 3,
    unit: 'mistakes',
    loreQuote: 'Three critical misconceptions permanently eliminated from your diagnostic radar.',
    calculateProgress: (state) => {
      const fixedCount = state.mistakesLog?.filter(m => m.fixed).length || 0;
      return { current: fixedCount, isUnlocked: fixedCount >= 3 };
    },
  },

  // 6. Consistency, Daily Goals & Roadmap Milestones
  {
    id: 'daily-goal-crushed',
    title: 'Clockwork Scholar',
    subtitle: 'Daily Target Reached',
    description: 'Hit 100% of your daily study minutes target for the day.',
    category: 'consistency',
    tier: 'Silver',
    rarity: 'Common',
    icon: 'trending-up',
    xpReward: 150,
    targetValue: 1,
    unit: 'goal',
    loreQuote: 'You set a rigorous time goal, locked in without distractions, and completed every block.',
    calculateProgress: (state) => {
      const completed = state.dailyStudyGoal?.completedMinutes || 0;
      const target = state.dailyStudyGoal?.targetMinutes || 60;
      const isMet = completed >= target;
      return { current: isMet ? 1 : Math.round((completed / target) * 10) / 10, isUnlocked: isMet };
    },
  },
  {
    id: 'milestone-pioneer',
    title: 'Roadmap Pathfinder',
    subtitle: 'Complete Level 1 Milestone',
    description: 'Conquer all action items and mark Milestone Level 1 complete on your study roadmap.',
    category: 'consistency',
    tier: 'Gold',
    rarity: 'Rare',
    icon: 'flag',
    xpReward: 250,
    freezeTokenReward: 1,
    targetValue: 1,
    unit: 'milestone',
    loreQuote: 'Foundation secure. Phase 1 is officially in the books; high-yield acceleration begins now.',
    calculateProgress: (state) => {
      const completedCount = state.completedMilestones?.length || 0;
      return { current: completedCount, isUnlocked: completedCount >= 1 };
    },
  },
  {
    id: 'battle-plan-architect',
    title: 'Battle Plan Architect',
    subtitle: 'Active Exam Target Ready',
    description: 'Configure and generate a personalized Angry Examiner War Plan with scheduled milestones.',
    category: 'consistency',
    tier: 'Bronze',
    rarity: 'Common',
    icon: 'sparkles',
    xpReward: 100,
    targetValue: 1,
    unit: 'plan',
    loreQuote: 'A student without a battle plan is just hoping for a generous grading curve.',
    calculateProgress: (state) => {
      const hasPlan = !!state.activeExamPlan;
      return { current: hasPlan ? 1 : 0, isUnlocked: hasPlan };
    },
  },
];

/**
 * Calculates current status and progress for all achievements
 */
export function evaluateAchievements(state: UserStudyState): AchievementBadge[] {
  const storedAchievements = state.achievements || {};

  return ACHIEVEMENT_DEFINITIONS.map(def => {
    const { current, isUnlocked: meetsCriteria } = def.calculateProgress(state);
    const stored = storedAchievements[def.id];

    // An achievement is unlocked if criteria met or previously marked unlocked
    const isUnlocked = meetsCriteria || !!stored?.unlockedAt;
    const isClaimed = !!stored?.claimed;
    const unlockedAt = stored?.unlockedAt || (meetsCriteria ? new Date().toISOString().split('T')[0] : undefined);
    const claimedAt = stored?.claimedAt;

    return {
      id: def.id,
      title: def.title,
      subtitle: def.subtitle,
      description: def.description,
      category: def.category,
      tier: def.tier,
      rarity: def.rarity,
      icon: def.icon,
      xpReward: def.xpReward,
      freezeTokenReward: def.freezeTokenReward,
      currentValue: Math.min(def.targetValue, current),
      targetValue: def.targetValue,
      unit: def.unit,
      isUnlocked,
      unlockedAt,
      isClaimed,
      claimedAt,
      loreQuote: def.loreQuote,
    };
  });
}

/**
 * Claims reward for an unlocked achievement and updates UserStudyState
 */
export function claimAchievementReward(
  state: UserStudyState,
  achievementId: string
): { updatedState: UserStudyState; badge: AchievementBadge | null } {
  const badges = evaluateAchievements(state);
  const targetBadge = badges.find(b => b.id === achievementId);

  if (!targetBadge || !targetBadge.isUnlocked || targetBadge.isClaimed) {
    return { updatedState: state, badge: null };
  }

  const now = new Date().toISOString().split('T')[0];

  const updatedAchievements = {
    ...(state.achievements || {}),
    [achievementId]: {
      unlockedAt: targetBadge.unlockedAt || now,
      claimed: true,
      claimedAt: now,
    },
  };

  const newXp = state.totalXp + targetBadge.xpReward;
  const newFreezeTokens = state.freezeTokens + (targetBadge.freezeTokenReward || 0);

  const updatedState: UserStudyState = {
    ...state,
    totalXp: newXp,
    freezeTokens: newFreezeTokens,
    achievements: updatedAchievements,
  };

  return {
    updatedState,
    badge: {
      ...targetBadge,
      isClaimed: true,
      claimedAt: now,
    },
  };
}
