<?php
require_once 'config.php';

// Verificar se está logado
requireLogin();

// Processar logout se solicitado
if (isset($_GET['logout'])) {
    logout();
}

// Obter saques com paginação
$page = max(1, (int)($_GET['page'] ?? 1));
$limit = 20;
$offset = ($page - 1) * $limit;

$status_filter = $_GET['status'] ?? '';
$whereClause = "WHERE t.type = 'withdraw'";
$params = [];

if ($status_filter) {
    $whereClause .= " AND t.status = ?";
    $params[] = $status_filter;
}

// Contar total de saques
$countQuery = "SELECT COUNT(*) as total FROM transactions t $whereClause";
$stmt = $pdo->prepare($countQuery);
$stmt->execute($params);
$totalWithdrawals = $stmt->fetch()['total'];
$totalPages = ceil($totalWithdrawals / $limit);

// Buscar saques com informações do usuário
$withdrawalsQuery = "
    SELECT t.*, u.username, u.fullName, u.email 
    FROM transactions t 
    JOIN users u ON t.user_id = u.id 
    $whereClause
    ORDER BY t.created_at DESC 
    LIMIT $limit OFFSET $offset
";
$stmt = $pdo->prepare($withdrawalsQuery);
$stmt->execute($params);
$withdrawals = $stmt->fetchAll();

// Estatísticas de saques
$statsQuery = "
    SELECT 
        COUNT(*) as total_withdrawals,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_withdrawals,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_withdrawals,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_withdrawals,
        COALESCE(SUM(amount), 0) as total_amount,
        COALESCE(SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END), 0) as completed_amount,
        COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR) THEN 1 END) as last_24h
    FROM transactions 
    WHERE type = 'withdraw'
";
$stats = $pdo->query($statsQuery)->fetch();
?>

