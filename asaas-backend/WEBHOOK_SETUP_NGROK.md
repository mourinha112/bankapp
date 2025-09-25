# 🔗 Configuração do Webhook Asaas com ngrok

## ⚠️ PROBLEMA: QR Code não funciona = Webhook não está chegando

### 📋 Passos para corrigir:

## 1. **Instalar ngrok** (se não tiver)
- Baixe em: https://ngrok.com/download
- Descompacte em uma pasta (ex: C:\ngrok)
- Adicione ao PATH do Windows

## 2. **Iniciar o backend** 
```bash
cd asaas-backend
npm start
```
(Backend deve rodar na porta 3000)

## 3. **Expor o backend com ngrok**
```bash
ngrok http 3000
```

Isso vai gerar uma URL tipo: `https://abc123.ngrok-free.app`

## 4. **Configurar webhook no Asaas**
1. Acesse: https://www.asaas.com/api/webhooks
2. Clique em "Novo Webhook"
3. URL: `https://sua-url-ngrok.ngrok-free.app/webhook/asaas`
4. Eventos: ✅ **PAYMENT_RECEIVED** e ✅ **PAYMENT_CONFIRMED**
5. Salvar

## 5. **Teste o webhook**

### ✅ **Teste 1 - Verificar se está acessível:**
- Acesse: `https://301ff82c7d46.ngrok-free.app/webhook/asaas`
- Deve mostrar: `"✅ Webhook está funcionando!"`

### ✅ **Teste 2 - Simular pagamento:**
- POST para: `https://301ff82c7d46.ngrok-free.app/webhook/test`
- Vai simular um pagamento aprovado
- Verifique logs no backend

### ✅ **Teste 3 - PIX real:**
- Faça um depósito PIX pelo app
- Verifique logs no terminal do backend
- Deve aparecer: `🔔 Webhook recebido:`

## 🐛 **Debug do webhook**

### Webhook está funcionando se você ver:
```
🔔 Webhook recebido: { event: 'PAYMENT_RECEIVED', payment: { ... } }
💰 Pagamento: { id: 'pay_xxx', value: 10, status: 'RECEIVED' }
👤 Usuário encontrado: mourinha112@gmail.com
✅ Saldo atualizado: mourinha112@gmail.com + 10
```

### Se não estiver funcionando:
1. ❌ **Backend não está rodando** → `npm start`
2. ❌ **ngrok não está ativo** → `ngrok http 3000`
3. ❌ **URL errada no Asaas** → Copiar URL do ngrok
4. ❌ **Usuário não tem customer_id** → Refazer cadastro

## 🔧 **Comandos rápidos:**

### Terminal 1 - Backend:
```bash
cd c:\Users\Mourinha\Desktop\ramilo\BankApp\asaas-backend
npm start
```

### Terminal 2 - ngrok:
```bash
ngrok http 3000
```

### URL do webhook:
```
https://SUA-URL-NGROK.ngrok-free.app/webhook/asaas
```

## ✅ **SISTEMA 100% FUNCIONAL!** 🎉

### 🚀 **PIX está funcionando perfeitamente:**
- ✅ QR Code válido sendo gerado
- ✅ Pagamentos sendo recebidos
- ✅ Webhook processando automaticamente
- ✅ Saldo sendo atualizado em tempo real
- ✅ Valor mínimo: R$ 5,00 (configurado corretamente)

### 📱 **Como usar:**
1. **Gere um PIX** de R$ 5,00 ou mais no app
2. **Copie o código PIX** (botão funciona perfeitamente!)
3. **Pague no seu banco** 
4. **Aguarde** - saldo atualiza automaticamente! 💰

### 🔗 **Webhook configurado:**
- URL: `https://301ff82c7d46.ngrok-free.app/webhook/asaas`
- Status: ✅ **FUNCIONANDO**
- Eventos: ✅ PAYMENT_RECEIVED ✅ PAYMENT_CONFIRMED

### 🎯 **Últimos testes realizados:**
1. ✅ PIX de R$ 9,00 processado com sucesso
2. ✅ Usuário: mourinha112@gmail.com
3. ✅ Saldo atualizado corretamente
4. ✅ Erro MySQL corrigido