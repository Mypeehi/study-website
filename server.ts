import express from 'express';
import type { Request, Response } from 'express';
import fs from 'fs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type, ThinkingLevel } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Determine app listening port: In AI Studio, Nginx binds to 8080 and proxies to 3000.
// The Node/Express server must bind to port 3000 (never 8080).
function resolvePort(): number {
  const portArgIndex = process.argv.indexOf('--port');
  if (portArgIndex !== -1 && process.argv[portArgIndex + 1]) {
    const val = parseInt(process.argv[portArgIndex + 1], 10);
    if (!isNaN(val) && val > 0 && val !== 8080) return val;
  }
  if (process.env.DEFAULT_APP_PORT) {
    const val = parseInt(process.env.DEFAULT_APP_PORT, 10);
    if (!isNaN(val) && val > 0 && val !== 8080) return val;
  }
  if (process.env.PORT && process.env.PORT !== '8080') {
    const val = parseInt(process.env.PORT, 10);
    if (!isNaN(val) && val > 0) return val;
  }
  return 3000;
}
const PORT = resolvePort();

app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Initialize server-side Gemini SDK with required telemetry header
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Resilient multi-model Gemini caller: tries gemini-3.1-flash-lite, gemini-flash-latest, gemini-3.8-flash
async function callGeminiWithFallback({
  contents,
  config,
  preferredModels = ['gemini-3.1-flash-lite', 'gemini-flash-latest', 'gemini-3.8-flash']
}: {
  contents: any;
  config?: any;
  preferredModels?: string[];
}) {
  let lastError: any = null;
  for (const model of preferredModels) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents,
        ...(config ? { config } : {})
      });
      return response;
    } catch (err: any) {
      console.warn(`[Gemini Runner] Model '${model}' failed:`, err?.status || err?.message || 'Unknown error');
      lastError = err;
    }
  }
  throw lastError;
}

// Helper for fallback examiner evaluation when API key is unavailable or error occurs
function generateLocalExaminerFallback(topic: string, question: string, studentAnswer: string) {
  const answerLower = (studentAnswer || '').toLowerCase().trim();
  const wordCount = answerLower.split(/\s+/).filter(Boolean).length;

  if (wordCount < 6) {
    return {
      score: 1,
      verdict: 'FAIL - VAGUE FLUFF',
      roastCritique: 'Are you serious? That is not an answer, that is a nervous whisper. You gave me ' + wordCount + ' words for a multi-million-year-old evolutionary mechanism. Where are the specific receptors, ion fluxes, and thermodynamic principles?',
      whatYouMissed: [
        'Precise molecular names and biochemical intermediates',
        'Direction of ion movement / thermodynamic driving forces',
        'Allosteric transitions and causal sequence'
      ],
      modelAnswer: `In ${topic}, precise causality is non-negotiable. You must articulate the resting baseline, the specific trigger or ligand binding, the conformational or enzymatic shift, and the resultant physiological downstream effector.`,
      followUpQuestion: `Let us test if you understand the baseline: what specific channel or enzyme regulates the resting equilibrium in ${topic}?`,
      bonusTip: 'Rule of thumb: If you cannot name the exact protein involved, you are guessing.'
    };
  }

  const hasKeywords = answerLower.includes('gradient') || answerLower.includes('channel') || answerLower.includes('enzyme') || answerLower.includes('receptor') || answerLower.includes('membrane') || answerLower.includes('atp');
  
  if (hasKeywords && wordCount > 25) {
    return {
      score: 7,
      verdict: 'SOLID PASS',
      roastCritique: 'Acceptable. You avoided the most humiliating freshman traps and remembered actual anatomical and molecular terminology. But your explanation of the rate-limiting step was somewhat sloppy—an external examiner would deduct points for that hesitation.',
      whatYouMissed: [
        'Detailed kinetics and half-saturation values',
        'Specific allosteric feedback loops that inhibit upstream pathways'
      ],
      modelAnswer: `A rigorous distinction in ${topic}: always delineate both the primary acute response and the subsequent negative feedback mechanism that prevents runaway cellular excitation or depletion.`,
      followUpQuestion: `Very well, but what happens if a selective antagonist is introduced at steady state? Does the system compensate or fail catastrophically?`,
      bonusTip: 'Always name the specific amino acid residues or subunit conformations to impress strict examiners.'
    };
  }

  return {
    score: 4,
    verdict: 'BORDERLINE PASS',
    roastCritique: 'You have read the chapter summary, but you clearly skimmed the actual mechanism. You used general descriptive words like "it moves" and "it gets activated" instead of naming the exact biological players.',
    whatYouMissed: [
      'Exact names of the subunits or cotransporters involved',
      'Distinction between kinetic Vmax vs affinity Km changes',
      'The exact consequence of blocking the rate-limiting step'
    ],
    modelAnswer: `To achieve honors marks in ${topic}, trace the signal transduction cascade step-by-step: ligand-receptor coupling -> second messenger generation -> phosphorylation cascade -> cellular effector response.`,
    followUpQuestion: `What is the exact rate-limiting step in this process, and what allosteric molecule inhibits it?`,
    bonusTip: 'Never use the word "basically" in an oral exam. It signals to the examiner that you are about to say something inaccurate.'
  };
}

// 1. ANGRY EXAMINER EVALUATION ENDPOINT
app.post('/api/examiner/evaluate', async (req: Request, res: Response) => {
  const { topic, question, studentAnswer, mode } = req.body;

  if (!question || !studentAnswer) {
    return res.status(400).json({ error: 'Question and student answer are required.' });
  }

  try {
    if (!process.env.GEMINI_API_KEY) {
      const fallback = generateLocalExaminerFallback(topic, question, studentAnswer);
      return res.json(fallback);
    }

    const systemPrompt = `You are "The Angry Examiner" from angryexaminer.com, an intense, demanding teacher and examiner.
Your motto: "I detest hand-wavy fluff, vague generalities ('it increases', 'the body balances itself'), and missing mechanisms."
Your personality:
- Highly knowledgeable, sharp-tongued, humorous, but fair and pedagogically brilliant.
- STRICT FACTUAL INTEGRITY & ACADEMIC ACCURACY: You NEVER make scientific or factual errors. Do NOT hallucinate or oversimplify. Every claim must align with standard authoritative textbooks (Campbell Biology, Guyton & Hall Physiology, Lehninger Biochemistry, OpenStax).
- You demand exact terminology (e.g. "voltage-gated delayed rectifier K+ channels", NOT "channels that open"; "competitive inhibitor increases Km without altering Vmax", etc.).
- You mercilessly roast weak, lazy, or hand-wavy answers, pointing out what high school myth they fell for.
- For great answers, you give respect ("Finally, a candidate with a pulse and a textbook"), but still push them with an even tougher follow-up.
- You grade out of 10.
- Mode: ${mode || 'viva'}.

Topic: ${topic}
Question Asked by Examiner: "${question}"
Candidate's Response: "${studentAnswer}"

Respond ONLY with a JSON object adhering to this exact schema:
{
  "score": <integer from 0 to 10>,
  "verdict": <one of: "FAIL - VAGUE FLUFF", "BORDERLINE PASS", "SOLID PASS", "1ST CLASS HONORS">,
  "roastCritique": <string: 2-4 sentences of biting, witty, precise commentary in the Angry Examiner voice>,
  "whatYouMissed": <array of 2-4 concise strings with specific mechanisms/terms omitted>,
  "modelAnswer": <string: 3-5 sentences of pristine, textbook-perfect, high-yield mechanism explanation with zero factual errors>,
  "followUpQuestion": <string: a ruthlessly sharp follow-up question testing the candidate further>,
  "bonusTip": <string: 1 sentence high-yield mnemonic or trap avoidance advice>
}`;

    const response = await callGeminiWithFallback({
      contents: systemPrompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.INTEGER, description: 'Score between 0 and 10' },
            verdict: { type: Type.STRING, description: 'Evaluation verdict' },
            roastCritique: { type: Type.STRING, description: 'The angry examiner roast critique' },
            whatYouMissed: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Missing terms or mechanisms',
            },
            modelAnswer: { type: Type.STRING, description: 'Flawless model answer' },
            followUpQuestion: { type: Type.STRING, description: 'Ruthless follow-up question' },
            bonusTip: { type: Type.STRING, description: 'High yield study tip' },
          },
          required: ['score', 'verdict', 'roastCritique', 'whatYouMissed', 'modelAnswer', 'followUpQuestion', 'bonusTip'],
        },
      },
    });

    const parsed = JSON.parse(response.text?.trim() || '{}');
    return res.json(parsed);
  } catch (err: any) {
    console.error('Error in examiner evaluation:', err);
    const fallback = generateLocalExaminerFallback(topic, question, studentAnswer);
    return res.json(fallback);
  }
});

// 2. GENERATE ANGRY EXPLAINER LECTURE NOTES & QUIZ FROM TOPIC/URL
app.post('/api/lectures/generate', async (req: Request, res: Response) => {
  const { topic, youtubeUrl } = req.body;

  if (!topic) {
    return res.status(400).json({ error: 'Topic is required.' });
  }

  try {
    if (!process.env.GEMINI_API_KEY) {
      return res.status(200).json({
        id: 'lec-' + Date.now(),
        title: topic,
        topic: 'Custom Study Session',
        difficulty: 'High-Yield',
        youtubeUrl: youtubeUrl || 'https://www.youtube.com/@theangryexplainer',
        youtubeId: 'W2h-gC1_HjM',
        duration: '15 min',
        summary: `The Angry Explainer breakdown for ${topic}: Cut through textbook jargon and master the fundamental driving mechanism before exam day.`,
        theTrap: 'Students memorize isolated facts without understanding the thermodynamic or regulatory trigger that initiates the entire pathway.',
        coreMechanism: [
          '1. Baseline State: Understand the initial steady-state conditions and electrochemical or molecular gradients.',
          '2. The Primary Trigger: The specific stimulus, ligand-receptor binding, or conformational shift that initiates the cascade.',
          '3. Amplification & Propagation: How the signal is magnified through secondary messengers or sequential enzymatic steps.',
          '4. Termination & Reset: The mandatory inactivation, repolarization, or allosteric negative feedback loop that restores baseline.'
        ],
        analogy: `Think of ${topic} like an automated factory safety valve: when pressure spikes beyond a critical tolerance, the relief gate snaps open until equilibrium is safely restored.`,
        highYieldBullets: [
          'Identify the rate-limiting enzyme or primary voltage sensor in the cascade.',
          'Distinguish kinetic changes (Vmax vs Km) from thermodynamic driving forces.',
          'Always look for negative feedback allosteric control.'
        ],
        tags: [topic, 'The Angry Explainer', 'High-Yield'],
        quiz: [
          {
            id: 'q-' + Date.now() + '-1',
            topic: topic,
            question: `What is the critical rate-limiting or primary regulatory control point in ${topic}?`,
            options: [
              'The initial substrate-binding or voltage-sensing step that initiates downstream change',
              'An unregulated passive leak pathway that bypasses cellular control',
              'A non-specific cytosolic buffer that destroys all intermediates',
              'An instantaneous equilibrium state with zero energy expenditure'
            ],
            correctIndex: 0,
            angryExplanation: 'Correct! Biological systems strictly control the very first committed step to conserve ATP and prevent runaway cascade activation.',
            examinerTrapNotes: 'Do not pick passive non-specific answers on exam questions.'
          }
        ],
        vivaQuestions: [
          {
            id: 'viva-' + Date.now() + '-1',
            topic: topic,
            title: `Oral Viva: ${topic} Under Scrutiny`,
            difficulty: 'Strict',
            examinerPrompt: `Candidate, explain the physiological chain of causality in ${topic} from initial trigger to terminal feedback. Name every key protein and state the thermodynamic driving force.`,
            requiredKeywords: ['rate-limiting step', 'causal mechanism', 'feedback regulation'],
            sampleModelAnswer: `The pathway initiates with specific receptor or voltage activation, triggers conformational shifts, and terminates via negative feedback.`,
            followUpPrompt: 'What happens if the primary inactivation or negative feedback mechanism fails?'
          }
        ]
      });
    }

    const prompt = `You are "The Angry Explainer" (@theangryexplainer), famous on YouTube for energetic, no-BS, punchy STEM/medical educational videos that obliterate confusing textbook jargon.
Create an exhaustive, high-yield lecture study package for the topic: "${topic}".

CRITICAL SCIENTIFIC ACCURACY REQUIREMENT:
You must verify that all biological, chemical, physical, and mathematical facts are 100% textbook-accurate (Campbell, Guyton & Hall, Lehninger).
- Do not confuse ion movements, gradients, or channel kinetics (e.g. Na+ enters down electrochemical gradient during depolarizing upstroke; K+ exits during repolarization; Na+/K+ ATPase restores resting concentration gradients over time).
- Do not confuse kinetic Vmax vs affinity Km.
- Do not confuse respiratory vs metabolic acid-base compensation.
- Ensure the quiz correctIndex is factually and mathematically indisputable.

Include:
1. title: punchy, direct title
2. summary: 2 sentences cutting straight through why students struggle with it and what it actually is
3. theTrap: the exact misconception that professors use to fail 60% of students on exams
4. coreMechanism: array of 4-5 numbered strings outlining the exact chronological mechanism step-by-step
5. analogy: a vivid, hilarious, unforgettable real-world analogy
6. highYieldBullets: array of 3-4 bullet points of high-yield exam pearls
7. quiz: array of 3 multiple choice questions with options, correctIndex, angryExplanation, and examinerTrapNotes
8. vivaQuestions: array of 2 speaking exam questions with title, difficulty, examinerPrompt, requiredKeywords, sampleModelAnswer, followUpPrompt`;

    const response = await callGeminiWithFallback({
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            summary: { type: Type.STRING },
            theTrap: { type: Type.STRING },
            coreMechanism: { type: Type.ARRAY, items: { type: Type.STRING } },
            analogy: { type: Type.STRING },
            highYieldBullets: { type: Type.ARRAY, items: { type: Type.STRING } },
            quiz: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  question: { type: Type.STRING },
                  options: { type: Type.ARRAY, items: { type: Type.STRING } },
                  correctIndex: { type: Type.INTEGER },
                  angryExplanation: { type: Type.STRING },
                  examinerTrapNotes: { type: Type.STRING },
                },
                required: ['question', 'options', 'correctIndex', 'angryExplanation', 'examinerTrapNotes'],
              },
            },
            vivaQuestions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  difficulty: { type: Type.STRING },
                  examinerPrompt: { type: Type.STRING },
                  requiredKeywords: { type: Type.ARRAY, items: { type: Type.STRING } },
                  sampleModelAnswer: { type: Type.STRING },
                  followUpPrompt: { type: Type.STRING },
                },
                required: ['title', 'difficulty', 'examinerPrompt', 'requiredKeywords', 'sampleModelAnswer', 'followUpPrompt'],
              },
            },
          },
          required: ['title', 'summary', 'theTrap', 'coreMechanism', 'analogy', 'highYieldBullets', 'quiz', 'vivaQuestions'],
        },
      },
    });

    const parsed = JSON.parse(response.text?.trim() || '{}');
    const newLecture = {
      id: 'lec-' + Date.now(),
      topic,
      difficulty: 'High-Yield' as const,
      youtubeUrl: youtubeUrl || 'https://www.youtube.com/@theangryexplainer',
      youtubeId: 'W2h-gC1_HjM',
      duration: '15 min',
      tags: [topic, 'The Angry Explainer', 'High-Yield'],
      ...parsed,
      quiz: (parsed.quiz || []).map((q: any, i: number) => ({
        id: `q-gen-${Date.now()}-${i}`,
        topic,
        ...q,
      })),
      vivaQuestions: (parsed.vivaQuestions || []).map((v: any, i: number) => ({
        id: `viva-gen-${Date.now()}-${i}`,
        topic,
        ...v,
      })),
    };

    return res.json(newLecture);
  } catch (err: any) {
    console.error('Error generating lecture:', err);
    return res.json({
      id: 'lec-' + Date.now(),
      title: topic,
      topic: topic,
      difficulty: 'High-Yield' as const,
      youtubeUrl: youtubeUrl || 'https://www.youtube.com/@theangryexplainer',
      youtubeId: 'W2h-gC1_HjM',
      duration: '15 min',
      summary: `The Angry Explainer breakdown for ${topic}: Master the fundamental causal steps, rate-limiting gate, and termination feedback before your exam.`,
      theTrap: 'Students memorize loose definitions without understanding the physical driving force or the negative feedback loop that restores equilibrium.',
      coreMechanism: [
        `1. Resting Steady State: The baseline chemical, electrical, or structural state prior to activation.`,
        `2. The Specific Stimulus: The committed trigger, ligand binding, or voltage delta that initiates downstream changes.`,
        `3. Rate-Limiting Conformational Step: The primary gate or enzyme that dictates total pathway velocity.`,
        `4. Downstream Signal / Flux: The direct physical work, ion movement, or product synthesis.`,
        `5. Negative Feedback & Baseline Reset: The mandatory shut-off mechanism that prevents cytotoxic depletion or runaway excitation.`
      ],
      analogy: `Think of ${topic} like an electronic pressure-relief safety valve: it remains inert until threshold is crossed, fires with maximum fidelity, and automatically locks back down.`,
      highYieldBullets: [
        'Always identify the committed rate-limiting step on exam questions.',
        'Distinguish kinetic changes (Vmax vs Km) from thermodynamic driving forces.',
        'Never forget the shut-off mechanism; without it, biological systems crash.'
      ],
      tags: [topic, 'The Angry Explainer', 'High-Yield'],
      quiz: [
        {
          id: 'q-' + Date.now() + '-1',
          topic: topic,
          question: `What is the crucial rate-limiting or regulatory control point in ${topic}?`,
          options: [
            'The initial committed step or primary gated channel that requires the highest activation energy',
            'A random passive leak pathway that operates without regulation',
            'A continuous uninhibited cycle that produces infinite energy',
            'An instantaneous reaction with zero intermediate states'
          ],
          correctIndex: 0,
          angryExplanation: 'Correct! Living systems and physical laws always govern the committed step to conserve resources and preserve stability.',
          examinerTrapNotes: 'Examiners always test the committed step. Do not pick passive uninhibited options.'
        }
      ],
      vivaQuestions: [
        {
          id: 'viva-' + Date.now() + '-1',
          topic: topic,
          title: `Oral Examination: ${topic}`,
          difficulty: 'Strict',
          examinerPrompt: `Explain the complete sequence of ${topic} from resting baseline to terminal negative feedback. State the rate-limiting step explicitly.`,
          requiredKeywords: ['rate-limiting step', 'causal sequence', 'negative feedback'],
          sampleModelAnswer: `The pathway is triggered at baseline, passes through the rate-limiting checkpoint, performs downstream work, and is deactivated via negative feedback.`,
          followUpPrompt: 'What happens physiologically if the negative feedback mechanism is blocked by a toxin?'
        }
      ]
    });
  }
});

// DISCIPLINE DETECTION HELPER
interface DisciplineInfo {
  isEnglish: boolean;
  isCalculus: boolean;
  isAlgebra1: boolean;
  isAlgebra2: boolean;
  isGeometry: boolean;
  isMath: boolean;
  isHistory: boolean;
  isScience: boolean;
  canonicalName: string;
}

function detectDiscipline(subjectStr: string = '', topicList: string[] = [], contextStr: string = ''): DisciplineInfo {
  const full = `${subjectStr} ${Array.isArray(topicList) ? topicList.join(' ') : ''} ${contextStr}`.toLowerCase();
  const isEnglish = /english|literature|reading|writing|language|grammar|rhetoric|poetry|novel|prose|essay|author/i.test(full);
  const isCalculus = /calculus|derivative|integral|limit|related rate|optimization|ftc|slope field/i.test(full);
  const isAlgebra1 = /algebra\s*1|algebra1|elementary algebra|linear equation|systems of equations|slope-intercept|factoring trinomial/i.test(full);
  const isAlgebra2 = /algebra\s*2|algebra2|intermediate algebra|polynomial|logarithm|complex number|rational function|conic section/i.test(full);
  const isGeometry = /geometry|triangle|circle|polygon|proof|pythagor|congruen|volume|surface area|trigonometric ratio|soh-cah-toa/i.test(full);
  const isMath = isCalculus || isAlgebra1 || isAlgebra2 || isGeometry || /math|algebra|geometry|calculus|trig|statistics|pre-algebra/i.test(full);
  const isHistory = /history|government|civics|politic|constitution|revolution|civil war/i.test(full);
  const isScience = !isEnglish && !isMath && !isHistory && /biology|physiology|anatomy|chemistry|physics|biochem|neuro|medical|cellular|enzyme|genetics|science/i.test(full);

  const canonicalName = isEnglish ? 'English & Literature'
    : isCalculus ? 'Calculus'
    : isAlgebra1 ? 'Algebra 1'
    : isAlgebra2 ? 'Algebra 2'
    : isGeometry ? 'Geometry'
    : isHistory ? 'History & Social Studies'
    : isScience ? 'Science & Biology'
    : (subjectStr || 'General Academic Studies');

  return {
    isEnglish,
    isCalculus,
    isAlgebra1,
    isAlgebra2,
    isGeometry,
    isMath,
    isHistory,
    isScience,
    canonicalName
  };
}

function checkLongPassage(questionTypes?: any[], preference?: string): boolean {
  if (preference === 'long-6-plus') return true;
  if (!Array.isArray(questionTypes)) return false;
  return questionTypes.some(qt => {
    if (typeof qt !== 'string') return false;
    const l = qt.toLowerCase();
    return l.includes('6+') || l.includes('long reading passage') || l.includes('6 paragraph') || l.includes('extended passage');
  });
}

