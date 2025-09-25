const axios = require('axios');

async function testBackendConnection() {
  const BASE_BACKEND_URL = 'http://192.168.1.122:3000';
  
  console.log('🧪 TESTE DE CONEXÃO BACKEND');
  console.log('='.repeat(40));
  console.log(`🔗 URL: ${BASE_BACKEND_URL}`);
  console.log('');

  try {
    // 1. Testar rota de saúde
    console.log('1️⃣ Testando rota de saúde...');
    const healthResponse = await axios.get(`${BASE_BACKEND_URL}/`);
    console.log('✅ Backend respondendo!');
    console.log(`📋 Status: ${healthResponse.data.status}`);
    console.log(`🕒 Timestamp: ${new Date(healthResponse.data.timestamp).toLocaleString()}`);
    console.log('');

    // 2. Testar rota de versão
    console.log('2️⃣ Testando rota de versão...');
    const versionResponse = await axios.get(`${BASE_BACKEND_URL}/api/version`);
    console.log('✅ Versão obtida!');
    console.log(`📦 Serviço: ${versionResponse.data.service}`);
    console.log(`🏷️ Versão: ${versionResponse.data.version}`);
    console.log(`🌐 Ambiente: ${versionResponse.data.env}`);
    console.log(`🧪 Fake Withdraw: ${versionResponse.data.fakeWithdraw}`);
    console.log('');

    // 3. Testar endpoint de saque (sem dados válidos, só para ver se responde)
    console.log('3️⃣ Testando endpoint de saque...');
    try {
      await axios.post(`${BASE_BACKEND_URL}/api/withdraw`, {});
    } catch (error) {
      if (error.response && error.response.status === 400) {
        console.log('✅ Endpoint de saque funcionando (erro 400 esperado para dados vazios)');
        console.log(`📝 Mensagem: ${error.response.data.error}`);
      } else {
        throw error;
      }
    }

  } catch (error) {
    console.log('❌ ERRO DE CONEXÃO!');
    
    if (error.response) {
      console.log(`🔴 Status: ${error.response.status}`);
      console.log(`📝 Mensagem: ${error.response.statusText}`);
    } else if (error.code === 'ECONNREFUSED') {
      console.log('🔴 Conexão recusada - Backend não está rodando ou IP incorreto');
    } else {
      console.log(`🔴 Erro: ${error.message}`);
    }
  }

  console.log('\n' + '='.repeat(40));
  console.log('🏁 Teste concluído!');
}

testBackendConnection();