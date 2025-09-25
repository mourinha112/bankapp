<?php
require_once 'config.php';

// Verificar se está logado
requireLogin();

// Processar logout se solicitado
if (isset($_GET['logout'])) {
    logout();
}

// Obter estatísticas do banco
$stats = [];

try {
    // Usuários
    $stmt = $pdo->query("SELECT COUNT(*) as total_users FROM users");
    $stats['total_users'] = $stmt->fetch()['total_users'];
    
    $stmt = $pdo->query("SELECT COUNT(*) as new_users FROM users WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)");
    $stats['new_users_30d'] = $stmt->fetch()['new_users'];
    
    // Códigos de convite
    $stmt = $pdo->query("SELECT COUNT(*) as total_codes FROM invite_codes WHERE is_active = TRUE");
    $stats['active_invite_codes'] = $stmt->fetch()['total_codes'];
    
    $stmt = $pdo->query("SELECT COUNT(*) as used_codes FROM invite_codes WHERE used_at IS NOT NULL");
    $stats['used_invite_codes'] = $stmt->fetch()['used_codes'];
    
    // Transações
    $stmt = $pdo->query("SELECT COUNT(*) as total_transactions FROM transactions");
    $stats['total_transactions'] = $stmt->fetch()['total_transactions'];
    
    $stmt = $pdo->query("SELECT COALESCE(SUM(amount), 0) as total_volume FROM transactions WHERE status = 'completed'");
    $stats['total_volume'] = $stmt->fetch()['total_volume'];
    
    // Saldo total
    $stmt = $pdo->query("SELECT COALESCE(SUM(balance), 0) as total_balance FROM users");
    $stats['total_balance'] = $stmt->fetch()['total_balance'];
    
    // Últimos usuários
    $stmt = $pdo->query("SELECT u.*, ic.code as invite_code FROM users u LEFT JOIN invite_codes ic ON ic.used_by_user_id = u.id ORDER BY u.created_at DESC LIMIT 5");
    $recent_users = $stmt->fetchAll();
    
    // Últimas transações
    $stmt = $pdo->query("SELECT t.*, u.username FROM transactions t JOIN users u ON t.user_id = u.id ORDER BY t.created_at DESC LIMIT 5");
    $recent_transactions = $stmt->fetchAll();
    
} catch(PDOException $e) {
    $error = "Erro ao carregar estatísticas: " . $e->getMessage();
}
?>

