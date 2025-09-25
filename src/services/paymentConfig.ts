// Configuração do Mercado Pago
// IMPORTANTE: Em produção, essas credenciais devem estar em variáveis de ambiente
export const MERCADO_PAGO_CONFIG = {
  // ⚠️ SUBSTITUA PELAS SUAS CREDENCIAIS REAIS DO MERCADO PAGO
  PUBLIC_KEY: 'TEST-your-public-key', // ← Substitua pela SUA chave pública
  ACCESS_TOKEN: 'TEST-your-access-token', // ← Substitua pelo SEU access token
  
  // 🌐 URLs para webhook (você precisará de um servidor)
  WEBHOOK_URL: 'https://seu-servidor.com/webhook', // ← SEU servidor para receber notificações
  
  // 📱 URLs de retorno para o app
  SUCCESS_URL: 'bankapp://payment/success',
  FAILURE_URL: 'bankapp://payment/failure',
  PENDING_URL: 'bankapp://payment/pending',
};

export const PAYMENT_METHODS = {
  PIX: 'pix',
  CREDIT_CARD: 'credit_card',
  DEBIT_CARD: 'debit_card',
  BANK_TRANSFER: 'bank_transfer',
};

export const BANK_INFO = {
  // Informações do banco receptor (sua conta)
  RECEIVER_EMAIL: 'seu-email@mercadopago.com',
  BANK_ACCOUNT: {
    // Dados da conta para recebimento
    bank: '033', // Santander (exemplo)
    account_number: '12345678',
    account_digit: '9',
    agency: '1234',
    agency_digit: '5',
  }
};