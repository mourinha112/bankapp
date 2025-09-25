import { ASAAS_CONFIG, ACCOUNT_TYPES, PAYMENT_STATUS, TRANSFER_STATUS } from './asaasConfig';

// 📊 Interfaces para tipos de dados
export interface AsaasCustomer {
  id?: string;
  name: string;
  email: string;
  cpfCnpj: string;
  phone?: string;
}

export interface AsaasPayment {
  id?: string;
  customer: string;
  billingType: 'PIX' | 'CREDIT_CARD' | 'BOLETO';
  value: number;
  dueDate: string;
  description: string;
  externalReference?: string;
  discount?: {
    value: number;
    dueDateLimitDays: number;
  };
}

export interface AsaasTransfer {
  value: number;
  pixAddressKey: string;
  description: string;
  scheduleDate?: string;
}

export interface DepositResponse {
  success: boolean;
  paymentId?: string;
  pixQrCode?: string;
  pixCopyPaste?: string;
  invoiceUrl?: string;
  bankSlipUrl?: string;
  creditCardHtml?: string;
  expiryDate?: string;
  error?: string;
}

export interface WithdrawResponse {
  success: boolean;
  transferId?: string;
  status?: string;
  expectedTransferDate?: string;
  error?: string;
}

class AsaasService {
  private baseUrl = ASAAS_CONFIG.BASE_URL;
  private accessToken = ASAAS_CONFIG.ACCESS_TOKEN;

