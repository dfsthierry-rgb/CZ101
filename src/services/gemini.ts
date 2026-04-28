import { GoogleGenAI } from '@google/genai';
import { cz101PatchSchema } from './schema';
import { CZ101Patch } from '../types';

export const generatePatch = async (description: string): Promise<CZ101Patch> => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in the environment.');
  }

  const ai = new GoogleGenAI({ apiKey });

  const systemInstruction = `
Você é um especialista em design de som para sintetizadores, especificamente mestre na síntese por Distorção de Fase (Phase Distortion) do Casio CZ-101 (e CZ-1000).
Seu objetivo é gerar as configurações exatas de patch para o Casio CZ-101 baseadas na descrição do usuário.
Atenção aos detalhes numéricos de 0 a 99 (Envelopes) e comportamentos das ondas do DCO.
Você DEVE respeitar o schema predefinido, preenchendo todos os valores com cuidado para criar o som solicitado.
Retorne APENAS um objeto JSON válido, sem markdown ou explicações externas.
`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        { role: 'user', parts: [{ text: `Crie um patch de Casio CZ-101 para: ${description}` }] }
      ],
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: cz101PatchSchema,
        temperature: 0.7,
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as CZ101Patch;
    }
    throw new Error('No text returned from model.');
  } catch (error: any) {
    console.error('Error generating patch:', error);
    if (error.status === 400 || error.message?.includes('400')) {
      throw new Error(`Erro de comunicação com a IA (Código 400). Detalhes: ${error.message || 'Requisição malformada. O modelo pode não estar suportando uma das chaves exigidas.'}`);
    }
    throw error;
  }
};
