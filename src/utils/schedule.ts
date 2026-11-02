import { ScheduleBlock, StudyPhase, StudyScheduleData } from '../types';

export const SCHEDULE_WEIGHTS: Record<string, Record<Exclude<StudyPhase, 'Break'>, number>> = {
  'Math/Science': {
    'Pretest': 0.10,
    'Core Sprint': 0.25,
    'Blurting': 0.15,
    'Application': 0.35,
    'Teach-Back': 0.15
  },
  'Reading/Writing': {
    'Pretest': 0.10,
    'Core Sprint': 0.40,
    'Blurting': 0.25,
    'Application': 0.10,
    'Teach-Back': 0.15
  },
  'General': {
    'Pretest': 0.10,
    'Core Sprint': 0.30,
    'Blurting': 0.20,
    'Application': 0.20,
    'Teach-Back': 0.20
  }
};

export const PHASE_CONFIG: Record<StudyPhase, {
  label: string;
  badgeColor: string;
  barColor: string;
  textColor: string;
  borderColor: string;
  description: string;
  actionGuidance: string;
}> = {
  'Pretest': {
    label: 'Pretest',
    badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
    barColor: 'bg-cyan-500',
    textColor: 'text-cyan-400',
    borderColor: 'border-cyan-500/30',
    description: 'Diagnostic recall check before reading notes or explanations.',
    actionGuidance: 'Attempt the questions before reading. Pretesting primes your brain\'s reticular activating system to hunt for answers.'
  },
  'Core Sprint': {
    label: 'Core Sprint',
    badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
    barColor: 'bg-indigo-500',
    textColor: 'text-indigo-400',
    borderColor: 'border-indigo-500/30',
    description: 'High-intensity causal mechanism deconstruction.',
    actionGuidance: 'Isolate the rate-limiting control point. Never memorize disconnected lists—trace what triggers step 1, 2, and 3.'
  },
  'Blurting': {
    label: 'Blurting (Brain Dump)',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    barColor: 'bg-amber-500',
    textColor: 'text-amber-400',
    borderColor: 'border-amber-500/30',
    description: 'Close all notes and write everything you recall in 3-5 minutes.',
    actionGuidance: 'Close the screen or book. Brain-dump every formula, enzyme, date, or step. Then compare with the answer key to spotlight gaps.'
  },
  'Application': {
    label: 'Application (Exam Problems)',
    badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
    barColor: 'bg-rose-500',
    textColor: 'text-rose-400',
    borderColor: 'border-rose-500/30',
    description: 'Practice exam-style questions under timed pressure.',
    actionGuidance: 'Work through multiple-choice questions or multi-step diagram questions without hints. Notice examiner traps.'
  },
  'Teach-Back': {
    label: 'Teach-Back (Feynman Method)',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    barColor: 'bg-emerald-500',
    textColor: 'text-emerald-400',
    borderColor: 'border-emerald-500/30',
    description: 'Explain the mechanism out loud in simple English to the examiner.',
    actionGuidance: 'If you cannot explain it simply without saying "basically" or hand-waving, you don\'t understand it yet.'
  },
  'Break': {
    label: 'Rest & Hydration Break',
    badgeColor: 'bg-slate-800 text-slate-300 border-slate-700',
    barColor: 'bg-slate-700',
    textColor: 'text-slate-400',
    borderColor: 'border-slate-800',
    description: 'Mandatory neurological recovery window.',
    actionGuidance: 'Step away from all screens. Drink cold water, stretch your neck, and stare 20 feet away to relax the ciliary eye muscles.'
  }
};

export function generateSchedule(
  hours: number = 2,
  subject: 'Math/Science' | 'Reading/Writing' | 'General' | string = 'Math/Science',
  isDeepWork: boolean = true
): StudyScheduleData {
  const totalMins = Math.max(30, Math.min(240, (hours ?? 2) * 60));
  const cycleWork = isDeepWork ? 50 : 25;
  const cycleBreak = isDeepWork ? 10 : 5;
  const cycleTotal = cycleWork + cycleBreak;

  const weights = SCHEDULE_WEIGHTS[subject] ?? SCHEDULE_WEIGHTS['General'];
  const blocks: ScheduleBlock[] = [];

  let currentTime = 0;
  let activeTotal = 0;
  let breakTotal = 0;

  const numCycles = Math.floor(totalMins / cycleTotal);
  const remainder = totalMins % cycleTotal;

  function addWorkBlock(workDuration: number) {
    const phases: Array<Exclude<StudyPhase, 'Break'>> = [
      'Pretest',
      'Core Sprint',
      'Blurting',
      'Application',
      'Teach-Back'
    ];
    phases.forEach(phase => {
      const dur = Math.round(workDuration * weights[phase] * 10) / 10;
      if (dur > 0) {
        blocks.push({
          start: Math.round(currentTime * 10) / 10,
          end: Math.round((currentTime + dur) * 10) / 10,
          phase,
          duration: dur,
          type: 'Active Recall'
        });
        currentTime += dur;
        activeTotal += dur;
      }
    });
  }

  function addBreakBlock(breakDuration: number) {
    if (breakDuration > 0) {
      blocks.push({
        start: Math.round(currentTime * 10) / 10,
        end: Math.round((currentTime + breakDuration) * 10) / 10,
        phase: 'Break',
        duration: Math.round(breakDuration * 10) / 10,
        type: 'Break'
      });
      currentTime += breakDuration;
      breakTotal += breakDuration;
    }
  }

  for (let i = 0; i < numCycles; i++) {
    addWorkBlock(cycleWork);
    addBreakBlock(cycleBreak);
  }

  if (remainder > 0) {
    if (remainder <= cycleWork) {
      addWorkBlock(remainder);
    } else {
      addWorkBlock(cycleWork);
      addBreakBlock(remainder - cycleWork);
    }
  }

  return {
    blocks,
    activeTotal: Math.round(activeTotal),
    breakTotal: Math.round(breakTotal),
    totalMins
  };
}
