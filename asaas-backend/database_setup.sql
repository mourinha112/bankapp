-- Script SQL para criar o banco de dados BankApp
-- Execute este script no seu phpMyAdmin

-- Criar o banco de dados
CREATE DATABASE IF NOT EXISTS `bankapp` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Usar o banco criado
USE `bankapp`;

-- Tabela de usuários
CREATE TABLE IF NOT EXISTS `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL UNIQUE,
  `cpf_cnpj` varchar(14) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `balance` decimal(10,2) DEFAULT 0.00,
  `asaas_customer_id` varchar(255) DEFAULT NULL,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_asaas_customer_id` (`asaas_customer_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de transações
CREATE TABLE IF NOT EXISTS `transactions` (
  `id` varchar(255) NOT NULL,
  `user_id` int(11) NOT NULL,
  `type` enum('deposit','withdraw','transfer') NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `status` varchar(50) NOT NULL,
  `asaas_payment_id` varchar(255) DEFAULT NULL,
  `asaas_transfer_id` varchar(255) DEFAULT NULL,
  `description` text DEFAULT NULL,
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

-- Inserir usuário de teste (opcional)
INSERT INTO `users` (`name`, `email`, `cpf_cnpj`, `phone`, `balance`) 
VALUES ('Usuário Teste', 'teste@example.com', '12345678901', '11999999999', 100.00)
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

-- Mostrar tabelas criadas
SHOW TABLES;

-- Verificar estrutura das tabelas
DESCRIBE users;
DESCRIBE transactions;

-- Verificar dados inseridos
SELECT * FROM users;
SELECT * FROM transactions;