<?php
session_start();

// Configuração do banco de dados
$host = 'localhost';
$dbname = 'bankapp';
$username = 'root';
$password = '';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
    // Definir charset para evitar problemas de collation
    $pdo->exec("SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci");
    $pdo->exec("SET CHARACTER SET utf8mb4");
    $pdo->exec("SET SESSION collation_connection = 'utf8mb4_unicode_ci'");
} catch(PDOException $e) {
    die("Connection failed: " . $e->getMessage());
}

// Função para gerar código de convite
function generateInviteCode($length = 8) {
    return strtoupper(substr(str_shuffle('ABCDEFGHJKMNPQRSTUVWXYZ23456789'), 0, $length));
}

// Função para formatar data
function formatDate($date) {
    return date('d/m/Y H:i', strtotime($date));
}

// Função para formatar moeda
function formatMoney($value) {
    return number_format($value, 2, ',', '.');
}

// Verificar se as tabelas necessárias existem e criar se não existirem
try {
    // Criar tabela de admins
    $pdo->exec("CREATE TABLE IF NOT EXISTS admin_users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL COLLATE utf8mb4_unicode_ci,
        password VARCHAR(255) NOT NULL COLLATE utf8mb4_unicode_ci,
        name VARCHAR(100) NOT NULL COLLATE utf8mb4_unicode_ci,
        email VARCHAR(100) UNIQUE NOT NULL COLLATE utf8mb4_unicode_ci,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
    
    // Criar usuário admin padrão se não existir
    $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM admin_users WHERE username = 'admin'");
    $stmt->execute();
    $result = $stmt->fetch();
    
    if ($result['count'] == 0) {
        $adminPassword = password_hash('admin123', PASSWORD_DEFAULT);
        $stmt = $pdo->prepare("INSERT INTO admin_users (username, password, name, email) VALUES (?, ?, ?, ?)");
        $stmt->execute(['admin', $adminPassword, 'Administrador', 'admin@bankapp.com']);
    }
    
    // Criar tabela invite_codes se não existir
    $pdo->exec("CREATE TABLE IF NOT EXISTS invite_codes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        code VARCHAR(20) UNIQUE NOT NULL COLLATE utf8mb4_unicode_ci,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        used_at TIMESTAMP NULL,
        used_by_user_id VARCHAR(50) NULL COLLATE utf8mb4_unicode_ci,
        created_by VARCHAR(100) DEFAULT 'Admin' COLLATE utf8mb4_unicode_ci,
        is_active BOOLEAN DEFAULT TRUE,
        max_uses INT DEFAULT 1,
        current_uses INT DEFAULT 0
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
    
    // Adicionar coluna invite_code na tabela users se não existir
    $pdo->exec("ALTER TABLE users ADD COLUMN IF NOT EXISTS invite_code VARCHAR(20) NULL COLLATE utf8mb4_unicode_ci");
    
} catch(PDOException $e) {
    // Ignorar erro se coluna já existir
}

// Função para verificar se está logado
function isLoggedIn() {
    return isset($_SESSION['admin_id']) && !empty($_SESSION['admin_id']);
}

// Função para verificar login e redirecionar se necessário
function requireLogin() {
    if (!isLoggedIn()) {
        header('Location: login.php');
        exit;
    }
}

// Função para fazer logout
function logout() {
    session_destroy();
    header('Location: login.php');
    exit;
}

// Função para fazer login
function login($username, $password) {
    global $pdo;
    
    $stmt = $pdo->prepare("SELECT * FROM admin_users WHERE username = ?");
    $stmt->execute([$username]);
    $admin = $stmt->fetch();
    
    if ($admin && password_verify($password, $admin['password'])) {
        $_SESSION['admin_id'] = $admin['id'];
        $_SESSION['admin_username'] = $admin['username'];
        $_SESSION['admin_name'] = $admin['name'];
        
        // Atualizar último login
        $stmt = $pdo->prepare("UPDATE admin_users SET last_login = NOW() WHERE id = ?");
        $stmt->execute([$admin['id']]);
        
        return true;
    }
    
    return false;
}

// Função para renderizar header do usuário
function renderUserHeader() {
    return '
    <div class="user-header">
        <div class="user-info">
            <div class="user-avatar">
                ' . strtoupper(substr($_SESSION['admin_name'], 0, 2)) . '
            </div>
            <div class="user-details">
                <h3>' . htmlspecialchars($_SESSION['admin_name']) . '</h3>
                <p>Logado como: <strong>' . htmlspecialchars($_SESSION['admin_username']) . '</strong></p>
            </div>
        </div>
        <a href="?logout=1" class="logout-btn" onclick="return confirm(\'Deseja realmente sair?\')">
            <i class="fas fa-sign-out-alt"></i>
            Sair
        </a>
    </div>';
}

// Função para renderizar CSS do header do usuário
function renderUserHeaderCSS() {
    return '
    .user-header {
        background: white;
        padding: 1rem 1.5rem;
        border-radius: 12px;
        margin-bottom: 1rem;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        display: flex;
        justify-content: space-between;
        align-items: center;
        border: 1px solid var(--border);
    }

    .user-info {
        display: flex;
        align-items: center;
        gap: 12px;
    }

    .user-avatar {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: var(--primary);
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
    }

    .user-details h3 {
        color: var(--text-primary);
        font-size: 1rem;
        margin-bottom: 2px;
    }

    .user-details p {
        color: var(--text-secondary);
        font-size: 0.8rem;
    }

    .logout-btn {
        background: var(--error);
        color: white;
        padding: 8px 16px;
        border: none;
        border-radius: 8px;
        text-decoration: none;
        font-weight: 600;
        font-size: 0.9rem;
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        gap: 6px;
    }

    .logout-btn:hover {
        background: #dc2626;
        transform: translateY(-2px);
    }';
}
?>