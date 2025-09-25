const axios = require('axios');
require('dotenv').config();

const asaasApi = axios.create({
  baseURL: 'https://www.asaas.com/api/v3',
  headers: {
    'access_token': process.env.ASAAS_API_KEY,
    'Content-Type': 'application/json',
  },
});

async function testPixGeneration() {
  try {
    console.log('🧪 Testando geração de PIX diretamente...');
    
    // 1. Criar customer válido
    const customer = await asaasApi.post('/customers', {
      name: 'Teste Mourinha',
      email: 'mourinha112@gmail.com',
      cpfCnpj: '16709880745', // CPF real
      notificationDisabled: false,
    });
    
    console.log('✅ Customer criado:', customer.data.id);
    
    // 2. Criar pagamento PIX
    const payment = await asaasApi.post('/payments', {
      customer: customer.data.id,
      billingType: 'PIX',
      value: 5.00, // Valor mínimo é R$ 5,00
      dueDate: new Date().toISOString().split('T')[0],
      description: 'Teste PIX Direto',
    });
    
    console.log('✅ Payment criado:', payment.data.id);
    console.log('📊 Status do payment:', payment.data.status);
    
    // 3. Buscar QR Code
    const qrCode = await asaasApi.get(`/payments/${payment.data.id}/pixQrCode`);
    
    console.log('✅ QR Code gerado:');
    console.log('🔍 Payload completo:', qrCode.data.payload);
    console.log('📱 Tamanho do payload:', qrCode.data.payload.length);
    console.log('⏰ Expira em:', qrCode.data.expirationDate);
    
    // Verificar se payload é válido PIX
    if (qrCode.data.payload.startsWith('00020101')) {
      console.log('✅ Payload PIX parece válido (começa com 00020101)');
    } else {
      console.log('❌ Payload PIX pode estar inválido');
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.response?.data || error.message);
  }
}

testPixGeneration();