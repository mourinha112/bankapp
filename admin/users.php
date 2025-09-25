<?php
require_once 'config.php';

// Verificar se está logado
requireLogin();

// Processar logout se solicitado
if (isset($_GET['logout'])) {
    logout();
}

// Obter usuários com paginação
$page = max(1, (int)($_GET['page'] ?? 1));
$limit = 20;
$offset = ($page - 1) * $limit;

$search = $_GET['search'] ?? '';
$whereClause = '';
$params = [];

if ($search) {
    $whereClause = 'WHERE username LIKE ? OR email LIKE ? OR fullName LIKE ?';
    $searchTerm = "%{$search}%";
    $params = [$searchTerm, $searchTerm, $searchTerm];
}

// Contar total de usuários
$countQuery = "SELECT COUNT(*) as total FROM users $whereClause";
$stmt = $pdo->prepare($countQuery);
$stmt->execute($params);
$totalUsers = $stmt->fetch()['total'];
$totalPages = ceil($totalUsers / $limit);

// Buscar usuários
$usersQuery = "
    SELECT u.*, 
           ic.code as invite_code_used,
           COUNT(t.id) as transaction_count,
           COALESCE(SUM(CASE WHEN t.type IN ('deposit', 'transfer_in') THEN t.amount ELSE 0 END), 0) as total_received,
           COALESCE(SUM(CASE WHEN t.type IN ('withdraw', 'transfer_out') THEN t.amount ELSE 0 END), 0) as total_sent
    FROM users u 
    LEFT JOIN invite_codes ic ON ic.used_by_user_id COLLATE utf8mb4_unicode_ci = u.id COLLATE utf8mb4_unicode_ci
    LEFT JOIN transactions t ON t.user_id COLLATE utf8mb4_unicode_ci = u.id COLLATE utf8mb4_unicode_ci
    $whereClause
    GROUP BY u.id, ic.code
    ORDER BY u.created_at DESC 
    LIMIT $limit OFFSET $offset
";
$stmt = $pdo->prepare($usersQuery);
$stmt->execute($params);
$users = $stmt->fetchAll();

// Estatísticas gerais
$statsQuery = "
    SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 END) as new_users_30d,
        SUM(balance) as total_balance,
        AVG(balance) as avg_balance
    FROM users
";
$stats = $pdo->query($statsQuery)->fetch();
?>

