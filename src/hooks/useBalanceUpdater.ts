import { useEffect } from 'react';
import AsaasService from '../services/AsaasService';

// 🔄 Hook para simular atualizações de saldo via webhook
export const useBalanceUpdater = (userEmail?: string, onBalanceUpdate?: (amount: number, type: 'deposit' | 'withdraw') => void) => {

  useEffect(() => {
    if (!userEmail || !onBalanceUpdate) return;

    // 🔁 Polling para verificar atualizações de saldo
    // Em produção, isso seria substituído por websockets ou push notifications
    const checkBalanceUpdates = async () => {
      try {
        // Simular checagem de novos pagamentos confirmados
        await checkRecentPayments();
      } catch (error) {
        console.error('Erro ao verificar atualizações de saldo:', error);
      }
    };

    // Verificar a cada 30 segundos
    const interval = setInterval(checkBalanceUpdates, 30000);

    return () => clearInterval(interval);
  }, [userEmail]);

  // 💰 Verificar pagamentos recentes confirmados
  const checkRecentPayments = async () => {
    if (!userEmail) return;

    try {
      // Buscar customer do usuário
      const customers = await AsaasService.getCustomers();
      const userCustomer = customers?.data?.find(
        (customer: any) => customer.email === userEmail
      );

      if (!userCustomer) return;

      // Buscar pagamentos confirmados recentes (últimas 24h)
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const payments = await AsaasService.getPayments({
        customer: userCustomer.id,
        status: 'CONFIRMED',
        dateCreated: yesterday.toISOString().split('T')[0],
      });

      if (payments?.data?.length > 0) {
        // Verificar se há novos pagamentos que não foram processados
        const newPayments = payments.data.filter((payment: any) => {
          // Verificar se o pagamento foi confirmado nas últimas 2 horas
          const paymentDate = new Date(payment.confirmedDate || payment.paymentDate);
          const twoHoursAgo = new Date();
          twoHoursAgo.setHours(twoHoursAgo.getHours() - 2);
          
          return paymentDate > twoHoursAgo;
        });

        // Processar novos pagamentos
        for (const payment of newPayments) {
          await processNewPayment(payment);
        }
      }
    } catch (error) {
      console.error('Erro ao verificar pagamentos recentes:', error);
    }
  };

  // 🎯 Processar novo pagamento confirmado
  const processNewPayment = async (payment: any) => {
    try {
      const amount = payment.netValue || payment.value;
      
      // Chamar callback para atualizar saldo
      if (onBalanceUpdate) {
        onBalanceUpdate(amount, 'deposit');
      }

      console.log(`✅ Novo depósito processado: R$ ${amount}`);
    } catch (error) {
      console.error('Erro ao processar novo pagamento:', error);
    }
  };

  // 📱 Forçar verificação manual de saldo
  const checkBalanceNow = async () => {
    await checkRecentPayments();
  };

  return {
    checkBalanceNow,
  };
};

// 🔔 Simulador de notificações de webhook (para desenvolvimento)
export const simulateWebhookNotification = (
  type: 'payment_confirmed' | 'transfer_completed' | 'transfer_failed',
  amount: number,
  onBalanceUpdate: (amount: number, type: 'deposit' | 'withdraw') => void
) => {
  setTimeout(() => {
    switch (type) {
      case 'payment_confirmed':
        onBalanceUpdate(amount, 'deposit');
        console.log(`🔔 Simulação: Depósito de R$ ${amount} confirmado!`);
        break;
        
      case 'transfer_completed':
        console.log(`🔔 Simulação: Saque de R$ ${amount} completado!`);
        break;
        
      case 'transfer_failed':
        onBalanceUpdate(amount, 'deposit'); // Reverter saque
        console.log(`🔔 Simulação: Saque de R$ ${amount} falhou - valor revertido!`);
        break;
    }
  }, 2000); // Simular delay de 2 segundos
};