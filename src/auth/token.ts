import jwt from 'jsonwebtoken';
import { AuthManager } from './manager.js';

interface TokenPayload {
  userId: string;
  email: string;
  iat: number;
  exp: number;
}

export class TokenManager {
  private authManager: AuthManager;
  private cachedToken: string | null = null;
  private cacheExpiry: number = 0;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor(authManager: AuthManager) {
    this.authManager = authManager;
  }

  async storeToken(token: string): Promise<void> {
    await this.authManager.storeToken(token);
    this.cachedToken = token;
    this.cacheExpiry = Date.now() + this.CACHE_TTL;
  }

  async getValidToken(): Promise<string | null> {
    // Check cache first
    if (this.cachedToken && Date.now() < this.cacheExpiry) {
      if (await this.isTokenValid(this.cachedToken)) {
        return this.cachedToken;
      }
    }

    // Load from storage
    const token = await this.authManager.getToken();
    if (!token) {
      return null;
    }

    // Validate token
    if (!(await this.isTokenValid(token))) {
      await this.clearToken();
      return null;
    }

    // Cache valid token
    this.cachedToken = token;
    this.cacheExpiry = Date.now() + this.CACHE_TTL;

    return token;
  }

  async clearToken(): Promise<void> {
    await this.authManager.clearToken();
    this.cachedToken = null;
    this.cacheExpiry = 0;
  }

  async isAuthenticated(): Promise<boolean> {
    const token = await this.getValidToken();
    return token !== null;
  }

  async getTokenPayload(): Promise<TokenPayload | null> {
    const token = await this.getValidToken();
    if (!token) {
      return null;
    }

    try {
      const decoded = jwt.decode(token) as TokenPayload;
      return decoded;
    } catch {
      return null;
    }
  }

  private async isTokenValid(token: string): Promise<boolean> {
    try {
      const decoded = jwt.decode(token) as TokenPayload;

      if (!decoded || !decoded.exp) {
        return false;
      }

      // Check if token is expired (with 60 second buffer)
      const expiryTime = decoded.exp * 1000; // Convert to milliseconds
      const now = Date.now();
      const buffer = 60 * 1000; // 60 seconds

      if (now >= expiryTime - buffer) {
        return false;
      }

      return true;
    } catch {
      return false;
    }
  }
}
