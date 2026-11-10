import React, { useState, useEffect, useMemo } from 'react';
import {
  Quote,
  Sparkles,
  RotateCw,
  Copy,
  Check,
  ChevronUp,
  ChevronDown,
  Volume2,
  VolumeX,
  BookOpen,
  Calendar,
  ExternalLink,
  Filter,
  Palette,
  Lightbulb,
} from 'lucide-react';
import {
  OFFICIAL_DAILY_QUOTES,
  OfficialDailyQuote,
} from '../data/officialDailyQuotes';
import { speakDailyQuote, stopSpeaking, playCorrectSound } from '../utils/audio';

interface DailyMotivationalQuoteProps {
  className?: string;
  activeTab?: string;
}

type WallpaperTheme = 'aurora' | 'alpine' | 'nebula' | 'ocean' | 'desert' | 'forest';

const WALLPAPER_STYLES: Record<WallpaperTheme, {
  name: string;
  badge: string;
  cardBg: string;
  border: string;
  accent: string;
  accentText: string;
  glow: string;
  chipBg: string;
}> = {
  nebula: {
    name: 'Cosmic Nebula',
    badge: '🌌 Cosmic',
    cardBg: 'from-slate-950 via-slate-900 to-indigo-950/40',
    border: 'border-indigo-500/30 hover:border-indigo-400/50',
    accent: 'text-indigo-400',
    accentText: 'text-indigo-300',
    glow: 'bg-indigo-600/15',
    chipBg: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
  },
  aurora: {
    name: 'Emerald Aurora',
    badge: '✨ Aurora',
    cardBg: 'from-slate-950 via-slate-900 to-emerald-950/40',
    border: 'border-emerald-500/30 hover:border-emerald-400/50',
    accent: 'text-emerald-400',
    accentText: 'text-emerald-300',
    glow: 'bg-emerald-600/15',
    chipBg: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  },
  alpine: {
    name: 'Alpine Peak',
    badge: '🏔️ Alpine',
    cardBg: 'from-slate-950 via-slate-900 to-cyan-950/40',
    border: 'border-cyan-500/30 hover:border-cyan-400/50',
    accent: 'text-cyan-400',
    accentText: 'text-cyan-300',
    glow: 'bg-cyan-600/15',
    chipBg: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
  },
  ocean: {
    name: 'Pacific Twilight',
    badge: '🌊 Ocean',
    cardBg: 'from-slate-950 via-slate-900 to-blue-950/40',
    border: 'border-blue-500/30 hover:border-blue-400/50',
    accent: 'text-blue-400',
    accentText: 'text-blue-300',
    glow: 'bg-blue-600/15',
    chipBg: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
  },
  desert: {
    name: 'Sandstone Dawn',
    badge: '🏜️ Desert',
    cardBg: 'from-slate-950 via-slate-900 to-amber-950/40',
    border: 'border-amber-500/30 hover:border-amber-400/50',
    accent: 'text-amber-400',
    accentText: 'text-amber-300',
    glow: 'bg-amber-600/15',
    chipBg: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  },
  forest: {
    name: 'Redwood Mist',
    badge: '🌲 Forest',
    cardBg: 'from-slate-950 via-slate-900 to-teal-950/40',
    border: 'border-teal-500/30 hover:border-teal-400/50',
    accent: 'text-teal-400',
    accentText: 'text-teal-300',
    glow: 'bg-teal-600/15',
    chipBg: 'bg-teal-500/15 text-teal-300 border-teal-500/30',
  },
};

const CATEGORIES = [
  'All Categories',
  'Science & Discovery',
  'Philosophy & Wisdom',
  'Perseverance & Grit',
  'Education & Learning',
  'Innovation & Logic',
  'Humanity & Purpose',
];

