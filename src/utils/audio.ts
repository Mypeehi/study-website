// Audio feedback synthesizer using native Web Audio API and SpeechSynthesis

let audioCtx: AudioContext | null = null;
let soundEnabled = true;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function setSoundEnabled(enabled: boolean) {
  soundEnabled = enabled;
}

export function isSoundEnabled(): boolean {
  return soundEnabled;
}

export function playCorrectSound() {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const gain = ctx.createGain();

  osc1.type = 'triangle';
  osc2.type = 'sine';

  osc1.frequency.setValueAtTime(523.25, now); // C5
  osc1.frequency.exponentialRampToValueAtTime(659.25, now + 0.12); // E5
  osc1.frequency.exponentialRampToValueAtTime(783.99, now + 0.25); // G5

  osc2.frequency.setValueAtTime(261.63, now); // C4
  osc2.frequency.exponentialRampToValueAtTime(392.00, now + 0.25); // G4

  gain.gain.setValueAtTime(0.15, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

  osc1.connect(gain);
  osc2.connect(gain);
  gain.connect(ctx.destination);

  osc1.start(now);
  osc2.start(now);
  osc1.stop(now + 0.4);
  osc2.stop(now + 0.4);
}

export function playIncorrectSound() {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(140, now);
  osc.frequency.exponentialRampToValueAtTime(90, now + 0.3);

  gain.gain.setValueAtTime(0.12, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.35);
}

export function playStreakFlameSound() {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const gain = ctx.createGain();

  osc1.type = 'sine';
  osc2.type = 'triangle';

  osc1.frequency.setValueAtTime(220, now);
  osc1.frequency.exponentialRampToValueAtTime(440, now + 0.15);
  osc1.frequency.exponentialRampToValueAtTime(880, now + 0.35);

  osc2.frequency.setValueAtTime(330, now);
  osc2.frequency.exponentialRampToValueAtTime(660, now + 0.35);

  gain.gain.setValueAtTime(0.15, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

  osc1.connect(gain);
  osc2.connect(gain);
  gain.connect(ctx.destination);

  osc1.start(now);
  osc2.start(now);
  osc1.stop(now + 0.45);
  osc2.stop(now + 0.45);
}

export function playVivaGavelSound() {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'square';
  osc.frequency.setValueAtTime(110, now);
  osc.frequency.exponentialRampToValueAtTime(45, now + 0.12);

  gain.gain.setValueAtTime(0.25, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.2);
}

export function playTimerTickSound() {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(800, now);

  gain.gain.setValueAtTime(0.04, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.04);
}

export function playPhaseCompleteChime() {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  // Resonant harmonic chime (A4 440, C#5 554.37, E5 659.25, A5 880)
  const freqs = [440, 554.37, 659.25, 880];
  freqs.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now + idx * 0.05);
    gain.gain.setValueAtTime(0.07, now + idx * 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2 + idx * 0.08);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now + idx * 0.05);
    osc.stop(now + 1.4);
  });
}

export function playDeepWorkGongSound() {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  // Deep singing bowl resonance (196Hz G3 fundamental + 392Hz G4 octave)
  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const gain = ctx.createGain();

  osc1.type = 'sine';
  osc2.type = 'triangle';
  osc1.frequency.setValueAtTime(196, now);
  osc2.frequency.setValueAtTime(392, now);

  gain.gain.setValueAtTime(0.16, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 1.8);

  osc1.connect(gain);
  osc2.connect(gain);
  gain.connect(ctx.destination);

  osc1.start(now);
  osc2.start(now);
  osc1.stop(now + 1.8);
  osc2.stop(now + 1.8);
}