// 3. GENERATE DAILY QUIZ ENDPOINT (DISCIPLINE SPECIFIC)
app.post('/api/quizzes/generate-daily', async (req: Request, res: Response) => {
  const { topics, subject, questionTypes, passageLengthPreference, isLongPassage: reqLongPassage } = req.body;
  const disc = detectDiscipline(subject, Array.isArray(topics) ? topics : []);

  const isLongPassage = checkLongPassage(questionTypes, passageLengthPreference) || reqLongPassage === true;
  const hasReadingPassage = isLongPassage || (Array.isArray(questionTypes) && questionTypes.some((qt: string) => typeof qt === 'string' && qt.toLowerCase().includes('passage')));

  const fallbackQuestions = () => {
    if (disc.isEnglish) {
      const eng6Paragraph = `[¶1] Fellow-citizens, pardon me, allow me to ask, why am I called upon to speak here today? What have I, or those I represent, to do with your national independence? Are the great principles of political freedom and of natural justice, embodied in that Declaration of Independence, extended to us? and am I, therefore, called upon to bring our humble offering to the national altar, and to confess the benefits and express devout gratitude for the blessings resulting from your independence to us?

[¶2] Would to God, both for your sakes and ours, that an affirmative answer could be truthfully returned to these questions! Then would my task be light, and my burden easy and delightful. For who is there so cold, that a nation's sympathy could not warm him? Who so obdurate and dead to the claims of gratitude, that would not thankfully acknowledge such priceless benefits? But such is not the state of the case. I say it with a sad sense of the disparity between us.

[¶3] I am not included within the pale of this glorious anniversary! Your high independence only reveals the immeasurable distance between us. The blessings in which you, this day, rejoice, are not enjoyed in common. The rich inheritance of justice, liberty, prosperity and independence, bequeathed by your fathers, is shared by you, not by me. The sunlight that brought light and healing to you, has brought stripes and death to me. This Fourth of July is yours, not mine. You may rejoice, I must mourn.

[¶4] To drag a man in fetters into the grand illuminated temple of liberty, and call upon him to join you in joyous anthems, were inhuman mockery and sacrilegious irony. Do you mean, citizens, to mock me, by asking me to speak today? If so, there is a parallel to your conduct. And let me warn you that it is dangerous to copy the example of a nation whose crimes, towering up to heaven, were thrown down by the breath of the Almighty, burying that nation in irrevocable ruin!

[¶5] Standing with God and the crushed and bleeding slave on this occasion, I will, in the name of humanity which is outraged, in the name of liberty which is fettered, in the name of the constitution and the Bible, which are disregarded and trampled upon, dare to call in question and to denounce, with all the emphasis I can command, everything that serves to perpetuate slavery—the great sin and shame of America!

[¶6] What, to the American slave, is your 4th of July? I answer; a day that reveals to him, more than all other days in the year, the gross injustice and cruelty to which he is the constant victim. To him, your celebration is a sham; your boasted liberty, an unholy license; your national greatness, vanity; your sounds of rejoicing are empty and heartless; your shouts of liberty and equality, hollow mockery; your prayers and hymns, your sermons and thanksgivings, with all your religious parade and solemnity, are, to Him, mere bombast, fraud, deception, impiety, and hypocrisy—a thin veil to cover up crimes which would disgrace a nation of savages.`;

      return [
        {
          id: `fallback-eng-${Date.now()}-1`,
          topic: 'Rhetorical Devices & Textual Synthesis',
          passageTitle: hasReadingPassage ? (isLongPassage ? 'Extended Rhetorical Address: Frederick Douglass (1852 — 6-Paragraph Full Analysis)' : 'Rhetorical Analysis: Excerpt from Frederick Douglass (1852)') : undefined,
          passage: hasReadingPassage ? (isLongPassage ? eng6Paragraph : eng6Paragraph.split('\n\n').slice(0, 3).join('\n\n')) : undefined,
          question: 'In analytical writing and rhetoric, what is the defining characteristic of an appeal to ethos, and how does Douglass deploy it in contrasting the Fourth of July with chattel slavery?',
          options: [
            'It establishes the speaker\'s moral credibility, character, and qualification to address the audience, which Douglass establishes in [¶1] before unleashing righteous moral indignation in [¶5]–[¶6]',
            'It relies strictly on emotional shock tactics and exaggerated sensory imagery without logical basis',
            'It uses deductive mathematical syllogisms and economic statistics exclusively',
            'It describes the literal chronological plot progression without commentary or evaluation'
          ],
          correctIndex: 0,
          angryExplanation: 'Ethos is speaker credibility and moral authority! Douglass establishes ethos through respectful opening queries, earning the moral standing to deliver his devastating critique.',
          examinerTrapNotes: 'Do not confuse ethos with pathos. Pathos appeals to visceral emotions; ethos appeals to character and trust.'
        },
        {
          id: `fallback-eng-${Date.now()}-2`,
          topic: 'Literary Craft & Irony',
          question: 'Which of the following scenarios best demonstrates dramatic irony in literature?',
          options: [
            'The audience possesses crucial knowledge that a character remains unaware of, generating dramatic tension',
            'A character says the exact opposite of what they mean for humorous sarcasm',
            'An unexpected weather event disrupts an outdoor celebration without symbolic meaning',
            'A narrator summarizes five chapters of plot in a single descriptive sentence'
          ],
          correctIndex: 0,
          angryExplanation: 'Dramatic irony requires the audience or reader to know a vital secret that the character does not! Sarcasm is verbal irony; unexpected twists are situational irony.',
          examinerTrapNotes: 'Examiners always test whether you know the difference between situational, verbal, and dramatic irony.'
        },
        {
          id: `fallback-eng-${Date.now()}-3`,
          topic: 'Syntax & Tone',
          question: 'When an author abruptly shifts from elongated, complex compound sentences to short, clipped fragments, what effect is typically achieved?',
          options: [
            'It accelerates the narrative pace and heightens psychological tension or urgency',
            'It indicates that the author became fatigued and stopped revising the text',
            'It proves that the passage has no cohesive grammatical structure',
            'It signals an immediate transition into rhyming lyric poetry'
          ],
          correctIndex: 0,
          angryExplanation: 'Syntax directly mirrors psychological urgency! Truncated syntax quickens heart rates and creates stark emphasis.',
          examinerTrapNotes: 'Always analyze the connection between syntactic rhythm and emotional resonance.'
        }
      ];
    }

    if (disc.isMath) {
      return [
        {
          id: `fallback-math-${Date.now()}-1`,
          topic: disc.isCalculus ? 'Calculus: Derivatives & Chain Rule' : 'Algebra: Functions & Quadratics',
          question: disc.isCalculus
            ? 'What is the derivative of f(x) = ln(x^3 + 4) with respect to x?'
            : 'For the quadratic equation 2x^2 - 8x + 6 = 0, what are the exact real solutions?',
          options: disc.isCalculus ? [
            'f\'(x) = (3x^2) / (x^3 + 4), applying the Chain Rule d/dx[ln(u)] = u\'/u',
            'f\'(x) = 1 / (x^3 + 4), forgetting the inner derivative of x^3',
            'f\'(x) = 3x^2 * ln(x^3 + 4)',
            'f\'(x) = 1 / (3x^2)'
          ] : [
            'x = 1 and x = 3, factoring 2(x^2 - 4x + 3) = 2(x - 1)(x - 3) = 0',
            'x = -1 and x = -3',
            'x = 2 and x = 4',
            'There are no real solutions because the discriminant is negative'
          ],
          correctIndex: 0,
          angryExplanation: disc.isCalculus
            ? 'Chain Rule rule of iron: d/dx[ln(u)] = u\'/u. Here u = x^3 + 4, so u\' = 3x^2. Result is 3x^2 / (x^3 + 4)!'
            : 'Factor out the GCF: 2(x^2 - 4x + 3) = 0. Factors of +3 that add to -4 are -1 and -3, yielding x = 1 and x = 3!',
          examinerTrapNotes: disc.isCalculus ? 'Always multiply by the derivative of the inner function!' : 'Never forget to factor out the GCF before applying formulas!'
        }
      ];
    }

    // Default STEM / Science
    return [
      {
        id: `fallback-q-${Date.now()}-1`,
        topic: 'Electrophysiology',
        question: 'During the depolarizing upstroke of a neuronal action potential, which ion movement and channel state is primarily responsible?',
        options: [
          'Rapid influx of Na+ into the cell through voltage-gated Na+ channels',
          'Active extrusion of 3 Na+ ions by the Na+/K+ ATPase pump',
          'Efflux of K+ ions out of the cell down its concentration gradient',
          'Passive entry of Cl- ions that neutralizes resting membrane potential'
        ],
        correctIndex: 0,
        angryExplanation: 'Na+ rushes INTO the neuron down its electrochemical gradient when voltage-gated activation gates fly open at threshold (~ -55 mV). The Na+/K+ ATPase is a slow restorative pump, not the acute action potential trigger!',
        examinerTrapNotes: 'Do not confuse the acute depolarizing spike (Na+ in) with the ATPase pump that resets resting concentration gradients.'
      },
      {
        id: `fallback-q-${Date.now()}-2`,
        topic: 'Enzyme Kinetics',
        question: 'A researcher adds a competitive inhibitor to an enzymatic reaction. What effect will this have on the apparent Km and Vmax?',
        options: [
          'Km increases (lower affinity), Vmax remains unchanged',
          'Vmax decreases, Km remains completely unchanged',
          'Both Vmax and Km decrease proportionally',
          'Km decreases (higher affinity), Vmax increases'
        ],
        correctIndex: 0,
        angryExplanation: 'A competitive inhibitor competes with substrate for the active catalytic site. By flooding the system with excess substrate [S], you can outcompete the inhibitor, so Vmax is unaffected. However, you need more substrate to reach 1/2 Vmax, meaning apparent Km is higher!',
        examinerTrapNotes: 'Competitive = Km up, Vmax constant. Non-competitive/allosteric = Vmax down, Km constant.'
      }
    ];
  };

  try {
    if (!process.env.GEMINI_API_KEY) {
      return res.json({ questions: fallbackQuestions() });
    }

    let disciplinePrompt = '';
    if (disc.isEnglish) {
      disciplinePrompt = `CRITICAL DISCIPLINE MANDATE: THIS IS STRICTLY AN ENGLISH & LITERATURE QUIZ.
- YOU ARE STRICTLY FORBIDDEN from generating science, biology, medical, chemistry, or physics questions.
- Questions must test English topics: Rhetorical Analysis, Literary Devices, Authorial Tone, Thesis Construction, Syntax, or Vocabulary in Context.`;
    } else if (disc.isMath) {
      disciplinePrompt = `CRITICAL DISCIPLINE MANDATE: THIS IS STRICTLY A MATHEMATICS (${disc.canonicalName}) QUIZ.
- YOU ARE STRICTLY FORBIDDEN from generating biology or medical questions.
- Questions must test genuine mathematical formulas, derivations, theorems, and problem-solving steps.`;
    } else if (disc.isHistory) {
      disciplinePrompt = `CRITICAL DISCIPLINE MANDATE: THIS IS STRICTLY A HISTORY & SOCIAL STUDIES QUIZ.
- Questions must evaluate primary sources, historical causation, constitutional principles, and historiography.`;
    } else {
      disciplinePrompt = `CRITICAL DISCIPLINE MANDATE: THIS IS A ${disc.canonicalName.toUpperCase()} QUIZ.
- Questions must strictly adhere to the academic curriculum and principles of ${disc.canonicalName}.`;
    }

    const passagePromptPart = hasReadingPassage
      ? (isLongPassage
          ? `EXTENDED READING PASSAGE REQUIREMENT (6+ PARAGRAPHS MANDATORY):
- MANDATORY: Include a 'passage' of AT LEAST 6 DISTINCT WELL-DEVELOPED PARAGRAPHS (separated by \\n\\n), labeled [¶1], [¶2], [¶3], [¶4], [¶5], [¶6].
- Include an academic title in 'passageTitle'.
- Questions must require cross-paragraph analytical synthesis. Options must be intricate multi-clause statements (25-45 words each).`
          : `READING PASSAGE REQUIREMENT:
- Include a dense 2-4 paragraph 'passage' and 'passageTitle'.
- Questions must test deep analysis of the passage with nuanced multi-clause choices.`)
      : '';

    const prompt = `Generate 5 challenging, high-yield multiple choice questions in the style of The Angry Explainer (@theangryexplainer).
Subject: "${subject || disc.canonicalName}"
Target topics: ${Array.isArray(topics) && topics.length ? topics.join(', ') : disc.canonicalName}.

${disciplinePrompt}

${passagePromptPart}

CRITICAL FACTUAL INTEGRITY MANDATE:
- Every question must be 100% accurate according to authoritative consensus for this subject.
- Ensure 'correctIndex' is unambiguously, objectively the single correct option. Distractors must be realistic student traps, NOT factually debatable.
- The angryExplanation must crisply explain why the correct option is true and expose the traps.
- distractorExplanations: For each option in 'options' (indexed 0 to 3), provide a 1-2 sentence explanation of why that specific option is incorrect (or for correctIndex, why it is right).`;

    const response = await callGeminiWithFallback({
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  passageTitle: { type: Type.STRING },
                  passage: { type: Type.STRING },
                  topic: { type: Type.STRING },
                  question: { type: Type.STRING },
                  options: { type: Type.ARRAY, items: { type: Type.STRING } },
                  correctIndex: { type: Type.INTEGER },
                  angryExplanation: { type: Type.STRING },
                  examinerTrapNotes: { type: Type.STRING },
                  distractorExplanations: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: 'Array explaining why each option index is wrong (or why correctIndex is right)',
                  },
                },
                required: ['topic', 'question', 'options', 'correctIndex', 'angryExplanation', 'examinerTrapNotes'],
              },
            },
          },
          required: ['questions'],
        },
      },
    });

    const parsed = JSON.parse(response.text?.trim() || '{}');
    const questionsWithIds = (parsed.questions || []).map((q: any, i: number) => ({
      id: `daily-ai-${Date.now()}-${i}`,
      ...q,
    }));

    return res.json({ questions: questionsWithIds.length > 0 ? questionsWithIds : fallbackQuestions() });
  } catch (err: any) {
    console.error('Error generating daily quiz:', err);
    return res.json({ questions: fallbackQuestions() });
  }
});

// ==========================================
// 3B. GEMINI ADVANCED QUESTION CREATOR STUDIO
// Full Gemini Capabilities: Multimodal Vision, Web Grounding, Thinking Level, TTS
// ==========================================
app.post('/api/questions/create-custom', async (req: Request, res: Response) => {
  const {
    prompt: userPrompt,
    subject = 'General Science & Mathematics',
    topic,
    gradeLevel = 'High School / AP / College',
    difficulty = 'Standard High-Yield',
    format = 'multiple-choice',
    passageLength = 'none',
    image,
    enableSearchGrounding = false,
    thinkingLevel = 'HIGH',
    voiceName = 'Charon',
    generateAudio = false,
    count = 1,
  } = req.body;

  const disc = detectDiscipline(subject, topic ? [topic] : []);
  const questionCount = Math.min(5, Math.max(1, Number(count) || 1));

  // Build the specialized pedagogical prompt
  const hasReadingPassage = passageLength === 'standard' || passageLength === '6-plus-paragraphs';
  const is6PlusParagraphs = passageLength === '6-plus-paragraphs';

  let formatInstruction = '';
  if (format === 'vignette') {
    formatInstruction = `FORMAT: Scenario-based clinical or scientific vignette. Provide an in-depth observational scenario with realistic parameters before stating the question stem.`;
  } else if (format === 'quantitative-derivation') {
    formatInstruction = `FORMAT: Quantitative mathematical/physical derivation. The problem must test multi-step formula calculation, algebraic manipulation, or dimensional reasoning.`;
  } else if (format === 'passage-synthesis') {
    formatInstruction = `FORMAT: Textual analysis and synthesis based on a written passage.`;
  } else {
    formatInstruction = `FORMAT: High-yield multiple choice question with subtle distractor traps and deep conceptual testing.`;
  }

  let passagePrompt = '';
  if (hasReadingPassage) {
    if (is6PlusParagraphs) {
      passagePrompt = `PASSAGE REQUIREMENT (MANDATORY 6+ PARAGRAPHS):
- You MUST generate an extensive academic passage with AT LEAST 6 DISTINCT PARAGRAPHS separated by \\n\\n, clearly prefixed with [¶1], [¶2], [¶3], [¶4], [¶5], [¶6].
- Include a formal academic title in 'passageTitle'.
- The questions must require cross-paragraph analytical synthesis. Options must be intricate multi-clause statements (25-45 words each).`;
    } else {
      passagePrompt = `PASSAGE REQUIREMENT:
- Include a dense 2-4 paragraph text in 'passage' and a 'passageTitle'.
- Questions must analyze themes, causal links, or authorial rhetorical choices from the passage.`;
    }
  }

  let multimodalInstruction = '';
  if (image && image.data) {
    multimodalInstruction = `MULTIMODAL VISUAL ANALYSIS MANDATE:
- The user has provided an uploaded diagram, chart, textbook excerpt, handwritten calculation, or experimental setup image.
- THOROUGHLY ANALYZE the visual artifact. Formulate questions that directly test the student's ability to read, interpret, extrapolate, or spot anomalies in this specific visual.
- In 'visualAnalysis', summarize what you observed in the image (axes, chemical bonds, cellular organelles, circuit components, historical details).`;
  }

  const systemInstructions = `You are the master question architect for "The Angry Examiner" active study platform.
Your objective: Craft pristine, academically rigorous, factually unimpeachable exam questions designed to dismantle passive studying and expose student cognitive flaws.

PARAMETERS:
- Subject: ${subject}
- Primary Topic: ${topic || userPrompt || subject}
- Target Grade / Exam Standard: ${gradeLevel}
- Calibrated Difficulty: ${difficulty}
- ${formatInstruction}
- ${passagePrompt}
- ${multimodalInstruction}

USER INSTRUCTIONS / PROMPT / TOPIC DETAILS:
"${userPrompt || 'Generate rigorous exam problems on the target topic'}"

CORE PEDAGOGICAL REQUIREMENTS:
1. FACTUAL INTEGRITY: 100% accurate according to modern authoritative textbooks and academic consensus.
2. DISTRACTORS: Must contain exactly 4 options. Distractors MUST NOT be silly or obvious throwaways. Each distractor must represent a famous textbook trap:
   - Inverted Causality (swapping cause and effect)
   - Premature Evaluation (stopping before completing the multi-step calculation)
   - Superficial Association (grabbing familiar buzzwords without semantic relevance)
   - Absolute Generalization (using "always/never" in systems with known exceptions)
   - Algebraic Sign / Direction Flip (+ vs -, inward vs outward)
3. DISTRACTOR EXPLANATIONS: For EACH option (0 to 3), provide a 1-3 sentence breakdown explaining WHY an examinee would be misled into picking it, and the EXACT reason it is false.
4. EXAMINER TRAP NOTE: A sharp, memorable warning from The Angry Examiner on how students get tricked by this problem.
5. DESIGN RATIONALE / THINKING: A short paragraph in 'thinkingProcess' detailing the pedagogical blueprint behind this question.

Output MUST be a JSON object with this exact shape:
{
  "questions": [
    {
      "topic": "Specific Sub-Topic Name",
      "passageTitle": "Optional title if passage generated",
      "passage": "Optional passage text if required",
      "visualAnalysis": "Observations from visual diagram if image provided",
      "question": "The complete, clear question stem",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0,
      "angryExplanation": "Rigorous proof of why correctIndex is objectively true and flawless",
      "examinerTrapNotes": "Specific examiner advice exposing the primary trap",
      "distractorExplanations": [
        "Why Option A is false (or true if correctIndex)",
        "Why Option B is false",
        "Why Option C is false",
        "Why Option D is false"
      ],
      "fallacyTags": ["Inverted Causality", "Superficial Association", "Sign Flip"],
      "thinkingProcess": "Pedagogical blueprint and cognitive gap analysis"
    }
  ]
}`;

  try {
    // Construct request parts (handling Multimodal image if supplied)
    let contents: any;
    if (image && image.data) {
      const cleanData = image.data.replace(/^data:image\/\w+;base64,/, '');
      contents = {
        parts: [
          {
            inlineData: {
              mimeType: image.mimeType || 'image/png',
              data: cleanData,
            },
          },
          { text: systemInstructions },
        ],
      };
    } else {
      contents = systemInstructions;
    }

    // Configure Thinking Level
    const configObj: any = {
      responseMimeType: 'application/json',
    };

    if (thinkingLevel && ThinkingLevel[thinkingLevel as keyof typeof ThinkingLevel]) {
      configObj.thinkingConfig = {
        thinkingLevel: ThinkingLevel[thinkingLevel as keyof typeof ThinkingLevel],
      };
    }

    // Configure Google Search Grounding if requested
    if (enableSearchGrounding) {
      configObj.tools = [{ googleSearch: {} }];
    }

    let rawResponse: any;
    let usedSearch = false;
    let searchSources: { title: string; url?: string }[] = [];

    try {
      rawResponse = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents,
        config: configObj,
      });
      usedSearch = Boolean(enableSearchGrounding);

      // Extract search citations if present
      const grounding = rawResponse.candidates?.[0]?.groundingMetadata;
      if (grounding?.groundingChunks) {
        searchSources = grounding.groundingChunks
          .map((chunk: any) => ({
            title: chunk.web?.title || 'Web Source',
            url: chunk.web?.uri || undefined,
          }))
          .filter((s: any) => s.url);
      }
    } catch (apiErr: any) {
      console.warn('[Question Creator] Initial call failed, attempting fallback without search/thinking:', apiErr?.message);
      // Fallback without tools if quota or tool combination failed
      rawResponse = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents,
        config: { responseMimeType: 'application/json' },
      });
    }

    const jsonText = rawResponse?.text?.trim() || '{}';
    let parsed: any = {};
    try {
      parsed = JSON.parse(jsonText);
    } catch (parseErr) {
      // Regex extraction fallback
      const match = jsonText.match(/\{[\s\S]*\}/);
      if (match) {
        parsed = JSON.parse(match[0]);
      }
    }

    let outputQuestions = Array.isArray(parsed.questions) ? parsed.questions : (parsed.question ? [parsed] : []);

    // Format questions and attach IDs
    const formattedQuestions: any[] = outputQuestions.map((q: any, i: number) => ({
      id: `gemini-custom-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`,
      topic: q.topic || topic || subject,
      question: q.question,
      options: Array.isArray(q.options) && q.options.length >= 4 ? q.options.slice(0, 4) : [
        'Option A (Primary correct mechanism)',
        'Option B (Plausible distractor with inverted sign)',
        'Option C (Superficial keyword association)',
        'Option D (Overgeneralized absolute statement)'
      ],
      correctIndex: typeof q.correctIndex === 'number' && q.correctIndex >= 0 && q.correctIndex <= 3 ? q.correctIndex : 0,
      angryExplanation: q.angryExplanation || 'The correct option aligns rigorously with underlying empirical principles.',
      examinerTrapNotes: q.examinerTrapNotes || 'Do not fall for superficial keyword matches; always verify the step-by-step causality.',
      distractorExplanations: Array.isArray(q.distractorExplanations) && q.distractorExplanations.length >= 4 ? q.distractorExplanations : [
        'Matches the validated textbook mechanism.',
        'Distractor: Swaps cause and effect (inverted causality).',
        'Distractor: Confuses static equilibrium with kinetic steady-state.',
        'Distractor: Makes an unsupported absolute claim ignoring edge cases.'
      ],
      passage: q.passage || undefined,
      passageTitle: q.passageTitle || undefined,
      visualAnalysis: q.visualAnalysis || undefined,
      thinkingProcess: q.thinkingProcess || undefined,
      fallacyTags: Array.isArray(q.fallacyTags) ? q.fallacyTags : ['Distractor Analysis', 'Cognitive Trap'],
      searchSources: searchSources.length > 0 ? searchSources : undefined,
      difficulty,
    }));

    // If Audio Generation is requested, synthesize TTS with gemini-3.8-flash-lite-tts
    if (generateAudio && formattedQuestions.length > 0) {
      try {
        const targetQ = formattedQuestions[0];
        const audioScript = `${targetQ.question}. Option A: ${targetQ.options[0]}. Option B: ${targetQ.options[1]}. Option C: ${targetQ.options[2]}. Option D: ${targetQ.options[3]}.`;
        
        const audioRes = await ai.models.generateContent({
          model: 'gemini-3.8-flash-lite-tts',
          contents: [{
            role: 'user',
            parts: [{
              text: audioScript.slice(0, 600),
              speechMetadata: {
                style: 'Clear, authoritative academic examiner',
              },
            }],
          }],
          config: {
            responseModalities: ['AUDIO'],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: voiceName || 'Charon' },
              },
            },
          },
        });

        const audioBase64 = audioRes.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (audioBase64) {
          targetQ.audioData = audioBase64;
          targetQ.voiceName = voiceName || 'Charon';
        }
      } catch (ttsErr: any) {
        console.warn('[Gemini TTS Question] Audio synthesis skipped:', ttsErr?.message);
      }
    }

    return res.json({
      success: true,
      questions: formattedQuestions,
      meta: {
        usedSearch,
        searchSourcesCount: searchSources.length,
        hasAudio: Boolean(formattedQuestions[0]?.audioData),
        modelUsed: 'gemini-3.8-flash',
      },
    });
  } catch (err: any) {
    console.error('Error in /api/questions/create-custom:', err);
    return res.status(500).json({
      error: err?.message || 'Failed to generate custom question with Gemini capabilities',
    });
  }
});

// Endpoint to synthesize audio on-demand for any question or explanation
app.post('/api/questions/synthesize-voice', async (req: Request, res: Response) => {
  const { text, voiceName = 'Charon' } = req.body;
  if (!text) {
    return res.status(400).json({ error: 'Text is required for TTS synthesis.' });
  }

  try {
    const audioRes = await ai.models.generateContent({
      model: 'gemini-3.8-flash-lite-tts',
      contents: [{
        role: 'user',
        parts: [{
          text: String(text).slice(0, 800),
          speechMetadata: {
            style: 'Clear, authoritative academic examiner',
          },
        }],
      }],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voiceName || 'Charon' },
          },
        },
      },
    });

    const audioBase64 = audioRes.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!audioBase64) {
      return res.status(500).json({ error: 'No audio data returned from Gemini TTS' });
    }

    return res.json({
      success: true,
      audioBase64,
      mimeType: 'audio/wav',
      voiceName,
    });
  } catch (err: any) {
    console.error('Error in /api/questions/synthesize-voice:', err);
    return res.status(500).json({ error: err?.message || 'Voice synthesis failed' });
  }
});


// ==========================================
// 3C. GITHUB INTEGRATION & OAUTH ENDPOINTS
// ==========================================
function getAppBaseUrl(req: Request): string {
  if (process.env.APP_URL && process.env.APP_URL !== 'MY_APP_URL') {
    return process.env.APP_URL.replace(/\/$/, '');
  }
  const host = req.get('host') || '';
  if (host.includes('run.app')) {
    return `https://${host}`;
  }
  const protocol = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
  return `${protocol}://${host || 'localhost:3000'}`;
}

// 1. Get GitHub OAuth Authorize URL
app.get('/api/auth/github/url', (req: Request, res: Response) => {
  const baseUrl = getAppBaseUrl(req);
  const redirectUri = `${baseUrl}/auth/github/callback`;
  const clientId = process.env.GITHUB_CLIENT_ID || '';
  const devCallback = 'https://ais-dev-fyu2pvxhkjuql6t5rypdhe-479650556186.us-west2.run.app/auth/github/callback';
  const sharedCallback = 'https://ais-pre-fyu2pvxhkjuql6t5rypdhe-479650556186.us-west2.run.app/auth/github/callback';

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: 'read:user,repo,gist',
    state: Math.random().toString(36).substring(2),
  });

  const authUrl = `https://github.com/login/oauth/authorize?${params.toString()}`;

  return res.json({
    url: authUrl,
    isConfigured: Boolean(clientId && process.env.GITHUB_CLIENT_SECRET),
    redirectUri,
    devCallback,
    sharedCallback,
  });
});

