# 🏦 BankApp - Aplicativo Bancário Completo

![BankApp Logo](./assets/icon.png)

Um aplicativo bancário completo desenvolvido com React Native e Node.js, oferecendo funcionalidades de cadastro, login, transferências, depósitos PIX e saques com integração ao gateway Asaas.

## 📱 Screenshots

| Login | Dashboard | Transferência | Depósito |
|-------|-----------|---------------|----------|
| ![Login](./docs/login.png) | ![Dashboard](./docs/dashboard.png) | ![Transfer](./docs/transfer.png) | ![Deposit](./docs/deposit.png) |

##   Funcionalidades

### 👤 **Autenticação**
- ✅ Cadastro com sistema de referência
- ✅ Login por ID (username) ou email
- ✅ Validação de dados em tempo real
- ✅ Sistema de códigos únicos de 6 caracteres

### 💰 **Operações Bancárias**
- ✅ Consulta de saldo em tempo real
- ✅ Transferências entre usuários
- ✅ Depósitos via PIX (Asaas Gateway)
- ✅ Saques para conta bancária
- ✅ Histórico completo de transações

### 🔒 **Segurança**
- ✅ Criptografia de senhas (bcrypt)
- ✅ Validação de CPF/CNPJ
- ✅ Tokens de autenticação seguros
- ✅ Webhooks para confirmação de pagamentos

### 📊 **Painel Administrativo**
- ✅ Gestão de usuários
- ✅ Controle de saques
- ✅ Relatórios financeiros
- ✅ Logs de transações

## 🏗️ Arquitetura do Sistema

```
BankApp/
├── 📱 Frontend (React Native + Expo)
│   ├── src/
│   │   ├── screens/          # Telas do aplicativo
│   │   ├── components/       # Componentes reutilizáveis
│   │   ├── services/         # Integrações com APIs
│   │   ├── context/          # Gerenciamento de estado
│   │   ├── navigation/       # Navegação entre telas
│   │   └── theme/           # Cores e estilos
│   └── assets/              # Imagens e ícones
│
├── 🖥️ Backend (Node.js + Express)
│   ├── src/
│   │   ├── server.js        # Servidor principal
│   │   ├── db.js           # Configuração MySQL
│   │   └── asaas.js        # Integração Asaas
│   └── migrations/         # Scripts de migração
│
└── 🌐 Admin Panel (PHP)
    ├── index.php           # Dashboard principal
    ├── users.php          # Gestão de usuários
    └── config.php         # Configurações
```

## 🛠️ Tecnologias Utilizadas

### **Frontend**
- **React Native** - Framework mobile
- **Expo** - Plataforma de desenvolvimento
- **TypeScript** - Tipagem estática
- **React Navigation** - Navegação entre telas
- **Expo Linear Gradient** - Efeitos visuais
- **AsyncStorage** - Armazenamento local

### **Backend**
- **Node.js** - Runtime JavaScript
- **Express.js** - Framework web
- **MySQL** - Banco de dados
- **bcrypt** - Criptografia de senhas
- **cors** - Controle de acesso
- **body-parser** - Parser de requisições

### **Integrações**
- **Asaas Gateway** - Processamento de pagamentos
- **PIX** - Sistema de pagamentos instantâneos
- **Webhooks** - Notificações automáticas

## 📋 APIs Desenvolvidas (14 Endpoints)

### **🔐 Autenticação**
```http
POST /api/auth/register
POST /api/auth/login
POST /api/auth/login-by-username
GET /api/auth/validate-user-code
```

### **👤 Usuários**
```http
GET /api/user/profile/:email
GET /api/user/balance/:email
GET /api/user/transactions/:email
GET /api/users/search/:term
POST /api/users/by-username
```

### **💳 Operações Financeiras**
```http
POST /api/asaas/deposit/pix
POST /api/withdraw
POST /api/transfer
GET /api/asaas/payment/:paymentId
GET /api/asaas/account-balance
```

### **🔔 Webhooks**
```http
POST /webhook/asaas
GET /api/webhook/test
```

### **📊 Administrativo**
```http
GET /api/admin/stats
GET /api/admin/users
POST /api/admin/approve-withdraw
```

## 🗄️ Estrutura do Banco de Dados

