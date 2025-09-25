const mysql = require('mysql2/promise');

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'bankapp',
  port: process.env.DB_PORT || 3306
};

let connection;

async function connectDB() {
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Conectado ao MySQL');
    
    // Criar banco se não existir (usando query em vez de execute para comandos DDL)
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${dbConfig.database}`);
    await connection.query(`USE ${dbConfig.database}`);
    
    // Criar tabelas
    await createTables();
  } catch (error) {
    console.error('❌ Erro ao conectar MySQL:', error);
    process.exit(1);
  }
}

async function createTables() {
  try {
    // Tabela de usuários
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(50) PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        username VARCHAR(100) NOT NULL,
        password VARCHAR(255) NOT NULL,
        user_code VARCHAR(6) UNIQUE NOT NULL,
        fullName VARCHAR(255),
        cpf_cnpj VARCHAR(14),
        phone VARCHAR(20),
        balance DECIMAL(10,2) DEFAULT 0.00,
        asaas_customer_id VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_user_code (user_code)
      )
    `);
    
    // Tabela de transações
    await connection.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id VARCHAR(50) PRIMARY KEY,
        user_id VARCHAR(50),
        asaas_payment_id VARCHAR(100),
        asaas_transfer_id VARCHAR(100),
        type ENUM('deposit', 'withdraw', 'transfer_in', 'transfer_out') NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        status VARCHAR(50) NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    
    // Tabela de códigos de convite (sem chave estrangeira inicialmente)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS invite_codes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        code VARCHAR(20) UNIQUE NOT NULL,
        max_uses INT DEFAULT 1,
        current_uses INT DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        used_by_user_id VARCHAR(50) NULL,
        used_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_code (code)
      )
    `);
    
    console.log('✅ Tabelas criadas/verificadas');
    
    // Migração: Adicionar campo user_code se não existir
    try {
      await connection.query(`
        ALTER TABLE users 
        ADD COLUMN user_code VARCHAR(6) UNIQUE NULL,
        ADD INDEX idx_user_code (user_code)
      `);
      console.log('✅ Campo user_code adicionado');
    } catch (error) {
      if (!error.message.includes('Duplicate column name')) {
        console.log('ℹ️ Campo user_code já existe');
      }
    }
    
    // Adicionar chave estrangeira na tabela invite_codes se ainda não existir
    try {
      await connection.query(`
        ALTER TABLE invite_codes 
        ADD CONSTRAINT fk_invite_codes_user 
        FOREIGN KEY (used_by_user_id) REFERENCES users(id) ON DELETE SET NULL
      `);
      console.log('✅ Chave estrangeira invite_codes criada');
    } catch (error) {
      // Ignorar se a chave estrangeira já existir
      if (!error.message.includes('Duplicate key name')) {
        console.log('ℹ️ Chave estrangeira invite_codes já existe ou não foi necessária');
      }
    }
  } catch (error) {
    console.error('❌ Erro ao criar tabelas:', error);
  }
}

async function getUser(email) {
  const [rows] = await connection.execute('SELECT * FROM users WHERE email = ?', [email]);
  return rows[0];
}

async function createUser(userData) {
  const { id, email, username, password, fullName, cpf_cnpj, phone, asaas_customer_id, user_code } = userData;
  await connection.execute(
    'INSERT INTO users (id, email, username, password, fullName, cpf_cnpj, phone, asaas_customer_id, user_code) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [id, email, username, password, fullName, cpf_cnpj, phone, asaas_customer_id, user_code]
  );
  return await getUser(email);
}

async function updateUserBalance(userId, amount, operation = 'add') {
  if (operation === 'add') {
    await connection.execute(
      'UPDATE users SET balance = balance + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [amount, userId]
    );
  } else {
    await connection.execute(
      'UPDATE users SET balance = balance - ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [amount, userId]
    );
  }
}

async function createTransaction(transactionData) {
  const { id, user_id, asaas_payment_id, asaas_transfer_id, type, amount, status, description } = transactionData;
  console.log('💾 [Database] Criando transação:', transactionData);
  
  try {
    await connection.execute(
      'INSERT INTO transactions (id, user_id, asaas_payment_id, asaas_transfer_id, type, amount, status, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [id, user_id, asaas_payment_id || null, asaas_transfer_id || null, type, amount, status, description || null]
    );
    console.log('✅ [Database] Transação criada com sucesso:', id);
  } catch (error) {
    console.error('❌ [Database] Erro ao criar transação:', error);
    throw error;
  }
}

async function getTransactionsByUser(userId) {
  console.log('🔍 [Database] Buscando transações para user_id:', userId);
  
  const [rows] = await connection.execute(
    'SELECT * FROM transactions WHERE user_id = ? ORDER BY created_at DESC',
    [userId]
  );
  
  console.log('📊 [Database] Transações encontradas:', rows.length);
  return rows;
}

async function getTransactionByAsaasId(asaasPaymentId) {
  const [rows] = await connection.execute(
    'SELECT * FROM transactions WHERE asaas_payment_id = ?',
    [asaasPaymentId]
  );
  return rows[0];
}

async function getUserByAsaasCustomerId(asaasCustomerId) {
  const [rows] = await connection.execute(
    'SELECT * FROM users WHERE asaas_customer_id = ?',
    [asaasCustomerId]
  );
  return rows[0];
}

async function getUserByCpf(cpf) {
  const [rows] = await connection.execute(
    'SELECT * FROM users WHERE cpf_cnpj = ?',
    [cpf]
  );
  return rows[0];
}

async function validateInviteCode(code) {
  try {
    const [rows] = await connection.execute(
      'SELECT * FROM invite_codes WHERE code = ? AND is_active = TRUE',
      [code]
    );
    
    if (rows.length === 0) {
      return { valid: false, error: 'Código de convite inválido ou inativo' };
    }
    
    const inviteCode = rows[0];
    
    if (inviteCode.current_uses >= inviteCode.max_uses) {
      return { valid: false, error: 'Código de convite já foi totalmente utilizado' };
    }
    
    return { valid: true, inviteCode };
  } catch (error) {
    console.error('❌ Erro ao validar código de convite:', error);
    return { valid: false, error: 'Erro interno ao validar código' };
  }
}

async function useInviteCode(code, userId) {
  try {
    await connection.execute(
      'UPDATE invite_codes SET current_uses = current_uses + 1, used_by_user_id = ?, used_at = CURRENT_TIMESTAMP WHERE code = ?',
      [userId, code]
    );
    console.log('✅ Código de convite marcado como usado:', code);
  } catch (error) {
    console.error('❌ Erro ao marcar código como usado:', error);
    throw error;
  }
}

// Funções para códigos de usuário
async function getUserByCode(userCode) {
  try {
    const [rows] = await connection.execute(
      'SELECT * FROM users WHERE user_code = ?',
      [userCode]
    );
    return rows[0] || null;
  } catch (error) {
    console.error('❌ Erro ao buscar usuário por código:', error);
    throw error;
  }
}

async function validateUserCode(code) {
  try {
    const user = await getUserByCode(code);
    if (user) {
      return { valid: true, user };
    } else {
      return { valid: false, error: 'Código de usuário não encontrado' };
    }
  } catch (error) {
    console.error('❌ Erro ao validar código de usuário:', error);
    return { valid: false, error: 'Erro interno ao validar código' };
  }
}

module.exports = {
  connectDB,
  getUser,
  createUser,
  updateUserBalance,
  createTransaction,
  getTransactionsByUser,
  getTransactionByAsaasId,
  getUserByAsaasCustomerId,
  getUserByCpf,
  validateInviteCode,
  useInviteCode,
  getUserByCode,
  validateUserCode
};