import React, { useState, useEffect, useMemo } from 'react';
import {
  CheckCircle2,
  Circle,
  Sparkles,
  Zap,
  Target,
  Flame,
  Award,
  BookOpen,
  Edit3,
  Search,
  Shield,
  HelpCircle,
  Play,
  RotateCcw,
  RefreshCw,
  Check,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Lightbulb,
  Maximize2,
  Volume2,
  Trash2,
  Plus,
  Send,
  Timer
} from 'lucide-react';
import {
  playCorrectSound,
  playIncorrectSound,
  playStreakFlameSound,
  playVivaGavelSound,
  playTimerTickSound
} from '../utils/audio';

export type ActionItemType =
  | 'highlight-annotation'
  | 'draft-thematic-claims'
  | 'trap-defuser'
  | 'pressure-viva'
  | 'mechanism-recall'
  | 'general-mission';

export function detectActionItemType(actionText: string): ActionItemType {
  const lower = actionText.toLowerCase();

  if (
    lower.includes('draft 3 non-obvious') ||
    lower.includes('thematic claim') ||
    (lower.includes('draft') && (lower.includes('claim') || lower.includes('thes') || lower.includes('syntax'))) ||
    lower.includes('syntax and craft')
  ) {
    return 'draft-thematic-claims';
  }

  if (
    lower.includes('annotate') ||
    lower.includes('highlight') ||
    lower.includes('passage') ||
    lower.includes('ethos') ||
    lower.includes('logos') ||
    lower.includes('pathos') ||
    lower.includes('antithesis') ||
    lower.includes('isolating')
  ) {
    return 'highlight-annotation';
  }

  if (
    lower.includes('spot and eliminate') ||
    lower.includes('distractor') ||
    lower.includes('trap') ||
    lower.includes('pairing') ||
    (lower.includes('pair') && lower.includes('evidence'))
  ) {
    return 'trap-defuser';
  }

  if (
    lower.includes('viva') ||
    lower.includes('interview') ||
    lower.includes('60-second') ||
    lower.includes('pressure')
  ) {
    return 'pressure-viva';
  }

  if (
    lower.includes('mechanism') ||
    lower.includes('diagram') ||
    lower.includes('explain') && lower.includes('without notes') ||
    lower.includes('kinetics') ||
    lower.includes('flashcard') ||
    lower.includes('action potential')
  ) {
    return 'mechanism-recall';
  }

  return 'general-mission';
}

// ============================================================================
// 1. INTERACTIVE TEXT HIGHLIGHTER & ANNOTATION WORKBENCH
// ============================================================================
interface AnnotationSpan {
  id: string;
  text: string;
  type: 'ethos' | 'syntax' | 'pathos' | 'trap';
  questTitle: string;
  questHint: string;
  note: string;
}

interface PassageClause {
  id: string;
  text: string;
  targetId?: string;
}

const PASSAGE_TARGETS: AnnotationSpan[] = [
  {
    id: 't1',
    text: 'disturbed, with profane fingers, the tremendous secrets of the human frame',
    type: 'syntax',
    questTitle: 'Target 1: Locate Syntactic Craft (Antithetical Chiasmus & Delay)',
    questHint: 'Find where syntactic phrasing grammatically separates the profane from the sacred.',
    note: 'Antithetical Chiasmus & Polysyndeton: The syntactic delay between "profane fingers" and "tremendous secrets" grammatically encodes the sacrilegious rupture of divine order.'
  },
  {
    id: 't2',
    text: 'or rather cell',
    type: 'syntax',
    questTitle: 'Target 2: Locate Epanorthosis (Parenthetical Self-Correction)',
    questHint: 'Find where the narrator pauses to revise a word, revealing subconscious confinement.',
    note: 'Syntactic Parenthetical Correction (Epanorthosis): The revision from "chamber" to "cell" linguistically imprisons the creator before creation begins.'
  },
  {
    id: 't3',
    text: 'Life and death appeared to me ideal bounds, which I should first break through',
    type: 'ethos',
    questTitle: 'Target 3: Locate Hubristic Authorial Ethos',
    questHint: 'Find where the narrator dismisses absolute existential boundaries as mere intellectual obstacles.',
    note: 'Hubristic Authorial Ethos: Dismissing existential boundaries as mere "ideal bounds" exposes the megalomaniacal rationalization driving the tragedy.'
  },
  {
    id: 't4',
    text: 'my human nature turn with loathing from my occupation',
    type: 'pathos',
    questTitle: 'Target 4: Locate Visceral Pathos (Somatic Conflict)',
    questHint: 'Find where the narrator’s physical bodily revulsion revolts against their intellectual obsession.',
    note: 'Visceral Pathos & Internal Schism: The somatic revulsion ("loathing") wars against intellectual obsession, demonstrating moral dissociation.'
  }
];

const PASSAGE_CLAUSES: PassageClause[] = [
  { id: 'c1', text: 'I collected bones from charnel-houses and ' },
  { id: 't1', text: 'disturbed, with profane fingers, the tremendous secrets of the human frame', targetId: 't1' },
  { id: 'c2', text: '. In a solitary chamber, ' },
  { id: 't2', text: 'or rather cell', targetId: 't2' },
  { id: 'c3', text: ', at the top of the house, and separated from all other apartments by a gallery and staircase, I kept my workshop of filthy creation; ' },
  { id: 'c4', text: 'my eyeballs were starting from their sockets in attending to the details of my employment. ' },
  { id: 'c5', text: 'The dissecting room and the slaughter-house furnished many of my materials; and often did ' },
  { id: 't4', text: 'my human nature turn with loathing from my occupation', targetId: 't4' },
  { id: 'c6', text: ', whilst, still urged on by an eagerness which perpetually increased, I brought my work near to a conclusion. ' },
  { id: 't3', text: 'Life and death appeared to me ideal bounds, which I should first break through', targetId: 't3' },
  { id: 'c7', text: ', and pour a torrent of light into our dark world.' }
];

