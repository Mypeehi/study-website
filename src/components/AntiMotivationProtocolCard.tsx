import React, { useState, useEffect } from 'react';
import {
  Flame,
  Shield,
  Clock,
  Sparkles,
  Coffee,
  DollarSign,
  User,
  Copy,
  Check,
  Play,
  RotateCcw,
  AlertTriangle,
  HeartHandshake
} from 'lucide-react';
import { playStreakFlameSound, playTimerTickSound, playCorrectSound } from '../utils/audio';

interface AntiMotivationProtocolCardProps {
  topic?: string;
  onFiveMinuteSuccess?: () => void;
}

export const AntiMotivationProtocolCard: React.FC<AntiMotivationProtocolCardProps> = ({
  topic = 'this subject',
  onFiveMinuteSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'bargain' | 'bundling' | 'deadman' | 'distancing'>('bargain');

  // 1. The 5-Minute Bargain
  const [fiveMinRunning, setFiveMinRunning] = useState<boolean>(false);
  const [fiveMinSeconds, setFiveMinSeconds] = useState<number>(5 * 60);
  const [fiveMinFinished, setFiveMinFinished] = useState<boolean>(false);

  useEffect(() => {
    let timer: any = null;
    if (fiveMinRunning && fiveMinSeconds > 0) {
      timer = setInterval(() => {
        setFiveMinSeconds(prev => {
          if (prev <= 1) {
            setFiveMinRunning(false);
            setFiveMinFinished(true);
            playStreakFlameSound();
            onFiveMinuteSuccess?.();
            return 0;
          }
          if (prev <= 5) playTimerTickSound();
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [fiveMinRunning, fiveMinSeconds, onFiveMinuteSuccess]);

  const handleStart5Min = () => {
    setFiveMinRunning(true);
    setFiveMinFinished(false);
    playCorrectSound();
  };

  const handleReset5Min = () => {
    setFiveMinRunning(false);
    setFiveMinSeconds(5 * 60);
    setFiveMinFinished(false);
  };

  // 2. Temptation Bundling
  const [selectedBribe, setSelectedBribe] = useState<string>('My favorite $7 iced latte');
  const [customBribe, setCustomBribe] = useState<string>('');
  const [bribeLocked, setBribeLocked] = useState<boolean>(false);

  const BRIBE_PRESETS = [
    'My favorite $7 iced coffee / matcha',
    'High-end dark chocolate / sweet snack',
    'Special sparkling water or boba',
    'Cozy hoodie & ambient lighting',
    'Custom treat'
  ];

  // 3. Dead Man's Switch (Artificial Stakes)
  const [friendName, setFriendName] = useState<string>('Alex');
  const [stakeAmount, setStakeAmount] = useState<string>('20');
  const [deadlineTime, setDeadlineTime] = useState<string>('8:00 PM');
  const [taskDescription, setTaskDescription] = useState<string>(`completed practice problems for ${topic}`);
  const [copiedText, setCopiedText] = useState<boolean>(false);

  const deadManMessage = `Emergency accountability check: If I don't text you a photo of my ${taskDescription} by ${deadlineTime} tonight, I legally owe you $${stakeAmount}. No excuses!`;

  const handleCopyDeadMan = () => {
    navigator.clipboard.writeText(deadManMessage);
    setCopiedText(true);
    playCorrectSound();
    setTimeout(() => setCopiedText(false), 2500);
  };

  // 4. Third-Person Self-Distancing
  const [studentName, setStudentName] = useState<string>('');
  const [stressFactor, setStressFactor] = useState<string>('');
  const [selfDistancingResult, setSelfDistancingResult] = useState<string | null>(null);

  const handleRunDistancing = (e: React.FormEvent) => {
    e.preventDefault();
    const name = studentName.trim() || 'the student';
    const stress = stressFactor.trim() || `all the material in ${topic}`;

    setSelfDistancingResult(
      `"Why is ${name} feeling overwhelmed right now? Because ${name}'s amygdala is perceiving ${stress} as a catastrophic threat. But ${name} does not have to conquer the entire exam this minute. What is the single, physical next action for ${name}? Open the first question, read sentence 1, and write one answer. That is all ${name} needs to do right now."`
    );
    playStreakFlameSound();
  };

  const formatMinSec = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 space-y-6 shadow-xl">
      {/* Banner */}
      <div className="border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2 text-xs font-bold text-rose-400 uppercase tracking-wider mb-1">
          <Flame className="w-4 h-4 text-rose-500" />
          <span>Part 1: The Anti-Motivation Protocol</span>
        </div>
        <h2 className="text-xl md:text-2xl font-bold font-display text-white">
          How to Start When You Hate It
        </h2>
        <p className="text-xs text-slate-400 mt-1 leading-relaxed">
          Motivation is a scam and an unreliable emotion. If you wait until you "feel like" studying, you will never start. Use psychological leverage to force yourself into the chair.
        </p>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('bargain')}
          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
            activeTab === 'bargain'
              ? 'bg-amber-500/20 border-amber-500 text-amber-200'
              : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="flex items-center gap-1.5 text-xs font-bold">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>1. 5-Min Bargain</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Lower activation energy</div>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('bundling')}
          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
            activeTab === 'bundling'
              ? 'bg-rose-500/20 border-rose-500 text-rose-200'
              : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="flex items-center gap-1.5 text-xs font-bold">
            <Coffee className="w-3.5 h-3.5 text-rose-400" />
            <span>2. Temptation Bundle</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Bribe your primitive brain</div>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('deadman')}
          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
            activeTab === 'deadman'
              ? 'bg-cyan-500/20 border-cyan-500 text-cyan-200'
              : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="flex items-center gap-1.5 text-xs font-bold">
            <DollarSign className="w-3.5 h-3.5 text-cyan-400" />
            <span>3. Dead Man's Switch</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Manufacture a crisis</div>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('distancing')}
          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
            activeTab === 'distancing'
              ? 'bg-indigo-500/20 border-indigo-500 text-indigo-200'
              : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="flex items-center gap-1.5 text-xs font-bold">
            <User className="w-3.5 h-3.5 text-indigo-400" />
            <span>4. Self-Distancing</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1">3rd-person panic reset</div>
        </button>
      </div>

      {/* 1. The 5-Minute Bargain Tab */}
      {activeTab === 'bargain' && (
        <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4 animate-fadeIn">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
              The 5-Minute Bargain (Lowering Activation Energy)
            </span>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              Your brain perceives a 3-hour study session as an overwhelming threat and floods you with procrastination signals. <strong>Lie to yourself:</strong> "I am only going to sit here for exactly 5 minutes, read one page, and then I can quit."
            </p>
          </div>

          <div className="p-6 rounded-xl bg-slate-900 border border-slate-800/80 flex flex-col items-center justify-center space-y-3">
            <div className="text-4xl md:text-5xl font-bold font-mono-numbers text-amber-400 tracking-tight">
              {formatMinSec(fiveMinSeconds)}
            </div>
            <div className="text-xs text-slate-400 text-center max-w-xs">
              {fiveMinRunning
                ? 'Timer is running! Just focus on one paragraph or flashcard.'
                : fiveMinFinished
                ? '🎉 5 minutes complete! Activation energy is destroyed. Friction is gone. Keep rolling!'
                : 'Click below to start your 5-minute contract.'}
            </div>

            <div className="flex items-center gap-3 pt-2">
              {!fiveMinRunning ? (
                <button
                  type="button"
                  onClick={handleStart5Min}
                  className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-2 cursor-pointer shadow-lg transition-transform hover:scale-105"
                >
                  <Play className="w-4 h-4 fill-slate-950" />
                  <span>{fiveMinFinished ? 'Start Another 5 Minutes' : 'Start 5-Minute Bargain'}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setFiveMinRunning(false)}
                  className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer"
                >
                  Pause
                </button>
              )}

              <button
                type="button"
                onClick={handleReset5Min}
                className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 cursor-pointer"
                title="Reset Timer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Temptation Bundling Tab */}
      {activeTab === 'bundling' && (
        <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4 animate-fadeIn">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-rose-400">
              Temptation Bundling (Dopamine Hijacking)
            </span>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              You cannot just rely on discipline; you have to bribe your primitive brain. Restrict a high-dopamine activity or treat <strong>exclusively</strong> to study time.
            </p>
          </div>

          <div className="space-y-3">
            <label className="block text-xs font-semibold text-slate-300">
              Select Your Designated Study Bribe:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {BRIBE_PRESETS.map((bribe, i) => (
                <div
                  key={i}
                  onClick={() => setSelectedBribe(bribe)}
                  className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                    selectedBribe === bribe
                      ? 'bg-rose-950/40 border-rose-500 text-rose-200 ring-1 ring-rose-500/30'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {bribe}
                </div>
              ))}
            </div>

            {selectedBribe === 'Custom treat' && (
              <input
                type="text"
                value={customBribe}
                onChange={e => setCustomBribe(e.target.value)}
                placeholder="Type your specific treat (e.g. Special matcha latte, gourmet chocolate)..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 outline-none"
              />
            )}

            <div className="pt-2 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Rule: You are strictly forbidden from having this at any other time.
              </span>
              <button
                type="button"
                onClick={() => {
                  setBribeLocked(!bribeLocked);
                  playStreakFlameSound();
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  bribeLocked
                    ? 'bg-emerald-500 text-slate-950'
                    : 'bg-rose-600 hover:bg-rose-500 text-white'
                }`}
              >
                {bribeLocked ? '✓ Bribe Locked to Study Session' : 'Lock This Study Bribe'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Dead Man's Switch Tab */}
      {activeTab === 'deadman' && (
        <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4 animate-fadeIn">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
              The "Dead Man's Switch" (Artificial Stakes)
            </span>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              If you lack internal motivation, manufacture a crisis. Losing money and social embarrassment are immediate, tangible threats that destroy hesitation instantly.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Accountability Friend Name:</label>
              <input
                type="text"
                value={friendName}
                onChange={e => setFriendName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Penalty Stake ($):</label>
              <input
                type="number"
                value={stakeAmount}
                onChange={e => setStakeAmount(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Deadline Tonight:</label>
              <input
                type="text"
                value={deadlineTime}
                onChange={e => setDeadlineTime(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none"
              />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 border border-cyan-500/20 space-y-2">
            <span className="text-[10px] text-cyan-400 uppercase font-bold tracking-wider">
              Ready-to-Send Text Message:
            </span>
            <p className="text-xs text-slate-200 italic font-mono-code leading-relaxed">
              "{deadManMessage}"
            </p>
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={handleCopyDeadMan}
                className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                {copiedText ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedText ? 'Copied to Clipboard!' : 'Copy Text to Send to Friend'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Third-Person Self-Distancing Tab */}
      {activeTab === 'distancing' && (
        <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4 animate-fadeIn">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
              Third-Person Self-Distancing (Amygdala Panic Reset)
            </span>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              When overwhelmed, your amygdala takes over. Speaking to yourself in the 3rd person ("Why is [Name] stressed?") creates psychological distance and shifts the brain from emotional panic to logical problem-solving.
            </p>
          </div>

          <form onSubmit={handleRunDistancing} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Your Name:</label>
                <input
                  type="text"
                  required
                  value={studentName}
                  onChange={e => setStudentName(e.target.value)}
                  placeholder="e.g. Jordan"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">What specifically feels terrifying?</label>
                <input
                  type="text"
                  required
                  value={stressFactor}
                  onChange={e => setStressFactor(e.target.value)}
                  placeholder="e.g. failing the renal physiology exam"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold cursor-pointer transition-colors"
            >
              Generate 3rd-Person Cognitive Reset
            </button>
          </form>

          {selfDistancingResult && (
            <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-500/40 text-xs md:text-sm text-indigo-200 font-serif italic leading-relaxed space-y-2 animate-fadeIn">
              {selfDistancingResult}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
