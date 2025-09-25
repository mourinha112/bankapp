import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { User, Transaction, AppState } from '../types';

interface AppContextType {
  state: AppState;
  login: (email: string, password: string) => Promise<boolean>;
  loginWithUser: (user: User) => void;
  register: (email: string, confirmEmail: string, code: string, username: string, password: string) => Promise<boolean>;
  logout: () => void;
  deposit: (amount: number) => Promise<boolean>;
  withdraw: (amount: number) => Promise<boolean>;
  transfer: (toUserEmail: string, amount: number, description: string) => Promise<boolean>;
  getUserByEmail: (email: string) => User | undefined;
  updateBalance: (newBalance: number) => void;
}

type Action =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'LOGIN_SUCCESS'; payload: User }
  | { type: 'LOGOUT' }
  | { type: 'UPDATE_BALANCE'; payload: number }
  | { type: 'ADD_TRANSACTION'; payload: Transaction }
  | { type: 'SET_USERS'; payload: User[] };

const initialState: AppState = {
  auth: {
    isAuthenticated: false,
    user: null,
    loading: false,
  },
  transactions: [],
  users: [
    {
      id: '1',
      email: 'user1@test.com',
      username: 'user1',
      balance: 1000,
      createdAt: new Date(),
    },
    {
      id: '2',
      email: 'user2@test.com',
      username: 'user2',
      balance: 2000,
      createdAt: new Date(),
    },
  ],
};

function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_LOADING':
      return {
        ...state,
        auth: { ...state.auth, loading: action.payload },
      };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        auth: {
          isAuthenticated: true,
          user: action.payload,
          loading: false,
        },
      };
    case 'LOGOUT':
      return {
        ...state,
        auth: {
          isAuthenticated: false,
          user: null,
          loading: false,
        },
      };
    case 'UPDATE_BALANCE':
      return {
        ...state,
        auth: {
          ...state.auth,
          user: state.auth.user ? { ...state.auth.user, balance: action.payload } : null,
        },
      };
    case 'ADD_TRANSACTION':
      return {
        ...state,
        transactions: [action.payload, ...state.transactions],
      };
    case 'SET_USERS':
      return {
        ...state,
        users: action.payload,
      };
    default:
      return state;
  }
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  const login = async (email: string, password: string): Promise<boolean> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    // Simular delay de API
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Buscar usuário (simulado)
    const user = state.users.find(u => u.email === email);
    
    if (user && password === '123456') { // Senha fixa para demo
      dispatch({ type: 'LOGIN_SUCCESS', payload: user });
      return true;
    }
    
    dispatch({ type: 'SET_LOADING', payload: false });
    return false;
  };

  const register = async (
    email: string,
    confirmEmail: string,
    code: string,
    username: string,
    password: string
  ): Promise<boolean> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    // Simular delay de API
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Validações
    if (email !== confirmEmail) {
      dispatch({ type: 'SET_LOADING', payload: false });
      return false;
    }
    
    if (code !== 'BANK2025') { // Código fixo para demo
      dispatch({ type: 'SET_LOADING', payload: false });
      return false;
    }
    
    if (state.users.find(u => u.email === email)) {
      dispatch({ type: 'SET_LOADING', payload: false });
      return false;
    }
    
    // Criar novo usuário
    const newUser: User = {
      id: Date.now().toString(),
      email,
      username,
      balance: 100, // Bônus de boas-vindas
      createdAt: new Date(),
    };
    
    dispatch({ type: 'SET_USERS', payload: [...state.users, newUser] });
    dispatch({ type: 'LOGIN_SUCCESS', payload: newUser });
    return true;
  };

  const logout = () => {
    dispatch({ type: 'LOGOUT' });
  };

  const deposit = async (amount: number): Promise<boolean> => {
    if (!state.auth.user || amount <= 0) return false;
    
    // Simular delay de API
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const newBalance = state.auth.user.balance + amount;
    dispatch({ type: 'UPDATE_BALANCE', payload: newBalance });
    
    const transaction: Transaction = {
      id: Date.now().toString(),
      type: 'deposit',
      amount,
      description: `Depósito de R$ ${amount.toFixed(2)}`,
      createdAt: new Date(),
      status: 'completed',
    };
    
    dispatch({ type: 'ADD_TRANSACTION', payload: transaction });
    return true;
  };

  const withdraw = async (amount: number): Promise<boolean> => {
    if (!state.auth.user || amount <= 0 || amount > state.auth.user.balance) return false;
    
    // Simular delay de API
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const newBalance = state.auth.user.balance - amount;
    dispatch({ type: 'UPDATE_BALANCE', payload: newBalance });
    
    const transaction: Transaction = {
      id: Date.now().toString(),
      type: 'withdraw',
      amount,
      description: `Saque de R$ ${amount.toFixed(2)}`,
      createdAt: new Date(),
      status: 'completed',
    };
    
    dispatch({ type: 'ADD_TRANSACTION', payload: transaction });
    return true;
  };

  const transfer = async (toUserEmail: string, amount: number, description: string): Promise<boolean> => {
    if (!state.auth.user || amount <= 0 || amount > state.auth.user.balance) return false;
    
    const toUser = state.users.find(u => u.email === toUserEmail);
    if (!toUser || toUser.id === state.auth.user.id) return false;
    
    // Simular delay de API
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Atualizar saldo do usuário atual
    const newBalance = state.auth.user.balance - amount;
    dispatch({ type: 'UPDATE_BALANCE', payload: newBalance });
    
    // Atualizar saldo do usuário destinatário
    const updatedUsers = state.users.map(u => 
      u.id === toUser.id ? { ...u, balance: u.balance + amount } : u
    );
    dispatch({ type: 'SET_USERS', payload: updatedUsers });
    
    // Adicionar transação de envio
    const transaction: Transaction = {
      id: Date.now().toString(),
      type: 'transfer_sent',
      amount,
      description: description || `Transferência para ${toUserEmail}`,
      toUserId: toUser.id,
      toUserEmail: toUser.email,
      createdAt: new Date(),
      status: 'completed',
    };
    
    dispatch({ type: 'ADD_TRANSACTION', payload: transaction });
    return true;
  };

  const getUserByEmail = (email: string): User | undefined => {
    return state.users.find(u => u.email === email);
  };

  const updateBalance = (newBalance: number) => {
    dispatch({ type: 'UPDATE_BALANCE', payload: newBalance });
  };

  const loginWithUser = (user: User) => {
    dispatch({ type: 'LOGIN_SUCCESS', payload: user });
  };

  return (
    <AppContext.Provider value={{
      state,
      login,
      loginWithUser,
      register,
      logout,
      deposit,
      withdraw,
      transfer,
      getUserByEmail,
      updateBalance,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}