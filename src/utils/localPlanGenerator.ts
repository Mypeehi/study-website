import { ExamPlan, ExamProfile, ExamMilestone } from '../types';

interface DisciplineProfile {
  isCalculus: boolean;
  isAlgebra1: boolean;
  isAlgebra2: boolean;
  isGeometry: boolean;
  isPhysics: boolean;
  isChemistry: boolean;
  isBiology: boolean;
  isMedical: boolean;
  isEnglish: boolean;
  isHistory: boolean;
  isLanguage: boolean;
  isComputerScience: boolean;
}

export function detectDiscipline(subjectStr: string, topicsArr: string[] = []): DisciplineProfile {
  const combined = (subjectStr + ' ' + topicsArr.join(' ')).toLowerCase();

  return {
    isCalculus: combined.includes('calculus') || combined.includes('derivative') || combined.includes('integral') || combined.includes('chain rule') || combined.includes('limits') || combined.includes('taylor series'),
    isAlgebra1: combined.includes('algebra 1') || combined.includes('linear equation') || combined.includes('slope-intercept') || combined.includes('factoring quadratics'),
    isAlgebra2: combined.includes('algebra 2') || combined.includes('polynomial') || combined.includes('logarithm') || combined.includes('rational function') || combined.includes('complex numbers'),
    isGeometry: combined.includes('geometry') || combined.includes('circle theorem') || combined.includes('congruence') || combined.includes('trigonometry') || combined.includes('triangle proof'),
    isPhysics: combined.includes('physics') || combined.includes('kinematics') || combined.includes('newton') || combined.includes('circuits') || combined.includes('electromagnetism') || combined.includes('optics') || combined.includes('thermodynamics'),
    isChemistry: combined.includes('chemistry') || combined.includes('stoichiometry') || combined.includes('equilibrium') || combined.includes('organic') || combined.includes('acid-base') || combined.includes('titration'),
    isBiology: combined.includes('biology') || combined.includes('cellular') || combined.includes('photosynthesis') || combined.includes('genetics') || combined.includes('dna') || combined.includes('mitosis'),
    isMedical: combined.includes('medical') || combined.includes('anatomy') || combined.includes('physiology') || combined.includes('pathology') || combined.includes('pharmacology') || combined.includes('cardio') || combined.includes('neuro'),
    isEnglish: combined.includes('english') || combined.includes('literature') || combined.includes('rhetoric') || combined.includes('essay') || combined.includes('poetry') || combined.includes('reading comprehension') || combined.includes('sat reading'),
    isHistory: combined.includes('history') || combined.includes('social studies') || combined.includes('government') || combined.includes('economics') || combined.includes('cold war') || combined.includes('constitution'),
    isLanguage: combined.includes('language') || combined.includes('spanish') || combined.includes('french') || combined.includes('german') || combined.includes('japanese') || combined.includes('chinese') || combined.includes('conjugation'),
    isComputerScience: combined.includes('computer') || combined.includes('programming') || combined.includes('python') || combined.includes('java') || combined.includes('data structure') || combined.includes('algorithm'),
  };
}

/**
 * Generates an active study plan 100% locally on the client without requiring an internet connection.
 * Completely deterministic, zero latency, and works offline or in standalone 1-file mode.
 */
