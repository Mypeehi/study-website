import React from 'react';
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

export const STICK_COLORS: Record<StickColorTheme, { stroke: string; label: string; accent: string }> = {
  chalk: { stroke: '#F8FAFC', label: 'Chalk White', accent: '#E2E8F0' },
  amber: { stroke: '#FBBF24', label: 'Scholar Gold', accent: '#D97706' },
  cyan: { stroke: '#22D3EE', label: 'Neon Cyan', accent: '#06B6D4' },
  emerald: { stroke: '#34D399', label: 'Focus Emerald', accent: '#10B981' },
  rose: { stroke: '#FB7185', label: 'Crimson Warrior', accent: '#F43F5E' },
  purple: { stroke: '#C084FC', label: 'Polymath Purple', accent: '#9333EA' },
  blue: { stroke: '#60A5FA', label: 'Cobalt Blue', accent: '#2563EB' },
  orange: { stroke: '#FB923C', label: 'Energy Orange', accent: '#EA580C' },
  midnight: { stroke: '#94A3B8', label: 'Stealth Slate', accent: '#64748B' },
};

export const DEFAULT_STICK_FIGURE: StickFigureConfig = {
  headwear: 'grad-cap',
  expression: 'happy',
  pose: 'thumbs-up',
  outfit: 'tie',
  colorTheme: 'amber',
  bgShape: 'circle',
  bgTheme: 'amber-glow',
  lineWidth: 2.5,
};

export const DEFAULT_USER_PROFILE: UserProfileCustomization = {
  displayName: 'You (Scholar)',
  username: 'scholar_cadet',
  titleMotto: 'Grinding for 1st Class Honors',
  stickFigure: DEFAULT_STICK_FIGURE,
};

export const PRESET_STICK_FIGURES: Array<{ name: string; description: string; config: StickFigureConfig }> = [
  {
    name: 'The Valedictorian',
    description: 'Top of class with cap, tie, and radiant gold focus',
    config: {
      headwear: 'grad-cap',
      expression: 'glasses',
      pose: 'reading',
      outfit: 'tie',
      colorTheme: 'amber',
      bgShape: 'circle',
      bgTheme: 'amber-glow',
      lineWidth: 2.5,
    },
  },
  {
    name: '3 AM Crammer',
    description: 'Chugging espresso through past papers and midnight notes',
    config: {
      headwear: 'beanie',
      expression: 'sleeping',
      pose: 'coffee',
      outfit: 'hoodie',
      colorTheme: 'orange',
      bgShape: 'rounded',
      bgTheme: 'dark-slate',
      lineWidth: 2.5,
    },
  },
  {
    name: 'Cyber Polymath',
    description: 'Cool shades, hero cape, and algorithmic precision',
    config: {
      headwear: 'headphones',
      expression: 'sunglasses',
      pose: 'laptop',
      outfit: 'cape',
      colorTheme: 'cyan',
      bgShape: 'hexagon',
      bgTheme: 'neon-cyber',
      lineWidth: 2.5,
    },
  },
  {
    name: 'The Lab Genius',
    description: 'Doctor lab coat, sparkling eyes, and active formula recall',
    config: {
      headwear: 'none',
      expression: 'sparkle',
      pose: 'pencil',
      outfit: 'lab-coat',
      colorTheme: 'emerald',
      bgShape: 'shield',
      bgTheme: 'emerald-mint',
      lineWidth: 2.5,
    },
  },
  {
    name: 'Exam Warrior',
    description: 'Focus headband, pen-blade ready to slay tricky traps',
    config: {
      headwear: 'headband',
      expression: 'focused',
      pose: 'sword',
      outfit: 'belt',
      colorTheme: 'rose',
      bgShape: 'hexagon',
      bgTheme: 'sunset',
      lineWidth: 2.5,
    },
  },
  {
    name: 'Quiz Champion',
    description: 'Golden crown, dapper bowtie, and double victory celebration',
    config: {
      headwear: 'crown',
      expression: 'happy',
      pose: 'victory',
      outfit: 'bowtie',
      colorTheme: 'amber',
      bgShape: 'shield',
      bgTheme: 'cosmic-star',
      lineWidth: 2.5,
    },
  },
  {
    name: 'The Dapper Thinker',
    description: 'Top hat, monocle, pondering deep first principles',
    config: {
      headwear: 'top-hat',
      expression: 'monocle',
      pose: 'thinking',
      outfit: 'tie',
      colorTheme: 'purple',
      bgShape: 'circle',
      bgTheme: 'dark-slate',
      lineWidth: 2.5,
    },
  },
  {
    name: 'Zen Minimalist',
    description: 'Pure chalkboard doodle, serene clarity',
    config: {
      headwear: 'none',
      expression: 'smug',
      pose: 'hands-on-hips',
      outfit: 'none',
      colorTheme: 'chalk',
      bgShape: 'circle',
      bgTheme: 'chalkboard',
      lineWidth: 2.5,
    },
  },
];

