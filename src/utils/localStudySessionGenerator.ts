import { StudySessionData, QuizQuestion } from '../types';

export function generateLocalStudySession(config: {
  subject: string;
  topics?: string[];
  gradeLevel?: string;
  durationMinutes?: number;
  subjectCategory?: string;
  deepWorkMode?: boolean;
}): StudySessionData {
  const subject = config.subject || 'High-Yield STEM & Academic Rigor';
  const primaryTopic = Array.isArray(config.topics) && config.topics.length > 0
    ? config.topics[0]
    : subject;

  const pretestQuestion: QuizQuestion = {
    id: `pretest-local-${Date.now()}`,
    topic: primaryTopic,
    question: `In ${primaryTopic}, which of the following represents the primary mechanism governing equilibrium or rate-limiting behavior under diagnostic conditions?`,
    options: [
      `The direct causal feedback mechanism that regulates rate-limiting flow and stabilizes the system.`,
      `A secondary downstream symptom that merely correlates with output volume without altering the rate.`,
      `An arbitrary initial parameter that remains static and does not participate in active regulation.`,
      `A superficial distractor that reverses the directional cause-and-effect arrow.`
    ],
    correctIndex: 0,
    angryExplanation: `Option A identifies the governing rate-limiting control point. In ${primaryTopic}, mastery requires identifying root causes rather than confusing downstream symptoms or distractor traps.`,
    examinerTrapNotes: 'Examiners routinely tempt students with secondary consequences rather than primary regulatory drivers.',
    distractorExplanations: [
      'Option A is correct: it identifies the primary governing mechanism.',
      'Option B describes a secondary downstream symptom, not the root driver.',
      'Option C is incorrect because regulatory parameters actively respond to system shifts.',
      'Option D reverses the causal direction, a classic exam trap.'
    ]
  };

  const practiceQuestions: QuizQuestion[] = [
    {
      id: `practice-local-1-${Date.now()}`,
      topic: primaryTopic,
      question: `When analyzing a non-standard problem in ${primaryTopic}, what is the first step required to avoid distractor bait?`,
      options: [
        `Isolate governing equations and fundamental boundary conditions before inspecting answer options.`,
        `Skim answer choices immediately and pick the one with familiar technical vocabulary.`,
        `Assume linear relationships without verifying proportionality constants or physical constraints.`,
        `Skip reading the premise conditions to save time on multiple-step derivations.`
      ],
      correctIndex: 0,
      angryExplanation: `Top scholars always derive or deduce their answer independently from first principles before comparing with multiple-choice distractors.`,
      examinerTrapNotes: 'Never let seductive multiple-choice options dictate your derivation. Solve cold first.',
      distractorExplanations: [
        'Option A is correct: first-principles derivation eliminates distractor traps.',
        'Option B falls into the Recognition Trap—familiar jargon does not imply correctness.',
        'Option C ignores nonlinear and limiting behavior.',
        'Option D guarantees missed negative signs and false boundary assumptions.'
      ]
    },
    {
      id: `practice-local-2-${Date.now()}`,
      topic: primaryTopic,
      question: `How does deliberate active retrieval in ${primaryTopic} alter neural retention compared to passive re-reading?`,
      options: [
        `It forces synaptic reconstruction from memory, exposing exact cognitive gaps and preventing illusion of competence.`,
        `It feels easier and requires less glucose consumption than skimming highlighted notes.`,
        `It relies on short-term recognition memory that rapidly decays within 24 hours.`,
        `It bypasses hippocampal consolidation and stores data strictly in sensory working memory.`
      ],
      correctIndex: 0,
      angryExplanation: `Active retrieval under desirable difficulty strengthens dendritic spine remodeling and consolidates long-term memory.`,
      examinerTrapNotes: 'Passive familiarity feels smooth, but active retrieval is what physically cements exam-day recall.',
      distractorExplanations: [
        'Option A is correct: retrieval strain drives neural plasticity.',
        'Option B is false: active recall is cognitively demanding.',
        'Option C describes passive reading, not active retrieval.',
        'Option D misstates neural memory consolidation pathways.'
      ]
    }
  ];

  return {
    topic: primaryTopic,
    briefExplanation: `High-yield synthesis of ${primaryTopic}. Focus on distinguishing primary mechanisms from secondary artifacts. On exam day, examiners use multi-step distractors that mimic superficial correctness.`,
    pretestQuestion,
    flashcards: [
      {
        front: `What is the single most critical governing rule of ${primaryTopic}?`,
        back: `The fundamental relation linking input parameters to rate-limiting output state under verified boundary conditions.`,
        trap: `Never assume standard conditions without verifying prompt constraints.`
      },
      {
        front: `How do you diagnose the most common distractor trap in ${primaryTopic}?`,
        back: `Look for options that state true facts in isolation but fail to address the specific prompt question or reverse causal direction.`,
        trap: `Attractive distractors are frequently true statements that answer the wrong question.`
      },
      {
        front: `What is the 3-step error autopsy protocol for ${primaryTopic}?`,
        back: `1. Re-read prompt -> 2. Pinpoint exact false inference -> 3. Note the distractor trigger in your Mistakes Vault.`,
        trap: `Dismissing mistakes as 'careless' ensures you will repeat them under exam pressure.`
      }
    ],
    blurtingPrompt: `Close all reference notes right now. On a blank surface, write down the 3 governing principles, formulas, or mechanism steps of ${primaryTopic} purely from memory.`,
    blurtingKeyPoints: [
      `Primary governing definition and physical/logical constraints`,
      `Rate-limiting or critical boundary conditions`,
      `Two common exam distractor traps and how to refute them`
    ],
    practiceQuestions,
    teachBackPrompt: `Explain ${primaryTopic} out loud into the room as if teaching an intelligent student who has never studied it before. Use zero jargon crutches.`,
    quickCheckPrompt: `In one crisp sentence, what is the core mechanism of ${primaryTopic}?`,
    sampleCheckAnswer: `The governing principle balancing input variables against rate-limiting feedback to yield predictable output states.`,
    motivationalAdvice: `Mental burn is dendritic spine remodeling. Suffer the confusion now during practice so you can execute with cold precision in the exam hall.`,
    antiMotivationTips: {
      fiveMinuteHack: `Commit to working on ${primaryTopic} for exactly 5 minutes with a countdown timer. You may stop when it rings—but 92% of the time, action momentum carries you forward.`,
      temptationIdea: `Bundle this study drill with your favorite focus beverage or binaural soundscape.`,
      deadManSwitchExample: `Tell a study partner: 'If I have not sent you my completed 5-question drill by 8 PM, I owe you $10.'`,
      thirdPersonPrompt: `Imagine you are coaching a top-tier scholar. What advice would you give them right now about tackling ${primaryTopic}?`
    }
  };
}
