// Configuração completa do Asaas
// IMPORTANTE: Em produção, use variáveis de ambiente

export const ASAAS_CONFIG = {
  // 🔑 Token agora deve vir via variável de ambiente em build (expo-constants ou eas secrets)
  ACCESS_TOKEN: process.env.EXPO_PUBLIC_ASAAS_API_KEY || 'INSIRA_TOKEN_AQUI', // Evitar deixar token real versionado

  // 🌐 URLs da API
  BASE_URL: (process.env.EXPO_PUBLIC_ASAAS_ENV === 'production'
    ? 'https://www.asaas.com/api/v3'
    : 'https://sandbox.asaas.com/api/v3'),
  BASE_URL_PRODUCTION: 'https://www.asaas.com/api/v3', // Produção
  
  // 📱 URLs de webhook (seu servidor para receber notificações)
  WEBHOOK_URL: 'https://seu-servidor.com/webhook/asaas',
  
  // 💰 Configurações de pagamento
  PAYMENT_CONFIG: {
    // Tempo de expiração do PIX (em segundos)
    PIX_EXPIRATION: 3600, // 1 hora
    
    // Dias para vencimento de boleto
    BOLETO_DAYS: 3,
    
    // Valores mínimos
    MIN_DEPOSIT: 10.00,
    MIN_WITHDRAW: 5.00,
  },
  
  // 🎨 Personalização do checkout
  CHECKOUT_CONFIG: {
    logoUrl: 'https://seu-app.com/logo.png',
    primaryColor: '#8B5CF6', // Roxo do seu app
    backgroundColor: '#FFFFFF',
  }
};

// 🏦 Tipos de conta bancária para saque
export const ACCOUNT_TYPES = {
  CHECKING: 'CONTA_CORRENTE',
  SAVINGS: 'CONTA_POUPANCA',
} as const;

// 📊 Status dos pagamentos
export const PAYMENT_STATUS = {
  PENDING: 'PENDING',
  AWAITING_PAYMENT: 'AWAITING_PAYMENT', 
  RECEIVED: 'RECEIVED',
  CONFIRMED: 'CONFIRMED',
  OVERDUE: 'OVERDUE',
  REFUNDED: 'REFUNDED',
} as const;

// 🔄 Status das transferências
export const TRANSFER_STATUS = {
  PENDING: 'PENDING',
  BANK_PROCESSING: 'BANK_PROCESSING',
  DONE: 'DONE',
  CANCELLED: 'CANCELLED',
  FAILED: 'FAILED',
} as const;