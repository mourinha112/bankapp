# 🗄️ Banco de Dados COMPLETO - BankApp

## 🚨 IMPORTANTE: Execute o novo script!

Execute o arquivo `database_complete.sql` no phpMyAdmin. Este script:

✅ **Remove tabelas antigas** (se existirem)  
✅ **Cria estrutura completa** com campo password  
✅ **Insere usuários de teste** com senhas  
✅ **Adiciona transações de exemplo**  

## 📋 Estrutura das Tabelas

### Tabela `users`
```sql
- id (varchar 50) - ID único do usuário
- email (varchar 255) - Email único para login
- username (varchar 100) - Nome de usuário
- password (varchar 255) - Senha do usuário
- fullName (varchar 255) - Nome completo
- cpf_cnpj (varchar 14) - CPF para Asaas
- phone (varchar 20) - Telefone
- balance (decimal 10,2) - SALDO INDIVIDUAL
- asaas_customer_id (varchar 100) - ID no Asaas
```

### Tabela `transactions`
```sql
- id (varchar 255) - ID da transação
- user_id (varchar 50) - FK para users
- type (enum) - deposit/withdraw/transfer_in/transfer_out
- amount (decimal 10,2) - Valor da transação
- status (varchar 50) - Status do pagamento
- asaas_payment_id - ID no Asaas
- description - Descrição
```

## 👥 Usuários de Teste Criados

| Email | Username | Senha | Saldo Inicial |
|-------|----------|-------|---------------|
| user1@test.com | user1 | (hash) | R$ 1.000,00 |
| user2@test.com | user2 | (hash) | R$ 2.000,00 |
| teste@example.com | teste | senha123 | R$ 500,00 |

## 💰 Como funciona o saldo:

1. **Depósito via PIX**: 
   - Usuário faz PIX real
   - Webhook atualiza `balance` na tabela `users`
   - Frontend busca saldo atualizado

2. **Transferências**:
   - Deduz do remetente (`balance - valor`)
   - Adiciona ao destinatário (`balance + valor`)

3. **Consulta de saldo**:
   - Endpoint: `GET /api/user/balance/:email`
   - Retorna saldo individual do usuário

## 🔧 Passos para testar:

1. Execute `database_complete.sql` no phpMyAdmin
2. Inicie o backend: `npm start`
3. Teste login com: `teste@example.com` / `senha123`
4. Faça um depósito PIX real
5. Veja o saldo atualizar automaticamente!