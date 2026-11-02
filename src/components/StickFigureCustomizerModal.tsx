import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Dices,
  Check,
  User,
  AtSign,
  Quote,
  Palette,
  Smile,
  GraduationCap,
  Activity,
  Shirt,
  Layers,
  Save,
  RotateCcw,
} from 'lucide-react';
import {
  StickFigureConfig,
  StickHeadwear,
  StickFaceExpression,
  StickBodyPose,
  StickOutfit,
  StickColorTheme,
  StickBackgroundShape,
  StickBackgroundBg,
  UserProfileCustomization,
} from '../types';
import {
  StickFigureAvatar,
  STICK_COLORS,
  DEFAULT_STICK_FIGURE,
  PRESET_STICK_FIGURES,
  getRandomStickFigure,
} from './StickFigureAvatar';
import { playStreakFlameSound } from '../utils/audio';

interface StickFigureCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentProfile?: UserProfileCustomization;
  onSaveProfile: (profile: UserProfileCustomization) => void;
  userRankInfo?: {
    level: number;
    title: string;
    totalXp: number;
    badgeIcon: string;
  };
}

export const StickFigureCustomizerModal: React.FC<StickFigureCustomizerModalProps> = ({
  isOpen,
  onClose,
  currentProfile,
  onSaveProfile,
  userRankInfo,
}) => {
  const [displayName, setDisplayName] = useState(currentProfile?.displayName || 'You (Scholar)');
  const [username, setUsername] = useState(currentProfile?.username || 'scholar_cadet');
  const [titleMotto, setTitleMotto] = useState(
    currentProfile?.titleMotto || 'Grinding for 1st Class Honors'
  );
  const [config, setConfig] = useState<StickFigureConfig>(
    currentProfile?.stickFigure || DEFAULT_STICK_FIGURE
  );

  const [activeCategory, setActiveCategory] = useState<
    'headwear' | 'expression' | 'pose' | 'outfit' | 'color' | 'backdrop'
  >('headwear');

  const [justSaved, setJustSaved] = useState(false);

  if (!isOpen) return null;

  const handleRandomize = () => {
    const random = getRandomStickFigure();
    setConfig(random);
    playStreakFlameSound();
  };

  const handleSave = () => {
    const finalProfile: UserProfileCustomization = {
      displayName: displayName.trim() || 'Scholar',
      username: username.trim().replace(/^@+/, '') || 'scholar',
      titleMotto: titleMotto.trim() || 'Active Recall Scholar',
      stickFigure: config,
    };
    onSaveProfile(finalProfile);
    playStreakFlameSound();
    setJustSaved(true);
    setTimeout(() => {
      setJustSaved(false);
      onClose();
    }, 400);
  };

  const headwearOptions: Array<{ id: StickHeadwear; label: string; icon: string }> = [
    { id: 'grad-cap', label: 'Graduation Cap', icon: '🎓' },
    { id: 'crown', label: 'Golden Crown', icon: '👑' },
    { id: 'headphones', label: 'Study Headphones', icon: '🎧' },
    { id: 'beanie', label: 'Knit Beanie', icon: '🧢' },
    { id: 'baseball-cap', label: 'Baseball Cap', icon: '🧢' },
    { id: 'headband', label: 'Ninja Headband', icon: '🥋' },
    { id: 'top-hat', label: 'Dapper Top Hat', icon: '🎩' },
    { id: 'halo', label: 'Angel Halo', icon: '😇' },
    { id: 'party-hat', label: 'Party Hat', icon: '🥳' },
    { id: 'spiky-hair', label: 'Anime Spikes', icon: '⚡' },
    { id: 'curly-hair', label: 'Fluffy Curls', icon: '🎀' },
    { id: 'viking-horns', label: 'Warrior Horns', icon: '⚔️' },
    { id: 'none', label: 'Classic Minimal', icon: '⚪' },
  ];

  const expressionOptions: Array<{ id: StickFaceExpression; label: string; icon: string }> = [
    { id: 'happy', label: 'Smiling Cheer', icon: '😊' },
    { id: 'glasses', label: 'Nerd Glasses', icon: '👓' },
    { id: 'sunglasses', label: 'Cool Shades', icon: '🕶️' },
    { id: 'focused', label: 'Laser Focus', icon: '🎯' },
    { id: 'sparkle', label: 'Starry Eyes', icon: '✨' },
    { id: 'wink', label: 'Playful Wink', icon: '😉' },
    { id: 'monocle', label: 'Aristocrat Monocle', icon: '🧐' },
    { id: 'smug', label: 'Confident Smirk', icon: '😏' },
    { id: 'sleeping', label: '3 AM Snooze', icon: '😴' },
    { id: 'derp', label: 'Silly Derp', icon: '🤪' },
  ];

  const poseOptions: Array<{ id: StickBodyPose; label: string; icon: string }> = [
    { id: 'thumbs-up', label: 'Thumbs Up', icon: '👍' },
    { id: 'reading', label: 'Reading Book', icon: '📖' },
    { id: 'coffee', label: 'Coffee Cup', icon: '☕' },
    { id: 'pencil', label: 'Giant Pencil', icon: '✏️' },
    { id: 'victory', label: 'Double Victory \\o/', icon: '🙌' },
    { id: 'laptop', label: 'Laptop Typing', icon: '💻' },
    { id: 'thinking', label: 'Pondering Chin', icon: '🤔' },
    { id: 'sword', label: 'Pen-Blade Warrior', icon: '⚔️' },
    { id: 'hands-on-hips', label: 'Hands on Hips', icon: '🧍' },
    { id: 'standing', label: 'Relaxed Standing', icon: '🚶' },
  ];

  const outfitOptions: Array<{ id: StickOutfit; label: string; icon: string }> = [
    { id: 'tie', label: 'Scholar Necktie', icon: '👔' },
    { id: 'bowtie', label: 'Dapper Bowtie', icon: '🎀' },
    { id: 'hoodie', label: 'Study Hoodie', icon: '🧥' },
    { id: 'cape', label: 'Hero Cape', icon: '🦸' },
    { id: 'lab-coat', label: 'Science Lab Coat', icon: '🥼' },
    { id: 'scarf', label: 'Winter Scarf', icon: '🧣' },
    { id: 'belt', label: 'Master Belt', icon: '🥋' },
    { id: 'none', label: 'Bare Stick', icon: '⚪' },
  ];

  const colorOptions: Array<{ id: StickColorTheme; label: string; hex: string }> = [
    { id: 'amber', label: 'Scholar Gold', hex: '#FBBF24' },
    { id: 'cyan', label: 'Neon Cyan', hex: '#22D3EE' },
    { id: 'emerald', label: 'Focus Emerald', hex: '#34D399' },
    { id: 'chalk', label: 'Chalk White', hex: '#F8FAFC' },
    { id: 'rose', label: 'Crimson Warrior', hex: '#FB7185' },
    { id: 'purple', label: 'Polymath Purple', hex: '#C084FC' },
    { id: 'blue', label: 'Cobalt Blue', hex: '#60A5FA' },
    { id: 'orange', label: 'Energy Orange', hex: '#FB923C' },
    { id: 'midnight', label: 'Stealth Slate', hex: '#94A3B8' },
  ];

  const shapeOptions: Array<{ id: StickBackgroundShape; label: string }> = [
    { id: 'circle', label: 'Classic Circle' },
    { id: 'rounded', label: 'Modern Squircle' },
    { id: 'hexagon', label: 'Polymath Hexagon' },
    { id: 'shield', label: 'Honorary Shield' },
  ];

  const backdropOptions: Array<{ id: StickBackgroundBg; label: string; desc: string }> = [
    { id: 'amber-glow', label: 'Amber Radiant', desc: 'Warm glow' },
    { id: 'neon-cyber', label: 'Neon Cyber', desc: 'Cyan & purple' },
    { id: 'chalkboard', label: 'Study Blackboard', desc: 'Dark classroom slate' },
    { id: 'dark-slate', label: 'Deep Midnight', desc: 'Navy minimalist' },
    { id: 'sunset', label: 'Sunset Blaze', desc: 'Crimson gradient' },
    { id: 'emerald-mint', label: 'Emerald Mint', desc: 'Growth & focus' },
    { id: 'cosmic-star', label: 'Cosmic Galaxy', desc: 'Starlit deep space' },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-3xl w-full shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* MODAL HEADER */}
        <div className="relative px-6 py-4 border-b border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/30 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-300 flex items-center justify-center font-bold text-lg shadow-inner">
              ⚡
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold font-display text-white flex items-center gap-2">
                <span>Custom Stick Figure Studio</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Global Profile
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Design your personalized stick figure avatar for leaderboards, podiums, and notes.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MODAL BODY (SCROLLABLE) */}
        <div className="overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* TOP SHOWCASE & PROFILE DETAILS */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 p-5 rounded-2xl bg-slate-950/70 border border-slate-800 shadow-inner">
            {/* AVATAR PREVIEW CARD */}
            <div className="md:col-span-5 flex flex-col items-center justify-center text-center p-3 space-y-3 border-b md:border-b-0 md:border-r border-slate-800/80">
              <div className="relative group">
                <div className="absolute -inset-2 bg-gradient-to-r from-amber-500/30 via-rose-500/20 to-cyan-500/30 rounded-full blur-xl opacity-75 group-hover:opacity-100 transition duration-500 pointer-events-none" />
                <StickFigureAvatar
                  config={config}
                  size={112}
                  className="relative z-10 transition-transform duration-300 group-hover:scale-105"
                />
              </div>

              <div className="space-y-1">
                <div className="text-sm font-bold text-white font-display">
                  {displayName || 'Scholar'}
                </div>
                <div className="text-xs text-amber-400 font-mono">
                  @{username || 'scholar'}
                </div>
                {titleMotto && (
                  <div className="text-[11px] text-slate-300 italic px-2 py-0.5 rounded bg-slate-900 border border-slate-800 line-clamp-1 max-w-[200px]">
                    "{titleMotto}"
                  </div>
                )}
              </div>

              {/* ACTION QUICK BUTTONS */}
              <div className="flex items-center gap-2 pt-1 w-full justify-center">
                <button
                  type="button"
                  onClick={handleRandomize}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-semibold border border-slate-700 transition-colors shadow-sm cursor-pointer"
                  title="Generate a surprising combo!"
                >
                  <Dices className="w-3.5 h-3.5" />
                  <span>Randomize Look</span>
                </button>
              </div>
            </div>

            {/* IDENTITY INPUTS & QUICK PRESETS */}
            <div className="md:col-span-7 space-y-3.5 flex flex-col justify-center">
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 mb-1">
                  <User className="w-3.5 h-3.5 text-amber-400" />
                  <span>Display Name</span>
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  maxLength={32}
                  placeholder="e.g. Marie Curie"
                  className="w-full bg-slate-900 border border-slate-700 focus:border-amber-400 focus:ring-1 focus:ring-amber-400/50 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 mb-1">
                    <AtSign className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Username (@handle)</span>
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={e => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                    maxLength={24}
                    placeholder="neuro_cadet"
                    className="w-full bg-slate-900 border border-slate-700 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 rounded-xl px-3 py-2 text-xs font-mono text-cyan-200 placeholder-slate-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 mb-1">
                    <Quote className="w-3.5 h-3.5 text-rose-400" />
                    <span>Study Motto</span>
                  </label>
                  <input
                    type="text"
                    value={titleMotto}
                    onChange={e => setTitleMotto(e.target.value)}
                    maxLength={48}
                    placeholder="Active Recall > Cramming"
                    className="w-full bg-slate-900 border border-slate-700 focus:border-rose-400 focus:ring-1 focus:ring-rose-400/50 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* QUICK PRESET INSPIRATIONS */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span>Quick Preset Archetypes:</span>
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_STICK_FIGURES.map(preset => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => setConfig(preset.config)}
                      className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-[11px] text-slate-300 hover:text-white transition-all cursor-pointer hover:border-amber-500/40"
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* CUSTOMIZATION TABS */}
          <div className="space-y-4">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setActiveCategory('headwear')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  activeCategory === 'headwear'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5" />
                <span>Headwear & Hats</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveCategory('expression')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  activeCategory === 'expression'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <Smile className="w-3.5 h-3.5" />
                <span>Facial Expressions</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveCategory('pose')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  activeCategory === 'pose'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                <span>Body Action & Pose</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveCategory('outfit')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  activeCategory === 'outfit'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <Shirt className="w-3.5 h-3.5" />
                <span>Outfit Style</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveCategory('color')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  activeCategory === 'color'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <Palette className="w-3.5 h-3.5" />
                <span>Stroke Color</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveCategory('backdrop')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  activeCategory === 'backdrop'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Badge & Backdrop</span>
              </button>
            </div>

            {/* TAB CONTENTS */}

            {/* 1. HEADWEAR */}
            {activeCategory === 'headwear' && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 animate-fadeIn">
                {headwearOptions.map(opt => {
                  const selected = config.headwear === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setConfig(prev => ({ ...prev, headwear: opt.id }))}
                      className={`flex items-center gap-2.5 p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                        selected
                          ? 'bg-amber-500/20 border-amber-400 text-white shadow-md shadow-amber-950/30'
                          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300 hover:bg-slate-850'
                      }`}
                    >
                      <span className="text-xl shrink-0">{opt.icon}</span>
                      <div className="min-w-0">
                        <span className="text-xs font-semibold block truncate">{opt.label}</span>
                        {selected && <span className="text-[10px] text-amber-400 font-bold">Selected</span>}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* 2. EXPRESSIONS */}
            {activeCategory === 'expression' && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5 animate-fadeIn">
                {expressionOptions.map(opt => {
                  const selected = config.expression === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setConfig(prev => ({ ...prev, expression: opt.id }))}
                      className={`flex items-center gap-2.5 p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                        selected
                          ? 'bg-amber-500/20 border-amber-400 text-white shadow-md shadow-amber-950/30'
                          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300 hover:bg-slate-850'
                      }`}
                    >
                      <span className="text-xl shrink-0">{opt.icon}</span>
                      <div className="min-w-0">
                        <span className="text-xs font-semibold block truncate">{opt.label}</span>
                        {selected && <span className="text-[10px] text-amber-400 font-bold">Selected</span>}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* 3. POSES */}
            {activeCategory === 'pose' && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5 animate-fadeIn">
                {poseOptions.map(opt => {
                  const selected = config.pose === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setConfig(prev => ({ ...prev, pose: opt.id }))}
                      className={`flex items-center gap-2.5 p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                        selected
                          ? 'bg-amber-500/20 border-amber-400 text-white shadow-md shadow-amber-950/30'
                          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300 hover:bg-slate-850'
                      }`}
                    >
                      <span className="text-xl shrink-0">{opt.icon}</span>
                      <div className="min-w-0">
                        <span className="text-xs font-semibold block truncate">{opt.label}</span>
                        {selected && <span className="text-[10px] text-amber-400 font-bold">Selected</span>}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* 4. OUTFITS */}
            {activeCategory === 'outfit' && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 animate-fadeIn">
                {outfitOptions.map(opt => {
                  const selected = config.outfit === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setConfig(prev => ({ ...prev, outfit: opt.id }))}
                      className={`flex items-center gap-2.5 p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                        selected
                          ? 'bg-amber-500/20 border-amber-400 text-white shadow-md shadow-amber-950/30'
                          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300 hover:bg-slate-850'
                      }`}
                    >
                      <span className="text-xl shrink-0">{opt.icon}</span>
                      <div className="min-w-0">
                        <span className="text-xs font-semibold block truncate">{opt.label}</span>
                        {selected && <span className="text-[10px] text-amber-400 font-bold">Selected</span>}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* 5. STROKE COLOR */}
            {activeCategory === 'color' && (
              <div className="space-y-4 animate-fadeIn">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {colorOptions.map(col => {
                    const selected = config.colorTheme === col.id;
                    return (
                      <button
                        key={col.id}
                        type="button"
                        onClick={() => setConfig(prev => ({ ...prev, colorTheme: col.id }))}
                        className={`flex items-center gap-3 p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                          selected
                            ? 'bg-slate-800 border-amber-400 text-white shadow-md ring-1 ring-amber-400/50'
                            : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300 hover:bg-slate-850'
                        }`}
                      >
                        <div
                          className="w-7 h-7 rounded-full shrink-0 border-2 border-slate-700 shadow"
                          style={{ backgroundColor: col.hex }}
                        />
                        <div className="min-w-0">
                          <span className="text-xs font-semibold block truncate">{col.label}</span>
                          <span className="text-[10px] font-mono text-slate-400">{col.hex}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 6. BACKDROP & BADGE */}
            {activeCategory === 'backdrop' && (
              <div className="space-y-5 animate-fadeIn">
                {/* Shapes */}
                <div>
                  <span className="text-xs font-semibold text-slate-400 block mb-2">
                    Badge Boundary Shape:
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {shapeOptions.map(shp => {
                      const selected = config.bgShape === shp.id;
                      return (
                        <button
                          key={shp.id}
                          type="button"
                          onClick={() => setConfig(prev => ({ ...prev, bgShape: shp.id }))}
                          className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                            selected
                              ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-bold'
                              : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300'
                          }`}
                        >
                          <span className="text-xs block">{shp.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Background Themes */}
                <div>
                  <span className="text-xs font-semibold text-slate-400 block mb-2">
                    Background Atmosphere:
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {backdropOptions.map(bg => {
                      const selected = config.bgTheme === bg.id;
                      return (
                        <button
                          key={bg.id}
                          type="button"
                          onClick={() => setConfig(prev => ({ ...prev, bgTheme: bg.id }))}
                          className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                            selected
                              ? 'bg-amber-500/20 border-amber-400 text-white'
                              : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300'
                          }`}
                        >
                          <span className="text-xs font-bold block">{bg.label}</span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">{bg.desc}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* MODAL FOOTER */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/90 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={() => {
              setConfig(DEFAULT_STICK_FIGURE);
              setDisplayName('You (Scholar)');
              setUsername('scholar_cadet');
              setTitleMotto('Grinding for 1st Class Honors');
            }}
            className="flex items-center gap-1.5 px-3 py-2 text-xs text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to Default</span>
          </button>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSave}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs transition-all shadow-lg cursor-pointer ${
                justSaved
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-amber-950/40 hover:scale-102 active:scale-98'
              }`}
            >
              {justSaved ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Profile Saved!</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Stick Figure Profile</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