// Simple deterministic hash to stick figure for community members
export function getDeterministicStickFigure(seed: string): StickFigureConfig {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  hash = Math.abs(hash);

  const headwears: StickHeadwear[] = [
    'grad-cap', 'beanie', 'baseball-cap', 'crown', 'headband', 'headphones',
    'top-hat', 'halo', 'party-hat', 'spiky-hair', 'curly-hair', 'viking-horns', 'none'
  ];
  const expressions: StickFaceExpression[] = [
    'happy', 'glasses', 'sunglasses', 'focused', 'sparkle', 'wink', 'monocle', 'sleeping', 'smug', 'derp'
  ];
  const poses: StickBodyPose[] = [
    'standing', 'hands-on-hips', 'thumbs-up', 'reading', 'coffee', 'pencil', 'victory', 'laptop', 'thinking', 'sword'
  ];
  const outfits: StickOutfit[] = [
    'none', 'tie', 'bowtie', 'hoodie', 'cape', 'scarf', 'lab-coat', 'belt'
  ];
  const colors: StickColorTheme[] = [
    'chalk', 'amber', 'cyan', 'emerald', 'rose', 'purple', 'blue', 'orange'
  ];
  const shapes: StickBackgroundShape[] = ['circle', 'rounded', 'hexagon', 'shield'];
  const bgThemes: StickBackgroundBg[] = [
    'chalkboard', 'dark-slate', 'amber-glow', 'neon-cyber', 'sunset', 'emerald-mint', 'cosmic-star'
  ];

  return {
    headwear: headwears[hash % headwears.length],
    expression: expressions[(hash >> 2) % expressions.length],
    pose: poses[(hash >> 4) % poses.length],
    outfit: outfits[(hash >> 6) % outfits.length],
    colorTheme: colors[(hash >> 8) % colors.length],
    bgShape: shapes[(hash >> 10) % shapes.length],
    bgTheme: bgThemes[(hash >> 12) % bgThemes.length],
    lineWidth: 2.5,
  };
}

export function getRandomStickFigure(): StickFigureConfig {
  const randomPick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
  return {
    headwear: randomPick<StickHeadwear>([
      'grad-cap', 'beanie', 'baseball-cap', 'crown', 'headband', 'headphones',
      'top-hat', 'halo', 'party-hat', 'spiky-hair', 'curly-hair', 'viking-horns', 'none'
    ]),
    expression: randomPick<StickFaceExpression>([
      'happy', 'glasses', 'sunglasses', 'focused', 'sparkle', 'wink', 'monocle', 'sleeping', 'smug', 'derp'
    ]),
    pose: randomPick<StickBodyPose>([
      'standing', 'hands-on-hips', 'thumbs-up', 'reading', 'coffee', 'pencil', 'victory', 'laptop', 'thinking', 'sword'
    ]),
    outfit: randomPick<StickOutfit>([
      'none', 'tie', 'bowtie', 'hoodie', 'cape', 'scarf', 'lab-coat', 'belt'
    ]),
    colorTheme: randomPick<StickColorTheme>([
      'chalk', 'amber', 'cyan', 'emerald', 'rose', 'purple', 'blue', 'orange'
    ]),
    bgShape: randomPick<StickBackgroundShape>(['circle', 'rounded', 'hexagon', 'shield']),
    bgTheme: randomPick<StickBackgroundBg>([
      'chalkboard', 'dark-slate', 'amber-glow', 'neon-cyber', 'sunset', 'emerald-mint', 'cosmic-star'
    ]),
    lineWidth: 2.5,
  };
}

interface StickFigureAvatarProps {
  config?: StickFigureConfig;
  seed?: string;
  size?: number | string; // e.g. 40 or 'w-10 h-10'
  className?: string;
  showBackground?: boolean;
  animated?: boolean;
  onClick?: () => void;
  title?: string;
}

