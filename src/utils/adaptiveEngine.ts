export type AdaptiveDifficultyTier = 
  | 'Foundation' 
  | 'Standard' 
  | 'Challenging' 
  | 'Brutal Trap' 
  | 'Examiner Nightmare';

export interface TierMeta {
  tier: AdaptiveDifficultyTier;
  level: number; // 1 to 5
  label: string;
  badgeColor: string;
  borderColor: string;
  textColor: string;
  bgGlow: string;
  description: string;
  targetFocus: string;
}

export const DIFFICULTY_TIERS: Record<AdaptiveDifficultyTier, TierMeta> = {
  'Foundation': {
    tier: 'Foundation',
    level: 1,
    label: 'Tier 1: Foundation',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    borderColor: 'border-emerald-500/40',
    textColor: 'text-emerald-400',
    bgGlow: 'shadow-[0_0_15px_rgba(16,185,129,0.2)]',
    description: 'Core definitions, foundational mechanisms, baseline scaffolding',
    targetFocus: 'Reinforcing baseline principles and clearing core misconceptions',
  },
  'Standard': {
    tier: 'Standard',
    level: 2,
    label: 'Tier 2: Standard Exam',
    badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
    borderColor: 'border-blue-500/40',
    textColor: 'text-blue-400',
    bgGlow: 'shadow-[0_0_15px_rgba(59,130,246,0.2)]',
    description: 'Standard collegiate/board exam questions and direct applications',
    targetFocus: 'Testing direct application of rules and multi-step deduction',
  },
  'Challenging': {
    tier: 'Challenging',
    level: 3,
    label: 'Tier 3: Challenging',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    borderColor: 'border-amber-500/40',
    textColor: 'text-amber-400',
    bgGlow: 'shadow-[0_0_15px_rgba(245,158,11,0.2)]',
    description: 'Multi-variable interactions, subtle counter-regulations, and edge cases',
    targetFocus: 'Distinguishing between closely related causal mechanisms',
  },
  'Brutal Trap': {
    tier: 'Brutal Trap',
    level: 4,
    label: 'Tier 4: Brutal Trap',
    badgeColor: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
    borderColor: 'border-orange-500/40',
    textColor: 'text-orange-400',
    bgGlow: 'shadow-[0_0_15px_rgba(249,115,22,0.25)]',
    description: 'Seductive examiner distractors, reverse causality traps, deceptive phrasing',
    targetFocus: 'Defusing deceptive examiner traps under pressure',
  },
  'Examiner Nightmare': {
    tier: 'Examiner Nightmare',
    level: 5,
    label: 'Tier 5: Examiner Nightmare',
    badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
    borderColor: 'border-rose-500/40',
    textColor: 'text-rose-400',
    bgGlow: 'shadow-[0_0_20px_rgba(244,63,94,0.3)]',
    description: 'Highest-tier synthesis, adversarial perturbations, novel scenario synthesis',
    targetFocus: 'Mastery-level synthesis and cross-disciplinary deduction',
  },
};

export const ORDERED_TIERS: AdaptiveDifficultyTier[] = [
  'Foundation',
  'Standard',
  'Challenging',
  'Brutal Trap',
  'Examiner Nightmare',
];

export interface AdaptiveResult {
  nextTier: AdaptiveDifficultyTier;
  previousTier: AdaptiveDifficultyTier;
  direction: 'up' | 'down' | 'maintain';
  streak: number;
  newSkillRating: number;
  deltaRating: number;
  rationale: string;
}

/**
 * Calculates the next difficulty tier based on whether the student answered correctly or missed.
 */