<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>BankApp Admin - Usuários</title>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        :root {
            --primary: #6366f1;
            --primary-dark: #4f46e5;
            --secondary: #f8fafc;
            --success: #10b981;
            --error: #ef4444;
            --warning: #f59e0b;
            --text-primary: #1f2937;
            --text-secondary: #6b7280;
            --border: #e5e7eb;
            --background: #f9fafb;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: var(--background);
            color: var(--text-primary);
            line-height: 1.6;
        }

        .container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 20px;
        }

        .header {
            background: linear-gradient(135deg, var(--primary), var(--primary-dark));
            color: white;
            padding: 2rem 0;
            margin-bottom: 2rem;
            border-radius: 16px;
            box-shadow: 0 8px 32px rgba(99, 102, 241, 0.3);
        }

        .header h1 {
            font-size: 2.5rem;
            font-weight: 700;
            margin-bottom: 0.5rem;
            text-align: center;
        }

        .header p {
            text-align: center;
            opacity: 0.9;
            font-size: 1.1rem;
        }

        .nav {
            display: flex;
            gap: 1rem;
            margin-bottom: 2rem;
            flex-wrap: wrap;
        }

        .nav-item {
            background: white;
            border: 2px solid var(--primary);
            color: var(--primary);
            padding: 12px 24px;
            border-radius: 12px;
            text-decoration: none;
            font-weight: 600;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .nav-item:hover, .nav-item.active {
            background: var(--primary);
            color: white;
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
        }

        .card {
            background: white;
            border-radius: 16px;
            padding: 1.5rem;
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
            border: 1px solid var(--border);
            margin-bottom: 2rem;
        }

        .section-title {
            font-size: 1.5rem;
            font-weight: 700;
            margin-bottom: 1.5rem;
            color: var(--text-primary);
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1rem;
            margin-bottom: 2rem;
        }

        .stat-card {
            background: white;
            border-radius: 12px;
            padding: 1.5rem;
            text-align: center;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            border: 1px solid var(--border);
        }

        .stat-value {
            font-size: 2rem;
            font-weight: 700;
            color: var(--primary);
            margin-bottom: 0.5rem;
        }

        .stat-label {
            color: var(--text-secondary);
            font-size: 0.9rem;
        }

        .search-bar {
            display: flex;
            gap: 1rem;
            margin-bottom: 2rem;
            align-items: center;
        }

        .search-input {
            flex: 1;
            padding: 12px 16px;
            border: 2px solid var(--border);
            border-radius: 12px;
            font-size: 1rem;
        }

        .search-input:focus {
            outline: none;
            border-color: var(--primary);
        }

        .btn {
            padding: 12px 24px;
            border: none;
            border-radius: 12px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            text-decoration: none;
            display: inline-flex;
            align-items: center;
            gap: 8px;
            font-size: 0.9rem;
        }

        .btn-primary {
            background: var(--primary);
            color: white;
        }

        .btn-primary:hover {
            background: var(--primary-dark);
            transform: translateY(-2px);
        }

        .table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 1rem;
            font-size: 0.9rem;
        }

        .table th,
        .table td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid var(--border);
        }

        .table th {
            background: var(--secondary);
            font-weight: 600;
            color: var(--text-primary);
            position: sticky;
            top: 0;
        }

        .table tr:hover {
            background: var(--secondary);
        }

        .badge {
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 0.8rem;
            font-weight: 600;
            text-transform: uppercase;
        }

        .badge-success {
            background: rgba(16, 185, 129, 0.1);
            color: var(--success);
        }

        .badge-warning {
            background: rgba(245, 158, 11, 0.1);
            color: var(--warning);
        }

        .pagination {
            display: flex;
            justify-content: center;
            gap: 0.5rem;
            margin-top: 2rem;
        }

        .pagination a {
            padding: 8px 16px;
            border: 2px solid var(--primary);
            color: var(--primary);
            text-decoration: none;
            border-radius: 8px;
            transition: all 0.3s ease;
        }

        .pagination a:hover,
        .pagination a.active {
            background: var(--primary);
            color: white;
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
            font-size: 0.9rem;
        }

        .money {
            font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
            font-weight: 700;
        }

        .positive { color: var(--success); }
        .negative { color: var(--error); }

        @media (max-width: 768px) {
            .container { padding: 10px; }
            .header h1 { font-size: 2rem; }
            .nav { flex-direction: column; }
            .stats-grid { grid-template-columns: 1fr; }
            .search-bar { flex-direction: column; }
            .table { font-size: 0.8rem; }
            .table th, .table td { padding: 8px; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1><i class="fas fa-users"></i> Usuários</h1>
            <p>Gerencie todos os usuários cadastrados na plataforma</p>
        </div>

        <nav class="nav">
            <a href="index.php" class="nav-item">
                <i class="fas fa-home"></i> Dashboard
            </a>
            <a href="invite-codes.php" class="nav-item">
                <i class="fas fa-ticket-alt"></i> Códigos de Convite
            </a>
            <a href="users.php" class="nav-item active">
                <i class="fas fa-users"></i> Usuários
            </a>
            <a href="withdrawals.php" class="nav-item">
                <i class="fas fa-money-bill-wave"></i> Saques
            </a>
        </nav>

        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-value"><?= number_format($stats['total_users']) ?></div>
                <div class="stat-label">Total de Usuários</div>
            </div>
            <div class="stat-card">
                <div class="stat-value"><?= number_format($stats['new_users_30d']) ?></div>
                <div class="stat-label">Novos (30 dias)</div>
            </div>
            <div class="stat-card">
                <div class="stat-value money">R$ <?= formatMoney($stats['total_balance']) ?></div>
                <div class="stat-label">Saldo Total</div>
            </div>
            <div class="stat-card">
                <div class="stat-value money">R$ <?= formatMoney($stats['avg_balance']) ?></div>
                <div class="stat-label">Saldo Médio</div>
            </div>
        </div>

        <div class="card">
            <div class="search-bar">
                <input 
                    type="text" 
                    class="search-input" 
                    placeholder="Buscar por nome, email ou usuário..." 
                    value="<?= htmlspecialchars($search) ?>"
                    onkeypress="if(event.key === 'Enter') window.location.href = '?search=' + encodeURIComponent(this.value)"
                >
                <button class="btn btn-primary" onclick="window.location.href = '?search=' + encodeURIComponent(document.querySelector('.search-input').value)">
                    <i class="fas fa-search"></i> Buscar
                </button>
                <?php if ($search): ?>
                    <a href="users.php" class="btn btn-primary">
                        <i class="fas fa-times"></i> Limpar
                    </a>
                <?php endif; ?>
            </div>

            <h2 class="section-title">
                <i class="fas fa-list"></i>
                Lista de Usuários (<?= number_format($totalUsers) ?> total)
            </h2>
            
            <?php if (!empty($users)): ?>
                <table class="table">
                    <thead>
                        <tr>
                            <th>Usuário</th>
                            <th>Email</th>
                            <th>Saldo</th>
                            <th>Transações</th>
                            <th>Total Recebido</th>
                            <th>Total Enviado</th>
                            <th>Código Usado</th>
                            <th>Cadastro</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($users as $user): ?>
                        <tr>
                            <td>
                                <div style="display: flex; align-items: center; gap: 12px;">
                                    <div class="user-avatar">
                                        <?= strtoupper(substr($user['fullName'] ?: $user['username'], 0, 2)) ?>
                                    </div>
                                    <div>
                                        <div style="font-weight: 600;"><?= htmlspecialchars($user['fullName'] ?: $user['username']) ?></div>
                                        <div style="font-size: 0.8rem; color: var(--text-secondary);">@<?= htmlspecialchars($user['username']) ?></div>
                                    </div>
                                </div>
                            </td>
                            <td><?= htmlspecialchars($user['email']) ?></td>
                            <td>
                                <span class="money <?= $user['balance'] >= 0 ? 'positive' : 'negative' ?>">
                                    R$ <?= formatMoney($user['balance']) ?>
                                </span>
                            </td>
                            <td>
                                <span class="badge badge-<?= $user['transaction_count'] > 0 ? 'success' : 'warning' ?>">
                                    <?= number_format($user['transaction_count']) ?>
                                </span>
                            </td>
                            <td>
                                <span class="money positive">R$ <?= formatMoney($user['total_received']) ?></span>
                            </td>
                            <td>
                                <span class="money negative">R$ <?= formatMoney($user['total_sent']) ?></span>
                            </td>
                            <td>
                                <?php if ($user['invite_code_used']): ?>
                                    <code style="background: var(--secondary); padding: 2px 6px; border-radius: 4px; font-size: 0.8rem;">
                                        <?= htmlspecialchars($user['invite_code_used']) ?>
                                    </code>
                                <?php else: ?>
                                    <span style="color: var(--text-secondary);">-</span>
                                <?php endif; ?>
                            </td>
                            <td><?= formatDate($user['created_at']) ?></td>
                        </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>

                <?php if ($totalPages > 1): ?>
                    <div class="pagination">
                        <?php if ($page > 1): ?>
                            <a href="?page=<?= $page - 1 ?>&search=<?= urlencode($search) ?>">
                                <i class="fas fa-chevron-left"></i> Anterior
                            </a>
                        <?php endif; ?>
                        
                        <?php 
                        $startPage = max(1, $page - 2);
                        $endPage = min($totalPages, $page + 2);
                        
                        for ($i = $startPage; $i <= $endPage; $i++): 
                        ?>
                            <a href="?page=<?= $i ?>&search=<?= urlencode($search) ?>" 
                               class="<?= $i === $page ? 'active' : '' ?>">
                                <?= $i ?>
                            </a>
                        <?php endfor; ?>
                        
                        <?php if ($page < $totalPages): ?>
                            <a href="?page=<?= $page + 1 ?>&search=<?= urlencode($search) ?>">
                                Próxima <i class="fas fa-chevron-right"></i>
                            </a>
                        <?php endif; ?>
                    </div>
                <?php endif; ?>
            <?php else: ?>
                <div style="text-align: center; padding: 3rem; color: var(--text-secondary);">
                    <i class="fas fa-users" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.3;"></i>
                    <h3>Nenhum usuário encontrado</h3>
                    <p><?= $search ? 'Tente uma busca diferente.' : 'Ainda não há usuários cadastrados.' ?></p>
                </div>
            <?php endif; ?>
        </div>
    </div>
</body>
</html>