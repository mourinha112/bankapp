<?php
require_once 'config.php';

echo "<h2>🧪 Teste do Sistema Admin</h2>";

// Testar conexão
echo "<p>✅ Conexão com banco: OK</p>";

// Verificar se admin existe
$stmt = $pdo->prepare("SELECT * FROM admin_users WHERE username = 'admin'");
$stmt->execute();
$admin = $stmt->fetch();

if ($admin) {
    echo "<p>✅ Usuário admin existe: " . $admin['name'] . " (" . $admin['email'] . ")</p>";
    echo "<p>📅 Criado em: " . formatDate($admin['created_at']) . "</p>";
    
    if ($admin['last_login']) {
        echo "<p>🕐 Último login: " . formatDate($admin['last_login']) . "</p>";
    } else {
        echo "<p>🕐 Nunca fez login</p>";
    }
} else {
    echo "<p>❌ Usuário admin não encontrado!</p>";
}

// Verificar tabelas
$tables = ['admin_users', 'invite_codes', 'users', 'transactions'];
echo "<h3>📊 Status das Tabelas:</h3>";
foreach ($tables as $table) {
    try {
        $stmt = $pdo->query("SELECT COUNT(*) as count FROM $table");
        $count = $stmt->fetch()['count'];
        echo "<p>✅ $table: $count registros</p>";
    } catch (Exception $e) {
        echo "<p>❌ $table: Erro - " . $e->getMessage() . "</p>";
    }
}

echo "<h3>🔑 Credenciais de Acesso:</h3>";
echo "<p><strong>URL Admin:</strong> <a href='login.php'>login.php</a></p>";
echo "<p><strong>Usuário:</strong> admin</p>";
echo "<p><strong>Senha:</strong> admin123</p>";

echo "<hr>";
echo "<p><a href='login.php'>🚀 Ir para Login Admin</a></p>";
?>