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

// ─── Reescritor policy-safe (botão "Corrigir agora") ──────────────────────────

interface RewriteResult {
  headline: string;
  copy: string;
  descricao: string;
  mudancas: string[]; // o que foi trocado e por quê
  anguloSchwartz: string; // diagnóstico de lead aplicado
}

/**
 * Regras de reescrita: metodologia Eugene Schwartz (Breakthrough Advertising)
 * para força de copy + conversão de gatilhos reprováveis em equivalentes
 * que PASSAM na política, sem perder pegada de resposta direta.
 *
 * IMPORTANTE: isto NÃO burla moderação. Reescreve o conteúdo para ficar
 * legítimo dentro das políticas (promessa absoluta → prova social/specificidade,
 * alegação médica → depoimento/contexto, renda garantida → potencial com prova).
 */
const REWRITE_RULES = `Você é copywriter de resposta direta nível Eugene Schwartz (Breakthrough Advertising) E revisor de políticas de Meta/Google Ads do mercado brasileiro.

Sua tarefa: reescrever o criativo abaixo para que fique FORTE (alta conversão, pegada de copy black-hat-VENDEDORA mas honesta) E AO MESMO TEMPO dentro das políticas de anúncio. Você NÃO ofusca texto, NÃO usa caracteres especiais para enganar robô, NÃO burla review. Você reescreve o CONTEÚDO para ser legítimo e persuasivo.

Antes de escrever, diagnostique internamente (Schwartz):
- Nível de consciência do prospect (1 Most Aware … 5 Unaware)
- Estágio de sofisticação do mercado (1 virgem … 5 exausto)
- Tipo de lead ideal (oferta direta / promessa / mecanismo / problema / proclamação ousada / história)

Depois converta os gatilhos reprováveis em equivalentes que passam:
- "renda garantida / ganhe X garantido" → potencial com prova social específica ("alunos que aplicaram fizeram X")
- alegação médica / cura / antes-e-depois de saúde → depoimento pessoal + "resultados variam"
- "100% / garantido / nunca mais" (absolutos) → especificidade com número real e contexto
- "você está gordo/endividado/etc" (presunção pessoal sensível) → linguagem inclusiva, fala do desejo não do defeito
- sensacionalismo proibido → curiosidade legítima via mecanismo único

Mantenha a força: especificidade, future pacing, mecanismo, prova, ritmo. Soa como gente, não robô.

Retorne SOMENTE um JSON válido, sem texto fora dele:
{
  "headline": "<headline reescrita, forte e policy-safe>",
  "copy": "<copy reescrita completa>",
  "descricao": "<descrição reescrita ou vazio>",
  "mudancas": [<string: cada troca feita e o motivo, ex: "'renda garantida' → 'alunos faturaram em média X' (remove promessa absoluta)">],
  "anguloSchwartz": "<1 frase: nível de consciência + tipo de lead aplicado>"
}`;

/** POST /criativo/reescrever — { headline?, copy, descricao?, plataforma?, termosProblema? } */
export async function reescreverCriativo(req: Request, res: Response) {
  try {
    if (!llmAvailable()) {
      return res.status(503).json({ error: 'llm_unavailable', message: 'Serviço de IA indisponível no momento.' });
    }

    const { headline = '', copy = '', descricao = '', plataforma = 'meta', termosProblema = [] } =
      req.body as Record<string, any>;

    if (!copy.trim() && !headline.trim()) {
      return res.status(400).json({ error: 'missing_content', message: 'Envie ao menos headline ou copy.' });
    }

    const termos = Array.isArray(termosProblema) && termosProblema.length
      ? `\nTermos sinalizados como problemáticos (priorize corrigir estes): ${termosProblema.join(', ')}`
      : '';

    const prompt = `${REWRITE_RULES}

Plataforma: ${plataforma}
Headline atual: ${headline || '(vazio)'}
Copy atual: ${copy || '(vazio)'}
Descrição atual: ${descricao || '(vazio)'}${termos}

Retorne o JSON:`;

    const raw = await llmComplete(prompt, 1400);
    const parsed = extractJson<RewriteResult>(raw);

    if (!parsed) {
      logger.warn('[PreAprovador/Rewrite] LLM não retornou JSON válido:', raw.slice(0, 200));
      return res.status(502).json({ error: 'parse_failed', message: 'Não foi possível interpretar a reescrita da IA.' });
    }

    res.json({
      data: {
        headline: typeof parsed.headline === 'string' ? parsed.headline : '',
        copy: typeof parsed.copy === 'string' ? parsed.copy : '',
        descricao: typeof parsed.descricao === 'string' ? parsed.descricao : '',
        mudancas: Array.isArray(parsed.mudancas) ? parsed.mudancas : [],
        anguloSchwartz: typeof parsed.anguloSchwartz === 'string' ? parsed.anguloSchwartz : '',
      },
    });
  } catch (err: any) {
    logger.error('[PreAprovador/Rewrite] Erro:', err);
    res.status(500).json({ error: 'Erro ao reescrever criativo' });
  }
}