const TextHighlightWorkbench: React.FC<{
  actionItem: string;
  onComplete: () => void;
  isCompleted: boolean;
}> = ({ actionItem, onComplete, isCompleted }) => {
  const [selectedTool, setSelectedTool] = useState<'syntax' | 'ethos' | 'pathos' | 'trap'>('syntax');
  const [annotatedIds, setAnnotatedIds] = useState<string[]>([]);
  const [comboCount, setComboCount] = useState<number>(0);
  const [activeFeedback, setActiveFeedback] = useState<string | null>(null);

  const tools = [
    { id: 'syntax', label: 'Syntax & Rhetorical Device', color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40', activeBg: 'bg-cyan-500 text-slate-950', dot: 'bg-cyan-400' },
    { id: 'ethos', label: 'Ethos & Authorial Authority', color: 'bg-amber-500/20 text-amber-300 border-amber-500/40', activeBg: 'bg-amber-500 text-slate-950', dot: 'bg-amber-400' },
    { id: 'pathos', label: 'Pathos & Visceral Impact', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40', activeBg: 'bg-emerald-500 text-slate-950', dot: 'bg-emerald-400' },
    { id: 'trap', label: 'Distractor Trap / Fallacy', color: 'bg-rose-500/20 text-rose-300 border-rose-500/40', activeBg: 'bg-rose-500 text-slate-950', dot: 'bg-rose-400' }
  ];

  const handleClauseClick = (clause: PassageClause) => {
    if (!clause.targetId) {
      setActiveFeedback(`ℹ️ Plot & Setting Clause: "${clause.text.trim()}". This describes chronological plot progression. Search for where authorial syntax, tone, or intense conflict occurs.`);
      return;
    }

    const target = PASSAGE_TARGETS.find(t => t.id === clause.targetId);
    if (!target) return;

    if (annotatedIds.includes(target.id)) {
      setActiveFeedback(`Already Annotated: "${target.text.slice(0, 35)}..." — ${target.note}`);
      return;
    }

    const nextAnnotated = [...annotatedIds, target.id];
    setAnnotatedIds(nextAnnotated);
    setComboCount(c => c + 1);
    playCorrectSound();
    playStreakFlameSound();
    setActiveFeedback(`🎯 Target Discovered! +25 XP: "${target.text.slice(0, 35)}..." — ${target.note}`);

    if (nextAnnotated.length >= PASSAGE_TARGETS.length) {
      onComplete();
      playVivaGavelSound();
    }
  };

  const allComplete = annotatedIds.length >= PASSAGE_TARGETS.length;

  return (
    <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xl">
      {/* Workbench Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
              Interactive Text Workbench
            </span>
            <span className="text-xs text-slate-400 font-mono-numbers">
              {annotatedIds.length} / {PASSAGE_TARGETS.length} Rhetorical Targets Discovered
            </span>
          </div>
          <h4 className="text-sm font-bold text-white mt-1">
            The Modern Prometheus & Narrative Cadence <span className="text-xs text-slate-400 font-normal">· Mary Shelley, Frankenstein (1818)</span>
          </h4>
        </div>

        {/* Combo & Progress Badges & Reset Button */}
        <div className="flex items-center gap-2">
          {comboCount > 1 && (
            <span className="px-2 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold font-mono-numbers flex items-center gap-1 animate-pulse">
              <Flame className="w-3.5 h-3.5 fill-amber-400" />
              <span>{comboCount}x Streak Combo!</span>
            </span>
          )}
          {allComplete && (
            <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Mastered (+100 XP)</span>
            </span>
          )}
          {annotatedIds.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setAnnotatedIds([]);
                setComboCount(0);
                setActiveFeedback(null);
              }}
              className="px-2 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Clear Highlights</span>
            </button>
          )}
        </div>
      </div>

      {/* Highlighter Palette Tools */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[11px] font-semibold text-slate-400 mr-1">Active Highlighter:</span>
        {tools.map(tool => (
          <button
            key={tool.id}
            type="button"
            onClick={() => setSelectedTool(tool.id as any)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
              selectedTool === tool.id
                ? `${tool.activeBg} shadow-md`
                : `${tool.color} hover:bg-slate-900`
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${tool.dot}`} />
            <span>{tool.label}</span>
          </button>
        ))}
      </div>

      {/* Interactive Passage Display - Clean, zero-spoiler rendering where all clauses are clickable */}
      <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 text-xs sm:text-sm text-slate-200 leading-relaxed font-serif relative">
        <p className="select-text leading-loose">
          {PASSAGE_CLAUSES.map(clause => {
            const isAnnotated = clause.targetId && annotatedIds.includes(clause.targetId);
            const target = clause.targetId ? PASSAGE_TARGETS.find(t => t.id === clause.targetId) : null;

            let spanStyle = 'text-slate-200 hover:text-white hover:bg-slate-800/80 rounded px-1 transition-colors cursor-pointer';
            if (isAnnotated && target) {
              if (target.type === 'syntax') spanStyle = 'bg-cyan-500/30 text-cyan-200 border-b-2 border-cyan-400 px-1 rounded font-semibold';
              else if (target.type === 'ethos') spanStyle = 'bg-amber-500/30 text-amber-200 border-b-2 border-amber-400 px-1 rounded font-semibold';
              else if (target.type === 'pathos') spanStyle = 'bg-emerald-500/30 text-emerald-200 border-b-2 border-emerald-400 px-1 rounded font-semibold';
              else spanStyle = 'bg-rose-500/30 text-rose-200 border-b-2 border-rose-400 px-1 rounded font-semibold';
            }

            return (
              <span
                key={clause.id}
                onClick={() => handleClauseClick(clause)}
                className={spanStyle}
              >
                {clause.text}
              </span>
            );
          })}
        </p>
      </div>

      {/* Target Discovery Checklist - Mystery Quests that ONLY reveal answers after user discovers them! */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
        {PASSAGE_TARGETS.map(t => {
          const isDone = annotatedIds.includes(t.id);
          return (
            <div
              key={t.id}
              className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 transition-all ${
                isDone
                  ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-200'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400'
              }`}
            >
              <div className="mt-0.5 shrink-0">
                {isDone ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Circle className="w-4 h-4 text-slate-500" />
                )}
              </div>
              <div className="space-y-1">
                <span className={`font-semibold block text-[11px] ${isDone ? 'text-white' : 'text-slate-300'}`}>
                  {isDone ? `✓ Discovered: "${t.text.slice(0, 32)}..."` : t.questTitle}
                </span>
                <span className="text-[10px] text-slate-400 block leading-relaxed">
                  {isDone ? t.note : `🔍 Quest Hint: ${t.questHint}`}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Live Feedback Toast */}
      {activeFeedback && (
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-center justify-between animate-fadeIn">
          <span>{activeFeedback}</span>
          <button
            type="button"
            onClick={() => setActiveFeedback(null)}
            className="text-amber-400 hover:text-white font-bold ml-2 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// 2. INTERACTIVE THEMATIC CLAIM & SYNTAX CRUCIBLE WORKSHOP
// ============================================================================
interface ThematicClaimDraft {
  id: number;
  syntaxCraft: string;
  mechanicalFunction: string;
  thematicInsight: string;
  customDraftText: string;
  score: number;
  grade: string;
  isAudited: boolean;
}

const CRAFT_OPTIONS = [
  'Polysyndetic escalation with breathless conjunctions',
  'Hypotactic subordinate syntax & delayed clause resolution',
  'Antithetical chiasmus balancing opposing polarities',
  'Staccato monosyllabic imperative phrasing',
  'Passive voice syntactic displacement erasing moral agency',
  'Asyndetic accumulation of sensory nouns'
];

const FUNCTION_OPTIONS = [
  "disrupts the reader's expectation of narrative stability by",
  "linguistically embodies the narrator's deteriorating autonomy to",
  "forces the audience into claustrophobic complicity while",
  "undermines the overt authoritative ethos to reveal how",
  "syntactically delays resolution, exposing how"
];

const THEME_OPTIONS = [
  'institutional dogma manufactures obedience under the guise of benevolence.',
  'intellectual hubris inevitably alienates the thinker from shared humanity.',
  'grief operates not as linear progression, but as an inescapable spatial enclosure.',
  'the moral boundary between creator and monster collapses into reciprocal victimhood.',
  'manufactured logic masks profound existential dread.'
];

const ThematicClaimBuilder: React.FC<{
  actionItem: string;
  onComplete: () => void;
  isCompleted: boolean;
}> = ({ actionItem, onComplete, isCompleted }) => {
  const [activeSlot, setActiveSlot] = useState<number>(0); // 0, 1, 2 for the 3 claims
  const [claims, setClaims] = useState<ThematicClaimDraft[]>([
    {
      id: 1,
      syntaxCraft: CRAFT_OPTIONS[0],
      mechanicalFunction: FUNCTION_OPTIONS[0],
      thematicInsight: THEME_OPTIONS[0],
      customDraftText: '',
      score: 0,
      grade: '',
      isAudited: false
    },
    {
      id: 2,
      syntaxCraft: CRAFT_OPTIONS[1],
      mechanicalFunction: FUNCTION_OPTIONS[1],
      thematicInsight: THEME_OPTIONS[1],
      customDraftText: '',
      score: 0,
      grade: '',
      isAudited: false
    },
    {
      id: 3,
      syntaxCraft: CRAFT_OPTIONS[2],
      mechanicalFunction: FUNCTION_OPTIONS[2],
      thematicInsight: THEME_OPTIONS[2],
      customDraftText: '',
      score: 0,
      grade: '',
      isAudited: false
    }
  ]);

  const currentClaim = claims[activeSlot];

  // Auto-compose sentence from parts if customDraftText is empty
  const composedSentence = useMemo(() => {
    if (currentClaim.customDraftText.trim()) return currentClaim.customDraftText;
    return `Through ${currentClaim.syntaxCraft.toLowerCase()}, the author ${currentClaim.mechanicalFunction} ${currentClaim.thematicInsight}`;
  }, [currentClaim]);

  const handleAuditClaim = (slotIdx: number) => {
    const claim = claims[slotIdx];
    const text = claim.customDraftText.trim() || composedSentence;

    // Evaluate claim
    const hasSyntax = CRAFT_OPTIONS.some(c => text.toLowerCase().includes(c.split(' ')[0].toLowerCase())) || text.length > 30;
    const hasFunction = text.length > 45;
    const hasTheme = text.length > 60;

    let score = 70;
    if (hasSyntax) score += 10;
    if (hasFunction) score += 10;
    if (hasTheme) score += 10;
    score = Math.min(99, score);

    const grade = score >= 90 ? 'FIRST-CLASS HONORS (ZERO PLOT SLOP)' : score >= 80 ? 'STRONG 2:1 MERIT' : 'PASS WITH REVISION';

    const updated = [...claims];
    updated[slotIdx] = {
      ...claim,
      score,
      grade,
      isAudited: true,
      customDraftText: text
    };
    setClaims(updated);

    playCorrectSound();
    playStreakFlameSound();

    // Check if all 3 audited
    if (updated.every(c => c.isAudited)) {
      onComplete();
      playVivaGavelSound();
    }
  };

  const allAudited = claims.every(c => c.isAudited);
  const totalScore = Math.round(claims.reduce((acc, c) => acc + (c.isAudited ? c.score : 0), 0) / 3);

  return (
    <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-5 shadow-xl">
      {/* Workshop Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
              Thematic Claim Synthesizer
            </span>
            <span className="text-xs text-slate-400 font-mono-numbers">
              {claims.filter(c => c.isAudited).length} / 3 Claims Certified
            </span>
          </div>
          <h4 className="text-sm font-bold text-white mt-1">
            Draft 3 Non-Obvious Thematic Claims (Syntax & Craft Crucible)
          </h4>
        </div>

        {allAudited ? (
          <div className="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold flex items-center gap-1.5">
            <Award className="w-4 h-4 text-emerald-400" />
            <span>All 3 Claims Certified ({totalScore}/100 Average)</span>
          </div>
        ) : (
          <span className="text-xs text-amber-400 font-mono-numbers font-semibold">
            +25 XP per audited claim (+75 XP Total)
          </span>
        )}
      </div>

      {/* 3 Claim Tabs */}
      <div className="flex items-center gap-2">
        {claims.map((c, idx) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setActiveSlot(idx)}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 border ${
              activeSlot === idx
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md font-extrabold'
                : c.isAudited
                ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/40 hover:bg-slate-900'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <span>Claim #{c.id}</span>
            {c.isAudited && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
          </button>
        ))}
      </div>

      {/* Active Claim Builder Elements */}
      <div className="space-y-4 bg-slate-900/60 p-4 rounded-xl border border-slate-800/80">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-amber-400 uppercase tracking-wider">
            Drafting Claim 0{activeSlot + 1} of 03:
          </span>
          {currentClaim.isAudited && (
            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono-numbers font-bold">
              ★ {currentClaim.score}/100 · {currentClaim.grade}
            </span>
          )}
        </div>

        {/* Step 1: Specific Syntax / Craft Element */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold text-slate-400 block">
            1. Select or Customize Specific Syntax / Craft Device:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {CRAFT_OPTIONS.map(craft => (
              <button
                key={craft}
                type="button"
                onClick={() => {
                  const updated = [...claims];
                  updated[activeSlot].syntaxCraft = craft;
                  updated[activeSlot].customDraftText = '';
                  setClaims(updated);
                }}
                className={`text-left p-2 rounded-lg text-[11px] transition-colors cursor-pointer border ${
                  currentClaim.syntaxCraft === craft
                    ? 'bg-amber-500/20 border-amber-500/40 text-amber-200 font-semibold'
                    : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                {craft}
              </button>
            ))}
          </div>
        </div>

        {/* Step 2: Mechanical Syntactic Function */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold text-slate-400 block">
            2. Connective Function (HOW the Craft Constructs Meaning):
          </label>
          <select
            value={currentClaim.mechanicalFunction}
            onChange={e => {
              const updated = [...claims];
              updated[activeSlot].mechanicalFunction = e.target.value;
              updated[activeSlot].customDraftText = '';
              setClaims(updated);
            }}
            className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 cursor-pointer"
          >
            {FUNCTION_OPTIONS.map(fn => (
              <option key={fn} value={fn}>
                {fn}
              </option>
            ))}
          </select>
        </div>

        {/* Step 3: Non-Obvious Thematic Meaning */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold text-slate-400 block">
            3. Non-Obvious Thematic Insight (Anti-Plot Summary):
          </label>
          <select
            value={currentClaim.thematicInsight}
            onChange={e => {
              const updated = [...claims];
              updated[activeSlot].thematicInsight = e.target.value;
              updated[activeSlot].customDraftText = '';
              setClaims(updated);
            }}
            className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 cursor-pointer"
          >
            {THEME_OPTIONS.map(theme => (
              <option key={theme} value={theme}>
                {theme}
              </option>
            ))}
          </select>
        </div>

        {/* Full Synthesized Preview & Custom Polish */}
        <div className="space-y-1.5 pt-2">
          <label className="text-[11px] font-semibold text-amber-400 flex items-center justify-between">
            <span>Synthesized Claim (Edit directly to refine phrasing):</span>
            <span className="text-slate-500 font-normal">Direct thesis sentence</span>
          </label>
          <textarea
            rows={3}
            value={currentClaim.customDraftText || composedSentence}
            onChange={e => {
              const updated = [...claims];
              updated[activeSlot].customDraftText = e.target.value;
              setClaims(updated);
            }}
            className="w-full p-3 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-100 font-serif leading-relaxed focus:border-amber-400 focus:outline-none"
            placeholder="Edit or type your refined thematic claim here..."
          />
        </div>

        {/* Audit Button */}
        <div className="flex items-center justify-between pt-1">
          <button
            type="button"
            onClick={() => handleAuditClaim(activeSlot)}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-slate-950 font-bold text-xs flex items-center gap-2 cursor-pointer shadow-md transition-all"
          >
            <Sparkles className="w-3.5 h-3.5 fill-slate-950" />
            <span>Audit & Certify Claim #{activeSlot + 1} (+25 XP)</span>
          </button>

          {activeSlot < 2 && (
            <button
              type="button"
              onClick={() => setActiveSlot(activeSlot + 1)}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
            >
              <span>Next Claim</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 3. INTERACTIVE DISTRACTOR TRAP DEFUSER & EVIDENCE PAIRING ARENA
// ============================================================================
interface TrapChallenge {
  id: number;
  domain: string;
  promptClaim: string;
  sourceContext?: string;
  options: {
    id: string;
    text: string;
    isTrap: boolean;
    trapExplanation: string;
    isCorrectProof: boolean;
  }[];
}

const TRAP_CHALLENGES: TrapChallenge[] = [
  {
    id: 1,
    domain: 'Literary Craft & Tone',
    promptClaim: 'Claim: The narrator’s obsessive rhetoric exposes that scientific hubris masquerades as altruistic enlightenment.',
    sourceContext: 'Mary Shelley, Frankenstein (1818)',
    options: [
      {
        id: 'o1',
        text: 'Victor was born in Geneva and had loving parents who supported his early education in natural philosophy.',
        isTrap: true,
        trapExplanation: 'Literal Plot Event Trap: Factually accurate in the story, but completely devoid of analytical proof for hubristic rhetoric.',
        isCorrectProof: false
      },
      {
        id: 'o2',
        text: '"A new species would bless me as its creator and source; many happy and excellent natures would owe their being to me."',
        isTrap: false,
        trapExplanation: '',
        isCorrectProof: true
      },
      {
        id: 'o3',
        text: 'Victor wanted to help all humanity overcome physical illness and achieve worldwide happiness.',
        isTrap: true,
        trapExplanation: 'Superficial Face-Value Trap: Accepts Victor’s self-justification at face value without interrogating the underlying craft.',
        isCorrectProof: false
      },
      {
        id: 'o4',
        text: 'Mary Shelley began drafting the novel in 1816 during a rainy summer in Switzerland alongside Lord Byron.',
        isTrap: true,
        trapExplanation: 'Biographical Trivia Trap: Accurate historical context that fails to analyze textual syntax or speaker rhetoric.',
        isCorrectProof: false
      }
    ]
  },
  {
    id: 2,
    domain: 'Syntactic & Rhetorical Mechanics',
    promptClaim: 'Claim: Syntactic delay and breathless polysyndeton linguistically mirror the psychological breakdown of the protagonist.',
    sourceContext: 'Mary Shelley, Frankenstein (1818)',
    options: [
      {
        id: 'o5',
        text: 'The author wrote the novel in 1818 during a rainy summer in Switzerland surrounded by poets.',
        isTrap: true,
        trapExplanation: 'Biographical Irrelevance Trap: True historical context that fails to analyze syntax or text mechanics.',
        isCorrectProof: false
      },
      {
        id: 'o6',
        text: '"I collected bones... and disturbed... and separated... and slaughter-house furnished... whilst still urged on."',
        isTrap: false,
        trapExplanation: '',
        isCorrectProof: true
      },
      {
        id: 'o7',
        text: 'The monster later murders William in the forest because he is furious at Victor’s negligence.',
        isTrap: true,
        trapExplanation: 'Plot Consequence Trap: True chronological event, but offers zero syntactic evidence.',
        isCorrectProof: false
      },
      {
        id: 'o8',
        text: 'Obsession is dangerous because prolonged intellectual isolation naturally impairs healthy human judgment.',
        isTrap: true,
        trapExplanation: 'Thematic Moralizing Trap: A generic ethical platitude that quotes no textual syntax or sentence structure.',
        isCorrectProof: false
      }
    ]
  },
  {
    id: 3,
    domain: 'Historical Rhetoric & Antithesis',
    promptClaim: 'Claim: The speaker employs rigorous antithesis to unmask the unbridgeable chasm between patriotic celebration and systemic chattel bondage.',
    sourceContext: 'Frederick Douglass, "What to the Slave is the Fourth of July?" (1852)',
    options: [
      {
        id: 'o9',
        text: '"The sunlight that brought light and healing to you, has brought stripes and death to me. This Fourth of July is yours, not mine. You may rejoice, I must mourn."',
        isTrap: false,
        trapExplanation: '',
        isCorrectProof: true
      },
      {
        id: 'o10',
        text: 'Douglass delivered his oration in Rochester, New York on July 5, 1852 before the Rochester Ladies’ Anti-Slavery Society.',
        isTrap: true,
        trapExplanation: 'Historical Setting Trap: Factually true circumstance, but offers zero syntactic evidence of antithetical rhetoric.',
        isCorrectProof: false
      },
      {
        id: 'o11',
        text: 'The speaker expresses polite gratitude for all the constitutional benefits his listeners enjoy.',
        isTrap: true,
        trapExplanation: 'Literal Surface Trap: Mistaking prefatory polite rhetorical framing for the speech’s substantive antithetical claim.',
        isCorrectProof: false
      },
      {
        id: 'o12',
        text: 'The Declaration of Independence was drafted in 1776 by Thomas Jefferson and established foundational American values.',
        isTrap: true,
        trapExplanation: 'Foundational Knowledge Trap: Relevant historical fact that contains no textual evidence of Douglass’s craft.',
        isCorrectProof: false
      }
    ]
  },
  {
    id: 4,
    domain: 'Scientific Mechanisms & Homeostasis',
    promptClaim: 'Claim: Allosteric negative feedback preserves metabolic equilibrium by decoupling downstream product inhibition from active-site substrate competition.',
    sourceContext: 'Biochemical Regulation & Cellular Physiology',
    options: [
      {
        id: 'o13',
        text: '"Excess pathway end-product binds a distinct regulatory domain, inducing a conformational shift that lowers Vmax while leaving the substrate-binding cleft unaltered."',
        isTrap: false,
        trapExplanation: '',
        isCorrectProof: true
      },
      {
        id: 'o14',
        text: 'Enzymes are protein catalysts that accelerate chemical reactions in biological systems by lowering activation energy.',
        isTrap: true,
        trapExplanation: 'Introductory Definition Trap: A standard biological fact that does not prove allosteric feedback decoupling.',
        isCorrectProof: false
      },
      {
        id: 'o15',
        text: 'When too much product accumulates, the enzyme permanently denatures and dissolves into constituent amino acids.',
        isTrap: true,
        trapExplanation: 'Irreversible Destruction Fallacy: Confuses reversible allosteric regulation with permanent chemical denaturation.',
        isCorrectProof: false
      },
      {
        id: 'o16',
        text: 'Living cells intuitively recognize when metabolic balance is achieved and pause work accordingly.',
        isTrap: true,
        trapExplanation: 'Teleological Hand-Waving Trap: Replaces specific biochemical receptor mechanics with anthropomorphic intentions.',
        isCorrectProof: false
      }
    ]
  }
];

const TrapDefuserArena: React.FC<{
  actionItem: string;
  onComplete: () => void;
  isCompleted: boolean;
}> = ({ actionItem, onComplete, isCompleted }) => {
  const [currentRoundIdx, setCurrentRoundIdx] = useState<number>(0);
  const [shuffleCounter, setShuffleCounter] = useState<number>(0);
  const [evaluatedOptions, setEvaluatedOptions] = useState<Record<string, {
    action: 'evidence' | 'trap';
    isCorrect: boolean;
    feedback: string;
  }>>({});
  const [selectedProof, setSelectedProof] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const round = TRAP_CHALLENGES[currentRoundIdx] || TRAP_CHALLENGES[0];

  // Dynamically shuffle options so the correct answer is NEVER in a predictable slot
  const currentOptions = useMemo(() => {
    const list = [...round.options];
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }
    return list;
  }, [currentRoundIdx, round, shuffleCounter]);

  // Reset local state when challenge changes or resets
  const handleNextChallenge = () => {
    if (currentRoundIdx < TRAP_CHALLENGES.length - 1) {
      setCurrentRoundIdx(c => c + 1);
    } else {
      setCurrentRoundIdx(0);
    }
    setSelectedProof(null);
    setEvaluatedOptions({});
    setFeedback(null);
    setShuffleCounter(s => s + 1);
  };

  const handlePrevChallenge = () => {
    if (currentRoundIdx > 0) {
      setCurrentRoundIdx(c => c - 1);
    } else {
      setCurrentRoundIdx(TRAP_CHALLENGES.length - 1);
    }
    setSelectedProof(null);
    setEvaluatedOptions({});
    setFeedback(null);
    setShuffleCounter(s => s + 1);
  };

  const handleResetChallenge = () => {
    setSelectedProof(null);
    setEvaluatedOptions({});
    setFeedback(null);
    setShuffleCounter(s => s + 1);
  };

  const handleSelectAsEvidence = (optId: string, isCorrectProof: boolean) => {
    if (isCorrectProof) {
      setSelectedProof(optId);
      setEvaluatedOptions(prev => ({
        ...prev,
        [optId]: {
          action: 'evidence',
          isCorrect: true,
          feedback: '✓ Claim Authenticated! (+50 XP) This excerpt directly provides substantive textual evidence of authorial craft and rhetoric without relying on superficial plot summary.'
        }
      }));
      playCorrectSound();
      playStreakFlameSound();
      setFeedback('🎯 Target Claim Validated! (+50 XP) Superb analytical deduction. You proved the claim with textual craft.');

      onComplete();
    } else {
      playIncorrectSound();
      setEvaluatedOptions(prev => ({
        ...prev,
        [optId]: {
          action: 'evidence',
          isCorrect: false,
          feedback: '❌ Evidence Rejected: This excerpt narrates literal events or surface context rather than proving the analytical mechanism of the claim.'
        }
      }));
      setFeedback('❌ Proof Rejected: The Angry Examiner penalizes superficial evidence pairing. Re-examine the author\'s structural craft.');
    }
  };

  const handleFlagAsTrap = (optId: string, isTrap: boolean, trapExplanation: string) => {
    if (isTrap) {
      setEvaluatedOptions(prev => ({
        ...prev,
        [optId]: {
          action: 'trap',
          isCorrect: true,
          feedback: `💥 Distractor Trap Defused! (+25 XP) ${trapExplanation}`
        }
      }));
      playStreakFlameSound();
      playCorrectSound();
      setFeedback('💥 Trap Defused! (+25 XP) You accurately spotted why this excerpt fails to substantiate the prompt.');
    } else {
      // ZERO-SPOILER: The AI NEVER tells the student that this is the correct answer!
      playIncorrectSound();
      setEvaluatedOptions(prev => ({
        ...prev,
        [optId]: {
          action: 'trap',
          isCorrect: false,
          feedback: '❌ Objection Overruled: The Examiner rejects your trap flag. This excerpt contains verifiable authorial craft and cannot be dismissed as a superficial distractor. Re-examine its structural syntax.'
        }
      }));
      setFeedback('❌ Trap Flag Rejected: You cannot dismiss this excerpt. Re-read carefully without spoiling your deduction.');
    }
  };

  const letterMap = ['A', 'B', 'C', 'D'];

  return (
    <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
              Support a Claim with Evidence
            </span>
            <span className="text-xs text-slate-400 font-mono-numbers">
              Challenge {currentRoundIdx + 1} of {TRAP_CHALLENGES.length} · Zero-Spoiler Mode
            </span>
            {isCompleted && (
              <span className="text-[10px] text-emerald-400 font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                Action Certified
              </span>
            )}
          </div>
          <h4 className="text-sm font-bold text-white mt-1">
            Deduce the Single Genuine Supporting Excerpt
          </h4>
          {round.sourceContext && (
            <p className="text-[11px] text-slate-400 mt-0.5">
              Source Focus: <span className="text-slate-300 font-medium">{round.sourceContext}</span> · {round.domain}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {selectedProof && (
            <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold flex items-center gap-1 font-mono-numbers">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Evidence Paired (+50 XP)</span>
            </span>
          )}

          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-xl p-1">
            <button
              type="button"
              onClick={handlePrevChallenge}
              title="Previous Challenge"
              className="px-2 py-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg text-xs font-bold transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleResetChallenge}
              title="Shuffle Cards / Reset"
              className="px-2 py-1 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              <span className="hidden sm:inline text-[11px]">Shuffle</span>
            </button>
            <button
              type="button"
              onClick={handleNextChallenge}
              title="Next Challenge"
              className="px-2 py-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg text-xs font-bold transition-colors cursor-pointer"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Target Claim to Support */}
      <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 font-medium space-y-1">
        <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider block">
          Target Analytical Claim to Support:
        </span>
        <p className="text-white text-xs sm:text-sm font-serif leading-relaxed">
          {round.promptClaim}
        </p>
        <span className="text-[10px] text-amber-300/80 block mt-1">
          Deduce which excerpt directly substantiates this claim through authorial rhetoric or mechanism. Beware seductive distractors that merely narrate literal plot events or external trivia.
        </span>
      </div>

      {/* Candidate Cards - Strictly Zero-Spoiler Rendering */}
      <div className="space-y-3">
        {currentOptions.map((opt, oIdx) => {
          const evalResult = evaluatedOptions[opt.id];
          const isSelectedProof = selectedProof === opt.id;

          let cardStyle = 'bg-slate-900/80 border-slate-800 hover:border-slate-700 text-slate-200';
          if (evalResult) {
            if (evalResult.isCorrect && evalResult.action === 'evidence') {
              cardStyle = 'bg-emerald-950/40 border-emerald-500 text-emerald-100 shadow-md ring-1 ring-emerald-500/50';
            } else if (!evalResult.isCorrect && evalResult.action === 'evidence') {
              cardStyle = 'bg-rose-950/40 border-rose-500 text-rose-200 ring-1 ring-rose-500/50';
            } else if (evalResult.isCorrect && evalResult.action === 'trap') {
              cardStyle = 'bg-slate-950/90 border-slate-700 text-slate-400 opacity-80';
            } else if (!evalResult.isCorrect && evalResult.action === 'trap') {
              cardStyle = 'bg-amber-950/40 border-amber-500 text-amber-200';
            }
          }

          return (
            <div
              key={opt.id}
              className={`p-4 rounded-xl border transition-all space-y-3 ${cardStyle}`}
            >
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-lg bg-slate-800 text-slate-300 font-bold font-mono-numbers text-xs flex items-center justify-center shrink-0 mt-0.5">
                  {letterMap[oIdx] || `${oIdx + 1}`}
                </span>
                <div className="space-y-1 flex-1">
                  <span className="text-xs sm:text-sm leading-relaxed font-serif block">
                    {opt.text}
                  </span>

                  {/* Revealed feedback ONLY after student actively commits an action */}
                  {evalResult && (
                    <div className={`text-xs mt-2 p-2 rounded-lg font-sans font-medium ${
                      evalResult.isCorrect
                        ? evalResult.action === 'evidence'
                          ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/40'
                          : 'bg-slate-800 text-slate-300 border border-slate-700'
                        : 'bg-rose-500/20 text-rose-200 border border-rose-500/40'
                    }`}>
                      {evalResult.feedback}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons - Identical across all cards, zero spoiler cues */}
              <div className="flex flex-wrap items-center justify-end gap-2 pt-1 border-t border-slate-800/60">
                <button
                  type="button"
                  disabled={isSelectedProof}
                  onClick={() => handleSelectAsEvidence(opt.id, opt.isCorrectProof)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    isSelectedProof
                      ? 'bg-emerald-500 text-slate-950 shadow-sm cursor-default'
                      : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-sm'
                  }`}
                >
                  {isSelectedProof ? '✓ Supporting Evidence Locked' : 'Select as Supporting Evidence'}
                </button>

                <button
                  type="button"
                  disabled={isSelectedProof || (evalResult?.action === 'trap' && evalResult.isCorrect)}
                  onClick={() => handleFlagAsTrap(opt.id, opt.isTrap, opt.trapExplanation)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
                    evalResult?.action === 'trap' && evalResult.isCorrect
                      ? 'bg-slate-950 text-slate-500 border-slate-800 cursor-default'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                  }`}
                >
                  {evalResult?.action === 'trap' && evalResult.isCorrect ? 'Trap Defused ✓' : 'Flag as Distractor Trap'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {feedback && (
        <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 flex items-center justify-between animate-fadeIn">
          <span>{feedback}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-white ml-2 cursor-pointer font-bold"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// 4. INTERACTIVE 60-SECOND PRESSURE VIVA DRILL
// ============================================================================
const PressureVivaDrill: React.FC<{
  actionItem: string;
  onComplete: () => void;
  isCompleted: boolean;
}> = ({ actionItem, onComplete, isCompleted }) => {
  const [secondsLeft, setSecondsLeft] = useState<number>(60);
  const [isActive, setIsActive] = useState<boolean>(false);
  const [responseNotes, setResponseNotes] = useState<string>('');
  const [evaluation, setEvaluation] = useState<string | null>(
    isCompleted ? 'VIVA APPROVED: Concise, mechanism-grounded, zero fluff. +50 XP.' : null
  );

  useEffect(() => {
    let t: any = null;
    if (isActive && secondsLeft > 0) {
      t = setInterval(() => {
        setSecondsLeft(s => {
          if (s <= 5 && s > 0) playTimerTickSound();
          if (s <= 1) {
            setIsActive(false);
            playVivaGavelSound();
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    }
    return () => clearInterval(t);
  }, [isActive, secondsLeft]);

  const handleStart = () => {
    setIsActive(true);
    setSecondsLeft(60);
    setEvaluation(null);
    playTimerTickSound();
  };

  const handleSubmitViva = () => {
    setIsActive(false);
    playVivaGavelSound();
    playCorrectSound();
    setEvaluation('EXAMINER GAVEL DOWN: "Direct, mechanically precise, and devoid of defensive hand-waving. Full First-Class marks awarded." +50 XP');
    onComplete();
  };

  return (
    <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xl">
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/30">
            60-Second Pressure Crucible
          </span>
          <span className="text-xs text-slate-400 font-mono-numbers">
            Oral Viva Protocol
          </span>
        </div>

        <div className="flex items-center gap-1.5 font-mono-numbers font-bold text-amber-400 text-lg">
          <Timer className="w-4 h-4 text-amber-400" />
          <span>{secondsLeft}s</span>
        </div>
      </div>

      <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 space-y-1">
        <span className="text-[10px] uppercase font-bold text-rose-400 block tracking-wider">
          The Angry Examiner's Challenge:
        </span>
        <p className="leading-relaxed">
          "State your core analytical claim, identify 2 specific syntactic craft techniques, and explain the non-obvious conclusion in 60 seconds without saying 'um', 'like', or summarizing plot."
        </p>
      </div>

      <div className="space-y-2">
        <textarea
          rows={3}
          value={responseNotes}
          onChange={e => setResponseNotes(e.target.value)}
          placeholder={isActive ? "Speak aloud or type your rapid response under pressure..." : "Click 'Start 60-Second Pressure Timer' to begin..."}
          className="w-full p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-400"
        />

        <div className="flex items-center justify-between">
          {!isActive ? (
            <button
              type="button"
              onClick={handleStart}
              className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md"
            >
              <Play className="w-3.5 h-3.5 fill-slate-950" />
              <span>Start 60-Second Timer</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmitViva}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Submit Response to Examiner</span>
            </button>
          )}

          {evaluation && (
            <span className="text-xs text-emerald-400 font-semibold font-mono-numbers">
              {evaluation}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 5. INTERACTIVE MECHANISM RECALL CRUCIBLE
// ============================================================================
const MechanismRecallCrucible: React.FC<{
  actionItem: string;
  onComplete: () => void;
  isCompleted: boolean;
}> = ({ actionItem, onComplete, isCompleted }) => {
  const [revealedSteps, setRevealedSteps] = useState<number[]>([]);
  const [confidence, setConfidence] = useState<'shaky' | 'solid' | 'mastered'>(isCompleted ? 'mastered' : 'solid');

  const steps = [
    { num: 1, title: 'Resting State & Stimulus Threshold', detail: 'Voltage-gated Na+ channels closed; resting potential maintained at -70mV by Na+/K+ ATPase.' },
    { num: 2, title: 'Rapid Depolarization Wave', detail: 'Threshold (-55mV) reached; massive Na+ influx causes membrane potential to spike toward +30mV.' },
    { num: 3, title: 'Repolarization Phase', detail: 'Na+ channels inactivate; delayed voltage-gated K+ channels open, allowing massive K+ efflux.' },
    { num: 4, title: 'Hyperpolarization & Refractory Period', detail: 'Membrane dips below -70mV (undershoot); absolute refractory period prevents retrograde conduction.' }
  ];

  const handleReveal = (stepNum: number) => {
    if (!revealedSteps.includes(stepNum)) {
      const next = [...revealedSteps, stepNum];
      setRevealedSteps(next);
      playCorrectSound();
      if (next.length === steps.length) {
        onComplete();
        playStreakFlameSound();
      }
    }
  };

  return (
    <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xl">
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
            Mechanism Step Crucible
          </span>
          <span className="text-xs text-slate-400 font-mono-numbers">
            {revealedSteps.length} / {steps.length} Steps Recalled
          </span>
        </div>

        <div className="flex items-center gap-2">
          {revealedSteps.length === steps.length && (
            <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Mechanism Locked (+50 XP)</span>
            </span>
          )}
          {revealedSteps.length > 0 && (
            <button
              type="button"
              onClick={() => setRevealedSteps([])}
              className="px-2 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Hide / Re-test</span>
            </button>
          )}
        </div>
      </div>

      <div className="space-y-2">
        {steps.map(step => {
          const isRevealed = revealedSteps.includes(step.num);
          return (
            <div
              key={step.num}
              onClick={() => handleReveal(step.num)}
              className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                isRevealed
                  ? 'bg-slate-900/90 border-cyan-500/40 text-slate-200'
                  : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700 hover:text-slate-400'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-lg flex items-center justify-center font-mono-numbers font-bold text-xs shrink-0 ${
                  isRevealed
                    ? 'bg-cyan-500 text-slate-950'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                0{step.num}
              </div>
              <div className="space-y-0.5 flex-1">
                <span className="text-xs font-bold text-white block">
                  {step.title}
                </span>
                <p className={`text-xs ${isRevealed ? 'text-slate-300' : 'filter blur-sm select-none text-slate-600'}`}>
                  {step.detail}
                </p>
              </div>
              {!isRevealed && (
                <span className="text-[10px] text-cyan-400 font-semibold shrink-0">
                  Tap to Reveal
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ============================================================================
// 6. GENERIC GAMIFIED ACTION MISSION CARD
// ============================================================================
const GenericGamifiedActionCard: React.FC<{
  actionItem: string;
  onComplete: () => void;
  isCompleted: boolean;
}> = ({ actionItem, onComplete, isCompleted }) => {
  const [notes, setNotes] = useState<string>('');

  const handleDone = () => {
    onComplete();
    playCorrectSound();
    playStreakFlameSound();
  };

  return (
    <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3 shadow-xl">
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
          Target Study Protocol
        </span>
        {isCompleted && (
          <span className="text-xs text-emerald-400 font-bold flex items-center gap-1 font-mono-numbers">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Mastered (+50 XP)</span>
          </span>
        )}
      </div>

      <p className="text-xs sm:text-sm text-slate-200 font-medium">
        {actionItem}
      </p>

      <textarea
        rows={2}
        value={notes}
        onChange={e => setNotes(e.target.value)}
        placeholder="Log key takeaways, completed question counts, or notes here..."
        className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-400"
      />

      <div className="flex items-center justify-between pt-1">
        <span className="text-[11px] text-slate-400">
          Complete daily to solidify milestone progress.
        </span>
        <button
          type="button"
          onClick={handleDone}
          className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all ${
            isCompleted
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md'
          }`}
        >
          {isCompleted ? 'Completed ✓ (Toggle)' : 'Mark Done (+50 XP)'}
        </button>
      </div>
    </div>
  );
};

// ============================================================================
// MAIN DECK COMPONENT: ROADMAP ACTION ITEMS DECK
// ============================================================================
interface RoadmapActionItemsDeckProps {
  actionItems: string[];
  levelIndex: number;
  levelTitle: string;
  levelPhase: string;
  checkedActions?: Record<string, boolean>;
  onToggleAction?: (levelIdx: number, actionIdx: number) => void;
  onRecordXp?: (amount: number) => void;
  onStartStudySession?: () => void;
  onOpenLevelPractice?: (levelIdx: number) => void;
}

export const RoadmapActionItemsDeck: React.FC<RoadmapActionItemsDeckProps> = ({
  actionItems = [],
  levelIndex,
  levelTitle,
  levelPhase,
  checkedActions = {},
  onToggleAction,
  onRecordXp,
  onStartStudySession,
  onOpenLevelPractice
}) => {
  const [selectedActionTab, setSelectedActionTab] = useState<number | 'all'>('all');

  const actionStatuses = useMemo(() => {
    return actionItems.map((act, idx) => ({
      text: act,
      type: detectActionItemType(act),
      isCompleted: !!checkedActions[`${levelIndex}-${idx}`]
    }));
  }, [actionItems, checkedActions, levelIndex]);

  const completedCount = actionStatuses.filter(a => a.isCompleted).length;
  const totalCount = actionItems.length;

  const handleActionComplete = (actionIdx: number) => {
    onToggleAction?.(levelIndex, actionIdx);
    onRecordXp?.(50);
  };

  const renderInteractiveModule = (actionText: string, actionIdx: number, isCompleted: boolean) => {
    const type = detectActionItemType(actionText);

    switch (type) {
      case 'highlight-annotation':
        return (
          <TextHighlightWorkbench
            actionItem={actionText}
            isCompleted={isCompleted}
            onComplete={() => handleActionComplete(actionIdx)}
          />
        );
      case 'draft-thematic-claims':
        return (
          <ThematicClaimBuilder
            actionItem={actionText}
            isCompleted={isCompleted}
            onComplete={() => handleActionComplete(actionIdx)}
          />
        );
      case 'trap-defuser':
        return (
          <TrapDefuserArena
            actionItem={actionText}
            isCompleted={isCompleted}
            onComplete={() => handleActionComplete(actionIdx)}
          />
        );
      case 'pressure-viva':
        return (
          <PressureVivaDrill
            actionItem={actionText}
            isCompleted={isCompleted}
            onComplete={() => handleActionComplete(actionIdx)}
          />
        );
      case 'mechanism-recall':
        return (
          <MechanismRecallCrucible
            actionItem={actionText}
            isCompleted={isCompleted}
            onComplete={() => handleActionComplete(actionIdx)}
          />
        );
      default:
        return (
          <GenericGamifiedActionCard
            actionItem={actionText}
            isCompleted={isCompleted}
            onComplete={() => handleActionComplete(actionIdx)}
          />
        );
    }
  };

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Header bar with Action Count and Tab Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Interactive Mission Deck
            </span>
            <span className="text-xs font-mono-numbers text-slate-300 font-semibold">
              {completedCount} / {totalCount} Action Sections Mastered
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Each action item features a dedicated gamified workbench: highlight texts, draft thematic claims, defuse distractor traps, and drill mechanisms.
          </p>
        </div>

        {/* Tab Filter */}
        <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 p-1 rounded-xl self-start sm:self-auto overflow-x-auto max-w-full">
          <button
            type="button"
            onClick={() => setSelectedActionTab('all')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
              selectedActionTab === 'all'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All Actions ({totalCount})
          </button>
          {actionItems.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setSelectedActionTab(idx)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                selectedActionTab === idx
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>Action 0{idx + 1}</span>
              {actionStatuses[idx]?.isCompleted && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Render Action Sections */}
      <div className="space-y-6">
        {actionItems.map((actionText, aIdx) => {
          if (selectedActionTab !== 'all' && selectedActionTab !== aIdx) {
            return null;
          }

          const isCompleted = !!checkedActions[`${levelIndex}-${aIdx}`];
          const type = detectActionItemType(actionText);

          return (
            <section
              key={aIdx}
              className={`rounded-2xl border transition-all p-4 sm:p-5 space-y-4 ${
                isCompleted
                  ? 'bg-slate-950/70 border-emerald-500/30'
                  : 'bg-slate-950/90 border-slate-800 shadow-xl'
              }`}
            >
              {/* Section Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center font-mono-numbers font-black text-xs shrink-0 shadow-sm ${
                      isCompleted
                        ? 'bg-emerald-500 text-slate-950'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    }`}
                  >
                    0{aIdx + 1}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Level {levelIndex + 1} Action Item {aIdx + 1}
                      </span>
                      <span className="text-[10px] font-mono-numbers text-amber-400">
                        {type === 'highlight-annotation'
                          ? 'Highlight & Annotate'
                          : type === 'draft-thematic-claims'
                          ? 'Thematic Claim Synthesis'
                          : type === 'trap-defuser'
                          ? 'Trap Defusal Arena'
                          : type === 'pressure-viva'
                          ? 'Pressure Viva Drill'
                          : type === 'mechanism-recall'
                          ? 'Mechanism Flash Recall'
                          : 'Action Protocol'}
                      </span>
                    </div>
                    <h4 className="text-sm sm:text-base font-bold text-white font-display mt-0.5">
                      {actionText}
                    </h4>
                  </div>
                </div>

                {/* Mark Complete Checkbox / XP Badge */}
                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <button
                    type="button"
                    onClick={() => handleActionComplete(aIdx)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      isCompleted
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700'
                    }`}
                  >
                    {isCompleted ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Completed ✓</span>
                      </>
                    ) : (
                      <>
                        <Circle className="w-3.5 h-3.5 text-slate-500" />
                        <span>Mark Action Mastered (+50 XP)</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* The Dedicated Interactive Gamified Module */}
              {renderInteractiveModule(actionText, aIdx, isCompleted)}
            </section>
          );
        })}
      </div>
    </div>
  );
};
