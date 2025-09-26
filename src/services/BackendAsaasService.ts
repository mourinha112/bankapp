// Serviço para consumir as rotas proxy do backend em vez de chamar a Asaas direto
// Para Expo: usar IP da máquina em vez de localhost

// Para descobrir seu IP: ipconfig no CMD e pegar IPv4 da sua rede
// Ou use o IP que aparece no QR code do Expo (ex: exp://192.168.1.100:8081)
// Default rápido para desenvolvimento local (web & emulator). Se você estiver testando
// em um dispositivo físico, substitua por http://<SEU_IP_LOCAL>:3000 ou use ngrok e aponte para a URL pública.
const BASE_BACKEND_URL = 'http://localhost:3000'; // Ajuste para seu IP/local/ngrok quando necessário

export interface CreateCustomerPayload {
  name: string;
  email: string;
  cpfCnpj: string;
  phone?: string;
}

export interface DepositPixPayload {
  customerId: string;
  value: number;
  description?: string;
}

export interface WithdrawPixPayload {
  value: number;
  pixKey: string;
  description?: string;
}

export interface RegisterUserPayload {
  name: string;
  email: string;
  cpfCnpj: string;
  phone: string;
  username: string;
  password: string;
  referralCode: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

class BackendAsaasService {
  // Helper: parse response robustly (handles non-JSON responses)
  private async safeParseResponse(res: any) {
    const text = await res.text();
    try {
      const data = JSON.parse(text);
      return { ok: res.ok, status: res.status, data };
    } catch (err) {
      // Not JSON (HTML or plain text). Return text so caller can log/use it.
      return { ok: res.ok, status: res.status, data: null, text };
    }
  }
  async registerUser(payload: RegisterUserPayload) {
    try {
      console.log('[BackendAsaasService] Registrando usuário:', payload.email);
      const res = await fetch(`${BASE_BACKEND_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const parsed = await this.safeParseResponse(res);
      if (!parsed.ok) {
        const message = parsed.data?.error || parsed.text || `Erro ${parsed.status}`;
        console.log('[BackendAsaasService] Erro no registro:', message);
        return { error: message };
      }
      console.log('[BackendAsaasService] Usuário registrado:', parsed.data);
      return parsed.data;
    } catch (error) {
      console.log('[BackendAsaasService] Erro de conexão no registro:', error);
      return { error: `Erro de conexão: ${error instanceof Error ? error.message : 'Erro desconhecido'}` };
    }
  }

  async loginUser(payload: LoginPayload) {
    try {
      console.log('[BackendAsaasService] Login usuário:', payload.email);
      const res = await fetch(`${BASE_BACKEND_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const parsed = await this.safeParseResponse(res);
      if (!parsed.ok) {
        const message = parsed.data?.error || parsed.text || `Erro ${parsed.status}`;
        console.log('[BackendAsaasService] Erro no login:', message);
        return { error: message };
      }
      console.log('[BackendAsaasService] Login realizado:', parsed.data);
      return parsed.data;
    } catch (error) {
      console.log('[BackendAsaasService] Erro de conexão no login:', error);
      return { error: `Erro de conexão: ${error instanceof Error ? error.message : 'Erro desconhecido'}` };
    }
  }

  async loginByUsername(username: string, password: string) {
    try {
      console.log('[BackendAsaasService] Login por username:', username);
      const res = await fetch(`${BASE_BACKEND_URL}/api/auth/login-by-username`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.toUpperCase(), password }),
      });
      const parsed = await this.safeParseResponse(res);
      if (!parsed.ok) {
        const message = parsed.data?.error || parsed.text || `Erro ${parsed.status}`;
        console.log('[BackendAsaasService] Erro no login por username:', message);
        return { error: message };
      }
      console.log('[BackendAsaasService] Login por username realizado:', parsed.data);
      return parsed.data;
    } catch (error) {
      console.log('[BackendAsaasService] Erro de conexão no login por username:', error);
      return { error: `Erro de conexão: ${error instanceof Error ? error.message : 'Erro desconhecido'}` };
    }
  }

