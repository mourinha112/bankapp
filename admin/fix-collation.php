<?php
require_once 'config.php';

echo "<h2>🔧 Script de Correção de Collation</h2>";

try {
    // Verificar collations atuais
    echo "<h3>📊 Verificando collations atuais:</h3>";
    
    $tables = ['users', 'transactions', 'invite_codes', 'admin_users'];
    
    foreach ($tables as $table) {
        try {
            $stmt = $pdo->query("SHOW CREATE TABLE $table");
            $result = $stmt->fetch();
            if ($result) {
                echo "<p><strong>$table:</strong> ✅ Existe</p>";
                
                // Verificar charset da tabela
                $stmt = $pdo->query("SELECT TABLE_COLLATION FROM information_schema.TABLES WHERE TABLE_SCHEMA = '$dbname' AND TABLE_NAME = '$table'");
                $collation = $stmt->fetch();
                if ($collation) {
                    echo "<p>├─ Collation: <code>{$collation['TABLE_COLLATION']}</code></p>";
                }
            }
        } catch (Exception $e) {
            echo "<p><strong>$table:</strong> ❌ Não existe ou erro: {$e->getMessage()}</p>";
        }
    }
    
    echo "<hr>";
    echo "<h3>🛠️ Corrigindo collations:</h3>";
    
    // Converter todas as tabelas para utf8mb4_unicode_ci
    $tables_to_fix = [
        'users' => [
            'id' => 'VARCHAR(50)',
            'email' => 'VARCHAR(255)',
            'username' => 'VARCHAR(100)',
            'password' => 'VARCHAR(255)',
            'fullName' => 'VARCHAR(255)',
            'cpf_cnpj' => 'VARCHAR(14)',
            'phone' => 'VARCHAR(20)',
            'asaas_customer_id' => 'VARCHAR(100)'
        ],
        'transactions' => [
            'id' => 'VARCHAR(50)',
            'user_id' => 'VARCHAR(50)',
            'asaas_payment_id' => 'VARCHAR(100)',
            'asaas_transfer_id' => 'VARCHAR(100)',
            'type' => 'ENUM("deposit", "withdraw", "transfer_in", "transfer_out")',
            'status' => 'VARCHAR(50)',
            'description' => 'TEXT'
        ],
        'invite_codes' => [
            'code' => 'VARCHAR(20)',
            'used_by_user_id' => 'VARCHAR(50)',
            'created_by' => 'VARCHAR(100)'
        ],
        'admin_users' => [
            'username' => 'VARCHAR(50)',
            'password' => 'VARCHAR(255)',
            'name' => 'VARCHAR(100)',
            'email' => 'VARCHAR(100)'
        ]
    ];
    
    foreach ($tables_to_fix as $table => $columns) {
        try {
            // Converter tabela
            $pdo->exec("ALTER TABLE $table CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
            echo "<p>✅ Tabela <strong>$table</strong> convertida para utf8mb4_unicode_ci</p>";
            
            // Converter colunas específicas
            foreach ($columns as $column => $type) {
                try {
                    $pdo->exec("ALTER TABLE $table MODIFY COLUMN $column $type CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
                    echo "<p>├─ Coluna <code>$column</code> convertida</p>";
                } catch (Exception $e) {
                    echo "<p>├─ ⚠️ Erro na coluna <code>$column</code>: {$e->getMessage()}</p>";
                }
            }
            
        } catch (Exception $e) {
            echo "<p>❌ Erro ao converter tabela <strong>$table</strong>: {$e->getMessage()}</p>";
        }
    }
    
    echo "<hr>";
    echo "<h3>🔍 Verificação final:</h3>";
    
    // Verificar se o problema foi resolvido
    foreach ($tables as $table) {
        try {
            $stmt = $pdo->query("SELECT TABLE_COLLATION FROM information_schema.TABLES WHERE TABLE_SCHEMA = '$dbname' AND TABLE_NAME = '$table'");
            $collation = $stmt->fetch();
            if ($collation) {
                $status = $collation['TABLE_COLLATION'] === 'utf8mb4_unicode_ci' ? '✅' : '⚠️';
                echo "<p>$status <strong>$table:</strong> {$collation['TABLE_COLLATION']}</p>";
            }
        } catch (Exception $e) {
            echo "<p>❌ <strong>$table:</strong> Erro: {$e->getMessage()}</p>";
        }
    }
    
    echo "<hr>";
    echo "<h3>🧪 Teste de JOIN:</h3>";
    
    // Testar a consulta problemática
    try {
        $stmt = $pdo->query("
            SELECT ic.*, u.username as used_by_username 
            FROM invite_codes ic 
            LEFT JOIN users u ON ic.used_by_user_id = u.id 
            ORDER BY ic.created_at DESC
            LIMIT 1
        ");
        $result = $stmt->fetchAll();
        echo "<p>✅ Consulta JOIN funcionando corretamente!</p>";
        echo "<p>Resultado: " . count($result) . " registros encontrados</p>";
        
    } catch (Exception $e) {
        echo "<p>❌ Consulta JOIN ainda com erro: {$e->getMessage()}</p>";
        
        // Tentar consulta alternativa
        echo "<p>🔄 Tentando consulta alternativa...</p>";
        try {
            $stmt = $pdo->query("
                SELECT ic.*, u.username as used_by_username 
                FROM invite_codes ic 
                LEFT JOIN users u ON CAST(ic.used_by_user_id AS CHAR) = CAST(u.id AS CHAR)
                ORDER BY ic.created_at DESC
                LIMIT 1
            ");
            $result = $stmt->fetchAll();
            echo "<p>✅ Consulta alternativa funcionando!</p>";
        } catch (Exception $e2) {
            echo "<p>❌ Consulta alternativa também falhou: {$e2->getMessage()}</p>";
        }
    }
    
    echo "<hr>";
    echo "<p><strong>🎯 Correção concluída!</strong></p>";
    echo "<p><a href='index.php'>← Voltar ao Dashboard</a></p>";
    
} catch (Exception $e) {
    echo "<p>❌ Erro geral: {$e->getMessage()}</p>";
}
?>

<style>
body { font-family: Arial, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; }
h2, h3 { color: #6366f1; }
p { margin: 8px 0; }
code { background: #f1f5f9; padding: 2px 6px; border-radius: 4px; }
hr { margin: 30px 0; border: 1px solid #e5e7eb; }
a { color: #6366f1; text-decoration: none; font-weight: bold; }
a:hover { text-decoration: underline; }
</style>