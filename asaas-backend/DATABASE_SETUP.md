# 🗄️ Configuração do Banco de Dados MySQL

## Passo 1: Abrir phpMyAdmin
1. Abra seu XAMPP Control Panel
2. Inicie os serviços **Apache** e **MySQL**
3. Clique em **Admin** ao lado do MySQL (ou acesse http://localhost/phpmyadmin)

## Passo 2: Executar o Script SQL
1. No phpMyAdmin, clique na aba **SQL** no menu superior
2. Copie e cole todo o conteúdo do arquivo `database_setup.sql`
3. Clique em **Executar** (Go)

## Passo 3: Verificar se foi criado corretamente
Após executar o script, você deve ver:
- ✅ Banco `bankapp` criado
- ✅ Tabela `users` criada
- ✅ Tabela `transactions` criada
- ✅ Usuário de teste inserido

## Passo 4: Configurar credenciais do banco
No arquivo `.env` do backend, ajuste as configurações do MySQL:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=          # Deixe vazio se não tiver senha no root
DB_NAME=bankapp
DB_PORT=3306
```

## Passo 5: Testar conexão
Execute no terminal do backend:
```bash
npm start
```

Se aparecer a mensagem "Conectado ao MySQL!", significa que está funcionando!

## ⚠️ Problemas Comuns

### Erro "Access denied for user 'root'"
- Verifique se o MySQL está rodando no XAMPP
- Confirme se o usuário é `root` e a senha está correta
- Se tiver senha no root, adicione em `DB_PASSWORD=suasenha`

### Erro "Database doesn't exist"
- Execute novamente o script SQL no phpMyAdmin
- Verifique se o banco `bankapp` foi criado corretamente

### Erro de conexão
- Confirme se o MySQL está rodando na porta 3306
- Verifique se o XAMPP está funcionando

## 🎯 Estrutura Final

**Tabela users:**
- id (AUTO_INCREMENT)
- name, email, cpf_cnpj
- balance (saldo individual)
- asaas_customer_id
- created_at, updated_at

**Tabela transactions:**
- id (varchar para IDs do Asaas)
- user_id (FK para users)
- type (deposit/withdraw/transfer)
- amount, status
- asaas_payment_id, asaas_transfer_id
- description, timestamps