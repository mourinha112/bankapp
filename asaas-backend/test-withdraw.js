const axios = require('axios');

async function testWithdrawEndpoint() {
  const BASE_BACKEND_URL = 'http://192.168.1.122:3000';
  
  console.log('💸 TESTE DE ENDPOINT DE SAQUE');
  console.log('='.repeat(50));
  console.log(`🔗 URL: ${BASE_BACKEND_URL}/api/withdraw`);
  console.log('');

  // Dados de teste - substitua pelo email real do usuário logado
  const testData = {
    email: 'mourinha112@gmail.com', // Substitua pelo email do usuário
    amount: 2.00, // R$ 2,00
    pixKey: '16709880745', // Sua chave PIX (CPF)
    description: 'Teste de saque frontend'
  };

  console.log('📤 Dados do teste:', testData);
  console.log('');

  try {
    console.log('🚀 Enviando requisição...');
    const response = await axios.post(`${BASE_BACKEND_URL}/api/withdraw`, testData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ SUCESSO!');
    console.log('📋 Resposta completa:', JSON.stringify(response.data, null, 2));
    
    if (response.data.success) {
      console.log('');
      console.log('🎯 Detalhes do saque:');
      console.log(`💰 Valor: R$ ${response.data.withdraw.amount}`);
      console.log(`🆔 ID: ${response.data.withdraw.id}`);
      console.log(`📊 Status: ${response.data.withdraw.status}`);
      console.log(`🔗 Asaas Transfer ID: ${response.data.withdraw.asaasTransferId}`);
      console.log(`💳 Novo saldo: R$ ${response.data.balance}`);
      console.log(`🧪 Modo: ${response.data.withdraw.mode}`);
    }

  } catch (error) {
    console.log('❌ ERRO!');
    
    if (error.response) {
      console.log(`🔴 Status HTTP: ${error.response.status}`);
      console.log(`📝 Dados da resposta:`, JSON.stringify(error.response.data, null, 2));
      
      // Analisar erros específicos
      if (error.response.data.error) {
        console.log(`🚨 Erro específico: ${error.response.data.error}`);
        
        if (error.response.data.code) {
          console.log(`🏷️ Código do erro: ${error.response.data.code}`);
        }
      }
    } else {
      console.log(`🔴 Erro de rede: ${error.message}`);
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('🏁 Teste concluído!');
}

testWithdrawEndpoint();