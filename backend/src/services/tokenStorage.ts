import keytar from 'keytar';
import { createLogger } from '../utils/logger';

const logger = createLogger('token-storage');
const SERVICE_NAME = 'ai-banking-assistant';

class TokenStorage {
  private static instance: TokenStorage;

  private constructor() {}

  public static getInstance(): TokenStorage {
    if (!TokenStorage.instance) {
      TokenStorage.instance = new TokenStorage();
    }
    return TokenStorage.instance;
  }

  /**
   * Store access token securely
   */
  public async storeAccessToken(userId: string, token: string): Promise<void> {
    try {
      await keytar.setPassword(SERVICE_NAME, `${userId}_access`, token);
      logger.info('Access token stored successfully', { userId });
    } catch (error) {
      logger.error('Failed to store access token', { userId, error });
      throw new Error('Failed to store access token');
    }
  }

  /**
   * Store refresh token securely
   */
  public async storeRefreshToken(userId: string, token: string): Promise<void> {
    try {
      await keytar.setPassword(SERVICE_NAME, `${userId}_refresh`, token);
      logger.info('Refresh token stored successfully', { userId });
    } catch (error) {
      logger.error('Failed to store refresh token', { userId, error });
      throw new Error('Failed to store refresh token');
    }
  }

  /**
   * Retrieve access token
   */
  public async getAccessToken(userId: string): Promise<string | null> {
    try {
      const token = await keytar.getPassword(SERVICE_NAME, `${userId}_access`);
      return token;
    } catch (error) {
      logger.error('Failed to retrieve access token', { userId, error });
      throw new Error('Failed to retrieve access token');
    }
  }

  /**
   * Retrieve refresh token
   */
  public async getRefreshToken(userId: string): Promise<string | null> {
    try {
      const token = await keytar.getPassword(SERVICE_NAME, `${userId}_refresh`);
      return token;
    } catch (error) {
      logger.error('Failed to retrieve refresh token', { userId, error });
      throw new Error('Failed to retrieve refresh token');
    }
  }

  /**
   * Delete all tokens for a user
   */
  public async deleteTokens(userId: string): Promise<void> {
    try {
      await Promise.all([
        keytar.deletePassword(SERVICE_NAME, `${userId}_access`),
        keytar.deletePassword(SERVICE_NAME, `${userId}_refresh`),
      ]);
      logger.info('Tokens deleted successfully', { userId });
    } catch (error) {
      logger.error('Failed to delete tokens', { userId, error });
      throw new Error('Failed to delete tokens');
    }
  }

  /**
   * Store consent data securely
   */
  public async storeConsentData(
    userId: string,
    consentId: string,
    expiresAt: string
  ): Promise<void> {
    try {
      const consentData = JSON.stringify({ consentId, expiresAt });
      await keytar.setPassword(SERVICE_NAME, `${userId}_consent`, consentData);
      logger.info('Consent data stored successfully', { userId });
    } catch (error) {
      logger.error('Failed to store consent data', { userId, error });
      throw new Error('Failed to store consent data');
    }
  }

  /**
   * Retrieve consent data
   */
  public async getConsentData(
    userId: string
  ): Promise<{ consentId: string; expiresAt: string } | null> {
    try {
      const consentData = await keytar.getPassword(SERVICE_NAME, `${userId}_consent`);
      if (!consentData) return null;
      return JSON.parse(consentData);
    } catch (error) {
      logger.error('Failed to retrieve consent data', { userId, error });
      throw new Error('Failed to retrieve consent data');
    }
  }

  /**
   * Delete consent data
   */
  public async deleteConsentData(userId: string): Promise<void> {
    try {
      await keytar.deletePassword(SERVICE_NAME, `${userId}_consent`);
      logger.info('Consent data deleted successfully', { userId });
    } catch (error) {
      logger.error('Failed to delete consent data', { userId, error });
      throw new Error('Failed to delete consent data');
    }
  }
}

export default TokenStorage.getInstance();
