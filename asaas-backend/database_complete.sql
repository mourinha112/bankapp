-- Script SQL COMPLETO para criar o banco de dados BankApp
-- Execute este script no seu phpMyAdmin

-- Criar o banco de dados
CREATE DATABASE IF NOT EXISTS `bankapp` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Usar o banco criado
USE `bankapp`;

-- Remover tabelas existentes se houver (para recriar)
DROP TABLE IF EXISTS `transactions`;
DROP TABLE IF EXISTS `users`;

-- Tabela de usuários COMPLETA
CREATE TABLE `users` (
  `id` varchar(50) NOT NULL,
  `email` varchar(255) NOT NULL UNIQUE,
  `username` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `fullName` varchar(255) DEFAULT NULL,
  `cpf_cnpj` varchar(14) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `balance` decimal(10,2) DEFAULT 0.00,
  `asaas_customer_id` varchar(100) DEFAULT NULL,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_email` (`email`),
  INDEX `idx_asaas_customer_id` (`asaas_customer_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de transações COMPLETA
CREATE TABLE `transactions` (
  `id` varchar(255) NOT NULL,
  `user_id` varchar(50) NOT NULL,
  `type` enum('deposit','withdraw','transfer_in','transfer_out') NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `status` varchar(50) NOT NULL,
  `asaas_payment_id` varchar(255) DEFAULT NULL,
  `asaas_transfer_id` varchar(255) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `to_user_email` varchar(255) DEFAULT NULL,
  `from_user_email` varchar(255) DEFAULT NULL,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_asaas_payment_id` (`asaas_payment_id`),
  INDEX `idx_asaas_transfer_id` (`asaas_transfer_id`),
  INDEX `idx_type` (`type`),
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Inserir usuários de teste com senhas
INSERT INTO `users` (`id`, `email`, `username`, `password`, `fullName`, `cpf_cnpj`, `phone`, `balance`) VALUES
('user1', 'user1@test.com', 'user1', '$2b$10$hashedpassword1', 'Usuário Teste 1', '12345678901', '11999999999', 1000.00),
('user2', 'user2@test.com', 'user2', '$2b$10$hashedpassword2', 'Usuário Teste 2', '98765432109', '11888888888', 2000.00),
('teste', 'teste@example.com', 'teste', 'senha123', 'Usuário Teste', '11111111111', '11777777777', 500.00);

-- Inserir algumas transações de exemplo
INSERT INTO `transactions` (`id`, `user_id`, `type`, `amount`, `status`, `description`) VALUES
('tx1', 'user1', 'deposit', 100.00, 'RECEIVED', 'Depósito inicial'),
('tx2', 'user2', 'deposit', 200.00, 'RECEIVED', 'Depósito inicial'),
('tx3', 'user1', 'transfer_out', 50.00, 'CONFIRMED', 'Transferência para user2'),
('tx4', 'user2', 'transfer_in', 50.00, 'CONFIRMED', 'Transferência de user1');

-- Mostrar tabelas criadas
SHOW TABLES;

-- Verificar estrutura das tabelas
DESCRIBE users;
DESCRIBE transactions;

-- Verificar dados inseridos
SELECT id, email, username, fullName, balance, created_at FROM users;
SELECT id, user_id, type, amount, status, description, created_at FROM transactions;

-- Verificar saldos dos usuários
SELECT 
    u.username,
    u.email,
    u.balance as saldo_atual,
    COUNT(t.id) as total_transacoes
FROM users u 
LEFT JOIN transactions t ON u.id = t.user_id 
GROUP BY u.id, u.username, u.email, u.balance;