  // 🔧 Método privado para fazer requisições
  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    try {
      // DEBUG: mostrar ambiente e token (parcial)
      if (__DEV__) {
        console.log('[AsaasService] Base URL:', this.baseUrl);
        console.log('[AsaasService] Token prefix:', this.accessToken?.slice(0, 12));
      }

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          // Alguns ambientes aceitam apenas access_token, outros Authorization
          'access_token': this.accessToken,
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      let data: any = null;
      try {
        data = await response.json();
      } catch (e) {
        // resposta vazia
      }
      
      if (!response.ok) {
        const message = data?.errors?.[0]?.description || data?.message || `Erro HTTP ${response.status}`;
        if (__DEV__) {
          console.log('[AsaasService] Erro bruto:', message, 'status:', response.status, 'body:', data);
        }
        throw new Error(message);
      }

      return data;
    } catch (error) {
      console.error('Erro na requisição Asaas:', error);
      throw error;
    }
  }

  // 👤 GERENCIAMENTO DE CLIENTES
  async getOrCreateCustomer(userData: AsaasCustomer): Promise<string> {
    try {
      // Tentar buscar cliente existente por email
      const existingCustomers = await this.makeRequest(`/customers?email=${userData.email}`);
      
      if (existingCustomers.data && existingCustomers.data.length > 0) {
        return existingCustomers.data[0].id;
      }

      // Criar novo cliente
      const newCustomer = await this.makeRequest('/customers', {
        method: 'POST',
        body: JSON.stringify({
          name: userData.name,
          email: userData.email,
          cpfCnpj: userData.cpfCnpj.replace(/\D/g, ''),
          phone: userData.phone?.replace(/\D/g, ''),
          notificationDisabled: false,
        }),
      });

      return newCustomer.id;
    } catch (error) {
      console.error('Erro ao criar/buscar cliente:', error);
      throw new Error('Falha ao gerenciar cliente no Asaas');
    }
  }

  // 💰 DEPÓSITOS
  async createPixPayment(
    userData: AsaasCustomer,
    amount: number,
    description: string = 'Depósito'
  ): Promise<DepositResponse> {
    try {
      if (amount < ASAAS_CONFIG.PAYMENT_CONFIG.MIN_DEPOSIT) {
        throw new Error(`Valor mínimo para depósito: R$ ${ASAAS_CONFIG.PAYMENT_CONFIG.MIN_DEPOSIT}`);
      }

      const customerId = await this.getOrCreateCustomer(userData);
      
      const payment = await this.makeRequest('/payments', {
        method: 'POST',
        body: JSON.stringify({
          customer: customerId,
          billingType: 'PIX',
          value: amount,
          dueDate: new Date().toISOString().split('T')[0], // Hoje
          description,
          externalReference: `deposit_${Date.now()}`,
        }),
      });

      return {
        success: true,
        paymentId: payment.id,
        pixQrCode: payment.encodedImage, // QR Code em base64
        pixCopyPaste: payment.payload, // Código PIX copia e cola
        expiryDate: payment.dueDate,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao criar pagamento PIX',
      };
    }
  }

  async createCardPayment(
    userData: AsaasCustomer,
    amount: number,
    description: string = 'Depósito'
  ): Promise<DepositResponse> {
    try {
      if (amount < ASAAS_CONFIG.PAYMENT_CONFIG.MIN_DEPOSIT) {
        throw new Error(`Valor mínimo para depósito: R$ ${ASAAS_CONFIG.PAYMENT_CONFIG.MIN_DEPOSIT}`);
      }

      const customerId = await this.getOrCreateCustomer(userData);
      
      const payment = await this.makeRequest('/payments', {
        method: 'POST',
        body: JSON.stringify({
          customer: customerId,
          billingType: 'CREDIT_CARD',
          value: amount,
          dueDate: new Date().toISOString().split('T')[0],
          description,
          externalReference: `deposit_card_${Date.now()}`,
        }),
      });

      return {
        success: true,
        paymentId: payment.id,
        invoiceUrl: payment.invoiceUrl,
        creditCardHtml: payment.creditCardHtml,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao criar pagamento cartão',
      };
    }
  }

  // 🏦 SAQUES AUTOMÁTICOS
  async createPixTransfer(
    pixKey: string,
    amount: number,
    description: string = 'Saque'
  ): Promise<WithdrawResponse> {
    try {
      if (amount < ASAAS_CONFIG.PAYMENT_CONFIG.MIN_WITHDRAW) {
        throw new Error(`Valor mínimo para saque: R$ ${ASAAS_CONFIG.PAYMENT_CONFIG.MIN_WITHDRAW}`);
      }

      const transfer = await this.makeRequest('/transfers', {
        method: 'POST',
        body: JSON.stringify({
          value: amount,
          pixAddressKey: pixKey,
          description,
        }),
      });

      return {
        success: true,
        transferId: transfer.id,
        status: transfer.status,
        expectedTransferDate: transfer.scheduleDate || transfer.transferDate,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao criar transferência PIX',
      };
    }
  }

  // 📊 CONSULTAS
  async getPaymentStatus(paymentId: string) {
    try {
      const payment = await this.makeRequest(`/payments/${paymentId}`);
      return {
        id: payment.id,
        status: payment.status,
        value: payment.value,
        netValue: payment.netValue,
        paymentDate: payment.paymentDate,
        confirmedDate: payment.confirmedDate,
      };
    } catch (error) {
      console.error('Erro ao consultar pagamento:', error);
      return null;
    }
  }

  async getTransferStatus(transferId: string) {
    try {
      const transfer = await this.makeRequest(`/transfers/${transferId}`);
      return {
        id: transfer.id,
        status: transfer.status,
        value: transfer.value,
        transferDate: transfer.transferDate,
        scheduleDate: transfer.scheduleDate,
      };
    } catch (error) {
      console.error('Erro ao consultar transferência:', error);
      return null;
    }
  }

  // 💳 SALDO DA CONTA
  async getAccountBalance() {
    try {
      const finance = await this.makeRequest('/finance/balance');
      return {
        totalBalance: finance.totalBalance,
        availableBalance: finance.availableBalance,
        pendingBalance: finance.pendingBalance,
      };
    } catch (error) {
      console.error('Erro ao consultar saldo:', error);
      return null;
    }
  }

  // 🔄 WEBHOOK - Processar notificações
  async processWebhookEvent(eventData: any) {
    try {
      const { event, payment, transfer } = eventData;
      
      switch (event) {
        case 'PAYMENT_RECEIVED':
        case 'PAYMENT_CONFIRMED':
          // Pagamento confirmado - atualizar saldo do usuário
          return {
            type: 'deposit_confirmed',
            paymentId: payment.id,
            amount: payment.value,
            customerEmail: payment.customer.email,
          };
          
        case 'TRANSFER_CREATED':
        case 'TRANSFER_DONE':
          // Transferência realizada
          return {
            type: 'withdraw_completed',
            transferId: transfer.id,
            amount: transfer.value,
          };
          
        default:
          console.log('Evento não tratado:', event);
          return null;
      }
    } catch (error) {
      console.error('Erro ao processar webhook:', error);
      return null;
    }
  }

  // 📋 Buscar lista de pagamentos
  async getPayments(filters?: {
    customer?: string;
    status?: string;
    dateCreated?: string;
    limit?: number;
    offset?: number;
  }) {
    try {
      const params = new URLSearchParams();
      if (filters?.customer) params.append('customer', filters.customer);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.dateCreated) params.append('dateCreated[ge]', filters.dateCreated);
      if (filters?.limit) params.append('limit', filters.limit.toString());
      if (filters?.offset) params.append('offset', filters.offset.toString());

      const url = `/payments${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await this.makeRequest(url);
      return response;
    } catch (error) {
      console.error('Erro ao buscar pagamentos:', error);
      throw error;
    }
  }

  // 👥 Buscar lista de clientes
  async getCustomers(filters?: {
    email?: string;
    name?: string;
    limit?: number;
    offset?: number;
  }) {
    try {
      const params = new URLSearchParams();
      if (filters?.email) params.append('email', filters.email);
      if (filters?.name) params.append('name', filters.name);
      if (filters?.limit) params.append('limit', filters.limit.toString());
      if (filters?.offset) params.append('offset', filters.offset.toString());

      const url = `/customers${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await this.makeRequest(url);
      return response;
    } catch (error) {
      console.error('Erro ao buscar clientes:', error);
      throw error;
    }
  }
}

export default new AsaasService();