  async validateUserCode(code: string) {
    try {
      console.log('[BackendAsaasService] Validando código de usuário:', code);
      const res = await fetch(`${BASE_BACKEND_URL}/api/auth/validate-user-code/${code}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        console.log('[BackendAsaasService] Erro na validação:', errorText);
        return { error: `Erro ${res.status}: ${errorText}`, valid: false };
      }
      
      const data = await res.json();
      console.log('[BackendAsaasService] Validação concluída:', data);
      return data;
    } catch (error) {
      console.log('[BackendAsaasService] Erro de conexão na validação:', error);
      return { error: `Erro de conexão: ${error instanceof Error ? error.message : 'Erro desconhecido'}`, valid: false };
    }
  }
  
  async createOrGetCustomer(payload: CreateCustomerPayload) {
    try {
      console.log('[BackendAsaasService] Tentando criar cliente em:', `${BASE_BACKEND_URL}/api/asaas/customer`);
      const res = await fetch(`${BASE_BACKEND_URL}/api/asaas/customer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const parsed = await this.safeParseResponse(res);
      if (!parsed.ok) {
        const message = parsed.data?.error || parsed.text || `Erro ${parsed.status}`;
        console.log('[BackendAsaasService] Erro HTTP ao criar/obter cliente:', message);
        return { error: message };
      }
      console.log('[BackendAsaasService] Cliente criado/obtido:', parsed.data);
      return parsed.data;
    } catch (error) {
      console.log('[BackendAsaasService] Erro de conexão:', error);
      return { error: `Erro de conexão: ${error instanceof Error ? error.message : 'Erro desconhecido'}. Verifique se o backend está rodando em ${BASE_BACKEND_URL}` };
    }
  }

  async createPixDeposit(payload: DepositPixPayload) {
    // Validação rápida para evitar requests inválidos
    if (!payload || !payload.customerId) {
      console.log('[BackendAsaasService] Payload inválido para depósito PIX:', payload);
      return { error: 'customerId ausente. Certifique-se de criar/obter o cliente antes de solicitar depósito.' };
    }

    try {
      console.log('[BackendAsaasService] Criando depósito PIX:', payload);
      const res = await fetch(`${BASE_BACKEND_URL}/api/asaas/deposit/pix`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const parsed = await this.safeParseResponse(res);
      if (!parsed.ok) {
        const message = parsed.data?.error || parsed.text || `Erro ${parsed.status}`;
        console.log('[BackendAsaasService] Erro HTTP no depósito:', message);
        return { error: message };
      }
      console.log('[BackendAsaasService] Depósito criado:', parsed.data);
      return parsed.data;
    } catch (error) {
      console.log('[BackendAsaasService] Erro de conexão no depósito:', error);
      return { error: `Erro de conexão: ${error instanceof Error ? error.message : 'Erro desconhecido'}` };
    }
  }

  async createPixWithdraw(payload: WithdrawPixPayload) {
    try {
      const res = await fetch(`${BASE_BACKEND_URL}/api/asaas/withdraw/pix`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const parsed = await this.safeParseResponse(res);
      if (!parsed.ok) {
        const message = parsed.data?.error || parsed.text || `Erro ${parsed.status}`;
        console.log('[BackendAsaasService] Erro no withdraw PIX:', message);
        return { error: message };
      }

      return parsed.data;
    } catch (error) {
      console.log('[BackendAsaasService] Erro de conexão no withdraw PIX:', error);
      return { error: `Erro de conexão: ${error instanceof Error ? error.message : 'Erro desconhecido'}` };
    }
  }

  async getPayment(id: string) {
    try {
      const res = await fetch(`${BASE_BACKEND_URL}/api/asaas/payment/${id}`);
      const parsed = await this.safeParseResponse(res);
      if (!parsed.ok) {
        const message = parsed.data?.error || parsed.text || `Erro ${parsed.status}`;
        console.log('[BackendAsaasService] Erro ao obter payment:', message);
        return { error: message };
      }
      return parsed.data;
    } catch (error) {
      console.log('[BackendAsaasService] Erro de conexão ao obter payment:', error);
      return { error: `Erro de conexão: ${error instanceof Error ? error.message : 'Erro desconhecido'}` };
    }
  }

  async getPaymentStatus(id: string) {
    try {
      console.log('[BackendAsaasService] Verificando status do pagamento:', id);
      const res = await fetch(`${BASE_BACKEND_URL}/api/asaas/payment/${id}`);
      const parsed = await this.safeParseResponse(res);
      if (!parsed.ok) {
        const message = parsed.data?.error || parsed.text || `Erro ${parsed.status}`;
        console.log('[BackendAsaasService] Erro ao buscar status:', message);
        return { error: message };
      }
      console.log('[BackendAsaasService] Status do pagamento:', parsed.data);
      return parsed.data;
    } catch (error) {
      console.log('[BackendAsaasService] Erro de conexão ao verificar status:', error);
      return { error: `Erro de conexão: ${error instanceof Error ? error.message : 'Erro desconhecido'}` };
    }
  }

  async getUserBalance(email: string) {
    try {
      console.log('[BackendAsaasService] Buscando saldo do usuário:', email);
      const res = await fetch(`${BASE_BACKEND_URL}/api/user/balance/${email}`);
      const parsed = await this.safeParseResponse(res);
      if (!parsed.ok) {
        const message = parsed.data?.error || parsed.text || `Erro ${parsed.status}`;
        console.log('[BackendAsaasService] Erro ao buscar saldo:', message);
        return { error: message };
      }
      console.log('[BackendAsaasService] Saldo do usuário:', parsed.data);
      return parsed.data;
    } catch (error) {
      console.log('[BackendAsaasService] Erro de conexão ao buscar saldo:', error);
      return { error: `Erro de conexão: ${error instanceof Error ? error.message : 'Erro desconhecido'}` };
    }
  }

  async getUserByCpf(cpf: string) {
    try {
      console.log('[BackendAsaasService] Buscando usuário por CPF:', cpf);
      const res = await fetch(`${BASE_BACKEND_URL}/api/auth/user-by-cpf/${cpf}`);
      const parsed = await this.safeParseResponse(res);
      if (!parsed.ok) {
        if (parsed.status === 404) return { error: 'CPF não encontrado' };
        const message = parsed.data?.error || parsed.text || `Erro ${parsed.status}`;
        console.log('[BackendAsaasService] Erro ao buscar CPF:', message);
        return { error: message };
      }
      console.log('[BackendAsaasService] Usuário encontrado:', parsed.data);
      return parsed.data;
    } catch (error) {
      console.log('[BackendAsaasService] Erro de conexão ao buscar CPF:', error);
      return { error: `Erro de conexão: ${error instanceof Error ? error.message : 'Erro desconhecido'}` };
    }
  }

  async getUserTransactions(email: string) {
    try {
      console.log('[BackendAsaasService] Buscando transações do usuário:', email);
      const res = await fetch(`${BASE_BACKEND_URL}/api/user/transactions/${email}`);
      const parsed = await this.safeParseResponse(res);
      if (!parsed.ok) {
        const message = parsed.data?.error || parsed.text || `Erro ${parsed.status}`;
        console.log('[BackendAsaasService] Erro ao buscar transações:', message);
        return { error: message };
      }
      console.log('[BackendAsaasService] Transações encontradas:', parsed.data);
      return parsed.data;
    } catch (error) {
      console.log('[BackendAsaasService] Erro de conexão ao buscar transações:', error);
      return { error: `Erro de conexão: ${error instanceof Error ? error.message : 'Erro desconhecido'}` };
    }
  }

  async getAccountBalance() {
    try {
      const res = await fetch(`${BASE_BACKEND_URL}/api/asaas/account-balance`);
      const parsed = await this.safeParseResponse(res);
      if (!parsed.ok) {
        const message = parsed.data?.error || parsed.text || `Erro ${parsed.status}`;
        console.log('[BackendAsaasService] Erro ao buscar account balance:', message);
        return { error: message };
      }
      return parsed.data;
    } catch (error) {
      console.log('[BackendAsaasService] Erro de conexão ao buscar account balance:', error);
      return { error: `Erro de conexão: ${error instanceof Error ? error.message : 'Erro desconhecido'}` };
    }
  }

  async requestWithdraw(payload: { email: string; amount: number; pixKey: string; description?: string; }) {
    try {
      console.log('[BackendAsaasService] 🚀 Iniciando requisição de saque...');
      console.log('[BackendAsaasService] 📤 URL:', `${BASE_BACKEND_URL}/api/withdraw`);
      console.log('[BackendAsaasService] 📊 Payload:', payload);
      
      const res = await fetch(`${BASE_BACKEND_URL}/api/withdraw`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      console.log('[BackendAsaasService] 📨 Status da resposta:', res.status);
      console.log('[BackendAsaasService] 📨 Status OK:', res.ok);
      
      const parsed = await this.safeParseResponse(res);
      console.log('[BackendAsaasService] 📥 Dados da resposta (raw):', parsed);

      if (!parsed.ok) {
        console.log('[BackendAsaasService] ❌ Erro na resposta!');
        const data = parsed.data;
        if (data?.code === 'ASAAS_ACCOUNT_NOT_APPROVED') {
          return { error: data.error, code: data.code, original: data.original };
        }
        const message = data?.error || parsed.text || `Erro ${parsed.status}`;
        return { error: message };
      }

      console.log('[BackendAsaasService] ✅ Saque processado com sucesso!');
      return parsed.data;
    } catch (error) {
      console.log('[BackendAsaasService] ❌ Erro de conexão:', error);
      return { error: 'Erro de conexão ao solicitar saque' };
    }
  }

  async ping() {
    try {
      const res = await fetch(`${BASE_BACKEND_URL}/api/asaas/ping`);
      const parsed = await this.safeParseResponse(res);
      if (!parsed.ok) {
        const message = parsed.data?.error || parsed.text || `Erro ${parsed.status}`;
        return { error: message };
      }
      return parsed.data;
    } catch (error) {
      console.log('[BackendAsaasService] Erro ao ping:', error);
      return { error: `Erro de conexão: ${error instanceof Error ? error.message : 'Erro desconhecido'}` };
    }
  }

  async getUserProfile(email: string) {
    try {
      console.log('[BackendAsaasService] Buscando perfil completo do usuário:', email);
      const res = await fetch(`${BASE_BACKEND_URL}/api/user/profile/${email}`);
      const parsed = await this.safeParseResponse(res);
      if (!parsed.ok) {
        const message = parsed.data?.error || parsed.text || `Erro ${parsed.status}`;
        console.log('[BackendAsaasService] Erro ao buscar perfil:', message);
        return { error: message };
      }
      console.log('[BackendAsaasService] Perfil carregado:', parsed.data);
      return parsed.data;
    } catch (error) {
      console.log('[BackendAsaasService] Erro de conexão ao buscar perfil:', error);
      return { error: `Erro de conexão: ${error instanceof Error ? error.message : 'Erro desconhecido'}` };
    }
  }

  async getUserByUsername(username: string) {
    try {
      console.log('[BackendAsaasService] Buscando usuário por username:', username);
      const res = await fetch(`${BASE_BACKEND_URL}/api/user/by-username/${username}`);
      const parsed = await this.safeParseResponse(res);
      if (!parsed.ok) {
        if (parsed.status === 404) return { error: 'Usuário não encontrado' };
        const message = parsed.data?.error || parsed.text || `Erro ${parsed.status}`;
        console.log('[BackendAsaasService] Erro ao buscar usuário:', message);
        return { error: message };
      }

      // Se o backend retornou OK mas o corpo não era JSON (parsed.data === null),
      // devolvemos um erro legível em vez de null para evitar crashes no frontend.
      if (parsed.data == null) {
        const message = parsed.text || 'Resposta inválida do servidor';
        console.log('[BackendAsaasService] Resposta inesperada ao buscar usuário (não-JSON):', message);
        return { error: message };
      }

      console.log('[BackendAsaasService] Usuário encontrado:', parsed.data);
      return parsed.data;
    } catch (error) {
      console.log('[BackendAsaasService] Erro de conexão ao buscar usuário:', error);
      return { error: `Erro de conexão: ${error instanceof Error ? error.message : 'Erro desconhecido'}` };
    }
  }
}

export default new BackendAsaasService();
