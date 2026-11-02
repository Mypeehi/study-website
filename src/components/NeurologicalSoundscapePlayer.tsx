import React, { useState, useEffect } from 'react';
import {
  Headphones,
  Volume2,
  VolumeX,
  Play,
  Pause,
  ExternalLink,
  Youtube,
  Tv,
  X,
  Sparkles,
  Music,
  Zap,
  Activity,
  CheckCircle2,
  Film
} from 'lucide-react';
import {
  SoundscapeMode,
  SOUNDSCAPE_CATALOG,
  RealVideoLink,
  getActiveSoundscape,
  startSoundscape,
  stopSoundscape,
} from '../utils/audio';

interface NeurologicalSoundscapePlayerProps {
  compact?: boolean;
}

export const NeurologicalSoundscapePlayer: React.FC<NeurologicalSoundscapePlayerProps> = ({
  compact = false,
}) => {
  const [activeMode, setActiveMode] = useState<SoundscapeMode>(getActiveSoundscape());
  const [volume, setVolume] = useState<number>(0.35);
  // Track selected category for real video browsing (defaults to activeMode or 'steady-state')
  const [browseCategory, setBrowseCategory] = useState<Exclude<SoundscapeMode, 'off'>>('steady-state');
  // In-app embedded real video player state
  const [activeEmbedVideo, setActiveEmbedVideo] = useState<RealVideoLink | null>(null);
  // Compact mode modal state
  const [showCompactVideoModal, setShowCompactVideoModal] = useState<boolean>(false);

  useEffect(() => {
    const current = getActiveSoundscape();
    setActiveMode(current);
    if (current !== 'off') {
      setBrowseCategory(current);
    }
  }, []);

  const handleToggleMode = (mode: SoundscapeMode) => {
    if (activeMode === mode) {
      stopSoundscape();
      setActiveMode('off');
    } else {
      // If user starts web audio synthesis while an embedded video is playing, warn or keep separate
      startSoundscape(mode, volume);
      setActiveMode(mode);
      if (mode !== 'off') {
        setBrowseCategory(mode);
      }
    }
  };

  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    if (activeMode !== 'off') {
      startSoundscape(activeMode, newVol);
    }
  };

  const handlePlayEmbeddedVideo = (video: RealVideoLink) => {
    // Stop Web Audio synth so real video and synth don't clash
    if (activeMode !== 'off') {
      stopSoundscape();
      setActiveMode('off');
    }
    setActiveEmbedVideo(video);
  };

  const handleCloseEmbedVideo = () => {
    setActiveEmbedVideo(null);
  };

  // Compact layout for study session top bar
  if (compact) {
    const currentVideos = activeMode !== 'off'
      ? SOUNDSCAPE_CATALOG[activeMode].realVideos
      : SOUNDSCAPE_CATALOG[browseCategory].realVideos;
    const topVideo = currentVideos[0];

    return (
      <div className="flex items-center gap-2 bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-1.5 text-xs">
        <Headphones className="w-3.5 h-3.5 text-amber-400 shrink-0" />
        <select
          value={activeMode}
          onChange={e => {
            const nextMode = e.target.value as SoundscapeMode;
            handleToggleMode(nextMode);
            if (nextMode !== 'off') setBrowseCategory(nextMode);
          }}
          className="bg-transparent text-slate-200 outline-none text-xs cursor-pointer font-medium"
        >
          <option value="off" className="bg-slate-900 text-slate-400">🔇 Soundscape: Off</option>
          <option value="steady-state" className="bg-slate-900 text-slate-200">🎮 Steady State (OSTs)</option>
          <option value="mario-kart" className="bg-slate-900 text-slate-200">🏎️ Mario Kart (130 BPM)</option>
          <option value="anxiety-killer" className="bg-slate-900 text-slate-200">🌊 40Hz / Brown Noise</option>
          <option value="math-logic" className="bg-slate-900 text-slate-200">🎻 60 BPM Baroque Logic</option>
        </select>

        {activeMode !== 'off' && (
          <button
            type="button"
            onClick={() => handleToggleMode(activeMode)}
            className="p-1 rounded bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 cursor-pointer"
            title="Stop Soundscape Synth"
          >
            <Pause className="w-3 h-3" />
          </button>
        )}

        {/* Real Video Link in Compact Bar */}
        {topVideo && (
          <div className="flex items-center gap-1 pl-1.5 border-l border-slate-800">
            <a
              href={topVideo.youtubeUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 px-2 py-0.5 rounded bg-rose-600/15 hover:bg-rose-600/25 text-rose-300 border border-rose-500/30 text-[11px] font-medium transition-colors"
              title={`Watch Real Video on YouTube: ${topVideo.title}`}
            >
              <Youtube className="w-3 h-3 text-rose-400" />
              <span className="hidden sm:inline">Real Video</span>
              <ExternalLink className="w-2.5 h-2.5 opacity-70" />
            </a>

            <button
              type="button"
              onClick={() => setShowCompactVideoModal(!showCompactVideoModal)}
              className="p-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
              title="Browse all curated real study videos"
            >
              <Tv className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Compact Real Video Quick Drawer/Modal */}
        {showCompactVideoModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-5 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Youtube className="w-4 h-4 text-rose-500" />
                  <h3 className="text-sm font-bold text-white">Curated Real Study Videos</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCompactVideoModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {currentVideos.map((video, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 hover:border-slate-700 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-white truncate">{video.title}</p>
                      <p className="text-[10px] text-slate-400">{video.channelOrArtist} · {video.duration}</p>
                    </div>
                    <a
                      href={video.youtubeUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="shrink-0 px-2.5 py-1 rounded bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 text-[11px] font-medium flex items-center gap-1"
                    >
                      <span>Watch</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  const selectedDetails = SOUNDSCAPE_CATALOG[browseCategory];
  const activeDetails = activeMode !== 'off' ? SOUNDSCAPE_CATALOG[activeMode] : null;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 space-y-7 shadow-xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-cyan-400 uppercase tracking-wider mb-1">
            <Headphones className="w-4 h-4 text-cyan-400" />
            <span>Part 2: The Neurological Soundscape</span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold font-display text-white">
            What to Listen To (Brainwave Audio Engine & Real Videos)
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xl leading-relaxed">
            Listening to songs with lyrics is academic sabotage—they collide directly with your brain's phonological loop. 
            Use zero-lyric game OSTs, 40Hz binaural beats, or 60 BPM Baroque counterpoint to enter deep focus.
          </p>
        </div>

        {/* Master Web Audio Controller */}
        <div className="flex items-center gap-3 bg-slate-950 border border-slate-800 px-4 py-2.5 rounded-xl self-stretch sm:self-auto">
          <button
            type="button"
            onClick={() => {
              if (activeEmbedVideo) setActiveEmbedVideo(null);
              activeMode === 'off' ? handleToggleMode('steady-state') : stopSoundscape();
            }}
            className={`p-2 rounded-lg text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors ${
              activeMode !== 'off'
                ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            {activeMode !== 'off' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            <span>{activeMode !== 'off' ? 'Synth Active' : 'Start Web Audio'}</span>
          </button>

          <div className="flex items-center gap-1.5 pl-1 border-l border-slate-800">
            <Volume2 className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="range"
              min={0.05}
              max={0.8}
              step={0.05}
              value={volume}
              onChange={e => handleVolumeChange(parseFloat(e.target.value))}
              className="w-16 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
              title="Soundscape Volume"
            />
          </div>
        </div>
      </div>

      {/* Embedded Real Video Player Box (if user selected in-app play) */}
      {activeEmbedVideo && (
        <div className="bg-slate-950 border-2 border-rose-500/40 rounded-2xl p-4 md:p-5 space-y-4 shadow-2xl animate-fadeIn">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <span className="p-1.5 rounded-lg bg-rose-600/20 text-rose-400 border border-rose-500/30">
                <Film className="w-4 h-4" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                    Now Streaming Real Video
                  </span>
                  <span className="text-xs text-slate-400">{activeEmbedVideo.duration}</span>
                </div>
                <h3 className="text-sm md:text-base font-bold text-white mt-0.5">
                  {activeEmbedVideo.title}
                </h3>
                <p className="text-xs text-slate-400">
                  By {activeEmbedVideo.channelOrArtist} · {activeEmbedVideo.highlightTag}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <a
                href={activeEmbedVideo.youtubeUrl}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Open in new YouTube window"
              >
                <span>Open YouTube</span>
                <ExternalLink className="w-3 h-3 text-rose-400" />
              </a>

              <button
                type="button"
                onClick={handleCloseEmbedVideo}
                className="p-1.5 rounded-lg bg-slate-900 hover:bg-rose-950/60 text-slate-400 hover:text-rose-300 border border-slate-800 cursor-pointer transition-colors"
                title="Close embedded video player"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* YouTube IFrame Embed Container */}
          <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black shadow-inner border border-slate-800">
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${activeEmbedVideo.youtubeId}?autoplay=1&rel=0`}
              title={activeEmbedVideo.title}
              className="absolute inset-0 w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
            <span className="flex items-center gap-1.5 text-amber-400/90 text-[11px]">
              <Sparkles className="w-3.5 h-3.5" />
              Web Audio synth is automatically paused while streaming real YouTube video audio.
            </span>
            <button
              type="button"
              onClick={handleCloseEmbedVideo}
              className="text-xs text-slate-400 hover:text-white underline cursor-pointer"
            >
              Close Embed
            </button>
          </div>
        </div>
      )}

      {/* 4 Soundscape Category Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Choose Your Brainwave Profile:
          </span>
          <span className="text-[11px] text-slate-500">
            Click card to synthesize Web Audio or click video button to watch real recordings
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Steady State Flow */}
          <div
            onClick={() => {
              setBrowseCategory('steady-state');
              handleToggleMode('steady-state');
            }}
            className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 relative group ${
              activeMode === 'steady-state'
                ? 'bg-indigo-950/40 border-indigo-500 ring-2 ring-indigo-500/30'
                : browseCategory === 'steady-state'
                  ? 'bg-slate-950 border-indigo-500/50'
                  : 'bg-slate-950 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                  Video Game OSTs
                </span>
                <span className="text-[10px] font-mono-numbers px-1.5 py-0.5 rounded bg-slate-900 text-slate-400">
                  Deep Reading
                </span>
              </div>
              <h3 className="text-sm font-bold text-white">The "Steady State" Flow</h3>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Designed by sound engineers to keep you engaged in tedious grinding for hours without realizing time has passed.
              </p>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-800/80 text-[11px]">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Skyrim · Zelda · C418</span>
                <span className={`font-semibold ${activeMode === 'steady-state' ? 'text-indigo-300' : 'text-slate-400'}`}>
                  {activeMode === 'steady-state' ? '▶ Synth Active' : 'Click to Play'}
                </span>
              </div>

              {/* Direct Real Video Badge & Browse Shortcut */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setBrowseCategory('steady-state');
                }}
                className="w-full py-1 px-2 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[11px] font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Youtube className="w-3 h-3 text-rose-400" />
                <span>4 Real Videos Linked</span>
              </button>
            </div>
          </div>

          {/* 2. Mario Kart Effect */}
          <div
            onClick={() => {
              setBrowseCategory('mario-kart');
              handleToggleMode('mario-kart');
            }}
            className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 relative group ${
              activeMode === 'mario-kart'
                ? 'bg-rose-950/40 border-rose-500 ring-2 ring-rose-500/30'
                : browseCategory === 'mario-kart'
                  ? 'bg-slate-950 border-rose-500/50'
                  : 'bg-slate-950 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-rose-400 uppercase tracking-wider">
                  120+ BPM Pulse
                </span>
                <span className="text-[10px] font-mono-numbers px-1.5 py-0.5 rounded bg-slate-900 text-slate-400">
                  Speed Sprints
                </span>
              </div>
              <h3 className="text-sm font-bold text-white">The "Mario Kart Effect"</h3>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Artificially elevates heart rate and induces mild fight-or-flight arousal to speed up typing and flashcard speed-runs.
              </p>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-800/80 text-[11px]">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Coconut Mall · DOOM</span>
                <span className={`font-semibold ${activeMode === 'mario-kart' ? 'text-rose-300' : 'text-slate-400'}`}>
                  {activeMode === 'mario-kart' ? '▶ 130 BPM Active' : 'Click to Play'}
                </span>
              </div>

              {/* Direct Real Video Badge & Browse Shortcut */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setBrowseCategory('mario-kart');
                }}
                className="w-full py-1 px-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[11px] font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Youtube className="w-3 h-3 text-rose-400" />
                <span>4 Real Videos Linked</span>
              </button>
            </div>
          </div>

          {/* 3. Anxiety Killer */}
          <div
            onClick={() => {
              setBrowseCategory('anxiety-killer');
              handleToggleMode('anxiety-killer');
            }}
            className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 relative group ${
              activeMode === 'anxiety-killer'
                ? 'bg-cyan-950/40 border-cyan-500 ring-2 ring-cyan-500/30'
                : browseCategory === 'anxiety-killer'
                  ? 'bg-slate-950 border-cyan-500/50'
                  : 'bg-slate-950 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
                  40Hz & Brown Noise
                </span>
                <span className="text-[10px] font-mono-numbers px-1.5 py-0.5 rounded bg-slate-900 text-slate-400">
                  Cortisol Drop
                </span>
              </div>
              <h3 className="text-sm font-bold text-white">The "Anxiety Killer"</h3>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                True 40Hz Gamma binaural beats + low-frequency brown noise blanket cafe/dorm chatter and soothe exam dread.
              </p>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-800/80 text-[11px]">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Deep Acoustic Mask</span>
                <span className={`font-semibold ${activeMode === 'anxiety-killer' ? 'text-cyan-300' : 'text-slate-400'}`}>
                  {activeMode === 'anxiety-killer' ? '▶ 40Hz Waves' : 'Click to Play'}
                </span>
              </div>

              {/* Direct Real Video Badge & Browse Shortcut */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setBrowseCategory('anxiety-killer');
                }}
                className="w-full py-1 px-2 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[11px] font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Youtube className="w-3 h-3 text-rose-400" />
                <span>3 Real Videos Linked</span>
              </button>
            </div>
          </div>

          {/* 4. Math & Logic */}
          <div
            onClick={() => {
              setBrowseCategory('math-logic');
              handleToggleMode('math-logic');
            }}
            className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 relative group ${
              activeMode === 'math-logic'
                ? 'bg-amber-950/40 border-amber-500 ring-2 ring-amber-500/30'
                : browseCategory === 'math-logic'
                  ? 'bg-slate-950 border-amber-500/50'
                  : 'bg-slate-950 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                  60 BPM Baroque
                </span>
                <span className="text-[10px] font-mono-numbers px-1.5 py-0.5 rounded bg-slate-900 text-slate-400">
                  Logic / Math
                </span>
              </div>
              <h3 className="text-sm font-bold text-white">The "Math & Logic" Track</h3>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Mathematical counterpoint (Bach, Vivaldi) puts the brain in an optimal state for complex multi-step deductions.
              </p>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-800/80 text-[11px]">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Bach · Vivaldi</span>
                <span className={`font-semibold ${activeMode === 'math-logic' ? 'text-amber-300' : 'text-slate-400'}`}>
                  {activeMode === 'math-logic' ? '▶ 60 BPM Active' : 'Click to Play'}
                </span>
              </div>

              {/* Direct Real Video Badge & Browse Shortcut */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setBrowseCategory('math-logic');
                }}
                className="w-full py-1 px-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Youtube className="w-3 h-3 text-rose-400" />
                <span>3 Real Videos Linked</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Curated Real Study Videos & Official Soundtracks Showcase */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 md:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Youtube className="w-5 h-5 text-rose-500" />
              <h3 className="text-base font-bold text-white">
                Linked Real Videos: {selectedDetails.title}
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold">
                {selectedDetails.realVideos.length} Curated Tracks
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Verified full-length authentic recordings and OSTs with zero distracting lyrics. Watch on YouTube or stream embedded in-app.
            </p>
          </div>

          {/* Soundscape Category Switcher Tabs */}
          <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs self-stretch sm:self-auto overflow-x-auto">
            <button
              type="button"
              onClick={() => setBrowseCategory('steady-state')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap cursor-pointer ${
                browseCategory === 'steady-state'
                  ? 'bg-indigo-600 text-white font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Steady State OSTs
            </button>
            <button
              type="button"
              onClick={() => setBrowseCategory('mario-kart')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap cursor-pointer ${
                browseCategory === 'mario-kart'
                  ? 'bg-rose-600 text-white font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Mario Kart (130 BPM)
            </button>
            <button
              type="button"
              onClick={() => setBrowseCategory('anxiety-killer')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap cursor-pointer ${
                browseCategory === 'anxiety-killer'
                  ? 'bg-cyan-600 text-white font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              40Hz / Brown Noise
            </button>
            <button
              type="button"
              onClick={() => setBrowseCategory('math-logic')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap cursor-pointer ${
                browseCategory === 'math-logic'
                  ? 'bg-amber-600 text-white font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              60 BPM Baroque
            </button>
          </div>
        </div>

        {/* Video Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {selectedDetails.realVideos.map((video, idx) => (
            <div
              key={idx}
              className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden hover:border-slate-700 transition-all flex flex-col justify-between group"
            >
              {/* Thumbnail with overlay duration & tags */}
              <div className="relative aspect-video bg-black overflow-hidden">
                <img
                  src={`https://img.youtube.com/vi/${video.youtubeId}/mqdefault.jpg`}
                  alt={video.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-90 group-hover:opacity-100"
                  loading="lazy"
                />
                
                {/* Duration Badge */}
                <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/80 backdrop-blur-sm text-[10px] font-mono-numbers text-white font-semibold">
                  {video.duration}
                </span>

                {/* Highlight Tag */}
                <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-slate-900/85 backdrop-blur-sm text-[10px] font-bold text-amber-300 border border-amber-500/20">
                  {video.highlightTag}
                </span>

                {/* Play Button Overlay on Hover */}
                <button
                  type="button"
                  onClick={() => handlePlayEmbeddedVideo(video)}
                  className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  title="Play embedded in app"
                >
                  <div className="w-11 h-11 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                    <Play className="w-5 h-5 ml-0.5 fill-white" />
                  </div>
                </button>
              </div>

              {/* Title & Metadata */}
              <div className="p-3.5 space-y-2 flex-1 flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white line-clamp-2 leading-snug group-hover:text-amber-400 transition-colors">
                    {video.title}
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-1">
                    {video.channelOrArtist}
                  </p>
                </div>

                {/* Video Action Buttons: Watch on YouTube & Play Embedded */}
                <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                  <a
                    href={video.youtubeUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 py-1.5 px-2.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                    title={`Open on YouTube: ${video.title}`}
                  >
                    <Youtube className="w-3.5 h-3.5" />
                    <span>Watch on YouTube</span>
                    <ExternalLink className="w-3 h-3 opacity-80" />
                  </a>

                  <button
                    type="button"
                    onClick={() => handlePlayEmbeddedVideo(video)}
                    className="py-1.5 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
                    title="Play embedded right in this page"
                  >
                    <Tv className="w-3.5 h-3.5 text-amber-400" />
                    <span>In-App</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Why this audio works & YouTube Search Fallback */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-800/80 text-xs text-slate-400">
          <div className="max-w-xl">
            <span className="font-semibold text-amber-400">Neurological Mechanism: </span>
            <span>{selectedDetails.why}</span>
          </div>

          <a
            href={`https://www.youtube.com/results?search_query=${encodeURIComponent(selectedDetails.youtubeSearch)}`}
            target="_blank"
            rel="noreferrer"
            className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-medium flex items-center gap-1.5 self-start sm:self-auto cursor-pointer transition-colors shrink-0"
          >
            <span>Search more "{selectedDetails.youtubeSearch}"</span>
            <ExternalLink className="w-3 h-3 text-slate-500" />
          </a>
        </div>
      </div>
    </div>
  );
};
