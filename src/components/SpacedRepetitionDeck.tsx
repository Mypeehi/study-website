import React, { useState } from 'react';
import {
  Layers,
  RotateCw,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ArrowRight,
  Flame,
  Award,
  AlertTriangle,
  Plus,
  Sparkles,
  X
} from 'lucide-react';
import { Flashcard } from '../types';
import { playCorrectSound, playIncorrectSound, playStreakFlameSound } from '../utils/audio';
import { AILoadingBar } from './AILoadingBar';
import { generateLocalStudySession } from '../utils/localStudySessionGenerator';

interface SpacedRepetitionDeckProps {
  cards: Flashcard[];
  onUpdateCard: (updatedCard: Flashcard) => void;
  onSessionComplete: (reviewedCount: number) => void;
}

export const SpacedRepetitionDeck: React.FC<SpacedRepetitionDeckProps> = ({
  cards,
  onUpdateCard,
  onSessionComplete,
}) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [sessionReviewed, setSessionReviewed] = useState(0);
  const [showFinished, setShowFinished] = useState(false);
  const [showGenModal, setShowGenModal] = useState(false);
  const [genTopic, setGenTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const activeCard = cards[currentIdx];

  const handleGenerateCards = async (e: React.FormEvent) => {
    e.preventDefault();
    const topic = genTopic.trim() || 'Core Mechanism Mastery';
    setIsGenerating(true);
    try {
      let flashcards: any[] = [];
      try {
        const res = await fetch('/api/study-session/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subject: topic,
            topics: [topic],
            gradeLevel: 'High School / University',
            durationMinutes: 30,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.flashcards) flashcards = data.flashcards;
        }
      } catch {
        // Zero connection fallback
      }

      if (flashcards.length === 0) {
        const localData = generateLocalStudySession({
          subject: topic,
          topics: [topic],
        });
        flashcards = localData.flashcards;
      }

      if (flashcards && flashcards.length > 0) {
        flashcards.forEach((fc: any, i: number) => {
          onUpdateCard({
            id: `gen-fc-${Date.now()}-${i}`,
            topic,
            front: fc.front,
            back: fc.back,
            trap: fc.trap || 'Beware of vague descriptive answers on exam day.',
            box: 1,
            nextReviewDate: new Date().toISOString().split('T')[0],
          });
        });
        playStreakFlameSound();
        setShowGenModal(false);
        setGenTopic('');
      }
    } catch (err) {
      console.error('Failed to generate cards:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  // Calculate box counts
  const boxCounts = [1, 2, 3, 4, 5].map(boxNum => ({
    box: boxNum,
    count: cards.filter(c => c.box === boxNum).length,
  }));

  const handleScoreCard = (outcome: 'fail' | 'hard' | 'pass') => {
    if (!activeCard) return;

    let nextBox = activeCard.box;
    if (outcome === 'fail') {
      nextBox = 1;
      playIncorrectSound();
    } else if (outcome === 'hard') {
      nextBox = Math.max(1, activeCard.box);
    } else if (outcome === 'pass') {
      nextBox = Math.min(5, activeCard.box + 1);
      playCorrectSound();
    }

    const updated: Flashcard = {
      ...activeCard,
      box: nextBox,
      nextReviewDate: new Date(Date.now() + nextBox * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    };

    onUpdateCard(updated);
    setSessionReviewed(prev => prev + 1);
    setIsFlipped(false);

    if (currentIdx + 1 < cards.length) {
      setCurrentIdx(prev => prev + 1);
    } else {
      setShowFinished(true);
      playStreakFlameSound();
      onSessionComplete(sessionReviewed + 1);
    }
  };

  const handleRestart = () => {
    setCurrentIdx(0);
    setIsFlipped(false);
    setShowFinished(false);
    setSessionReviewed(0);
  };

  if (isGenerating) {
    return (
      <AILoadingBar
        title="Generating High-Yield Leitner Flashcards"
        subtitle="Extracting core causal mechanisms, formulating definitions, and attaching examiner trap warnings..."
        itemType="flashcards"
        topic={genTopic || 'Active Recall Deck'}
        onCancel={() => setIsGenerating(false)}
      />
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Generate Flashcards Modal */}
      {showGenModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-fadeIn">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-bold text-white font-display">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Generate AI Flashcards</span>
              </div>
              <button
                onClick={() => setShowGenModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleGenerateCards} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Topic or Concept to Master:
                </label>
                <input
                  type="text"
                  placeholder="e.g. Enzyme Inhibition, Bohr Effect, Action Potential Gates..."
                  value={genTopic}
                  onChange={e => setGenTopic(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  autoFocus
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowGenModal(false)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!genTopic.trim()}
                  className="px-5 py-2 bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 fill-slate-950" />
                  <span>Generate Cards</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs text-amber-400 font-semibold tracking-wider uppercase mb-1">
            Active Recall Engine
          </div>
          <h1 className="text-2xl md:text-3xl font-bold font-display text-white">
            Spaced Repetition Flashcards
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Powered by the 5-box Leitner method to anchor core biological mechanisms into permanent long-term memory.
          </p>
        </div>

        {/* Leitner Box Visuals & Generate Button */}
        <div className="flex flex-wrap items-center gap-3 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setShowGenModal(true)}
            className="px-3.5 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 text-amber-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 fill-amber-400" />
            <span>Generate Flashcards</span>
          </button>

          <div className="flex items-center gap-1.5 p-1.5 bg-slate-900 border border-slate-800 rounded-xl">
            {boxCounts.map(b => (
              <div
                key={b.box}
                className="text-center px-2.5 py-1 rounded-lg bg-slate-950/60 border border-slate-800/80"
              >
                <div className="text-[10px] text-slate-500 font-semibold">Box {b.box}</div>
                <div className="text-xs font-bold font-mono-numbers text-slate-200">{b.count}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showFinished ? (
        <div className="max-w-md mx-auto bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-5 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto">
            <Award className="w-8 h-8" />
          </div>
          <div>
            <div className="text-xs uppercase font-semibold text-amber-400 mb-1">Session Completed</div>
            <h2 className="text-2xl font-bold font-display text-white">
              Synaptic Review Logged
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              You reviewed <span className="font-mono-numbers text-white font-bold">{cards.length} cards</span>. Promoted cards will appear at longer intervals.
            </p>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs text-amber-300 font-mono-numbers">
            +30 XP added to your study streak!
          </div>

          <button
            onClick={handleRestart}
            className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition-colors cursor-pointer"
          >
            Review Deck Again
          </button>
        </div>
      ) : activeCard ? (
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Card Counter */}
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Topic: <strong className="text-slate-200">{activeCard.topic}</strong></span>
            <span className="font-mono-numbers">Card {currentIdx + 1} of {cards.length} · Box {activeCard.box}</span>
          </div>

          {/* Interactive Flashcard */}
          <div
            onClick={() => setIsFlipped(!isFlipped)}
            className="min-h-[280px] bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-2xl p-7 md:p-8 flex flex-col justify-between cursor-pointer transition-all shadow-xl relative overflow-hidden select-none"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-400">
                  {isFlipped ? 'The Explanation / Answer' : 'Prompt / Recall Question'}
                </span>
                <span className="text-xs text-slate-500 flex items-center gap-1">
                  <RotateCw className="w-3.5 h-3.5" /> Tap to {isFlipped ? 'flip back' : 'reveal'}
                </span>
              </div>

              {!isFlipped ? (
                <div className="text-lg md:text-xl font-bold font-display text-white leading-relaxed pt-4">
                  {activeCard.front}
                </div>
              ) : (
                <div className="space-y-4 pt-2 animate-fadeIn">
                  <p className="text-sm md:text-base text-slate-200 font-sans leading-relaxed">
                    {activeCard.back}
                  </p>

                  {activeCard.trap && (
                    <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-500/30 text-xs text-amber-200/90 leading-relaxed">
                      <strong className="text-amber-400">The Examiner Trap: </strong>
                      {activeCard.trap}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="text-center pt-4 text-[11px] text-slate-500">
              {isFlipped ? 'Grade your honest recall below' : 'Formulate the mechanism in your mind before flipping'}
            </div>
          </div>

          {/* Spaced Repetition Grading Buttons */}
          {isFlipped ? (
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => handleScoreCard('fail')}
                className="py-3 px-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/50 border border-rose-500/30 text-rose-300 font-medium text-xs transition-colors flex flex-col items-center gap-1 cursor-pointer"
              >
                <span className="font-bold">Forgot / Blanked</span>
                <span className="text-[10px] text-rose-400 font-mono-numbers">Reset to Box 1</span>
              </button>

              <button
                onClick={() => handleScoreCard('hard')}
                className="py-3 px-2 rounded-xl bg-amber-950/40 hover:bg-amber-900/50 border border-amber-500/30 text-amber-300 font-medium text-xs transition-colors flex flex-col items-center gap-1 cursor-pointer"
              >
                <span className="font-bold">Struggled</span>
                <span className="text-[10px] text-amber-400 font-mono-numbers">Keep Interval</span>
              </button>

              <button
                onClick={() => handleScoreCard('pass')}
                className="py-3 px-2 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-500/30 text-emerald-300 font-medium text-xs transition-colors flex flex-col items-center gap-1 cursor-pointer"
              >
                <span className="font-bold">Mastered Cold</span>
                <span className="text-[10px] text-emerald-400 font-mono-numbers">Promote (+1 Box)</span>
              </button>
            </div>
          ) : (
            <div className="text-center">
              <button
                onClick={() => setIsFlipped(true)}
                className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                Show Mechanism & Answer
              </button>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
};
