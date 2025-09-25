import { MERCADO_PAGO_CONFIG, PAYMENT_METHODS } from './paymentConfig';

export interface PaymentData {
  amount: number;
  description: string;
  payer_email: string;
  payer_name: string;
  payer_document?: string;
}

export interface DepositResponse {
  success: boolean;
  payment_id?: string;
  payment_url?: string;
  qr_code?: string;
  qr_code_base64?: string;
  error?: string;
}

export interface WithdrawData {
  amount: number;
  bank_code: string;
  account_number: string;
  account_digit: string;
  agency: string;
  agency_digit?: string;
  account_holder_name: string;
  account_holder_document: string;
  account_type: 'checking' | 'savings';
}

export interface WithdrawResponse {
  success: boolean;
  transfer_id?: string;
  status?: string;
  error?: string;
}

class PaymentService {
  private baseUrl = 'https://api.mercadopago.com';
  
  // Criar pagamento PIX para depósito
  async createPixPayment(data: PaymentData): Promise<DepositResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/v1/payments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${MERCADO_PAGO_CONFIG.ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transaction_amount: data.amount,
          description: data.description,
          payment_method_id: PAYMENT_METHODS.PIX,
          payer: {
            email: data.payer_email,
            first_name: data.payer_name,
            identification: {
              type: 'CPF',
              number: data.payer_document || '11111111111',
            },
          },
          notification_url: MERCADO_PAGO_CONFIG.WEBHOOK_URL,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        return {
          success: true,
          payment_id: result.id,
          qr_code: result.point_of_interaction?.transaction_data?.qr_code,
          qr_code_base64: result.point_of_interaction?.transaction_data?.qr_code_base64,
        };
      } else {
        return {
          success: false,
          error: result.message || 'Erro ao criar pagamento PIX',
        };
      }
    } catch (error) {
      return {
        success: false,
        error: 'Erro de conexão com o Mercado Pago',
      };
    }
  }

  // Criar link de pagamento para cartão
  async createCardPayment(data: PaymentData): Promise<DepositResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/checkout/preferences`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${MERCADO_PAGO_CONFIG.ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: [
            {
              title: data.description,
              quantity: 1,
              unit_price: data.amount,
            },
          ],
          payer: {
            email: data.payer_email,
            name: data.payer_name,
          },
          back_urls: {
            success: MERCADO_PAGO_CONFIG.SUCCESS_URL,
            failure: MERCADO_PAGO_CONFIG.FAILURE_URL,
            pending: MERCADO_PAGO_CONFIG.PENDING_URL,
          },
          auto_return: 'approved',
          notification_url: MERCADO_PAGO_CONFIG.WEBHOOK_URL,
          payment_methods: {
            excluded_payment_methods: [],
            excluded_payment_types: [],
            installments: 12,
          },
        }),
      });

      const result = await response.json();

      if (response.ok) {
        return {
          success: true,
          payment_id: result.id,
          payment_url: result.init_point,
        };
      } else {
        return {
          success: false,
          error: result.message || 'Erro ao criar link de pagamento',
        };
      }
    } catch (error) {
      return {
        success: false,
        error: 'Erro de conexão com o Mercado Pago',
      };
    }
  }

  // Verificar status do pagamento
  async checkPaymentStatus(paymentId: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/v1/payments/${paymentId}`, {
        headers: {
          'Authorization': `Bearer ${MERCADO_PAGO_CONFIG.ACCESS_TOKEN}`,
        },
      });

      return await response.json();
    } catch (error) {
      throw new Error('Erro ao verificar status do pagamento');
    }
  }

  // Simular transferência bancária (saque)
  // NOTA: O Mercado Pago não tem API pública para transferências bancárias
  // Em produção, você usaria um serviço como PagSeguro, Stone, ou integraria diretamente com bancos
  async createBankTransfer(data: WithdrawData): Promise<WithdrawResponse> {
    try {
      // Simulação de validação e processamento
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Validações básicas
      if (data.amount < 10) {
        return {
          success: false,
          error: 'Valor mínimo para saque é R$ 10,00',
        };
      }

      if (data.amount > 5000) {
        return {
          success: false,
          error: 'Valor máximo para saque é R$ 5.000,00',
        };
      }

      // Validar dados bancários (simulado)
      const validBanks = ['001', '033', '104', '237', '341', '356', '422'];
      if (!validBanks.includes(data.bank_code)) {
        return {
          success: false,
          error: 'Código do banco inválido',
        };
      }

      // Simular sucesso
      const transferId = `TF${Date.now()}`;
      
      return {
        success: true,
        transfer_id: transferId,
        status: 'processing',
      };
    } catch (error) {
      return {
        success: false,
        error: 'Erro interno no processamento do saque',
      };
    }
  }

  // Listar bancos disponíveis
  getBankList() {
    return [
      { code: '001', name: 'Banco do Brasil' },
      { code: '033', name: 'Santander' },
      { code: '104', name: 'Caixa Econômica Federal' },
      { code: '237', name: 'Bradesco' },
      { code: '341', name: 'Itaú' },
      { code: '356', name: 'Banco Real' },
      { code: '422', name: 'Banco Safra' },
      { code: '748', name: 'Sicredi' },
      { code: '756', name: 'Sicoob' },
    ];
  }
}

export default new PaymentService();