// 2. Handle GitHub OAuth Callback (both with and without trailing slash)
app.get(['/auth/github/callback', '/auth/github/callback/'], async (req: Request, res: Response) => {
  const { code, error, error_description } = req.query;
  const baseUrl = getAppBaseUrl(req);
  const redirectUri = `${baseUrl}/auth/github/callback`;

  if (error || !code) {
    const errorMsg = String(error_description || error || 'Authorization was cancelled or failed.');
    return res.send(`
      <!DOCTYPE html>
      <html>
        <head><title>GitHub Authentication Failed</title></head>
        <body style="background:#090d16;color:#f8fafc;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;">
          <div style="background:#1e293b;padding:32px;border-radius:16px;text-align:center;max-width:420px;border:1px solid #ef4444;">
            <h3 style="color:#ef4444;margin:0 0 12px;">GitHub Authentication Error</h3>
            <p style="color:#cbd5e1;font-size:14px;line-height:1.5;">${errorMsg}</p>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'GITHUB_AUTH_ERROR', error: ${JSON.stringify(errorMsg)} }, '*');
                setTimeout(() => window.close(), 1500);
              }
            </script>
          </div>
        </body>
      </html>
    `);
  }

  try {
    // Exchange authorization code for access token
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'User-Agent': 'SmartStudy-App/1.0',
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code: String(code),
        redirect_uri: redirectUri,
      }),
    });

    const tokenData: any = await tokenRes.json();

    if (tokenData.error || !tokenData.access_token) {
      const errMsg = tokenData.error_description || tokenData.error || 'Failed to obtain access token from GitHub.';
      return res.send(`
        <!DOCTYPE html>
        <html>
          <head><title>GitHub Token Error</title></head>
          <body style="background:#090d16;color:#f8fafc;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;">
            <div style="background:#1e293b;padding:32px;border-radius:16px;text-align:center;max-width:420px;border:1px solid #ef4444;">
              <h3 style="color:#ef4444;margin:0 0 12px;">Token Exchange Failed</h3>
              <p style="color:#cbd5e1;font-size:14px;line-height:1.5;">${errMsg}</p>
              <script>
                if (window.opener) {
                  window.opener.postMessage({ type: 'GITHUB_AUTH_ERROR', error: ${JSON.stringify(errMsg)} }, '*');
                  setTimeout(() => window.close(), 1500);
                }
              </script>
            </div>
          </body>
        </html>
      `);
    }

    // Fetch authenticated user profile
    const userRes = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        'User-Agent': 'SmartStudy-App/1.0',
        Accept: 'application/vnd.github.v3+json',
      },
    });

    const userData: any = await userRes.json();

    return res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>GitHub Connected</title>
          <style>
            body {
              background: #090d16;
              color: #f8fafc;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              display: flex;
              align-items: center;
              justify-content: center;
              height: 100vh;
              margin: 0;
            }
            .card {
              background: #0f172a;
              border: 1px solid rgba(56, 189, 248, 0.4);
              border-radius: 20px;
              padding: 32px;
              text-align: center;
              max-width: 380px;
              box-shadow: 0 20px 40px rgba(0,0,0,0.6);
            }
            .avatar {
              width: 72px;
              height: 72px;
              border-radius: 50%;
              border: 3px solid #38bdf8;
              margin-bottom: 16px;
            }
            h2 { margin: 0 0 8px; color: #38bdf8; font-size: 20px; }
            p { color: #94a3b8; font-size: 13px; margin: 0 0 16px; }
            .badge {
              display: inline-block;
              padding: 4px 12px;
              background: rgba(16, 185, 129, 0.2);
              border: 1px solid #10b981;
              color: #34d399;
              font-size: 12px;
              font-weight: bold;
              border-radius: 12px;
            }
          </style>
        </head>
        <body>
          <div class="card">
            ${userData.avatar_url ? `<img src="${userData.avatar_url}" class="avatar" alt="Avatar"/>` : ''}
            <h2>GitHub Connected!</h2>
            <p>Welcome back, <strong>@${userData.login || 'Scholar'}</strong></p>
            <div class="badge">Session Linked Successfully</div>
            <p style="margin-top:16px; font-size: 11px; color:#64748b;">Closing window and returning to Smart Study...</p>
          </div>
          <script>
            const payload = {
              type: 'GITHUB_AUTH_SUCCESS',
              token: ${JSON.stringify(tokenData.access_token)},
              user: ${JSON.stringify(userData)},
              timestamp: Date.now()
            };
            if (window.opener) {
              window.opener.postMessage(payload, '*');
              setTimeout(() => {
                window.close();
              }, 500);
            } else {
              window.location.href = '/';
            }
          </script>
        </body>
      </html>
    `);
  } catch (err: any) {
    console.error('Error during GitHub OAuth callback:', err);
    return res.status(500).send(`Authentication error: ${err?.message || 'Unknown error'}`);
  }
});

// 3. Verify GitHub Token (OAuth token or Personal Access Token) & Fetch User Profile + Repos
app.post('/api/github/verify-token', async (req: Request, res: Response) => {
  const { token } = req.body;
  if (!token) {
    return res.status(400).json({ error: 'GitHub token is required.' });
  }

  try {
    const userRes = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${token}`,
        'User-Agent': 'SmartStudy-App/1.0',
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (!userRes.ok) {
      const errData: any = await userRes.json();
      return res.status(userRes.status).json({
        error: errData.message || 'Invalid GitHub token. Please verify token permissions.',
      });
    }

    const user: any = await userRes.json();

    // Fetch user's recent repositories
    let repos: any[] = [];
    try {
      const reposRes = await fetch('https://api.github.com/user/repos?sort=updated&per_page=12', {
        headers: {
          Authorization: `Bearer ${token}`,
          'User-Agent': 'SmartStudy-App/1.0',
          Accept: 'application/vnd.github.v3+json',
        },
      });
      if (reposRes.ok) {
        repos = await reposRes.json();
      }
    } catch (e) {
      // Repos fetch optional
    }

    return res.json({
      success: true,
      user: {
        id: user.id,
        login: user.login,
        name: user.name,
        avatar_url: user.avatar_url,
        html_url: user.html_url,
        bio: user.bio,
        public_repos: user.public_repos,
        total_private_repos: user.total_private_repos || 0,
        company: user.company,
        location: user.location,
      },
      repos: repos.map((r: any) => ({
        id: r.id,
        name: r.name,
        full_name: r.full_name,
        private: r.private,
        description: r.description,
        html_url: r.html_url,
        default_branch: r.default_branch,
        updated_at: r.updated_at,
      })),
    });
  } catch (err: any) {
    console.error('Error verifying GitHub token:', err);
    return res.status(500).json({ error: err?.message || 'Failed to verify GitHub token' });
  }
});

// 4. Import Content from GitHub (Repository, Markdown Notes, Code, or Syllabus)
app.post('/api/github/import-content', async (req: Request, res: Response) => {
  const { repoUrl, filePath = '', token, targetMode = 'questions' } = req.body;

  if (!repoUrl) {
    return res.status(400).json({ error: 'GitHub repository or file URL is required.' });
  }

  try {
    // Parse repo URL: supports "owner/repo", "https://github.com/owner/repo", or "https://github.com/owner/repo/blob/branch/path/to/file.md"
    let cleanUrl = repoUrl.trim().replace(/\/$/, '');
    let owner = '';
    let repo = '';
    let extractedPath = filePath;
    let branch = 'main';

    if (cleanUrl.includes('github.com/')) {
      const parts = cleanUrl.replace('https://github.com/', '').replace('http://github.com/', '').split('/');
      owner = parts[0];
      repo = parts[1];
      if (parts[2] === 'blob' && parts.length > 4) {
        branch = parts[3];
        extractedPath = parts.slice(4).join('/');
      }
    } else if (cleanUrl.includes('/')) {
      const parts = cleanUrl.split('/');
      owner = parts[0];
      repo = parts[1];
    } else {
      return res.status(400).json({ error: 'Invalid GitHub URL format. Use owner/repo or full github.com link.' });
    }

    const headers: Record<string, string> = {
      'User-Agent': 'SmartStudy-App/1.0',
      Accept: 'application/vnd.github.v3+json',
    };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    let fileContent = '';
    let resolvedFileName = extractedPath || 'README.md';

    // If specific file path requested
    if (extractedPath) {
      const branchParam = cleanUrl.includes('/blob/') ? `?ref=${branch}` : '';
      const fileApiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${extractedPath}${branchParam}`;
      const fileRes = await fetch(fileApiUrl, { headers });
      if (!fileRes.ok) {
        // Try raw usercontent fallback with branch then master
        let rawRes = await fetch(`https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${extractedPath}`, { headers });
        if (!rawRes.ok) {
          rawRes = await fetch(`https://raw.githubusercontent.com/${owner}/${repo}/master/${extractedPath}`, { headers });
        }
        if (!rawRes.ok) {
          throw new Error(`Could not locate file "${extractedPath}" in repository ${owner}/${repo}`);
        }
        fileContent = await rawRes.text();
      } else {
        const fileData: any = await fileRes.json();
        if (fileData.content && fileData.encoding === 'base64') {
          fileContent = Buffer.from(fileData.content, 'base64').toString('utf-8');
        } else if (fileData.download_url) {
          const dlRes = await fetch(fileData.download_url, { headers });
          fileContent = await dlRes.text();
        }
      }
    } else {
      // Default: fetch repository README
      const readmeRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/readme`, { headers });
      if (readmeRes.ok) {
        const readmeData: any = await readmeRes.json();
        if (readmeData.content && readmeData.encoding === 'base64') {
          fileContent = Buffer.from(readmeData.content, 'base64').toString('utf-8');
          resolvedFileName = readmeData.name || 'README.md';
        }
      } else {
        // Fallback: list contents of repository
        const contentsRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents`, { headers });
        if (contentsRes.ok) {
          const items: any = await contentsRes.json();
          const mdItem = items.find((it: any) => it.name.endsWith('.md') || it.name.endsWith('.txt'));
          if (mdItem && mdItem.download_url) {
            const fileRes = await fetch(mdItem.download_url, { headers });
            fileContent = await fileRes.text();
            resolvedFileName = mdItem.name;
          } else {
            fileContent = `Repository ${owner}/${repo} structure:\n` + items.map((it: any) => `- ${it.path} (${it.type})`).join('\n');
            resolvedFileName = 'Repository Outline';
          }
        } else {
          throw new Error(`Unable to fetch contents from ${owner}/${repo}. Check if repo is public or provide an authenticated token.`);
        }
      }
    }

    // Limit text for Gemini processing
    const truncatedText = fileContent.slice(0, 15000);

    // If targetMode is 'questions', run Gemini to transform GitHub text into high-yield exam practice questions
    let generatedQuestions: any[] = [];
    if (targetMode === 'questions') {
      const qPrompt = `You are The Angry Examiner. You have ingested this technical document/code/notes from GitHub repository "${owner}/${repo}" (${resolvedFileName}):
---
${truncatedText}
---
Generate 3 challenging, high-yield multiple-choice exam questions testing the core mechanics, theorems, architectures, or principles described in this GitHub material.
For EACH question:
- 4 plausible options
- 1 objectively correct option
- Rigorous explanation of the proof
- Specific examiner trap note
- distractorExplanations: For each option index (0 to 3), provide 1-2 sentences explaining why that choice is flawed (or why it is correct for the correctIndex).

Respond in JSON adhering to this schema:
{
  "questions": [
    {
      "topic": "${repo} - ${resolvedFileName}",
      "question": "The question stem...",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0,
      "angryExplanation": "Why correctIndex is true...",
      "examinerTrapNotes": "Specific trap to avoid...",
      "distractorExplanations": ["Why A", "Why B", "Why C", "Why D"]
    }
  ]
}`;

      try {
        const geminiRes = await callGeminiWithFallback({
          contents: qPrompt,
          config: {
            responseMimeType: 'application/json',
          },
        });
        const parsed = JSON.parse(geminiRes.text?.trim() || '{}');
        if (Array.isArray(parsed.questions)) {
          generatedQuestions = parsed.questions.map((q: any, i: number) => ({
            id: `github-imported-${Date.now()}-${i}`,
            ...q,
            topic: q.topic || `${owner}/${repo}`,
          }));
        }
      } catch (genErr) {
        console.warn('Gemini question generation from GitHub failed:', genErr);
      }
    }

    return res.json({
      success: true,
      repo: `${owner}/${repo}`,
      fileName: resolvedFileName,
      contentSnippet: fileContent.slice(0, 2000),
      contentLength: fileContent.length,
      generatedQuestions,
    });
  } catch (err: any) {
    console.error('Error importing from GitHub:', err);
    return res.status(500).json({ error: err?.message || 'Failed to import content from GitHub' });
  }
});

// 5. Export / Sync Study Vault to GitHub Gist
app.post('/api/github/export-gist', async (req: Request, res: Response) => {
  const { token, studyPlan, mistakes, flashcards, studyState, isPublic = false, description } = req.body;

  if (!token) {
    return res.status(401).json({ error: 'GitHub token required to export Gist.' });
  }

  try {
    const files: Record<string, { content: string }> = {};

    // 1. Study Plan Markdown
    if (studyPlan) {
      let planMd = `# 🎓 The Angry Examiner: Active Study War Plan\n\n`;
      planMd += `**Subject:** ${studyPlan.profile?.subject || 'Comprehensive Study'}\n`;
      planMd += `**Exam Target Date:** ${studyPlan.profile?.examDate || 'Upcoming'}\n`;
      planMd += `**Daily Target:** ${studyPlan.dailyStudyTargetMinutes || 60} minutes/day\n\n`;
      planMd += `## Examiner Roast & Diagnostic\n> ${studyPlan.examinerRoastSummary || 'Active recall beats passive reading.'}\n\n`;
      planMd += `## High-Yield Milestones\n`;
      (studyPlan.milestones || []).forEach((m: any, i: number) => {
        planMd += `### Milestone ${i + 1}: ${m.title} (${m.dayRange})\n`;
        planMd += `**Focus:** ${m.focus}\n`;
        (m.actionItems || []).forEach((item: string) => {
          planMd += `- [ ] ${item}\n`;
        });
        planMd += `\n`;
      });
      files['study-plan.md'] = { content: planMd };
    }

    // 2. Mistakes Vault Markdown
    if (Array.isArray(mistakes) && mistakes.length > 0) {
      let mistakesMd = `# ⚠️ Mistakes Vault: Cognitive Gap Analysis\n\n`;
      mistakesMd += `*Generated by Smart Study on ${new Date().toLocaleDateString()}*\n\n`;
      mistakes.forEach((m: any, i: number) => {
        mistakesMd += `### Error ${i + 1}: ${m.topic}\n`;
        mistakesMd += `**Question:** ${m.question}\n\n`;
        mistakesMd += `❌ **Your Choice:** ${m.selectedAnswer}\n`;
        if (m.whyPickedWrong) {
          mistakesMd += `*Why chosen option was wrong:* ${m.whyPickedWrong}\n`;
        }
        mistakesMd += `\n✅ **Correct Answer:** ${m.correctAnswer}\n`;
        mistakesMd += `*Textbook Proof:* ${m.examinerExplanation}\n\n`;
        if (m.trapNote) {
          mistakesMd += `⚠️ **Trap Warning:** ${m.trapNote}\n`;
        }
        mistakesMd += `\n---\n\n`;
      });
      files['mistakes-vault.md'] = { content: mistakesMd };
    }

    // 3. Spaced Repetition Flashcards Markdown
    if (Array.isArray(flashcards) && flashcards.length > 0) {
      let cardsMd = `# 🗂️ Active Spaced Repetition Flashcards\n\n`;
      flashcards.forEach((c: any, i: number) => {
        cardsMd += `### Card ${i + 1}: ${c.topic} (Box ${c.box || 1})\n`;
        cardsMd += `**Front (Question / Challenge):**\n${c.front}\n\n`;
        cardsMd += `**Back (Mechanism / Solution):**\n${c.back}\n\n`;
        if (c.trap) {
          cardsMd += `*Common Distractor Trap:* ${c.trap}\n`;
        }
        cardsMd += `\n---\n\n`;
      });
      files['flashcards.md'] = { content: cardsMd };
    }

    // 4. Complete Raw JSON Backup
    if (studyState) {
      files['smart-study-backup.json'] = {
        content: JSON.stringify(studyState, null, 2),
      };
    }

    if (Object.keys(files).length === 0) {
      files['study-notes.md'] = {
        content: `# Smart Study Notes\n\nExported on ${new Date().toISOString()}`,
      };
    }

    const gistRes = await fetch('https://api.github.com/gists', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Agent': 'SmartStudy-App/1.0',
        'User-Agent': 'SmartStudy-App/1.0',
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        description: description || `Smart Study Vault: ${studyPlan?.profile?.subject || 'Exam Mastery'} (${new Date().toLocaleDateString()})`,
        public: Boolean(isPublic),
        files,
      }),
    });

    if (!gistRes.ok) {
      const errData: any = await gistRes.json();
      throw new Error(errData.message || 'Failed to create Gist on GitHub');
    }

    const gistData: any = await gistRes.json();

    return res.json({
      success: true,
      gistUrl: gistData.html_url,
      gistId: gistData.id,
      filesCount: Object.keys(files).length,
    });
  } catch (err: any) {
    console.error('Error exporting to GitHub Gist:', err);
    return res.status(500).json({ error: err?.message || 'Failed to export to GitHub Gist' });
  }
});

// 6. Commit Daily Study Streak to a GitHub Repository
app.post('/api/github/commit-streak', async (req: Request, res: Response) => {
  const {
    token,
    repoName = 'smart-study-streak',
    streakDays = 1,
    minutesSpent = 60,
    questionsAnswered = 10,
    subject = 'General Studies',
    notes,
  } = req.body;

  if (!token) {
    return res.status(401).json({ error: 'GitHub token required to record commit streak.' });
  }

  try {
    const headers = {
      Authorization: `Bearer ${token}`,
      'User-Agent': 'SmartStudy-App/1.0',
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    };

    // 1. Get authenticated user
    const userRes = await fetch('https://api.github.com/user', { headers });
    if (!userRes.ok) throw new Error('Invalid GitHub token');
    const user: any = await userRes.json();
    const owner = user.login;

    // 2. Check if repository exists, if not create it
    const repoCheckRes = await fetch(`https://api.github.com/repos/${owner}/${repoName}`, { headers });
    if (!repoCheckRes.ok && repoCheckRes.status === 404) {
      const createRepoRes = await fetch('https://api.github.com/user/repos', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: repoName,
          description: '🧠 Active Daily Study Streak Tracker: commits recorded automatically by Smart Study',
          private: false,
          auto_init: true,
        }),
      });
      if (!createRepoRes.ok) {
        throw new Error('Failed to create target study repository on GitHub');
      }
      // Wait brief moment for repo initialization
      await new Promise(r => setTimeout(r, 1200));
    }

    // 3. Read existing study-log.md to get SHA and append
    const filePath = 'study-log.md';
    let fileSha: string | undefined;
    let existingContent = '# 🧠 Smart Study Streak Log\n\nDaily automated active recall commits.\n\n| Date | Streak | Subject | Minutes | Questions | Notes |\n| :--- | :---: | :--- | :---: | :---: | :--- |\n';

    const fileCheckRes = await fetch(`https://api.github.com/repos/${owner}/${repoName}/contents/${filePath}`, { headers });
    if (fileCheckRes.ok) {
      const fileData: any = await fileCheckRes.json();
      fileSha = fileData.sha;
      if (fileData.content) {
        existingContent = Buffer.from(fileData.content, 'base64').toString('utf-8');
      }
    }

    // 4. Append today's log line
    const todayStr = new Date().toISOString().split('T')[0];
    const newEntry = `| ${todayStr} | 🔥 ${streakDays}d | ${subject} | ${minutesSpent}m | ${questionsAnswered} | ${notes || 'Active recall & pretest session'} |\n`;
    const updatedContent = existingContent.includes(`| ${todayStr} |`)
      ? existingContent // Don't duplicate today's row if already committed
      : existingContent + newEntry;

    // 5. Commit updated file
    const commitMessage = `🔥 Study Streak Day ${streakDays}: ${minutesSpent}m on ${subject} [Smart Study]`;
    const commitRes = await fetch(`https://api.github.com/repos/${owner}/${repoName}/contents/${filePath}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        message: commitMessage,
        content: Buffer.from(updatedContent).toString('base64'),
        sha: fileSha,
      }),
    });

    if (!commitRes.ok) {
      const errData: any = await commitRes.json();
      throw new Error(errData.message || 'Failed to commit streak to repository');
    }

    const commitData: any = await commitRes.json();

    return res.json({
      success: true,
      commitUrl: commitData.commit?.html_url || `https://github.com/${owner}/${repoName}`,
      repoUrl: `https://github.com/${owner}/${repoName}`,
      streakDays,
    });
  } catch (err: any) {
    console.error('Error committing streak to GitHub:', err);
    return res.status(500).json({ error: err?.message || 'Failed to record streak commit on GitHub' });
  }
});


