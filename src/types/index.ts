export interface User {
  id: string;
  email: string;
  username: string;
  balance: number;
  createdAt: Date;
  document?: string;
  fullName?: string;
  userCode?: string;
}

export interface Transaction {
  id: string;
  type: 'deposit' | 'withdraw' | 'transfer_sent' | 'transfer_received';
  amount: number;
  description: string;
  toUserId?: string;
  toUserEmail?: string;
  fromUserId?: string;
  fromUserEmail?: string;
  createdAt: Date;
  status: 'pending' | 'completed' | 'failed' | 'processing';
  paymentId?: string;
  transferId?: string;
  paymentMethod?: 'pix' | 'credit_card' | 'bank_transfer';
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
}

export interface AppState {
  auth: AuthState;
  transactions: Transaction[];
  users: User[];
}