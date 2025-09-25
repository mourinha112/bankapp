// Sistema de webhook para receber notificações do Asaas
// Este arquivo seria usado em um servidor backend real

import AsaasService from './AsaasService';

// 🔄 Interface para eventos do webhook
export interface AsaasWebhookEvent {
  event: string;
  dateCreated: string;
  payment?: {
    id: string;
    dateCreated: string;
    customer: string;
    paymentMethod: string;
    value: number;
    netValue: number;
    status: string;
    billingType: string;
    confirmedDate?: string;
    paymentDate?: string;
    clientPaymentDate?: string;
    installmentNumber?: number;
    invoiceUrl?: string;
    bankSlipUrl?: string;
    transactionReceiptUrl?: string;
    externalReference?: string;
  };
  transfer?: {
    id: string;
    dateCreated: string;
    value: number;
    status: string;
    transferDate?: string;
    scheduleDate?: string;
    pixAddressKey?: string;
    description?: string;
  };
}

// 🎯 Tipos de eventos que vamos processar
export const WEBHOOK_EVENTS = {
  // Pagamentos (Depósitos)
  PAYMENT_CREATED: 'PAYMENT_CREATED',
  PAYMENT_AWAITING_PAYMENT: 'PAYMENT_AWAITING_PAYMENT',
  PAYMENT_RECEIVED: 'PAYMENT_RECEIVED',
  PAYMENT_CONFIRMED: 'PAYMENT_CONFIRMED',
  PAYMENT_OVERDUE: 'PAYMENT_OVERDUE',
  PAYMENT_DELETED: 'PAYMENT_DELETED',
  PAYMENT_RESTORED: 'PAYMENT_RESTORED',
  PAYMENT_REFUNDED: 'PAYMENT_REFUNDED',
  PAYMENT_REFUND_IN_PROGRESS: 'PAYMENT_REFUND_IN_PROGRESS',
  PAYMENT_RECEIVED_IN_CASH_UNDONE: 'PAYMENT_RECEIVED_IN_CASH_UNDONE',
  PAYMENT_CHARGEBACK_REQUESTED: 'PAYMENT_CHARGEBACK_REQUESTED',
  PAYMENT_CHARGEBACK_DISPUTE: 'PAYMENT_CHARGEBACK_DISPUTE',
  PAYMENT_AWAITING_CHARGEBACK_REVERSAL: 'PAYMENT_AWAITING_CHARGEBACK_REVERSAL',
  PAYMENT_DUNNING_RECEIVED: 'PAYMENT_DUNNING_RECEIVED',
  PAYMENT_DUNNING_REQUESTED: 'PAYMENT_DUNNING_REQUESTED',
  PAYMENT_BANK_SLIP_VIEWED: 'PAYMENT_BANK_SLIP_VIEWED',
  PAYMENT_CHECKOUT_VIEWED: 'PAYMENT_CHECKOUT_VIEWED',
  
  // Transferências (Saques)
  TRANSFER_CREATED: 'TRANSFER_CREATED',
  TRANSFER_PENDING: 'TRANSFER_PENDING',
  TRANSFER_IN_BANK_PROCESSING: 'TRANSFER_IN_BANK_PROCESSING',
  TRANSFER_DONE: 'TRANSFER_DONE',
  TRANSFER_FAILED: 'TRANSFER_FAILED',
  TRANSFER_CANCELLED: 'TRANSFER_CANCELLED',
} as const;

class AsaasWebhookService {
  
  // 🔐 Validar assinatura do webhook (segurança)
  validateWebhookSignature(payload: string, signature: string): boolean {
    // Em produção, você deve validar a assinatura para garantir que
    // a requisição realmente veio do Asaas
    // const expectedSignature = crypto
    //   .createHmac('sha256', WEBHOOK_SECRET)
    //   .update(payload)
    //   .digest('hex');
    // return signature === expectedSignature;
    
    // Por enquanto, aceita qualquer requisição (APENAS PARA DESENVOLVIMENTO)
    return true;
  }