export function calculateAdaptiveProgression(
  currentTier: AdaptiveDifficultyTier,
  wasCorrect: boolean,
  currentStreak: number,
  currentSkillRating: number = 1200,
  trapNote?: string
): AdaptiveResult {
  const currentIndex = ORDERED_TIERS.indexOf(currentTier);
  const safeIndex = currentIndex === -1 ? 1 : currentIndex; // default to Standard (idx 1)

  let nextIndex = safeIndex;
  let direction: 'up' | 'down' | 'maintain' = 'maintain';
  let nextStreak = wasCorrect ? (currentStreak > 0 ? currentStreak + 1 : 1) : (currentStreak < 0 ? currentStreak - 1 : -1);
  let rationale = '';

  if (wasCorrect) {
    // If student answers correctly, advance difficulty!
    if (safeIndex < ORDERED_TIERS.length - 1) {
      nextIndex = safeIndex + 1;
      direction = 'up';
      rationale = `Demonstrated solid mastery at ${currentTier}. Escalate to ${ORDERED_TIERS[nextIndex]} to test deeper conceptual synthesis and subtle traps.`;
    } else {
      nextIndex = safeIndex;
      direction = 'maintain';
      rationale = `Already at peak Examiner Nightmare tier! Maintaining maximum rigor to reinforce elite exam mastery.`;
    }
  } else {
    // If student missed the question, drop difficulty to scaffold and reinforce!
    if (safeIndex > 0) {
      nextIndex = safeIndex - 1;
      direction = 'down';
      rationale = trapNote
        ? `Misconception detected (${trapNote}). Calibrating down to ${ORDERED_TIERS[nextIndex]} to reinforce baseline mechanisms before re-escalating.`
        : `Answer missed at ${currentTier}. Adapting down to ${ORDERED_TIERS[nextIndex]} to shore up fundamental principles.`;
    } else {
      nextIndex = 0;
      direction = 'maintain';
      rationale = `Focusing on Tier 1 Foundation concepts to ensure baseline clarity before moving up.`;
    }
  }

  // Calculate Elo/Theta skill rating delta
  let deltaRating = 0;
  if (wasCorrect) {
    const tierBonus = (safeIndex + 1) * 6; // higher tier = higher XP/Elo
    const streakBonus = Math.min(Math.max(nextStreak, 1) * 3, 15);
    deltaRating = 18 + tierBonus + streakBonus;
  } else {
    const tierForgiveness = (5 - safeIndex) * 3; // missing a brutal question penalizes less than missing a foundation question
    deltaRating = -Math.max(10, 24 - tierForgiveness);
  }

  const newSkillRating = Math.max(800, currentSkillRating + deltaRating);

  return {
    nextTier: ORDERED_TIERS[nextIndex],
    previousTier: currentTier,
    direction,
    streak: nextStreak,
    newSkillRating,
    deltaRating,
    rationale,
  };
}

export interface CuratedAdaptiveQuestion {
  id: string;
  topic: string;
  question: string;
  options: string[];
  correctIndex: number;
  angryExplanation: string;
  examinerTrapNotes: string;
  levelTip: string;
  difficulty: AdaptiveDifficultyTier;
  passage?: string;
  passageTitle?: string;
}

/**
 * Returns a high-yield curated fallback question for any subject, topic, and difficulty tier.
 */