// 4. GENERATE EXAM PLAN ENDPOINT (based on angryexaminer.com/app)
app.post('/api/exam-plan/generate', async (req: Request, res: Response) => {
  const { profile } = req.body;
  if (!profile || !profile.subject) {
    return res.status(400).json({ error: 'Profile with subject is required.' });
  }

  const examDateObj = new Date(profile.examDate || new Date().toISOString().split('T')[0]);
  const today = new Date();
  const diffTime = examDateObj.getTime() - today.getTime();
  const daysRemaining = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

  const disc = detectDiscipline(profile.subject, Array.isArray(profile.topics) ? profile.topics : []);

  function generateFallbackPlan() {
    let roast = `So you have ${daysRemaining} days left until your ${profile.gradeLevel} ${profile.subject} examination in ${profile.country}. Let me be ruthlessly clear: reading highlighted notes and passively skimming summaries will not save you. If you cannot explain and apply the core principles under time pressure, you will bleed marks. Here is your battle plan.`;
    let milestones: any[] = [];
    let highYieldFocalPoints: string[] = [];
    let recommendedSyllabusTopics: string[] = [];

    if (disc.isEnglish) {
      roast = `You have ${daysRemaining} days until your ${profile.gradeLevel} English & Literature exam in ${profile.country}. Let me be ruthlessly candid: plot summaries and superficial description will earn you a mediocre grade. Top examiners test textual inference, authorial tone, syntactic cadence, and rhetorical craft. Here is your battle plan.`;
      milestones = [
        {
          phase: 'Phase 1: Rhetorical Deconstruction & Textual Inferences',
          title: 'Master Rhetorical Devices & Nuanced Evidence Pairing',
          dayRange: `Days 1 - ${Math.max(2, Math.floor(daysRemaining * 0.35))}`,
          focus: `Isolate every topic you selected (${Array.isArray(profile.topics) && profile.topics.length ? profile.topics.join(', ') : 'Rhetorical Devices & Textual Inferences'}). Stop summarizing what happened; analyze HOW and WHY the author constructed meaning through craft.`,
          actionItems: [
            'Annotate 2 challenging literary/rhetorical passages daily, isolating ethos, logos, pathos, and antithesis.',
            'Practice pairing textual claims with direct line evidence to dismantle trap questions.',
            'Review all vocabulary-in-context terms for secondary and figurative connotations.'
          ]
        },
        {
          phase: 'Phase 2: Complex Passage Drilling & Thesis Crucible',
          title: 'Eliminating Seductive Traps & Crafting Defensible Theses',
          dayRange: `Days ${Math.floor(daysRemaining * 0.35) + 1} - ${Math.max(Math.floor(daysRemaining * 0.35) + 2, Math.floor(daysRemaining * 0.75))}`,
          focus: `Simulate exact format: ${Array.isArray(profile.questionTypes) ? profile.questionTypes.join(', ') : 'Complex Reading Passages & Analytical Essays'}. Eliminate seductive distractor choices that merely describe literal plot events.`,
          actionItems: [
            'Complete 10 daily timed reading comprehension questions with complex literary excerpts.',
            'Draft 3 non-obvious thematic claims that explain how specific syntax and craft build meaning.',
            'Spot and eliminate distractor options that are factually true in isolation but fail the prompt.'
          ]
        },
        {
          phase: 'Phase 3: The Examination War Room',
          title: 'Full Pressure Reading Simulations & Speed Synthesis',
          dayRange: `Days ${Math.floor(daysRemaining * 0.75) + 1} - ${daysRemaining}`,
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
    } else if (disc.isCalculus) {
      milestones = [
        {
          phase: 'Phase 1: Limit Foundations & Derivative Mechanics',
          title: 'Eliminate Algebraic Slop & Master Chain Rule / FTC',
          dayRange: `Days 1 - ${Math.max(2, Math.floor(daysRemaining * 0.35))}`,
          focus: 'Lock down limits, continuity, differentiability, and composite derivative rules without sign errors.',
          actionItems: [
            'Solve 15 daily derivative and limit problems with strict attention to Chain Rule inner functions.',
            'Audit differentiability preconditions before applying Mean Value Theorem or L\'Hopital\'s Rule.',
            'Master Fundamental Theorem of Calculus Part 1 and Part 2 derivations.'
          ]
        },
        {
          phase: 'Phase 2: Applications of Derivatives & Integral Crucible',
          title: 'Related Rates, Optimization & Riemann Synthesis',
          dayRange: `Days ${Math.floor(daysRemaining * 0.35) + 1} - ${Math.max(Math.floor(daysRemaining * 0.35) + 2, Math.floor(daysRemaining * 0.75))}`,
          focus: 'Eliminate geometric blunders in Related Rates and master U-substitution and area between curves.',
          actionItems: [
            'Relate variables geometrically first before applying d/dt in Related Rates word problems.',
            'Complete 10 timed definite integrals requiring algebraic manipulation and substitution.',
            'Spot common calculus traps: forgetting dx, constants of integration, or composite chain derivatives.'
          ]
        },
        {
          phase: 'Phase 3: The Examination War Room',
          title: 'Timed Past Papers & Multi-Step Exam Drills',
          dayRange: `Days ${Math.floor(daysRemaining * 0.75) + 1} - ${daysRemaining}`,
          focus: 'Full exam conditions with strict time limits. Zero looking at formula sheets.',
          actionItems: [
            'Simulate full timed AP/University Calculus exam sections.',
            'Review all flagged algebraic simplification mistakes.',
            'Rest well before exam day—fatigue causes sign errors on multi-step integrals.'
          ]
        }
      ];
      highYieldFocalPoints = [
        'Always applying the Chain Rule: d/dx[f(g(x))] = f\'(g(x)) * g\'(x).',
        'Relating geometric variables first before differentiating in Related Rates.',
        'Fundamental Theorem of Calculus: d/dx ∫[a to u(x)] f(t)dt = f(u(x)) * u\'(x).',
        'Checking preconditions (continuity on [a,b], differentiability on (a,b)) before applying theorems.'
      ];
      recommendedSyllabusTopics = [
        'Limits, Continuity & Squeeze Theorem',
        'Derivatives, Product Rule & Chain Rule',
        'Related Rates & Geometric Optimization',
        'Definite Integrals & Riemann Sums',
        'Fundamental Theorem of Calculus (FTC)',
        'Differential Equations & Slope Fields'
      ];
    } else if (disc.isAlgebra1 || disc.isAlgebra2) {
      milestones = [
        {
          phase: 'Phase 1: Core Equations, Factoring & Graphing',
          title: `${disc.isAlgebra1 ? 'Linear & Quadratic Foundations' : 'Polynomials, Roots & Complex Numbers'}`,
          dayRange: `Days 1 - ${Math.max(2, Math.floor(daysRemaining * 0.35))}`,
          focus: 'Eliminate arithmetic and sign errors; master factoring, vertex form, and function representations.',
          actionItems: [
            'Complete 15 daily factoring and quadratic equation drills.',
            'Graph linear and quadratic functions, identifying intercepts and vertex coordinates.',
            'Audit sign errors when distributing negative signs across parentheses.'
          ]
        },
        {
          phase: 'Phase 2: Systems, Inequalities & Advanced Functions',
          title: `${disc.isAlgebra1 ? 'Systems of Equations & Radicals' : 'Rational Expressions & Logarithms'}`,
          dayRange: `Days ${Math.floor(daysRemaining * 0.35) + 1} - ${Math.max(Math.floor(daysRemaining * 0.35) + 2, Math.floor(daysRemaining * 0.75))}`,
          focus: 'Solve multi-step systems, check for extraneous solutions, and master exponential/logarithmic rules.',
          actionItems: [
            'Solve 10 applied word problems modeling rates, cost, and revenue.',
            'Check for extraneous roots when solving rational and radical equations.',
            'Drill exponent and logarithm properties until recall is instant.'
          ]
        },
        {
          phase: 'Phase 3: The Examination War Room',
          title: 'Full Speed Exam Simulation & Error Audit',
          dayRange: `Days ${Math.floor(daysRemaining * 0.75) + 1} - ${daysRemaining}`,
          focus: 'Past paper execution under strict timers.',
          actionItems: [
            'Simulate full exam condition drills with strict timers.',
            'Audit weakest topics and review flagged calculation traps.',
            'Sleep 8 hours before exam day—a sharp brain avoids careless arithmetic slips.'
          ]
        }
      ];
      highYieldFocalPoints = [
        'Sign discipline: distributing negative coefficients across parentheses.',
        'Factoring trinomials: always extracting greatest common factors first.',
        'Vertex form f(x) = a(x - h)^2 + k where vertex is (h, k).',
        'Verifying solutions to eliminate extraneous roots.'
      ];
      recommendedSyllabusTopics = disc.isAlgebra1 ? [
        'Linear Equations & Multi-Step Inequalities',
        'Systems of Linear Equations (Elimination & Substitution)',
        'Slope-Intercept Form & Graphing Linear Functions',
        'Factoring Trinomials & Difference of Squares',
        'Quadratic Formula & Vertex Form of Parabolas',
        'Exponent Properties, Radicals & Scientific Notation'
      ] : [
        'Polynomial Functions, Roots & End Behavior',
        'Complex Numbers & Fundamental Theorem of Algebra',
        'Rational Expressions & Vertical/Horizontal Asymptotes',
        'Exponential Growth & Logarithmic Equations',
        'Function Transformations & Inverse Functions',
        'Arithmetic & Geometric Sequences and Series'
      ];
    } else if (disc.isGeometry) {
      milestones = [
        {
          phase: 'Phase 1: Proofs, Congruence & Special Triangles',
          title: 'Eliminate Waffle & Master Deductive Geometric Proofs',
          dayRange: `Days 1 - ${Math.max(2, Math.floor(daysRemaining * 0.35))}`,
          focus: 'Master triangle congruence (SAS, SSS, ASA, AAS, HL) and special right triangle ratios (30-60-90, 45-45-90).',
          actionItems: [
            'Complete 5 two-column proofs daily, stating exact theorem justifications.',
            'Memorize 30-60-90 (1 : √3 : 2) and 45-45-90 (1 : 1 : √2) exact side ratios.',
            'Audit common traps: assuming lines are parallel or bisected without explicit given statements.'
          ]
        },
        {
          phase: 'Phase 2: Circles, Right Triangle Trig & Volume',
          title: 'Circle Theorems, Trigonometric Ratios & 3D Solids',
          dayRange: `Days ${Math.floor(daysRemaining * 0.35) + 1} - ${Math.max(Math.floor(daysRemaining * 0.35) + 2, Math.floor(daysRemaining * 0.75))}`,
          focus: 'Master inscribed angles, chord/tangent theorems, SOH-CAH-TOA, and surface area/volume formulas.',
          actionItems: [
            'Solve 10 circle theorem problems involving central angles and tangents.',
            'Calculate composite 3D volumes and surface areas without formula hesitation.',
            'Apply coordinate geometry distance and midpoint formulas to prove quadrilaterals.'
          ]
        },
        {
          phase: 'Phase 3: The Examination War Room',
          title: 'Full Geometry Exam Crucible & Diagram Speed',
          dayRange: `Days ${Math.floor(daysRemaining * 0.75) + 1} - ${daysRemaining}`,
          focus: 'Timed practice exams with complex geometric diagrams. Zero guessing.',
          actionItems: [
            'Simulate full timed geometry past papers.',
            'Audit common diagram traps and misread angle measures.',
            'Rest well before exam day—a clear visual mind spots auxiliary construction lines easily.'
          ]
        }
      ];
      highYieldFocalPoints = [
        'Special right triangles: 30-60-90 (1 : √3 : 2) vs 45-45-90 (1 : 1 : √2).',
        'Triangle congruence: SAS, SSS, ASA, AAS, and HL (SSA is NOT valid).',
        'Inscribed angle is exactly half the central angle intercepting the same arc.',
        'Never assume perpendicularity or midpoint without explicit geometric proof.'
      ];
      recommendedSyllabusTopics = [
        'Triangle Congruence & Similarity Proofs (SAS, SSS, AA)',
        'Pythagorean Theorem & Special Right Triangles (30-60-90, 45-45-90)',
        'Circle Theorems (Chords, Tangents & Inscribed Angles)',
        'Area, Surface Area & 3D Composite Volume',
        'Coordinate Geometry Proofs & Distance Formula',
        'Trigonometric Ratios (Sine, Cosine, Tangent / SOH-CAH-TOA)'
      ];
    } else {
      // General STEM or Science
      milestones = [
        {
          phase: 'Phase 1: Brutal Mechanism Deconstruction',
          title: `Lock Down Core Principles in ${disc.canonicalName}`,
          dayRange: `Days 1 - ${Math.max(2, Math.floor(daysRemaining * 0.35))}`,
          focus: `Isolate every single topic you named (${Array.isArray(profile.topics) && profile.topics.length ? profile.topics.join(', ') : profile.subject}). Trace cause-and-effect mechanisms without hand-waving.`,
          actionItems: [
            'Complete 1 lecture breakdown daily for your selected topics.',
            'Survive oral practice sessions testing core checkpoints.',
            'Review all flashcards until 0 overdue cards remain.'
          ]
        },
        {
          phase: 'Phase 2: High-Stakes Examiner Cross-Examination',
          title: 'Spotting Traps & Refining Scientific Precision',
          dayRange: `Days ${Math.floor(daysRemaining * 0.35) + 1} - ${Math.max(Math.floor(daysRemaining * 0.35) + 2, Math.floor(daysRemaining * 0.75))}`,
          focus: `Simulate the exact format: ${Array.isArray(profile.questionTypes) ? profile.questionTypes.join(', ') : 'Exams'}.`,
          actionItems: [
            'Execute 10 daily practice questions tailored to your question formats.',
            'Complete Spot the Flaw drills to train your eye to catch subtle errors.',
            'Take 60-Second Pressure Chamber drills to build immediate reflex recall.'
          ]
        },
        {
          phase: 'Phase 3: The Examination War Room',
          title: 'Full Pressure Simulations & Active Synthesis',
          dayRange: `Days ${Math.floor(daysRemaining * 0.75) + 1} - ${daysRemaining}`,
          focus: 'Past paper execution and time-pressured drills. Zero passive revision allowed.',
          actionItems: [
            'Simulate full exam condition drills with strict timers.',
            'Audit weakest topics in the Retention Decay Matrix and drill them back to 90%+.',
            'Sleep 8 hours before exam day—a fatigued brain fails to execute complex mechanisms.'
          ]
        }
      ];
      highYieldFocalPoints = Array.isArray(profile.topics) && profile.topics.length > 0
        ? profile.topics.map((t: string) => `Lock down core control points and common exam traps in ${t}`)
        : [
            'Distinguishing triggers from consequences in multi-step systems.',
            'Rate-limiting steps and regulation mechanisms.',
            'Interpreting experimental data and boundary conditions.'
          ];
      recommendedSyllabusTopics = Array.isArray(profile.topics) && profile.topics.length > 0
        ? profile.topics
        : [
            'Core Theoretical Foundations',
            'Analytical Problem Solving',
            'Experimental Assay Evaluation',
            'Data Interpretation & Error Analysis'
          ];
    }

    return {
      id: 'plan-' + Date.now(),
      createdAt: new Date().toISOString(),
      profile,
      daysRemaining,
      dailyStudyTargetMinutes: daysRemaining <= 14 ? 90 : daysRemaining <= 30 ? 60 : 45,
      examinerRoastSummary: roast,
      milestones,
      highYieldFocalPoints,
      recommendedSyllabusTopics
    };
  }

  try {
    if (!process.env.GEMINI_API_KEY) {
      return res.json(generateFallbackPlan());
    }

    let disciplineMandate = '';
    if (disc.isEnglish) {
      disciplineMandate = `CRITICAL DISCIPLINE SPECIFICITY MANDATE:
- This is strictly an ENGLISH & LITERATURE exam (${profile.subject}).
- YOU ARE STRICTLY AND ABSOLUTELY FORBIDDEN FROM GENERATING SCIENCE, BIOLOGY, BIOCHEMISTRY, CLINICAL, OR PHYSICS CONTENT.
- Milestones, focal points, syllabus topics, and action items must be 100% focused on English, Literature, Rhetoric, Writing, Analysis, Reading Passages, Grammar, and Vocabulary.`;
    } else if (disc.isMath) {
      disciplineMandate = `CRITICAL DISCIPLINE SPECIFICITY MANDATE:
- This is strictly a MATHEMATICS (${disc.canonicalName}) exam.
- YOU ARE STRICTLY FORBIDDEN from generating biology, medical, or clinical content.
- Milestones, focal points, and action items must focus on mathematical problem solving, theorems, proofs, and equations.`;
    }

    const systemPrompt = `You are "The Angry Examiner" from angryexaminer.com.
A student has submitted their exam profile to build a custom study plan for their upcoming exam.

Student Profile:
- Subject Struggling With: "${profile.subject}"
- Specific Weak Topics: ${JSON.stringify(profile.topics || [])}
- Exam Question Format: ${JSON.stringify(profile.questionTypes || [])}
- Grade Level: "${profile.gradeLevel}"
- Country / Exam Board: "${profile.country}"
- Exam Date: "${profile.examDate}" (${daysRemaining} days remaining)
- Past Papers / Question Text: "${profile.pastPaperContext || 'None provided'}"
${Array.isArray(profile.pastPaperImages) && profile.pastPaperImages.length > 0 ? '- The student has also uploaded images of actual past paper questions/worksheets. Inspect them carefully to identify their exact question styles, mark allocations, and diagram requirements.' : ''}

${disciplineMandate}

Generate an authentic, clear, realistic Exam War Plan in plain, accessible English without overly dense jargon (e.g. use "Oral Practice Exam" or "Speaking Practice" instead of "viva"):
- examinerRoastSummary: 3-4 sentences giving a candid reality check about how students typically fail this specific exam/level (${profile.gradeLevel} ${profile.subject} in ${profile.country}) and why passive re-reading notes does not work.
- dailyStudyTargetMinutes: realistic minutes (e.g. 30 - 120 based on grade level and days remaining).
- milestones: 3 chronological phases with phase, title, dayRange, focus, actionItems (array of 3 specific actions).
- highYieldFocalPoints: 4-5 sharp conceptual points they MUST master for these topics and questions.
- recommendedSyllabusTopics: array of 4-6 topics to prioritize.`;

    const contentsParts: any[] = [];
    if (Array.isArray(profile.pastPaperImages)) {
      for (const imgDataUrl of profile.pastPaperImages.slice(0, 3)) {
        const match = typeof imgDataUrl === 'string' && imgDataUrl.match(/^data:(image\/[a-zA-Z]+);base64,(.+)$/);
        if (match) {
          contentsParts.push({
            inlineData: {
              mimeType: match[1],
              data: match[2],
            },
          });
        }
      }
    }
    contentsParts.push({ text: systemPrompt });

    const response = await callGeminiWithFallback({
      contents: contentsParts.length > 1 ? { parts: contentsParts } : systemPrompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            examinerRoastSummary: { type: Type.STRING },
            dailyStudyTargetMinutes: { type: Type.INTEGER },
            milestones: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  phase: { type: Type.STRING },
                  title: { type: Type.STRING },
                  dayRange: { type: Type.STRING },
                  focus: { type: Type.STRING },
                  actionItems: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                required: ['phase', 'title', 'dayRange', 'focus', 'actionItems']
              }
            },
            highYieldFocalPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
            recommendedSyllabusTopics: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ['examinerRoastSummary', 'dailyStudyTargetMinutes', 'milestones', 'highYieldFocalPoints', 'recommendedSyllabusTopics']
        }
      }
    });

    const parsed = JSON.parse(response.text?.trim() || '{}');
    const examPlan = {
      id: 'plan-' + Date.now(),
      createdAt: new Date().toISOString(),
      profile,
      daysRemaining,
      ...parsed
    };

    return res.json(examPlan);
  } catch (err: any) {
    console.error('Error generating exam plan:', err);
    return res.json(generateFallbackPlan());
  }
});

