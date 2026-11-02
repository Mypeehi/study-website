import { QuizQuestion } from '../types';

export interface ChatMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
  questionPayload?: {
    question: QuizQuestion;
    questionIndex: number;
    totalQuestions: number;
  };
  evaluationPayload?: {
    isCorrect: boolean;
    selectedOption: string;
    correctOption: string;
    angryExplanation: string;
    examinerTrapNotes?: string;
    detailedExplanation?: any;
  };
  sideComment?: string;
  mood?: 'smug' | 'proud' | 'provocative' | 'shocked' | 'analytical' | 'supportive';
}

// Side talk quips based on question index / pacing
const PACING_SIDE_TALK = [
  "Alright, let's wake up those groggy dendrites. No warm-up nonsense, we're jumping straight into the deep end.",
  "Quick side note before you answer: 65% of test-takers pick the wrong option here simply because they rush the second half of the question.",
  "Question 2! Take a sip of water or whatever caffeinated potion is currently fueling your academic survival.",
  "Halfway checkpoint. If your brain feels warm, good—that's actual synaptic plasticity happening, not a fever.",
  "Little piece of advice: examiners love this specific mechanism because it looks intimidating on paper, but it's actually simple once you see the causal chain.",
  "Penultimate question! Don't let your guard down. This is usually where fatigue makes people choose the familiar-sounding buzzword.",
  "Boss round question! If you get this right, you officially earn my grudging respect (and bonus XP)."
];

// Topic-specific witty side comments
export function getQuestionIntroSideTalk(question: QuizQuestion, index: number, total: number): {
  greeting: string;
  sideTalk: string;
  mood: 'smug' | 'provocative' | 'analytical' | 'supportive';
} {
  const topic = (question.topic || '').toLowerCase();
  let sideTalk = PACING_SIDE_TALK[index % PACING_SIDE_TALK.length];
  let mood: 'smug' | 'provocative' | 'analytical' | 'supportive' = 'analytical';

  if (topic.includes('action potential') || topic.includes('neuron') || topic.includes('nervous')) {
    sideTalk = "Voltage-gated sodium channels are the biggest prima donnas in human biology. They open for a fraction of a millisecond and then immediately shut down with their inactivation gate. Keep that timing in mind:";
    mood = 'provocative';
  } else if (topic.includes('bohr') || topic.includes('respiration') || topic.includes('oxygen') || topic.includes('haldane')) {
    sideTalk = "Hemoglobin is basically a picky courier service. It dumps oxygen the second it smells acid or heat. Don't let the shift curves confuse you:";
    mood = 'analytical';
  } else if (topic.includes('atp') || topic.includes('mitochon') || topic.includes('etc') || topic.includes('glycolysis')) {
    sideTalk = "If someone tells you 'mitochondria is the powerhouse of the cell' one more time, refer them to Complex IV. Let's see if you understand the actual proton gradient:";
    mood = 'smug';
  } else if (topic.includes('enzyme') || topic.includes('inhibition') || topic.includes('vmax') || topic.includes('km')) {
    sideTalk = "Keep enzyme kinetics in mind: Competitive inhibitors just crowd the doorway, but non-competitive inhibitors sabotage the whole building from the side. Don't mix up Km and Vmax:";
    mood = 'analytical';
  } else if (topic.includes('renal') || topic.includes('kidney') || topic.includes('nephron')) {
    sideTalk = "The Loop of Henle is nature's most stubborn countercurrent multiplier. Water leaves descending, salt leaves ascending. Let's test your grasp on this:";
    mood = 'supportive';
  }

  const greeting = index === 0
    ? `Welcome to the hot seat! I'm your AI sparring coach. Forget sterile worksheets—we're doing this conversational style. I'll drop the questions, call you out when you pick traps, and make sure the science actually sticks.`
    : `Question ${index + 1} of ${total}:`;

  return { greeting, sideTalk, mood };
}

