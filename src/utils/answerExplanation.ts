import { QuizQuestion } from '../types';

export interface AnswerExplanation {
  isCorrect: boolean;
  pickedIndex: number;
  pickedLetter: string;
  pickedText: string;
  correctIndex: number;
  correctLetter: string;
  correctText: string;
  whyCorrect: string;
  whyPickedWrong: string;
  trapWarning: string;
  fallacyTag: string;
}

/**
 * Detects the specific logical, scientific, or rhetorical fallacy behind an incorrect option
 * and generates a high-yield explanation of why the user's picked choice is flawed.
 */
export function getDetailedAnswerExplanation(
  question: QuizQuestion,
  pickedIndex: number,
  subject?: string
): AnswerExplanation {
  const isCorrect = pickedIndex === question.correctIndex;
  const pickedLetter = String.fromCharCode(65 + pickedIndex);
  const correctLetter = String.fromCharCode(65 + question.correctIndex);
  const pickedText = question.options[pickedIndex] || '';
  const correctText = question.options[question.correctIndex] || '';

  // 1. Why Correct is Right
  let whyCorrect = question.angryExplanation.trim();
  // Ensure it doesn't sound like a generic stub
  if (!whyCorrect.toLowerCase().includes(correctLetter.toLowerCase()) && !whyCorrect.toLowerCase().includes('correct')) {
    whyCorrect = `Option ${correctLetter} is correct: ${whyCorrect}`;
  }

  // 2. Trap warning
  const trapWarning = question.examinerTrapNotes || 'Always verify the rate-limiting step and watch out for tempting intuitive buzzwords.';

  // If correct, return early with confirmation
  if (isCorrect) {
    return {
      isCorrect: true,
      pickedIndex,
      pickedLetter,
      pickedText,
      correctIndex: question.correctIndex,
      correctLetter,
      correctText,
      whyCorrect,
      whyPickedWrong: '',
      trapWarning,
      fallacyTag: 'Verified Mastery',
    };
  }

  // 3. Why Picked is Wrong
  // Check if backend provided specific distractorExplanations
  if (
    question.distractorExplanations &&
    Array.isArray(question.distractorExplanations) &&
    question.distractorExplanations[pickedIndex] &&
    question.distractorExplanations[pickedIndex].trim().length > 10
  ) {
    return {
      isCorrect: false,
      pickedIndex,
      pickedLetter,
      pickedText,
      correctIndex: question.correctIndex,
      correctLetter,
      correctText,
      whyCorrect,
      whyPickedWrong: question.distractorExplanations[pickedIndex].trim(),
      trapWarning,
      fallacyTag: 'Examiner Distractor Trap',
    };
  }

  // Domain & semantic pattern analyzer for picked choice vs correct choice
  const pickedLower = pickedText.toLowerCase();
  const correctLower = correctText.toLowerCase();
  const topicLower = (question.topic || '').toLowerCase();
  const subjLower = (subject || '').toLowerCase();
  const qLower = question.question.toLowerCase();
  const trapLower = (question.examinerTrapNotes || '').toLowerCase();

  let fallacyTag = 'Examiner Distractor Trap';
  let whyPickedWrong = '';

  // A. English / Rhetoric / Literature Traps
  if (subjLower.includes('english') || topicLower.includes('rhetoric') || topicLower.includes('literature') || topicLower.includes('syntax') || topicLower.includes('tone')) {
    if (pickedLower.includes('emotional') || pickedLower.includes('shock') || pickedLower.includes('pathos') && qLower.includes('ethos')) {
      fallacyTag = 'Ethos vs Pathos Confusion';
      whyPickedWrong = `Option ${pickedLetter} confuses pathos (emotional appeal) with ethos (speaker credibility). While emotions may be stirred, the author relies on moral authority, shared values, and credibility here.`;
    } else if (pickedLower.includes('plot') || pickedLower.includes('summary') || pickedLower.includes('chronological')) {
      fallacyTag = 'Superficial Plot Trap';
      whyPickedWrong = `Option ${pickedLetter} provides a literal plot summary rather than answering the prompt's analytical demand. Standardized exams ruthlessly penalize descriptive answers that fail to evaluate authorial craft, syntax, or tone.`;
    } else if (pickedLower.includes('sarcasm') || pickedLower.includes('humor') || (pickedLower.includes('irony') && correctLower.includes('dramatic'))) {
      fallacyTag = 'Irony Type Conflation';
      whyPickedWrong = `Option ${pickedLetter} confuses verbal irony (saying the opposite of what is meant) or situational irony with dramatic irony. Dramatic irony requires that the reader or audience possesses privileged knowledge withheld from the characters.`;
    } else {
      fallacyTag = 'Misattributed Rhetorical Effect';
      whyPickedWrong = `Option ${pickedLetter} incorrectly diagnoses the author's primary rhetorical technique. While the choice sounds literary, it fails to explain the causal link between the structural craft and the resulting thematic resonance proved by Option ${correctLetter}.`;
    }
  }

  // B. Math / Calculus / Algebra Traps
  else if (subjLower.includes('calculus') || subjLower.includes('math') || subjLower.includes('algebra') || topicLower.includes('derivative') || topicLower.includes('integral')) {
    if (pickedLower.includes('forgetting') || pickedLower.includes('inner derivative') || pickedLower.includes('chain rule')) {
      fallacyTag = 'Chain Rule Inner Derivative Omission';
      whyPickedWrong = `Option ${pickedLetter} is the classic student trap of differentiating the outer shell while forgetting to multiply by the derivative of the inner argument (d/dx[f(g(x))] = f'(g(x)) · g'(x)).`;
    } else if (pickedLower.includes('negative') || pickedLower.includes('sign') || pickedLower.includes('discriminant')) {
      fallacyTag = 'Sign Inversion / Discriminant Error';
      whyPickedWrong = `Option ${pickedLetter} results from an algebraic sign slip or miscalculating the discriminant (b² - 4ac). Notice that test-makers compute the exact wrong answer you would get if you flipped a plus or minus sign.`;
    } else {
      fallacyTag = 'Mathematical Step Fallacy';
      whyPickedWrong = `Option ${pickedLetter} fails the deductive constraints of the governing theorem. Test-makers intentionally include this choice because it matches what you get when an intermediate algebraic step or boundary condition is skipped.`;
    }
  }

  // C. Inverted Causality / Order of Operations (Biological / Physical / Chemical)
  else if (
    (pickedLower.includes('repolariz') && qLower.includes('depolariz')) ||
    (pickedLower.includes('atpase') && (qLower.includes('upstroke') || qLower.includes('single') || qLower.includes('refractory'))) ||
    (pickedLower.includes('hyperpolariz') && qLower.includes('absolute refractory')) ||
    (pickedLower.includes('efflux') && correctLower.includes('influx')) ||
    (pickedLower.includes('influx') && correctLower.includes('efflux'))
  ) {
    if (pickedLower.includes('atpase')) {
      fallacyTag = 'Acute Spike vs Long-Term Maintenance';
      whyPickedWrong = `Option ${pickedLetter} is the most famous trap in electrophysiology! Students mistakenly attribute single action potential phases to the Na+/K+ ATPase pump. In reality, the pump is a slow, steady janitor maintaining baseline concentration gradients over thousands of spikes—it does NOT trigger or repolarize acute individual spikes.`;
    } else if (pickedLower.includes('hyperpolariz') && qLower.includes('absolute refractory')) {
      fallacyTag = 'Absolute vs Relative Refractory Confusion';
      whyPickedWrong = `Option ${pickedLetter} describes the RELATIVE refractory period (during hyperpolarization, when an suprathreshold stimulus can still trigger a spike). In the ABSOLUTE refractory period, voltage-gated Na+ inactivation gates are physically plugged—no stimulus of any magnitude can fire a spike.`;
    } else {
      fallacyTag = 'Inverted Directional Mechanism';
      whyPickedWrong = `Option ${pickedLetter} completely inverts the thermodynamic or directional flux. Under these physiological conditions, ions move down their established electrochemical gradient in the opposite direction from what this option claims.`;
    }
  }

  // D. Enzyme Kinetics & Competitive vs Non-Competitive Traps
  else if (topicLower.includes('enzyme') || topicLower.includes('kinetic') || qLower.includes('vmax') || qLower.includes('km')) {
    if (pickedLower.includes('vmax') && correctLower.includes('km')) {
      fallacyTag = 'Vmax vs Km Conflation';
      whyPickedWrong = `Option ${pickedLetter} confuses maximum catalytic velocity (Vmax) with substrate affinity (Km). For competitive inhibition, flooding with excess substrate overcomes the inhibitor, leaving Vmax unchanged while increasing apparent Km.`;
    } else if (pickedLower.includes('affinity') || pickedLower.includes('decrease') || pickedLower.includes('increase')) {
      fallacyTag = 'Kinetic Affinity Inversion';
      whyPickedWrong = `Option ${pickedLetter} inverts the relationship: a higher numerical Km value indicates LOWER binding affinity, because more substrate is required to achieve half-maximal velocity.`;
    } else {
      fallacyTag = 'Enzyme Inhibition Misconception';
      whyPickedWrong = `Option ${pickedLetter} misidentifies the molecular mechanism. Catalytic inhibitors either compete at the active orthosteric site or bind allosteric regulatory sites; this choice incorrectly mixes their kinetic signatures.`;
    }
  }

  // E. Extreme / Unregulated / Passive Traps
  else if (
    pickedLower.includes('unregulated') ||
    pickedLower.includes('completely passive') ||
    pickedLower.includes('instantaneous') ||
    pickedLower.includes('spontaneously destroys') ||
    pickedLower.includes('zero energy') ||
    pickedLower.includes('random leak')
  ) {
    fallacyTag = 'Unregulated Extreme Distractor';
    whyPickedWrong = `Option ${pickedLetter} relies on an unrealistic extreme ("${pickedText.slice(0, 40)}..."). In rigorous science and medicine, physiological systems are virtually never passive, instantaneous, or unmonitored. There is always a regulated checkpoint, enzyme gate, or negative feedback control.`;
  }

  // F. Examiner Trap Notes direct match
  else if (question.examinerTrapNotes && question.examinerTrapNotes.length > 15) {
    fallacyTag = 'Examiner Trap Sprung';
    whyPickedWrong = `Option ${pickedLetter} is an examiner distractor. ${question.examinerTrapNotes} Notice how this choice was deliberately phrased to sound plausible while overlooking the mandatory rate-limiting mechanism in Option ${correctLetter}.`;
  }

  // G. General Intelligent Synthesis
  else {
    fallacyTag = 'Conceptual Distractor Trap';
    whyPickedWrong = `Option ${pickedLetter} ("${pickedText}") is incorrect because it fails to satisfy the primary physical and regulatory requirements of the prompt. Examiners craft this option with familiar-sounding buzzwords to catch candidates who skim rather than verifying the direct causal chain proved by Option ${correctLetter}.`;
  }

  return {
    isCorrect: false,
    pickedIndex,
    pickedLetter,
    pickedText,
    correctIndex: question.correctIndex,
    correctLetter,
    correctText,
    whyCorrect,
    whyPickedWrong,
    trapWarning,
    fallacyTag,
  };
}