### **Tabela: users**
```sql
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(6) UNIQUE NOT NULL,
    user_code VARCHAR(6) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    cpf VARCHAR(14) UNIQUE NOT NULL,
    phone VARCHAR(20) NOT NULL,
    balance DECIMAL(10,2) DEFAULT 0.00,
    referrer_code VARCHAR(6),
    asaas_customer_id VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### **Tabela: transactions**
```sql
CREATE TABLE transactions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_email VARCHAR(255) NOT NULL,
    type ENUM('deposit', 'withdraw', 'transfer_in', 'transfer_out') NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    description TEXT,
    status ENUM('pending', 'completed', 'failed') DEFAULT 'pending',
    related_user_email VARCHAR(255),
    asaas_payment_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_email) REFERENCES users(email)
);
```

### **Tabela: withdrawals**
```sql
CREATE TABLE withdrawals (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_email VARCHAR(255) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    bank_name VARCHAR(255) NOT NULL,
    account_number VARCHAR(50) NOT NULL,
    agency VARCHAR(20) NOT NULL,
    account_holder VARCHAR(255) NOT NULL,
    cpf VARCHAR(14) NOT NULL,
    pix_key VARCHAR(255),
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    admin_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP NULL,
    FOREIGN KEY (user_email) REFERENCES users(email)
);
```

## 🚀 Instalação e Configuração

### **Pré-requisitos**
- Node.js 18+
- MySQL 8.0+
- Expo CLI
- Conta Asaas (sandbox/produção)

### **1. Clone o repositório**
```bash
git clone https://github.com/seu-usuario/bankapp.git
cd bankapp
```

### **2. Configuração do Backend**
```bash
cd asaas-backend
npm install

# Configure as variáveis de ambiente
cp .env.example .env
```

**Arquivo .env:**
```env
# Banco de Dados
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=sua_senha
DB_NAME=bankapp

# Asaas Gateway
ASAAS_API_KEY=sua_chave_asaas
ASAAS_ENVIRONMENT=sandbox

# Servidor
PORT=3000
JWT_SECRET=seu_jwt_secret
```

### **3. Configuração do Banco de Dados**
```bash
# Execute os scripts de migração
node migrate-simple.js
```

### **4. Configuração do Frontend**
```bash
cd ..
npm install

# Configure as URLs da API
# Edite src/services/AsaasService.ts
```

### **5. Iniciar os Serviços**

**Backend:**
```bash
cd asaas-backend
npm start
# Servidor rodando em http://localhost:3000
```

**Frontend:**
```bash
expo start
# Escaneie o QR Code com o Expo Go
```

## 🔧 Configuração do Asaas

### **1. Criar Conta**
1. Acesse [asaas.com](https://asaas.com)
2. Crie uma conta sandbox
3. Obtenha sua API Key

### **2. Configurar Webhooks**
```
URL: https://seu-dominio.com/webhook/asaas
Eventos: PAYMENT_RECEIVED, PAYMENT_CONFIRMED
```

### **3. Configurar PIX**
- Ative o PIX na sua conta Asaas
- Configure as chaves PIX
- Teste com valores pequenos

## 🎯 Credenciais para teste

### Usuários pré-cadastrados:
- **Email:** user1@test.com | **Senha:** 123456
- **Email:** user2@test.com | **Senha:** 123456

### Para criar nova conta:
- **Código de convite:** BANK2025

## 📋 Estrutura do projeto

```
src/
├── context/          # Gerenciamento de estado global
├── navigation/       # Configuração de navegação
├── screens/          # Telas da aplicação
│   ├── auth/         # Autenticação (Login/Registro)
│   ├── dashboard/    # Tela principal
│   ├── transactions/ # Depósito, Saque, Transferência
│   └── history/      # Histórico de transações
├── theme/            # Cores e estilos globais
└── types/            # Tipos TypeScript
```

## 🎨 Design System

### Cores principais:
- **Primário:** #8B5CF6 (Roxo)
- **Secundário:** #DDD6FE (Roxo claro)
- **Background:** #FAFAFA (Branco)
- **Sucesso:** #10B981 (Verde)
- **Erro:** #EF4444 (Vermelho)

### Componentes:
- Cards com sombras suaves
- Botões com gradientes
- Inputs com bordas arredondadas
- Navegação por tabs
- Modais para transações

## 🔧 Tecnologias utilizadas

- **React Native** - Framework mobile
- **TypeScript** - Tipagem estática
- **Expo** - Plataforma de desenvolvimento
- **React Navigation** - Navegação entre telas
- **React Context** - Gerenciamento de estado
- **Expo Linear Gradient** - Gradientes
- **React Native Gesture Handler** - Gestos

## 💰 Funcionalidades bancárias

### Depósitos
- Valor mínimo: R$ 1,00
- Valor máximo: R$ 10.000,00
- Processamento instantâneo
- Formatação automática de moeda

### Saques
- Valor mínimo: R$ 1,00
- Valor máximo: R$ 5.000,00
- Verificação de saldo
- Valores rápidos pré-definidos

### Transferências
- Busca por email do destinatário
- Validação em tempo real
- Descrição opcional
- Lista de usuários disponíveis

### Histórico
- Filtros por tipo de transação
- Data e hora detalhadas
- Status das operações
- Design responsivo

## 🔒 Segurança

- Validação de campos obrigatórios
- Verificação de saldo antes de transações
- Códigos de convite para registro
- Estados de loading para feedback
- Tratamento de erros consistente

## 📱 Compatibilidade

- iOS 11+
- Android 6.0+
- Expo SDK 49+
- React Native 0.72+

