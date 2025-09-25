<?php
// Script de teste para saques Asaas
require_once 'config.php';

// Configurações do Asaas
$asaas_token = '$aact_prod_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6OjI4M2U4MzkyLTdhYzEtNGNkOS04YzU4LTczYmQxMzZjOTk5Mjo6JGFhY2hfNzIzNzg2YzItOTJkMi00OTI2LTlmZDgtYzIxNzkwMzk0MmY3';
$asaas_base_url = 'https://www.asaas.com/api/v3'; // Produção

function testAsaasAPI($endpoint, $method = 'GET', $data = null) {
    global $asaas_token, $asaas_base_url;
    
    $url = $asaas_base_url . $endpoint;
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'access_token: ' . $asaas_token
    ]);
    
    if ($method === 'POST') {
        curl_setopt($ch, CURLOPT_POST, true);
        if ($data) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        }
    }
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    return [
        'status_code' => $httpCode,
        'body' => json_decode($response, true),
        'raw' => $response
    ];
}

echo "<h1>🧪 Teste da API Asaas - Saques</h1>";

// Teste 1: Verificar se a API está funcionando
echo "<h2>1. 🔑 Teste de Autenticação</h2>";
$auth_test = testAsaasAPI('/myAccount');
if ($auth_test['status_code'] === 200) {
    echo "<p>✅ <strong>Autenticação OK!</strong></p>";
    echo "<p>Conta: " . $auth_test['body']['name'] . "</p>";
    echo "<p>Email: " . $auth_test['body']['email'] . "</p>";
} else {
    echo "<p>❌ <strong>Erro de autenticação:</strong></p>";
    echo "<pre>" . print_r($auth_test, true) . "</pre>";
}

// Teste 2: Verificar saldo da conta
echo "<h2>2. 💰 Saldo da Conta</h2>";
$balance_test = testAsaasAPI('/finance/balance');
if ($balance_test['status_code'] === 200) {
    echo "<p>✅ <strong>Saldo atual:</strong></p>";
    echo "<p>Saldo total: R$ " . number_format($balance_test['body']['totalBalance'], 2, ',', '.') . "</p>";
    echo "<p>Saldo disponível: R$ " . number_format($balance_test['body']['balance'], 2, ',', '.') . "</p>";
} else {
    echo "<p>❌ <strong>Erro ao consultar saldo:</strong></p>";
    echo "<pre>" . print_r($balance_test, true) . "</pre>";
}

// Teste 3: Listar últimas transferências
echo "<h2>3. 📊 Últimas Transferências</h2>";
$transfers_test = testAsaasAPI('/transfers?limit=5');
if ($transfers_test['status_code'] === 200) {
    echo "<p>✅ <strong>Últimas transferências:</strong></p>";
    if (!empty($transfers_test['body']['data'])) {
        echo "<table border='1' style='border-collapse: collapse; width: 100%;'>";
        echo "<tr><th>Data</th><th>Valor</th><th>Status</th><th>Descrição</th></tr>";
        foreach ($transfers_test['body']['data'] as $transfer) {
            echo "<tr>";
            echo "<td>" . date('d/m/Y H:i', strtotime($transfer['dateCreated'])) . "</td>";
            echo "<td>R$ " . number_format($transfer['value'], 2, ',', '.') . "</td>";
            echo "<td>" . $transfer['status'] . "</td>";
            echo "<td>" . ($transfer['description'] ?? 'Transferência PIX') . "</td>";
            echo "</tr>";
        }
        echo "</table>";
    } else {
        echo "<p>Nenhuma transferência encontrada.</p>";
    }
} else {
    echo "<p>❌ <strong>Erro ao listar transferências:</strong></p>";
    echo "<pre>" . print_r($transfers_test, true) . "</pre>";
}

// Teste 4: Simular criação de transferência (SEM EXECUTAR)
echo "<h2>4. 🧪 Teste de Saque (Simulação)</h2>";
echo "<p><strong>⚠️ Este é apenas um teste de validação, NÃO será executado!</strong></p>";

$test_transfer_data = [
    'value' => 1.00, // R$ 1,00 para teste
    'pixAddressKey' => 'teste@email.com', // Substitua por uma chave PIX real
    'pixAddressKeyType' => 'EMAIL',
    'description' => 'Teste de saque via API - NÃO EXECUTAR'
];

echo "<p><strong>Dados que seriam enviados:</strong></p>";
echo "<pre>" . json_encode($test_transfer_data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "</pre>";

echo "<p>✅ Para executar um saque real, envie esses dados para:</p>";
echo "<p><code>POST {$asaas_base_url}/transfers</code></p>";

// Teste 5: Verificar se pode fazer transferências PIX
echo "<h2>5. 🏦 Verificar Habilitação PIX</h2>";
$pix_test = testAsaasAPI('/pix/settings');
if ($pix_test['status_code'] === 200) {
    echo "<p>✅ <strong>PIX habilitado!</strong></p>";
    echo "<p>Pode fazer transferências PIX: " . ($pix_test['body']['canCreateTransfer'] ? 'Sim' : 'Não') . "</p>";
} else {
    echo "<p>⚠️ <strong>PIX pode não estar habilitado ou erro na consulta:</strong></p>";
    echo "<pre>" . print_r($pix_test, true) . "</pre>";
}

echo "<hr>";
echo "<h2>📝 Resumo dos Testes</h2>";
echo "<p>✅ Se todos os testes acima passaram, sua API está funcionando corretamente!</p>";
echo "<p>🔧 Para testar um saque real no app, certifique-se de que:</p>";
echo "<ul>";
echo "<li>O backend está rodando com o token correto</li>";
echo "<li>Sua conta Asaas tem saldo suficiente</li>";
echo "<li>A chave PIX de destino é válida</li>";
echo "</ul>";

echo "<p><a href='index.php'>← Voltar ao Dashboard</a></p>";
?>

<style>
body { font-family: Arial, sans-serif; max-width: 1000px; margin: 20px auto; padding: 20px; }
h1, h2 { color: #6366f1; }
table { margin: 10px 0; }
th, td { padding: 8px 12px; text-align: left; border: 1px solid #ddd; }
th { background-color: #f8f9fa; }
pre { background: #f8f9fa; padding: 15px; border-radius: 8px; overflow-x: auto; }
code { background: #f1f5f9; padding: 2px 6px; border-radius: 4px; }
a { color: #6366f1; text-decoration: none; font-weight: bold; }
a:hover { text-decoration: underline; }
</style>