<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">>
    <title>BankApp Admin - Dashboard</title>
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
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }

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
        }

        .header {
            background: linear-gradient(135deg, var(--primary), var(--primary-dark));
            color: white;
            padding: 2rem 0;
            margin-bottom: 2rem;
            border-radius: 16px;
            box-shadow: 0 8px 32px rgba(99, 102, 241, 0.3);
        }
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

        .cards-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 1.5rem;
            margin-bottom: 2rem;
        }

        .card {
            background: white;
            border-radius: 16px;
            padding: 1.5rem;
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
            border: 1px solid var(--border);
            transition: all 0.3s ease;
        }

        .card:hover {
            transform: translateY(-4px);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
        }

        .card-header {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 1rem;
        }

        .card-icon {
            width: 48px;
            height: 48px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
            color: white;
        }

        .card-icon.users { background: var(--primary); }
        .card-icon.codes { background: var(--success); }
        .card-icon.withdraws { background: var(--error); }
        .card-icon.deposits { background: var(--warning); }

        .card-title {
            font-size: 1.1rem;
            font-weight: 600;
            color: var(--text-primary);
        }

        .card-value {
            font-size: 2rem;
            font-weight: 700;
            color: var(--primary);
            margin-bottom: 0.5rem;
        }

        .card-subtitle {
            color: var(--text-secondary);
            font-size: 0.9rem;
        }

        .main-content {
            background: white;
            border-radius: 16px;
            padding: 2rem;
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
            border: 1px solid var(--border);
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
            box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
        }

        .btn-success {
            background: var(--success);
            color: white;
        }

        .btn-success:hover {
            background: #059669;
            transform: translateY(-2px);
        }

        .btn-danger {
            background: var(--error);
            color: white;
        }

        .btn-danger:hover {
            background: #dc2626;
            transform: translateY(-2px);
        }

        .table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 1rem;
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

        .badge-danger {
            background: rgba(239, 68, 68, 0.1);
            color: var(--error);
        }

        .badge-warning {
            background: rgba(245, 158, 11, 0.1);
            color: var(--warning);
        }

        .badge-primary {
            background: rgba(99, 102, 241, 0.1);
            color: var(--primary);
        }

        .alert {
            padding: 1rem;
            border-radius: 12px;
            margin-bottom: 1rem;
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .alert-success {
            background: rgba(16, 185, 129, 0.1);
            color: var(--success);
            border: 1px solid rgba(16, 185, 129, 0.2);
        }

        .alert-error {
            background: rgba(239, 68, 68, 0.1);
            color: var(--error);
            border: 1px solid rgba(239, 68, 68, 0.2);
        }

        .form-group {
            margin-bottom: 1.5rem;
        }

        .form-label {
            display: block;
            margin-bottom: 0.5rem;
            font-weight: 600;
            color: var(--text-primary);
        }

        .form-input {
            width: 100%;
            padding: 12px 16px;
            border: 2px solid var(--border);
            border-radius: 12px;
            font-size: 1rem;
            transition: all 0.3s ease;
        }

        .form-input:focus {
            outline: none;
            border-color: var(--primary);
            box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
        }

        .loading {
            display: inline-block;
            width: 20px;
            height: 20px;
            border: 2px solid transparent;
            border-top: 2px solid currentColor;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }

        .text-center { text-align: center; }
        .mb-2 { margin-bottom: 1rem; }
        .mt-2 { margin-top: 1rem; }

        @media (max-width: 768px) {
            .container {
                padding: 10px;
            }
            
            .header h1 {
                font-size: 2rem;
            }
            
            .nav {
                flex-direction: column;
            }
            
            .cards-grid {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <?php
    require_once 'config.php';

    // Obter estatísticas
    $stats = [];
    
    // Total de usuários
    $stmt = $pdo->query("SELECT COUNT(*) as total FROM users");
    $stats['users'] = $stmt->fetch()['total'];
    
    // Total de códigos de convite
    $stmt = $pdo->query("SELECT COUNT(*) as total FROM invite_codes");
    $stats['codes'] = $stmt->fetch()['total'];
    
    // Códigos usados
    $stmt = $pdo->query("SELECT COUNT(*) as total FROM invite_codes WHERE used_at IS NOT NULL");
    $stats['codes_used'] = $stmt->fetch()['total'];
    
    // Total de saques
    $stmt = $pdo->query("SELECT COUNT(*) as total FROM transactions WHERE type = 'withdraw'");
    $stats['withdraws'] = $stmt->fetch()['total'];
    
    // Total de depósitos
    $stmt = $pdo->query("SELECT COUNT(*) as total FROM transactions WHERE type = 'deposit'");
    $stats['deposits'] = $stmt->fetch()['total'];
    
    // Valor total em saques
    $stmt = $pdo->query("SELECT SUM(amount) as total FROM transactions WHERE type = 'withdraw'");
    $stats['withdraw_amount'] = $stmt->fetch()['total'] ?? 0;
    
    // Valor total em depósitos
    $stmt = $pdo->query("SELECT SUM(amount) as total FROM transactions WHERE type = 'deposit'");
    $stats['deposit_amount'] = $stmt->fetch()['total'] ?? 0;
    ?>

    <div class="container">
        <div class="user-header">
            <div class="user-info">
                <div class="user-avatar">
                    <?= strtoupper(substr($_SESSION['admin_name'], 0, 2)) ?>
                </div>
                <div class="user-details">
                    <h3><?= htmlspecialchars($_SESSION['admin_name']) ?></h3>
                    <p>Logado como: <strong><?= htmlspecialchars($_SESSION['admin_username']) ?></strong></p>
                </div>
            </div>
            <a href="?logout=1" class="logout-btn" onclick="return confirm('Deseja realmente sair?')">
                <i class="fas fa-sign-out-alt"></i>
                Sair
            </a>
        </div>

        <div class="header">
            <h1><i class="fas fa-crown"></i> BankApp Admin</h1>
            <p>Painel de Administração - Gerencie usuários, códigos de convite e transações</p>
        </div>

        <nav class="nav">
            <a href="index.php" class="nav-item active">
                <i class="fas fa-home"></i> Dashboard
            </a>
            <a href="invite-codes.php" class="nav-item">
                <i class="fas fa-ticket-alt"></i> Códigos de Convite
            </a>
            <a href="users.php" class="nav-item">
                <i class="fas fa-users"></i> Usuários
            </a>
            <a href="withdrawals.php" class="nav-item">
                <i class="fas fa-money-bill-wave"></i> Saques
            </a>
        </nav>

        <div class="cards-grid">
            <div class="card">
                <div class="card-header">
                    <div class="card-icon users">
                        <i class="fas fa-users"></i>
                    </div>
                    <div class="card-title">Usuários Cadastrados</div>
                </div>
                <div class="card-value"><?= number_format($stats['users']) ?></div>
                <div class="card-subtitle">Total de contas criadas</div>
            </div>

            <div class="card">
                <div class="card-header">
                    <div class="card-icon codes">
                        <i class="fas fa-ticket-alt"></i>
                    </div>
                    <div class="card-title">Códigos de Convite</div>
                </div>
                <div class="card-value"><?= number_format($stats['codes']) ?></div>
                <div class="card-subtitle"><?= number_format($stats['codes_used']) ?> utilizados</div>
            </div>

            <div class="card">
                <div class="card-header">
                    <div class="card-icon withdraws">
                        <i class="fas fa-arrow-down"></i>
                    </div>
                    <div class="card-title">Saques Realizados</div>
                </div>
                <div class="card-value"><?= number_format($stats['withdraws']) ?></div>
                <div class="card-subtitle"><?= formatMoney($stats['withdraw_amount']) ?> total</div>
            </div>

            <div class="card">
                <div class="card-header">
                    <div class="card-icon deposits">
                        <i class="fas fa-arrow-up"></i>
                    </div>
                    <div class="card-title">Depósitos Recebidos</div>
                </div>
                <div class="card-value"><?= number_format($stats['deposits']) ?></div>
                <div class="card-subtitle"><?= formatMoney($stats['deposit_amount']) ?> total</div>
            </div>
        </div>

        <div class="main-content">
            <h2 class="section-title">
                <i class="fas fa-chart-bar"></i>
                Resumo do Sistema
            </h2>
            
            <div class="alert alert-success">
                <i class="fas fa-check-circle"></i>
                <div>
                    <strong>Sistema Online</strong><br>
                    Todos os serviços estão funcionando normalmente. Última verificação: <?= date('d/m/Y H:i') ?>
                </div>
            </div>

            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem; margin-top: 2rem;">
                <div>
                    <h3 style="margin-bottom: 1rem; color: var(--text-primary);">
                        <i class="fas fa-users"></i> Últimos Usuários
                    </h3>
                    <?php
                    $stmt = $pdo->query("SELECT username, email, created_at FROM users ORDER BY created_at DESC LIMIT 5");
                    $recent_users = $stmt->fetchAll();
                    ?>
                    <?php if (!empty($recent_users)): ?>
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>Usuário</th>
                                    <th>Cadastro</th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php foreach ($recent_users as $user): ?>
                                <tr>
                                    <td>
                                        <strong><?= htmlspecialchars($user['username']) ?></strong><br>
                                        <small style="color: var(--text-secondary);"><?= htmlspecialchars($user['email']) ?></small>
                                    </td>
                                    <td><?= formatDate($user['created_at']) ?></td>
                                </tr>
                                <?php endforeach; ?>
                            </tbody>
                        </table>
                    <?php else: ?>
                        <p style="color: var(--text-secondary); text-align: center; padding: 2rem;">
                            Nenhum usuário cadastrado ainda.
                        </p>
                    <?php endif; ?>
                </div>

                <div>
                    <h3 style="margin-bottom: 1rem; color: var(--text-primary);">
                        <i class="fas fa-exchange-alt"></i> Últimas Transações
                    </h3>
                    <?php
                    $stmt = $pdo->query("SELECT t.*, u.username FROM transactions t LEFT JOIN users u ON t.user_id = u.id ORDER BY t.created_at DESC LIMIT 5");
                    $recent_transactions = $stmt->fetchAll();
                    ?>
                    <?php if (!empty($recent_transactions)): ?>
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>Usuário</th>
                                    <th>Tipo</th>
                                    <th>Valor</th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php foreach ($recent_transactions as $transaction): ?>
                                <tr>
                                    <td><?= htmlspecialchars($transaction['username'] ?? 'N/A') ?></td>
                                    <td>
                                        <?php
                                        $type_colors = [
                                            'deposit' => 'success',
                                            'withdraw' => 'danger',
                                            'transfer_in' => 'primary',
                                            'transfer_out' => 'warning'
                                        ];
                                        $type_names = [
                                            'deposit' => 'Depósito',
                                            'withdraw' => 'Saque',
                                            'transfer_in' => 'Recebeu',
                                            'transfer_out' => 'Enviou'
                                        ];
                                        $color = $type_colors[$transaction['type']] ?? 'primary';
                                        $name = $type_names[$transaction['type']] ?? $transaction['type'];
                                        ?>
                                        <span class="badge badge-<?= $color ?>"><?= $name ?></span>
                                    </td>
                                    <td><?= formatMoney($transaction['amount']) ?></td>
                                </tr>
                                <?php endforeach; ?>
                            </tbody>
                        </table>
                    <?php else: ?>
                        <p style="color: var(--text-secondary); text-align: center; padding: 2rem;">
                            Nenhuma transação registrada ainda.
                        </p>
                    <?php endif; ?>
                </div>
            </div>
        </div>
    </div>
</body>
</html>