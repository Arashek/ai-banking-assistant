import axios from 'axios';
import querystring from 'querystring';
import { psd2Config } from '../config/psd2Config';
import { createHash, randomBytes } from 'crypto';

interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
}

class OAuth2Service {
  private static instance: OAuth2Service;
  private tokenCache: Map<string, { token: TokenResponse; expiresAt: number }>;

  private constructor() {
    this.tokenCache = new Map();
  }

  public static getInstance(): OAuth2Service {
    if (!OAuth2Service.instance) {
      OAuth2Service.instance = new OAuth2Service();
    }
    return OAuth2Service.instance;
  }

  private generateCodeVerifier(): string {
    return randomBytes(32).toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  private generateCodeChallenge(verifier: string): string {
    return createHash('sha256')
      .update(verifier)
      .digest('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  private generateState(): string {
    return randomBytes(16).toString('hex');
  }

  public getAuthorizationUrl(userId: string): { url: string; state: string; codeVerifier: string } {
    const state = this.generateState();
    const codeVerifier = this.generateCodeVerifier();
    const codeChallenge = this.generateCodeChallenge(codeVerifier);

    const params = {
      response_type: 'code',
      client_id: psd2Config.oauth.clientId,
      redirect_uri: psd2Config.oauth.redirectUri,
      scope: psd2Config.oauth.scopes.join(' '),
      state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
    };

    const url = `${psd2Config.oauth.authorizationEndpoint}?${querystring.stringify(params)}`;

    return { url, state, codeVerifier };
  }

  public async exchangeCodeForToken(
    code: string,
    codeVerifier: string,
    userId: string
  ): Promise<TokenResponse> {
    try {
      const params = {
        grant_type: 'authorization_code',
        code,
        redirect_uri: psd2Config.oauth.redirectUri,
        client_id: psd2Config.oauth.clientId,
        client_secret: psd2Config.oauth.clientSecret,
        code_verifier: codeVerifier,
      };

      const response = await axios.post(
        psd2Config.oauth.tokenEndpoint,
        querystring.stringify(params),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      const token = response.data as TokenResponse;
      this.cacheToken(userId, token);
      return token;
    } catch (error) {
      console.error('Error exchanging code for token:', error);
      throw new Error('Failed to exchange authorization code for token');
    }
  }

  public async refreshToken(userId: string, refreshToken: string): Promise<TokenResponse> {
    try {
      const params = {
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: psd2Config.oauth.clientId,
        client_secret: psd2Config.oauth.clientSecret,
      };

      const response = await axios.post(
        psd2Config.oauth.tokenEndpoint,
        querystring.stringify(params),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      const token = response.data as TokenResponse;
      this.cacheToken(userId, token);
      return token;
    } catch (error) {
      console.error('Error refreshing token:', error);
      throw new Error('Failed to refresh token');
    }
  }

  private cacheToken(userId: string, token: TokenResponse): void {
    const expiresAt = Date.now() + token.expires_in * 1000;
    this.tokenCache.set(userId, { token, expiresAt });
  }

  public async getValidToken(userId: string): Promise<string> {
    const cachedData = this.tokenCache.get(userId);

    if (cachedData) {
      const { token, expiresAt } = cachedData;
      
      // If token expires in less than 5 minutes, refresh it
      if (expiresAt - Date.now() < 300000) {
        const newToken = await this.refreshToken(userId, token.refresh_token);
        return newToken.access_token;
      }

      return token.access_token;
    }

    throw new Error('No token found for user');
  }

  public clearTokenCache(userId: string): void {
    this.tokenCache.delete(userId);
  }
}

export default OAuth2Service.getInstance();