export function generateLocalExamPlan(profile: ExamProfile): ExamPlan {
  const subject = profile.subject || 'STEM & Academic Mastery';
  const topics = Array.isArray(profile.topics) && profile.topics.length > 0
    ? profile.topics
    : ['Core Principles & Mechanisms', 'Common Distractor Trap Patterns', 'Past Paper Calculation Drills'];

  const examDateObj = new Date(profile.examDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const today = new Date();
  const diffTime = examDateObj.getTime() - today.getTime();
  const daysRemaining = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

  const disc = detectDiscipline(subject, topics);
  const gradeLevel = profile.gradeLevel || 'Standard Curriculum';
  const country = profile.country || 'Global Examination Board';
  const questionTypesStr = Array.isArray(profile.questionTypes) && profile.questionTypes.length > 0
    ? profile.questionTypes.join(', ')
    : 'Multiple Choice & Free-Response Calculations';

  const p1End = Math.max(2, Math.floor(daysRemaining * 0.35));
  const p2End = Math.max(p1End + 2, Math.floor(daysRemaining * 0.75));

  let roast = `So you have ${daysRemaining} days left until your ${gradeLevel} ${subject} examination in ${country}. Reading highlighted summaries and passively nodding along to video lectures is cognitive comfort food—it will not save you under exam pressure. Here is your battle-tested active retrieval schedule.`;
  let milestones: ExamMilestone[] = [];
  let highYieldFocalPoints: string[] = [];
  let recommendedSyllabusTopics: string[] = [];

  if (disc.isCalculus) {
    roast = `You have ${daysRemaining} days until your ${gradeLevel} Calculus examination. Calculus is not about remembering steps—it is about algebraic precision and identifying the rate-limiting chain rule or integration boundary under a ticking clock.`;
    milestones = [
      {
        phase: 'Phase 1: Limit Foundations & Derivative Mechanics',
        title: 'Eliminate Algebraic Slop & Master Chain Rule / FTC',
        dayRange: `Days 1 - ${p1End}`,
        focus: `Lock down limits, continuity, differentiability, and composite derivative rules for: ${topics.slice(0, 3).join(', ')}.`,
        actionItems: [
          'Solve 15 daily derivative and limit problems with strict attention to Chain Rule inner functions.',
          'Audit differentiability preconditions before applying Mean Value Theorem or L’Hôpital’s Rule.',
          'Derive the Fundamental Theorem of Calculus Parts 1 & 2 on blank paper from scratch.'
        ]
      },
      {
        phase: 'Phase 2: Applications of Derivatives & Integral Crucible',
        title: 'Related Rates, Optimization & Riemann Synthesis',
        dayRange: `Days ${p1End + 1} - ${p2End}`,
        focus: `Simulate format: ${questionTypesStr}. Eliminate geometric setup errors in Related Rates and master U-substitution.`,
        actionItems: [
          'Draw physical sketches first to relate geometric variables before differentiating with respect to time.',
          'Complete 10 timed definite integrals requiring algebraic manipulation and change of variables.',
          'Annotate common trap errors: forgetting dx, dropping negative signs, or missing composite derivatives.'
        ]
      },
      {
        phase: 'Phase 3: The Examination War Room',
        title: 'Full Pressure Simulations & Multi-Step Exam Drills',
        dayRange: `Days ${p2End + 1} - ${daysRemaining}`,
        focus: 'Past paper execution and time-pressured drills. Zero looking at formula sheets or solution keys.',
        actionItems: [
          'Simulate 2 full timed past exam sections under strict stopwatch timing.',
          'Review all flagged algebraic simplification mistakes in your Mistakes Vault.',
          'Rest properly before exam day—mental fatigue causes algebraic sign slips.'
        ]
      }
    ];
    highYieldFocalPoints = [
      'Chain Rule rigor: d/dx[f(g(x))] = f\'(g(x)) · g\'(x).',
      'Related Rates: Geometric constraint equations must be established before differentiating.',
      'Fundamental Theorem of Calculus: d/dx ∫[a to u(x)] f(t) dt = f(u(x)) · u\'(x).',
      'Verify theorem preconditions (continuity on [a,b], differentiability on (a,b)) before quoting them.'
    ];
    recommendedSyllabusTopics = [
      'Limits, Continuity & Squeeze Theorem',
      'Derivatives, Product Rule & Chain Rule',
      'Related Rates & Geometric Optimization',
      'Definite Integrals & Riemann Sums',
      'Fundamental Theorem of Calculus (FTC)',
      'Differential Equations & Slope Fields'
    ];
  } else if (disc.isEnglish) {
    roast = `You have ${daysRemaining} days until your ${gradeLevel} English & Literature exam in ${country}. Surface plot summaries earn mediocre marks. Top examiners test textual inference, authorial craft, syntactic tone, and rhetoric.`;
    milestones = [
      {
        phase: 'Phase 1: Rhetorical Deconstruction & Textual Inferences',
        title: 'Master Rhetorical Devices & Nuanced Evidence Pairing',
        dayRange: `Days 1 - ${p1End}`,
        focus: `Isolate topics: ${topics.slice(0, 3).join(', ')}. Analyze HOW and WHY the author constructed meaning through craft.`,
        actionItems: [
          'Annotate 2 challenging literary/rhetorical passages daily, isolating ethos, logos, pathos, and antithesis.',
          'Practice pairing textual claims with direct line evidence to dismantle trap questions.',
          'Review all vocabulary-in-context terms for secondary and figurative connotations.'
        ]
      },
      {
        phase: 'Phase 2: Complex Passage Drilling & Thesis Crucible',
        title: 'Eliminating Seductive Traps & Crafting Defensible Theses',
        dayRange: `Days ${p1End + 1} - ${p2End}`,
        focus: `Simulate exact format: ${questionTypesStr}. Eliminate seductive distractor choices that merely describe literal plot events.`,
        actionItems: [
          'Complete 10 daily timed reading comprehension questions with complex literary excerpts.',
          'Draft 3 non-obvious thematic claims that explain how specific syntax and craft build meaning.',
          'Spot and eliminate distractor options that are factually true in isolation but fail the prompt.'
        ]
      },
      {
        phase: 'Phase 3: The Examination War Room',
        title: 'Full Pressure Reading Simulations & Speed Synthesis',
        dayRange: `Days ${p2End + 1} - ${daysRemaining}`,
        focus: 'Past paper execution and time-pressured reading drills. Zero passive revision allowed.',
        actionItems: [
          'Simulate full exam-length reading and essay drills with strict stopwatch timing.',
          'Audit weakest question types and review flagged literary distractor traps in your notebook.',
          'Sleep 8 hours before exam day—a fatigued brain misinterprets nuanced authorial tone.'
        ]
      }
    ];
    highYieldFocalPoints = [
      'Distinguishing literal plot details from figurative, symbolic, and rhetorical intent.',
      'Tracing author tone shifts and contrasting perspectives across structural paragraphs.',
      'Eliminating answers that are attractive distractors but answer the wrong question.',
      'Crafting nuanced, defensible thesis statements that explain authorial craft.'
    ];
    recommendedSyllabusTopics = [
      'Rhetorical Devices & Textual Inferences',
      'Author Tone, Purpose & Rhetorical Perspective',
      'Theme, Character Arc & Literary Synthesis',
      'Complex Reading Passage Analysis & Evidence Pairing',
      'Grammar, Punctuation & Sentence Mechanics',
      'Vocabulary in Context & Nuance Analysis'
    ];
  } else if (disc.isPhysics) {
    roast = `You have ${daysRemaining} days until your ${gradeLevel} Physics exam. Physics is applied math with severe physical consequences. You cannot memorize problem solutions; you must isolate free-body forces, vectors, and governing conservation laws.`;
    milestones = [
      {
        phase: 'Phase 1: Free-Body Diagrams & Governing Laws',
        title: 'Newtonian Vectors, Conservation Laws & Coordinate Discipline',
        dayRange: `Days 1 - ${p1End}`,
        focus: `Lock down coordinate axes, vector decomposition, and energy balance for: ${topics.slice(0, 3).join(', ')}.`,
        actionItems: [
          'Draw clean free-body diagrams with labeled vectors for every dynamics problem before writing F = ma.',
          'State conserved quantities (mechanical energy, linear momentum, charge) before selecting equations.',
          'Audit unit consistency and dimensional analysis on every derived formula.'
        ]
      },
      {
        phase: 'Phase 2: Multi-Concept Coupling & Circuit/Field Crucible',
        title: 'Coupled Systems, Field Interactions & Trap Elimination',
        dayRange: `Days ${p1End + 1} - ${p2End}`,
        focus: `Simulate format: ${questionTypesStr}. Eliminate boundary-condition mistakes and sign errors.`,
        actionItems: [
          'Solve 10 timed multi-step problems linking kinematics, work-energy theorem, and rotational dynamics.',
          'Complete Spot-the-Flaw drills on circuit loop rules (Kirchhoff) and sign conventions.',
          'Explain the physical mechanism in plain English before evaluating numerical limits.'
        ]
      },
      {
        phase: 'Phase 3: The Examination War Room',
        title: 'Full Timed Past Paper Crucible & Error Autopsy',
        dayRange: `Days ${p2End + 1} - ${daysRemaining}`,
        focus: 'Timed examination conditions. No peeking at formula booklets during calculations.',
        actionItems: [
          'Simulate 2 full timed past paper sessions under strict test conditions.',
          'Review all flagged calculation traps in your Mistakes Vault.',
          'Focus on graphical interpretation: slopes of position/velocity curves and areas under force-time graphs.'
        ]
      }
    ];
    highYieldFocalPoints = [
      'Coordinate axes discipline: choose positive direction before writing ΣF = ma.',
      'Conservation of Energy: E_initial + W_nonconservative = E_final.',
      'Momentum is a vector: break into x and y components before solving collisions.',
      'Limiting-case intuition: verify what happens when mass or friction approaches zero.'
    ];
    recommendedSyllabusTopics = [
      'Kinematics & Projectile Motion Vectors',
      'Newton’s Laws & Free-Body Dynamics',
      'Work, Energy & Conservation of Energy',
      'Linear Momentum & Impulse Conservation',
      'Rotational Dynamics & Torque Equilibrium',
      'Electric Circuits, Fields & Potential Difference'
    ];
  } else if (disc.isBiology || disc.isMedical) {
    roast = `You have ${daysRemaining} days until your ${gradeLevel} ${subject} exam. Passive flashcard flipping is why students mix up rate-limiting enzymes and feedback loops. You must explain the biochemical mechanism cold.`;
    milestones = [
      {
        phase: 'Phase 1: Mechanistic Cascades & Structural Priming',
        title: 'Feedback Loops, Pathway Synthesis & Active Recall',
        dayRange: `Days 1 - ${p1End}`,
        focus: `Diagram from memory every biochemical pathway and physiological cascade for: ${topics.slice(0, 3).join(', ')}.`,
        actionItems: [
          'Blurt entire physiological regulatory feedback loops on blank paper with zero notes.',
          'Isolate the rate-limiting enzyme or regulatory switch in every pathway.',
          'Differentiate physiological compensatory mechanisms from initial pathology triggers.'
        ]
      },
      {
        phase: 'Phase 2: Clinical Vignette & Distractor Crucible',
        title: 'Laboratory Data Interpretation & Trap Disarmament',
        dayRange: `Days ${p1End + 1} - ${p2End}`,
        focus: `Simulate format: ${questionTypesStr}. Disarm distractor traps that confuse symptoms with root etiology.`,
        actionItems: [
          'Complete 15 timed diagnostic multiple-choice questions interpreting clinical graphs and tables.',
          'Explain why each distractor choice is a trap before confirming the correct option.',
          'Review the Mistakes Vault daily to prevent recurring diagnostic misconceptions.'
        ]
      },
      {
        phase: 'Phase 3: The Examination War Room',
        title: 'Full Board/Exam Simulation & High-Speed Synthesis',
        dayRange: `Days ${p2End + 1} - ${daysRemaining}`,
        focus: 'Rapid diagnostic vignettes and multi-system integration under strict time limits.',
        actionItems: [
          'Simulate 2 full-length practice exams with timed question blocks.',
          'Audit high-yield pharmacological and anatomical landmarks.',
          'Prioritize sleep before test day to preserve hippocampal retrieval automaticity.'
        ]
      }
    ];
    highYieldFocalPoints = [
      'Always distinguish primary etiology from secondary compensatory physiological responses.',
      'Rate-limiting steps and negative feedback regulation loops.',
      'Interpreting diagnostic assays, lab panels, and graphical changes under stress.',
      'Mechanism of action: trace the cascade from receptor binding to cellular response.'
    ];
    recommendedSyllabusTopics = [
      'Cellular Metabolism, Glycolysis & Krebs Cycle',
      'Physiological Homeostasis & Endocrine Regulation',
      'Cardiovascular Dynamics & Hemodynamics',
      'Neurotransmission, Synapses & Action Potentials',
      'Genetics, Transcription & Translation',
      'Immunology, Host Defense & Pathophysiology'
    ];
  } else {
    // Universal Academic Blueprint for all subjects
    roast = `You have ${daysRemaining} days until your ${gradeLevel} ${subject} examination in ${country}. The difference between an average grade and top percentile mastery is deliberate error analysis and cold pre-testing. Here is your structured active study roadmap.`;
    milestones = [
      {
        phase: 'Phase 1: Diagnostic Foundation & Error Discovery',
        title: 'Closed-Book Retrieval & Syllabus Core Audit',
        dayRange: `Days 1 - ${p1End}`,
        focus: `Isolate and pretest cold on chosen topics: ${topics.slice(0, 3).join(', ')}. Identify cognitive gaps before revising.`,
        actionItems: [
          'Run a timed 10-question cold pretest on today’s core chapter before opening study notes.',
          'Document every wrong answer and conceptual hesitation in your Mistakes Vault.',
          'Summarize the 3 governing principles of each topic on blank paper from raw memory.'
        ]
      },
      {
        phase: 'Phase 2: Distractor Crucible & Problem Execution',
        title: 'Format Simulation & High-Yield Trap Disarmament',
        dayRange: `Days ${p1End + 1} - ${p2End}`,
        focus: `Simulate format: ${questionTypesStr}. Dissect why wrong choices look appealing and eliminate logic traps.`,
        actionItems: [
          'Solve 15 daily deliberate practice questions under 60-second time limits.',
          'Perform a distractor autopsy: articulate why each incorrect option was constructed to bait you.',
          'Interleave 2 different syllabus topics every study sprint to train discrimination.'
        ]
      },
      {
        phase: 'Phase 3: The Examination War Room',
        title: 'Full Pressure Simulations & Rapid Automaticity',
        dayRange: `Days ${p2End + 1} - ${daysRemaining}`,
        focus: 'Past paper execution and time-pressured drills. Zero passive reading or highlighter use.',
        actionItems: [
          'Simulate full exam condition drills with strict stopwatch timing.',
          'Audit weakest topics in your Performance Decay Map and drill them to 90%+ accuracy.',
          'Consolidate memory with 8 hours of sleep before the examination hall.'
        ]
      }
    ];
    highYieldFocalPoints = topics.length > 0
      ? topics.map(t => `Lock down core control points, definitions, and trap variants in ${t}.`)
      : [
          'Distinguishing primary causes from downstream consequences.',
          'Eliminating seductive distractors that describe secondary facts.',
          'Speed automaticity: solving standard questions in under 45 seconds.',
          'Checking preconditions and boundary parameters before confirming answers.'
        ];
    recommendedSyllabusTopics = topics.length >= 4
      ? topics
      : [
          `${subject} Core Theoretical Foundations`,
          'Analytical & Quantitative Problem Solving',
          'Exam Technique & Trap Elimination Strategies',
          'Past Paper Synthesis & High-Yield Review'
        ];
  }

  // Calculate daily study target minutes
  const dailyTargetMinutes = daysRemaining <= 7
    ? 90
    : daysRemaining <= 21
    ? 60
    : 45;

  return {
    id: `plan-local-${Date.now()}`,
    createdAt: new Date().toISOString(),
    profile,
    daysRemaining,
    dailyStudyTargetMinutes: dailyTargetMinutes,
    examinerRoastSummary: roast,
    milestones,
    highYieldFocalPoints,
    recommendedSyllabusTopics,
  };
}