  // 📨 Processar evento do webhook
  async processWebhookEvent(eventData: AsaasWebhookEvent): Promise<{
    success: boolean;
    action?: string;
    userId?: string;
    amount?: number;
    error?: string;
  }> {
    try {
      console.log('🔔 Webhook recebido:', eventData.event, eventData);

      switch (eventData.event) {
        case WEBHOOK_EVENTS.PAYMENT_RECEIVED:
        case WEBHOOK_EVENTS.PAYMENT_CONFIRMED:
          return await this.handlePaymentConfirmed(eventData);
          
        case WEBHOOK_EVENTS.TRANSFER_DONE:
          return await this.handleTransferCompleted(eventData);
          
        case WEBHOOK_EVENTS.TRANSFER_FAILED:
        case WEBHOOK_EVENTS.TRANSFER_CANCELLED:
          return await this.handleTransferFailed(eventData);
          
        default:
          console.log('ℹ️ Evento não processado:', eventData.event);
          return { success: true, action: 'ignored' };
      }
    } catch (error) {
      console.error('❌ Erro ao processar webhook:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  // 💰 Processar pagamento confirmado (depósito)
  private async handlePaymentConfirmed(eventData: AsaasWebhookEvent) {
    const { payment } = eventData;
    if (!payment) throw new Error('Dados do pagamento não encontrados');

    // 🔍 Buscar usuário pelo externalReference ou customer
    const userEmail = await this.getUserEmailFromPayment(payment);
    if (!userEmail) {
      throw new Error('Usuário não encontrado para o pagamento');
    }

    // 💸 Atualizar saldo do usuário
    const amount = payment.netValue || payment.value;
    await this.updateUserBalance(userEmail, amount, 'deposit');

    console.log(`✅ Depósito confirmado: R$ ${amount} para ${userEmail}`);
    
    return {
      success: true,
      action: 'deposit_confirmed',
      userId: userEmail,
      amount: amount,
    };
  }

  // 🏦 Processar transferência completada (saque)
  private async handleTransferCompleted(eventData: AsaasWebhookEvent) {
    const { transfer } = eventData;
    if (!transfer) throw new Error('Dados da transferência não encontrados');

    console.log(`✅ Saque completado: R$ ${transfer.value} para PIX ${transfer.pixAddressKey}`);
    
    return {
      success: true,
      action: 'withdraw_completed',
      amount: transfer.value,
    };
  }

  // ❌ Processar transferência falhada (reverter saque)
  private async handleTransferFailed(eventData: AsaasWebhookEvent) {
    const { transfer } = eventData;
    if (!transfer) throw new Error('Dados da transferência não encontrados');

    // 🔄 Reverter o saque - devolver dinheiro para o usuário
    // Você precisaria buscar qual usuário fez o saque pelo ID da transferência
    console.log(`❌ Saque falhou: R$ ${transfer.value} - será revertido`);
    
    return {
      success: true,
      action: 'withdraw_failed',
      amount: transfer.value,
    };
  }

  // 🔍 Buscar email do usuário pelo pagamento
  private async getUserEmailFromPayment(payment: any): Promise<string | null> {
    // IMPLEMENTAÇÃO NECESSÁRIA:
    // 1. Se você salvou o email no externalReference, extrair daqui
    // 2. Ou buscar na sua base de dados usando o customer ID
    // 3. Ou usar a API do Asaas para buscar dados do customer
    
    try {
      // Exemplo se você salvou como "deposit_timestamp_email"
      if (payment.externalReference?.includes('_')) {
        const parts = payment.externalReference.split('_');
        if (parts.length >= 3) {
          return parts.slice(2).join('_'); // email pode ter _
        }
      }
      
      // Se não encontrou no externalReference, buscar pelo customer
      // const customerData = await AsaasService.getCustomer(payment.customer);
      // return customerData?.email || null;
      
      return null;
    } catch (error) {
      console.error('Erro ao buscar email do usuário:', error);
      return null;
    }
  }

  // 💳 Atualizar saldo do usuário (IMPLEMENTAR CONFORME SUA ARQUITETURA)
  private async updateUserBalance(userEmail: string, amount: number, type: 'deposit' | 'withdraw') {
    // IMPLEMENTAÇÃO NECESSÁRIA:
    // Esta função deve atualizar o saldo na sua base de dados
    // e no contexto da aplicação React Native
    
    console.log(`🔄 Atualizando saldo: ${userEmail} ${type === 'deposit' ? '+' : '-'}R$ ${amount}`);
    
    // Exemplo de implementação:
    // 1. Atualizar no banco de dados
    // await database.updateUserBalance(userEmail, amount, type);
    
    // 2. Notificar app via push notification ou websocket
    // await notificationService.notifyBalanceUpdate(userEmail, amount, type);
    
    // 3. Atualizar cache/redis se usar
    // await cache.updateUserBalance(userEmail, amount, type);
  }
}

export default new AsaasWebhookService();

// 🚀 Exemplo de endpoint para receber webhooks (Express.js)
/*
import express from 'express';
import AsaasWebhookService from './AsaasWebhookService';

const app = express();
app.use(express.json());

// Endpoint para receber webhooks do Asaas
app.post('/webhook/asaas', async (req, res) => {
  try {
    const signature = req.headers['asaas-signature'] as string;
    const payload = JSON.stringify(req.body);
    
    // Validar assinatura
    if (!AsaasWebhookService.validateWebhookSignature(payload, signature)) {
      return res.status(401).json({ error: 'Assinatura inválida' });
    }
    
    // Processar evento
    const result = await AsaasWebhookService.processWebhookEvent(req.body);
    
    if (result.success) {
      res.status(200).json({ message: 'Webhook processado com sucesso' });
    } else {
      res.status(400).json({ error: result.error });
    }
  } catch (error) {
    console.error('Erro no webhook:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.listen(3000, () => {
  console.log('🚀 Servidor webhook rodando na porta 3000');
});
*/