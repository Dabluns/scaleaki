import { Request, Response } from 'express';
import logger from '../config/logger';
import { llmComplete, llmAvailable, extractJson } from '../services/llm.service';

/**
 * Pré-aprovador de Criativo (Scaleaki+). Recebe copy/headline/descrição de um
 * criativo e devolve um parecer estruturado de pré-aprovação para políticas de
 * anúncio (Meta/Google), apontando riscos e sugerindo ajustes.
 *
 * Não substitui a revisão oficial da plataforma — é um pré-check heurístico via LLM.
 */

interface PreaproveResult {
  veredito: 'aprovado' | 'risco' | 'reprovado';
  score: number; // 0-100 (chance de aprovação)
  motivos: string[];
  ajustes: string[];
  termosProblema: string[];
}

const SYSTEM_RULES = `Você é um revisor de políticas de anúncios (Meta Ads e Google Ads) do mercado brasileiro.
Avalie o criativo abaixo e retorne SOMENTE um JSON válido, sem texto fora dele, no formato:
{
  "veredito": "aprovado" | "risco" | "reprovado",
  "score": <inteiro 0-100, chance de aprovação>,
  "motivos": [<string>],
  "ajustes": [<string com sugestão concreta de reescrita>],
  "termosProblema": [<trechos exatos do criativo que violam política>]
}
Critérios: promessas de renda/ganho garantido, antes-e-depois de saúde, alegações médicas, conteúdo sensacionalista,
afirmações absolutas ("100%", "garantido"), uso de "você" para presumir características pessoais sensíveis,
linguagem que viole atributos pessoais. Seja rigoroso mas objetivo.`;

/** POST /criativo/pre-aprovar — { headline?, copy, descricao?, plataforma? } */
export async function preAprovarCriativo(req: Request, res: Response) {
  try {
    if (!llmAvailable()) {
      return res.status(503).json({ error: 'llm_unavailable', message: 'Serviço de IA indisponível no momento.' });
    }

    const { headline = '', copy = '', descricao = '', plataforma = 'meta' } = req.body as Record<string, string>;
    if (!copy.trim() && !headline.trim()) {
      return res.status(400).json({ error: 'missing_content', message: 'Envie ao menos headline ou copy.' });
    }

    const prompt = `${SYSTEM_RULES}

Plataforma: ${plataforma}
Headline: ${headline || '(vazio)'}
Copy: ${copy || '(vazio)'}
Descrição: ${descricao || '(vazio)'}

Retorne o JSON:`;

    const raw = await llmComplete(prompt, 900);
    const parsed = extractJson<PreaproveResult>(raw);

    if (!parsed) {
      logger.warn('[PreAprovador] LLM não retornou JSON válido:', raw.slice(0, 200));
      return res.status(502).json({ error: 'parse_failed', message: 'Não foi possível interpretar o parecer da IA.' });
    }

    // Normaliza score
    const score = Math.max(0, Math.min(100, Number(parsed.score) || 0));

    res.json({
      data: {
        veredito: parsed.veredito || (score >= 70 ? 'aprovado' : score >= 40 ? 'risco' : 'reprovado'),
        score,
        motivos: Array.isArray(parsed.motivos) ? parsed.motivos : [],
        ajustes: Array.isArray(parsed.ajustes) ? parsed.ajustes : [],
        termosProblema: Array.isArray(parsed.termosProblema) ? parsed.termosProblema : [],
      },
    });
  } catch (err: any) {
    logger.error('[PreAprovador] Erro:', err);
    res.status(500).json({ error: 'Erro ao pré-aprovar criativo' });
  }
}