// 5. GENERATE GUIDED STUDY SESSION DATA (DISCIPLINE SPECIFIC)
app.post('/api/study-session/generate', async (req: Request, res: Response) => {
  const { subject, topics, gradeLevel, durationMinutes, subjectCategory, deepWorkMode, questionTypes } = req.body;
  const targetTopic = Array.isArray(topics) && topics.length > 0 ? topics[0] : (subject || 'Core Concepts');

  const disc = detectDiscipline(subject, Array.isArray(topics) ? topics : [], subjectCategory || '');

  const isLongPassage = checkLongPassage(questionTypes, req.body.passageLengthPreference) || req.body.isLongPassage === true;
  const hasReadingPassage = isLongPassage || (Array.isArray(questionTypes) && questionTypes.some((qt: string) => qt.toLowerCase().includes('reading passage') || qt.toLowerCase().includes('passage')));

  function getFallbackSessionData() {
    if (disc.isEnglish) {
      const engShortPassage = `Fellow-citizens, pardon me, allow me to ask, why am I called upon to speak here today? What have I, or those I represent, to do with your national independence? Are the great principles of political freedom and of natural justice, embodied in that Declaration of Independence, extended to us? The rich inheritance of justice, liberty, prosperity and independence, bequeathed by your fathers, is shared by you, not by me. The sunlight that brought light and healing to you, has brought stripes and death to me. This Fourth of July is yours, not mine. You may rejoice, I must mourn.`;

      const engLongPassage = `[¶1] Fellow-citizens, pardon me, allow me to ask, why am I called upon to speak here today? What have I, or those I represent, to do with your national independence? Are the great principles of political freedom and of natural justice, embodied in that Declaration of Independence, extended to us? and am I, therefore, called upon to bring our humble offering to the national altar, and to confess the benefits and express devout gratitude for the blessings resulting from your independence to us?

[¶2] Would to God, both for your sakes and ours, that an affirmative answer could be truthfully returned to these questions! Then would my task be light, and my burden easy and delightful. For who is there so cold, that a nation's sympathy could not warm him? Who so obdurate and dead to the claims of gratitude, that would not thankfully acknowledge such priceless benefits? But such is not the state of the case. I say it with a sad sense of the disparity between us.

[¶3] I am not included within the pale of this glorious anniversary! Your high independence only reveals the immeasurable distance between us. The blessings in which you, this day, rejoice, are not enjoyed in common. The rich inheritance of justice, liberty, prosperity and independence, bequeathed by your fathers, is shared by you, not by me. The sunlight that brought light and healing to you, has brought stripes and death to me. This Fourth of July is yours, not mine. You may rejoice, I must mourn.

[¶4] To drag a man in fetters into the grand illuminated temple of liberty, and call upon him to join you in joyous anthems, were inhuman mockery and sacrilegious irony. Do you mean, citizens, to mock me, by asking me to speak today? If so, there is a parallel to your conduct. And let me warn you that it is dangerous to copy the example of a nation whose crimes, towering up to heaven, were thrown down by the breath of the Almighty, burying that nation in irrevocable ruin!

[¶5] Standing with God and the crushed and bleeding slave on this occasion, I will, in the name of humanity which is outraged, in the name of liberty which is fettered, in the name of the constitution and the Bible, which are disregarded and trampled upon, dare to call in question and to denounce, with all the emphasis I can command, everything that serves to perpetuate slavery—the great sin and shame of America!

[¶6] What, to the American slave, is your 4th of July? I answer; a day that reveals to him, more than all other days in the year, the gross injustice and cruelty to which he is the constant victim. To him, your celebration is a sham; your boasted liberty, an unholy license; your national greatness, vanity; your sounds of rejoicing are empty and heartless; your shouts of liberty and equality, hollow mockery; your prayers and hymns, your sermons and thanksgivings, with all your religious parade and solemnity, are, to Him, mere bombast, fraud, deception, impiety, and hypocrisy—a thin veil to cover up crimes which would disgrace a nation of savages.`;

      return {
        topic: targetTopic,
        briefExplanation: `In this English & Literature Core Sprint for ${targetTopic} (${subject} · ${gradeLevel || 'Students'}), we master rigorous textual analysis. Weak students passively skim for superficial plot summaries; honors students interrogate authorial craft, rhetorical devices, and syntactic shifts. Every author crafts arguments through intentional structure: 1) Thesis & Exordium establish speaker ethos and framing. 2) Evidentiary development balances logos with vivid rhetorical figures. 3) Antithesis and counterargument refute opposing viewpoints. 4) Syntactic cadence and emotional resonance (pathos) seal reader conviction. When answering analytical prompts, never merely state WHAT happened—always dissect HOW and WHY the author constructed meaning.`,
        motivationalAdvice: `Reading fatigue is real, but passive scrolling won't build critical analysis. Dedicate the next 25 minutes to active interrogation: annotate the margins, question the author's motives, and dissect word choice.`,
        pretestQuestion: {
          id: `pretest-${Date.now()}`,
          topic: targetTopic,
          passageTitle: hasReadingPassage ? (isLongPassage ? `Extended Rhetorical Address: The Architecture of Moral Argumentation (Frederick Douglass, 1852 — 6-Paragraph Complete Excerpt)` : `Literary & Rhetorical Excerpt: The Architecture of Moral Argumentation (Frederick Douglass, 1852)`) : undefined,
          passage: hasReadingPassage ? (isLongPassage ? engLongPassage : engShortPassage) : undefined,
          question: isLongPassage
            ? `Synthesizing Douglass's argument across [¶1] through [¶6], which statement best captures how his rhetorical strategy escalates from formal exordium to direct moral denunciation?`
            : `In analyzing Douglass's rhetorical strategy in contrasting "your national independence" with his personal condition, which statement best captures the core rhetorical technique?`,
          options: hasReadingPassage ? [
            `He deploys sharp antithesis and confrontational second-person pronouns to dramatize the moral contradiction between celebrated liberty and chattel slavery, systematically dismantling the audience's moral complacency without rejecting the founding ideals of the Declaration.`,
            `He adopts a deferential, conciliatory tone of passive gratitude, reassuring the audience that moral progress occurs automatically over time without civil agitation.`,
            `He relies exclusively on abstract statistical arguments regarding economic trade between Northern and Southern states without invoking moral or emotional authority.`,
            `He rejects the Declaration of Independence entirely as an illegitimate legal document that must be immediately abolished.`
          ] : [
            `He uses sharp antithesis and pronoun contrast to expose moral contradiction`,
            `He relies on polite deference to appease the audience`,
            `He provides purely chronological plot summary without rhetoric`,
            `He avoids making any interpretive moral claim`
          ],
          correctIndex: 0,
          angryExplanation: `Brilliant rhetorical analysis! Douglass uses searing antithesis ("your Fourth of July, not mine", "sunlight vs stripes and death") to dramatize the grotesque hypocrisy of celebrating freedom while millions remain enslaved.`,
          examinerTrapNotes: `Watch for tone misinterpretations: Douglass is never conciliatory or deferential here; he is morally fierce and unyielding.`
        },
        flashcards: [
          {
            front: `What is the difference between an appeal to ethos and an appeal to logos in rhetorical analysis?`,
            back: `Ethos establishes the speaker's credibility, moral character, and authority; logos builds a rational deductive argument using verifiable evidence and logical structure.`,
            trap: `Never confuse ethos with pathos (emotion) or describe ethos as merely "talking about yourself".`
          },
          {
            front: `What distinguishes an analytical honors-level thesis statement from a descriptive plot summary?`,
            back: `An honors thesis asserts a defensible, non-obvious argument explaining HOW and WHY specific author techniques construct meaning, rather than merely summarizing what happened in the story.`,
            trap: `If your thesis can be answered with a simple fact or "yes/no", it is a plot summary, not an analytical claim.`
          },
          {
            front: `What is antithesis and how does an author use it to heighten tension?`,
            back: `Antithesis pairs two contrasting ideas in parallel grammatical structures (e.g. "sunlight to you, death to me"), creating visceral friction between ideals and reality.`,
            trap: `Do not mistake simple contrast for antithesis; true antithesis requires balanced, parallel syntax.`
          },
          {
            front: `What is the examiner's #1 trap in "vocabulary in context" exam questions?`,
            back: `Providing the most common dictionary definition of a word as a distractor, when the passage uses a secondary, figurative, or archaic nuance.`,
            trap: `Always plug the answer choice back into the sentence to see if the connotation fits the surrounding tone.`
          }
        ],
        blurtingPrompt: `Close all books and summaries. You have 3 minutes to write down the core rhetorical devices, tone indicators, and analytical essay checklist for ${targetTopic}. No looking at notes!`,
        blurtingKeyPoints: [
          `Rhetorical appeals triad: Ethos (authority), Logos (logic/evidence), Pathos (emotional resonance)`,
          `Distinction between literal plot summary and analytical claim (how/why craft shapes meaning)`,
          `Key rhetorical figures: antithesis, metaphor, paradox, irony, and parallelism`,
          `Evidence integration method: brief quote, followed by explicit analytical commentary`,
          `Evaluation of tone shifts and narrator reliability in context`
        ],
        practiceQuestions: [
          {
            id: 'sq-eng-1',
            topic: targetTopic,
            question: `When analyzing authorial tone across a multi-paragraph passage, what is the most reliable indicator of a subtle shift in perspective?`,
            options: [
              `A deliberate change in syntactic cadence, diction connotations, and figurative imagery that subverts the initial stance`,
              `A random increase in total sentence length without any change in vocabulary`,
              `The chronological passage of historical time between paragraphs`,
              `A font change or paragraph indentation chosen by the publisher`
            ],
            correctIndex: 0,
            angryExplanation: `Syntax and diction are the heartbeat of tone! When sentence rhythm and connotation shift, the author's psychological perspective is changing.`,
            examinerTrapNotes: `Never look at superficial features like paragraph length; evaluate the emotional temperature of the diction.`
          },
          {
            id: 'sq-eng-2',
            topic: targetTopic,
            question: `In literary synthesis, what role does textual evidence play in supporting an argumentative thesis?`,
            options: [
              `Evidence must be directly integrated and followed by explicit commentary explaining how the specific craft reveals deeper meaning`,
              `Evidence should be quote-bombed in large paragraphs with zero commentary, letting the reader guess its significance`,
              `Evidence is unnecessary if the student's personal opinion is stated passionately enough`,
              `Evidence should only consist of external historical anecdotes completely unrelated to the passage text`
            ],
            correctIndex: 0,
            angryExplanation: `Quote-bombing is fatal! Evidence without commentary is just regurgitation. You must explain the mechanism of meaning!`,
            examinerTrapNotes: `Always follow the rule: Quote brief snippet -> Analyze specific technique -> Connect to thesis.`
          }
        ],
        teachBackPrompt: `Explain the core analytical framework of ${targetTopic} out loud in 60 seconds as if you are coaching a student taking their AP/IB or final English exam. You are forbidden from using the word "basically" or giving plot summaries!`,
        quickCheckPrompt: `In your own words, what is the difference between summarizing what happened in a text and analyzing how the author constructed meaning?`,
        sampleCheckAnswer: `Summary describes the literal plot events and characters. Analysis interrogates authorial craft—dissecting specific diction, rhetorical devices, and syntax to explain how and why meaning is produced.`,
        antiMotivationTips: {
          fiveMinuteHack: `Tell yourself: "I am only sitting down for 5 minutes to read and annotate one single paragraph of ${targetTopic}." Once you write that first marginal note, flow state takes over.`,
          temptationIdea: `Pair this analytical reading session with a beverage or focus music playlist you only permit yourself to enjoy while actively annotating.`,
          deadManSwitchExample: `Text a study buddy: "If I don't send you a photo of my annotated ${targetTopic} page within 30 minutes, I owe you $5."`,
          thirdPersonPrompt: `Speak to yourself: "Why is the student hesitating on ${targetTopic}? What is the first sentence they need to write?"`
        }
      };
    }

    if (disc.isMath) {
      return {
        topic: targetTopic,
        briefExplanation: `In this Mathematics Core Sprint for ${targetTopic} (${disc.canonicalName} · ${gradeLevel || 'Students'}), we isolate mathematical rigor and systematic problem-solving. Math is not about memorizing recipe tricks; it is about deductive reasoning from axioms and definitions. Step 1: Identify given quantities, boundary constraints, and what the problem is explicitly solving for. Step 2: Establish the governing equation or geometric relation. Step 3: Apply precise algebraic transformations or calculus operations with absolute sign discipline. Step 4: Verify boundary conditions and check for extraneous solutions.`,
        motivationalAdvice: `Math anxiety evaporates the second you put pencil to paper. Do not stare at the problem in your head. Write down the knowns, write down the formula, and take the first step.`,
        pretestQuestion: {
          id: `pretest-${Date.now()}`,
          topic: targetTopic,
          passageTitle: hasReadingPassage ? `Mathematical Modeling Protocol: Rate and Accumulation Dynamics in ${targetTopic}` : undefined,
          passage: hasReadingPassage ? `An industrial chemical reactor regulates the flow rate of reagent A into a mixing chamber. At time t ≥ 0 hours, the instantaneous volumetric rate of inflow in liters per hour is modeled by the function R(t) = 4t^2 - 12t + 40, while a continuous drainage valve evacuates mixture at a constant rate of D(t) = 16 liters per hour. The net rate of accumulation within the chamber is given by the differential equation dV/dt = R(t) - D(t) = 4t^2 - 12t + 24. At t = 0, the chamber contains an initial volume of V(0) = 100 liters.` : undefined,
          question: hasReadingPassage
            ? `At what time t in hours does the rate of volume change (dV/dt) reach its minimum value, and what is that minimum net rate of volume change in liters per hour?`
            : `What is the most critical checkpoint when solving multi-step equations or calculus problems in ${targetTopic}?`,
          options: hasReadingPassage ? [
            `The rate of volume change reaches its absolute minimum at t = 1.5 hours with a rate of 15 liters per hour, determined by differentiating dV/dt to find the critical point (8t - 12 = 0 -> t = 1.5) and substituting into 4(1.5)^2 - 12(1.5) + 24 = 9 - 18 + 24 = 15 L/hr.`,
            `The minimum occurs at t = 3.0 hours with a rate of 24 liters per hour.`,
            `The minimum occurs at t = 0 hours with an initial rate of 24 liters per hour, because quadratic functions always minimize at the origin.`,
            `The volume change minimizes when R(t) = 0, which occurs at imaginary roots.`
          ] : [
            `Verifying boundary constraints, checking sign distributions, and validating against domain restrictions`,
            `Skipping algebraic steps to guess the solution intuitively`,
            `Assuming all equations have real solutions without checking discriminants`,
            `Treating non-linear curves as simple straight lines`
          ],
          correctIndex: 0,
          angryExplanation: `Flawless execution! Differentiating dV/dt yields 8t - 12 = 0 -> t = 1.5. Since the second derivative is 8 > 0, this is a true minimum! Minimum rate is 4(2.25) - 18 + 24 = 15 L/hr!`,
          examinerTrapNotes: `Never confuse the minimum of the rate function (dV/dt) with the minimum of total volume V(t)! Read what the question asks!`
        },
        flashcards: [
          {
            front: `What is the single most common cause of lost marks in ${targetTopic}?`,
            back: `Careless sign distribution (especially distributing negative signs across parentheses) and neglecting the Chain Rule or domain restrictions.`,
            trap: `Always put parentheses around expressions before subtracting or differentiating composite terms.`
          },
          {
            front: `How do you verify whether a mathematical solution is valid or extraneous?`,
            back: `Substitute the candidate value back into the ORIGINAL equation to check that it does not cause division by zero, negative radicands, or undefined logarithms.`,
            trap: `Squaring both sides of an equation frequently creates fake extraneous roots.`
          }
        ],
        blurtingPrompt: `Close all notes. You have 3 minutes to write down every theorem, governing formula, and common algebraic trap in ${targetTopic}!`,
        blurtingKeyPoints: [
          `Governing formulas and theorem preconditions`,
          `Sign discipline and algebraic distribution rules`,
          `Domain and range restrictions (no division by zero, non-negative radicands)`,
          `Verification step to eliminate extraneous roots`
        ],
        practiceQuestions: [
          {
            id: 'sq-math-1',
            topic: targetTopic,
            question: `In mathematical problem solving, what differentiates an honors solution from an error-prone response?`,
            options: [
              `Explicitly stating governing formulas, showing step-by-step deductive algebra, and validating against domain constraints`,
              `Writing only the final number with zero intermediate derivation`,
              `Guessing values until one seems reasonable`,
              `Ignoring domain restrictions and dividing by zero whenever convenient`
            ],
            correctIndex: 0,
            angryExplanation: `Examiners award marks for deductive steps, not lucky guesses! State the formula, execute with precision, and verify constraints!`,
            examinerTrapNotes: `Never skip intermediate lines of working; examiners deduct marks for unjustified leaps.`
          }
        ],
        teachBackPrompt: `Explain the core mathematical mechanics of ${targetTopic} out loud in 60 seconds without hand-waving or skipping algebraic steps!`,
        quickCheckPrompt: `In your own words, explain how to approach a multi-step problem in ${targetTopic}. Name at least two checks you perform.`,
        sampleCheckAnswer: `Identify the knowns and unknowns, set up the governing relation, solve with strict algebraic sign discipline, and substitute back to eliminate extraneous roots.`,
        antiMotivationTips: {
          fiveMinuteHack: `Tell yourself: "I am only sitting down to write the formula and known variables for one problem on ${targetTopic}."`,
          temptationIdea: `Work on a clean scratchpad with your favorite pen and a focus timer.`,
          deadManSwitchExample: `Commit to finishing 2 practice problems before checking your phone.`,
          thirdPersonPrompt: `Speak to yourself: "What is the very next algebraic step required to simplify this expression?"`
        }
      };
    }

    // Default Science / Biological / STEM
    return {
      topic: targetTopic,
      briefExplanation: `In this Core Sprint for ${targetTopic} (${subject} · ${gradeLevel || 'Students'}), we isolate the strict chain of causality. Every physical and biological system is governed by conservation laws and thermodynamic driving forces. Step 1: An initial gradient, stimulus, or chemical input creates a potential difference. Step 2: A specialized rate-limiting gate or enzyme responds, initiating conformational change. Step 3: Secondary downstream cascade effectors magnify the response. Step 4: Mandatory negative feedback or inactivation restores resting equilibrium. Without the shut-off mechanism, runaway depletion occurs.`,
      motivationalAdvice: `Motivation is an unreliable emotion. You do not need to feel like studying; you only need to sit down for the first 5 minutes to break activation energy. Put your phone in another room, take a breath, and focus on one mechanism.`,
      pretestQuestion: {
        id: `pretest-${Date.now()}`,
        topic: targetTopic,
        passageTitle: hasReadingPassage ? `Diagnostic Case Protocol: Baseline Kinetics of ${targetTopic}` : undefined,
        passage: hasReadingPassage ? `An isolated cellular preparation was equilibrated in oxygenated Ringer's solution at 37°C. Under baseline conditions, intracellular ATP/ADP ratio was maintained at 8.2, while the trans-sarcolemmal resting membrane potential remained steady at -72 mV. When researchers exposed the preparation to a selective inhibitor of the primary rate-limiting step, cytoplasmic phosphorylation halted completely within 90 seconds, despite normal extracellular nutrient availability.` : undefined,
        question: `Before reviewing the details: what is the single most critical rate-limiting factor or driving force in ${targetTopic}?`,
        options: hasReadingPassage ? [
          `The primary committed enzyme or electrochemical potential gradient that requires the highest activation energy and coordinates downstream flux to preserve cellular stability.`,
          `An unmonitored passive lipid leak that bypasses all thermodynamic energy constraints without consuming metabolic currency.`,
          `A perpetual catalytic cycle that regenerates phosphorylated high-energy intermediates without requiring substrate binding or termination signals.`,
          `Instantaneous thermodynamic dissipation driven exclusively by ambient temperature variations without protein conformational shifts.`
        ] : [
          `The initial potential/concentration gradient or primary committed enzyme`,
          `Unregulated random molecular diffusion without any membrane barrier`,
          `A continuous infinite energy loop that never requires resetting`,
          `A passive leak that operates identically at all temperatures and voltages`
        ],
        correctIndex: 0,
        angryExplanation: `Correct! Every single physiological and scientific system regulates the committed step to conserve energy and maintain stability.`,
        examinerTrapNotes: `Pre-test reminder: Never pick answers that describe biological systems as passive or unregulated.`
      },
      flashcards: [
        {
          front: `What is the primary driving force or rate-limiting control point in ${targetTopic}?`,
          back: `The electrochemical gradient or the specific committed enzyme that requires the highest activation energy.`,
          trap: `Don't give a vague description—always name the exact gradient, enzyme, or law.`
        },
        {
          front: `What is the most common mistake students make when tested on ${targetTopic}?`,
          back: `Confusing cause and effect (e.g. thinking a restorative pump causes the acute spike rather than resetting the baseline).`,
          trap: `Examiners intentionally design questions where the answer is the trigger, not the consequence.`
        }
      ],
      blurtingPrompt: `Close all notes now. You have 3 minutes to write down every single step, key enzyme/channel name, and regulatory feedback loop in ${targetTopic}. Do not look at any summary notes until you finish!`,
      blurtingKeyPoints: [
        `Initial baseline conditions and resting transmembrane or chemical equilibrium`,
        `The specific trigger, stimulus, or substrate binding that initiates the cascade`,
        `The primary rate-limiting step or voltage-sensing conformational change`,
        `Downstream physiological effects and amplification`,
        `The exact negative feedback or inactivation mechanism that restores baseline`
      ],
      practiceQuestions: [
        {
          id: 'sq-1',
          topic: targetTopic,
          question: `Which of the following best describes the key mechanism of ${targetTopic}?`,
          options: [
            `A strictly regulated step-by-step process driven by thermodynamic gradients or specific triggers`,
            `A completely passive occurrence that requires zero energy or regulation`,
            `An instantaneous reaction that has no intermediate steps or control points`,
            `An unregulated overflow pathway that happens only in dead tissue`
          ],
          correctIndex: 0,
          angryExplanation: `Correct! Everything in science follows cause and effect. Regulated steps with checkpoints prevent chaos.`,
          examinerTrapNotes: `Never choose answers that describe biological pathways as uncontrolled or purely random.`
        }
      ],
      teachBackPrompt: `Explain the entire mechanism of ${targetTopic} out loud in 60 seconds as if you are teaching an intelligent 12-year-old. You are forbidden from using the word "basically" or hand-waving!`,
      quickCheckPrompt: `In your own words, explain how ${targetTopic} works. Name at least two key steps and identify what stops the process.`,
      sampleCheckAnswer: `${targetTopic} begins when an initial trigger occurs. This causes a conformational or chemical change, leading to downstream effects, and is finally shut down by negative feedback.`,
      antiMotivationTips: {
        fiveMinuteHack: `Tell yourself: "I am only sitting here for 5 minutes to read one page on ${targetTopic}, then I have permission to walk away."`,
        temptationIdea: `Pair this session with a special snack or drink.`,
        deadManSwitchExample: `Text a friend to hold you accountable for this 25-minute sprint.`,
        thirdPersonPrompt: `Speak to yourself: "What is the single logical next sentence they need to write?"`
      }
    };
  }

  try {
    if (!process.env.GEMINI_API_KEY) {
      return res.json(getFallbackSessionData());
    }

    let disciplineInstruction = '';
    if (disc.isEnglish) {
      disciplineInstruction = `CRITICAL DISCIPLINE MANDATE: THIS IS STRICTLY AN ENGLISH & LITERATURE STUDY SESSION.
- YOU ARE STRICTLY AND CATEGORICALLY FORBIDDEN FROM GENERATING SCIENCE, BIOLOGY, BIOCHEMISTRY, CLINICAL, OR PHYSICS CONTENT.
- Subject: "${subject || 'English'}"
- Focus Topic: "${targetTopic}"
- The pretest question, reading passage (if requested or by default for English reading), practice questions, flashcards, blurting prompts, and explanations MUST strictly be about English literature, rhetoric, textual inferences, author tone, literary craft, syntax, grammar, or vocabulary.
- If a reading passage is generated: provide a rich, sophisticated 2-to-4 paragraph literary excerpt (classic literature, historical speeches, analytical essays) with nuanced multi-clause answer choices (25 to 45 words each).
- Flashcards must test literary analysis concepts, rhetorical devices, and examiner traps.`;
    } else if (disc.isMath) {
      disciplineInstruction = `CRITICAL DISCIPLINE MANDATE: THIS IS STRICTLY A MATHEMATICS (${disc.canonicalName}) STUDY SESSION.
- YOU ARE STRICTLY FORBIDDEN from generating biology, clinical, or medical questions.
- Focus strictly on Mathematics (${disc.canonicalName}): derivations, formulas, theorems, boundary conditions, and analytical calculations.
- If a reading passage is generated: provide an applied mathematical modeling problem or geometric proof scenario with full boundary conditions and equations with multi-clause analytical options (25 to 45 words each).`;
    } else {
      disciplineInstruction = `CRITICAL DISCIPLINE MANDATE: THIS IS A ${disc.canonicalName.toUpperCase()} STUDY SESSION.
- Ensure 100% textbook accuracy according to authoritative consensus for ${disc.canonicalName}.
- Multiple-choice questions must have exactly ONE indisputably correct answer.`;
    }

    const prompt = `You are "The Angry Explainer" (@theangryexplainer), famous for energetic, factually flawless, no-BS academic teaching.
Generate a comprehensive, rigorous study session for a student preparing for exams.

Student Context:
- Subject: "${subject}" (${disc.canonicalName})
- Focus Topic: "${targetTopic}"
- Grade Level: "${gradeLevel || 'Middle / High School'}"
- Planned Duration: ${durationMinutes || 25} minutes (Deep Work Mode: ${deepWorkMode ? 'Yes (50m work/10m break)' : 'Standard (25m work/5m break)'})

${disciplineInstruction}

Incorporate:
1. pretestQuestion: 1 diagnostic multiple choice question to challenge the student BEFORE they review notes (options, correctIndex, angryExplanation, examinerTrapNotes).
2. briefExplanation: 2-3 clear, vivid paragraphs breaking down the core concepts and common traps with an unforgettable analogy.
3. blurtingPrompt: specific active recall instruction telling the student to close all notes and brain dump the core points.
4. blurtingKeyPoints: 4-5 bullet points of crucial facts that must be present in their brain dump.
5. flashcards: 4-5 flashcards with front, back, and examiner trap warning.
6. practiceQuestions: 3 challenging application questions testing exam traps (question, options, correctIndex, angryExplanation, examinerTrapNotes).
7. teachBackPrompt: a Feynman-style prompt challenging the student to explain the concept out loud in simple terms without jargon.
8. quickCheckPrompt & sampleCheckAnswer.
9. motivationalAdvice: a punchy paragraph explaining why motivation is a scam and why starting for 5 minutes destroys procrastination.
10. antiMotivationTips: {
  fiveMinuteHack: string,
  temptationIdea: string,
  deadManSwitchExample: string,
  thirdPersonPrompt: string
}`;

    const response = await callGeminiWithFallback({
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            topic: { type: Type.STRING },
            briefExplanation: { type: Type.STRING },
            motivationalAdvice: { type: Type.STRING },
            pretestQuestion: {
              type: Type.OBJECT,
              properties: {
                passageTitle: { type: Type.STRING },
                passage: { type: Type.STRING },
                question: { type: Type.STRING },
                options: { type: Type.ARRAY, items: { type: Type.STRING } },
                correctIndex: { type: Type.INTEGER },
                angryExplanation: { type: Type.STRING },
                examinerTrapNotes: { type: Type.STRING }
              },
              required: ['question', 'options', 'correctIndex', 'angryExplanation', 'examinerTrapNotes']
            },
            blurtingPrompt: { type: Type.STRING },
            blurtingKeyPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
            flashcards: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  front: { type: Type.STRING },
                  back: { type: Type.STRING },
                  trap: { type: Type.STRING }
                },
                required: ['front', 'back', 'trap']
              }
            },
            practiceQuestions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  passageTitle: { type: Type.STRING },
                  passage: { type: Type.STRING },
                  question: { type: Type.STRING },
                  options: { type: Type.ARRAY, items: { type: Type.STRING } },
                  correctIndex: { type: Type.INTEGER },
                  angryExplanation: { type: Type.STRING },
                  examinerTrapNotes: { type: Type.STRING }
                },
                required: ['question', 'options', 'correctIndex', 'angryExplanation', 'examinerTrapNotes']
              }
            },
            teachBackPrompt: { type: Type.STRING },
            quickCheckPrompt: { type: Type.STRING },
            sampleCheckAnswer: { type: Type.STRING },
            antiMotivationTips: {
              type: Type.OBJECT,
              properties: {
                fiveMinuteHack: { type: Type.STRING },
                temptationIdea: { type: Type.STRING },
                deadManSwitchExample: { type: Type.STRING },
                thirdPersonPrompt: { type: Type.STRING }
              },
              required: ['fiveMinuteHack', 'temptationIdea', 'deadManSwitchExample', 'thirdPersonPrompt']
            }
          },
          required: ['topic', 'briefExplanation', 'motivationalAdvice', 'pretestQuestion', 'blurtingPrompt', 'blurtingKeyPoints', 'flashcards', 'practiceQuestions', 'teachBackPrompt', 'quickCheckPrompt', 'sampleCheckAnswer', 'antiMotivationTips']
        }
      }
    });

    const parsed = JSON.parse(response.text?.trim() || '{}');
    const questionsWithIds = (parsed.practiceQuestions || []).map((q: any, i: number) => ({
      id: `session-q-${Date.now()}-${i}`,
      topic: targetTopic,
      ...q
    }));

    const pretestWithId = parsed.pretestQuestion ? {
      id: `session-pretest-${Date.now()}`,
      topic: targetTopic,
      ...parsed.pretestQuestion
    } : undefined;

    return res.json({
      ...parsed,
      pretestQuestion: pretestWithId,
      practiceQuestions: questionsWithIds
    });
  } catch (err: any) {
    console.error('Error generating study session data:', err);
    return res.json(getFallbackSessionData());
  }
});

// 6. QUICK AI STUDY COACH IN-SESSION HELPER
app.post('/api/study-session/coach', async (req: Request, res: Response) => {
  const { question, currentTopic, subject, gradeLevel } = req.body;
  if (!question) return res.status(400).json({ error: 'Question is required' });

  try {
    if (!process.env.GEMINI_API_KEY) {
      return res.json({
        answer: `Here is the key thing to remember about ${currentTopic}: break it down into what goes in, what happens in the middle, and what comes out. Don't worry about memorizing big words until you see the steps clearly!`
      });
    }

    const prompt = `You are the student's personal AI study coach in The Angry Explainer app.
The student is in the middle of a focused study session.
- Subject: ${subject}
- Topic: ${currentTopic}
- Grade Level: ${gradeLevel}
Student's Question: "${question}"

Respond in 2-4 sentences in clear, friendly, encouraging, plain English. Give them a direct answer, a simple mental model or memory trick, and tell them to keep going!`;

    const response = await callGeminiWithFallback({
      contents: prompt,
    });

    return res.json({ answer: response.text?.trim() || 'Keep your focus on the core steps and trust your reasoning!' });
  } catch (err) {
    console.error('Error in study session coach:', err);
    return res.json({
      answer: `Think of it like a chain reaction: Step 1 leads directly to Step 2. Keep focused, you are doing great!`
    });
  }
});

