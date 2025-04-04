import dotenv from 'dotenv';

dotenv.config();

interface PSD2ConfigType {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  nokRedirectUri: string;
  apiBaseUrl: string;
  tokenEndpoint: string;
  authEndpoint: string;
  scopes: string[];
  rateLimit: {
    maxRequestsPerSecond: number;
    maxConcurrent: number;
  };
  retry: {
    maxRetries: number;
    initialDelayMs: number;
    maxDelayMs: number;
    backoffFactor: number;
  };
}

export const PSD2Config: PSD2ConfigType = {
  clientId: process.env.BANKINTER_CLIENT_ID || '',
  clientSecret: process.env.BANKINTER_CLIENT_SECRET || '',
  redirectUri: process.env.BANKINTER_REDIRECT_URI || '',
  nokRedirectUri: process.env.BANKINTER_NOK_REDIRECT_URI || '',
  apiBaseUrl: 'https://api.sandbox.bankinter.com/psd2/v2',
  tokenEndpoint: 'https://api.sandbox.bankinter.com/oauth2/token',
  authEndpoint: 'https://api.sandbox.bankinter.com/oauth2/authorize',
  scopes: [
    'accounts',
    'balances',
    'transactions',
    'payments',
  ],
  rateLimit: {
    maxRequestsPerSecond: 30,
    maxConcurrent: 5,
  },
  retry: {
    maxRetries: 3,
    initialDelayMs: 1000,
    maxDelayMs: 10000,
    backoffFactor: 2,
  },
};
