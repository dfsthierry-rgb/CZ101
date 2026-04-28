import { Schema, Type } from '@google/genai';

const stepSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    rate: { type: Type.INTEGER, description: '0-99' },
    level: { type: Type.INTEGER, description: '0-99' },
    susEnd: { type: Type.STRING, enum: ['NONE', 'SUS', 'END'], description: 'Set to NONE if empty' },
  },
  required: ['rate', 'level', 'susEnd'],
};

const envelopeSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    steps: {
      type: Type.ARRAY,
      items: stepSchema,
      description: 'Up to 8 steps for the envelope',
    },
  },
  required: ['steps'],
};

const lineDataSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    dco: {
      type: Type.OBJECT,
      properties: {
        waveFirst: { type: Type.INTEGER, description: 'Wave Form First (1-8)' },
        waveSecond: { type: Type.INTEGER, description: 'Wave Form Second (0-8, 0 means none)' },
        env: envelopeSchema,
      },
      required: ['waveFirst', 'waveSecond', 'env'],
    },
    dcw: {
      type: Type.OBJECT,
      properties: {
        keyFollow: { type: Type.INTEGER, description: 'Key Follow (0-9)' },
        env: envelopeSchema,
      },
      required: ['keyFollow', 'env'],
    },
    dca: {
      type: Type.OBJECT,
      properties: {
        keyFollow: { type: Type.INTEGER, description: 'Key Follow (0-9)' },
        env: envelopeSchema,
      },
      required: ['keyFollow', 'env'],
    },
  },
  required: ['dco', 'dcw', 'dca'],
};

export const cz101PatchSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    toneName: { type: Type.STRING, description: 'Name of the patch/tone, max 16 chars' },
    comment: { type: Type.STRING, description: 'Brief description or usage tips for the sound' },
    lineSelect: { type: Type.STRING, enum: ['1', '2', '1+1', '1+2'], description: 'Line selection configuration' },
    modulation: {
      type: Type.OBJECT,
      properties: {
        ring: { type: Type.BOOLEAN },
        noise: { type: Type.BOOLEAN },
      },
      required: ['ring', 'noise'],
    },
    detune: {
      type: Type.OBJECT,
      properties: {
        sign: { type: Type.STRING, enum: ['+', '-'] },
        octave: { type: Type.INTEGER, description: '0-3' },
        note: { type: Type.INTEGER, description: '0-11' },
        fine: { type: Type.INTEGER, description: '0-60' },
      },
      required: ['sign', 'octave', 'note', 'fine'],
    },
    vibrato: {
      type: Type.OBJECT,
      properties: {
        wave: { type: Type.INTEGER, description: 'Wave (1-4)' },
        delay: { type: Type.INTEGER, description: '0-99' },
        rate: { type: Type.INTEGER, description: '0-99' },
        depth: { type: Type.INTEGER, description: '0-99' },
      },
      required: ['wave', 'delay', 'rate', 'depth'],
    },
    octave: {
      type: Type.OBJECT,
      properties: {
        sign: { type: Type.STRING, enum: ['+', '-'] },
        range: { type: Type.INTEGER, description: '0-1' },
      },
      required: ['sign', 'range'],
    },
    line1: lineDataSchema,
    line2: lineDataSchema,
  },
  required: [
    'toneName',
    'comment',
    'lineSelect',
    'modulation',
    'detune',
    'vibrato',
    'octave',
    'line1',
    'line2',
  ],
};
