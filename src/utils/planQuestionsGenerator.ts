import { QuizQuestion, ExamPlan } from '../types';
import { detectDiscipline } from './localPlanGenerator';

/**
 * Generates questions specifically customized to the student's Active Study Plan.
 * Works both with server endpoints and with 100% offline instant fallback so questions
 * are ALWAYS available and ALWAYS match the study plan.
 */
export async function generatePlanQuestions(
  plan?: ExamPlan | null,
  phase: 'pretest' | 'practice' = 'pretest',
  count: number = 5,
  subjectOverride?: string
): Promise<QuizQuestion[]> {
  const subject = subjectOverride || plan?.profile?.subject || 'STEM & Academic Mastery';
  const topics = (plan?.profile?.topics && plan.profile.topics.length > 0)
    ? plan.profile.topics
    : [subject, `${subject} Core Principles`, `${subject} Problem Solving`];
  const questionTypes = plan?.profile?.questionTypes || ['Multiple Choice'];
  const passagePreference = plan?.profile?.passageLengthPreference;

  // Try fetching from server if online
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);

    const res = await fetch('/api/quizzes/generate-daily', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        subject,
        topics,
        questionTypes,
        passageLengthPreference: passagePreference,
        isLongPassage: passagePreference === 'long-6-plus',
        count,
      }),
    });

    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.questions) && data.questions.length > 0) {
        return data.questions.slice(0, count);
      }
    }
  } catch {
    // Offline or connection-free mode: fall through to local generator
  }

  // 100% deterministic local generator tailored to study plan
  return generateLocalPlanQuestions(plan, phase, count, subjectOverride);
}

/**
 * Generates tailored exam questions based on the student's exact study plan.
 * Runs 100% on the client without network connection.
 */