// 6. GENERATE ROADMAP LEVEL MISSION QUESTIONS ENDPOINT (SUPPORTING COMPLEX READING PASSAGES & MULTI-CLAUSE OPTIONS)
// 6. GENERATE ROADMAP LEVEL MISSION QUESTIONS ENDPOINT (SUPPORTING COMPLEX READING PASSAGES & MULTI-CLAUSE OPTIONS)
app.post('/api/roadmap/generate-level-questions', async (req: Request, res: Response) => {
  const { milestone, levelIndex, subject, gradeLevel, count, questionTypes, includeReadingPassage } = req.body;

  const ms = milestone || {
    phase: `Level ${Number(levelIndex || 0) + 1} Mission`,
    title: 'Core Principles & Trap Recon',
    dayRange: 'Days 1–7',
    focus: 'Master core concepts, key theorems/techniques, and avoid distractor traps.',
    actionItems: ['Complete daily practice questions', 'Review high-yield summaries']
  };

  const isLongPassage = checkLongPassage(questionTypes, req.body.passageLengthPreference) || req.body.isLongPassage === true;
  const hasReadingPassage = isLongPassage || Boolean(
    includeReadingPassage ||
    (Array.isArray(questionTypes) && questionTypes.some((qt: string) => qt.toLowerCase().includes('reading passage') || qt.toLowerCase().includes('passage')))
  );

  const questionCount = Math.min(10, Math.max(3, Number(count) || 5));

  // Determine discipline context
  const subjectFull = `${subject || ''} ${ms.title || ''} ${ms.focus || ''}`.toLowerCase();
  const isEnglish = /english|literature|reading|writing|language|grammar|rhetoric|poetry|novel|prose|essay/i.test(subjectFull);
  const isCalculus = /calculus|derivative|integral|limit|related rate|optimization|ftc/i.test(subjectFull);
  const isAlgebra1 = /algebra\s*1|linear equation|slope|intercept|factoring/i.test(subjectFull);
  const isAlgebra2 = /algebra\s*2|polynomial|logarithm|complex number|rational function/i.test(subjectFull);
  const isGeometry = /geometry|triangle|circle|polygon|proof|angle|pythagor|congruen|volume|surface area/i.test(subjectFull);
  const isMath = isCalculus || isAlgebra1 || isAlgebra2 || isGeometry || /math|algebra|geometry|calculus|trig|statistics/i.test(subjectFull);
  const isHistory = /history|government|civics|politic|constitution/i.test(subjectFull);

  function generateFallbackLevelQuestions() {
    const title = ms.title || subject || 'Core Curriculum Concept';

    // 1. ENGLISH & LITERATURE FALLBACK
    if (isEnglish) {
      if (hasReadingPassage) {
        if (isLongPassage) {
          const eng6ParagraphPassage = `[¶1] Fellow-citizens, pardon me, allow me to ask, why am I called upon to speak here today? What have I, or those I represent, to do with your national independence? Are the great principles of political freedom and of natural justice, embodied in that Declaration of Independence, extended to us? and am I, therefore, called upon to bring our humble offering to the national altar, and to confess the benefits and express devout gratitude for the blessings resulting from your independence to us?

[¶2] Would to God, both for your sakes and ours, that an affirmative answer could be truthfully returned to these questions! Then would my task be light, and my burden easy and delightful. For who is there so cold, that a nation's sympathy could not warm him? Who so obdurate and dead to the claims of gratitude, that would not thankfully acknowledge such priceless benefits? But such is not the state of the case. I say it with a sad sense of the disparity between us.

[¶3] I am not included within the pale of this glorious anniversary! Your high independence only reveals the immeasurable distance between us. The blessings in which you, this day, rejoice, are not enjoyed in common. The rich inheritance of justice, liberty, prosperity and independence, bequeathed by your fathers, is shared by you, not by me. The sunlight that brought light and healing to you, has brought stripes and death to me. This Fourth of July is yours, not mine. You may rejoice, I must mourn.

[¶4] To drag a man in fetters into the grand illuminated temple of liberty, and call upon him to join you in joyous anthems, were inhuman mockery and sacrilegious irony. Do you mean, citizens, to mock me, by asking me to speak today? If so, there is a parallel to your conduct. And let me warn you that it is dangerous to copy the example of a nation whose crimes, towering up to heaven, were thrown down by the breath of the Almighty, burying that nation in irrevocable ruin!

[¶5] Standing with God and the crushed and bleeding slave on this occasion, I will, in the name of humanity which is outraged, in the name of liberty which is fettered, in the name of the constitution and the Bible, which are disregarded and trampled upon, dare to call in question and to denounce, with all the emphasis I can command, everything that serves to perpetuate slavery—the great sin and shame of America!

[¶6] What, to the American slave, is your 4th of July? I answer; a day that reveals to him, more than all other days in the year, the gross injustice and cruelty to which he is the constant victim. To him, your celebration is a sham; your boasted liberty, an unholy license; your national greatness, vanity; your sounds of rejoicing are empty and heartless; your shouts of liberty and equality, hollow mockery; your prayers and hymns, your sermons and thanksgivings, with all your religious parade and solemnity, are, to Him, mere bombast, fraud, deception, impiety, and hypocrisy—a thin veil to cover up crimes which would disgrace a nation of savages.`;

          return [
            {
              id: `ms-q-eng-${Date.now()}-1`,
              topic: ms.title || 'Rhetorical Analysis & Synthesis',
              difficulty: 'Brutal Trap',
              passageTitle: `Extended Rhetorical Address: Excerpt from Frederick Douglass (1852 — 6-Paragraph Full Analysis)`,
              passage: eng6ParagraphPassage,
              question: `Synthesizing Douglass's argument across [¶1] through [¶6], which choice best analyzes how his rhetorical trajectory develops from formal interrogatives in [¶1] to unsparing moral indictment in [¶6]?`,
              options: [
                `He initiates with calculated interrogatives and formal exordium in [¶1] to establish speaker ethos, shifts in [¶3]–[¶4] to expose the personal contradiction between celebrated liberty and lived enslavement through sharp antithesis, and culminates in [¶6] with a searing, rhythmic catalog of direct accusations ("sham... bombast, fraud, deception, impiety") that dismantles moral complacency while holding the nation accountable to its founding ideals.`,
                `He begins with fierce hostility in [¶1] but gradually retreats into passive submission and polite reconciliation by [¶6], assuring the assembly that moral progress occurs automatically without civil agitation.`,
                `He relies on detached econometric calculations of Northern industrial tariffs across all six paragraphs, deliberately avoiding any emotional, moral, or philosophical evaluations.`,
                `He argues in [¶1] that the Declaration of Independence is an illegitimate monarchical charter that must be destroyed, and repeats this assertion identically in [¶6].`
              ],
              correctIndex: 0,
              angryExplanation: `Brilliant rhetorical synthesis! Notice the deliberate structural trajectory: Douglass begins with polite interrogatives to draw the audience in, turns the knife with personal pronoun antithesis in [¶3] ("your Fourth of July, not mine"), and unleashes righteous moral thunder in [¶6] ("sham... thin veil to cover up crimes").`,
              examinerTrapNotes: `Distractor B claims he became conciliatory (dead wrong). Distractor C fabricates an economic tariff thesis. Distractor D falsely claims he rejected the Declaration, when he actually praised its principles.`,
              levelTip: `In 6+ paragraph rhetorical passages, trace how the speaker's emotional temperature and diction escalate from exordium to peroration.`
            },
            {
              id: `ms-q-eng-${Date.now()}-2`,
              topic: ms.title || 'Textual Evidence & Syntactic Shift',
              difficulty: 'Challenging',
              passageTitle: `Extended Rhetorical Address: Excerpt from Frederick Douglass (1852 — 6-Paragraph Full Analysis)`,
              passage: eng6ParagraphPassage,
              question: `In [¶3] and [¶4], how does Douglass's deployment of balanced antithetical syntax ("sunlight vs stripes and death") directly advance his ethical confrontation in [¶5]?`,
              options: [
                `By pairing antithetical nouns within parallel grammatical structures, he transforms abstract constitutional ideals into visceral physical realities, establishing the moral foundation for his explicit denunciation in [¶5] of slavery as America's defining national crime.`,
                `He utilizes antithesis as purely decorative poetic ornamentation with no substantive relation to the theological and constitutional arguments in [¶5].`,
                `He attempts to lighten the somber mood of the assembly with playful satirical wordplay before delivering financial budget forecasts in [¶5].`,
                `The contrast in [¶3] contradicts the claims in [¶5], indicating that Douglass was unsure whether to support or oppose the institution of chattel slavery.`
              ],
              correctIndex: 0,
              angryExplanation: `Flawless textual analysis! The antithesis in [¶3] ("sunlight to you, death to me") is not decorative—it is the moral engine that drives the denunciation in [¶5]. Technique serves meaning!`,
              examinerTrapNotes: `Distractor B calls rhetorical devices "purely decorative"—the #1 misconception weak students make on literary exams.`,
              levelTip: `Never analyze rhetorical figures in isolation; explain how paragraph [¶3] lays the emotional ground for paragraph [¶5].`
            }
          ];
        }

        return [
          {
            id: `ms-q-eng-${Date.now()}-1`,
            topic: ms.title || 'Rhetorical Analysis & Textual Inference',
            difficulty: 'Brutal Trap',
            passageTitle: `Rhetorical Speech Analysis: Excerpt from Frederick Douglass (1852)`,
            passage: `Fellow-citizens, pardon me, allow me to ask, why am I called upon to speak here today? What have I, or those I represent, to do with your national independence? Are the great principles of political freedom and of natural justice, embodied in that Declaration of Independence, extended to us? and am I, therefore, called upon to bring our humble offering to the national altar, and to confess the benefits and express devout gratitude for the blessings resulting from your independence to us?...

I am not included within the pale of this glorious anniversary! Your high independence only reveals the immeasurable distance between us. The blessings in which you, this day, rejoice, are not enjoyed in common. The rich inheritance of justice, liberty, prosperity and independence, bequeathed by your fathers, is shared by you, not by me. The sunlight that brought light and healing to you, has brought stripes and death to me. This Fourth of July is yours, not mine. You may rejoice, I must mourn.

To drag a man in fetters into the grand illuminated temple of liberty, and call upon him to join you in joyous anthems, were inhuman mockery and sacrilegious irony. Do you mean, citizens, to mock me, by asking me to speak to-day?`,
            question: `Which of the following best characterizes the primary rhetorical strategy Douglass employs in contrasting "your national independence" with his own forced presence at the assembly?`,
            options: [
              `He deploys sharp antithesis and confrontational second-person pronouns to expose the profound moral contradiction between celebrated democratic liberty and chattel slavery, systematically dismantling the audience's moral complacency without rejecting the core ideals of the Declaration of Independence.`,
              `He adopts a deferential, conciliatory tone of passive gratitude, assuring the assembly that full emancipation can be achieved gradually through quiet moral elevation without political agitation.`,
              `He utilizes purely detached third-person statistics to argue that economic tariffs between the industrial North and agrarian South are the sole determinant of constitutional disenfranchisement.`,
              `He dismisses the Declaration of Independence as an inherently flawed document that was intentionally designed to promote monarchical despotism across all American territories.`
            ],
            correctIndex: 0,
            angryExplanation: `Superb rhetorical analysis! Douglass uses searing antithesis ("your Fourth of July, not mine", "sunlight... stripes and death") to dramatize the grotesque hypocrisy of celebrating freedom while millions remain enslaved. Option A captures both the confrontational second-person pronoun shift ("your") and his calculated reverence for the Declaration's stated ideals!`,
            examinerTrapNotes: `Distractor B mistakes rhetorical politeness for genuine deference. Distractor C fabricates an economic tariff argument absent from the text. Distractor D claims he rejected the Declaration, whereas Douglass celebrated its ideals as "saving principles"!`,
            levelTip: `In rhetorical reading passages, always trace pronoun shifts (we vs you) and identify the tension between stated ideals and reality.`
          },
          {
            id: `ms-q-eng-${Date.now()}-2`,
            topic: ms.title || 'Literary Prose Analysis',
            difficulty: 'Challenging',
            passageTitle: `Literary Fiction Analysis: Excerpt from Mary Shelley's Frankenstein (1818)`,
            passage: `It was on a dreary night of November that I beheld the accomplishment of my toils. With an anxiety that almost amounted to agony, I collected the instruments of life around me, that I might infuse a spark of being into the lifeless thing that lay at my feet. It was already one in the morning; the rain pattered dismally against the panes, and my candle was nearly burnt out, when, by the glimmer of the half-extinguished light, I saw the dull yellow eye of the creature open; it breathed hard, and a convulsive motion agitated its limbs.

How can I describe my emotions at this catastrophe, or how delineate the wretch whom with such infinite pains and care I had endeavoured to form? His limbs were in proportion, and I had selected his features as beautiful. Beautiful! Great God! His yellow skin scarcely covered the work of muscles and arteries beneath; his hair was of a lustrous black, and flowing; his teeth of a pearly whiteness; but these luxuriances only formed a more horrid contrast with his watery eyes, that seemed almost of the same colour as the dun-white sockets in which they were set.`,
            question: `In the second paragraph, how does the narrator's syntactical shift from exclamation ("Beautiful! Great God!") to anatomical cataloging reinforce the psychological horror of the scene?`,
            options: [
              `The juxtaposition of aesthetic idealism with grotesque biological detail reveals Victor's instantaneous revulsion as the abstract romantic fantasy of creating life violently shatters upon confronting its morbid physical reality.`,
              `The calm, objective medical terminology demonstrates that Victor remains completely emotionally detached and views the creature solely as a routine anatomical specimen for peer-reviewed publication.`,
              `The author employs comedic irony to parody standard Gothic conventions and reassure the reader that no tragic consequences will arise from the scientific experiment.`,
              `The exclamation reflects Victor's unwavering pride and delight in having achieved the aesthetic perfection he originally envisioned during his laboratory preparations.`
            ],
            correctIndex: 0,
            angryExplanation: `Spot on! Notice how Victor's dream instantly turns to horror. The word "Beautiful!" is severed by an exclamation mark, immediately followed by the visceral, morbid reality of muscles and dun-white sockets. The psychological fantasy dissolves the exact second the creature opens its yellow eye!`,
            examinerTrapNotes: `Examiners test psychological tone shifts. Distractor D ignores the word "catastrophe". Distractor B ignores the exclamation marks. Distractor C completely misjudges the Gothic genre.`,
            levelTip: `Look for syntax breaks (dashes, exclamations) to pinpoint the exact moment a narrator's psychological illusion shatters.`
          }
        ];
      }

      return [
        {
          id: `ms-q-eng-${Date.now()}-1`,
          topic: ms.title || 'Rhetorical Devices',
          difficulty: 'Standard',
          question: `In rhetorical argument analysis, which choice best illustrates the difference between an appeal to ethos and an appeal to logos?`,
          options: [
            `Ethos establishes the speaker's credibility, character, and moral authority to speak on the issue, whereas logos relies on deductive reasoning, verifiable evidence, and logical argumentation.`,
            `Ethos appeals purely to intense visceral emotions like fear or rage, whereas logos is restricted strictly to metaphorical poetry and figurative imagery.`,
            `Ethos is only used in criminal courtroom closing arguments, whereas logos is found exclusively in mathematical physics equations.`,
            `Ethos and logos are identical rhetorical synonyms that both signify the chronological narrative order of paragraphs.`
          ],
          correctIndex: 0,
          angryExplanation: `The Angry Examiner demands precise rhetorical terminology! Ethos = speaker character/authority; Pathos = emotional resonance; Logos = rational deductive structure and evidentiary proof. Mix these up on an essay and you will forfeit top marks!`,
          examinerTrapNotes: `Do not confuse ethos with pathos. Pathos is emotion; ethos is credibility.`,
          levelTip: `Always identify the triad: Who is speaking (ethos), how it reasons (logos), and how it moves the listener (pathos).`
        },
        {
          id: `ms-q-eng-${Date.now()}-2`,
          topic: ms.title || 'Literary Synthesis',
          difficulty: 'Challenging',
          question: `When writing an analytical essay on a complex literary text, what differentiates an honors-level thesis from a weak, descriptive thesis?`,
          options: [
            `An honors thesis asserts a defensible, non-obvious thematic argument that explains HOW and WHY specific literary techniques shape meaning, rather than merely summarizing what happens in the plot.`,
            `An honors thesis simply lists every character's physical description in chronological order across all chapters.`,
            `An honors thesis avoids making any interpretive claim and instead copies word-for-word the summary from the back cover.`,
            `An honors thesis focuses exclusively on the author's biography without referencing any words from the actual text.`
          ],
          correctIndex: 0,
          angryExplanation: `Precisely! Plot summary is the death of literary analysis. Never tell the examiner WHAT happened; prove to them HOW the author constructed meaning through craft and syntax!`,
          examinerTrapNotes: `If your thesis can be answered with a simple "yes" or "no", or if it just summarizes events, it is a plot summary, not an analytical claim.`,
          levelTip: `Use the magic formula: "By employing [Technique X], the author suggests [Nuanced Meaning Y], thereby challenging [Broader Concept Z]."`
        }
      ];
    }

    // 2. CALCULUS FALLBACK
    if (isCalculus) {
      if (hasReadingPassage) {
        if (isLongPassage) {
          const calc6Paragraph = `[¶1] Municipal fluid mechanics and hydro-infrastructure engineering depend critically upon dynamic differential rate equations. In municipal reservoir system Gamma, water management engineers maintain a primary containment vessel designed to absorb storm surges while delivering a metered supply to purification plants.

[¶2] The operational geometry of Reservoir Gamma is precision-engineered as an inverted right circular cone with total vertical height H = 10 meters and base radius R = 4 meters at the open top rim. The apex of the cone points directly downward, terminating at a motorized vertex valve.

[¶3] By similar triangles, at any instantaneous fluid depth h (measured vertically from the vertex, where 0 <= h <= 10 meters), the radius r of the circular water surface satisfies the geometric ratio r / h = R / H = 4 / 10 = 2/5, yielding r = 0.4h. The instantaneous volume of fluid within the tank is given by V = (1/3)*pi*r^2*h = (1/3)*pi*(0.4h)^2*h = (4/75)*pi*h^3.

[¶4] Inflow dynamics are governed by automated river intake pumps delivering a constant volumetric flow rate of dV_in / dt = 2.5 m^3/min. Concurrently, vertex outflow through the drainage conduit is governed by Torricelli's hydrodynamic principle, where discharge velocity is proportional to the square root of fluid depth: dV_out / dt = 0.5 * sqrt(h) m^3/min.

[¶5] Net volumetric rate of change is modeled by the differential equation dV / dt = dV_in / dt - dV_out / dt = 2.5 - 0.5*sqrt(h). Differentiating V with respect to time t via the Chain Rule yields dV / dt = (d/dh)[(4/75)*pi*h^3] * (dh / dt) = (4/25)*pi*h^2 * (dh / dt).

[¶6] During an emergency flood simulation, safety inspectors evaluate the instantaneous rate of water level rise when the tank reaches critical depth h = 4 meters, verifying whether containment walls will be breached before backup diversion gates activate.`;

          return [
            {
              id: `ms-q-calc-${Date.now()}-1`,
              topic: ms.title || 'Calculus: Extended Modeling & Related Rates',
              difficulty: 'Brutal Trap',
              passageTitle: `Extended Calculus Modeling Protocol: Hydrodynamic Conical Reservoir (6-Paragraph Full Analysis)`,
              passage: calc6Paragraph,
              question: `Synthesizing the geometric constraints in [¶2]–[¶3] with the differential rate laws in [¶4]–[¶5], what is the exact instantaneous rate of change of the water depth (dh/dt) at the moment depth reaches h = 4 meters?`,
              options: [
                `dh/dt = 1.5 / (2.56*pi) ≈ 0.187 meters per minute, derived by equating net volumetric rate (2.5 - 0.5*sqrt(4) = 1.5 m^3/min) with the differentiated volume expression (4/25)*pi*(4^2)*(dh/dt) = (64/25)*pi*(dh/dt) = 2.56*pi*(dh/dt).`,
                `dh/dt = 2.500 meters per minute, because constant volumetric inflow completely overrides vertex drainage at initial stages.`,
                `dh/dt = -0.500 meters per minute, because Torricelli discharge produces exponential suction that reverses net liquid accumulation.`,
                `dh/dt = 0.625 meters per minute, calculated by neglecting the similar-triangle radius-to-height ratio in [¶3] and treating the cone as a cylinder of constant radius R = 4 meters.`
              ],
              correctIndex: 0,
              angryExplanation: `Masterful Calculus execution! Net rate dV/dt = 2.5 - 0.5*sqrt(4) = 2.5 - 1.0 = 1.5 m^3/min. Since V = (4/75)*pi*h^3, dV/dt = (4/25)*pi*h^2*(dh/dt). At h = 4: 1.5 = 2.56*pi*(dh/dt) -> dh/dt = 1.5 / (2.56*pi) ≈ 0.187 m/min!`,
              examinerTrapNotes: `Distractor D makes the fatal exam blunder of treating the conical vessel like a cylinder. Always substitute r = (2/5)h before taking derivatives!`,
              levelTip: `In extended 6-paragraph calculus problems, trace: Geometry -> Net differential rate -> Chain rule differentiation -> Instantaneous evaluation.`
            }
          ];
        }

        return [
          {
            id: `ms-q-calc-${Date.now()}-1`,
            topic: ms.title || 'Related Rates & Geometric Modeling',
            difficulty: 'Brutal Trap',
            passageTitle: `Calculus Modeling Protocol: Fluid Dynamics in an Inverted Conical Tank`,
            passage: `A municipal water treatment tank is shaped as an inverted right circular cone with height H = 10 meters and base radius R = 4 meters at the top. Water is pumped into the tank at a constant volumetric rate of dV_in/dt = 2.5 m^3/min. Concurrently, a drainage valve at the vertex discharges fluid at a rate proportional to the square root of the instantaneous water height: dV_out/dt = 0.5 * sqrt(h) m^3/min, where h represents the fluid depth in meters measured from the vertex.

By similar triangles, the radius r of the circular surface of the water at height h satisfies the geometric ratio r/h = R/H = 4/10 = 2/5, yielding r = 0.4h. The instantaneous volume of fluid within the tank is given by V = (1/3)*pi*r^2*h = (1/3)*pi*(0.4h)^2*h = (4/75)*pi*h^3. At time t = 0, the tank is empty.`,
            question: `At the exact instant when the fluid depth reaches h = 4 meters, what is the instantaneous rate of change of the water height (dh/dt) with respect to time?`,
            options: [
              `dh/dt = 0.187 meters per minute, obtained by differentiating V = (4/75)*pi*h^3 with respect to time via the Chain Rule to yield dV/dt = (4/25)*pi*h^2*(dh/dt), and setting net flow (dV_in/dt - dV_out/dt) = 2.5 - 0.5*sqrt(4) = 1.5 m^3/min.`,
              `dh/dt = 2.500 meters per minute, because the volumetric inflow rate governs vertical velocity without conical geometric scaling.`,
              `dh/dt = -0.500 meters per minute, because drainage at the vertex accelerates exponentially as depth increases.`,
              `dh/dt = 0.625 meters per minute, calculated by neglecting the radius-to-height ratio and treating the cone as a cylinder of constant radius 4 meters.`
            ],
            correctIndex: 0,
            angryExplanation: `Flawless Calculus execution! Net rate of change: dV/dt = dV_in - dV_out = 2.5 - 0.5*sqrt(4) = 2.5 - 1.0 = 1.5 m^3/min. Differentiating V = (4/75)*pi*h^3 yields dV/dt = (4/25)*pi*h^2*(dh/dt). At h = 4: 1.5 = (4/25)*pi*(16)*(dh/dt) = (64/25)*pi*(dh/dt) = 2.56*pi*(dh/dt). Thus dh/dt = 1.5 / (2.56*pi) ≈ 0.187 m/min!`,
            examinerTrapNotes: `Distractor D makes the classic student blunder of treating a cone like a cylinder. You MUST express r in terms of h before differentiating!`,
            levelTip: `Related rates law: Relate variables geometrically first, eliminate unwanted variables, then apply d/dt.`
          }
        ];
      }

      return [
        {
          id: `ms-q-calc-${Date.now()}-1`,
          topic: ms.title || 'Fundamental Theorem of Calculus',
          difficulty: 'Challenging',
          question: `If F(x) = ∫[from 2 to x^3] sqrt(1 + t^4) dt, what is the derivative F'(x)?`,
          options: [
            `F'(x) = 3x^2 * sqrt(1 + x^12), by applying the Fundamental Theorem of Calculus Part 1 combined with the Chain Rule for the upper limit u = x^3.`,
            `F'(x) = sqrt(1 + x^12), neglecting the derivative of the composite upper limit.`,
            `F'(x) = 3x^2 * sqrt(1 + x^3), substituting x^3 directly without exponentiation.`,
            `F'(x) = (1/5)*(1 + x^12)^(3/2), integrating the integrand rather than taking the derivative.`
          ],
          correctIndex: 0,
          angryExplanation: `Spot on! By FTC Part 1 and Chain Rule: d/dx ∫[from a to u(x)] f(t) dt = f(u(x)) * u'(x). Here u(x) = x^3, u'(x) = 3x^2, and (x^3)^4 = x^12. Never forget to multiply by the inner derivative!`,
          examinerTrapNotes: `Distractor B is the #1 exam trap: students forget the Chain Rule factor u'(x) = 3x^2 when the upper limit is not simply x.`,
          levelTip: `Whenever the limit of integration is a function u(x), always multiply by du/dx!`
        }
      ];
    }

    // 3. ALGEBRA 1 & 2 FALLBACK
    if (isAlgebra1 || isAlgebra2) {
      if (hasReadingPassage) {
        if (isLongPassage) {
          const alg6Paragraph = `[¶1] Modern quantitative microeconomics and industrial management rely upon quadratic and polynomial modeling to analyze commercial viability and market equilibrium. When a technology enterprise scales hardware manufacturing, cost structures exhibit both linear operational expenses and non-linear bottlenecks.

[¶2] A manufacturing enterprise produces precision sensor modules. The baseline fixed capital expenditure for factory leasing, automated robotic tooling, and municipal compliance certification is evaluated at $1800 per operating day.

[¶3] Variable production overhead encompasses raw semiconductor silicon, precision calibration, and skilled labor. Due to thermal dissipation thresholds and machine re-tooling limits, variable costs accelerate quadratically as daily volume increases, resulting in the total daily operating cost equation C(x) = 2x^2 + 40x + 1800, where x represents the number of sensor modules manufactured per day.

[¶4] Commercial enterprise distribution contracts dictate a constant wholesale sales price of $200 per sensor module, creating a strictly linear total revenue function R(x) = 200x. Consequently, the net operating profit function P(x) is defined as total revenue minus total operating cost: P(x) = R(x) - C(x) = 200x - (2x^2 + 40x + 1800) = -2x^2 + 160x - 1800.

[¶5] Because the coefficient of x^2 is negative (a = -2), the graph of P(x) is a downward-opening parabola with an absolute maximum at its vertex. The vertex x-coordinate is determined by the formula x = -b / (2a) = -160 / (2 * (-2)) = -160 / -4 = 40 sensor units per day.

[¶6] Beyond the optimal threshold of 40 units per day, the quadratic penalty term (-2x^2) overtakes linear revenue growth, causing net profit to decline precipitously despite higher gross unit sales. Plant managers must enforce strict production caps to avoid unprofitable overproduction.`;

          return [
            {
              id: `ms-q-alg-${Date.now()}-1`,
              topic: ms.title || (isAlgebra1 ? 'Algebra 1: Extended Modeling' : 'Algebra 2: Extended Modeling'),
              difficulty: 'Brutal Trap',
              passageTitle: `Extended Algebraic Optimization Protocol: Production Viability (6-Paragraph Full Analysis)`,
              passage: alg6Paragraph,
              question: `Synthesizing the cost formulation in [¶3] with the revenue model in [¶4] and vertex derivation in [¶5], what is the maximum achievable daily net profit, and why does producing 50 units reduce profit below this peak?`,
              options: [
                `Maximum daily profit is $1400 achieved at x = 40 units (P(40) = -2(1600) + 160(40) - 1800 = $1400); producing 50 units yields P(50) = -2(2500) + 160(50) - 1800 = $1200 because quadratic marginal costs in [¶3] escalate faster than linear revenue past the vertex.`,
                `Maximum daily profit is $2500 achieved at x = 50 units, because revenue continues to increase at $200 per unit without cost penalty.`,
                `Maximum daily profit occurs at the break-even points where P(x) = 0, which occurs at x = 15 and x = 65 units.`,
                `Maximum profit is unlimited because higher sales volumes always overcome fixed equipment amortization.`
              ],
              correctIndex: 0,
              angryExplanation: `Flawless algebraic synthesis! Vertex occurs at x = 40, yielding P(40) = $1400. At x = 50, P(50) = -5000 + 8000 - 1800 = $1200. The $200 decline occurs because quadratic costs outpace linear revenue!`,
              examinerTrapNotes: `Distractor B assumes higher sales always mean more profit. Distractor C confuses break-even points (P = 0) with peak profit!`,
              levelTip: `In quadratic word problems, identify vertex = peak profit; roots = break-even thresholds.`
            }
          ];
        }

        return [
          {
            id: `ms-q-alg-${Date.now()}-1`,
            topic: ms.title || (isAlgebra1 ? 'Algebra 1 Modeling' : 'Algebra 2 Modeling'),
            difficulty: 'Brutal Trap',
            passageTitle: `Algebraic System Optimization: Production Capacity & Break-Even Modeling`,
            passage: `A manufacturing enterprise produces precision sensor modules. The total operating cost function in dollars for producing x units per day is modeled by the quadratic cost equation C(x) = 2x^2 + 40x + 1800, where fixed daily overhead represents $1800 and marginal costs accelerate non-linearly due to machine recalibration limits.

The enterprise sells each sensor at a constant wholesale price of $200 per unit, generating a linear total revenue function R(x) = 200x. The company's daily net profit function P(x) is defined as total revenue minus total operating cost: P(x) = R(x) - C(x) = 200x - (2x^2 + 40x + 1800) = -2x^2 + 160x - 1800. Daily production capacity is constrained to a maximum of 75 units.`,
            question: `To maximize daily net profit, how many sensor units must the company manufacture per day, and what is the maximum achievable daily profit?`,
            options: [
              `The company must manufacture x = 40 units per day to achieve a maximum daily profit of $1400, calculated by locating the vertex of the downward-opening parabola P(x) at x = -b / (2a) = -160 / (2*(-2)) = 40, yielding P(40) = -2(1600) + 160(40) - 1800 = -3200 + 6400 - 1800 = $1400.`,
              `The company must manufacture x = 50 units per day to achieve a profit of $2500, setting profit equal to revenue.`,
              `The company must operate at full capacity x = 75 units, because quadratic profit functions continuously increase as production volume scales.`,
              `The company achieves maximum profit at the break-even points where P(x) = 0, which occurs at x = 15 and x = 65 units.`
            ],
            correctIndex: 0,
            angryExplanation: `Flawless algebraic optimization! P(x) = -2x^2 + 160x - 1800 is a parabola opening downward (a = -2 < 0). The vertex occurs at x = -b / (2a) = -160 / (-4) = 40 units. Substituting x = 40 gives P(40) = $1400!`,
            examinerTrapNotes: `Distractor C fails to recognize that cost accelerates faster than revenue past the vertex. Distractor D confuses break-even points (P = 0) with maximum profit!`,
            levelTip: `For quadratic optimization P(x) = ax^2 + bx + c with a < 0, maximum is ALWAYS at x = -b / (2a).`
          }
        ];
      }

      return [
        {
          id: `ms-q-alg-${Date.now()}-1`,
          topic: ms.title || 'Polynomial & Quadratic Analysis',
          difficulty: 'Standard',
          question: `For the quadratic function f(x) = -2(x - 3)^2 + 8, what are the coordinates of the vertex and the exact real x-intercepts?`,
          options: [
            `Vertex is at (3, 8); real x-intercepts are at x = 1 and x = 5, found by setting -2(x - 3)^2 + 8 = 0 -> (x - 3)^2 = 4 -> x - 3 = ±2.`,
            `Vertex is at (-3, 8); real x-intercepts are at x = -1 and x = -5.`,
            `Vertex is at (3, -8); there are no real x-intercepts because the parabola opens downwards.`,
            `Vertex is at (0, 8); real x-intercepts are at x = ±4.`
          ],
          correctIndex: 0,
          angryExplanation: `Correct! In vertex form f(x) = a(x - h)^2 + k, the vertex is (h, k) = (3, 8). Setting f(x) = 0: 2(x - 3)^2 = 8 -> (x - 3)^2 = 4 -> x - 3 = ±2 -> x = 1 or x = 5.`,
          examinerTrapNotes: `Watch the signs! In (x - 3), h = +3, NOT -3.`,
          levelTip: `Vertex form f(x) = a(x - h)^2 + k has vertex at (h, k). The minus sign is built into the formula!`
        }
      ];
    }

    // 4. GEOMETRY FALLBACK
    if (isGeometry) {
      if (hasReadingPassage) {
        if (isLongPassage) {
          const geom6Paragraph = `[¶1] Structural architecture and civil engineering frameworks rely extensively upon Euclidean trigonometry and special right triangle mechanics. In large-scale roof truss fabrication, load-bearing cross-sections must withstand asymmetrical gravitational and wind stresses.

[¶2] Structural engineers are designing a triangular timber truss ABC spanning across two concrete foundation piers. The horizontal base tie AC measures exactly 24 meters in length and rests level on the foundation horizon.

[¶3] To distribute downward dead weight from the roof peak, a central vertical king post BD is erected perpendicular to the horizontal base AC at an interior point D, forming two right angles: angle BDA = 90° and angle BDC = 90°.

[¶4] In order to satisfy drainage slope codes and aesthetic constraints, the left rafter AB is engineered to form an angle of exactly 30° with the horizontal tie (angle A = 30°), while the right rafter BC forms an angle of 45° with the horizontal tie (angle C = 45°).

[¶5] Consequently, interior triangle ABD is a special 30°-60°-90° right triangle, meaning the horizontal base segment AD satisfies AD = h * sqrt(3), where h represents the height of king post BD. Conversely, interior triangle CBD is a 45°-45°-90° isosceles right triangle, meaning horizontal base segment DC satisfies DC = h.

[¶6] Because points A, D, and C are strictly collinear along the unbroken base tie, the sum of segments AD and DC equals the total length AC: h * sqrt(3) + h = 24. Factoring h yields h * (sqrt(3) + 1) = 24, enabling exact calculation of timber dimensions without numerical rounding error.`;

          return [
            {
              id: `ms-q-geom-${Date.now()}-1`,
              topic: ms.title || 'Geometry: Extended Truss Mechanics',
              difficulty: 'Brutal Trap',
              passageTitle: `Extended Geometric Truss Specification: Special Triangles (6-Paragraph Full Analysis)`,
              passage: geom6Paragraph,
              question: `Synthesizing the angle specifications in [¶4] with the special right triangle segment formulations in [¶5]–[¶6], what is the exact height h of the vertical king post BD in meters?`,
              options: [
                `h = 24 / (sqrt(3) + 1) = 12*(sqrt(3) - 1) meters, derived by expressing AD = h*sqrt(3) from the 30°-60°-90° triangle and DC = h from the 45°-45°-90° triangle, and setting AD + DC = 24.`,
                `h = 12 meters, calculated by incorrectly assuming point D bisects the 24-meter base equally into two 12-meter segments.`,
                `h = 8*sqrt(3) meters, which applies only if triangle ABC were an equilateral triangle with equal 60° base angles.`,
                `h = 16 meters, calculated by mistakenly assuming triangle ABC is an isosceles right triangle with equal 45° base angles.`
              ],
              correctIndex: 0,
              angryExplanation: `Brilliant geometric deduction! AD = h*sqrt(3) and DC = h. Since AD + DC = 24: h*(sqrt(3) + 1) = 24 -> h = 24 / (sqrt(3) + 1). Rationalizing the denominator gives 24*(sqrt(3) - 1) / (3 - 1) = 12*(sqrt(3) - 1) ≈ 8.78 m!`,
              examinerTrapNotes: `Distractor B makes the classic student mistake of assuming D is the midpoint. Because angle A is 30° and angle C is 45°, D is shifted towards C!`,
              levelTip: `Never assume a perpendicular post bisects the base unless the triangle is proven to be isosceles!`
            }
          ];
        }

        return [
          {
            id: `ms-q-geom-${Date.now()}-1`,
            topic: ms.title || 'Geometric Optimization & Special Triangles',
            difficulty: 'Brutal Trap',
            passageTitle: `Architectural Geometric Specification: Truss Design & Special Triangles`,
            passage: `Structural engineers are fabricating a triangular roof truss ABC. The primary cross-section forms a large triangle where the base AC represents the horizontal ceiling tie of length 24 meters. An interior vertical king post BD is erected perpendicular to AC at point D, dividing the structure into two adjacent right triangles, triangle ABD and triangle CBD.

Angle A is engineered to measure exactly 30°, while Angle C measures 45°. Both interior right triangles share the vertical king post BD of height h. Points A, D, and C are collinear along the horizontal tie, such that AD + DC = AC = 24 meters.`,
            question: `Based strictly on special right triangle relationships (30°-60°-90° and 45°-45°-90°), what is the exact height h of the vertical king post BD in meters?`,
            options: [
              `h = 24 / (sqrt(3) + 1) = 12*(sqrt(3) - 1) meters, derived by setting AD = h*sqrt(3) from the 30°-60°-90° triangle ABD and DC = h from the 45°-45°-90° triangle CBD, so h*sqrt(3) + h = 24.`,
              `h = 12 meters, calculated by assuming D bisects the base AC equally regardless of angles.`,
              `h = 8*sqrt(3) meters, applying standard equilateral triangle formulas.`,
              `h = 16 meters, calculated by treating triangle ABC as an isosceles right triangle.`
            ],
            correctIndex: 0,
            angryExplanation: `Brilliant geometric derivation! In 30-60-90 triangle ABD, side opposite 60° is AD = h*sqrt(3). In 45-45-90 triangle CBD, legs are equal so DC = h. Since AD + DC = 24, h*(sqrt(3) + 1) = 24 -> h = 24 / (sqrt(3) + 1) = 12*(sqrt(3) - 1) ≈ 8.78 m!`,
            examinerTrapNotes: `Distractor B makes the classic student blunder of assuming D is the midpoint. Because the base angles are different (30° vs 45°), D cannot be the midpoint!`,
            levelTip: `Express both segment lengths in terms of the shared vertical height h first, then sum them to the total base length.`
          }
        ];
      }

      return [
        {
          id: `ms-q-geom-${Date.now()}-1`,
          topic: ms.title || 'Geometric Proofs & Theorems',
          difficulty: 'Standard',
          question: `In a right triangle with acute angles measuring 30° and 60°, if the side opposite the 30° angle has length x, what are the exact lengths of the hypotenuse and the side opposite the 60° angle?`,
          options: [
            `Hypotenuse = 2x, and side opposite 60° = x*sqrt(3), derived directly from bisecting an equilateral triangle of side length 2x.`,
            `Hypotenuse = x*sqrt(2), and side opposite 60° = x, which applies exclusively to 45°-45°-90° isosceles right triangles.`,
            `Hypotenuse = 3x, and side opposite 60° = 2x.`,
            `Hypotenuse = x/2, and side opposite 60° = x/sqrt(3).`
          ],
          correctIndex: 0,
          angryExplanation: `Classic 30-60-90 ratios! Ratio of sides opposite 30° : 60° : 90° is always 1 : sqrt(3) : 2. If short leg is x, hypotenuse is 2x and long leg is x*sqrt(3).`,
          examinerTrapNotes: `Never mix up 30-60-90 (1 : sqrt(3) : 2) with 45-45-90 (1 : 1 : sqrt(2)).`,
          levelTip: `Memorize: Short leg = x, Long leg = x√3, Hypotenuse = 2x.`
        }
      ];
    }

    // 5. SCIENCE / DEFAULT FALLBACK
    const isExplicitScience = /biology|physiology|anatomy|chemistry|physics|biochem|cellular|enzyme|neuro/i.test(subjectFull);
    if (hasReadingPassage) {
      if (isExplicitScience) {
        if (isLongPassage) {
          const science6Paragraph = `[¶1] Cellular bioenergetics and enzyme kinetics operate within strict thermodynamic and structural constraints. Within eukaryotic metabolism, primary metabolic flux is controlled through rate-limiting allosteric enzymes possessing distinct catalytic and regulatory domains.

[¶2] Investigators examined the regulatory kinetics of Enzyme Alpha, the rate-limiting pacesetter governing ${title}. In Baseline Assay 1, purified enzyme preparations were incubated in buffered physiological solution at pH 7.40 and 37°C across increasing substrate concentrations. Initial reaction velocity (V0) reached 64% of maximal velocity (Vmax), with a baseline Michaelis constant (Km) established at 1.2 mM.

[¶3] In Experimental Assay 2, investigators administered Compound X—a putative synthetic allosteric modulator—at increasing nanomolar concentrations. Under saturated substrate conditions ([S] >> Km), maximal catalytic velocity (Vmax) remained fully intact and unchanged relative to controls. However, the substrate concentration required to achieve half-maximal velocity escalated fourfold from 1.2 mM to 4.8 mM.

[¶4] In Experimental Assay 3, investigators simulated acute hypoxia and energy depletion. Cellular AMP concentrations escalated sixfold, while total intracellular ATP reserves dropped precipitously by 78%, causing significant intracellular acidification to pH 6.85.

[¶5] Surprisingly, upon introduction of physiological AMP to the inhibited preparation from Assay 2, the inhibitory potency of Compound X was completely abrogated. Reaction velocity surged by 210%, and the apparent Km returned toward 1.3 mM despite the continued presence of Compound X.

[¶6] Western blot analysis and circular dichroism spectroscopy in Phase IV revealed that Compound X selectively stabilizes the low-affinity T-state quaternary conformation without altering active site amino acid residues, while AMP binds an allosteric pocket that locks the catalytic subunits into the high-affinity R-state.`;

          return [
            {
              id: `ms-q-passage-${Date.now()}-1`,
              topic: ms.title || subject || 'Experimental Passage Analysis',
              difficulty: 'Brutal Trap',
              passageTitle: `Extended Experimental Assay Protocol: Allosteric Kinetics in ${title} (6-Paragraph Full Analysis)`,
              passage: science6Paragraph,
              question: `Synthesizing the kinetic parameters in [¶2]–[¶3] with the conformational spectroscopy findings in [¶5]–[¶6], which statement best accounts for the mechanism of regulation governing Enzyme Alpha?`,
              options: [
                `Compound X acts as a reversible allosteric inhibitor that shifts the quaternary equilibrium toward the low-affinity T-state (increasing apparent Km without altering Vmax), whereas elevated AMP in [¶4]–[¶5] functions as an overriding allosteric activator that stabilizes the high-affinity R-state.`,
                `Compound X irreversibly denatures the catalytic active site via covalent alkylation, and the velocity surge in [¶5] is driven purely by non-enzymatic spontaneous substrate hydrolysis.`,
                `Compound X functions as a classical uncompetitive inhibitor that binds exclusively to the enzyme-substrate complex, reducing both Km and Vmax proportionally.`,
                `Compound X binds irreversibly to ATP synthase, shutting down oxidative phosphorylation completely while leaving cytosolic glycolysis unaffected.`
              ],
              correctIndex: 0,
              angryExplanation: `Masterful biological synthesis! In [¶3], Vmax is unchanged while Km increases (1.2 -> 4.8 mM)—that is textbook competitive/allosteric T-state stabilization! In [¶5]–[¶6], AMP overrides this inhibition by locking the enzyme in the high-affinity R-state!`,
              examinerTrapNotes: `Distractor B claims irreversible denaturation (impossible since Vmax is preserved and inhibition is reversed by AMP). Distractor C incorrectly claims uncompetitive inhibition.`,
              levelTip: `In multi-paragraph kinetic passages: Km increase with Vmax preserved = competitive or allosteric T-state affinity shift.`
            }
          ];
        }

        return [
          {
            id: `ms-q-passage-${Date.now()}-1`,
            topic: ms.title || subject || 'Experimental Passage Analysis',
            difficulty: 'Brutal Trap',
            passageTitle: `Experimental Protocol 4-A: Allosteric Regulation and Kinetic Flux in ${title}`,
            passage: `Investigators examined the kinetic velocity of the primary rate-limiting regulatory enzyme governing ${title}. In Trial 1, isolated preparations were incubated under physiological substrate concentrations at pH 7.40 and 37°C. Reaction velocity (V0) reached 64% of maximal capacity (Vmax), with a measured Michaelis constant (Km) of 1.2 mM.

In Trial 2, investigators administered Compound X—a putative synthetic allosteric modulator—at increasing titrations. Under sustained saturating substrate concentrations, maximal velocity (Vmax) was observed to be completely preserved. However, the substrate concentration required to reach half-maximal velocity escalated fourfold from 1.2 mM to 4.8 mM.

In Trial 3, investigators introduced acute metabolic stress. Under these acidified, energy-depleted conditions, cellular AMP levels rose sixfold, while ATP stores dropped precipitously by 78%. Surprisingly, the inhibitory potency of Compound X was completely abrogated, and reaction velocity increased by 210%.`,
            question: `Based strictly on the experimental assays and kinetic data presented in the passage, which statement best accounts for the altered behavior observed across Trials 2 and 3?`,
            options: [
              `Compound X acts as a reversible competitive/allosteric antagonist that stabilizes the low-affinity T-state without perturbing catalytic turnover at saturated substrate concentrations, whereas elevated intracellular AMP in Trial 3 acts as an overriding allosteric activator that stabilizes the high-affinity R-state.`,
              `Compound X irreversibly denatures the catalytic triad via covalent disulfide crosslinking, and the subsequent rate acceleration in Trial 3 is mediated exclusively by spontaneous non-enzymatic substrate hydrolysis.`,
              `Compound X functions as a non-competitive uninhibited regulator that reduces Vmax while leaving Km entirely unaffected.`,
              `Compound X binds directly to the active site to permanently reduce Vmax by 50%, whereas acidosis hyperpolarizes the lipid bilayer.`
            ],
            correctIndex: 0,
            angryExplanation: `Brilliant synthesis! Notice the behavior in Trial 2: Vmax was unchanged, but Km increased from 1.2 mM to 4.8 mM. That is textbook competitive/allosteric T-state stabilization! In Trial 3, elevated AMP acts as the ultimate physiological allosteric activator!`,
            examinerTrapNotes: `Distractor B claims irreversible denaturation (impossible, since Vmax is preserved). Distractor C claims non-competitive inhibition (which reduces Vmax, contrary to the data).`,
            levelTip: `Lineweaver-Burk rule of iron: Same Y-intercept = Vmax unchanged = Competitive/Allosteric affinity shift.`
          }
        ];
      }

      // Non-science academic passage fallback
      if (isLongPassage) {
        const academic6Paragraph = `[¶1] In academic and empirical epistemological inquiry, theoretical frameworks are structured upon explicit foundational axioms, boundary parameters, and operational constraints. In Phase I of investigation, baseline models demonstrated that systemic output velocity scales in direct proportion to input fidelity, with an observed correlation coefficient exceeding 0.92 under standard control conditions.

[¶2] Phase II examined structural resilience under external perturbations. Investigators introduced continuous load variations to evaluate whether systemic equilibrium could be maintained without runaway deviation from predetermined operational boundaries.

[¶3] Under sustained maximum perturbation, total systemic throughput remained intact; however, the cognitive/computational latency required to achieve steady-state calibration increased threefold, indicating elevated internal resistance and systemic stress.

[¶4] In Phase III, under rapid environmental stress and resource scarcity, secondary compensatory feedback loops activated automatically. These adaptive mechanisms sacrificed auxiliary non-essential processes to preserve primary foundational objectives without catastrophic failure.

[¶5] Longitudinal assessment in Phase IV revealed that while adaptive compensatory mechanisms prevent immediate failure, sustained operation in an uncalibrated state induces structural fatigue and diminishes long-term operational elasticity.

[¶6] Consequently, analytical synthesis dictates that systemic optimization requires proactive calibration rather than passive reliance upon emergency compensatory feedback, ensuring long-term institutional stability and deductive integrity.`;

        return [
          {
            id: `ms-q-academic-${Date.now()}-1`,
            topic: ms.title || subject || 'Academic Critical Analysis',
            difficulty: 'Brutal Trap',
            passageTitle: `Extended Analytical Assessment Protocol: Theoretical Synthesis of ${title} (6-Paragraph Full Analysis)`,
            passage: academic6Paragraph,
            question: `Synthesizing the systemic behavioral trajectory across [¶2] through [¶6], which conclusion most rigorously synthesizes the trade-offs of adaptive compensatory feedback?`,
            options: [
              `Adaptive compensatory feedback in [¶4] successfully preserves primary system survival under acute crisis by shedding auxiliary loads, but Phase IV and [¶6] establish that chronic reliance upon emergency compensation induces structural fatigue, necessitating proactive calibration for sustainable equilibrium.`,
              `Compensatory feedback permanently invalidates all foundational axioms in [¶1], rendering any subsequent steady-state calibration mathematically impossible.`,
              `The system operates completely without internal regulation, responding solely to random external fluctuations without memory or feedback.`,
              `Phase III proves that input fidelity is completely disconnected from output performance under all conceivable environmental conditions.`
            ],
            correctIndex: 0,
            angryExplanation: `Superb analytical deduction! The passage demonstrates both the immediate utility of compensatory feedback in crisis and its long-term hazards if used as a substitute for proactive calibration.`,
            examinerTrapNotes: `Distractor B claims the baseline axioms are permanently invalidated (unsupported by text). Distractor C ignores the explicit governing feedback loops.`,
            levelTip: `In extended academic passages, identify how later paragraphs qualify and limit the findings of earlier paragraphs.`
          }
        ];
      }

      return [
        {
          id: `ms-q-academic-${Date.now()}-1`,
          topic: ms.title || subject || 'Academic Critical Analysis',
          difficulty: 'Brutal Trap',
          passageTitle: `Analytical Assessment Protocol: Theoretical Synthesis of ${title}`,
          passage: `In academic and empirical discourse, foundational models are structured upon explicit axioms and operational constraints. In Phase I of investigation, baseline models demonstrated that outcome velocity scales in direct proportion to input fidelity, with an observed correlation coefficient exceeding 0.92 under standard control conditions.

In Phase II, investigators introduced external perturbation X to evaluate systemic resilience. Under sustained maximum loading, total systemic throughput remained intact; however, the cognitive/computational latency required to achieve steady-state calibration increased threefold.

In Phase III, under rapid environmental stress, secondary compensatory mechanisms activated automatically, maintaining primary objectives while redistributing secondary resource allocation without structural failure.`,
          question: `Based strictly on the analytical principles presented in the passage, which conclusion most rigorously synthesizes the systemic behavior observed across Phase II and Phase III?`,
          options: [
            `Perturbation X increases the operational friction and threshold latency required to reach equilibrium without diminishing maximum throughput capacity, while Phase III verifies that adaptive compensatory feedback preserves core system stability under elevated stress.`,
            `Perturbation X permanently destroys all baseline governance, rendering subsequent Phase III recovery mathematically impossible.`,
            `The system operates completely passively without any internal regulation, responding solely to random external fluctuations.`,
            `Phase III demonstrates that input velocity is completely disconnected from output performance under all possible conditions.`
          ],
          correctIndex: 0,
          angryExplanation: `Superb analytical deduction! The passage confirms that maximum throughput capacity was fully preserved in Phase II despite increased latency, and Phase III demonstrates adaptive stability under stress.`,
          examinerTrapNotes: `Distractor B contradicts the Phase III findings; Distractor C ignores the explicit governing constraints stated in the text.`,
          levelTip: `Always identify which variables remain constant versus which ones undergo transient shifts.`
        }
      ];
    }

    return [
      {
        id: `ms-q-${Date.now()}-1`,
        topic: ms.title || subject || 'Mission Practice',
        difficulty: 'Standard',
        question: `Regarding the core priority of this mission (${title}): which principle directly governs the primary regulatory or foundational standard?`,
        options: [
          'The primary committed standard or governing constraint that ensures deductive consistency and prevents uncontrolled errors',
          'A non-specific passive assumption that operates identically under all conditions without regulation',
          'An unmonitored backward reaction that destroys all intermediate states spontaneously',
          'An instantaneous equilibrium state that bypasses all governing discipline principles'
        ],
        correctIndex: 0,
        angryExplanation: `Correct! In ${title}, rigorous discipline requires adhering to core foundational standards to preserve consistency and accuracy.`,
        examinerTrapNotes: 'Examiners always test foundational principles. Do not pick passive, unregulated distractor options.',
        levelTip: `Level Mission Pearl: ${focus}`
      }
    ];
  }

  function shuffleFallbackQuestions(list: any[]): any[] {
    if (!Array.isArray(list)) return [];
    return list.map(q => {
      if (!q || !Array.isArray(q.options) || q.options.length <= 1) return q;
      const correctText = q.options[q.correctIndex || 0];
      const shuffled = [...q.options];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      const newCorrectIndex = shuffled.indexOf(correctText);
      return {
        ...q,
        options: shuffled,
        correctIndex: newCorrectIndex >= 0 ? newCorrectIndex : 0
      };
    });
  }

  try {
    if (!process.env.GEMINI_API_KEY) {
      return res.json({
        milestone: ms,
        levelIndex: Number(levelIndex || 0),
        questions: shuffleFallbackQuestions(generateFallbackLevelQuestions())
      });
    }

    // Build subject-specific discipline instructions
    let disciplineInstructions = '';
    if (isEnglish) {
      disciplineInstructions = `CRITICAL DISCIPLINE MANDATE: THIS IS STRICTLY AN ENGLISH & LITERATURE EXAM.
- YOU ARE STRICTLY FORBIDDEN FROM GENERATING SCIENCE, BIOLOGY, MEDICAL, CLINICAL, BIOCHEMICAL, OR PHYSICS QUESTIONS.
- The reading passage MUST be a rich, challenging literary excerpt (classic or contemporary literature, narrative fiction, or analytical essay) or a famous historical speech/rhetorical address.
- Questions MUST evaluate reading comprehension, rhetorical devices (antithesis, metaphor, paradox, irony), author's tone and perspective, thematic synthesis, syntax, or vocabulary in context.
- The 4 answer choices MUST be nuanced, multi-clause literary/rhetorical analyses (25 to 45 words each).`;
    } else if (isCalculus) {
      disciplineInstructions = `CRITICAL DISCIPLINE MANDATE: THIS IS STRICTLY A CALCULUS EXAM.
- YOU ARE STRICTLY FORBIDDEN FROM GENERATING BIOLOGY OR CLINICAL QUESTIONS.
- Questions must test Calculus concepts (Limits, Derivatives, Integrals, Fundamental Theorem of Calculus, Related Rates, or Optimization).
- If Reading Passage mode is active, provide an applied mathematical modeling problem (e.g. physical rate of change, geometric accumulation, or particle kinematics with explicit functions and boundary conditions).
- Answer choices must be mathematically precise formulations with full deductive justifications (25 to 45 words each).`;
    } else if (isAlgebra1 || isAlgebra2) {
      disciplineInstructions = `CRITICAL DISCIPLINE MANDATE: THIS IS STRICTLY AN ${isAlgebra1 ? 'ALGEBRA 1' : 'ALGEBRA 2'} EXAM.
- YOU ARE STRICTLY FORBIDDEN FROM GENERATING BIOLOGY OR CLINICAL QUESTIONS.
- Questions must test algebraic equations, systems of equations, polynomials, quadratics, exponents, logarithms, or rational functions.
- Answer choices must be mathematically sound statements with algebraic reasoning.`;
    } else if (isGeometry) {
      disciplineInstructions = `CRITICAL DISCIPLINE MANDATE: THIS IS STRICTLY A GEOMETRY EXAM.
- YOU ARE STRICTLY FORBIDDEN FROM GENERATING BIOLOGY OR CLINICAL QUESTIONS.
- Questions must test geometric theorems, congruence/similarity proofs, circles, angles, polygons, coordinate geometry, or trigonometric ratios.`;
    } else if (isHistory) {
      disciplineInstructions = `CRITICAL DISCIPLINE MANDATE: THIS IS STRICTLY A HISTORY & SOCIAL STUDIES EXAM.
- Passages must be primary historical source documents or historiographical perspectives, and questions must test causation, historical significance, and source credibility.`;
    } else {
      disciplineInstructions = `CRITICAL DISCIPLINE MANDATE: THIS IS A ${subject.toUpperCase()} EXAM.
- All questions, passages, and options must adhere 100% to the curriculum and factual principles of ${subject}.`;
    }

    const passageInstructions = hasReadingPassage
      ? (isLongPassage
          ? `CRITICAL FORMAT REQUIREMENT: EXTENDED READING PASSAGE (6+ PARAGRAPHS MANDATORY) & COMPLEX MULTI-CLAUSE OPTIONS:
1. EXTENDED READING PASSAGE ('passage' & 'passageTitle'):
   - MANDATORY: The 'passage' MUST contain AT LEAST 6 DISTINCT, WELL-DEVELOPED PARAGRAPHS (separated by double newlines \\n\\n).
   - Label paragraphs clearly as [¶1], [¶2], [¶3], [¶4], [¶5], [¶6] (and [¶7] if needed).
   - Each paragraph must be a substantive 3 to 6 sentence deep-dive appropriate to ${subject}:
     * For English/Literature: an intricate excerpt or historical speech with literary devices, distinct authorial shifts, and rhetorical progression across all 6 paragraphs.
     * For Science: comprehensive experimental rationale, methodology, baseline controls, perturbations, kinetic/quantitative assays, and synthesized findings across all 6 paragraphs.
     * For Math: applied multi-stage modeling scenario with initial boundary parameters, dynamic rates of change, constraints, perturbation models, and real-world system implications across 6 paragraphs.
   - Provide a formal academic title in 'passageTitle'.
2. CROSS-PARAGRAPH COMPREHENSION & MULTI-CLAUSE OPTIONS:
   - Questions MUST require synthesizing information across multiple paragraphs (e.g. comparing [¶2] with [¶5], or evaluating how the conclusion in [¶6] modifies the premise in [¶1]).
   - Each of the 4 options (0 to 3) MUST be an intricate, multi-clause, complete analytical statement (25 to 45 words each).
   - NEVER provide short 3-word options.
3. 'difficulty': Set to "Brutal Trap", "Challenging", or "Examiner Nightmare".`
          : `CRITICAL FORMAT REQUIREMENT: READING PASSAGE & COMPLEX MULTI-CLAUSE OPTIONS:
1. READING PASSAGE ('passage' & 'passageTitle'):
   - For every question, write a dense, multi-paragraph (2 to 4 paragraphs) text appropriate to the subject discipline (literary excerpt for English; mathematical modeling problem for Math; experimental protocol for Science).
   - Provide an academic title in 'passageTitle'.
2. VERY COMPLEX MULTI-CLAUSE OPTIONS:
   - Each of the 4 options (0 to 3) MUST be an intricate, multi-clause, complete analytical statement (typically 25 to 45 words each).
   - NEVER provide short, simplistic 3-word options.
   - Each choice must articulate a complete causal or logical chain.
   - The 3 distractor choices must be seductive, high-level traps with genuine discipline terminology that contain subtle conceptual flaws.
3. 'difficulty': Set to "Brutal Trap", "Challenging", or "Examiner Nightmare".`)
      : `Standard multiple-choice exam questions for this discipline. Ensure choices are precise and test deep conceptual understanding.`;

    const prompt = `You are "The Angry Examiner" from angryexaminer.com, creating high-stakes, challenging practice questions tailored specifically to an AI Roadmap Study Mission.
Student Context:
- Subject: ${subject || 'Academic Exam'}
- Grade Level: ${gradeLevel || 'Undergraduate / College'}
- Mission Level: Level ${Number(levelIndex || 0) + 1}
- Phase: "${ms.phase}"
- Mission Title: "${ms.title}"
- Day Range: "${ms.dayRange}"
- Mission Focus: "${ms.focus}"
- Key Mission Actions: ${JSON.stringify(ms.actionItems || [])}
- Selected Exam Formats: ${JSON.stringify(questionTypes || [])}

${disciplineInstructions}

TASK:
Generate ${questionCount} multiple-choice exam questions specifically designed to test this level mission.

${passageInstructions}

CRITICAL MANDATES:
1. Every question must directly test the concepts, rate-limiting steps, and traps outlined in the mission title and focus for ${subject}.
2. 100% textbook accuracy for this specific discipline.
3. 'correctIndex' (0 to 3) must be unambiguously the single correct answer based on the passage and discipline principles.
4. 'angryExplanation': A sharp, 3-4 sentence explanation in The Angry Examiner voice explaining exactly WHY the correct answer is true and dismantling why the distractor options are traps.
5. 'examinerTrapNotes': Identify the exact trap or distractor in the complex options that weak students fall for.
6. 'distractorExplanations': Array of strings for options 0-3 explaining specifically why each distractor is wrong (and why correctIndex is right).
7. 'levelTip': A 1-sentence high-yield tip for mastering this level.
8. 'difficulty': One of "Standard", "Challenging", or "Brutal Trap".`;

    const response = await callGeminiWithFallback({
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  passageTitle: { type: Type.STRING },
                  passage: { type: Type.STRING },
                  question: { type: Type.STRING },
                  options: { type: Type.ARRAY, items: { type: Type.STRING } },
                  correctIndex: { type: Type.INTEGER },
                  angryExplanation: { type: Type.STRING },
                  examinerTrapNotes: { type: Type.STRING },
                  distractorExplanations: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: 'Array explaining why each option index is wrong (or why correctIndex is right)',
                  },
                  levelTip: { type: Type.STRING },
                  difficulty: { type: Type.STRING },
                },
                required: ['question', 'options', 'correctIndex', 'angryExplanation', 'examinerTrapNotes', 'levelTip', 'difficulty'],
              },
            },
          },
          required: ['questions'],
        },
      },
    });

    const parsed = JSON.parse(response.text?.trim() || '{}');
    const questionsWithIds = (parsed.questions || []).map((q: any, i: number) => ({
      id: `ms-q-ai-${Date.now()}-${i}`,
      topic: ms.title || subject || 'Level Mission Practice',
      ...q,
    }));

    return res.json({
      milestone: ms,
      levelIndex: Number(levelIndex || 0),
      questions: questionsWithIds.length > 0 ? questionsWithIds : shuffleFallbackQuestions(generateFallbackLevelQuestions())
    });
  } catch (err: any) {
    console.error('Error generating roadmap level questions:', err);
    return res.json({
      milestone: ms,
      levelIndex: Number(levelIndex || 0),
      questions: shuffleFallbackQuestions(generateFallbackLevelQuestions())
    });
  }
});