export function getCuratedAdaptiveQuestion(
  topic: string,
  tier: AdaptiveDifficultyTier,
  subject: string = 'Academic'
): CuratedAdaptiveQuestion {
  const ts = Date.now();
  switch (tier) {
    case 'Foundation':
      return {
        id: `adaptive-${tier.toLowerCase().replace(/\s+/g, '-')}-${ts}`,
        topic,
        difficulty: 'Foundation',
        question: `[Foundation Diagnostic] In the context of ${topic}, what is the fundamental defining principle that governs baseline behavior?`,
        options: [
          `The governing baseline rule that establishes system equilibrium or ground-state kinetics`,
          `A random perturbation that has no deterministic physical or logical relationship to the system`,
          `An uncoupled runaway feedback cycle that instantaneously exhausts all reserves without regulation`,
          `A passive drift mechanism that ignores standard conservation of mass and energy`
        ],
        correctIndex: 0,
        angryExplanation: `Correct. Before tackling complex traps, you must nail the baseline ground truth: in ${topic}, equilibrium and conservation laws dictate every downstream outcome.`,
        examinerTrapNotes: 'Students frequently overcomplicate foundation questions by searching for non-existent edge cases.',
        levelTip: 'Always verify the baseline definition first before analyzing multi-step cascades.',
      };

    case 'Standard':
      return {
        id: `adaptive-${tier.toLowerCase().replace(/\s+/g, '-')}-${ts}`,
        topic,
        difficulty: 'Standard',
        question: `[Standard Exam Level] What is the decisive rate-limiting checkpoint or regulatory constraint in ${topic}?`,
        options: [
          `The committed step requiring the highest activation energy that dictates overall throughput`,
          `An unmonitored downstream branch that operates at maximum velocity regardless of substrate levels`,
          `A spontaneous reverse reaction that completely cancels all forward progress under normal physiological states`,
          `A secondary passive cofactor with zero regulatory influence`
        ],
        correctIndex: 0,
        angryExplanation: `Spot on! Standard board questions consistently test the rate-limiting committed step because controlling that step regulates the entire pathway without wasteful accumulation.`,
        examinerTrapNotes: 'Examiners design distractors around downstream intermediates; remember that the committed step dictates the pace.',
        levelTip: 'Commit the exact rate-limiting enzyme, boundary condition, or thesis statement to memory.',
      };

    case 'Challenging':
      return {
        id: `adaptive-${tier.toLowerCase().replace(/\s+/g, '-')}-${ts}`,
        topic,
        difficulty: 'Challenging',
        question: `[Challenging Multi-Variable] If an acute external perturbation occurs in ${topic}, how does the counter-regulatory feedback loop restore steady-state balance?`,
        options: [
          `Negative feedback immediately attenuates the initial trigger by downregulating upstream activators once threshold concentration is reached`,
          `Positive feedback cascades indefinitely until the entire cellular or systemic environment collapses`,
          `The system undergoes irreversible denaturation and must rebuild all components de novo`,
          `The baseline set-point shifts permanently to zero without any restorative effort`
        ],
        correctIndex: 0,
        angryExplanation: `Well reasoned! Counter-regulation requires dynamic negative feedback loops to damp oscillations and restore homeostatic steady-state.`,
        examinerTrapNotes: 'Beware confusing positive amplification (which is rare and self-limiting) with standard negative feedback restoration.',
        levelTip: 'Trace the entire loop: Stimulus -> Sensor -> Control Center -> Effector -> Reset.',
      };

    case 'Brutal Trap':
      return {
        id: `adaptive-${tier.toLowerCase().replace(/\s+/g, '-')}-${ts}`,
        topic,
        difficulty: 'Brutal Trap',
        question: `[Brutal Trap Warning] A student claims that blocking the downstream shut-off mechanism in ${topic} will merely produce a slow return to baseline. Why is this claim fatally flawed?`,
        options: [
          `Blocking termination prevents inactivation gates from closing, causing pathological tonic excitation or metabolic toxic overload`,
          `Shut-off mechanisms have no effect on signal duration or downstream response amplitude`,
          `Downstream mechanisms only function during embryogenesis and are dormant in mature systems`,
          `Inhibition of shut-off causes an instantaneous reversal of thermodynamic entropy`
        ],
        correctIndex: 0,
        angryExplanation: `Brilliant defusal! This is the classic "shut-off gate" trap. When you block termination, the signal does NOT slowly fade; it stays locked in active overdrive, resulting in catastrophic overload.`,
        examinerTrapNotes: 'Never assume that an inhibited shut-off means "nothing happens." Shut-off failure causes hyper-excitation.',
        levelTip: 'Every high-scoring answer must address both initiation AND timely termination.',
      };

    case 'Examiner Nightmare':
    default:
      return {
        id: `adaptive-${tier.toLowerCase().replace(/\s+/g, '-')}-${ts}`,
        topic,
        difficulty: 'Examiner Nightmare',
        question: `[Examiner Nightmare - Multi-Domain Synthesis] In an adversarial experimental assay on ${topic}, an inhibitor selectively blocks allosteric modulation while leaving the catalytic active site unaltered. Under saturated substrate concentrations, what kinetic or mechanistic profile is observed?`,
        options: [
          `The maximal capacity (Vmax/asymptote) remains achievable, but the sigmoidal cooperativity and regulatory sensitivity curve are abolished`,
          `The reaction stops completely because active sites cannot bind substrate without allosteric pre-activation`,
          `Substrate binding affinity increases infinitely while reaction velocity drops to absolute zero`,
          `The system reverses direction and catalyzes the opposite reaction at three times the standard rate`
        ],
        correctIndex: 0,
        angryExplanation: `Masterclass performance! Allosteric inhibitors alter regulatory curve geometry (such as K0.5 or cooperativity) without necessarily abolishing catalytic maximum at infinite substrate. You sidestepped the examiner's ultimate distractor.`,
        examinerTrapNotes: 'Weak candidates assume all inhibitors destroy Vmax. Distinguish allosteric curve shifts from catalytic active-site obliteration.',
        levelTip: 'In multi-domain synthesis, isolate the binding curve from the catalytic turnover rate.',
      };
  }
}
