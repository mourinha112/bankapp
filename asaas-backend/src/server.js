require('dotenv').config();
const express = require('express');
const db = require('./db');
const database = require('./database');
const crypto = require('crypto');
const bodyParser = require('body-parser');
const cors = require('cors');
const axios = require('axios');
const asaasApi = require('./asaas');

const app = express();
// Habilita CORS para permitir chamadas do frontend (expo web / outras origens)
// Em produção, defina CORS_ORIGIN para restringir as origens permitidas.
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.options('*', cors());
app.use(bodyParser.json());

const PORT = process.env.PORT || 3000;
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || 'default_secret';
const ASAAS_API_KEY = process.env.ASAAS_API_KEY;
const ASAAS_ENVIRONMENT = process.env.ASAAS_ENVIRONMENT || 'sandbox';
const USE_FAKE_ASAAS_WITHDRAW = process.env.USE_FAKE_ASAAS_WITHDRAW === 'true';

// Conectar ao banco
database.connectDB();

// Helper para base URL Asaas
function getAsaasBaseUrl() {
  return ASAAS_ENVIRONMENT === 'production'
    ? 'https://www.asaas.com/api/v3'
    : 'https://sandbox.asaas.com/api/v3';
}

// Rota raiz simples para health check (evita erro 'Cannot GET /')
app.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'asaas-backend', timestamp: Date.now() });
});

// Versão / debug
let packageVersion = '0.0.0';
try {
  // Caminho relativo ao arquivo atual (src/server.js -> ../package.json)
  // eslint-disable-next-line import/no-dynamic-require, global-require
  packageVersion = require('../package.json').version || packageVersion;
} catch (e) {
  console.log('Não foi possível ler versão do package.json');
}
app.get('/api/version', (req, res) => {
  res.json({
    service: 'asaas-backend',
    version: packageVersion,
    env: ASAAS_ENVIRONMENT,
    fakeWithdraw: USE_FAKE_ASAAS_WITHDRAW,
    time: new Date().toISOString()
  });
});

function validateWebhookSignature(payload, signature, secret) {
  const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  return signature === expected;
}

// Gerar código alfanumérico único de 6 dígitos
async function generateUniqueUserCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code;
  let isUnique = false;
  
  while (!isUnique) {
    code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    // Verificar se o código já existe
    try {
      const existingUser = await database.getUserByCode(code);
      if (!existingUser) {
        isUnique = true;
      }
    } catch (error) {
      // Se houve erro na busca (código não existe), é único
      isUnique = true;
    }
  }
  
  return code;
}

// Recebe notificações do Asaas
app.post('/webhook/asaas', async (req, res) => {
  console.log('🔔 Webhook recebido:', req.body);
  console.log('📋 Headers:', req.headers);
  
  // Temporariamente desabilitar validação de assinatura para testes
  const signature = req.headers['asaas-signature'];
  const payload = JSON.stringify(req.body);
  
  // Log para debug
  console.log('🔐 Signature recebida:', signature);
  console.log('📝 Payload:', payload);
  
  // Comentar validação temporariamente
  // if (!validateWebhookSignature(payload, signature, WEBHOOK_SECRET)) {
  //   return res.status(401).json({ error: 'Assinatura inválida' });
  // }
  
  const event = req.body.event;
  console.log('📡 Evento:', event);
  
  if (event === 'PAYMENT_CONFIRMED' || event === 'PAYMENT_RECEIVED') {
    const payment = req.body.payment;
    console.log('💰 Pagamento:', payment);
    
    try {
      // Buscar usuário pelo customer_id do Asaas
      const user = await database.getUserByAsaasCustomerId(payment.customer);
      if (user) {
        console.log('👤 Usuário encontrado:', user.email);

        // Aplicar taxa fixa de R$ 2,00 no momento do depósito
        const fee = 2.00;
        const gross = parseFloat(payment.value) || 0;
        const net = Math.max(0, gross - fee);

        // Atualizar saldo com o valor líquido (já descontando a taxa)
        await database.updateUserBalance(user.id, net, 'add');

        // Criar transação registrando o valor líquido e mencionando a taxa
        await database.createTransaction({
          id: payment.id,
          user_id: user.id,
          type: 'deposit',
          amount: net,
          status: payment.status,
          asaas_payment_id: payment.id,
          description: `Depósito via PIX (valor bruto R$ ${gross.toFixed(2)}, taxa R$ ${fee.toFixed(2)})`
        });

        console.log('✅ Saldo atualizado (líquido):', user.email, '+', net, '(bruto:', gross, 'taxa:', fee, ')');
      } else {
        console.log('❌ Usuário não encontrado para customer:', payment.customer);
      }
    } catch (error) {
      console.error('❌ Erro ao processar webhook:', error);
    }
  }
  
  if (event === 'TRANSFER_DONE') {
    const transfer = req.body.transfer;
    console.log('🔄 Transfer concluído:', transfer);
    
    try {
      await database.createTransaction({
        id: transfer.id,
        user_id: null,
        type: 'withdraw',
        amount: transfer.value,
        status: transfer.status,
        asaas_transfer_id: transfer.id,
        description: 'Saque via Asaas'
      });
    } catch (error) {
      console.error('❌ Erro ao processar transfer:', error);
    }
  }
  
  res.json({ success: true });
});

