# 🎯 Sistema de Webhook - Configuração para Produção

## 📋 Resumo do Sistema Implementado

Seu app agora tem um sistema completo de pagamentos reais com Asaas:

### ✅ Funcionalidades Implementadas:
- **💰 Depósitos**: PIX (QR Code) + Cartão de Crédito
- **🏦 Saques**: Transferências PIX automáticas
- **🔄 Webhook**: Sistema para atualizar saldo automaticamente
- **📱 UI**: Design mantido (branco e roxo)

---

## 🚀 Como Configurar em Produção

### 1. **Servidor Backend com Webhook**

Você precisa de um servidor para receber as notificações do Asaas:

```javascript
// server.js (Node.js + Express)
const express = require('express');
const app = express();

app.use(express.json());

// Endpoint para receber webhooks do Asaas
app.post('/webhook/asaas', async (req, res) => {
  try {
    const eventData = req.body;
    console.log('Webhook recebido:', eventData);
    
    // Processar diferentes tipos de eventos
    switch (eventData.event) {
      case 'PAYMENT_RECEIVED':
      case 'PAYMENT_CONFIRMED':
        // Depósito confirmado
        await updateUserBalance(eventData.payment);
        break;
        
      case 'TRANSFER_DONE':
        // Saque completado
        console.log('Saque realizado:', eventData.transfer);
        break;
    }
    
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Erro no webhook:', error);
    res.status(500).json({ error: 'Erro interno' });
  }
});

app.listen(3000, () => {
  console.log('Servidor webhook rodando na porta 3000');
});
```

### 2. **Configurar Webhook no Asaas**

#### Painel do Asaas:
1. Acesse: `https://sandbox.asaas.com/webhook` (sandbox) ou `https://www.asaas.com/webhook` (produção)
2. Configure a URL do seu servidor: `https://seudominio.com/webhook/asaas`
3. Selecione os eventos:
   - ✅ `PAYMENT_RECEIVED`
   - ✅ `PAYMENT_CONFIRMED`
   - ✅ `TRANSFER_DONE`
   - ✅ `TRANSFER_FAILED`

#### Via API:
```javascript
// Configurar webhook via API
const webhookConfig = {
  url: 'https://seudominio.com/webhook/asaas',
  email: 'seu@email.com',
  enabled: true,
  interrupted: false,
  authToken: 'token_opcional',
  events: [
    'PAYMENT_RECEIVED',
    'PAYMENT_CONFIRMED',
    'TRANSFER_DONE',
    'TRANSFER_FAILED'
  ]
};

fetch('https://sandbox.asaas.com/api/v3/webhooks', {
  method: 'POST',
  headers: {
    'access_token': 'SUA_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(webhookConfig)
});
```

### 3. **Base de Dados**

Configure uma base de dados para persistir:

```sql
-- Tabela de usuários
CREATE TABLE users (
  id VARCHAR(50) PRIMARY KEY,
  email VARCHAR(100) UNIQUE NOT NULL,
  username VARCHAR(50) NOT NULL,
  balance DECIMAL(10,2) DEFAULT 0.00,
  asaas_customer_id VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de transações
CREATE TABLE transactions (
  id VARCHAR(50) PRIMARY KEY,
  user_id VARCHAR(50) NOT NULL,
  type ENUM('deposit', 'withdraw', 'transfer') NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  status ENUM('pending', 'completed', 'failed') NOT NULL,
  asaas_payment_id VARCHAR(50),
  asaas_transfer_id VARCHAR(50),
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### 4. **Atualizar Credenciais**

#### `src/config/asaasConfig.ts`:
```typescript
export const asaasConfig = {
  // PRODUÇÃO - Substitua pelas credenciais reais
  apiKey: process.env.ASAAS_API_KEY || 'SUA_API_KEY_REAL',
  environment: 'production', // 'sandbox' ou 'production'
  baseUrl: 'https://www.asaas.com/api/v3', // URL de produção
  
  // URLs de retorno
  successUrl: 'https://seuapp.com/success',
  cancelUrl: 'https://seuapp.com/cancel',
  
  webhook: {
    url: 'https://seudominio.com/webhook/asaas',
    secret: process.env.WEBHOOK_SECRET,
  },
};
```

### 5. **Segurança do Webhook**

```javascript
const crypto = require('crypto');

function validateWebhookSignature(payload, signature, secret) {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
    
  return signature === expectedSignature;
}

// No endpoint do webhook
app.post('/webhook/asaas', (req, res) => {
  const signature = req.headers['asaas-signature'];
  const payload = JSON.stringify(req.body);
  
  if (!validateWebhookSignature(payload, signature, WEBHOOK_SECRET)) {
    return res.status(401).json({ error: 'Assinatura inválida' });
  }
  
  // Processar webhook...
});
```

---

## 📱 App React Native - Produção

### 1. **Variáveis de Ambiente**

Crie `.env`:
```
ASAAS_API_KEY=your_production_api_key
ASAAS_ENVIRONMENT=production
WEBHOOK_URL=https://seudominio.com/webhook/asaas
```

### 2. **Push Notifications**

Para notificar usuários sobre transações:

```javascript
import * as Notifications from 'expo-notifications';

// Notificar depósito confirmado
async function notifyDepositConfirmed(amount) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '💰 Depósito Confirmado!',
      body: `R$ ${amount} foi adicionado à sua conta`,
      sound: true,
    },
    trigger: null,
  });
}
```

### 3. **WebSocket para Tempo Real**

```javascript
// Real-time balance updates
const ws = new WebSocket('wss://seudominio.com/ws');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.type === 'balance_update') {
    updateBalance(data.newBalance);
  }
};
```

---

## 🔄 Fluxo Completo

### Depósito:
1. **App**: Usuário escolhe valor e método (PIX/Cartão)
2. **Asaas**: Gera QR Code PIX ou link de pagamento
3. **Usuário**: Paga via PIX ou cartão
4. **Asaas**: Confirma pagamento → Envia webhook
5. **Servidor**: Recebe webhook → Atualiza saldo no banco
6. **App**: Polling verifica saldo → Atualiza interface

### Saque:
1. **App**: Usuário informa chave PIX e valor
2. **Asaas**: Cria transferência PIX
3. **Banco**: Processa transferência
4. **Asaas**: Confirma transferência → Envia webhook
5. **Servidor**: Recebe webhook → Confirma saque

---

## 🧪 Testes

### Ambiente Sandbox:
- Use dados de cartão de teste do Asaas
- PIX: Use chaves PIX de teste
- Webhooks: Use ngrok para testes locais

### Chaves PIX de Teste:
- **CPF**: 11111111111
- **Email**: test@test.com
- **Telefone**: +5511999999999

---

## 📞 Suporte

- **Documentação Asaas**: https://docs.asaas.com
- **Sandbox**: https://sandbox.asaas.com
- **Suporte**: https://www.asaas.com/suporte

---

## ✅ Checklist Final

- [ ] Servidor backend configurado
- [ ] Webhook configurado no Asaas
- [ ] Base de dados criada
- [ ] Credenciais de produção configuradas
- [ ] SSL/HTTPS configurado
- [ ] Testes realizados no sandbox
- [ ] Push notifications configuradas
- [ ] Monitoramento de logs implementado

**🎉 Seu sistema de pagamentos está pronto para produção!**