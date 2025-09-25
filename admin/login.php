<?php
require_once 'config.php';

$error = '';

// Processar login
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $username = $_POST['username'] ?? '';
    $password = $_POST['password'] ?? '';
    
    if (empty($username) || empty($password)) {
        $error = 'Por favor, preencha todos os campos';
    } else {
        if (login($username, $password)) {
            header('Location: index.php');
            exit;
        } else {
            $error = 'Usuário ou senha incorretos';
        }
    }
}

// Se já está logado, redirecionar
if (isLoggedIn()) {
    header('Location: index.php');
    exit;
}
?>

<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>BankApp Admin - Login</title>
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
            --error: #ef4444;
            --text-primary: #1f2937;
            --text-secondary: #6b7280;
            --border: #e5e7eb;
            --background: #f9fafb;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, var(--primary), var(--primary-dark));
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }

        .login-container {
            background: white;
            border-radius: 24px;
            padding: 3rem;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
            width: 100%;
            max-width: 400px;
            position: relative;
            overflow: hidden;
        }

        .login-container::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: linear-gradient(90deg, var(--primary), var(--primary-dark));
        }

        .logo {
            text-align: center;
            margin-bottom: 2rem;
        }

        .logo i {
            font-size: 3rem;
            color: var(--primary);
            margin-bottom: 1rem;
        }

        .logo h1 {
            font-size: 1.8rem;
            color: var(--text-primary);
            font-weight: 700;
            margin-bottom: 0.5rem;
        }

        .logo p {
            color: var(--text-secondary);
            font-size: 0.9rem;
        }

        .form-group {
            margin-bottom: 1.5rem;
        }

        .form-label {
            display: block;
            margin-bottom: 0.5rem;
            font-weight: 600;
            color: var(--text-primary);
            font-size: 0.9rem;
        }

        .form-input {
            width: 100%;
            padding: 16px;
            border: 2px solid var(--border);
            border-radius: 12px;
            font-size: 1rem;
            transition: all 0.3s ease;
            background: var(--background);
        }

        .form-input:focus {
            outline: none;
            border-color: var(--primary);
            background: white;
            box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
        }

        .input-icon {
            position: relative;
        }

        .input-icon i {
            position: absolute;
            left: 16px;
            top: 50%;
            transform: translateY(-50%);
            color: var(--text-secondary);
            z-index: 2;
        }

        .input-icon .form-input {
            padding-left: 48px;
        }

        .btn-login {
            width: 100%;
            padding: 16px;
            background: linear-gradient(135deg, var(--primary), var(--primary-dark));
            color: white;
            border: none;
            border-radius: 12px;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            margin-top: 1rem;
            position: relative;
            overflow: hidden;
        }

        .btn-login:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(99, 102, 241, 0.3);
        }

        .btn-login:active {
            transform: translateY(0);
        }

        .error-message {
            background: rgba(239, 68, 68, 0.1);
            color: var(--error);
            padding: 12px 16px;
            border-radius: 12px;
            margin-bottom: 1.5rem;
            border: 1px solid rgba(239, 68, 68, 0.2);
            font-size: 0.9rem;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .credentials-info {
            background: var(--background);
            padding: 1rem;
            border-radius: 12px;
            margin-top: 2rem;
            border: 1px dashed var(--border);
        }

        .credentials-info h3 {
            color: var(--text-primary);
            font-size: 0.9rem;
            margin-bottom: 0.5rem;
            font-weight: 600;
        }

        .credentials-info p {
            color: var(--text-secondary);
            font-size: 0.8rem;
            margin-bottom: 0.3rem;
        }

        .credentials-info code {
            background: white;
            padding: 2px 6px;
            border-radius: 4px;
            font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
            color: var(--primary);
            font-weight: 600;
        }

        @media (max-width: 480px) {
            .login-container {
                padding: 2rem;
                margin: 10px;
            }
            
            .logo i {
                font-size: 2.5rem;
            }
            
            .logo h1 {
                font-size: 1.5rem;
            }
        }

        .pulse {
            animation: pulse 2s infinite;
        }

        @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.7; }
            100% { opacity: 1; }
        }
    </style>
</head>
<body>
    <div class="login-container">
        <div class="logo">
            <i class="fas fa-shield-alt pulse"></i>
            <h1>BankApp Admin</h1>
            <p>Painel Administrativo</p>
        </div>

        <?php if ($error): ?>
            <div class="error-message">
                <i class="fas fa-exclamation-triangle"></i>
                <span><?= htmlspecialchars($error) ?></span>
            </div>
        <?php endif; ?>

        <form method="POST">
            <div class="form-group">
                <label class="form-label">Usuário</label>
                <div class="input-icon">
                    <i class="fas fa-user"></i>
                    <input 
                        type="text" 
                        name="username" 
                        class="form-input" 
                        placeholder="Digite seu usuário"
                        value="<?= htmlspecialchars($_POST['username'] ?? '') ?>"
                        required
                        autocomplete="username"
                    >
                </div>
            </div>

            <div class="form-group">
                <label class="form-label">Senha</label>
                <div class="input-icon">
                    <i class="fas fa-lock"></i>
                    <input 
                        type="password" 
                        name="password" 
                        class="form-input" 
                        placeholder="Digite sua senha"
                        required
                        autocomplete="current-password"
                    >
                </div>
            </div>

            <button type="submit" class="btn-login">
                <i class="fas fa-sign-in-alt"></i> Entrar no Admin
            </button>
        </form>

        <div class="credentials-info">
            <h3><i class="fas fa-info-circle"></i> Credenciais Padrão</h3>
            <p><strong>Usuário:</strong> <code>admin</code></p>
            <p><strong>Senha:</strong> <code>admin123</code></p>
            <p style="margin-top: 0.5rem; font-style: italic;">
                ⚠️ Altere essas credenciais em produção
            </p>
        </div>
    </div>
</body>
</html>