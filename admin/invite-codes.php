<?php
require_once 'config.php';

// Verificar se está logado
requireLogin();

// Processar logout se solicitado
if (isset($_GET['logout'])) {
    logout();
}

$message = '';
$message_type = '';

// Processar criação de código de convite
if (isset($_POST['action']) && $_POST['action'] === 'create_code') {
    $max_uses = (int)($_POST['max_uses'] ?? 1);
    $code = generateInviteCode();
    
    try {
        $stmt = $pdo->prepare("INSERT INTO invite_codes (code, max_uses) VALUES (?, ?)");
        $stmt->execute([$code, $max_uses]);
        
        $message = "Código de convite '{$code}' criado com sucesso!";
        $message_type = 'success';
    } catch(PDOException $e) {
        $message = "Erro ao criar código: " . $e->getMessage();
        $message_type = 'error';
    }
}

// Processar desativação de código
if (isset($_POST['action']) && $_POST['action'] === 'deactivate_code') {
    $code_id = (int)$_POST['code_id'];
    
    try {
        $stmt = $pdo->prepare("UPDATE invite_codes SET is_active = FALSE WHERE id = ?");
        $stmt->execute([$code_id]);
        
        $message = "Código desativado com sucesso!";
        $message_type = 'success';
    } catch(PDOException $e) {
        $message = "Erro ao desativar código: " . $e->getMessage();
        $message_type = 'error';
    }
}