export const StickFigureAvatar: React.FC<StickFigureAvatarProps> = ({
  config: providedConfig,
  seed = 'default_scholar',
  size = 48,
  className = '',
  showBackground = true,
  animated = false,
  onClick,
  title,
}) => {
  const config = providedConfig || getDeterministicStickFigure(seed);
  const colorData = STICK_COLORS[config.colorTheme] || STICK_COLORS.amber;
  const strokeColor = colorData.stroke;
  const strokeWidth = config.lineWidth || 2.5;

  const widthStyle = typeof size === 'number' ? `${size}px` : undefined;
  const heightStyle = typeof size === 'number' ? `${size}px` : undefined;

  // Background Theme Definitions
  const renderBackgroundGradients = () => (
    <defs>
      {/* Chalkboard */}
      <linearGradient id={`chalkboard-${seed}`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#0c1815" />
        <stop offset="100%" stopColor="#06120e" />
      </linearGradient>

      {/* Dark Slate */}
      <linearGradient id={`dark-slate-${seed}`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#0f172a" />
        <stop offset="100%" stopColor="#020617" />
      </linearGradient>

      {/* Amber Glow */}
      <linearGradient id={`amber-glow-${seed}`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#451a03" />
        <stop offset="50%" stopColor="#1f1305" />
        <stop offset="100%" stopColor="#090501" />
      </linearGradient>

      {/* Neon Cyber */}
      <linearGradient id={`neon-cyber-${seed}`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#1e1b4b" />
        <stop offset="50%" stopColor="#0f172a" />
        <stop offset="100%" stopColor="#082f49" />
      </linearGradient>

      {/* Sunset */}
      <linearGradient id={`sunset-${seed}`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#500724" />
        <stop offset="60%" stopColor="#2e1065" />
        <stop offset="100%" stopColor="#090d16" />
      </linearGradient>

      {/* Emerald Mint */}
      <linearGradient id={`emerald-mint-${seed}`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#022c22" />
        <stop offset="100%" stopColor="#064e3b" />
      </linearGradient>

      {/* Cosmic Star */}
      <linearGradient id={`cosmic-star-${seed}`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#1e1b4b" />
        <stop offset="50%" stopColor="#172554" />
        <stop offset="100%" stopColor="#020617" />
      </linearGradient>
    </defs>
  );

  const getBackgroundFillAndBorder = () => {
    switch (config.bgTheme) {
      case 'chalkboard':
        return { fill: `url(#chalkboard-${seed})`, stroke: '#1b3b30' };
      case 'amber-glow':
        return { fill: `url(#amber-glow-${seed})`, stroke: '#f59e0b' };
      case 'neon-cyber':
        return { fill: `url(#neon-cyber-${seed})`, stroke: '#06b6d4' };
      case 'sunset':
        return { fill: `url(#sunset-${seed})`, stroke: '#f43f5e' };
      case 'emerald-mint':
        return { fill: `url(#emerald-mint-${seed})`, stroke: '#10b981' };
      case 'cosmic-star':
        return { fill: `url(#cosmic-star-${seed})`, stroke: '#818cf8' };
      case 'dark-slate':
      default:
        return { fill: `url(#dark-slate-${seed})`, stroke: '#334155' };
    }
  };

  const { fill: bgFill, stroke: bgStroke } = getBackgroundFillAndBorder();

  // Render Background Shape
  const renderBackgroundShape = () => {
    if (!showBackground) return null;

    switch (config.bgShape) {
      case 'rounded':
        return (
          <rect
            x="4"
            y="4"
            width="92"
            height="92"
            rx="22"
            fill={bgFill}
            stroke={bgStroke}
            strokeWidth="2"
          />
        );
      case 'hexagon':
        return (
          <polygon
            points="50,4 92,26 92,74 50,96 8,74 8,26"
            fill={bgFill}
            stroke={bgStroke}
            strokeWidth="2"
          />
        );
      case 'shield':
        return (
          <path
            d="M50 4 C75 4 92 12 92 35 C92 70 50 96 50 96 C50 96 8 70 8 35 C8 12 25 4 50 4 Z"
            fill={bgFill}
            stroke={bgStroke}
            strokeWidth="2"
          />
        );
      case 'circle':
      default:
        return (
          <circle
            cx="50"
            cy="50"
            r="46"
            fill={bgFill}
            stroke={bgStroke}
            strokeWidth="2"
          />
        );
    }
  };

  // Cosmic stars background detail if enabled
  const renderBackgroundDetails = () => {
    if (!showBackground) return null;
    if (config.bgTheme === 'cosmic-star') {
      return (
        <g opacity="0.6">
          <circle cx="22" cy="20" r="1" fill="#fff" />
          <circle cx="80" cy="24" r="1.2" fill="#fef08a" />
          <circle cx="76" cy="78" r="0.8" fill="#fff" />
          <circle cx="24" cy="74" r="1" fill="#a5f3fc" />
          <polygon points="50,10 51,12 53,13 51,14 50,16 49,14 47,13 49,12" fill="#fff" opacity="0.5" />
        </g>
      );
    }
    if (config.bgTheme === 'chalkboard') {
      return (
        <g stroke="#ffffff" strokeWidth="0.5" opacity="0.15">
          <line x1="16" y1="84" x2="28" y2="84" />
          <line x1="72" y1="18" x2="84" y2="18" />
        </g>
      );
    }
    return null;
  };

  // Outfit Cape (rendered behind body)
  const renderCapeBackdrop = () => {
    if (config.outfit !== 'cape') return null;
    return (
      <path
        d="M44 42 C30 52 26 76 34 82 C42 84 46 68 50 64 C54 68 58 84 66 82 C74 76 70 52 56 42 Z"
        fill="#f43f5e"
        opacity="0.85"
        stroke="#9f1239"
        strokeWidth="1.5"
      />
    );
  };

  // Facial Expression at Head (cx=50, cy=26)
  const renderFace = () => {
    switch (config.expression) {
      case 'glasses':
        return (
          <g>
            {/* Glasses Frames */}
            <circle cx="45" cy="25" r="3.2" stroke={strokeColor} strokeWidth="1.4" fill="none" />
            <circle cx="55" cy="25" r="3.2" stroke={strokeColor} strokeWidth="1.4" fill="none" />
            <line x1="48.2" y1="25" x2="51.8" y2="25" stroke={strokeColor} strokeWidth="1.4" />
            {/* Tiny pupils */}
            <circle cx="45" cy="25" r="1" fill={strokeColor} />
            <circle cx="55" cy="25" r="1" fill={strokeColor} />
            {/* Smile */}
            <path d="M 46 29 Q 50 32 54 29" stroke={strokeColor} strokeWidth="1.4" fill="none" strokeLinecap="round" />
          </g>
        );

      case 'sunglasses':
        return (
          <g>
            {/* Dark cool shades */}
            <polygon
              points="40,22 49,22 48,27 42,27"
              fill="#0f172a"
              stroke={strokeColor}
              strokeWidth="1.2"
            />
            <polygon
              points="51,22 60,22 58,27 52,27"
              fill="#0f172a"
              stroke={strokeColor}
              strokeWidth="1.2"
            />
            <line x1="48" y1="23" x2="52" y2="23" stroke={strokeColor} strokeWidth="1.4" />
            {/* White shine reflections */}
            <line x1="43" y1="23.5" x2="45" y2="26" stroke="#fff" strokeWidth="0.8" opacity="0.8" />
            <line x1="53" y1="23.5" x2="55" y2="26" stroke="#fff" strokeWidth="0.8" opacity="0.8" />
            {/* Smirk */}
            <path d="M 46 29 Q 51 31 55 28" stroke={strokeColor} strokeWidth="1.4" fill="none" strokeLinecap="round" />
          </g>
        );

      case 'sparkle':
        return (
          <g>
            {/* Sparkly Star Eyes */}
            <path d="M 45 22 L 46 25 L 45 28 L 44 25 Z" fill={strokeColor} />
            <path d="M 42 25 L 45 26 L 48 25 L 45 24 Z" fill={strokeColor} />
            <path d="M 55 22 L 56 25 L 55 28 L 54 25 Z" fill={strokeColor} />
            <path d="M 52 25 L 55 26 L 58 25 L 55 24 Z" fill={strokeColor} />
            {/* Open Happy Mouth */}
            <path d="M 46 28 Q 50 33 54 28 Z" fill={strokeColor} stroke={strokeColor} strokeWidth="0.5" />
          </g>
        );

      case 'focused':
        return (
          <g>
            {/* Determined angled eyebrows/eyes */}
            <line x1="42" y1="23" x2="47" y2="25" stroke={strokeColor} strokeWidth="1.6" strokeLinecap="round" />
            <line x1="58" y1="23" x2="53" y2="25" stroke={strokeColor} strokeWidth="1.6" strokeLinecap="round" />
            <circle cx="45.5" cy="25.5" r="1.1" fill={strokeColor} />
            <circle cx="54.5" cy="25.5" r="1.1" fill={strokeColor} />
            {/* Intense determined line mouth */}
            <line x1="46" y1="29.5" x2="54" y2="29.5" stroke={strokeColor} strokeWidth="1.5" strokeLinecap="round" />
          </g>
        );

      case 'wink':
        return (
          <g>
            {/* Left Eye Wink */}
            <path d="M 43 25 Q 46 22 48 25" stroke={strokeColor} strokeWidth="1.5" fill="none" strokeLinecap="round" />
            {/* Right Eye Open */}
            <circle cx="54" cy="24" r="1.5" fill={strokeColor} />
            {/* Playful smile */}
            <path d="M 46 28 Q 50 32 54 28" stroke={strokeColor} strokeWidth="1.4" fill="none" strokeLinecap="round" />
          </g>
        );

      case 'monocle':
        return (
          <g>
            <circle cx="45" cy="24" r="1.4" fill={strokeColor} />
            {/* Right eye monocle */}
            <circle cx="55" cy="24" r="3.4" stroke="#f59e0b" strokeWidth="1.4" fill="none" />
            <circle cx="55" cy="24" r="1.2" fill={strokeColor} />
            {/* Hanging chain */}
            <path d="M 58 24 Q 61 32 57 37" stroke="#f59e0b" strokeWidth="1" fill="none" strokeDasharray="1 1" />
            <path d="M 46 29 Q 50 31 54 29" stroke={strokeColor} strokeWidth="1.4" fill="none" strokeLinecap="round" />
          </g>
        );

      case 'sleeping':
        return (
          <g>
            {/* Closed eyes -.- */}
            <line x1="43" y1="25" x2="47" y2="25" stroke={strokeColor} strokeWidth="1.5" strokeLinecap="round" />
            <line x1="53" y1="25" x2="57" y2="25" stroke={strokeColor} strokeWidth="1.5" strokeLinecap="round" />
            {/* Small mouth */}
            <line x1="48" y1="29" x2="52" y2="29" stroke={strokeColor} strokeWidth="1.3" strokeLinecap="round" />
            {/* Floating z Z */}
            <text x="63" y="20" fill={strokeColor} fontSize="8" fontWeight="bold" opacity="0.8">z</text>
            <text x="68" y="14" fill={strokeColor} fontSize="10" fontWeight="bold" opacity="0.9">Z</text>
          </g>
        );

      case 'smug':
        return (
          <g>
            <circle cx="45" cy="24" r="1.4" fill={strokeColor} />
            <circle cx="55" cy="24" r="1.4" fill={strokeColor} />
            {/* Confident smirk */}
            <path d="M 45 29 Q 51 31 56 27" stroke={strokeColor} strokeWidth="1.5" fill="none" strokeLinecap="round" />
          </g>
        );

      case 'derp':
        return (
          <g>
            {/* Googly eyes */}
            <circle cx="44" cy="23" r="2.8" stroke={strokeColor} strokeWidth="1" fill="#fff" />
            <circle cx="44" cy="23" r="1.4" fill="#000" />
            <circle cx="55" cy="24" r="1.6" stroke={strokeColor} strokeWidth="1" fill="#fff" />
            <circle cx="55.5" cy="24" r="0.8" fill="#000" />
            {/* Cute tongue out */}
            <path d="M 47 28 Q 50 30 53 28" stroke={strokeColor} strokeWidth="1.3" fill="none" strokeLinecap="round" />
            <path d="M 48 29 C 48 33 52 33 52 29 Z" fill="#f43f5e" stroke="#be123c" strokeWidth="0.8" />
          </g>
        );

      case 'happy':
      default:
        return (
          <g>
            <circle cx="46" cy="24" r="1.5" fill={strokeColor} />
            <circle cx="54" cy="24" r="1.5" fill={strokeColor} />
            <path d="M 46 28 Q 50 32 54 28" stroke={strokeColor} strokeWidth="1.5" fill="none" strokeLinecap="round" />
          </g>
        );
    }
  };

  // Headwear (on top of head around y=10-22)
  const renderHeadwear = () => {
    switch (config.headwear) {
      case 'grad-cap':
        return (
          <g>
            {/* Mortarboard skull base */}
            <path d="M 43 18 Q 50 21 57 18 L 56 22 Q 50 24 44 22 Z" fill="#1e293b" stroke={strokeColor} strokeWidth="1" />
            {/* Diamond top plate */}
            <polygon
              points="50,11 65,16 50,21 35,16"
              fill="#0f172a"
              stroke={strokeColor}
              strokeWidth="1.5"
            />
            {/* Center button */}
            <circle cx="50" cy="16" r="1.4" fill="#fbbf24" />
            {/* Tassel line & dangling tassel */}
            <path d="M 50 16 Q 61 17 64 24" stroke="#fbbf24" strokeWidth="1.3" fill="none" />
            <circle cx="64" cy="24.5" r="1.2" fill="#fbbf24" />
          </g>
        );

      case 'beanie':
        return (
          <g>
            {/* Beanie dome */}
            <path
              d="M 38 21 C 38 12 62 12 62 21 Z"
              fill="#ea580c"
              stroke={strokeColor}
              strokeWidth="1.3"
            />
            {/* Beanie fold cuff */}
            <rect x="37" y="19" width="26" height="4" rx="2" fill="#c2410c" stroke={strokeColor} strokeWidth="1" />
            {/* Pompom on top */}
            <circle cx="50" cy="10.5" r="3" fill="#fed7aa" stroke={strokeColor} strokeWidth="1" />
          </g>
        );

      case 'baseball-cap':
        return (
          <g>
            {/* Cap dome */}
            <path d="M 40 21 C 40 14 60 14 60 21 Z" fill="#2563eb" stroke={strokeColor} strokeWidth="1.3" />
            {/* Visor Brim */}
            <path d="M 48 21 Q 65 19 66 22 L 56 23 Z" fill="#1d4ed8" stroke={strokeColor} strokeWidth="1" />
            <circle cx="50" cy="15" r="1" fill="#fbbf24" />
          </g>
        );

      case 'crown':
        return (
          <g>
            {/* 3-Point Royal Crown */}
            <polygon
              points="40,20 41,12 46,16 50,10 54,16 59,12 60,20"
              fill="#fbbf24"
              stroke="#d97706"
              strokeWidth="1.4"
            />
            {/* Crown gems */}
            <circle cx="41.5" cy="12.5" r="1" fill="#ef4444" />
            <circle cx="50" cy="10.5" r="1.2" fill="#3b82f6" />
            <circle cx="58.5" cy="12.5" r="1" fill="#ef4444" />
          </g>
        );

      case 'headband':
        return (
          <g>
            {/* Headband across forehead */}
            <rect x="38" y="18" width="24" height="4" rx="1.5" fill="#ef4444" stroke="#b91c1c" strokeWidth="1" />
            {/* Metal plate in center */}
            <rect x="47" y="18.5" width="6" height="3" rx="0.5" fill="#e2e8f0" stroke="#475569" strokeWidth="0.6" />
            {/* Tied cloth tails */}
            <path d="M 61 20 Q 67 22 68 28" stroke="#ef4444" strokeWidth="2" fill="none" strokeLinecap="round" />
            <path d="M 61 20 Q 65 24 64 30" stroke="#b91c1c" strokeWidth="1.8" fill="none" strokeLinecap="round" />
          </g>
        );

      case 'headphones':
        return (
          <g>
            {/* Headphone Band */}
            <path d="M 37 25 C 37 13 63 13 63 25" stroke="#94a3b8" strokeWidth="2.4" fill="none" strokeLinecap="round" />
            {/* Left Ear Cushion */}
            <rect x="35" y="21" width="4.5" height="9" rx="2.2" fill="#06b6d4" stroke="#0891b2" strokeWidth="1" />
            {/* Right Ear Cushion */}
            <rect x="60.5" y="21" width="4.5" height="9" rx="2.2" fill="#06b6d4" stroke="#0891b2" strokeWidth="1" />
          </g>
        );

      case 'top-hat':
        return (
          <g>
            {/* Hat brim */}
            <ellipse cx="50" cy="18" rx="14" ry="2.5" fill="#1e293b" stroke={strokeColor} strokeWidth="1" />
            {/* Hat cylinder body */}
            <path d="M 42 18 L 42 7 L 58 7 L 58 18 Z" fill="#0f172a" stroke={strokeColor} strokeWidth="1.3" />
            {/* Hat top oval */}
            <ellipse cx="50" cy="7" rx="8" ry="1.5" fill="#1e293b" />
            {/* Red ribbon band */}
            <rect x="42" y="14" width="16" height="3" fill="#dc2626" />
          </g>
        );

      case 'halo':
        return (
          <ellipse
            cx="50"
            cy="10"
            rx="11"
            ry="3"
            fill="none"
            stroke="#fbbf24"
            strokeWidth="2"
            opacity="0.9"
          />
        );

      case 'party-hat':
        return (
          <g>
            {/* Cone */}
            <polygon points="50,6 40,19 60,19" fill="#ec4899" stroke={strokeColor} strokeWidth="1.2" />
            {/* Stripes */}
            <line x1="43" y1="15" x2="57" y2="15" stroke="#fef08a" strokeWidth="1.5" />
            <line x1="46" y1="11" x2="54" y2="11" stroke="#38bdf8" strokeWidth="1.5" />
            {/* Pompom on top */}
            <circle cx="50" cy="5.5" r="2.2" fill="#facc15" stroke={strokeColor} strokeWidth="0.8" />
          </g>
        );

      case 'spiky-hair':
        return (
          <path
            d="M 38 21 L 41 12 L 45 16 L 50 9 L 55 15 L 59 11 L 62 21"
            fill="#fbbf24"
            stroke={strokeColor}
            strokeWidth="1.4"
            strokeLinejoin="round"
          />
        );

      case 'curly-hair':
        return (
          <g fill="#92400e" stroke={strokeColor} strokeWidth="1">
            <circle cx="41" cy="17" r="4" />
            <circle cx="47" cy="14" r="4.5" />
            <circle cx="53" cy="14" r="4.5" />
            <circle cx="59" cy="17" r="4" />
            <circle cx="50" cy="12" r="3.5" />
          </g>
        );

      case 'viking-horns':
        return (
          <g>
            {/* Left horn */}
            <path d="M 40 21 Q 34 16 30 11 Q 36 14 41 18 Z" fill="#f8fafc" stroke="#64748b" strokeWidth="1" />
            {/* Right horn */}
            <path d="M 60 21 Q 66 16 70 11 Q 64 14 59 18 Z" fill="#f8fafc" stroke="#64748b" strokeWidth="1" />
            <line x1="40" y1="19" x2="60" y2="19" stroke="#64748b" strokeWidth="2" />
          </g>
        );

      case 'none':
      default:
        return null;
    }
  };

  // Outfits / Torso Overlays (tie, bowtie, hoodie, etc.)
  const renderOutfit = () => {
    switch (config.outfit) {
      case 'tie':
        return (
          <g>
            {/* Collar folds */}
            <polygon points="46,38 50,42 44,40" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="0.6" />
            <polygon points="54,38 50,42 56,40" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="0.6" />
            {/* Tie knot */}
            <polygon points="48,41 52,41 51,44 49,44" fill="#dc2626" />
            {/* Necktie body */}
            <polygon points="49,44 51,44 53,56 50,59 47,56" fill="#ef4444" stroke="#991b1b" strokeWidth="0.8" />
          </g>
        );

      case 'bowtie':
        return (
          <g>
            {/* Left & Right wings */}
            <polygon points="50,40 44,37 44,43" fill="#3b82f6" stroke="#1d4ed8" strokeWidth="0.8" />
            <polygon points="50,40 56,37 56,43" fill="#3b82f6" stroke="#1d4ed8" strokeWidth="0.8" />
            <circle cx="50" cy="40" r="1.5" fill="#facc15" />
          </g>
        );

      case 'hoodie':
        return (
          <g>
            {/* Hoodie V-neck collar */}
            <path d="M 44 38 Q 50 44 56 38" stroke="#94a3b8" strokeWidth="1.5" fill="none" />
            {/* White drawstrings */}
            <line x1="47" y1="41" x2="46" y2="52" stroke="#f8fafc" strokeWidth="1" strokeLinecap="round" />
            <line x1="53" y1="41" x2="54" y2="52" stroke="#f8fafc" strokeWidth="1" strokeLinecap="round" />
            <circle cx="46" cy="52" r="0.8" fill="#f8fafc" />
            <circle cx="54" cy="52" r="0.8" fill="#f8fafc" />
          </g>
        );

      case 'scarf':
        return (
          <g>
            {/* Scarf loop around neck */}
            <rect x="42" y="37" width="16" height="5" rx="2.5" fill="#ea580c" stroke="#9a3412" strokeWidth="0.8" />
            {/* Hanging scarf tail */}
            <path d="M 46 41 L 46 56 L 49 56 L 49 41 Z" fill="#f97316" stroke="#9a3412" strokeWidth="0.8" />
            {/* Fringe */}
            <line x1="46" y1="56" x2="46" y2="58" stroke="#f97316" strokeWidth="1" />
            <line x1="47.5" y1="56" x2="47.5" y2="58" stroke="#f97316" strokeWidth="1" />
            <line x1="49" y1="56" x2="49" y2="58" stroke="#f97316" strokeWidth="1" />
          </g>
        );

      case 'lab-coat':
        return (
          <g>
            {/* Open doctor coat lapels */}
            <path d="M 44 38 L 41 62" stroke="#f8fafc" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M 56 38 L 59 62" stroke="#f8fafc" strokeWidth="2.5" strokeLinecap="round" />
            {/* Stethoscope around neck */}
            <path d="M 45 40 Q 50 48 55 40" stroke="#06b6d4" strokeWidth="1.2" fill="none" />
            <circle cx="50" cy="48" r="1.5" fill="#0891b2" stroke="#cffafe" strokeWidth="0.6" />
          </g>
        );

      case 'belt':
        return (
          <g>
            <rect x="44" y="60" width="12" height="3" rx="1" fill="#18181b" stroke="#f59e0b" strokeWidth="0.8" />
            {/* Belt knot & hanging ends */}
            <path d="M 50 63 L 48 70" stroke="#18181b" strokeWidth="1.8" strokeLinecap="round" />
            <path d="M 50 63 L 52 70" stroke="#18181b" strokeWidth="1.8" strokeLinecap="round" />
          </g>
        );

      case 'cape':
      case 'none':
      default:
        return null;
    }
  };

  // Body and Limbs based on Pose
  const renderBodyAndPose = () => {
    switch (config.pose) {
      case 'hands-on-hips':
        return (
          <g stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" fill="none">
            {/* Spine */}
            <line x1="50" y1="37" x2="50" y2="64" />
            {/* Left Arm: Elbow bent out to hip */}
            <polyline points="50,43 35,51 44,58" />
            {/* Right Arm: Elbow bent out to hip */}
            <polyline points="50,43 65,51 56,58" />
            {/* Legs */}
            <line x1="50" y1="64" x2="38" y2="88" />
            <line x1="50" y1="64" x2="62" y2="88" />
          </g>
        );

      case 'thumbs-up':
        return (
          <g stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" fill="none">
            {/* Spine */}
            <line x1="50" y1="37" x2="50" y2="64" />
            {/* Left Arm: Raised in thumbs up */}
            <polyline points="50,43 36,46 32,38" />
            {/* Thumbs up thumb hand */}
            <line x1="32" y1="38" x2="32" y2="33" strokeWidth={strokeWidth} />
            <circle cx="32" cy="38" r="1.5" fill={strokeColor} />
            {/* Right Arm: Relaxed down */}
            <line x1="50" y1="43" x2="64" y2="58" />
            {/* Legs */}
            <line x1="50" y1="64" x2="39" y2="88" />
            <line x1="50" y1="64" x2="61" y2="88" />
          </g>
        );

      case 'reading':
        return (
          <g stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" fill="none">
            {/* Spine */}
            <line x1="50" y1="37" x2="50" y2="64" />
            {/* Arms holding book */}
            <polyline points="50,43 41,52 45,55" />
            <polyline points="50,43 59,52 55,55" />
            {/* Legs */}
            <line x1="50" y1="64" x2="40" y2="88" />
            <line x1="50" y1="64" x2="60" y2="88" />
            {/* Open Book Props */}
            <g stroke="#38bdf8" strokeWidth="1.6" fill="#0369a1" opacity="0.95">
              <path d="M 50 56 Q 44 54 38 56 L 38 64 Q 44 62 50 64 Z" />
              <path d="M 50 56 Q 56 54 62 56 L 62 64 Q 56 62 50 64 Z" />
            </g>
            {/* Tiny ribbon bookmark */}
            <line x1="50" y1="56" x2="50" y2="66" stroke="#fbbf24" strokeWidth="1.4" />
          </g>
        );

      case 'coffee':
        return (
          <g stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" fill="none">
            {/* Spine */}
            <line x1="50" y1="37" x2="50" y2="64" />
            {/* Left Arm holding mug */}
            <polyline points="50,43 36,49 35,46" />
            {/* Right Arm relaxed */}
            <line x1="50" y1="43" x2="64" y2="58" />
            {/* Legs */}
            <line x1="50" y1="64" x2="39" y2="88" />
            <line x1="50" y1="64" x2="61" y2="88" />
            {/* Coffee Mug Prop */}
            <g fill="#ea580c" stroke="#fed7aa" strokeWidth="1">
              <rect x="29" y="42" width="7" height="8" rx="1.5" />
              <path d="M 29 44 C 26 44 26 48 29 48" fill="none" strokeWidth="1.2" />
            </g>
            {/* Steam curls */}
            <path d="M 31 40 Q 33 37 31 34" stroke="#fed7aa" strokeWidth="1" fill="none" opacity="0.8" />
            <path d="M 34 39 Q 36 36 34 33" stroke="#fed7aa" strokeWidth="1" fill="none" opacity="0.8" />
          </g>
        );

      case 'pencil':
        return (
          <g stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" fill="none">
            {/* Spine */}
            <line x1="50" y1="37" x2="50" y2="64" />
            {/* Left Arm */}
            <line x1="50" y1="43" x2="36" y2="58" />
            {/* Right Arm raised holding giant stylus/pencil */}
            <polyline points="50,43 65,42 66,33" />
            {/* Legs */}
            <line x1="50" y1="64" x2="39" y2="88" />
            <line x1="50" y1="64" x2="61" y2="88" />
            {/* Giant Yellow Pencil Prop */}
            <g stroke="#78350f" strokeWidth="0.8">
              {/* Pencil body */}
              <polygon points="63,36 67,33 77,19 73,16" fill="#facc15" />
              {/* Eraser */}
              <polygon points="73,16 77,19 79,16 75,13" fill="#f43f5e" />
              {/* Wooden tip & lead */}
              <polygon points="63,36 67,33 60,40" fill="#fde68a" />
              <polygon points="61,38 63,37 60,40" fill="#18181b" />
            </g>
          </g>
        );

      case 'victory':
        return (
          <g stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" fill="none">
            {/* Spine */}
            <line x1="50" y1="37" x2="50" y2="64" />
            {/* Left Arm raised \o */}
            <polyline points="50,42 35,32 30,22" />
            {/* Right Arm raised o/ */}
            <polyline points="50,42 65,32 70,22" />
            {/* Legs in dynamic celebratory stance */}
            <line x1="50" y1="64" x2="35" y2="88" />
            <line x1="50" y1="64" x2="65" y2="88" />
            {/* Tiny celebratory stars */}
            <polygon points="26,16 27,18 29,18 27,19 28,21 26,20 24,21 25,19 23,18 25,18" fill="#fbbf24" stroke="none" />
            <polygon points="74,16 75,18 77,18 75,19 76,21 74,20 72,21 73,19 71,18 73,18" fill="#fbbf24" stroke="none" />
          </g>
        );

      case 'laptop':
        return (
          <g stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" fill="none">
            {/* Spine leaning slightly */}
            <line x1="50" y1="37" x2="48" y2="64" />
            {/* Sitting Legs bent */}
            <polyline points="48,64 36,74 38,88" />
            <polyline points="48,64 60,74 58,88" />
            {/* Arms typing on laptop */}
            <polyline points="49,43 43,53 50,56" />
            <polyline points="49,43 55,53 52,56" />
            {/* Mini Glowing Laptop Screen & Base */}
            <g stroke="#06b6d4" strokeWidth="1" fill="#0f172a">
              {/* Keyboard base */}
              <line x1="42" y1="60" x2="58" y2="60" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" />
              {/* Screen angled back */}
              <polygon points="44,48 56,48 58,59 42,59" fill="#082f49" stroke="#38bdf8" strokeWidth="1" />
              {/* Screen glow code line */}
              <line x1="46" y1="52" x2="54" y2="52" stroke="#22d3ee" strokeWidth="0.8" />
              <line x1="46" y1="55" x2="51" y2="55" stroke="#34d399" strokeWidth="0.8" />
            </g>
          </g>
        );

      case 'thinking':
        return (
          <g stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" fill="none">
            {/* Spine */}
            <line x1="50" y1="37" x2="50" y2="64" />
            {/* Left Arm folded across */}
            <polyline points="50,45 38,54 46,55" />
            {/* Right Arm resting on left elbow, hand on chin */}
            <polyline points="50,44 58,50 54,34" />
            {/* Legs */}
            <line x1="50" y1="64" x2="40" y2="88" />
            <line x1="50" y1="64" x2="60" y2="88" />
            {/* Little thinking light/bubbles */}
            <circle cx="62" cy="24" r="1.5" fill="#facc15" stroke="none" />
            <circle cx="67" cy="18" r="2.2" fill="#facc15" stroke="none" />
          </g>
        );

      case 'sword':
        return (
          <g stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" fill="none">
            {/* Spine */}
            <line x1="50" y1="37" x2="50" y2="64" />
            {/* Left Arm */}
            <line x1="50" y1="43" x2="36" y2="56" />
            {/* Right Arm raised brandishing stylus-blade */}
            <polyline points="50,43 65,40 68,32" />
            {/* Legs in stance */}
            <line x1="50" y1="64" x2="38" y2="88" />
            <line x1="50" y1="64" x2="64" y2="88" />
            {/* Glowing Exam Pen-Sword Prop */}
            <g stroke="#f43f5e" strokeWidth="1.2">
              <line x1="68" y1="34" x2="78" y2="14" stroke="#fda4af" strokeWidth="2.5" strokeLinecap="round" />
              {/* Crossguard */}
              <line x1="64" y1="31" x2="71" y2="35" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" />
              {/* Pommel */}
              <circle cx="67" cy="37" r="1.5" fill="#fbbf24" stroke="none" />
            </g>
          </g>
        );

      case 'standing':
      default:
        return (
          <g stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" fill="none">
            {/* Spine */}
            <line x1="50" y1="37" x2="50" y2="64" />
            {/* Relaxed Arms */}
            <line x1="50" y1="43" x2="36" y2="58" />
            <line x1="50" y1="43" x2="64" y2="58" />
            {/* Legs */}
            <line x1="50" y1="64" x2="39" y2="88" />
            <line x1="50" y1="64" x2="61" y2="88" />
          </g>
        );
    }
  };

  return (
    <div
      onClick={onClick}
      title={title}
      className={`inline-flex items-center justify-center shrink-0 select-none ${
        onClick ? 'cursor-pointer hover:scale-105 active:scale-95 transition-transform' : ''
      } ${className}`}
      style={{
        width: widthStyle,
        height: heightStyle,
      }}
    >
      <svg
        viewBox="0 0 100 100"
        className={`w-full h-full overflow-visible ${animated ? 'animate-pulse' : ''}`}
      >
        {renderBackgroundGradients()}
        {renderBackgroundShape()}
        {renderBackgroundDetails()}

        {/* Cape back layer */}
        {renderCapeBackdrop()}

        {/* Stick Figure Body & Limbs */}
        {renderBodyAndPose()}

        {/* Head */}
        <circle
          cx="50"
          cy="26"
          r="11"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          fill="#0f172a"
        />

        {/* Face features */}
        {renderFace()}

        {/* Outfit accents (tie, bowtie, scarf) */}
        {renderOutfit()}

        {/* Headwear / Hat (drawn on top) */}
        {renderHeadwear()}
      </svg>
    </div>
  );
};