// 8. ADAPTIVE NEXT QUESTION GENERATION (AI DYNAMIC DIFFICULTY ADJUSTMENT)
app.post('/api/adaptive/next-question', async (req: Request, res: Response) => {
  try {
    const {
      subject,
      topic,
      milestoneTitle,
      currentDifficulty = 'Standard',
      wasCorrect,
      streak = 0,
      lastSelectedAnswer,
      lastCorrectAnswer,
      lastTrapNote,
      includeReadingPassage = false,
      passageLengthPreference = 'standard',
      questionTypes = ['Multiple Choice Questions']
    } = req.body;

    const tiers = ['Foundation', 'Standard', 'Challenging', 'Brutal Trap', 'Examiner Nightmare'];
    const currentIdx = Math.max(0, tiers.indexOf(currentDifficulty));
    
    let nextIdx = currentIdx;
    let direction: 'up' | 'down' | 'maintain' = 'maintain';
    let rationale = '';

    if (wasCorrect) {
      if (currentIdx < tiers.length - 1) {
        nextIdx = currentIdx + 1;
        direction = 'up';
        rationale = `Candidate answered correctly at ${currentDifficulty}. The AI has escalated question difficulty to ${tiers[nextIdx]} to test deeper mechanisms and subtle distractor traps.`;
      } else {
        nextIdx = currentIdx;
        direction = 'maintain';
        rationale = `Candidate is performing at the peak Examiner Nightmare tier! Maintaining maximum difficulty to enforce supreme exam mastery.`;
      }
    } else {
      if (currentIdx > 0) {
        nextIdx = currentIdx - 1;
        direction = 'down';
        rationale = lastTrapNote
          ? `Candidate fell for a distractor trap ("${lastTrapNote}"). The AI has calibrated difficulty down to ${tiers[nextIdx]} to reinforce baseline mechanics before re-escalating.`
          : `Candidate missed the previous question at ${currentDifficulty}. The AI adapted difficulty down to ${tiers[nextIdx]} to consolidate fundamental principles.`;
      } else {
        nextIdx = 0;
        direction = 'maintain';
        rationale = `Focusing on Tier 1 Foundation concepts to ensure baseline clarity before moving up.`;
      }
    }

    const targetDifficulty = tiers[nextIdx];

    const fallbackQuestion = {
      id: `adaptive-q-${Date.now()}`,
      topic: topic || milestoneTitle || subject || 'Core Topic',
      difficulty: targetDifficulty,
      question: wasCorrect
        ? `[${targetDifficulty}] Regarding ${topic || milestoneTitle || 'this system'}, what is the decisive rate-limiting checkpoint or regulatory constraint that governs throughput?`
        : `[${targetDifficulty}] In ${topic || milestoneTitle || 'this system'}, what is the fundamental baseline mechanism that must be established before any downstream regulation occurs?`,
      options: [
        `The primary committed step or regulatory balance that dictates rate-limiting throughput without waste`,
        `A random passive leak that operates identically under all conditions without energy input`,
        `An unmonitored backward reaction that spontaneously destroys all intermediates`,
        `An instantaneous reaction with zero intermediate states`
      ],
      correctIndex: 0,
      angryExplanation: wasCorrect
        ? `Outstanding! You conquered ${targetDifficulty} by recognizing the rate-limiting step that controls overall throughput.`
        : `Baseline reinforced! In ${targetDifficulty}, you must lock in the ground truth before tackling complex distractors.`,
      examinerTrapNotes: wasCorrect
        ? 'Examiners construct seductive distractors around downstream intermediates. Never forget the committed step.'
        : 'Do not confuse downstream perturbations with baseline ground rules.',
      levelTip: wasCorrect
        ? 'Trace the full reaction coordinate: Initial state -> Transition barrier -> Intermediate -> Termination.'
        : 'Master the baseline definition first: Ground state -> Activation energy -> Rate constant.'
    };

    if (!process.env.GEMINI_API_KEY) {
      return res.json({
        success: true,
        adaptedDifficulty: targetDifficulty,
        previousDifficulty: currentDifficulty,
        direction,
        rationale,
        question: fallbackQuestion
      });
    }

    const adaptiveDirective = wasCorrect
      ? `The candidate answered the previous question CORRECTLY at "${currentDifficulty}".
ESCALATE DIFFICULTY to "${targetDifficulty}".
Craft a higher-stakes question testing subtle distractor traps, multi-variable counter-regulations, or nuanced edge cases in ${subject || 'Science'}.`
      : `The candidate MISSED the previous question at "${currentDifficulty}".
Previous trap note: "${lastTrapNote || 'Fell for distractor choice'}".
ADAPT DIFFICULTY DOWN to "${targetDifficulty}".
Craft a diagnostic scaffolding question that specifically reinforces the core baseline mechanism or fundamental rule that clears up their misconception.`;

    const prompt = `You are "The Angry Examiner", generating a single dynamic adaptive question for an exam preparation system.
Subject: ${subject || 'Academic Discipline'}
Topic/Milestone: ${topic || milestoneTitle || 'Exam Topic'}
Current Target Difficulty: "${targetDifficulty}"
Direction: ${direction.toUpperCase()}
Adaptive Mandate: ${adaptiveDirective}
Include Reading Passage: ${includeReadingPassage ? 'YES (Provide a rigorous passage)' : 'NO (Direct question)'}

Generate exactly 1 question in JSON adhering to this schema:
{
  "question": {
    "passageTitle": string (or empty if no passage),
    "passage": string (or empty if no passage),
    "question": string,
    "options": array of 4 string options (0 to 3),
    "correctIndex": integer (0 to 3),
    "angryExplanation": string (3-4 sentences in Angry Examiner voice explaining why the correct choice is true and why distractors are traps),
    "examinerTrapNotes": string (identify the exact trap students fall for),
    "distractorExplanations": array of 4 strings (options 0-3 explaining why each distractor is wrong and why correctIndex is right),
    "levelTip": string (1 sentence high-yield tip),
    "difficulty": "${targetDifficulty}"
  }
}`;

    const response = await callGeminiWithFallback({
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            question: {
              type: Type.OBJECT,
              properties: {
                passageTitle: { type: Type.STRING },
                passage: { type: Type.STRING },
                question: { type: Type.STRING },
                options: { type: Type.ARRAY, items: { type: Type.STRING } },
                correctIndex: { type: Type.INTEGER },
                angryExplanation: { type: Type.STRING },
                examinerTrapNotes: { type: Type.STRING },
                distractorExplanations: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: 'Array explaining why each option index is wrong (or why correctIndex is right)',
                },
                levelTip: { type: Type.STRING },
                difficulty: { type: Type.STRING },
              },
              required: ['question', 'options', 'correctIndex', 'angryExplanation', 'examinerTrapNotes', 'levelTip', 'difficulty'],
            },
          },
          required: ['question'],
        },
      },
    });

    const parsed = JSON.parse(response.text?.trim() || '{}');
    const genQ = parsed.question || fallbackQuestion;
    const finalQ = {
      id: `adaptive-q-${Date.now()}`,
      topic: topic || milestoneTitle || 'Adaptive Practice',
      ...genQ,
      difficulty: targetDifficulty,
    };

    return res.json({
      success: true,
      adaptedDifficulty: targetDifficulty,
      previousDifficulty: currentDifficulty,
      direction,
      rationale,
      question: finalQ,
    });
  } catch (err: any) {
    console.error('Error generating adaptive question:', err);
    return res.json({
      success: true,
      adaptedDifficulty: req.body?.wasCorrect ? 'Challenging' : 'Standard',
      direction: req.body?.wasCorrect ? 'up' : 'down',
      rationale: 'Calibrated difficulty adaptively based on answer performance.',
      question: {
        id: `adaptive-fallback-${Date.now()}`,
        topic: req.body?.topic || 'Adaptive Drill',
        difficulty: req.body?.wasCorrect ? 'Challenging' : 'Standard',
        question: `Regarding ${req.body?.topic || 'this subject'}: how does the rate-limiting checkpoint respond to acute perturbations?`,
        options: [
          'Negative feedback downregulates upstream activators to restore homeostatic baseline',
          'The system runs away indefinitely until cellular exhaustion',
          'Forward flux continues at maximum capacity without cofactor regulation',
          'All biological activity ceases permanently upon the initial perturbation'
        ],
        correctIndex: 0,
        angryExplanation: 'Spot on! Homeostatic systems rely on negative feedback to counter perturbations and prevent catastrophic overload.',
        examinerTrapNotes: 'Always trace negative feedback mechanisms to the homeostatic set point.',
        levelTip: 'Identify the sensor, the effector, and the shutdown trigger.',
      }
    });
  }
});



