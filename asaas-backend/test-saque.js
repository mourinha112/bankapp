const axios = require('axios');
require('dotenv').config();

// Configurações
const ASAAS_API_KEY = process.env.ASAAS_API_KEY;
const ASAAS_ENVIRONMENT = process.env.ASAAS_ENVIRONMENT || 'sandbox';

function getAsaasBaseUrl() {
  return ASAAS_ENVIRONMENT === 'production'
    ? 'https://www.asaas.com/api/v3'
    : 'https://sandbox.asaas.com/api/v3';
}

async function testAsaasConnection() {
  console.log('🧪 TESTE DE CONEXÃO ASAAS');
  console.log('='.repeat(50));
  console.log(`🌐 Ambiente: ${ASAAS_ENVIRONMENT}`);
  console.log(`🔗 Base URL: ${getAsaasBaseUrl()}`);
  console.log(`🔑 Token: ${ASAAS_API_KEY ? ASAAS_API_KEY.substring(0, 20) + '...' : 'NÃO CONFIGURADO'}`);
  console.log('');

  if (!ASAAS_API_KEY) {
    console.log('❌ Token não configurado!');
    return;
  }

  try {
    // 1. Testar autenticação
    console.log('1️⃣ Testando autenticação...');
    const authResponse = await axios.get(`${getAsaasBaseUrl()}/myAccount`, {
      headers: {
        'access_token': ASAAS_API_KEY,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Autenticação OK!');
    console.log(`📋 Conta: ${authResponse.data.name || 'N/A'}`);
    console.log(`📧 Email: ${authResponse.data.email || 'N/A'}`);
    console.log(`💰 Saldo: R$ ${authResponse.data.walletBalance || '0,00'}`);
    console.log('');

    // 2. Testar criação de transferência PIX
    console.log('2️⃣ Testando criação de transferência PIX...');
    
    const transferData = {
      value: 5.00, // R$ 5,00 conforme solicitado
      pixAddressKey: '16709880745', // Sua chave PIX (CPF)
      pixAddressKeyType: 'CPF',
      description: 'Teste de saque real - ' + new Date().toISOString()
    };

    console.log('📤 Dados do saque:', transferData);

    const transferResponse = await axios.post(`${getAsaasBaseUrl()}/transfers`, transferData, {
      headers: {
        'access_token': ASAAS_API_KEY,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Transferência criada!');
    console.log(`🆔 ID: ${transferResponse.data.id}`);
    console.log(`💸 Valor: R$ ${transferResponse.data.value}`);
    console.log(`📊 Status: ${transferResponse.data.status}`);
    console.log(`📅 Data: ${transferResponse.data.dateCreated}`);
    console.log('');

    // 3. Consultar a transferência
    console.log('3️⃣ Consultando transferência criada...');
    const consultResponse = await axios.get(`${getAsaasBaseUrl()}/transfers/${transferResponse.data.id}`, {
      headers: {
        'access_token': ASAAS_API_KEY,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Consulta OK!');
    console.log(`📊 Status atual: ${consultResponse.data.status}`);
    console.log(`💰 Taxa: R$ ${consultResponse.data.transferFee || '0,00'}`);
    console.log(`🔄 Valor líquido: R$ ${consultResponse.data.netValue || consultResponse.data.value}`);

  } catch (error) {
    console.log('❌ ERRO!');
    
    if (error.response) {
      console.log(`🔴 Status: ${error.response.status}`);
      console.log(`📝 Resposta:`, JSON.stringify(error.response.data, null, 2));
      
      if (error.response.data.errors) {
        console.log('\n🚨 Erros específicos:');
        error.response.data.errors.forEach((err, index) => {
          console.log(`   ${index + 1}. ${err.code}: ${err.description}`);
        });
      }
    } else {
      console.log(`🔴 Erro de rede: ${error.message}`);
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('🏁 Teste concluído!');
}

// Executar teste
testAsaasConnection();