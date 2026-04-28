import { CZ101Patch, Step } from '../types';

let audioCtx: AudioContext | null = null;

const initAudio = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
};

// Conversão grosseira de rate do CZ (0-99) para tempo em segundos
const rateToSeconds = (rate: number) => {
  const r = typeof rate === 'number' ? rate : 50;
  return Math.max(0.005, 10 * Math.pow((100 - r) / 100, 3));
};

// Mapeamento muito básico das ondas do CZ para o Web Audio API
const mapWaveform = (wave: number): OscillatorType => {
  switch (wave) {
    case 1: return 'sawtooth';
    case 2: return 'square';
    case 3: return 'square'; 
    case 4: return 'sine';
    case 5: return 'sawtooth';
    case 6: return 'triangle'; 
    case 7: return 'sine';
    case 8: return 'square';
    default: return 'sawtooth';
  }
};

const midiToFreq = (midi: number) => 440 * Math.pow(2, (midi - 69) / 12);

export const playPatchPreview = (patch: CZ101Patch) => {
  const ctx = initAudio();
  const masterGain = ctx.createGain();
  masterGain.gain.value = 0.12; 
  masterGain.connect(ctx.destination);

  const name = (patch.toneName + ' ' + patch.comment).toLowerCase();
  const isBass = name.includes('bass') || name.includes('baixo');
  const isPad = name.includes('pad') || name.includes('string') || name.includes('choir') || name.includes('brass');
  const isPerc = name.includes('drum') || name.includes('perc') || name.includes('timpani') || name.includes('tom');

  let phrase: { midi: number, start: number, dur: number }[] = [];

  if (isBass) {
    phrase = [
      { midi: 36, start: 0.0, dur: 0.2 },
      { midi: 36, start: 0.25, dur: 0.1 },
      { midi: 48, start: 0.5, dur: 0.2 },
      { midi: 36, start: 0.75, dur: 0.1 },
      { midi: 46, start: 1.0, dur: 0.3 },
      { midi: 43, start: 1.5, dur: 0.5 },
    ];
  } else if (isPad) {
    phrase = [
      { midi: 60, start: 0.0, dur: 4.0 }, 
      { midi: 64, start: 0.1, dur: 3.9 }, 
      { midi: 67, start: 0.2, dur: 3.8 }, 
      { midi: 71, start: 0.3, dur: 3.7 }, 
    ];
  } else if (isPerc) {
    phrase = [
      { midi: 48, start: 0.0, dur: 0.2 },
      { midi: 48, start: 0.5, dur: 0.2 },
      { midi: 43, start: 1.0, dur: 0.4 },
      { midi: 36, start: 1.5, dur: 0.8 },
    ];
  } else {
    phrase = [ 
      { midi: 60, start: 0.0, dur: 0.2 }, 
      { midi: 62, start: 0.3, dur: 0.2 }, 
      { midi: 64, start: 0.6, dur: 0.2 }, 
      { midi: 67, start: 0.9, dur: 0.2 }, 
      { midi: 69, start: 1.2, dur: 0.2 }, 
      { midi: 72, start: 1.5, dur: 0.8 }, 
    ];
  }

  const now = ctx.currentTime;

  const playLine = (line: any, detuneCents: number, freq: number, startTime: number, duration: number) => {
    const osc = ctx.createOscillator();
    osc.type = mapWaveform(line.dco.waveFirst);
    osc.frequency.value = freq;
    osc.detune.value = detuneCents;

    // Vibrato
    const vibratoOsc = ctx.createOscillator();
    vibratoOsc.type = 'triangle';
    vibratoOsc.frequency.value = patch.vibrato.rate === 0 ? 0.1 : (patch.vibrato.rate / 10);
    const vibratoGain = ctx.createGain();
    vibratoGain.gain.value = (patch.vibrato.depth / 99) * 50; 
    vibratoOsc.connect(vibratoGain);
    vibratoGain.connect(osc.detune);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 100;
    osc.connect(filter);

    const dcaGain = ctx.createGain();
    dcaGain.gain.value = 0;
    filter.connect(dcaGain);
    dcaGain.connect(masterGain);

    let timeAccDCW = startTime;
    let timeAccDCA = startTime;

    const dcwSteps = line.dcw.env.steps as Step[];
    filter.frequency.setValueAtTime(100, startTime);
    let susLevelDCW = 100;
    
    for (let i = 0; i < dcwSteps.length; i++) {
        const step = dcwSteps[i];
        const rate = typeof step.rate === 'number' ? step.rate : 99;
        const level = typeof step.level === 'number' ? step.level : 0;
        
        const timeSpan = rateToSeconds(rate);
        timeAccDCW += timeSpan;
        
        const targetFreq = 100 + (level / 99) * 12000;
        filter.frequency.linearRampToValueAtTime(targetFreq, timeAccDCW);

        if (step.susEnd === 'SUS' || step.susEnd === 'END') {
            susLevelDCW = targetFreq;
            break;
        }
    }

    const dcaSteps = line.dca.env.steps as Step[];
    dcaGain.gain.setValueAtTime(0, startTime);
    let susLevelDCA = 0;

    for (let i = 0; i < dcaSteps.length; i++) {
        const step = dcaSteps[i];
        const rate = typeof step.rate === 'number' ? step.rate : 99;
        const level = typeof step.level === 'number' ? step.level : 0;
        
        const timeSpan = rateToSeconds(rate);
        timeAccDCA += timeSpan;
        const targetVol = level / 99;
        
        dcaGain.gain.linearRampToValueAtTime(targetVol, timeAccDCA);

        if (step.susEnd === 'SUS' || step.susEnd === 'END') {
            susLevelDCA = targetVol;
            break;
        }
    }

    const noteOffTime = startTime + duration;
    
    let dcwTargetAfterSus = 100;
    let dcaTargetAfterSus = 0;
    let releaseTime = 0.5; 

    // Procura por steps após o SUS
    const susIndex = dcaSteps.findIndex(s => s.susEnd === 'SUS');
    if (susIndex !== -1 && susIndex + 1 < dcaSteps.length) {
       const releaseStep = dcaSteps[susIndex + 1];
       releaseTime = rateToSeconds(typeof releaseStep.rate === 'number' ? releaseStep.rate : 50);
       dcaTargetAfterSus = (typeof releaseStep.level === 'number' ? releaseStep.level : 0) / 99;
    }

    filter.frequency.cancelScheduledValues(noteOffTime);
    filter.frequency.setValueAtTime(susLevelDCW, noteOffTime);
    filter.frequency.linearRampToValueAtTime(dcwTargetAfterSus, noteOffTime + releaseTime);

    dcaGain.gain.cancelScheduledValues(noteOffTime);
    dcaGain.gain.setValueAtTime(susLevelDCA, noteOffTime);
    dcaGain.gain.linearRampToValueAtTime(dcaTargetAfterSus, noteOffTime + releaseTime);

    const endTime = noteOffTime + releaseTime + 0.1;

    osc.start(startTime);
    vibratoOsc.start(startTime + (patch.vibrato.delay / 99) * 2);
    osc.stop(endTime);
    vibratoOsc.stop(endTime);
  };

  const detuneSign = patch.detune.sign === '-' ? -1 : 1;
  const detuneAmount = (patch.detune.octave * 1200) + (patch.detune.note * 100) + (patch.detune.fine * 1.5);
  const totalDetune = detuneSign * detuneAmount;

  let octaveMult = 1;
  if (patch.octave.range === 1) {
    octaveMult = patch.octave.sign === '+' ? 2 : 0.5;
  }

  phrase.forEach((note) => {
      const baseFreq = midiToFreq(note.midi) * octaveMult;
      const startTime = now + note.start;
      const duration = note.dur;

      if (patch.lineSelect === '1' || patch.lineSelect === '1+1' || patch.lineSelect === '1+2') {
        playLine(patch.line1, 0, baseFreq, startTime, duration);
      }

      if (patch.lineSelect === '2' || patch.lineSelect === '1+2' || patch.lineSelect === '1+1') {
        let l2Detune = patch.lineSelect === '2' ? 0 : totalDetune;
        playLine(patch.lineSelect === '1+1' ? patch.line1 : patch.line2, l2Detune, baseFreq, startTime, duration);
      }
  });

};
