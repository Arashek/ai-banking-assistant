import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'http://localhost:3000/api';

export const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle token expiration
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem('token');
      // Navigate to login screen
      // You'll need to implement your navigation logic here
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  register: async (name: string, email: string, password: string) => {
    const response = await api.post('/auth/register', { name, email, password });
    return response.data;
  },

  verifyBiometric: async (userId: string, biometricToken: string) => {
    const response = await api.post('/auth/verify-biometric', { userId, biometricToken });
    return response.data;
  },
};

interface TransactionFilter {
  filter: string;
  limit: number;
}

interface Transaction {
  id: string;
  type: string;
  amount: number;
  description: string;
  category: string;
  createdAt: string;
  status: string;
}

interface Account {
  id: string;
  accountNumber: string;
  balance: number;
  currency: string;
}

interface Recipient {
  id: string;
  name: string;
  accountNumber: string;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  phone: string;
  address: string;
  idNumber: string;
}

export const bankingApi = {
  getBalance: async () => {
    const response = await api.get('/banking/balance');
    return response.data;
  },

  getAccounts: async (): Promise<Account[]> => {
    const response = await api.get('/banking/accounts');
    return response.data;
  },

  getAccountDetails: async (accountId: string): Promise<Account> => {
    const response = await api.get(`/banking/accounts/${accountId}`);
    return response.data;
  },

  getTransactions: async (params: TransactionFilter): Promise<Transaction[]> => {
    const response = await api.get('/banking/transactions', { params });
    return response.data;
  },

  getRecipients: async (): Promise<Recipient[]> => {
    const response = await api.get('/banking/recipients');
    return response.data;
  },

  transfer: async (fromAccountId: string, toAccountId: string, amount: number, description?: string) => {
    const response = await api.post('/banking/transfer', {
      fromAccountId,
      toAccountId,
      amount,
      description,
    });
    return response.data;
  },

  register: async (data: RegisterData) => {
    const response = await api.post('/banking/register', data);
    return response.data;
  },
};

export const aiApi = {
  processCommand: async (command: string) => {
    const response = await api.post('/ai/process-command', { command });
    return response.data;
  },

  processVoiceCommand: async (audioData: any) => {
    const formData = new FormData();
    formData.append('audio', audioData);
    
    const response = await api.post('/ai/process-voice-command', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};
