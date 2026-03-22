import logger from '../config/logger';
import crypto from 'crypto';

interface CreateCheckoutParams {
  amount: number; // Valor em reais (ex: 63.00)
  customerEmail: string;
  customerName: string;
  productName: string;
  productType: 'unique' | 'subscription';
  paymentMethod?: string;
  recurrencePeriod?: number; // Para assinaturas: 1 (mensal), 3 (trimestral), 12 (anual)
  returnUrl?: string; // URL de retorno após pagamento
  webhookUrl?: string; // URL do webhook (opcional, usa o padrão se não fornecido)
}

interface CaktoCheckoutResponse {
  checkoutUrl: string;
  checkoutId: string;
}

/**
 * Serviço da Cakto
 * Gerencia criação de checkouts e validação de webhooks
 * 
 * NOTA: A Cakto funciona apenas com webhook, sem necessidade de credenciais de API.
 * O checkout usa links diretos pré-configurados para cada plano.
 */
class CaktoService {
  // Links diretos dos checkouts da Cakto por plano
  private readonly checkoutLinks: Record<string, string> = {
    mensal: 'https://pay.cakto.com.br/ut3ydqz_386793',      // Plano Mensal (R$ 97,00)
    trimestral: 'https://pay.cakto.com.br/tnywokf',        // Plano Trimestral (R$ 271,00)
    anual: 'https://pay.cakto.com.br/wd65xuw',              // Plano Anual (R$ 974,00)
  };

  constructor() {
    // Os links já estão configurados acima
  }

  /**
   * Cria um checkout na Cakto e retorna a URL de pagamento
   * 
   * A Cakto funciona com links diretos pré-configurados para cada plano.
   * O webhook será chamado automaticamente quando o pagamento for processado.
   */
  async createCheckout(params: CreateCheckoutParams): Promise<CaktoCheckoutResponse> {
    try {
      // Gerar um ID único para o checkout (usado para rastreamento)
      const checkoutId = this.generateCheckoutId();

      // Determinar qual link usar baseado no período de recorrência ou valor
      let planKey: string = 'mensal'; // padrão
      
      if (params.recurrencePeriod) {
        if (params.recurrencePeriod === 12) {
          planKey = 'anual';
        } else if (params.recurrencePeriod === 3) {
          planKey = 'trimestral';
        } else {
          planKey = 'mensal';
        }
      } else {
        // Fallback: determinar pelo valor
        if (params.amount >= 974.00) {
          planKey = 'anual';
        } else if (params.amount >= 271.00) {
          planKey = 'trimestral';
        } else {
          planKey = 'mensal';
        }
      }

      // Obter o link direto do plano
      const baseCheckoutUrl = this.checkoutLinks[planKey];
      
      if (!baseCheckoutUrl) {
        throw new Error(`Link de checkout não encontrado para o plano: ${planKey}`);
      }

      // Construir URL do checkout com parâmetros na query string
      const urlParams = new URLSearchParams();
      
      // Método de pagamento (OPCIONAL - será selecionado na página da Cakto)
      // Segundo a documentação da Cakto, o parâmetro correto é 'paymentMethod' (camelCase)
      // A Cakto aceita: pix, boleto, credit_card, debit_card
      // Se fornecido, será adicionado como primeiro parâmetro na URL
      if (params.paymentMethod) {
        // Mapear os métodos para o formato que a Cakto espera
        const caktoPaymentMethodMap: Record<string, string> = {
          'credit_card': 'credit_card',
          'debit_card': 'debit_card',
          'pix': 'pix',
          'boleto': 'boleto',
        };
        
        const caktoPaymentMethod = caktoPaymentMethodMap[params.paymentMethod] || params.paymentMethod;
        // Adicionar paymentMethod como PRIMEIRO parâmetro
        urlParams.append('paymentMethod', caktoPaymentMethod);
      }
      
      // Parâmetros opcionais que podem ser passados
      if (params.customerEmail) {
        urlParams.append('email', params.customerEmail);
      }
      if (params.customerName) {
        urlParams.append('name', params.customerName);
      }
      if (params.returnUrl) {
        urlParams.append('return_url', params.returnUrl);
      }
      
      // URL do webhook (deve ser a URL do backend onde a API está rodando)
      const backendUrl = process.env.BACKEND_URL || process.env.API_URL || `http://localhost:${process.env.PORT || 4000}`;
      const webhookUrl = params.webhookUrl || `${backendUrl}/payments/webhook/cakto`;
      urlParams.append('webhook_url', webhookUrl);
      
      // ID do checkout para rastreamento
      urlParams.append('checkout_id', checkoutId);

      // Construir URL final (adicionar parâmetros se houver)
      const checkoutUrl = urlParams.toString() 
        ? `${baseCheckoutUrl}?${urlParams.toString()}`
        : baseCheckoutUrl;

      logger.info('Cakto checkout URL generated', {
        checkoutId,
        planKey,
        customerEmail: params.customerEmail,
        amount: params.amount,
        productType: params.productType,
        recurrencePeriod: params.recurrencePeriod,
        paymentMethod: params.paymentMethod,
        checkoutUrl: checkoutUrl, // URL completa para debug
        urlParams: urlParams.toString(),
      });
      
      // Log adicional para verificar se o paymentMethod está na URL
      if (params.paymentMethod) {
        logger.info('Payment method in URL', {
          paymentMethod: params.paymentMethod,
          urlContainsPaymentMethod: checkoutUrl.includes('paymentMethod'),
          fullUrl: checkoutUrl,
        });
      }

      return {
        checkoutUrl,
        checkoutId,
      };
    } catch (error: any) {
      logger.error('Error creating Cakto checkout', {
        error: error.message,
        params: {
          customerEmail: params.customerEmail,
          amount: params.amount,
        },
      });
      throw error;
    }
  }

  /**
   * Gera um ID único para o checkout
   */
  private generateCheckoutId(): string {
    // Gerar um ID alfanumérico único
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 12; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Valida assinatura de webhook da Cakto
   * 
   * A validação deve ser feita usando HMAC SHA-256 conforme documentação da Cakto
   * Por padrão, a Cakto usa o formato: HMAC-SHA256(payload, webhook_secret)
   */
  validateWebhookSignature(
    payload: string,
    signature: string,
    secret: string
  ): boolean {
    try {
      const webhookSecret = process.env.CAKTO_WEBHOOK_SECRET || secret;
      
      if (!webhookSecret) {
        logger.warn('Cakto webhook secret not configured');
        return false;
      }

      // Calcular HMAC SHA-256 do payload
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(payload)
        .digest('hex');

      // Comparar assinaturas de forma segura (timing-safe)
      const isValid = crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      );

      if (!isValid) {
        logger.warn('Invalid webhook signature', {
          received: signature.substring(0, 10) + '...',
          expected: expectedSignature.substring(0, 10) + '...',
        });
      }

      return isValid;
    } catch (error: any) {
      logger.error('Error validating webhook signature', {
        error: error.message,
      });
      return false;
    }
  }
}

// Exportar instância singleton
export const caktoService = new CaktoService();
export default caktoService;