export const DailyMotivationalQuote: React.FC<DailyMotivationalQuoteProps> = ({
  className = '',
}) => {
  // Compute deterministic index for today's date
  const todayDefaultIndex = useMemo(() => {
    const today = new Date();
    const start = new Date(today.getFullYear(), 0, 0);
    const diff = today.getTime() - start.getTime();
    const oneDay = 1000 * 60 * 60 * 24;
    const dayOfYear = Math.floor(diff / oneDay);
    return Math.abs(dayOfYear) % OFFICIAL_DAILY_QUOTES.length;
  }, []);

  const [currentIndex, setCurrentIndex] = useState<number>(todayDefaultIndex);
  const [selectedCategory, setSelectedCategory] = useState<string>('All Categories');
  const [wallpaperOverride, setWallpaperOverride] = useState<WallpaperTheme | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [showCategoryMenu, setShowCategoryMenu] = useState<boolean>(false);

  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    try {
      return (
        localStorage.getItem('daily_quote_collapsed') === 'true' ||
        localStorage.getItem('bing_daily_quote_collapsed') === 'true' ||
        localStorage.getItem('angry_scholar_quote_collapsed') === 'true'
      );
    } catch {
      return false;
    }
  });

  // Filtered pool of quotes based on selected category
  const filteredQuotes = useMemo(() => {
    if (selectedCategory === 'All Categories') return OFFICIAL_DAILY_QUOTES;
    return OFFICIAL_DAILY_QUOTES.filter((q) => q.category === selectedCategory);
  }, [selectedCategory]);

  // Current quote
  const currentQuote: OfficialDailyQuote = useMemo(() => {
    if (filteredQuotes.length === 0) return OFFICIAL_DAILY_QUOTES[0];
    return filteredQuotes[currentIndex % filteredQuotes.length];
  }, [filteredQuotes, currentIndex]);

  // Effective wallpaper theme
  const effectiveWallpaper: WallpaperTheme = wallpaperOverride || currentQuote.wallpaperTheme || 'nebula';
  const theme = WALLPAPER_STYLES[effectiveWallpaper] || WALLPAPER_STYLES.nebula;

  // Formatted date string for "Today"
  const formattedToday = useMemo(() => {
    try {
      return new Intl.DateTimeFormat('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      }).format(new Date());
    } catch {
      return 'Today';
    }
  }, []);

  const isTodayQuote = currentIndex === todayDefaultIndex && selectedCategory === 'All Categories';

  const toggleCollapsed = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('daily_quote_collapsed', String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const handleNextQuote = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    stopSpeaking();
    setIsSpeaking(false);
    playCorrectSound();
    setCurrentIndex((prev) => (prev + 1) % filteredQuotes.length);
  };

  const handleResetToToday = (e: React.MouseEvent) => {
    e.stopPropagation();
    stopSpeaking();
    setIsSpeaking(false);
    setSelectedCategory('All Categories');
    setCurrentIndex(todayDefaultIndex);
    setWallpaperOverride(null);
  };

  const handleCycleWallpaper = (e: React.MouseEvent) => {
    e.stopPropagation();
    const themes: WallpaperTheme[] = ['nebula', 'aurora', 'alpine', 'ocean', 'desert', 'forest'];
    const currentPos = themes.indexOf(effectiveWallpaper);
    const nextTheme = themes[(currentPos + 1) % themes.length];
    setWallpaperOverride(nextTheme);
  };

  const handleCopyQuote = (e: React.MouseEvent) => {
    e.stopPropagation();
    const citation = `"${currentQuote.quote}"\n— ${currentQuote.author}${
      currentQuote.authorLifespan ? ` (${currentQuote.authorLifespan})` : ''
    }, ${currentQuote.authorRole}\nSource: ${currentQuote.sourceWork}`;

    navigator.clipboard.writeText(citation).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    });
  };

  const handleToggleSpeak = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSpeaking) {
      stopSpeaking();
      setIsSpeaking(false);
    } else {
      setIsSpeaking(true);
      const textToRecite = `${currentQuote.quote}. By ${currentQuote.author}, ${currentQuote.authorRole}.`;
      speakDailyQuote(textToRecite, () => {
        setIsSpeaking(false);
      });
    }
  };

  // Clean up speech on unmount
  useEffect(() => {
    return () => {
      stopSpeaking();
    };
  }, []);

  return (
    <div
      className={`relative rounded-2xl transition-all duration-300 overflow-hidden border shadow-xl ${
        isCollapsed
          ? 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
          : `bg-gradient-to-br ${theme.cardBg} ${theme.border}`
      } ${className}`}
    >
      {/* Ambient Backdrop Glow */}
      <div
        className={`absolute -top-20 -right-20 w-64 h-64 ${theme.glow} rounded-full blur-3xl pointer-events-none transition-colors duration-500`}
      />
      <div className="absolute -bottom-24 -left-20 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* ============================================================== */}
      {/* COLLAPSED VIEW: Sleek 1-line Ticker                           */}
      {/* ============================================================== */}
      {isCollapsed ? (
        <div className="px-4 py-3 flex items-center justify-between gap-3 relative z-10 text-xs">
          <div
            onClick={toggleCollapsed}
            className="flex items-center gap-3 min-w-0 cursor-pointer group flex-1"
            title="Click to expand today's quote"
          >
            {/* Daily Quote Icon Badge */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/90 border border-slate-700/80 text-slate-200 font-semibold shrink-0">
              <Quote className="w-3 h-3 text-amber-400" />
              <span className="text-[11px] font-bold tracking-tight">Daily Quote</span>
            </div>

            <div className="flex items-center gap-2 truncate">
              <span className="text-slate-200 truncate font-serif italic text-sm">
                "{currentQuote.quote}"
              </span>
              <span className="text-slate-400 hidden sm:inline shrink-0 font-medium text-xs">
                — {currentQuote.author}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleNextQuote}
              className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-slate-800 transition-colors cursor-pointer"
              title="Next Daily Quote"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={toggleCollapsed}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer text-[11px] font-semibold border border-slate-700"
              title="Expand quote"
            >
              <span>Expand</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>
        </div>
      ) : (
        /* ============================================================== */
        /* EXPANDED VIEW: Daily Quote Showcase                            */
        /* ============================================================== */
        <div className="p-4 sm:p-6 relative z-10 space-y-4">
          {/* Header Row: Quote Header, Category Badge, Date, Controls */}
          <div className="flex items-center justify-between gap-3 border-b border-slate-800/80 pb-3 flex-wrap">
            <div className="flex items-center gap-2.5 flex-wrap min-w-0">
              {/* Daily Quote Pill */}
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-800/90 border border-slate-700/80 text-slate-200 text-xs font-bold tracking-wide shadow-sm">
                <Quote className="w-3.5 h-3.5 text-amber-400" />
                <span>Daily Quote</span>
              </div>

              {/* Today / Date Stamp */}
              <div
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border ${
                  isTodayQuote
                    ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                    : 'bg-slate-800/70 border-slate-700/80 text-slate-300'
                }`}
                title="Calendar alignment"
              >
                <Calendar className="w-3 h-3 text-slate-400" />
                <span>{formattedToday}</span>
                {isTodayQuote && (
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 ml-1">
                    · Today's Pick
                  </span>
                )}
              </div>

              {/* Category Badge with Dropdown Trigger */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowCategoryMenu(!showCategoryMenu)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${theme.chipBg}`}
                  title="Filter quotes by subject category"
                >
                  <Filter className="w-3 h-3" />
                  <span>{currentQuote.category}</span>
                  <ChevronDown className="w-3 h-3 opacity-70" />
                </button>

                {/* Category Dropdown */}
                {showCategoryMenu && (
                  <div className="absolute top-full left-0 mt-1.5 w-56 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-1.5 z-50 text-xs space-y-0.5 backdrop-blur-md">
                    <div className="px-2.5 py-1 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      Select Subject Area
                    </div>
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => {
                          setSelectedCategory(cat);
                          setCurrentIndex(0);
                          setShowCategoryMenu(false);
                        }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between transition-colors cursor-pointer ${
                          selectedCategory === cat
                            ? 'bg-cyan-500/20 text-cyan-300 font-semibold'
                            : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                        }`}
                      >
                        <span>{cat}</span>
                        {selectedCategory === cat && <Check className="w-3 h-3 text-cyan-400" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Wallpaper Ambiance Switcher */}
              <button
                type="button"
                onClick={handleCycleWallpaper}
                className="hidden md:flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800/60 border border-slate-700/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800 text-[11px] transition-colors cursor-pointer"
                title="Change ambiance theme backdrop"
              >
                <Palette className="w-3 h-3 text-slate-400" />
                <span>{theme.name}</span>
              </button>
            </div>

            {/* Action Buttons Toolbar */}
            <div className="flex items-center gap-1.5 shrink-0">
              {/* Reset to Today's Quote */}
              {!isTodayQuote && (
                <button
                  type="button"
                  onClick={handleResetToToday}
                  className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-amber-300 text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
                  title="Return to today's quote"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden sm:inline">Today</span>
                </button>
              )}

              {/* Text-to-Speech Audio Dictation */}
              <button
                type="button"
                onClick={handleToggleSpeak}
                className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  isSpeaking
                    ? 'bg-rose-500/20 border-rose-500/50 text-rose-300 animate-pulse'
                    : 'bg-slate-900/80 hover:bg-slate-800 border-slate-800 text-slate-300 hover:text-white'
                }`}
                title={isSpeaking ? 'Stop narration' : 'Listen to this quote recited'}
              >
                {isSpeaking ? (
                  <>
                    <VolumeX className="w-3.5 h-3.5 text-rose-400" />
                    <span className="text-[11px] hidden sm:inline">Mute</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="text-[11px] hidden sm:inline">Listen</span>
                  </>
                )}
              </button>

              {/* Copy Quote Citation */}
              <button
                type="button"
                onClick={handleCopyQuote}
                className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-cyan-300 transition-colors cursor-pointer"
                title={copied ? 'Copied full citation!' : 'Copy quote & citation'}
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>

              {/* Web Search for Quote & Author */}
              <a
                href={`https://www.bing.com/search?q=${encodeURIComponent(currentQuote.searchQuery)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-cyan-400 transition-colors cursor-pointer"
                title="Search this quote and author"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              {/* Shuffle / Next Quote */}
              <button
                type="button"
                onClick={handleNextQuote}
                className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-cyan-300 transition-colors cursor-pointer flex items-center gap-1"
                title="Shuffle next quote in archive"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span className="text-[11px] hidden lg:inline">Next</span>
              </button>

              {/* Collapse Button */}
              <button
                type="button"
                onClick={toggleCollapsed}
                className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                title="Minimize daily quote banner"
              >
                <ChevronUp className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Quote Body with Typographic Elegance */}
          <div className="relative pl-7 sm:pl-9 py-1">
            {/* Elegant Quotation Mark */}
            <Quote className="w-7 h-7 text-cyan-400/35 absolute left-0 top-0 transform -scale-x-100" />

            <div className="space-y-3">
              <blockquote className="text-base sm:text-lg md:text-xl font-normal text-slate-100 leading-relaxed font-serif tracking-normal">
                "{currentQuote.quote}"
              </blockquote>

              {/* Author & Verification Row */}
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap text-xs sm:text-sm">
                <div className="flex items-center gap-1.5 font-bold text-white font-display text-sm sm:text-base tracking-wide">
                  <span>{currentQuote.author}</span>
                  {currentQuote.authorLifespan && (
                    <span className="text-slate-500 font-mono text-xs font-normal">
                      ({currentQuote.authorLifespan})
                    </span>
                  )}
                  <span
                    className="inline-flex items-center justify-center p-0.5 rounded-full bg-cyan-500/20 text-cyan-300"
                    title="Verified historical figure"
                  >
                    <Check className="w-3 h-3 text-cyan-400" />
                  </span>
                </div>

                <span className="text-slate-600 hidden sm:inline">·</span>

                <span className="text-slate-300 text-xs font-medium">
                  {currentQuote.authorRole}
                </span>

                <span className="text-slate-600 hidden md:inline">·</span>

                <span className="text-slate-400 text-xs italic font-serif hidden md:inline">
                  {currentQuote.sourceWork}
                </span>
              </div>
            </div>
          </div>

          {/* Daily Active Study Directive Strip */}
          <div className="flex items-start sm:items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs">
            <div className="p-1 rounded-lg bg-cyan-500/15 text-cyan-400 shrink-0 mt-0.5 sm:mt-0">
              <Lightbulb className="w-3.5 h-3.5" />
            </div>
            <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 leading-relaxed">
              <span className="text-[10px] uppercase font-bold tracking-wider text-cyan-400 shrink-0">
                Daily Study Directive:
              </span>
              <span className="text-slate-200 font-medium">
                {currentQuote.actionTakeaway}
              </span>
            </div>
          </div>

          {/* Footer Metadata Strip */}
          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 font-mono border-t border-slate-800/60">
            <span className="flex items-center gap-1.5 text-slate-400 truncate">
              <BookOpen className="w-3 h-3 text-cyan-400 shrink-0" />
              <span className="truncate">{currentQuote.sourceWork}</span>
            </span>

            <span className="shrink-0 ml-2">
              Quote #{currentIndex + 1} of {filteredQuotes.length}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

// Export alias for backward compatibility
export const OfficialBingDailyQuote = DailyMotivationalQuote;