// Obter todos os códigos de convite
$stmt = $pdo->query("
    SELECT ic.*, u.username as used_by_username 
    FROM invite_codes ic 
    LEFT JOIN users u ON ic.used_by_user_id = u.id 
    ORDER BY ic.created_at DESC
");
$invite_codes = $stmt->fetchAll();

// Estatísticas
$stmt = $pdo->query("SELECT COUNT(*) as total FROM invite_codes WHERE is_active = TRUE");
$active_codes = $stmt->fetch()['total'];

$stmt = $pdo->query("SELECT COUNT(*) as total FROM invite_codes WHERE used_at IS NOT NULL");
$used_codes = $stmt->fetch()['total'];
?>

<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>BankApp Admin - Códigos de Convite</title>
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

        .form-group {
            margin-bottom: 1.5rem;
        }

        .form-label {
            display: block;
            margin-bottom: 0.5rem;
            font-weight: 600;
            color: var(--text-primary);
        }

        .form-input, .form-select {
            width: 100%;
            padding: 12px 16px;
            border: 2px solid var(--border);
            border-radius: 12px;
            font-size: 1rem;
            transition: all 0.3s ease;
        }

        .form-input:focus, .form-select:focus {
            outline: none;
            border-color: var(--primary);
            box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
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

        .btn-danger {
            background: var(--error);
            color: white;
            font-size: 0.8rem;
            padding: 8px 16px;
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

        .code-display {
            font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
            background: var(--secondary);
            padding: 8px 12px;
            border-radius: 8px;
            font-weight: 700;
            font-size: 1.1rem;
            color: var(--primary);
            border: 2px dashed var(--primary);
        }

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
            
            .stats-grid {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1><i class="fas fa-ticket-alt"></i> Códigos de Convite</h1>
            <p>Gerencie códigos de convite para novos usuários</p>
        </div>

        <nav class="nav">
            <a href="index.php" class="nav-item">
                <i class="fas fa-home"></i> Dashboard
            </a>
            <a href="invite-codes.php" class="nav-item active">
                <i class="fas fa-ticket-alt"></i> Códigos de Convite
            </a>
            <a href="users.php" class="nav-item">
                <i class="fas fa-users"></i> Usuários
            </a>
            <a href="withdrawals.php" class="nav-item">
                <i class="fas fa-money-bill-wave"></i> Saques
            </a>
        </nav>

        <?php if ($message): ?>
            <div class="alert alert-<?= $message_type ?>">
                <i class="fas fa-<?= $message_type === 'success' ? 'check-circle' : 'exclamation-triangle' ?>"></i>
                <div><?= $message ?></div>
            </div>
        <?php endif; ?>

        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-value"><?= number_format($active_codes) ?></div>
                <div class="stat-label">Códigos Ativos</div>
            </div>
            <div class="stat-card">
                <div class="stat-value"><?= number_format($used_codes) ?></div>
                <div class="stat-label">Códigos Utilizados</div>
            </div>
            <div class="stat-card">
                <div class="stat-value"><?= number_format(count($invite_codes)) ?></div>
                <div class="stat-label">Total de Códigos</div>
            </div>
        </div>

        <div class="card">
            <h2 class="section-title">
                <i class="fas fa-plus-circle"></i>
                Criar Novo Código de Convite
            </h2>
            
            <form method="POST">
                <input type="hidden" name="action" value="create_code">
                
                <div class="form-group">
                    <label class="form-label" for="max_uses">
                        <i class="fas fa-users"></i> Número máximo de usos
                    </label>
                    <select name="max_uses" id="max_uses" class="form-select">
                        <option value="1">1 uso (recomendado)</option>
                        <option value="5">5 usos</option>
                        <option value="10">10 usos</option>
                        <option value="50">50 usos</option>
                        <option value="100">100 usos</option>
                    </select>
                </div>
                
                <button type="submit" class="btn btn-primary">
                    <i class="fas fa-magic"></i>
                    Gerar Código de Convite
                </button>
            </form>
        </div>

        <div class="card">
            <h2 class="section-title">
                <i class="fas fa-list"></i>
                Códigos de Convite Criados
            </h2>
            
            <?php if (!empty($invite_codes)): ?>
                <table class="table">
                    <thead>
                        <tr>
                            <th>Código</th>
                            <th>Status</th>
                            <th>Usos</th>
                            <th>Criado em</th>
                            <th>Usado por</th>
                            <th>Usado em</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($invite_codes as $code): ?>
                        <tr>
                            <td>
                                <span class="code-display"><?= htmlspecialchars($code['code']) ?></span>
                            </td>
                            <td>
                                <?php if (!$code['is_active']): ?>
                                    <span class="badge badge-danger">Inativo</span>
                                <?php elseif ($code['current_uses'] >= $code['max_uses']): ?>
                                    <span class="badge badge-warning">Esgotado</span>
                                <?php else: ?>
                                    <span class="badge badge-success">Ativo</span>
                                <?php endif; ?>
                            </td>
                            <td>
                                <?= $code['current_uses'] ?>/<?= $code['max_uses'] ?>
                            </td>
                            <td><?= formatDate($code['created_at']) ?></td>
                            <td>
                                <?= $code['used_by_username'] ? htmlspecialchars($code['used_by_username']) : '-' ?>
                            </td>
                            <td>
                                <?= $code['used_at'] ? formatDate($code['used_at']) : '-' ?>
                            </td>
                            <td>
                                <?php if ($code['is_active'] && $code['current_uses'] < $code['max_uses']): ?>
                                    <form method="POST" style="display: inline;">
                                        <input type="hidden" name="action" value="deactivate_code">
                                        <input type="hidden" name="code_id" value="<?= $code['id'] ?>">
                                        <button type="submit" class="btn btn-danger" onclick="return confirm('Desativar este código?')">
                                            <i class="fas fa-ban"></i>
                                            Desativar
                                        </button>
                                    </form>
                                <?php else: ?>
                                    <span style="color: var(--text-secondary);">-</span>
                                <?php endif; ?>
                            </td>
                        </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            <?php else: ?>
                <div style="text-align: center; padding: 3rem; color: var(--text-secondary);">
                    <i class="fas fa-ticket-alt" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.3;"></i>
                    <h3>Nenhum código criado ainda</h3>
                    <p>Crie seu primeiro código de convite para permitir que novos usuários se cadastrem.</p>
                </div>
            <?php endif; ?>
        </div>
    </div>
</body>
</html>