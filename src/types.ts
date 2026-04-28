export interface Step {
  rate: number;
  level: number;
  susEnd: 'NONE' | 'SUS' | 'END';
}

export interface Envelope {
  steps: Step[];
}

export interface DCO {
  waveFirst: number;
  waveSecond: number;
  env: Envelope;
}

export interface DCW {
  keyFollow: number;
  env: Envelope;
}

export interface DCA {
  keyFollow: number;
  env: Envelope;
}

export interface LineData {
  dco: DCO;
  dcw: DCW;
  dca: DCA;
}

export interface CZ101Patch {
  toneName: string;
  comment: string;
  lineSelect: '1' | '2' | '1+1' | '1+2';
  modulation: {
    ring: boolean;
    noise: boolean;
  };
  detune: {
    sign: '+' | '-';
    octave: number;
    note: number;
    fine: number;
  };
  vibrato: {
    wave: number;
    delay: number;
    rate: number;
    depth: number;
  };
  octave: {
    sign: '+' | '-';
    range: number;
  };
  line1: LineData;
  line2: LineData;
}

export interface SavedPatch extends CZ101Patch {
  id: string;
  createdAt: number;
}
