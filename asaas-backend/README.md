# Asaas Backend

Servidor Node.js Express para integração com Asaas (webhooks, saldo, transações) e persistência em SQLite.

## Como usar

1. Copie `.env.example` para `.env` e configure suas credenciais.
2. Instale dependências:
   ```bash
   npm install
   ```
3. Rode o servidor:
   ```bash
   npm run dev
   ```

## Endpoints principais
- `POST /webhook/asaas` — Recebe notificações do Asaas
- `GET /api/balance/:email` — Consulta saldo do usuário
- `GET /api/transactions/:email` — Consulta histórico de transações

## Banco de dados
- SQLite: `asaas.db` criado automaticamente

## Configuração do Webhook
- Configure a URL do webhook no painel do Asaas para `http://SEU_IP:3000/webhook/asaas`
- Use o segredo do webhook para validar requisições

## Produção
- Use HTTPS
- Proteja o endpoint do webhook
- Configure variáveis de ambiente