// Text-to-Speech playback for The Angry Examiner
export function speakExaminerVoice(text: string, onEnd?: () => void) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  // Strip excessive markdown or symbols
  const cleanText = text.replace(/[*_#`[\]()]/g, ' ').replace(/\s+/g, ' ').trim();
  const utterance = new SpeechSynthesisUtterance(cleanText);

  // Attempt to select an authoritative or British English voice if available
  const voices = window.speechSynthesis.getVoices();
  const preferredVoice = voices.find(v => 
    v.lang.includes('en-GB') || v.name.includes('Daniel') || v.name.includes('George') || v.name.includes('Arthur') || v.name.includes('Male')
  ) || voices.find(v => v.lang.startsWith('en'));

  if (preferredVoice) {
    utterance.voice = preferredVoice;
  }

  utterance.pitch = 0.95; // Slightly lower, authoritative pitch
  utterance.rate = 1.05;  // Brisk, crisp delivery

  if (onEnd) {
    utterance.onend = onEnd;
    utterance.onerror = onEnd;
  }

  window.speechSynthesis.speak(utterance);
}

// Text-to-Speech playback for Official Daily Quotes (Bing Style)
export function speakDailyQuote(text: string, onEnd?: () => void) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;

  window.speechSynthesis.cancel();

  const cleanText = text.replace(/[*_#`[\]()]/g, ' ').replace(/\s+/g, ' ').trim();
  const utterance = new SpeechSynthesisUtterance(cleanText);

  const voices = window.speechSynthesis.getVoices();
  const preferredVoice = voices.find(v => 
    v.lang.includes('en-US') || v.lang.includes('en-GB') || v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha')
  ) || voices.find(v => v.lang.startsWith('en'));

  if (preferredVoice) {
    utterance.voice = preferredVoice;
  }

  utterance.pitch = 1.0;
  utterance.rate = 0.98; // Measured, thoughtful recitation pace

  if (onEnd) {
    utterance.onend = onEnd;
    utterance.onerror = onEnd;
  }

  window.speechSynthesis.speak(utterance);
}

// Sequenced speech: Speaks side talk first, triggers onSideTalkEnd to reveal question, then speaks question
export function speakSideTalkThenQuestion(
  sideTalk: string,
  question: string,
  onSideTalkEnd?: () => void,
  onAllEnd?: () => void
) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  const cleanSideTalk = sideTalk.replace(/[*_#`[\]()]/g, ' ').replace(/\s+/g, ' ').trim();
  const cleanQuestion = question.replace(/\[Exhibit A:[^\]]*\]/g, '').replace(/[*_#`[\]()]/g, ' ').replace(/\s+/g, ' ').trim();

  const voices = window.speechSynthesis.getVoices();
  const preferredVoice = voices.find(v => 
    v.lang.includes('en-GB') || v.name.includes('Daniel') || v.name.includes('George') || v.name.includes('Arthur') || v.name.includes('Male')
  ) || voices.find(v => v.lang.startsWith('en'));

  const uttSideTalk = new SpeechSynthesisUtterance(cleanSideTalk);
  if (preferredVoice) uttSideTalk.voice = preferredVoice;
  uttSideTalk.pitch = 0.95;
  uttSideTalk.rate = 1.05;

  let questionUtteranceStarted = false;

  const startQuestionSpeech = () => {
    if (questionUtteranceStarted) return;
    questionUtteranceStarted = true;
    onSideTalkEnd?.();

    if (!cleanQuestion) {
      onAllEnd?.();
      return;
    }

    const uttQuestion = new SpeechSynthesisUtterance(cleanQuestion);
    if (preferredVoice) uttQuestion.voice = preferredVoice;
    uttQuestion.pitch = 0.95;
    uttQuestion.rate = 1.02;

    uttQuestion.onend = () => {
      onAllEnd?.();
    };
    uttQuestion.onerror = () => {
      onAllEnd?.();
    };

    window.speechSynthesis.speak(uttQuestion);
  };

  uttSideTalk.onend = () => {
    startQuestionSpeech();
  };

  uttSideTalk.onerror = () => {
    startQuestionSpeech();
  };

  window.speechSynthesis.speak(uttSideTalk);
}

export function stopSpeaking() {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}

// -------------------------------------------------------------
// PART 2: THE NEUROLOGICAL SOUNDSCAPE SYNTHESIZER
// -------------------------------------------------------------

export type SoundscapeMode = 'off' | 'steady-state' | 'mario-kart' | 'anxiety-killer' | 'math-logic';

export interface RealVideoLink {
  title: string;
  channelOrArtist: string;
  youtubeId: string;
  youtubeUrl: string;
  duration: string;
  highlightTag: string;
}

export interface SoundscapeDetails {
  id: SoundscapeMode;
  title: string;
  subtitle: string;
  goal: string;
  why: string;
  topPicks: string[];
  youtubeSearch: string;
  bpmOrFreq: string;
  realVideos: RealVideoLink[];
}

export const SOUNDSCAPE_CATALOG: Record<Exclude<SoundscapeMode, 'off'>, SoundscapeDetails> = {
  'steady-state': {
    id: 'steady-state',
    title: 'The "Steady State" Flow',
    subtitle: 'Video Game Atmospheric Soundtracks',
    goal: 'Sustained focus without language distraction during deep reading & note-taking.',
    why: 'Video game music is engineered by million-dollar studios specifically to keep players engaged in tedious tasks for hours without realizing time has passed. Zero intrusive lyrics that collide with your phonological loop.',
    topPicks: ['Skyrim (Atmospheres)', 'Minecraft (C418)', 'Zelda: Breath of the Wild', 'The Witcher 3'],
    youtubeSearch: 'Skyrim Atmospheres 10 hours',
    bpmOrFreq: 'Ambient / Beatless Drone',
    realVideos: [
      {
        title: 'Skyrim Atmospheres (Jeremy Soule Official Ambient 10H)',
        channelOrArtist: 'Jeremy Soule / Bethesda Softworks',
        youtubeId: 'hBkcxd38_kQ',
        youtubeUrl: 'https://www.youtube.com/watch?v=hBkcxd38_kQ',
        duration: '10h 0m',
        highlightTag: 'Official Bethesda OST',
      },
      {
        title: 'Minecraft Volume Alpha - Full Album OST (C418)',
        channelOrArtist: 'C418 / Daniel Rosenfeld',
        youtubeId: 'Dg0IjOzopYU',
        youtubeUrl: 'https://www.youtube.com/watch?v=Dg0IjOzopYU',
        duration: '58m 51s',
        highlightTag: 'Zero Language Interference',
      },
      {
        title: 'Zelda: Breath of the Wild - Relaxing Ambient Night & Piano',
        channelOrArtist: 'Nintendo Sound Team',
        youtubeId: 'UolxbG6mR0I',
        youtubeUrl: 'https://www.youtube.com/watch?v=UolxbG6mR0I',
        duration: '3h 12m',
        highlightTag: 'Minimalist Atmospheric',
      },
      {
        title: 'The Witcher 3: Wild Hunt - Ambient Exploration & Rain',
        channelOrArtist: 'Marcin Przybyłowicz / CD Projekt Red',
        youtubeId: 'q_bLqHqJ_kM',
        youtubeUrl: 'https://www.youtube.com/watch?v=q_bLqHqJ_kM',
        duration: '2h 00m',
        highlightTag: 'Acoustic Soundscapes',
      },
    ],
  },
  'mario-kart': {
    id: 'mario-kart',
    title: 'The "Mario Kart Effect"',
    subtitle: 'High-BPM Electronic / Racing Drive',
    goal: 'Artificially induce urgency and speed up your workflow for deadlines, speed-runs, and flashcards.',
    why: 'Fast-paced 120+ BPM electronic and racing game music artificially elevates alertness and mimics a low-level fight-or-flight response, accelerating words typed and cards reviewed.',
    topPicks: ['Mario Kart (Coconut Mall)', 'DOOM (2016) Soundtrack', 'Cyberpunk 2077 Battle Tracks', '135 BPM Synthwave'],
    youtubeSearch: 'Mario Kart Coconut Mall 1 hour',
    bpmOrFreq: '128 - 135 BPM Pulse',
    realVideos: [
      {
        title: 'Mario Kart Wii - Coconut Mall (1 Hour Extended)',
        channelOrArtist: 'Nintendo / Asuka Ohta',
        youtubeId: 'Qgn83N72yXQ',
        youtubeUrl: 'https://www.youtube.com/watch?v=Qgn83N72yXQ',
        duration: '1h 0m',
        highlightTag: 'High-Urgency Sprint',
      },
      {
        title: 'DOOM (2016) Official Soundtrack - Mick Gordon BFG Division',
        channelOrArtist: 'Mick Gordon / Bethesda',
        youtubeId: 'Jm932Sqwf5E',
        youtubeUrl: 'https://www.youtube.com/watch?v=Jm932Sqwf5E',
        duration: '2h 08m',
        highlightTag: 'Maximum Adrenaline Drive',
      },
      {
        title: 'Cyberpunk 2077 - The Rebel Path & Action OST',
        channelOrArtist: 'P.T. Adamczyk / CD Projekt Red',
        youtubeId: 'P4bKxWwg350',
        youtubeUrl: 'https://www.youtube.com/watch?v=P4bKxWwg350',
        duration: '1h 05m',
        highlightTag: 'Aggressive Focus Pulse',
      },
      {
        title: 'Fast Synthwave / Darksynth 135 BPM Speed-Study Sprint',
        channelOrArtist: 'Retrowave Lab',
        youtubeId: '4xDzrJKXOOY',
        youtubeUrl: 'https://www.youtube.com/watch?v=4xDzrJKXOOY',
        duration: '2h 30m',
        highlightTag: '135 BPM Motor Reflexes',
      },
    ],
  },
  'anxiety-killer': {
    id: 'anxiety-killer',
    title: 'The "Anxiety Killer"',
    subtitle: '40Hz Gamma Binaural Beats & Deep Brown Noise',
    goal: 'Regulate heart rate, drop cortisol (stress hormone) levels, and blanket cafe/dorm background chatter.',
    why: 'Brown noise uses deep, low frequencies that blanket ambient noise far better than harsh white noise. 40Hz Gamma binaural beats synchronize neural oscillations to alleviate panic.',
    topPicks: ['40Hz Gamma Waves for Focus', 'Pure Low-Frequency Brown Noise', 'Gamma + Rain Noise Bed'],
    youtubeSearch: '40Hz Gamma Binaural Beats for Focus',
    bpmOrFreq: '40Hz Gamma / 200Hz-240Hz Carrier',
    realVideos: [
      {
        title: '40Hz Gamma Waves for Focus, Memory & Synaptic Health',
        channelOrArtist: 'Brainwave Power Music',
        youtubeId: 'WPni755-Krg',
        youtubeUrl: 'https://www.youtube.com/watch?v=WPni755-Krg',
        duration: '3h 00m',
        highlightTag: 'True 40Hz Gamma Oscillation',
      },
      {
        title: 'Pure Deep Brown Noise (10 Hours) - Heavy Acoustic Dampening',
        channelOrArtist: 'Relaxing White Noise',
        youtubeId: 'RqzGzwTY-6w',
        youtubeUrl: 'https://www.youtube.com/watch?v=RqzGzwTY-6w',
        duration: '10h 0m',
        highlightTag: 'Brownian Low-Pass Filter',
      },
      {
        title: '40Hz Isochronic Tone Brainwave Synchronizer + Rain',
        channelOrArtist: 'Neuro Focus Lab',
        youtubeId: '2Tz8c3d2Hh8',
        youtubeUrl: 'https://www.youtube.com/watch?v=2Tz8c3d2Hh8',
        duration: '2h 15m',
        highlightTag: 'Cortisol Reduction Bed',
      },
    ],
  },
  'math-logic': {
    id: 'math-logic',
    title: 'The "Math & Logic" Track',
    subtitle: '60 BPM Baroque Classical Structure',
    goal: 'Heighten mathematical pattern recognition and logical deductive reasoning.',
    why: 'The 60 BPM tempo and mathematically rigorous counterpoint of Baroque masters (Bach, Vivaldi, Telemann) synchronizes alpha-theta brain states optimal for solving multi-step logic problems.',
    topPicks: ['J.S. Bach (Brandenburg Concertos & Cello Suites)', 'Vivaldi (L\'Estro Armonico)', 'Baroque Focus Suite'],
    youtubeSearch: 'Bach Baroque 60 BPM for Math and Logic Focus',
    bpmOrFreq: '60 BPM Adagio / Andante',
    realVideos: [
      {
        title: 'J.S. Bach - 60 BPM Baroque Music for Studying and Brain Power',
        channelOrArtist: 'Classical Masterworks',
        youtubeId: '6r0tEw8U70Y',
        youtubeUrl: 'https://www.youtube.com/watch?v=6r0tEw8U70Y',
        duration: '3h 02m',
        highlightTag: 'Strict 60 BPM Adagio Structure',
      },
      {
        title: 'Vivaldi - 60 BPM L\'Estro Armonico & Concerti for Math Focus',
        channelOrArtist: 'Halidon Music / European Philharmonic',
        youtubeId: 'GRxofEmo3HA',
        youtubeUrl: 'https://www.youtube.com/watch?v=GRxofEmo3HA',
        duration: '2h 18m',
        highlightTag: 'Mathematical Counterpoint',
      },
      {
        title: 'Baroque Concentration & Memory: Telemann, Corelli & Bach',
        channelOrArtist: 'Focus Baroque Ensemble',
        youtubeId: 'mGQLXRTl3Z0',
        youtubeUrl: 'https://www.youtube.com/watch?v=mGQLXRTl3Z0',
        duration: '4h 00m',
        highlightTag: 'Alpha-Theta Synchronization',
      },
    ],
  },
};

let currentSoundscapeMode: SoundscapeMode = 'off';
let soundscapeGainNode: GainNode | null = null;
let soundscapeIntervals: any[] = [];
let soundscapeNodes: any[] = [];

export function getActiveSoundscape(): SoundscapeMode {
  return currentSoundscapeMode;
}

export function stopSoundscape() {
  soundscapeIntervals.forEach(clearInterval);
  soundscapeIntervals = [];

  soundscapeNodes.forEach(node => {
    try {
      if (node.stop) node.stop();
      if (node.disconnect) node.disconnect();
    } catch (e) {}
  });
  soundscapeNodes = [];

  if (soundscapeGainNode) {
    try {
      const ctx = getAudioContext();
      if (ctx) {
        soundscapeGainNode.gain.setValueAtTime(soundscapeGainNode.gain.value, ctx.currentTime);
        soundscapeGainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.3);
      }
      setTimeout(() => {
        try {
          soundscapeGainNode?.disconnect();
          soundscapeGainNode = null;
        } catch (e) {}
      }, 350);
    } catch (e) {}
  }

  currentSoundscapeMode = 'off';
}

export function startSoundscape(mode: SoundscapeMode, masterVol = 0.35) {
  if (currentSoundscapeMode === mode && mode !== 'off') {
    return;
  }

  stopSoundscape();
  if (mode === 'off' || !soundEnabled) {
    return;
  }

  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(0.001, now);
  masterGain.gain.exponentialRampToValueAtTime(Math.max(0.01, Math.min(1, masterVol)), now + 0.5);
  masterGain.connect(ctx.destination);
  soundscapeGainNode = masterGain;
  currentSoundscapeMode = mode;

  if (mode === 'anxiety-killer') {
    // 1. Synthesize True 40Hz Binaural Beats (Left 200 Hz, Right 240 Hz = 40 Hz perceptual beat)
    // plus a warm bed of filtered Brown Noise
    const merger = ctx.createChannelMerger ? ctx.createChannelMerger(2) : null;

    const oscLeft = ctx.createOscillator();
    const oscRight = ctx.createOscillator();
    const beatGain = ctx.createGain();
    beatGain.gain.value = 0.25;

    oscLeft.type = 'sine';
    oscRight.type = 'sine';
    oscLeft.frequency.value = 200; // Left ear
    oscRight.frequency.value = 240; // Right ear -> 40Hz binaural difference

    if (merger) {
      oscLeft.connect(merger, 0, 0); // Left channel
      oscRight.connect(merger, 0, 1); // Right channel
      merger.connect(beatGain);
    } else {
      oscLeft.connect(beatGain);
      oscRight.connect(beatGain);
    }
    beatGain.connect(masterGain);

    oscLeft.start(now);
    oscRight.start(now);
    soundscapeNodes.push(oscLeft, oscRight, beatGain);

    // Brown Noise Generator (Brownian integration)
    const bufferSize = 2 * ctx.sampleRate;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      output[i] = (lastOut + (0.02 * white)) / 1.02;
      lastOut = output[i];
      output[i] *= 3.5; // Gain boost
    }

    const brownNoise = ctx.createBufferSource();
    brownNoise.buffer = noiseBuffer;
    brownNoise.loop = true;

    const brownFilter = ctx.createBiquadFilter();
    brownFilter.type = 'lowpass';
    brownFilter.frequency.value = 350; // Deep comforting frequencies

    const brownGain = ctx.createGain();
    brownGain.gain.value = 0.45;

    brownNoise.connect(brownFilter);
    brownFilter.connect(brownGain);
    brownGain.connect(masterGain);

    brownNoise.start(now);
    soundscapeNodes.push(brownNoise, brownFilter, brownGain);

  } else if (mode === 'steady-state') {
    // 2. The "Steady State" Flow: Ambient video-game style layered drone in C Major (C - G - E - A)
    // with subtle detuned chorus and soft low-pass filter
    const freqs = [130.81, 164.81, 196.00, 220.00]; // C3, E3, G3, A3
    const droneGain = ctx.createGain();
    droneGain.gain.value = 0.22;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(450, now);

    freqs.forEach((f, idx) => {
      const osc = ctx.createOscillator();
      osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(f, now);
      // Gentle detuning for spatial richness
      osc.detune.setValueAtTime(idx * 4 - 6, now);

      osc.connect(filter);
      osc.start(now);
      soundscapeNodes.push(osc);
    });

    filter.connect(droneGain);
    droneGain.connect(masterGain);
    soundscapeNodes.push(filter, droneGain);

  } else if (mode === 'mario-kart') {
    // 3. The "Mario Kart Effect": 130 BPM high-energy electronic bass pulse & rhythm
    // 130 BPM = 60 / 130 = 0.4615 seconds per beat
    const beatInterval = (60 / 130) * 1000;
    let step = 0;

    const triggerBeat = () => {
      const ctx = getAudioContext();
      if (!ctx || currentSoundscapeMode !== 'mario-kart' || !soundscapeGainNode) return;
      const t = ctx.currentTime;

      // Punchy Bass kick/synth
      const bassOsc = ctx.createOscillator();
      const bassGain = ctx.createGain();
      bassOsc.type = 'triangle';

      const baseNote = step % 4 === 0 ? 65.41 : step % 4 === 2 ? 73.42 : 55.00; // C2, D2, A1
      bassOsc.frequency.setValueAtTime(baseNote * 1.5, t);
      bassOsc.frequency.exponentialRampToValueAtTime(baseNote, t + 0.08);

      bassGain.gain.setValueAtTime(0.28, t);
      bassGain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

      bassOsc.connect(bassGain);
      bassGain.connect(masterGain);
      bassOsc.start(t);
      bassOsc.stop(t + 0.2);

      // Electronic Hi-Hat on off-beats
      if (step % 2 === 1) {
        const hatOsc = ctx.createOscillator();
        const hatGain = ctx.createGain();
        hatOsc.type = 'square';
        hatOsc.frequency.setValueAtTime(1200, t);

        hatGain.gain.setValueAtTime(0.05, t);
        hatGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);

        hatOsc.connect(hatGain);
        hatGain.connect(masterGain);
        hatOsc.start(t);
        hatOsc.stop(t + 0.05);
      }

      step++;
    };

    triggerBeat();
    const intervalId = setInterval(triggerBeat, beatInterval);
    soundscapeIntervals.push(intervalId);

  } else if (mode === 'math-logic') {
    // 4. The "Math & Logic" Track: 60 BPM Baroque Chamber Arpeggiator (1 beat per second)
    // Mathematical Circle-of-Fifths progression in D Minor / F Major
    const baroqueNotes = [
      [293.66, 349.23, 440.00], // D4, F4, A4 (Dm)
      [261.63, 329.63, 392.00], // C4, E4, G4 (C)
      [220.00, 277.18, 329.63], // A3, C#4, E4 (A)
      [349.23, 440.00, 523.25], // F4, A4, C5 (F)
      [246.94, 293.66, 370.00], // B3, D4, F#4 (Bdim/G)
      [293.66, 349.23, 440.00], // D4, F4, A4 (Dm)
    ];

    let chordIdx = 0;
    let noteInChord = 0;

    const triggerBaroqueTick = () => {
      const ctx = getAudioContext();
      if (!ctx || currentSoundscapeMode !== 'math-logic' || !soundscapeGainNode) return;
      const t = ctx.currentTime;

      const chord = baroqueNotes[chordIdx % baroqueNotes.length];
      const freq = chord[noteInChord % chord.length];

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);

      // Harpsichord-like attack and quick mathematical decay
      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);

      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(t);
      osc.stop(t + 0.48);

      noteInChord++;
      if (noteInChord >= chord.length) {
        noteInChord = 0;
        chordIdx++;
      }
    };

    triggerBaroqueTick();
    const intervalId = setInterval(triggerBaroqueTick, 500); // 120 subdivisions = 60 BPM quarter notes
    soundscapeIntervals.push(intervalId);
  }
}

/**
 * Triumphant fanfare synthesized for Achievement unlocks, scaled by rarity
 */
export function playAchievementUnlockSound(rarity: string = 'Common') {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  
  // Note frequencies: C major / Lydian celebratory fanfare
  let notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
  let duration = 0.8;
  let masterVol = 0.16;

  if (rarity === 'Legendary') {
    // Majestic grand fanfare (C5, G5, C6, E6, G6 sparkle)
    notes = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98];
    duration = 1.4;
    masterVol = 0.22;
  } else if (rarity === 'Epic') {
    notes = [587.33, 739.99, 880.00, 1174.66, 1479.98]; // D, F#, A, D, F#
    duration = 1.1;
    masterVol = 0.19;
  } else if (rarity === 'Rare') {
    notes = [523.25, 659.25, 783.99, 1046.50];
    duration = 0.9;
    masterVol = 0.17;
  }

  notes.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = rarity === 'Legendary' ? 'sine' : 'triangle';
    osc.frequency.setValueAtTime(freq, now + idx * 0.08);

    gain.gain.setValueAtTime(masterVol, now + idx * 0.08);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now + idx * 0.08);
    osc.stop(now + idx * 0.08 + duration);
  });
}