// Endpoint de teste para verificar se webhook está acessível (GET)
app.get('/webhook/asaas', (req, res) => {
  res.json({ 
    message: '✅ Webhook está funcionando!', 
    method: 'Este endpoint aceita POST para webhooks do Asaas',
    timestamp: new Date().toISOString(),
    status: 'ready'
  });
});

// Endpoint para testar webhook manualmente
app.post('/webhook/test', async (req, res) => {
  console.log('🧪 Testando webhook manualmente...');
  
  // Usar dados do request ou dados padrão
  const webhookData = req.body.payment ? req.body : {
    event: 'PAYMENT_RECEIVED',
    payment: {
      id: 'pay_test_' + Date.now(),
      customer: 'cus_000135131626', // customer_id correto do mourinha112@gmail.com
      value: 9.00,
      status: 'RECEIVED',
      billingType: 'PIX'
    }
  };
  
  const fakeWebhook = webhookData;
  
  console.log('📋 Simulando webhook:', fakeWebhook);
  
  // Reprocessar como se fosse um webhook real
  req.body = fakeWebhook;
  
  // Chamar a lógica do webhook
  try {
    const event = fakeWebhook.event;
    const payment = fakeWebhook.payment;
    
    if (event === 'PAYMENT_RECEIVED') {
      const user = await database.getUserByAsaasCustomerId(payment.customer);
      if (user) {
        // Aplicar taxa fixa de R$2 no teste também
        const fee = 2.00;
        const gross = parseFloat(payment.value) || 0;
        const net = Math.max(0, gross - fee);

        await database.updateUserBalance(user.id, net, 'add');
        await database.createTransaction({
          id: payment.id,
          user_id: user.id,
          type: 'deposit',
          amount: net,
          status: payment.status,
          asaas_payment_id: payment.id,
          description: `Teste manual de depósito (bruto R$ ${gross.toFixed(2)}, taxa R$ ${fee.toFixed(2)})`
        });

        console.log('✅ Teste realizado com sucesso:', user.email, '+', net, '(bruto:', gross, 'taxa:', fee, ')');
        res.json({ success: true, message: 'Webhook testado com sucesso', user: user.email, amount: net });
      } else {
        console.log('❌ Usuário não encontrado para customer:', payment.customer);
        res.json({ success: false, error: 'Usuário não encontrado', customer: payment.customer });
      }
    }
  } catch (error) {
    console.error('❌ Erro no teste:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Ping Asaas - verifica validade da chave
app.get('/api/asaas/ping', async (req, res) => {
  if (!ASAAS_API_KEY) return res.status(500).json({ error: 'ASAAS_API_KEY ausente no servidor' });
  try {
    const response = await axios.get(`${getAsaasBaseUrl()}/customers?limit=1`, {
      headers: { 'access_token': ASAAS_API_KEY }
    });
    res.json({ ok: true, env: ASAAS_ENVIRONMENT, rateLimit: response.headers['x-ratelimit-remaining'] });
  } catch (err) {
    const status = err.response?.status;
    const data = err.response?.data;
    res.status(status || 500).json({ ok: false, status, data });
  }
});

// Consulta saldo do usuário
app.get('/api/balance/:email', (req, res) => {
  db.get('SELECT balance FROM users WHERE email = ?', [req.params.email], (err, row) => {
    if (row) return res.json({ balance: row.balance });
    res.status(404).json({ error: 'Usuário não encontrado' });
  });
});

// Consulta histórico de transações
app.get('/api/transactions/:email', async (req, res) => {
  try {
    console.log('📊 Buscando transações para:', req.params.email);
    const user = await database.getUser(req.params.email);
    if (!user) {
      console.log('❌ Usuário não encontrado:', req.params.email);
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    
    const transactions = await database.getTransactionsByUser(user.id);
    console.log('💰 Transações encontradas:', transactions.length);
    res.json({ transactions });
  } catch (error) {
    console.error('❌ Erro ao buscar transações:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Cria usuário (exemplo)
app.post('/api/users', (req, res) => {
  const { email, username, asaas_customer_id } = req.body;
  const id = Date.now().toString();
  db.run('INSERT INTO users (id, email, username, balance, asaas_customer_id) VALUES (?, ?, ?, ?, ?)', [id, email, username, 0, asaas_customer_id], err => {
    if (err) return res.status(400).json({ error: 'Erro ao criar usuário' });
    res.json({ success: true, id });
  });
});

// ======================== AUTH ENDPOINTS ========================= //
// Registro completo de usuário
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, cpfCnpj, phone, username, password, referralCode } = req.body;
    
    // Converter username e referralCode para maiúsculo
    const usernameCaps = username.toUpperCase();
    const referralCodeCaps = referralCode.toUpperCase();
    
    console.log('📝 Registrando usuário:', { name, email, username: usernameCaps, referralCode: referralCodeCaps });
    
    // Verificar código de referência (código de outro usuário)
    if (!referralCodeCaps) {
      return res.status(400).json({ error: 'Código de usuário de referência é obrigatório' });
    }
    
    // Validar código de usuário no banco
    const referralValidation = await database.validateUserCode(referralCodeCaps);
    if (!referralValidation.valid) {
      return res.status(400).json({ error: referralValidation.error });
    }
    
    // Verificar se email já existe
    const existingUser = await database.getUser(email);
    if (existingUser) {
      return res.status(400).json({ error: 'Email já cadastrado' });
    }
    
    // Verificar se username já existe (será usado como código)
    const existingUsername = await database.getUserByCode(usernameCaps);
    if (existingUsername) {
      return res.status(400).json({ error: 'Nome de usuário já está em uso' });
    }
    
    // Usar o username como código do usuário
    const userCode = usernameCaps;
    console.log('🔑 Usando username como código:', userCode);
    
    // Criar cliente no Asaas primeiro
    const asaasCustomer = await asaasApi.post('/customers', {
      name,
      email,
      cpfCnpj: (cpfCnpj || '').replace(/\D/g, ''),
      phone: phone ? phone.replace(/\D/g, '') : undefined,
      notificationDisabled: false,
    });
    
    console.log('✅ Cliente criado no Asaas:', asaasCustomer.data.id);
    
    // Criar usuário no banco local
    const userData = {
      id: `user_${Date.now()}`,
      email,
      username: usernameCaps,
      password, // Em produção, hash a senha
      fullName: name,
      cpf_cnpj: cpfCnpj,
      phone,
      asaas_customer_id: asaasCustomer.data.id,
      user_code: userCode
    };
    
    const user = await database.createUser(userData);
    console.log('✅ Usuário criado no banco:', user.id);
    
    console.log('✅ Usuário registrado com sucesso. Código:', userCode, '| Referência:', referralCode);
    
    res.json({ 
      success: true, 
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        fullName: user.fullName,
        balance: user.balance,
        userCode: userCode
      }
    });
    
  } catch (error) {
    console.error('❌ Erro no registro:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Login de usuário
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('🔐 Login tentativa:', email);
    
    const user = await database.getUser(email);
    if (!user) {
      return res.status(401).json({ error: 'Email não encontrado' });
    }
    
    // Em produção, comparar hash da senha
    if (user.password !== password) {
      return res.status(401).json({ error: 'Senha incorreta' });
    }
    
    console.log('✅ Login realizado:', user.email);
    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        fullName: user.fullName,
        balance: parseFloat(user.balance),
        userCode: user.user_code
      }
    });
    
  } catch (error) {
    console.error('❌ Erro no login:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Login por username
app.post('/api/auth/login-by-username', async (req, res) => {
  try {
    const { username, password } = req.body;
    const usernameCaps = username.toUpperCase();
    console.log('🔐 Login por username:', usernameCaps);
    
    const user = await database.getUserByCode(usernameCaps);
    if (!user) {
      return res.status(401).json({ error: 'Nome de usuário não encontrado' });
    }
    
    // Em produção, comparar hash da senha
    if (user.password !== password) {
      return res.status(401).json({ error: 'Senha incorreta' });
    }
    
    console.log('✅ Login realizado:', user.username);
    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        fullName: user.fullName,
        balance: parseFloat(user.balance),
        userCode: user.user_code
      }
    });
    
  } catch (error) {
    console.error('❌ Erro no login por username:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Buscar usuário por CPF
app.get('/api/auth/user-by-cpf/:cpf', async (req, res) => {
  try {
    const { cpf } = req.params;
    console.log('🔍 Buscando usuário por CPF:', cpf);
    
    const user = await database.getUserByCpf(cpf);
    if (!user) {
      return res.status(404).json({ error: 'CPF não encontrado' });
    }
    
    console.log('✅ Usuário encontrado:', user.email);
    res.json({
      success: true,
      user: {
        email: user.email,
        fullName: user.fullName,
        username: user.username
      }
    });
    
  } catch (error) {
    console.error('❌ Erro ao buscar por CPF:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Validar código de usuário para registro
app.get('/api/auth/validate-user-code/:code', async (req, res) => {
  try {
    const { code } = req.params;
    console.log('🔍 Validando código de usuário:', code);
    
    const validation = await database.validateUserCode(code);
    
    if (validation.valid) {
      res.json({
        success: true,
        valid: true,
        referralUser: {
          username: validation.user.username,
          userCode: validation.user.user_code
        }
      });
    } else {
      res.json({
        success: true,
        valid: false,
        error: validation.error
      });
    }
    
  } catch (error) {
    console.error('❌ Erro ao validar código:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Buscar usuário por código para transferências
app.post('/api/users/search', async (req, res) => {
  try {
    const { identifier } = req.body;
    console.log('🔍 Buscando usuário por código:', identifier);
    
    const user = await database.getUserByCode(identifier);
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    
    console.log('✅ Usuário encontrado:', user.username);
    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.fullName || user.username,
        email: user.email,
        username: user.username,
        userCode: user.user_code
      }
    });
    
  } catch (error) {
    console.error('❌ Erro ao buscar usuário:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Transferir entre usuários
app.post('/api/transfer', async (req, res) => {
  try {
    const { senderEmail, recipientEmail, amount } = req.body;
    console.log('💸 Transferência:', { senderEmail, recipientEmail, amount });
    
    // Verificar valores
    if (!senderEmail || !recipientEmail || !amount || amount <= 0) {
      return res.status(400).json({ error: 'Dados inválidos para transferência' });
    }
    
    // Buscar usuários
    const sender = await database.getUser(senderEmail);
    const recipient = await database.getUser(recipientEmail);
    
    if (!sender) {
      return res.status(404).json({ error: 'Usuário remetente não encontrado' });
    }
    
    if (!recipient) {
      return res.status(404).json({ error: 'Usuário destinatário não encontrado' });
    }
    
    // Verificar saldo
    if (sender.balance < amount) {
      return res.status(400).json({ error: 'Saldo insuficiente' });
    }
    
    // Realizar transferência (debitar do remetente)
    await database.updateUserBalance(sender.id, amount, 'subtract');
    
    // Creditar para o destinatário
    await database.updateUserBalance(recipient.id, amount, 'add');
    
    // Criar transações
    await database.createTransaction({
      id: `transfer_out_${Date.now()}`,
      user_id: sender.id,
      type: 'transfer_out',
      amount: amount,
      status: 'completed',
      description: `Transferência para ${recipient.username} (${recipient.user_code})`
    });
    
    await database.createTransaction({
      id: `transfer_in_${Date.now()}`,
      user_id: recipient.id,
      type: 'transfer_in',
      amount: amount,
      status: 'completed',
      description: `Transferência de ${sender.username} (${sender.user_code})`
    });
    
    console.log('✅ Transferência realizada com sucesso');
    res.json({ 
      success: true, 
      message: 'Transferência realizada com sucesso',
      newBalance: sender.balance - amount
    });
    
  } catch (error) {
    console.error('❌ Erro na transferência:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Buscar perfil completo do usuário
app.get('/api/user/profile/:email', async (req, res) => {
  try {
    const { email } = req.params;
    console.log('👤 Buscando perfil completo:', email);
    
    const user = await database.getUser(email);
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    
    console.log('✅ Perfil encontrado:', user.email);
    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        fullName: user.fullName,
        balance: parseFloat(user.balance),
        userCode: user.user_code,
        createdAt: user.created_at
      }
    });
    
  } catch (error) {
    console.error('❌ Erro ao buscar perfil:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Buscar usuário por username
app.get('/api/user/by-username/:username', async (req, res) => {
  try {
    const { username } = req.params;
    console.log('👤 Buscando usuário por username:', username);
    
    const user = await database.getUserByCode(username);
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    
    console.log('✅ Usuário encontrado:', user.email);
    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        fullName: user.fullName,
        balance: parseFloat(user.balance),
        userCode: user.user_code,
        createdAt: user.created_at
      }
    });
    
  } catch (error) {
    console.error('❌ Erro ao buscar usuário:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// ======================== ASAAS PROXY ENDPOINTS ========================= //
// Criar/obter cliente (retorna id) + salvar no banco
app.post('/api/asaas/customer', async (req, res) => {
  try {
    const { name, email, cpfCnpj, phone } = req.body;
    console.log('Criando cliente:', { name, email, cpfCnpj });
    
    // Verificar se usuário já existe no banco local
    let user = await database.getUser(email);
    if (user && user.asaas_customer_id) {
      console.log('Cliente já existe no banco:', user.asaas_customer_id);
      return res.json({ id: user.asaas_customer_id, existing: true });
    }
    
    // Tenta buscar existente no Asaas
    const list = await asaasApi.get('/customers', { params: { email } });
    if (list.data && list.data.length > 0) {
      console.log('Cliente já existe no Asaas:', list.data[0].id);
      
      // Salvar/atualizar no banco local se não existir
      if (!user) {
        user = await database.createUser({
          id: `user_${Date.now()}`,
          email,
          username: name,
          fullName: name,
          asaas_customer_id: list.data[0].id,
          document: cpfCnpj
        });
      }
      
      return res.json({ id: list.data[0].id, existing: true });
    }
    
    // Criar novo cliente no Asaas
    const created = await asaasApi.post('/customers', {
      name,
      email,
      cpfCnpj: (cpfCnpj || '').replace(/\D/g, ''),
      phone: phone ? phone.replace(/\D/g, '') : undefined,
      notificationDisabled: false,
    });
    
    console.log('Cliente criado no Asaas:', created.data.id);
    
    // Salvar no banco local
    if (!user) {
      user = await database.createUser({
        id: `user_${Date.now()}`,
        email,
        username: name,
        fullName: name,
        asaas_customer_id: created.data.id,
        document: cpfCnpj
      });
    }
    
    res.json({ id: created.data.id, existing: false });
  } catch (err) {
    console.log('Erro ao criar cliente:', err.response?.data || err.message);
    const errorMsg = err.response?.data?.errors?.[0]?.description || 'Erro ao criar/buscar cliente';
    res.status(err.response?.status || 500).json({ error: errorMsg });
  }
});

// Depósito PIX
app.post('/api/asaas/deposit/pix', async (req, res) => {
  try {
    // DEBUG: log do body recebido para investigação
    console.log('DEBUG /api/asaas/deposit/pix - req.body:', JSON.stringify(req.body));
    const { customerId, value, description } = req.body;
    if (!customerId || !value) return res.status(400).json({ error: 'customerId e value são obrigatórios' });
    
    // 1. Criar o pagamento
    const asaasPayload = {
      customer: customerId,
      billingType: 'PIX',
      value,
      dueDate: new Date().toISOString().split('T')[0],
      description: description || 'Depósito',
      externalReference: `dep_${Date.now()}`,
    };
    console.log('DEBUG /api/asaas/deposit/pix - payload to Asaas:', JSON.stringify(asaasPayload));

    const payment = await asaasApi.post('/payments', asaasPayload);
    
    console.log('Payment criado:', payment.data.id);
    
    // 2. Buscar QR Code PIX específico
    const pixQrCode = await asaasApi.get(`/payments/${payment.data.id}/pixQrCode`);
    console.log('🔍 DEBUG - Resposta completa do QR Code:', JSON.stringify(pixQrCode.data, null, 2));
    console.log('PIX QR Code obtido:', pixQrCode.data);
    
    res.json({
      id: payment.data.id,
      value: payment.data.value,
      status: payment.data.status,
      invoiceUrl: payment.data.invoiceUrl,
      // Dados do PIX vindos da segunda chamada
      pixQrCode: pixQrCode.data.encodedImage,
      pixCopyPaste: pixQrCode.data.payload,
      expiryDate: pixQrCode.data.expirationDate
    });
  } catch (err) {
    console.error('Erro no pagamento PIX - full error object:', err);
    console.error('Erro no pagamento PIX - err.response:', err.response ? {
      status: err.response.status,
      data: err.response.data,
      headers: err.response.headers
    } : null);

    const errorMsg = err.response?.data?.errors?.[0]?.description || err.response?.data || err.message || 'Erro ao criar pagamento PIX';
    res.status(err.response?.status || 500).json({ error: errorMsg });
  }
});

// Saque PIX (transferência)
app.post('/api/asaas/withdraw/pix', async (req, res) => {
  try {
    const { value, pixKey, description } = req.body;
    if (!value || !pixKey) return res.status(400).json({ error: 'value e pixKey são obrigatórios' });
    const transfer = await asaasApi.post('/transfers', {
      value,
      pixAddressKey: pixKey,
      description: description || 'Saque',
    });
    res.json({ id: transfer.data.id, status: transfer.data.status, value: transfer.data.value });
  } catch (err) {
    res.status(err.response?.status || 500).json({ error: err.response?.data || 'Erro ao criar transferência' });
  }
});

// ======================== NOVO ENDPOINT DE SAQUE INTERNO ========================= //
// POST /api/withdraw
// Body: { email, amount, pixKey, description }
// Valida saldo interno, cria transferência PIX via Asaas e registra transação 'withdraw'
app.post('/api/withdraw', async (req, res) => {
  try {
    const { email, amount, pixKey, description } = req.body;
    if (!email || !amount || !pixKey) {
      return res.status(400).json({ error: 'email, amount e pixKey são obrigatórios' });
    }

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({ error: 'Valor inválido' });
    }
    if (numericAmount < 1) {
      return res.status(400).json({ error: 'Valor mínimo para saque é R$ 1,00' });
    }
    if (numericAmount > 5000) {
      return res.status(400).json({ error: 'Valor máximo para saque é R$ 5.000,00' });
    }

    const user = await database.getUser(email);
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });

    if (Number(user.balance) < numericAmount) {
      return res.status(400).json({ error: 'Saldo insuficiente' });
    }

    // Criar transferência PIX no Asaas (ou simular se fake mode)
    let transferCreated = null;
    if (USE_FAKE_ASAAS_WITHDRAW) {
      transferCreated = { data: { id: 'fake_trf_' + Date.now(), status: 'PENDING_FAKE', value: numericAmount } };
      console.log('🧪 Modo FAKE ativo: simulando transferência PIX', transferCreated.data.id);
    } else {
      try {
        transferCreated = await asaasApi.post('/transfers', {
          value: numericAmount,
          pixAddressKey: pixKey,
          description: description || 'Saque'
        });
      } catch (err) {
        const detail = err.response?.data || err.message;
        console.log('❌ Erro ao criar transferência PIX Asaas:', detail);
        // Mapear erro conta não aprovada
        const asaasErrors = detail?.errors;
        if (Array.isArray(asaasErrors)) {
          const invalidAction = asaasErrors.find(e => e.code === 'invalid_action' && /não está totalmente aprovada/i.test(e.description || ''));
          if (invalidAction) {
            return res.status(403).json({
              error: 'Conta Asaas ainda não aprovada para usar PIX (saque)',
              code: 'ASAAS_ACCOUNT_NOT_APPROVED',
              original: invalidAction.description
            });
          }
        }
        return res.status(err.response?.status || 500).json({ error: 'Falha ao solicitar saque externo (Asaas)', detail });
      }
    }

    // Debitar saldo interno
    await database.updateUserBalance(user.id, numericAmount, 'subtract');

    // Registrar transação
    const withdrawTransactionId = `tx_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    await database.createTransaction({
      id: withdrawTransactionId,
      user_id: user.id,
      asaas_payment_id: null,
      asaas_transfer_id: transferCreated.data.id,
      type: 'withdraw',
      amount: numericAmount,
      status: transferCreated.data.status || 'PENDING',
      description: description || 'Saque PIX'
    });

    const updatedUser = await database.getUser(email);

    res.json({
      success: true,
      message: 'Saque solicitado com sucesso',
      withdraw: {
        id: withdrawTransactionId,
        amount: numericAmount,
        status: transferCreated.data.status || 'PENDING',
        asaasTransferId: transferCreated.data.id,
        mode: USE_FAKE_ASAAS_WITHDRAW ? 'fake' : 'real'
      },
      balance: updatedUser.balance,
      fakeMode: USE_FAKE_ASAAS_WITHDRAW
    });
  } catch (error) {
    console.log('❌ Erro interno /api/withdraw:', error);
    res.status(500).json({ error: 'Erro interno ao processar saque' });
  }
});

// Status pagamento
app.get('/api/asaas/payment/:id', async (req, res) => {
  try {
    const payment = await asaasApi.get(`/payments/${req.params.id}`);
    res.json(payment.data);
  } catch (err) {
    res.status(err.response?.status || 500).json({ error: err.response?.data || 'Erro ao consultar pagamento' });
  }
});

// Saldo da conta Asaas
app.get('/api/asaas/account-balance', async (req, res) => {
  try {
    const finance = await asaasApi.get('/finance/balance');
    res.json(finance.data);
  } catch (err) {
    res.status(err.response?.status || 500).json({ error: err.response?.data || 'Erro ao consultar saldo' });
  }
});

// ======================== ENDPOINTS USUÁRIO ========================= //
// Saldo individual do usuário
app.get('/api/user/balance/:email', async (req, res) => {
  try {
    const user = await database.getUser(req.params.email);
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    res.json({ balance: parseFloat(user.balance) });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao consultar saldo do usuário' });
  }
});

// Histórico de transações do usuário
app.get('/api/user/transactions/:email', async (req, res) => {
  try {
    const user = await database.getUser(req.params.email);
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    const transactions = await database.getTransactionsByUser(user.id);
    res.json({ transactions });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao consultar transações' });
  }
});

// Buscar usuário por email ou nome
app.post('/api/users/search', async (req, res) => {
  console.log('🔍 Busca de usuário:', req.body);
  
  try {
    const { identifier } = req.body;
    
    if (!identifier || !identifier.trim()) {
      return res.status(400).json({ error: 'Identificador é obrigatório' });
    }
    
    const searchTerm = identifier.trim();
    console.log('🔍 Buscando usuário:', searchTerm);
    
    // Buscar primeiro por email exato
    let user = await database.getUser(searchTerm);
    
    // Se não encontrou por email, buscar por CPF
    if (!user) {
      user = await database.getUserByCpf(searchTerm);
    }
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'Usuário não encontrado' 
      });
    }
    
    console.log('✅ Usuário encontrado:', { email: user.email, name: user.name });
    
    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name || user.fullName,
        balance: parseFloat(user.balance)
      }
    });
    
  } catch (err) {
    console.error('❌ Erro na busca:', err);
    res.status(500).json({ 
      success: false,
      error: 'Erro interno do servidor' 
    });
  }
});

// Transferência entre usuários
app.post('/api/transfer', async (req, res) => {
  console.log('💸 Transferência solicitada:', req.body);
  
  try {
    // Aceitar tanto o formato antigo quanto o novo
    const { 
      fromEmail, toIdentifier, 
      senderEmail, recipientEmail, 
      amount, description 
    } = req.body;
    
    // Usar o novo formato se disponível, senão usar o antigo
    const senderEmailFinal = senderEmail || fromEmail;
    const recipientEmailFinal = recipientEmail || toIdentifier;
    
    // Validações básicas
    if (!senderEmailFinal || !recipientEmailFinal || !amount) {
      return res.status(400).json({ error: 'Dados obrigatórios não informados' });
    }
    
    const transferAmount = parseFloat(amount);
    if (transferAmount <= 0 || transferAmount < 0.01) {
      return res.status(400).json({ error: 'Valor mínimo para transferência é R$ 0,01' });
    }
    
    // Buscar usuário remetente
    const fromUser = await database.getUser(senderEmailFinal);
    if (!fromUser) {
      return res.status(404).json({ error: 'Usuário remetente não encontrado' });
    }
    
    // Buscar usuário destinatário
    const toUser = await database.getUser(recipientEmailFinal);
    if (!toUser) {
      return res.status(404).json({ error: 'Usuário destinatário não encontrado' });
    }
    
    // Não permitir transferência para si mesmo
    if (fromUser.id === toUser.id) {
      return res.status(400).json({ error: 'Não é possível transferir para si mesmo' });
    }
    
    // Verificar saldo suficiente
    const fromBalance = parseFloat(fromUser.balance);
    if (fromBalance < transferAmount) {
      return res.status(400).json({ error: 'Saldo insuficiente para realizar a transferência' });
    }
    
    // Gerar ID único para a transferência
    const transferId = 'transfer_' + Date.now();
    
    // Processar transferência (transação atômica)
    console.log(`💰 Processando: ${fromUser.email} → ${toUser.email} = R$ ${transferAmount}`);
    
    // 1. Debitar do remetente
    await database.updateUserBalance(fromUser.id, transferAmount, 'subtract');
    
    // 2. Creditar ao destinatário  
    await database.updateUserBalance(toUser.id, transferAmount, 'add');
    
    // 3. Criar transação de débito (remetente)
    await database.createTransaction({
      id: transferId + '_out',
      user_id: fromUser.id,
      type: 'transfer_out',
      amount: transferAmount,
      status: 'CONFIRMED',
      description: description || `Transferência para ${toUser.name || toUser.fullName}`,
      to_user_email: toUser.email,
      from_user_email: fromUser.email
    });
    
    // 4. Criar transação de crédito (destinatário)
    await database.createTransaction({
      id: transferId + '_in',
      user_id: toUser.id,
      type: 'transfer_in',
      amount: transferAmount,
      status: 'CONFIRMED',
      description: description || `Transferência de ${fromUser.name || fromUser.fullName}`,
      to_user_email: toUser.email,
      from_user_email: fromUser.email
    });
    
    console.log('✅ Transferência concluída com sucesso!');
    
    res.json({
      success: true,
      message: 'Transferência realizada com sucesso',
      transfer: {
        id: transferId,
        from: {
          name: fromUser.name || fromUser.fullName,
          email: fromUser.email
        },
        to: {
          name: toUser.name || toUser.fullName,
          email: toUser.email
        },
        amount: transferAmount,
        description: description || `Transferência para ${toUser.name || toUser.fullName}`,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ Erro na transferência:', error);
    res.status(500).json({ error: 'Erro interno do servidor ao processar transferência' });
  }
});

// ======================================================================== //

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
