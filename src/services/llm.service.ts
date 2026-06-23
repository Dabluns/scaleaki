import { GoogleGenerativeAI } from '@google/generative-ai';
import logger from '../config/logger';

/**
 * LLM unificado reutilizável: Groq (free, rápido) com fallback Gemini.
 * Espelha a lógica de botService.llmComplete, mas exposto p/ outros controllers
 * (ex: pré-aprovador de criativo). maxTokens parametrizável.
 */

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GROQ_API_KEY = process.env.GROQ_API_KEY || '';
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

let genAI: GoogleGenerativeAI | null = null;
if (GEMINI_API_KEY) genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

export function llmAvailable(): boolean {
  return Boolean(GROQ_API_KEY || GEMINI_API_KEY);
}

export async function llmComplete(prompt: string, maxTokens = 800): Promise<string> {
  if (GROQ_API_KEY) {
    try {
      const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${GROQ_API_KEY}` },
        body: JSON.stringify({
          model: GROQ_MODEL,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.2,
          max_tokens: maxTokens,
        }),
      });
      if (r.ok) {
        const j: any = await r.json();
        const out = j?.choices?.[0]?.message?.content;
        if (out) return out;
      } else {
        logger.warn(`[LLM] Groq respondeu ${r.status}, tentando Gemini`);
      }
    } catch (e) {
      logger.warn('[LLM] Groq falhou, tentando Gemini', e);
    }
  }
  if (genAI) {
    const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });
    const result = await model.generateContent(prompt);
    return (await result.response).text();
  }
  throw new Error('Nenhum LLM disponível (Groq+Gemini falharam)');
}

/** Extrai o primeiro objeto JSON de um texto livre do LLM. */
export function extractJson<T = any>(text: string): T | null {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]) as T;
  } catch {
    return null;
  }
}