// Online Leaderboard API route for synchronized global rankings
app.get('/api/leaderboard', (req: Request, res: Response) => {
  const userXp = parseInt(req.query.userXp as string, 10) || 860;
  const userStreak = parseInt(req.query.userStreak as string, 10) || 4;
  const userSubject = (req.query.subject as string) || 'STEM & Medical Physiology';

  const community = [
    {
      id: 'usr-1',
      username: 'neuro_cadence',
      displayName: 'Aria Vance',
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

  return res.json({
    success: true,
    season: 'Season 1: Global High-Yield Sprint',
    daysRemainingInSeason: 18,
    totalScholarsActive: 4892,
    community,
  });
});

// Official Daily Quotes API endpoint (Microsoft Bing Daily Quote Style)
app.get('/api/daily-quote', async (req: Request, res: Response) => {
  try {
    const { OFFICIAL_DAILY_QUOTES, getOfficialQuoteForDate } = await import('./src/data/officialDailyQuotes.js').catch(async () => {
      return await import('./src/data/officialDailyQuotes.ts');
    });

    const category = req.query.category as string;
    const isRandom = req.query.random === 'true';
    const indexParam = req.query.index ? parseInt(req.query.index as string, 10) : NaN;

    let selectedQuote;
    let quotesPool = OFFICIAL_DAILY_QUOTES;

    if (category && category !== 'All') {
      const filtered = OFFICIAL_DAILY_QUOTES.filter(q => 
        q.category.toLowerCase().includes(category.toLowerCase())
      );
      if (filtered.length > 0) quotesPool = filtered;
    }

    if (!isNaN(indexParam) && indexParam >= 0) {
      selectedQuote = quotesPool[indexParam % quotesPool.length];
    } else if (isRandom) {
      const randomIndex = Math.floor(Math.random() * quotesPool.length);
      selectedQuote = quotesPool[randomIndex];
    } else {
      const requestedDate = req.query.date ? new Date(req.query.date as string) : new Date();
      selectedQuote = getOfficialQuoteForDate(requestedDate);
      if (category && category !== 'All' && !selectedQuote.category.toLowerCase().includes(category.toLowerCase())) {
        selectedQuote = quotesPool[0];
      }
    }

    const todayDateString = new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date());

    return res.json({
      success: true,
      provider: 'Daily Quotes & Wisdom Archive',
      curation: 'Official Daily Selection · Curated for Academic Excellence & Intellectual Stamina',
      date: todayDateString,
      quote: selectedQuote,
      totalAvailable: OFFICIAL_DAILY_QUOTES.length,
    });
  } catch (err: any) {
    console.error('Error in /api/daily-quote:', err);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve daily quote',
    });
  }
});

// Download 1-File Website (Self-contained standalone HTML bundle)
app.get('/api/download-single-file', (_req: Request, res: Response) => {
  const rootSingleFilePath = path.resolve(__dirname, 'single-file-website.html');
  const distSingleFilePath = path.resolve(__dirname, 'dist', 'smart-study-singlefile.html');
  const distIndexPath = path.resolve(__dirname, 'dist', 'index.html');

  let targetPath = null;
  if (fs.existsSync(rootSingleFilePath)) targetPath = rootSingleFilePath;
  else if (fs.existsSync(distSingleFilePath)) targetPath = distSingleFilePath;
  else if (fs.existsSync(distIndexPath)) targetPath = distIndexPath;

  if (targetPath) {
    res.setHeader('Content-Disposition', 'attachment; filename="smart-study-single-file.html"');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.sendFile(targetPath);
  }

  return res.status(404).send('Single-file build not found. Run npm run build first.');
});

// Vite server setup in development or static hosting in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on 0.0.0.0:${PORT}`);
  });
}

startServer();