export function generateLocalPlanQuestions(
  plan?: ExamPlan | null,
  phase: 'pretest' | 'practice' = 'pretest',
  count: number = 5,
  subjectOverride?: string
): QuizQuestion[] {
  const subject = subjectOverride || plan?.profile?.subject || 'High-Yield STEM';
  const topics = Array.isArray(plan?.profile?.topics) && plan.profile.topics.length > 0
    ? plan.profile.topics
    : [subject, `${subject} Core Principles`, `${subject} Trap Patterns`];
  const disc = detectDiscipline(subject, topics);
  const milestone = plan?.milestones?.[0];
  const milestoneFocus = milestone?.title || 'Core Syllabus Foundations';

  const isPretest = phase === 'pretest';
  const difficultyTag = isPretest ? 'Foundational Diagnostic Pretest' : 'High-Yield Deliberate Practice';

  // 1. ENGLISH & LITERATURE
  if (disc.isEnglish) {
    const passage = `[¶1] The industrial landscape did not merely transform physical geography; it fundamentally altered human perception of temporality. Where the rhythm of the seasons had once governed agricultural labor, the unyielding pulse of the steam whistle imposed an artificial cadence. Workers who had previously measured their day by the sun’s azimuth now found their existence parsed into clockwork increments, each minute commodified and accounted for.

[¶2] Writers of the Romantic era observed this encroachment with profound disquiet. For Wordsworth and Shelley, the machine was not a neutral conduit of prosperity, but an aesthetic and spiritual catastrophe that severed the link between consciousness and the natural sublime. In their verse, the pastoral is rarely an idyllic retreat from reality; rather, it functions as an urgent ideological defense against the mechanistic reduction of human dignity.`;

    const englishQuestions: QuizQuestion[] = [
      {
        id: `plan-eng-${Date.now()}-1`,
        topic: topics[0] || 'Rhetorical Analysis & Textual Inferences',
        question: `Based on the passage, the author's primary characterization of the steam whistle (Paragraph 1) serves chiefly to:`,
        options: [
          `Symbolize the transition from natural temporal rhythms to rigid industrial regimentation.`,
          `Praise the mechanical efficiency that allowed factories to standardize daily production.`,
          `Contrast the acoustic harshness of factory machinery with peaceful rural birdsong.`,
          `Illustrate how workers resisted new employment conditions through clandestine sabotage.`
        ],
        correctIndex: 0,
        angryExplanation: `Option A correctly identifies the symbolic function established in lines 2–4: replacing 'the rhythm of the seasons' with an 'artificial cadence' and 'clockwork increments'.`,
        examinerTrapNotes: `Option B reverses the critical tone. Option C is a sensory distractor not supported by the text. Option D introduces external historical facts not present in the excerpt.`,
        distractorExplanations: [
          `Option A is correct: the text explicitly links the whistle to 'an artificial cadence' imposing industrial time.`,
          `Option B reverses the authorial tone: the passage portrays this as an imposition, not celebratory progress.`,
          `Option C is a sensory distractor: birdsong is never mentioned or contrasted in Paragraph 1.`,
          `Option D introduces outside historical speculation unsupported by any sentence in the text.`
        ],
        passageTitle: `Literary Critique: The Mechanization of Time & The Romantic Response`,
        passage,
        difficulty: difficultyTag,
      },
      {
        id: `plan-eng-${Date.now()}-2`,
        topic: topics[1] || 'Authorial Perspective & Craft',
        question: `In Paragraph 2, the author's assertion that the pastoral 'functions as an urgent ideological defense' implies that Romantic poetry:`,
        options: [
          `Operated as a deliberate philosophical resistance against the dehumanizing logic of industrialization.`,
          `Consisted primarily of naive escapism devoid of engagement with contemporary economic reality.`,
          `Advocated for the total destruction of all manufacturing facilities across Western Europe.`,
          `Attempted to reform labor legislation through direct parliamentary petitioning.`
        ],
        correctIndex: 0,
        angryExplanation: `Option A accurately interprets 'urgent ideological defense against mechanistic reduction'. The author explicitly rejects naive escapism ('rarely an idyllic retreat').`,
        examinerTrapNotes: `Option B falls for the exact trap the author explicitly refutes ('rarely an idyllic retreat'). Option C and D exaggerate literary critique into literal physical or legislative actions.`,
        distractorExplanations: [
          `Option A is correct: the author portrays the verse as active intellectual and ideological pushback.`,
          `Option B contradicts the text: the author directly states it is 'rarely an idyllic retreat from reality'.`,
          `Option C exaggerates philosophical opposition into extreme physical sabotage.`,
          `Option D misidentifies poetry as direct legislative or parliamentary lobbying.`
        ],
        passageTitle: `Literary Critique: The Mechanization of Time & The Romantic Response`,
        passage,
        difficulty: difficultyTag,
      },
      {
        id: `plan-eng-${Date.now()}-3`,
        topic: topics[2] || 'Textual Evidence & Inference Pairing',
        question: `Which choice provides the best textual evidence for the claim that industrialization devalued the individual human experience?`,
        options: [
          `'each minute commodified and accounted for' (Paragraph 1) and 'mechanistic reduction of human dignity' (Paragraph 2)`,
          `'the rhythm of the seasons had once governed agricultural labor' (Paragraph 1)`,
          `'Writers of the Romantic era observed this encroachment with profound disquiet' (Paragraph 2)`,
          `'the machine was not a neutral conduit of prosperity' (Paragraph 2)`
        ],
        correctIndex: 0,
        angryExplanation: `Option A pairs the commodification of workers' time directly with the explicit loss of human dignity.`,
        examinerTrapNotes: `Evidence questions require direct textual pairing. The other options describe the historical background or author emotional states rather than devaluing human worth.`,
        distractorExplanations: [
          `Option A is correct: commodifying time and mechanistic reduction directly demonstrate devaluing human worth.`,
          `Option B describes prior agrarian baseline without showing the devaluation.`,
          `Option C describes the poets' emotional observation, not the objective loss of worker dignity.`,
          `Option D addresses the neutrality of machines rather than worker dehumanization.`
        ],
        passageTitle: `Literary Critique: The Mechanization of Time & The Romantic Response`,
        passage,
        difficulty: difficultyTag,
      },
      {
        id: `plan-eng-${Date.now()}-4`,
        topic: topics[0] || 'Vocabulary in Context & Nuance',
        question: `As used in Paragraph 1, the word 'parsed' most nearly means:`,
        options: [
          `Divided and analyzed systematically.`,
          `Misinterpreted by illiterate laborers.`,
          `Grammatically diagrammed on paper.`,
          `Celebrated with ceremonial precision.`
        ],
        correctIndex: 0,
        angryExplanation: `In this context, existence is 'parsed into clockwork increments'—meaning systematically divided, measured, and partitioned.`,
        examinerTrapNotes: `Secondary definition trap: 'parsed' commonly relates to grammar, but in this metaphorical context it signifies systematic mechanical division.`,
        distractorExplanations: [
          `Option A is correct: 'parsed into clockwork increments' means partitioned and quantified.`,
          `Option B misinterprets parsing as cognitive misunderstanding.`,
          `Option C uses the primary grammatical definition rather than the metaphorical context of the sentence.`,
          `Option D is completely unsupported by the tone of the passage.`
        ],
        passageTitle: `Literary Critique: The Mechanization of Time & The Romantic Response`,
        passage,
        difficulty: difficultyTag,
      },
      {
        id: `plan-eng-${Date.now()}-5`,
        topic: topics[1] || 'Syntactic Cadence & Tone Synthesis',
        question: `The overall tone of the excerpt can best be described as:`,
        options: [
          `Analytically critical and historically interpretive.`,
          `Nostalgically sentimental and scientifically cynical.`,
          `Detached, statistical, and economically impartial.`,
          `Resigned, defeatist, and emotionally indifferent.`
        ],
        correctIndex: 0,
        angryExplanation: `The author maintains an objective, academic analytical tone while critically interpreting the cultural and philosophical consequences of industrial change.`,
        examinerTrapNotes: `Tone traps often inject extreme emotional descriptors (e.g. 'defeatist' or 'sentimental') that contradict scholarly writing.`,
        distractorExplanations: [
          `Option A is correct: the tone combines formal scholarly analysis with critical thematic synthesis.`,
          `Option B overstates nostalgia: the passage is an intellectual critique, not sentimental longing.`,
          `Option C is false: the piece contains zero quantitative data or statistical charts.`,
          `Option D mischaracterizes the rigorous analytical prose as passive defeatism.`
        ],
        passageTitle: `Literary Critique: The Mechanization of Time & The Romantic Response`,
        passage,
        difficulty: difficultyTag,
      }
    ];
    return englishQuestions.slice(0, count);
  }

  // 2. CALCULUS & ADVANCED MATHEMATICS
  if (disc.isCalculus) {
    const t0 = topics[0] || 'Derivatives & Chain Rule';
    const t1 = topics[1] || 'Related Rates & Optimization';
    const t2 = topics[2] || 'Definite Integrals & FTC';

    const calcQuestions: QuizQuestion[] = [
      {
        id: `plan-calc-${Date.now()}-1`,
        topic: t0,
        question: `Let f(x) = sin(3x^2 + 1). Which expression represents f'(x)?`,
        options: [
          `6x · cos(3x^2 + 1)`,
          `cos(3x^2 + 1)`,
          `6x · sin(3x^2 + 1)`,
          `3 · cos(6x)`
        ],
        correctIndex: 0,
        angryExplanation: `By the Chain Rule: d/dx[sin(u)] = cos(u) · du/dx. Here u = 3x^2 + 1, so du/dx = 6x. Multiplying yields 6x · cos(3x^2 + 1).`,
        examinerTrapNotes: `The most common calculus blunder is forgetting the inner derivative du/dx. Option B fails to differentiate the argument.`,
        distractorExplanations: [
          `Option A is correct: outer derivative is cos(u), multiplied by inner derivative 6x.`,
          `Option B forgot the Chain Rule inner derivative entirely: du/dx = 6x was omitted.`,
          `Option C failed to differentiate the outer trigonometric function: sine remained sine.`,
          `Option D mistakenly multiplied the coefficient inside the argument instead of using the Chain Rule.`
        ],
        difficulty: difficultyTag,
      },
      {
        id: `plan-calc-${Date.now()}-2`,
        topic: t1,
        question: `A spherical balloon is inflated such that its volume increases at a constant rate of 12π cm³/s. At the instant when the radius is r = 3 cm, what is the rate of change of the radius (dr/dt)?`,
        options: [
          `1/3 cm/s`,
          `1 cm/s`,
          `4/3 cm/s`,
          `36π cm/s`
        ],
        correctIndex: 0,
        angryExplanation: `Volume V = (4/3)πr³. Differentiating with respect to time t: dV/dt = 4πr²(dr/dt). Substituting dV/dt = 12π and r = 3: 12π = 4π(3)²(dr/dt) = 36π(dr/dt). Thus dr/dt = 12π / 36π = 1/3 cm/s.`,
        examinerTrapNotes: `Never substitute r = 3 before differentiating! Always differentiate V with respect to time first using the Chain Rule (dr/dt).`,
        distractorExplanations: [
          `Option A is correct: 12π / (4π · 9) = 12 / 36 = 1/3 cm/s.`,
          `Option B forgot the r² factor in the surface area derivative.`,
          `Option C confused the 4/3 volume coefficient with the derivative coefficient.`,
          `Option D multiplied dV/dt by r instead of solving for dr/dt.`
        ],
        difficulty: difficultyTag,
      },
      {
        id: `plan-calc-${Date.now()}-3`,
        topic: t2,
        question: `Let g(x) = ∫[2 to x³] sqrt(1 + t²) dt. What is g'(x)?`,
        options: [
          `3x² · sqrt(1 + x⁶)`,
          `sqrt(1 + x⁶)`,
          `sqrt(1 + x³)`,
          `(3x² / 2) · sqrt(1 + x⁶) - sqrt(5)`
        ],
        correctIndex: 0,
        angryExplanation: `By the Fundamental Theorem of Calculus Part 1 combined with the Chain Rule: d/dx ∫[a to u(x)] f(t)dt = f(u(x)) · u'(x). Here u(x) = x³, so u'(x) = 3x² and f(u(x)) = sqrt(1 + (x³)² ) = sqrt(1 + x⁶). Multiplying gives 3x² · sqrt(1 + x⁶).`,
        examinerTrapNotes: `Exam Trap: Failing to multiply by the upper bound's derivative (3x²). The lower limit of integration (2) has a derivative of zero and contributes nothing.`,
        distractorExplanations: [
          `Option A is correct: FTC Part 1 requires substituting the upper limit u(x) and multiplying by u'(x) = 3x².`,
          `Option B forgot the Chain Rule factor 3x² from the upper limit.`,
          `Option C failed to square the x³ argument inside the radical.`,
          `Option D incorrectly evaluated the lower constant limit instead of recognizing its derivative is zero.`
        ],
        difficulty: difficultyTag,
      },
      {
        id: `plan-calc-${Date.now()}-4`,
        topic: t0,
        question: `Evaluate the limit: lim (x → 0) [ (e^(2x) - 1 - 2x) / x² ].`,
        options: [
          `2`,
          `0`,
          `1`,
          `Undefined / Does Not Exist`
        ],
        correctIndex: 0,
        angryExplanation: `At x = 0, direct substitution yields 0/0. Applying L'Hôpital's Rule: lim (x → 0) [ (2e^(2x) - 2) / 2x ]. This is still 0/0. Applying L'Hôpital's Rule a second time: lim (x → 0) [ 4e^(2x) / 2 ] = 4(1) / 2 = 2. Alternatively, use the Taylor expansion e^(2x) = 1 + 2x + (2x)²/2! + ...`,
        examinerTrapNotes: `Remember to check the 0/0 precondition before each application of L'Hôpital's Rule. Stopping after the first step yields 0/0, not 0.`,
        distractorExplanations: [
          `Option A is correct: two applications of L'Hôpital's Rule yield 4/2 = 2.`,
          `Option B prematurely assumed the limit is 0 before completing the second derivative.`,
          `Option C lost the factor of 2 during the chain derivative of e^(2x).`,
          `Option D failed to recognize that L'Hôpital's Rule resolves indeterminate forms.`
        ],
        difficulty: difficultyTag,
      },
      {
        id: `plan-calc-${Date.now()}-5`,
        topic: t1,
        question: `A rectangular field is to be fenced using 120 meters of fencing against an existing stone wall (so only three sides require fencing). What dimensions maximize the enclosed area?`,
        options: [
          `Width = 30 m, Length = 60 m (Area = 1800 m²)`,
          `Width = 40 m, Length = 40 m (Area = 1600 m²)`,
          `Width = 20 m, Length = 80 m (Area = 1600 m²)`,
          `Width = 25 m, Length = 70 m (Area = 1750 m²)`
        ],
        correctIndex: 0,
        angryExplanation: `Constraint: 2W + L = 120, so L = 120 - 2W. Objective Area A = W · L = W(120 - 2W) = 120W - 2W². Differentiating: dA/dW = 120 - 4W = 0 -> W = 30 m. Length L = 120 - 2(30) = 60 m. Enclosed area = 30 · 60 = 1800 m².`,
        examinerTrapNotes: `Standard square trap: while a 4-sided fence is maximized by a square, a 3-sided fence against a wall always yields Length = 2 · Width!`,
        distractorExplanations: [
          `Option A is correct: setting dA/dW = 0 gives W = 30 m and L = 60 m.`,
          `Option B assumes a square, which is only optimal when all 4 sides require fencing.`,
          `Option C yields 1600 m², which is lower than the optimal 1800 m².`,
          `Option D uses incorrect calculus critical values.`
        ],
        difficulty: difficultyTag,
      }
    ];
    return calcQuestions.slice(0, count);
  }

  // 3. ALGEBRA & GEOMETRY
  if (disc.isAlgebra1 || disc.isAlgebra2 || disc.isGeometry) {
    const t0 = topics[0] || 'Quadratic Functions & Factoring';
    const t1 = topics[1] || 'Polynomials & Exponential Growth';
    const t2 = topics[2] || 'Circle Theorems & Coordinate Geometry';

    const algebraQuestions: QuizQuestion[] = [
      {
        id: `plan-alg-${Date.now()}-1`,
        topic: t0,
        question: `What is the vertex of the quadratic parabola defined by f(x) = 2x² - 12x + 11?`,
        options: [
          `(3, -7)`,
          `(-3, 65)`,
          `(3, 11)`,
          `(6, 11)`
        ],
        correctIndex: 0,
        angryExplanation: `The x-coordinate of the vertex of ax² + bx + c is given by h = -b / (2a). Here a = 2, b = -12, so h = -(-12) / (2 · 2) = 12 / 4 = 3. Substituting x = 3 into f(x): f(3) = 2(3)² - 12(3) + 11 = 2(9) - 36 + 11 = 18 - 36 + 11 = -7. Vertex is (3, -7).`,
        examinerTrapNotes: `Sign error trap: -b/(2a) has a minus sign. Do not drop the negative sign when b is already negative.`,
        distractorExplanations: [
          `Option A is correct: h = -(-12)/(4) = 3; k = f(3) = -7.`,
          `Option B dropped the negative sign, computing -b/(2a) as -3.`,
          `Option C used the y-intercept (0, 11) as the vertex y-coordinate.`,
          `Option D used -b/a = 6 instead of -b/(2a).`
        ],
        difficulty: difficultyTag,
      },
      {
        id: `plan-alg-${Date.now()}-2`,
        topic: t1,
        question: `If 3^(2x - 1) = 27^(x - 2), what is the value of x?`,
        options: [
          `5`,
          `7`,
          `3`,
          `9`
        ],
        correctIndex: 0,
        angryExplanation: `Express both sides with the same base: 27 = 3³. Thus 27^(x - 2) = (3³)^(x - 2) = 3^(3x - 6). Setting exponents equal: 2x - 1 = 3x - 6 -> -1 + 6 = 3x - 2x -> x = 5.`,
        examinerTrapNotes: `Power of a power rule: multiply exponents, distributing 3 across (x - 2) to get 3x - 6, not 3x - 2!`,
        distractorExplanations: [
          `Option A is correct: 2x - 1 = 3x - 6 implies x = 5.`,
          `Option B forgot to distribute 3 to the -2 (calculating 2x - 1 = 3x - 2 -> x = 1).`,
          `Option C set 2x - 1 = x - 2 without converting 27 to base 3.`,
          `Option D made an arithmetic error isolating x.`
        ],
        difficulty: difficultyTag,
      },
      {
        id: `plan-alg-${Date.now()}-3`,
        topic: t2,
        question: `A circle in the xy-plane has equation x² + y² - 6x + 8y = 0. What are the coordinates of its center and its radius?`,
        options: [
          `Center (3, -4), Radius = 5`,
          `Center (-3, 4), Radius = 25`,
          `Center (6, -8), Radius = 10`,
          `Center (3, -4), Radius = 7`
        ],
        correctIndex: 0,
        angryExplanation: `Complete the square: (x² - 6x + 9) + (y² + 8y + 16) = 0 + 9 + 16 -> (x - 3)² + (y + 4)² = 25. The center is (3, -4) and radius r = sqrt(25) = 5.`,
        examinerTrapNotes: `Radius squared trap: the right hand side equals r², so r = sqrt(25) = 5, not 25! Also reverse signs for (x - h) and (y - k).`,
        distractorExplanations: [
          `Option A is correct: completing the square yields (x - 3)² + (y + 4)² = 5².`,
          `Option B reversed signs of h and k and forgot to take the square root of 25.`,
          `Option C used coefficients without dividing by 2.`,
          `Option D miscalculated the sum of square completion constants.`
        ],
        difficulty: difficultyTag,
      },
      {
        id: `plan-alg-${Date.now()}-4`,
        topic: t0,
        question: `For what value of k will the quadratic equation x² - 8x + k = 0 have exactly one real solution (a double root)?`,
        options: [
          `16`,
          `64`,
          `-16`,
          `8`
        ],
        correctIndex: 0,
        angryExplanation: `A quadratic ax² + bx + c = 0 has exactly one real solution when its discriminant Δ = b² - 4ac = 0. Here a = 1, b = -8, c = k. Thus (-8)² - 4(1)(k) = 0 -> 64 - 4k = 0 -> 4k = 64 -> k = 16.`,
        examinerTrapNotes: `Discriminant trap: Δ = b² - 4ac, not b² - ac.`,
        distractorExplanations: [
          `Option A is correct: Δ = 64 - 4k = 0 yields k = 16.`,
          `Option B forgot to divide by 4a, setting k = b² = 64.`,
          `Option C introduced an extraneous negative sign.`,
          `Option D used -b instead of b²/(4a).`
        ],
        difficulty: difficultyTag,
      },
      {
        id: `plan-alg-${Date.now()}-5`,
        topic: t1,
        question: `If f(x) = log₂(x + 4) - 3, what is the x-intercept of the graph of f?`,
        options: [
          `4`,
          `8`,
          `0`,
          `-3`
        ],
        correctIndex: 0,
        angryExplanation: `To find the x-intercept, set f(x) = 0: log₂(x + 4) - 3 = 0 -> log₂(x + 4) = 3. In exponential form: x + 4 = 2³ = 8 -> x = 8 - 4 = 4.`,
        examinerTrapNotes: `Remember 2³ = 8, not 6! And subtract 4 from 8.`,
        distractorExplanations: [
          `Option A is correct: x + 4 = 2³ = 8, so x = 4.`,
          `Option B is 2³ before subtracting the +4 shift.`,
          `Option C calculates f(0) = log₂(4) - 3 = 2 - 3 = -1 (y-intercept, not x-intercept).`,
          `Option D is the vertical asymptote x = -4 plus 1.`
        ],
        difficulty: difficultyTag,
      }
    ];
    return algebraQuestions.slice(0, count);
  }

  // 4. PHYSICS & MECHANICS
  if (disc.isPhysics) {
    const t0 = topics[0] || 'Newtonian Dynamics & Forces';
    const t1 = topics[1] || 'Conservation of Energy & Momentum';
    const t2 = topics[2] || 'Circuits & Kirchhoff Laws';

    const physQuestions: QuizQuestion[] = [
      {
        id: `plan-phys-${Date.now()}-1`,
        topic: t0,
        question: `A block of mass m = 4 kg sits on a frictionless ramp inclined at 30° to the horizontal. What is the magnitude of the block's acceleration down the incline? (Use g = 9.8 m/s²)`,
        options: [
          `4.9 m/s²`,
          `9.8 m/s²`,
          `8.5 m/s²`,
          `19.6 m/s²`
        ],
        correctIndex: 0,
        angryExplanation: `The force component parallel to the incline is F_parallel = m · g · sin(θ). By Newton's second law, a = F_parallel / m = g · sin(θ). Here g · sin(30°) = 9.8 · (0.5) = 4.9 m/s². The mass m cancels out!`,
        examinerTrapNotes: `Mass trap: Students often multiply or divide by mass unnecessarily. Acceleration on a frictionless incline is independent of mass: a = g sin(θ).`,
        distractorExplanations: [
          `Option A is correct: a = 9.8 · sin(30°) = 4.9 m/s².`,
          `Option B used the full vertical gravitational acceleration without resolving along the incline.`,
          `Option C used cos(30°) instead of sin(30°), confusing the perpendicular component with the parallel component.`,
          `Option D calculated the force (m · g · sin θ = 19.6 N) instead of the acceleration.`
        ],
        difficulty: difficultyTag,
      },
      {
        id: `plan-phys-${Date.now()}-2`,
        topic: t1,
        question: `A 2 kg cart moving east at 6 m/s collides head-on and sticks to a stationary 4 kg cart on a frictionless track. What is the velocity of the coupled carts immediately after the collision?`,
        options: [
          `2.0 m/s east`,
          `3.0 m/s east`,
          `1.5 m/s east`,
          `6.0 m/s east`
        ],
        correctIndex: 0,
        angryExplanation: `In a completely inelastic collision, linear momentum is conserved: m1·v1 + m2·v2 = (m1 + m2)·v_final. Here (2 kg)(6 m/s) + (4 kg)(0) = (2 + 4) kg · v_final -> 12 kg·m/s = 6 kg · v_final -> v_final = 2.0 m/s east.`,
        examinerTrapNotes: `Kinetic energy is NOT conserved in an inelastic collision! Always use conservation of momentum: p_initial = p_final.`,
        distractorExplanations: [
          `Option A is correct: total momentum 12 / total mass 6 = 2 m/s.`,
          `Option B divided 6 m/s by 2 instead of dividing total momentum by total mass.`,
          `Option C made an arithmetic division error: 12 / 6 = 2, not 1.5.`,
          `Option D assumed velocity remains unchanged despite acquiring additional stationary mass.`
        ],
        difficulty: difficultyTag,
      },
      {
        id: `plan-phys-${Date.now()}-3`,
        topic: t2,
        question: `Two identical resistors of resistance R = 6 Ω are connected in parallel across a 12 V ideal battery. What is the total current drawn from the battery?`,
        options: [
          `4.0 A`,
          `1.0 A`,
          `2.0 A`,
          `8.0 A`
        ],
        correctIndex: 0,
        angryExplanation: `In parallel: 1/R_eq = 1/6 + 1/6 = 2/6 = 1/3, so R_eq = 3 Ω. Total current I = V / R_eq = 12 V / 3 Ω = 4.0 A. (Each branch draws 12/6 = 2 A; sum of branch currents = 4 A).`,
        examinerTrapNotes: `Series vs Parallel Trap: If in series, R_eq = 12 Ω and I = 1 A. In parallel, equivalent resistance decreases!`,
        distractorExplanations: [
          `Option A is correct: R_eq = 3 Ω, so I = 12 V / 3 Ω = 4.0 A.`,
          `Option B mistakenly treated the resistors as connected in series (12 V / 12 Ω = 1 A).`,
          `Option C found the current in only one branch (2 A) instead of the total current from the battery.`,
          `Option D used an incorrect power formula.`
        ],
        difficulty: difficultyTag,
      },
      {
        id: `plan-phys-${Date.now()}-4`,
        topic: t1,
        question: `A 0.5 kg ball is dropped from a height of 20 meters. Neglecting air resistance, what is its speed just before impact with the ground? (Use g = 9.8 m/s²)`,
        options: [
          `19.8 m/s`,
          `14.0 m/s`,
          `392 m/s`,
          `9.8 m/s`
        ],
        correctIndex: 0,
        angryExplanation: `Conservation of mechanical energy: m·g·h = (1/2)m·v² -> v = sqrt(2gh) = sqrt(2 · 9.8 · 20) = sqrt(392) ≈ 19.8 m/s.`,
        examinerTrapNotes: `Remember to take the square root of 2gh. 392 is v², not v!`,
        distractorExplanations: [
          `Option A is correct: v = sqrt(2 · 9.8 · 20) ≈ 19.8 m/s.`,
          `Option B omitted the factor of 2 in sqrt(2gh).`,
          `Option C forgot to take the square root of v² = 392.`,
          `Option D used acceleration directly instead of calculating final velocity.`
        ],
        difficulty: difficultyTag,
      },
      {
        id: `plan-phys-${Date.now()}-5`,
        topic: t0,
        question: `An elevator of mass 800 kg is accelerating upward at 2.0 m/s². What is the tension in the supporting cable? (Use g = 9.8 m/s²)`,
        options: [
          `9,440 N`,
          `7,840 N`,
          `6,240 N`,
          `1,600 N`
        ],
        correctIndex: 0,
        angryExplanation: `Choosing upward as positive: ΣF_y = T - mg = m·a -> T = m(g + a) = 800 kg · (9.8 + 2.0) m/s² = 800 · 11.8 = 9,440 N.`,
        examinerTrapNotes: `Upward acceleration increases tension (apparent weight > true weight). Downward acceleration decreases tension: T = m(g - a).`,
        distractorExplanations: [
          `Option A is correct: T = 800 · (9.8 + 2.0) = 9,440 N.`,
          `Option B calculated static weight mg without accounting for upward acceleration.`,
          `Option C subtracted acceleration (m(g - a)), which occurs during downward acceleration.`,
          `Option D calculated only the net force (m · a = 1,600 N) instead of the cable tension.`
        ],
        difficulty: difficultyTag,
      }
    ];
    return physQuestions.slice(0, count);
  }

  // 5. CHEMISTRY & STOICHIOMETRY
  if (disc.isChemistry) {
    const t0 = topics[0] || 'Chemical Equilibrium & Le Chatelier';
    const t1 = topics[1] || 'Acid-Base Buffers & Titration';
    const t2 = topics[2] || 'Thermodynamics & Reaction Kinetics';

    const chemQuestions: QuizQuestion[] = [
      {
        id: `plan-chem-${Date.now()}-1`,
        topic: t0,
        question: `For the exothermic reaction N2(g) + 3 H2(g) ⇌ 2 NH3(g) (ΔH < 0), which change will shift equilibrium to produce MORE NH3?`,
        options: [
          `Decreasing the temperature while increasing total system pressure.`,
          `Increasing the temperature while adding an iron catalyst.`,
          `Decreasing the pressure by expanding vessel volume.`,
          `Removing N2 gas from the reaction chamber continuously.`
        ],
        correctIndex: 0,
        angryExplanation: `By Le Chatelier's principle, for an exothermic reaction (heat is a product), lowering temperature shifts right to generate heat. Increasing pressure shifts toward fewer gas moles (4 moles on left -> 2 moles on right), driving synthesis of NH3.`,
        examinerTrapNotes: `Catalysts accelerate both forward and reverse rates equally; they NEVER shift the position of equilibrium!`,
        distractorExplanations: [
          `Option A is correct: lower T favors exothermic forward shift; higher P favors fewer gas moles.`,
          `Option B: increasing T shifts endothermically (left), and catalysts do not shift equilibrium.`,
          `Option C: expanding volume decreases pressure, shifting toward more gas moles (left).`,
          `Option D: removing reactant shifts left to replace missing reactant.`
        ],
        difficulty: difficultyTag,
      },
      {
        id: `plan-chem-${Date.now()}-2`,
        topic: t1,
        question: `What is the pH of an aqueous buffer containing 0.20 M acetic acid (CH3COOH, pKa = 4.76) and 0.20 M sodium acetate (CH3COONa)?`,
        options: [
          `4.76`,
          `7.00`,
          `1.00`,
          `9.24`
        ],
        correctIndex: 0,
        angryExplanation: `By the Henderson-Hasselbalch equation: pH = pKa + log([A-]/[HA]). When conjugate base and weak acid concentrations are equal ([A-] = [HA] = 0.20 M), the ratio is 1, and log(1) = 0. Therefore, pH = pKa = 4.76.`,
        examinerTrapNotes: `Equimolar buffer trap: when [conjugate base] = [weak acid], pH ALWAYS equals pKa.`,
        distractorExplanations: [
          `Option A is correct: log(0.20/0.20) = log(1) = 0, so pH = pKa = 4.76.`,
          `Option B assumes a neutral pH 7, ignoring the weak acid equilibrium.`,
          `Option C is a strong acid pH estimate.`,
          `Option D is 14 - pKa (the pKb of acetate).`
        ],
        difficulty: difficultyTag,
      },
      {
        id: `plan-chem-${Date.now()}-3`,
        topic: t2,
        question: `A chemical reaction has a positive enthalpy change (ΔH > 0) and a positive entropy change (ΔS > 0). Under what conditions is the reaction spontaneous?`,
        options: [
          `Spontaneous only at high temperatures (where T·ΔS > ΔH).`,
          `Spontaneous at all temperatures.`,
          `Non-spontaneous at all temperatures.`,
          `Spontaneous only at very low temperatures.`
        ],
        correctIndex: 0,
        angryExplanation: `Gibbs free energy equation: ΔG = ΔH - T·ΔS. For spontaneity, ΔG must be negative (< 0). If both ΔH and ΔS are positive, -T·ΔS is negative. At high temperatures, the magnitude of T·ΔS exceeds ΔH, driving ΔG < 0.`,
        examinerTrapNotes: `Signs of Gibbs energy: when both ΔH and ΔS share the same sign, temperature dictates whether enthalpy or entropy dominates!`,
        distractorExplanations: [
          `Option A is correct: ΔG = ΔH - TΔS < 0 occurs when T > ΔH/ΔS.`,
          `Option B occurs only when ΔH < 0 and ΔS > 0.`,
          `Option C occurs only when ΔH > 0 and ΔS < 0.`,
          `Option D occurs when ΔH < 0 and ΔS < 0.`
        ],
        difficulty: difficultyTag,
      },
      {
        id: `plan-chem-${Date.now()}-4`,
        topic: t0,
        question: `Which set of quantum numbers (n, l, ml, ms) is NOT allowed for an electron in an atom?`,
        options: [
          `n = 2, l = 2, ml = 0, ms = +1/2`,
          `n = 3, l = 1, ml = -1, ms = -1/2`,
          `n = 4, l = 0, ml = 0, ms = +1/2`,
          `n = 3, l = 2, ml = +2, ms = -1/2`
        ],
        correctIndex: 0,
        angryExplanation: `The azimuthal quantum number l must satisfy 0 ≤ l ≤ n - 1. When n = 2, the allowed values of l are only 0 (s orbital) and 1 (p orbital). An l value of 2 (d orbital) is forbidden at n = 2!`,
        examinerTrapNotes: `Remember l can never equal or exceed n. For n = 2, l can only be 0 or 1.`,
        distractorExplanations: [
          `Option A is forbidden: l cannot equal 2 when n = 2 (l < n always).`,
          `Option B is allowed: 3p orbital electron.`,
          `Option C is allowed: 4s orbital electron.`,
          `Option D is allowed: 3d orbital electron.`
        ],
        difficulty: difficultyTag,
      },
      {
        id: `plan-chem-${Date.now()}-5`,
        topic: t1,
        question: `How many grams of NaOH (molar mass = 40.0 g/mol) are required to prepare 500 mL of a 0.25 M solution?`,
        options: [
          `5.0 g`,
          `10.0 g`,
          `2.5 g`,
          `20.0 g`
        ],
        correctIndex: 0,
        angryExplanation: `Moles needed = Molarity × Volume (L) = 0.25 mol/L × 0.500 L = 0.125 mol. Mass = moles × molar mass = 0.125 mol × 40.0 g/mol = 5.0 g.`,
        examinerTrapNotes: `Volume in Liters: students frequently forget to convert 500 mL to 0.500 L, calculating 0.25 × 500 = 125 moles!`,
        distractorExplanations: [
          `Option A is correct: 0.25 M × 0.5 L × 40 g/mol = 5.0 g.`,
          `Option B used 1.0 L volume instead of 0.5 L (500 mL).`,
          `Option C divided by 2 twice.`,
          `Option D multiplied by 4 instead of dividing by 2.`
        ],
        difficulty: difficultyTag,
      }
    ];
    return chemQuestions.slice(0, count);
  }

  // 6. HISTORY, SOCIAL STUDIES & GOVERNMENT
  if (disc.isHistory) {
    const t0 = topics[0] || 'Constitutional Framework & Separation of Powers';
    const t1 = topics[1] || 'Cold War Geopolitics & Containment';
    const t2 = topics[2] || 'Macroeconomics: Fiscal & Monetary Policy';

    const historyQuestions: QuizQuestion[] = [
      {
        id: `plan-hist-${Date.now()}-1`,
        topic: t0,
        question: `In Federalist No. 51, James Madison argued that the primary mechanism to prevent tyranny in a constitutional republic was:`,
        options: [
          `Pitting ambition against ambition through checks and balances between separate governmental branches.`,
          `Relying on the innate moral virtue and civic purity of elected representatives.`,
          `Eliminating state legislatures to concentrate all authority in a unitary executive.`,
          `Requiring unanimous popular referendums for all federal legislation.`
        ],
        correctIndex: 0,
        angryExplanation: `Madison famously wrote: 'Ambition must be made to counteract ambition. The interest of the man must be connected with the constitutional rights of the place.' He argued that relying on human virtue alone was insufficient ('If men were angels, no government would be necessary').`,
        examinerTrapNotes: `Federalist 51 focuses on structural separation of powers and reciprocal checks, not trusting virtuous intentions or direct democracy.`,
        distractorExplanations: [
          `Option A is correct: structural ambition vs ambition is Madison's foundational argument.`,
          `Option B is explicitly refuted by Madison's famous 'if men were angels' premise.`,
          `Option C contradicts federalism; Madison defended shared state-federal sovereignty.`,
          `Option D describes direct democratic referendums, which the framers deliberately avoided in favor of a republic.`
        ],
        difficulty: difficultyTag,
      },
      {
        id: `plan-hist-${Date.now()}-2`,
        topic: t1,
        question: `The Truman Doctrine (1947) fundamentally redirected American foreign policy by committing the United States to:`,
        options: [
          `Providing financial and military aid to free peoples resisting armed subjugation by authoritarian communist minorities (Containment).`,
          `Directly invading mainland Eastern Europe to overthrow existing Warsaw Pact governments (Rollback).`,
          `Returning to interwar hemispheric isolationism and terminating all European alliances.`,
          `Signing a formal bilateral non-aggression pact with the Soviet Union in Greece and Turkey.`
        ],
        correctIndex: 0,
        angryExplanation: `Prompted by crises in Greece and Turkey, Truman pledged US support for free peoples resisting subjugation by armed minorities or outside pressures, cementing George Kennan's 'Containment' strategy as the cornerstone of Cold War policy.`,
        examinerTrapNotes: `Containment vs Rollback: Truman sought to contain Soviet expansion, not initiate an offensive rollback invasion of Eastern Europe.`,
        distractorExplanations: [
          `Option A is correct: Truman pledged aid to Greece and Turkey, establishing containment.`,
          `Option B describes aggressive rollback, which was rejected in favor of containment.`,
          `Option C describes pre-WWII isolationism, which the doctrine permanently ended.`,
          `Option D is historically inaccurate: no bilateral pact was formed with the USSR.`
        ],
        difficulty: difficultyTag,
      },
      {
        id: `plan-hist-${Date.now()}-3`,
        topic: t2,
        question: `During an inflationary period when aggregate demand exceeds potential output, which combination of fiscal and monetary policies is contractive?`,
        options: [
          `Raising federal interest rates (selling open-market bonds) while reducing government spending or increasing taxes.`,
          `Lowering reserve requirements while expanding federal infrastructure stimulus budgets.`,
          `Purchasing government securities in the open market while cutting corporate income taxes.`,
          `Implementing quantitative easing while subsidizing consumer credit lines.`
        ],
        correctIndex: 0,
        angryExplanation: `To combat inflation, contractionary monetary policy raises the federal funds rate (or sells bonds to absorb bank reserves), while contractionary fiscal policy decreases government spending and/or raises taxes to cool aggregate demand.`,
        examinerTrapNotes: `Expansionary vs Contractionary: Lowering rates and cutting taxes inject liquidity, accelerating inflation!`,
        distractorExplanations: [
          `Option A is correct: higher rates + reduced spending cools overheated aggregate demand.`,
          `Option B is expansionary: lower reserve requirements expand money supply.`,
          `Option C is expansionary: purchasing bonds injects cash reserves into the banking system.`,
          `Option D is hyper-expansionary stimulus.`
        ],
        difficulty: difficultyTag,
      },
      {
        id: `plan-hist-${Date.now()}-4`,
        topic: t0,
        question: `Which landmark Supreme Court decision established the principle of judicial review under Article III of the US Constitution?`,
        options: [
          `Marbury v. Madison (1803)`,
          `McCulloch v. Maryland (1819)`,
          `Gibbons v. Ogden (1824)`,
          `Dred Scott v. Sandford (1857)`
        ],
        correctIndex: 0,
        angryExplanation: `Chief Justice John Marshall held that it is 'emphatically the province and duty of the judicial department to say what the law is,' invalidating Section 13 of the Judiciary Act of 1789 and establishing judicial review.`,
        examinerTrapNotes: `McCulloch established implied powers and federal supremacy. Gibbons established federal commerce clause supremacy. Marbury established judicial review!`,
        distractorExplanations: [
          `Option A is correct: Marshall established that the Supreme Court can declare federal laws unconstitutional.`,
          `Option B established implied powers and the Necessary and Proper Clause.`,
          `Option C established federal control over interstate commerce.`,
          `Option D addressed citizenship and territorial slavery legislation.`
        ],
        difficulty: difficultyTag,
      },
      {
        id: `plan-hist-${Date.now()}-5`,
        topic: t1,
        question: `What was the primary economic objective of the Marshall Plan (European Recovery Program) initiated in 1948?`,
        options: [
          `Rebuilding Western European industrial infrastructure to foster economic stability and prevent electoral communist takeovers.`,
          `Extracting heavy monetary reparations from defeated Axis powers to pay off US wartime debt.`,
          `Establishing a single unified European currency pegged directly to the British pound sterling.`,
          `Forbidding Western European nations from participating in international trade with the Americas.`
        ],
        correctIndex: 0,
        angryExplanation: `Secretary of State George Marshall recognized that postwar hunger and economic collapse created fertile ground for communist parties in France and Italy. Providing over $13 billion in aid stabilized democratic market economies.`,
        examinerTrapNotes: `The US explicitly avoided repeating the Versailles Treaty punitive reparations mistake; the Marshall Plan provided grants and financing to rebuild economies.`,
        distractorExplanations: [
          `Option A is correct: reviving European production checked Soviet influence and secured trade.`,
          `Option B describes the punitive reparations of Versailles, which the Marshall Plan avoided.`,
          `Option C refers to decades-later euro developments.`,
          `Option D is false; the plan expanded international Atlantic trade.`
        ],
        difficulty: difficultyTag,
      }
    ];
    return historyQuestions.slice(0, count);
  }

  // 7. WORLD LANGUAGES & LINGUISTICS
  if (disc.isLanguage) {
    const t0 = topics[0] || 'Subjunctive Mood vs Indicative in Dependent Clauses';
    const t1 = topics[1] || 'Past Aspect: Imperfect vs Preterite / Passé Composé';
    const t2 = topics[2] || 'Direct & Indirect Object Pronoun Positioning';

    const langQuestions: QuizQuestion[] = [
      {
        id: `plan-lang-${Date.now()}-1`,
        topic: t0,
        question: `In Romance languages (Spanish/French/Italian), which trigger clause requires the verb in the subordinate clause to take the SUBJUNCTIVE mood rather than the indicative?`,
        options: [
          `An expression of doubt, volition, or subjective emotional reaction with a change in subject (e.g., 'I doubt that he arrives on time').`,
          `An expression of objective certainty and verified factual truth (e.g., 'It is clear that he arrives on time').`,
          `A habitual recurring past action described with background context.`,
          `A direct command addressed to a second-person informal singular listener.`
        ],
        correctIndex: 0,
        angryExplanation: `The subjunctive mood communicates non-reality, doubt, desire, emotion, or uncertainty. When the main clause expresses doubt ('dudo que...') or wish ('quiero que...') and there is a change of subject, the subordinate verb must be subjunctive. Certainty ('es obvio que...') takes the indicative.`,
        examinerTrapNotes: `Certainty vs Doubt: Expressions like 'es seguro que' or 'es verdad que' trigger INDICATIVE because they assert objective reality.`,
        distractorExplanations: [
          `Option A is correct: doubt, emotion, and necessity with subject shifts trigger subjunctive.`,
          `Option B requires the indicative because it affirms factual truth.`,
          `Option C describes the imperfect aspect, not mood triggers.`,
          `Option D uses the imperative mood.`
        ],
        difficulty: difficultyTag,
      },
      {
        id: `plan-lang-${Date.now()}-2`,
        topic: t1,
        question: `When narrating past events, what is the fundamental grammatical distinction between the Preterite (Passé Composé) and the Imperfect?`,
        options: [
          `The Preterite denotes completed, bounded actions with specific endpoints, while the Imperfect denotes ongoing background conditions, states, or habitual actions without defined temporal boundaries.`,
          `The Preterite is used exclusively for hypothetical events, while the Imperfect denotes present realities.`,
          `The Preterite is only used in formal written poetry, while the Imperfect is colloquial speech.`,
          `The Preterite must always be followed by the future conditional tense.`
        ],
        correctIndex: 0,
        angryExplanation: `Aspect governs past tense selection: Preterite views an event as a discrete, completed whole along the timeline ('She arrived at 3 PM'). The Imperfect describes the ongoing setting, emotional state, or repeated habit ('The sun was shining and she used to walk every day').`,
        examinerTrapNotes: `Aspectual trap: Ask yourself 'Did this action occur as an interrupting, completed event, or was it the continuous backdrop?' Interrupting events take the preterite!`,
        distractorExplanations: [
          `Option A is correct: completed bounded events vs ongoing/habitual background aspect.`,
          `Option B confuses indicative past tenses with conditional/subjunctive moods.`,
          `Option C is false: both tenses are used daily across written and spoken communication.`,
          `Option D invents an arbitrary, nonexistent grammatical rule.`
        ],
        difficulty: difficultyTag,
      },
      {
        id: `plan-lang-${Date.now()}-3`,
        topic: t2,
        question: `When both a direct object pronoun (DOP) and an indirect object pronoun (IOP) appear together in a sentence before a conjugated verb, what is the universal order?`,
        options: [
          `The Indirect Object Pronoun precedes the Direct Object Pronoun (People before Things / IOP + DOP).`,
          `The Direct Object Pronoun always precedes the Indirect Object Pronoun.`,
          `The pronoun with the longest syllable length must always come first.`,
          `Direct and indirect pronouns can never be used simultaneously in the same sentence.`
        ],
        correctIndex: 0,
        angryExplanation: `In Spanish and French clitic sequences, indirect object pronouns (to/for whom) precede direct object pronouns (what is received): e.g., 'Ella me (IOP) lo (DOP) dio' or 'Il me (IOP) le (DOP) donne'. In Spanish, 'le/les' changes to 'se' before 'lo/la/los/las'.`,
        examinerTrapNotes: `Pronoun order: Remember 'People before Things' (IOP before DOP). In Spanish, remember the 'se lo' rule preventing 'le lo'.`,
        distractorExplanations: [
          `Option A is correct: IOP always precedes DOP in clitic pronouns.`,
          `Option B reverses the required clitic sequence.`,
          `Option C is an invented rule unsupported by phonology or syntax.`,
          `Option D is false: double object pronouns are ubiquitous in natural conversation.`
        ],
        difficulty: difficultyTag,
      },
      {
        id: `plan-lang-${Date.now()}-4`,
        topic: t0,
        question: `What is a 'false friend' (faux ami) in language acquisition, and why is it dangerous on examinations?`,
        options: [
          `A word that looks or sounds identical to a word in the learner's native language but has a radically different meaning.`,
          `A classmate who intentionally provides incorrect vocabulary definitions during study groups.`,
          `An irregular verb that changes to a completely different conjugation stem in the past tense.`,
          `A grammatical gender ending that deviates from masculine and feminine rules.`
        ],
        correctIndex: 0,
        angryExplanation: `A false cognate (false friend) shares deceptive orthographic or phonetic resemblance across languages while possessing distinct sematics (e.g., Spanish 'embarazada' means pregnant, NOT embarrassed; French 'actuellement' means currently, NOT actually).`,
        examinerTrapNotes: `Examiners intentionally design reading comprehension distractors using false cognates to trap students who translate literally!`,
        distractorExplanations: [
          `Option A is correct: false cognates deceive learners through superficial lexical similarity.`,
          `Option B is a literal humorous distractor.`,
          `Option C describes stem-changing or suppletive verbs.`,
          `Option D describes irregular gender morphology.`
        ],
        difficulty: difficultyTag,
      },
      {
        id: `plan-lang-${Date.now()}-5`,
        topic: t1,
        question: `Which linguistic feature characterizes 'active recall' when mastering foreign vocabulary over passive recognition?`,
        options: [
          `Producing the target term from prompt cues without multiple-choice options or translations visible.`,
          `Highlighting vocabulary words in a printed bilingual dictionary with fluorescent markers.`,
          `Reading through a vocabulary list multiple times while listening to classical background music.`,
          `Copying word definitions from the textbook into a notebook without looking away.`
        ],
        correctIndex: 0,
        angryExplanation: `Cognitive science demonstrates that active generation (producing the word from memory against an English definition or conceptual prompt) strengthens synaptic retrieval pathways, whereas passive recognition produces an illusion of competence.`,
        examinerTrapNotes: `Passive familiarity trap: Reading a word and feeling 'I know that' tests recognition, not spontaneous exam retrieval!`,
        distractorExplanations: [
          `Option A is correct: unassisted retrieval practice produces durable retention.`,
          `Option B is passive highlighting, one of the least effective revision techniques.`,
          `Option C is passive re-reading, which creates an illusion of fluency.`,
          `Option D is passive transcription without testing retrieval.`
        ],
        difficulty: difficultyTag,
      }
    ];
    return langQuestions.slice(0, count);
  }

  // 8. BIOLOGY, MEDICAL & BIOCHEMISTRY
  if (disc.isBiology || disc.isMedical) {
    const t0 = topics[0] || 'Cellular Respiration & ATP Synthase';
    const t1 = topics[1] || 'Homeostasis & Endocrine Regulation';
    const t2 = topics[2] || 'DNA Replication & Gene Expression';

    const bioQuestions: QuizQuestion[] = [
      {
        id: `plan-bio-${Date.now()}-1`,
        topic: t0,
        question: `During aerobic cellular respiration, what is the immediate driving force powering ATP synthesis by ATP synthase in mitochondria?`,
        options: [
          `The electrochemical proton gradient (proton-motive force) across the inner mitochondrial membrane.`,
          `Direct phosphorylation by cytoplasmic glycolysis enzymes without membrane participation.`,
          `The active uptake of glucose molecules across the outer mitochondrial membrane.`,
          `The reduction of molecular oxygen to carbon dioxide in the matrix.`
        ],
        correctIndex: 0,
        angryExplanation: `The electron transport chain pumps H+ ions from the matrix into the intermembrane space, creating a proton-motive force. As protons flow down their gradient through ATP synthase, rotational catalytic conformational changes synthesize ATP from ADP and Pi.`,
        examinerTrapNotes: `Oxygen is reduced to WATER (H2O), not carbon dioxide! Substrate-level phosphorylation accounts for only a minor fraction of ATP.`,
        distractorExplanations: [
          `Option A is correct: chemiosmotic proton-motive force powers ATP synthase.`,
          `Option B describes substrate-level phosphorylation, which generates only 2 net ATP.`,
          `Option C describes glucose transport, which is far upstream and does not drive ATP synthase directly.`,
          `Option D is biochemically false: oxygen is reduced to H2O, never to CO2.`
        ],
        difficulty: difficultyTag,
      },
      {
        id: `plan-bio-${Date.now()}-2`,
        topic: t1,
        question: `In response to sudden hyperosmolarity (dehydration) detected by hypothalamic osmoreceptors, what hormonal cascade is triggered?`,
        options: [
          `Release of Antidiuretic Hormone (ADH / Vasopressin) from the posterior pituitary to increase aquaporin-2 channels in renal collecting ducts.`,
          `Secretion of Aldosterone from the adrenal medulla to stimulate immediate water excretion.`,
          `Suppression of Parathyroid Hormone to reduce calcium reabsorption in the loop of Henle.`,
          `Release of Atrial Natriuretic Peptide (ANP) to increase sodium and water excretion.`
        ],
        correctIndex: 0,
        angryExplanation: `Hyperosmolarity stimulates hypothalamic osmoreceptors, triggering ADH release from the posterior pituitary. ADH binds V2 receptors, inserting aquaporin-2 channels into renal collecting ducts to reabsorb water and concentrate urine.`,
        examinerTrapNotes: `Aldosterone is secreted by the adrenal CORTEX (not medulla) and primarily acts on Na+/K+ balance. ANP is released during hypervolemia to dump water, opposite of dehydration.`,
        distractorExplanations: [
          `Option A is correct: ADH inserts aquaporin-2 channels in collecting ducts to conserve water.`,
          `Option B misidentifies the adrenal cortex as medulla and states aldosterone increases water excretion (it conserves Na+).`,
          `Option C involves calcium homeostasis, unrelated to serum osmolarity response.`,
          `Option D acts in opposite conditions: ANP is secreted during volume overload, not dehydration.`
        ],
        difficulty: difficultyTag,
      },
      {
        id: `plan-bio-${Date.now()}-3`,
        topic: t2,
        question: `Why is the lagging strand during DNA replication synthesized discontinuously as Okazaki fragments?`,
        options: [
          `DNA polymerase can only add new nucleotides to the 3' end of a growing strand (5' to 3' synthesis direction).`,
          `RNA primase cannot bind to the lagging strand template.`,
          `Topoisomerase permanently cleaves the lagging strand to relieve torsional strain.`,
          `Helicase unwinds the double helix only in the 3' to 5' direction.`
        ],
        correctIndex: 0,
        angryExplanation: `DNA polymerases require a free 3'-OH group and exclusively synthesize DNA in the 5' to 3' direction. Because the replication fork unzips in one direction, the antiparallel lagging strand must be synthesized in short discontinuous segments moving away from the fork.`,
        examinerTrapNotes: `Directional Trap: DNA polymerase synthesizes 5' to 3' while reading the template 3' to 5'.`,
        distractorExplanations: [
          `Option A is correct: DNA polymerase exclusively synthesizes in the 5' to 3' direction.`,
          `Option B is false: RNA primase binds repeatedly on the lagging strand to lay down primers for each Okazaki fragment.`,
          `Option C is false: topoisomerase creates transient cuts to relieve supercoiling, not permanent strand destruction.`,
          `Option D misstates helicase function: it unwinds the replication fork continuously.`
        ],
        difficulty: difficultyTag,
      },
      {
        id: `plan-bio-${Date.now()}-4`,
        topic: t0,
        question: `Competitive enzyme inhibitors alter kinetic parameters in what characteristic manner on a Lineweaver-Burk plot?`,
        options: [
          `They increase apparent Km (reduce affinity) while leaving Vmax unchanged.`,
          `They decrease Vmax while keeping Km strictly identical.`,
          `They decrease both Km and Vmax proportionally (parallel lines).`,
          `They permanently denature the enzyme's catalytic active site.`
        ],
        correctIndex: 0,
        angryExplanation: `Competitive inhibitors compete with substrate for the active site. High substrate concentrations outcompete the inhibitor, reaching normal Vmax. However, more substrate is needed to reach 1/2 Vmax, increasing apparent Km. On Lineweaver-Burk, the y-intercept (1/Vmax) is unchanged and the x-intercept (-1/Km) shifts closer to zero.`,
        examinerTrapNotes: `Noncompetitive inhibitors decrease Vmax with unchanged Km. Uncompetitive inhibitors decrease both Km and Vmax.`,
        distractorExplanations: [
          `Option A is correct: competitive inhibitors increase Km while Vmax remains unchanged.`,
          `Option B describes pure noncompetitive inhibition.`,
          `Option C describes uncompetitive inhibition.`,
          `Option D describes irreversible suicide inhibitors or harsh denaturants.`
        ],
        difficulty: difficultyTag,
      },
      {
        id: `plan-bio-${Date.now()}-5`,
        topic: t1,
        question: `During the cardiac cycle, when do the atrioventricular (AV) valves snap shut, producing the first heart sound (S1)?`,
        options: [
          `At the onset of ventricular isovolumetric contraction, as ventricular pressure exceeds atrial pressure.`,
          `At the beginning of ventricular diastole when aortic pressure exceeds ventricular pressure.`,
          `During atrial systole when the atria contract to fill the ventricles.`,
          `During isovolumetric relaxation when the semilunar valves close.`
        ],
        correctIndex: 0,
        angryExplanation: `When the ventricles depolarize and begin contracting (isovolumetric contraction), intraventricular pressure rapidly spikes above atrial pressure. This pressure inversion snaps the mitral and tricuspid (AV) valves shut, creating the S1 sound ('lub').`,
        examinerTrapNotes: `S2 ('dub') is the closure of the aortic and pulmonic semilunar valves at the onset of diastole. S1 is the closure of the AV valves!`,
        distractorExplanations: [
          `Option A is correct: S1 is caused by AV valve closure during early isovolumetric contraction.`,
          `Option B describes S2 (semilunar valve closure at the onset of diastole).`,
          `Option C occurs while AV valves are wide open during late diastolic filling.`,
          `Option D describes S2 occurring as ventricles relax.`
        ],
        difficulty: difficultyTag,
      }
    ];
    return bioQuestions.slice(0, count);
  }

  // 9. UNIVERSAL HIGH-YIELD GENERATOR FOR ANY CUSTOM STUDY PLAN TOPIC
  // Generates questions directly incorporating the student's exact study plan subject and selected topics!
  const topicList = topics.length > 0 ? topics : [subject, `${subject} High-Yield Concepts`];
  const customQuestions: QuizQuestion[] = [];

  const trapTemplates = [
    {
      q: (t: string) => `In ${subject}, regarding the core mechanisms of "${t}", which principle correctly isolates the governing relationship from common exam traps?`,
      correct: (t: string) => `The fundamental causal rule defining how "${t}" functions under rate-limiting and boundary conditions.`,
      d1: (t: string) => `A secondary superficial correlation that ignores underlying mechanism and reverses causal direction.`,
      d2: (t: string) => `A common distractor that is factually true in isolation but fails to address the specific prompt constraints.`,
      d3: (t: string) => `An arbitrary descriptive label that confuses initial input triggers with final equilibrium outputs.`,
      expl: (t: string) => `Option A correctly identifies the governing first-principles relationship for "${t}". In ${subject}, top scores require analyzing how control points and boundary constraints behave under test pressure.`,
      notes: (t: string) => `Distractor Trap: Examiners design multiple-choice distractors that look visually appealing because they quote real technical terms from "${t}", but state secondary effects rather than root mechanisms.`,
    },
    {
      q: (t: string) => `When solving multi-step problems involving "${t}" in ${subject}, what is the critical step that prevents catastrophic sign or conceptual inversion?`,
      correct: (t: string) => `Explicitly establishing baseline reference points and verifying unit/dimensional consistency before applying formulas.`,
      d1: (t: string) => `Immediately combining all given numbers into standard formulas without checking directional signs or boundary constraints.`,
      d2: (t: string) => `Assuming that extreme boundary values yield zero effect regardless of non-linear rate dynamics.`,
      d3: (t: string) => `Treating dependent intermediate variables as independent constant parameters throughout calculation.`,
      expl: (t: string) => `Option A provides the rigorous analytical defense: setting clear reference axes and dimensional checks eliminates over 80% of calculation mistakes in "${t}".`,
      notes: (t: string) => `Calculation Trap: Rushing to plug numbers into equations before diagramming constraints is the number-one reason students lose easy points on "${t}".`,
    },
    {
      q: (t: string) => `An examiner presents an atypical edge-case scenario where conditions for "${t}" deviate from standard textbook assumptions. How should this problem be resolved?`,
      correct: (t: string) => `Derive the outcome directly from conservation laws and first principles rather than applying memorized shortcuts.`,
      d1: (t: string) => `Force-fit the standard baseline formula by ignoring the anomalous constraint mentioned in the prompt.`,
      d2: (t: string) => `Conclude that the question contains an error and pick the answer closest to the standard average value.`,
      d3: (t: string) => `Reverse the known directionality of the reaction or system without mathematical or physical justification.`,
      expl: (t: string) => `Option A is the master approach: when an exam question modifies standard assumptions, memorized formulas fail. You must reason backward from core governing principles.`,
      notes: (t: string) => `High-Level Trap: When you see unfamiliar test phrasing in "${t}", examiners are testing whether you truly comprehend the mechanism or merely memorized a recipe.`,
    },
    {
      q: (t: string) => `In comparative evaluation of experimental data concerning "${t}", what is the most reliable hallmark of a valid scientific conclusion?`,
      correct: (t: string) => `The conclusion isolates the independent variable while accounting for confounding factors and control group baselines.`,
      d1: (t: string) => `The conclusion extrapolates far beyond the tested range based solely on high-order polynomial regression.`,
      d2: (t: string) => `The conclusion discards all outliers without documenting experimental errors or calibration artifacts.`,
      d3: (t: string) => `The conclusion confuses temporal precedence with direct mechanistic causation.`,
      expl: (t: string) => `Option A correctly adheres to empirical standards: valid conclusions require rigorous isolation of variables against negative and positive controls.`,
      notes: (t: string) => `Data Interpretation Trap: Look out for answer choices that claim definitive causation when the data merely demonstrates a non-controlled correlation.`,
    },
    {
      q: (t: string) => `During timed exam pressure on ${subject}, which diagnostic strategy best detects distractor traps embedded in "${t}"?`,
      correct: (t: string) => `Pre-formulate your answer based on prompt constraints BEFORE reading the distractors, then match your reasoned logic.`,
      d1: (t: string) => `Scan the four answer choices first and select whichever option contains the most complex vocabulary.`,
      d2: (t: string) => `Select whichever option restates the question prompt using synonymous adjectives without providing an answer.`,
      d3: (t: string) => `Assume that options containing absolute qualifiers such as 'always' or 'never' are usually correct.`,
      expl: (t: string) => `Option A: Pre-formulating your answer prevents your working memory from being anchored or deceived by tempting distractor options designed by the examiner.`,
      notes: (t: string) => `Cognitive Trap: Reading answer choices first triggers recognition bias. Always solve the core prompt first before glancing at the options.`,
    }
  ];

  for (let idx = 0; idx < count; idx++) {
    const topicName = topicList[idx % topicList.length];
    const template = trapTemplates[idx % trapTemplates.length];

    customQuestions.push({
      id: `plan-custom-${Date.now()}-${idx}`,
      topic: topicName,
      question: template.q(topicName),
      options: [
        template.correct(topicName),
        template.d1(topicName),
        template.d2(topicName),
        template.d3(topicName),
      ],
      correctIndex: 0,
      angryExplanation: template.expl(topicName),
      examinerTrapNotes: template.notes(topicName),
      distractorExplanations: [
        `Option A is correct: ${template.correct(topicName)}`,
        `Option B is incorrect: ${template.d1(topicName)}`,
        `Option C is incorrect: ${template.d2(topicName)}`,
        `Option D is incorrect: ${template.d3(topicName)}`,
      ],
      difficulty: difficultyTag,
    });
  }

  return customQuestions;
}