<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>BankApp Admin - Saques</title>
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
            --info: #3b82f6;
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

        .filters {
            display: flex;
            gap: 1rem;
            margin-bottom: 2rem;
            align-items: center;
            flex-wrap: wrap;
        }

        .filter-select {
            padding: 12px 16px;
            border: 2px solid var(--border);
            border-radius: 12px;
            font-size: 1rem;
            background: white;
        }

        .filter-select:focus {
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

        .badge-error {
            background: rgba(239, 68, 68, 0.1);
            color: var(--error);
        }

        .badge-info {
            background: rgba(59, 130, 246, 0.1);
            color: var(--info);
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

        .user-info {
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .user-avatar {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            background: var(--primary);
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 0.8rem;
        }

        .money {
            font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
            font-weight: 700;
        }

        .asaas-id {
            font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
            font-size: 0.8rem;
            color: var(--text-secondary);
            background: var(--secondary);
            padding: 2px 6px;
            border-radius: 4px;
        }

        .description {
            max-width: 200px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        @media (max-width: 768px) {
            .container { padding: 10px; }
            .header h1 { font-size: 2rem; }
            .nav { flex-direction: column; }
            .stats-grid { grid-template-columns: 1fr; }
            .filters { flex-direction: column; align-items: stretch; }
            .table { font-size: 0.8rem; }
            .table th, .table td { padding: 8px; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1><i class="fas fa-money-bill-wave"></i> Saques</h1>
            <p>Monitore todas as operações de saque da plataforma</p>
        </div>

        <nav class="nav">
            <a href="index.php" class="nav-item">
                <i class="fas fa-home"></i> Dashboard
            </a>
            <a href="invite-codes.php" class="nav-item">
                <i class="fas fa-ticket-alt"></i> Códigos de Convite
            </a>
            <a href="users.php" class="nav-item">
                <i class="fas fa-users"></i> Usuários
            </a>
            <a href="withdrawals.php" class="nav-item active">
                <i class="fas fa-money-bill-wave"></i> Saques
            </a>
        </nav>

        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-value"><?= number_format($stats['total_withdrawals']) ?></div>
                <div class="stat-label">Total de Saques</div>
            </div>
            <div class="stat-card">
                <div class="stat-value"><?= number_format($stats['pending_withdrawals']) ?></div>
                <div class="stat-label">Pendentes</div>
            </div>
            <div class="stat-card">
                <div class="stat-value"><?= number_format($stats['completed_withdrawals']) ?></div>
                <div class="stat-label">Concluídos</div>
            </div>
            <div class="stat-card">
                <div class="stat-value"><?= number_format($stats['failed_withdrawals']) ?></div>
                <div class="stat-label">Falhou</div>
            </div>
            <div class="stat-card">
                <div class="stat-value money">R$ <?= formatMoney($stats['total_amount']) ?></div>
                <div class="stat-label">Valor Total</div>
            </div>
            <div class="stat-card">
                <div class="stat-value money">R$ <?= formatMoney($stats['completed_amount']) ?></div>
                <div class="stat-label">Valor Processado</div>
            </div>
            <div class="stat-card">
                <div class="stat-value"><?= number_format($stats['last_24h']) ?></div>
                <div class="stat-label">Últimas 24h</div>
            </div>
        </div>

        <div class="card">
            <div class="filters">
                <select class="filter-select" onchange="window.location.href = '?status=' + this.value + '&page=1'">
                    <option value="">Todos os Status</option>
                    <option value="pending" <?= $status_filter === 'pending' ? 'selected' : '' ?>>Pendente</option>
                    <option value="completed" <?= $status_filter === 'completed' ? 'selected' : '' ?>>Concluído</option>
                    <option value="failed" <?= $status_filter === 'failed' ? 'selected' : '' ?>>Falhou</option>
                </select>
                
                <?php if ($status_filter): ?>
                    <a href="withdrawals.php" class="btn btn-primary">
                        <i class="fas fa-times"></i> Limpar Filtros
                    </a>
                <?php endif; ?>
            </div>

            <h2 class="section-title">
                <i class="fas fa-list"></i>
                Histórico de Saques (<?= number_format($totalWithdrawals) ?> total)
            </h2>
            
            <?php if (!empty($withdrawals)): ?>
                <table class="table">
                    <thead>
                        <tr>
                            <th>Usuário</th>
                            <th>Valor</th>
                            <th>Status</th>
                            <th>ID Asaas</th>
                            <th>Descrição</th>
                            <th>Data</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($withdrawals as $withdrawal): ?>
                        <tr>
                            <td>
                                <div class="user-info">
                                    <div class="user-avatar">
                                        <?= strtoupper(substr($withdrawal['fullName'] ?: $withdrawal['username'], 0, 2)) ?>
                                    </div>
                                    <div>
                                        <div style="font-weight: 600; font-size: 0.9rem;">
                                            <?= htmlspecialchars($withdrawal['fullName'] ?: $withdrawal['username']) ?>
                                        </div>
                                        <div style="font-size: 0.8rem; color: var(--text-secondary);">
                                            <?= htmlspecialchars($withdrawal['email']) ?>
                                        </div>
                                    </div>
                                </div>
                            </td>
                            <td>
                                <span class="money" style="color: var(--error);">
                                    -R$ <?= formatMoney($withdrawal['amount']) ?>
                                </span>
                            </td>
                            <td>
                                <?php
                                $badgeClass = 'badge-info';
                                $statusIcon = 'clock';
                                
                                switch ($withdrawal['status']) {
                                    case 'completed':
                                        $badgeClass = 'badge-success';
                                        $statusIcon = 'check-circle';
                                        break;
                                    case 'failed':
                                        $badgeClass = 'badge-error';
                                        $statusIcon = 'times-circle';
                                        break;
                                    case 'pending':
                                        $badgeClass = 'badge-warning';
                                        $statusIcon = 'clock';
                                        break;
                                }
                                ?>
                                <span class="badge <?= $badgeClass ?>">
                                    <i class="fas fa-<?= $statusIcon ?>"></i>
                                    <?= ucfirst($withdrawal['status']) ?>
                                </span>
                            </td>
                            <td>
                                <?php if ($withdrawal['asaas_transfer_id']): ?>
                                    <span class="asaas-id"><?= htmlspecialchars($withdrawal['asaas_transfer_id']) ?></span>
                                <?php else: ?>
                                    <span style="color: var(--text-secondary);">-</span>
                                <?php endif; ?>
                            </td>
                            <td>
                                <div class="description" title="<?= htmlspecialchars($withdrawal['description']) ?>">
                                    <?= htmlspecialchars($withdrawal['description'] ?: 'Saque PIX') ?>
                                </div>
                            </td>
                            <td>
                                <div><?= formatDate($withdrawal['created_at']) ?></div>
                                <div style="font-size: 0.8rem; color: var(--text-secondary);">
                                    <?= date('H:i:s', strtotime($withdrawal['created_at'])) ?>
                                </div>
                            </td>
                        </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>

                <?php if ($totalPages > 1): ?>
                    <div class="pagination">
                        <?php if ($page > 1): ?>
                            <a href="?page=<?= $page - 1 ?>&status=<?= urlencode($status_filter) ?>">
                                <i class="fas fa-chevron-left"></i> Anterior
                            </a>
                        <?php endif; ?>
                        
                        <?php 
                        $startPage = max(1, $page - 2);
                        $endPage = min($totalPages, $page + 2);
                        
                        for ($i = $startPage; $i <= $endPage; $i++): 
                        ?>
                            <a href="?page=<?= $i ?>&status=<?= urlencode($status_filter) ?>" 
                               class="<?= $i === $page ? 'active' : '' ?>">
                                <?= $i ?>
                            </a>
                        <?php endfor; ?>
                        
                        <?php if ($page < $totalPages): ?>
                            <a href="?page=<?= $page + 1 ?>&status=<?= urlencode($status_filter) ?>">
                                Próxima <i class="fas fa-chevron-right"></i>
                            </a>
                        <?php endif; ?>
                    </div>
                <?php endif; ?>
            <?php else: ?>
                <div style="text-align: center; padding: 3rem; color: var(--text-secondary);">
                    <i class="fas fa-money-bill-wave" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.3;"></i>
                    <h3>Nenhum saque encontrado</h3>
                    <p><?= $status_filter ? 'Tente um filtro diferente.' : 'Ainda não há saques registrados.' ?></p>
                </div>
            <?php endif; ?>
        </div>
    </div>
</body>
</html>