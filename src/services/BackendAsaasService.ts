// Serviço para consumir as rotas proxy do backend em vez de chamar a Asaas direto
// Para Expo: usar IP da máquina em vez de localhost

// Para descobrir seu IP: ipconfig no CMD e pegar IPv4 da sua rede
// Ou use o IP que aparece no QR code do Expo (ex: exp://192.168.1.100:8081)
const BASE_BACKEND_URL = 'http://localhost:3000'; // Ajuste para seu IP local

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
  async registerUser(payload: RegisterUserPayload) {
    try {
      console.log('[BackendAsaasService] Registrando usuário:', payload.email);
      const res = await fetch(`${BASE_BACKEND_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        console.log('[BackendAsaasService] Erro no registro:', errorText);
        return { error: `Erro ${res.status}: ${errorText}` };
      }
      
      const data = await res.json();
      console.log('[BackendAsaasService] Usuário registrado:', data);
      return data;
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
      
      if (!res.ok) {
        const errorText = await res.text();
        console.log('[BackendAsaasService] Erro no login:', errorText);
        return { error: `Erro ${res.status}: ${errorText}` };
      }
      
      const data = await res.json();
      console.log('[BackendAsaasService] Login realizado:', data);
      return data;
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
      
      if (!res.ok) {
        const errorText = await res.text();
        console.log('[BackendAsaasService] Erro no login por username:', errorText);
        return { error: `Erro ${res.status}: ${errorText}` };
      }
      
      const data = await res.json();
      console.log('[BackendAsaasService] Login por username realizado:', data);
      return data;
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
      
      if (!res.ok) {
        console.log('[BackendAsaasService] Erro HTTP:', res.status, res.statusText);
        const errorText = await res.text();
        console.log('[BackendAsaasService] Erro response:', errorText);
        return { error: `Erro ${res.status}: ${errorText}` };
      }
      
      const data = await res.json();
      console.log('[BackendAsaasService] Cliente criado/obtido:', data);
      return data;
    } catch (error) {
      console.log('[BackendAsaasService] Erro de conexão:', error);
      return { error: `Erro de conexão: ${error instanceof Error ? error.message : 'Erro desconhecido'}. Verifique se o backend está rodando em ${BASE_BACKEND_URL}` };
    }
  }

  async createPixDeposit(payload: DepositPixPayload) {
    try {
      console.log('[BackendAsaasService] Criando depósito PIX:', payload);
      const res = await fetch(`${BASE_BACKEND_URL}/api/asaas/deposit/pix`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      if (!res.ok) {
        console.log('[BackendAsaasService] Erro HTTP no depósito:', res.status);
        const errorText = await res.text();
        console.log('[BackendAsaasService] Erro response depósito:', errorText);
        return { error: `Erro ${res.status}: ${errorText}` };
      }
      
      const data = await res.json();
      console.log('[BackendAsaasService] Depósito criado:', data);
      return data;
    } catch (error) {
      console.log('[BackendAsaasService] Erro de conexão no depósito:', error);
      return { error: `Erro de conexão: ${error instanceof Error ? error.message : 'Erro desconhecido'}` };
    }
  }

  async createPixWithdraw(payload: WithdrawPixPayload) {
    const res = await fetch(`${BASE_BACKEND_URL}/api/asaas/withdraw/pix`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.json();
  }

  async getPayment(id: string) {
    const res = await fetch(`${BASE_BACKEND_URL}/api/asaas/payment/${id}`);
    return res.json();
  }

  async getPaymentStatus(id: string) {
    try {
      console.log('[BackendAsaasService] Verificando status do pagamento:', id);
      const res = await fetch(`${BASE_BACKEND_URL}/api/asaas/payment/${id}`);
      
      if (!res.ok) {
        console.log('[BackendAsaasService] Erro ao buscar status:', res.status);
        return { error: `Erro ${res.status}` };
      }
      
      const data = await res.json();
      console.log('[BackendAsaasService] Status do pagamento:', data);
      return data;
    } catch (error) {
      console.log('[BackendAsaasService] Erro de conexão ao verificar status:', error);
      return { error: `Erro de conexão: ${error instanceof Error ? error.message : 'Erro desconhecido'}` };
    }
  }

  async getUserBalance(email: string) {
    try {
      console.log('[BackendAsaasService] Buscando saldo do usuário:', email);
      const res = await fetch(`${BASE_BACKEND_URL}/api/user/balance/${email}`);
      
      if (!res.ok) {
        console.log('[BackendAsaasService] Erro ao buscar saldo:', res.status);
        return { error: `Erro ${res.status}` };
      }
      
      const data = await res.json();
      console.log('[BackendAsaasService] Saldo do usuário:', data);
      return data;
    } catch (error) {
      console.log('[BackendAsaasService] Erro de conexão ao buscar saldo:', error);
      return { error: `Erro de conexão: ${error instanceof Error ? error.message : 'Erro desconhecido'}` };
    }
  }

  async getUserByCpf(cpf: string) {
    try {
      console.log('[BackendAsaasService] Buscando usuário por CPF:', cpf);
      const res = await fetch(`${BASE_BACKEND_URL}/api/auth/user-by-cpf/${cpf}`);
      
      if (!res.ok) {
        if (res.status === 404) {
          return { error: 'CPF não encontrado' };
        }
        console.log('[BackendAsaasService] Erro ao buscar CPF:', res.status);
        return { error: `Erro ${res.status}` };
      }
      
      const data = await res.json();
      console.log('[BackendAsaasService] Usuário encontrado:', data);
      return data;
    } catch (error) {
      console.log('[BackendAsaasService] Erro de conexão ao buscar CPF:', error);
      return { error: `Erro de conexão: ${error instanceof Error ? error.message : 'Erro desconhecido'}` };
    }
  }

  async getUserTransactions(email: string) {
    try {
      console.log('[BackendAsaasService] Buscando transações do usuário:', email);
      const res = await fetch(`${BASE_BACKEND_URL}/api/user/transactions/${email}`);
      
      if (!res.ok) {
        console.log('[BackendAsaasService] Erro ao buscar transações:', res.status);
        return { error: `Erro ${res.status}` };
      }
      
      const data = await res.json();
      console.log('[BackendAsaasService] Transações encontradas:', data);
      return data;
    } catch (error) {
      console.log('[BackendAsaasService] Erro de conexão ao buscar transações:', error);
      return { error: `Erro de conexão: ${error instanceof Error ? error.message : 'Erro desconhecido'}` };
    }
  }

  async getAccountBalance() {
    const res = await fetch(`${BASE_BACKEND_URL}/api/asaas/account-balance`);
    return res.json();
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
      
      const data = await res.json();
      console.log('[BackendAsaasService] 📥 Dados da resposta:', data);
      
      if (!res.ok) {
        console.log('[BackendAsaasService] ❌ Erro na resposta!');
        // Propaga código específico se existir
        if (data?.code === 'ASAAS_ACCOUNT_NOT_APPROVED') {
          return { error: data.error, code: data.code, original: data.original };
        }
        return { error: data.error || `Erro ${res.status}` };
      }
      
      console.log('[BackendAsaasService] ✅ Saque processado com sucesso!');
      return data;
    } catch (error) {
      console.log('[BackendAsaasService] ❌ Erro de conexão:', error);
      return { error: 'Erro de conexão ao solicitar saque' };
    }
  }

  async ping() {
    const res = await fetch(`${BASE_BACKEND_URL}/api/asaas/ping`);
    return res.json();
  }

  async getUserProfile(email: string) {
    try {
      console.log('[BackendAsaasService] Buscando perfil completo do usuário:', email);
      const res = await fetch(`${BASE_BACKEND_URL}/api/user/profile/${email}`);
      
      if (!res.ok) {
        const errorText = await res.text();
        console.log('[BackendAsaasService] Erro ao buscar perfil:', errorText);
        return { error: `Erro ${res.status}: ${errorText}` };
      }
      
      const data = await res.json();
      console.log('[BackendAsaasService] Perfil carregado:', data);
      return data;
    } catch (error) {
      console.log('[BackendAsaasService] Erro de conexão ao buscar perfil:', error);
      return { error: `Erro de conexão: ${error instanceof Error ? error.message : 'Erro desconhecido'}` };
    }
  }

  async getUserByUsername(username: string) {
    try {
      console.log('[BackendAsaasService] Buscando usuário por username:', username);
      const res = await fetch(`${BASE_BACKEND_URL}/api/user/by-username/${username}`);
      
      if (!res.ok) {
        const errorText = await res.text();
        console.log('[BackendAsaasService] Erro ao buscar usuário:', errorText);
        return { error: res.status === 404 ? 'Usuário não encontrado' : `Erro ${res.status}: ${errorText}` };
      }
      
      const data = await res.json();
      console.log('[BackendAsaasService] Usuário encontrado:', data);
      return data;
    } catch (error) {
      console.log('[BackendAsaasService] Erro de conexão ao buscar usuário:', error);
      return { error: `Erro de conexão: ${error instanceof Error ? error.message : 'Erro desconhecido'}` };
    }
  }
}

export default new BackendAsaasService();
