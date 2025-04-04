import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import rateLimit from 'axios-rate-limit';
import axiosRetry from 'axios-retry';
import tokenStorage from './tokenStorage';
import { createLogger } from '../utils/logger';
import { PSD2Config } from '../config/psd2Config';
import Queue from 'better-queue';

const logger = createLogger('psd2-service');

interface RequestOptions {
  userId: string;
  userIp: string;
  userAgent: string;
}

interface ExtendedAxiosRequestConfig extends AxiosRequestConfig {
  userId?: string;
}

class PSD2Service {
  private static instance: PSD2Service;
  private client: AxiosInstance;
  private requestQueue: Queue;

  private constructor() {
    // Create rate-limited axios instance
    this.client = rateLimit(axios.create({
      baseURL: PSD2Config.apiBaseUrl,
      timeout: 10000,
    }), {
      maxRequests: PSD2Config.rateLimit.maxRequestsPerSecond,
      perMilliseconds: 1000,
      maxRPS: PSD2Config.rateLimit.maxRequestsPerSecond,
    });

    // Configure retry logic
    axiosRetry(this.client, {
      retries: PSD2Config.retry.maxRetries,
      retryDelay: axiosRetry.exponentialDelay,
      retryCondition: (error) => {
        return axiosRetry.isNetworkOrIdempotentRequestError(error) ||
          error.response?.status === 429;
      },
    });

    // Initialize request queue
    this.requestQueue = new Queue(async (task: any, cb: any) => {
      try {
        const result = await this.executeRequest(task);
        cb(null, result);
      } catch (error) {
        cb(error);
      }
    }, {
      concurrent: PSD2Config.rateLimit.maxConcurrent,
      maxRetries: PSD2Config.retry.maxRetries,
      retryDelay: PSD2Config.retry.initialDelayMs,
    });

    // Add request interceptor for authentication
    this.client.interceptors.request.use(async (config: ExtendedAxiosRequestConfig) => {
      const userId = config.userId;
      if (!userId) throw new Error('User ID not provided');

      const accessToken = await tokenStorage.getAccessToken(userId);
      if (!accessToken) throw new Error('Access token not found');

      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${accessToken}`;
      return config;
    });

    // Add response interceptor for token refresh
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401 && error.config?.userId) {
          try {
            await this.refreshAccessToken(error.config.userId);
            const accessToken = await tokenStorage.getAccessToken(error.config.userId);
            error.config.headers.Authorization = `Bearer ${accessToken}`;
            return this.client.request(error.config);
          } catch (refreshError) {
            logger.error('Token refresh failed', {
              userId: error.config.userId,
              error: refreshError,
            });
            throw refreshError;
          }
        }
        throw error;
      }
    );
  }

  public static getInstance(): PSD2Service {
    if (!PSD2Service.instance) {
      PSD2Service.instance = new PSD2Service();
    }
    return PSD2Service.instance;
  }

  private async executeRequest(task: {
    method: string;
    url: string;
    data?: any;
    options: RequestOptions;
  }) {
    const { method, url, data, options } = task;
    try {
      const config: ExtendedAxiosRequestConfig = {
        method,
        url,
        data,
        userId: options.userId,
        headers: {
          'X-Request-ID': this.generateRequestId(),
          'PSU-IP-Address': options.userIp,
          'PSU-User-Agent': options.userAgent,
        },
      };

      const response = await this.client.request(config);
      return response.data;
    } catch (error) {
      logger.error('PSD2 API request failed', {
        method,
        url,
        userId: options.userId,
        error: error.message,
      });
      throw error;
    }
  }

  private generateRequestId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private async refreshAccessToken(userId: string): Promise<void> {
    try {
      const refreshToken = await tokenStorage.getRefreshToken(userId);
      if (!refreshToken) throw new Error('Refresh token not found');

      const response = await axios.post(PSD2Config.tokenEndpoint, {
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: PSD2Config.clientId,
        client_secret: PSD2Config.clientSecret,
      });

      await Promise.all([
        tokenStorage.storeAccessToken(userId, response.data.access_token),
        tokenStorage.storeRefreshToken(userId, response.data.refresh_token),
      ]);

      logger.info('Access token refreshed successfully', { userId });
    } catch (error) {
      logger.error('Failed to refresh access token', { userId, error });
      throw error;
    }
  }

  // Queue a request to the PSD2 API
  private queueRequest(method: string, url: string, options: RequestOptions, data?: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.requestQueue.push({ method, url, data, options }, (error: any, result: any) => {
        if (error) reject(error);
        else resolve(result);
      });
    });
  }

  // Public API methods
  public async getAccounts(options: RequestOptions) {
    return this.queueRequest('GET', '/accounts', options);
  }

  public async getAccountBalances(options: RequestOptions, accountId: string) {
    return this.queueRequest('GET', `/accounts/${accountId}/balances`, options);
  }

  public async getAccountTransactions(
    options: RequestOptions,
    accountId: string,
    dateFrom?: string,
    dateTo?: string
  ) {
    const url = `/accounts/${accountId}/transactions${
      dateFrom ? `?dateFrom=${dateFrom}${dateTo ? `&dateTo=${dateTo}` : ''}` : ''
    }`;
    return this.queueRequest('GET', url, options);
  }

  public async checkFundsAvailability(
    options: RequestOptions,
    accountId: string,
    amount: number,
    currency: string
  ) {
    return this.queueRequest('POST', `/accounts/${accountId}/funds-confirmation`, options, {
      amount,
      currency,
    });
  }

  // Consent Management
  public async createConsent(options: RequestOptions, request: any) {
    return this.queueRequest('POST', '/consents', options, request);
  }

  public async getConsentStatus(options: RequestOptions, consentId: string) {
    return this.queueRequest('GET', `/consents/${consentId}`, options);
  }

  public async deleteConsent(options: RequestOptions, consentId: string) {
    return this.queueRequest('DELETE', `/consents/${consentId}`, options);
  }

  public async getAccountDetails(options: RequestOptions, accountId: string) {
    return this.queueRequest('GET', `/accounts/${accountId}`, options);
  }

  public async initiatePayment(options: RequestOptions, paymentData: any) {
    return this.queueRequest('POST', '/payments', options, paymentData);
  }

  public async getPaymentStatus(options: RequestOptions, paymentId: string) {
    return this.queueRequest('GET', `/payments/${paymentId}`, options);
  }

  public async cancelPayment(options: RequestOptions, paymentId: string) {
    return this.queueRequest('DELETE', `/payments/${paymentId}`, options);
  }
}

export default PSD2Service.getInstance();