// Side reaction when user answers
export function getAnswerReaction(
  question: QuizQuestion,
  userIndex: number,
  isCorrect: boolean
): {
  headline: string;
  banter: string;
  mood: 'proud' | 'shocked' | 'smug' | 'supportive';
} {
  const userOptionText = question.options[userIndex] || '';
  const correctOptionText = question.options[question.correctIndex] || '';

  if (isCorrect) {
    const praiseBank = [
      {
        headline: "Boom! Synaptic mastery verified.",
        banter: "I was secretly betting you'd fall for the obvious distractor, but look at you actually applying first principles! You spotted the core mechanism clean as a surgical laser.",
        mood: 'proud' as const
      },
      {
        headline: "Spot on! Reluctant respect awarded.",
        banter: "Most students skim right past the crucial distinction here and guess blindly. You actually reasoned through the causal chain.",
        mood: 'proud' as const
      },
      {
        headline: "Clinical precision. No notes.",
        banter: "That's textbook level understanding. If this were a viva voce oral board exam, the professor would just nod slowly and move on.",
        mood: 'supportive' as const
      }
    ];
    return praiseBank[Math.floor(Math.random() * praiseBank.length)];
  } else {
    const trapBank = [
      {
        headline: "Oof! You walked right into the examiner's trap!",
        banter: `Don't beat yourself up too hard—that option was practically dipped in honey by the test-makers. It sounds so scientific that people pick it on pure instinct, but here is the fatal flaw in that logic:`,
        mood: 'shocked' as const
      },
      {
        headline: "Caught in 4K! The distractor claimed another victim.",
        banter: `You picked "${userOptionText.slice(0, 35)}...", which is the classic intuitive mistake. Notice how examiners weaponize your gut feeling against you? Here's the biological reality:`,
        mood: 'smug' as const
      },
      {
        headline: "Missed by a hair—here's the mechanism breakdown.",
        banter: `Good attempt, but you inverted the causal arrow. In biology and physics, order of operations is everything. Check out where the logic diverged:`,
        mood: 'supportive' as const
      }
    ];
    return trapBank[Math.floor(Math.random() * trapBank.length)];
  }
}

// Oral Board Interview Side-Talk & Banter
export function getExaminerInterviewIntro(
  topic: string,
  mode: 'viva' | 'flaw' | 'mechanism' | 'pressure',
  title: string
): {
  greeting: string;
  sideTalk: string;
} {
  const t = topic.toLowerCase();
  let sideTalk = "I've listened to hundreds of candidates bumble their way through this topic with hand-waving buzzwords. Don't be that candidate. Give me the real physical and molecular steps.";

  if (t.includes('action potential') || t.includes('neuron') || t.includes('nervous')) {
    sideTalk = "If you tell me sodium rushes in without specifying voltage sensitivity and inactivation gates, I will deduct points before you even finish your sentence.";
  } else if (t.includes('bohr') || t.includes('respiration') || t.includes('oxygen') || t.includes('haldane')) {
    sideTalk = "Don't just say 'affinity decreases'. Explain the actual allosteric shift and why hydrogen ions stabilize the T-state. Treat me like a peer, not a fifth grader.";
  } else if (t.includes('atp') || t.includes('mitochon') || t.includes('glycolysis')) {
    sideTalk = "Anyone can say 'chemiosmosis'. I want to hear about the proton motive force across the inner membrane and the gamma subunit rotation.";
  } else if (t.includes('enzyme') || t.includes('inhibition') || t.includes('km')) {
    sideTalk = "Remember: competitive inhibitors can be overcome with enough substrate, but non-competitive inhibitors lower Vmax forever. Keep that crystal clear in your defense.";
  } else if (t.includes('renal') || t.includes('kidney') || t.includes('loop')) {
    sideTalk = "Med students notoriously dread the medullary osmotic gradient. Show me you understand the permeability difference between the descending and ascending limbs.";
  }

  let greeting = `Candidate, take a seat. We are beginning your Oral Board defense on "${topic}".`;
  if (mode === 'flaw') {
    greeting = `Candidate, your task is to spot the fatal flaw in the student defense below. Don't be polite—tear their bad logic apart with scientific precision.`;
  } else if (mode === 'pressure') {
    greeting = `Candidate, you have 60 seconds in the Pressure Chamber. No stuttering, no filler phrases. Speak your answer with conviction.`;
  } else if (mode === 'mechanism') {
    greeting = `Candidate, mark the mechanism. Lay out the chronological chain of events without skipping intermediate steps.`;
  }

  return { greeting, sideTalk };
}

export function getExaminerFollowUpBanter(score: number, verdict: string): string {
  if (score >= 8) {
    return "Well, well. I was fully prepared to fail you on the spot, but that explanation was shockingly coherent. Reluctant respect awarded. But let's see if you can handle this follow-up cross-examination:";
  } else if (score >= 5) {
    return "You survived, but only by the skin of your teeth. You hit the superficial headlines and glossed over the deep causal mechanics. Answer this follow-up to salvage your score:";
  } else {
    return "That was agonizing to listen to. You danced around the question like a politician avoiding an audit. Review the model answer, and let's see if you can answer this follow-up without embarrassment:";
  }
}
