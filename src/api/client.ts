import axios, { AxiosInstance, AxiosError } from 'axios';
import { TokenManager } from '../auth/token.js';

export interface SaasTFError {
  code: string;
  message: string;
  timestamp?: string;
  upgradeInfo?: {
    currentPlan: string;
    currentQuota: number;
    suggestedPlans: Array<{
      name: string;
      quota: number;
      price: string;
    }>;
  };
}

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  createdAt: string;
}

export interface Subdomain {
  id: string;
  name: string;
  fullDomain: string;
  ipAddress: string;
  isActive: boolean;
  createdAt: string;
  expiresAt?: string;
}

export interface Subscription {
  id: string;
  plan: string;
  status: string;
  quota: number;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
}

export interface QuotaInfo {
  used: number;
  total: number;
  remaining: number;
  plan: string;
  canCreate: boolean;
}

export interface AvailabilityResponse {
  available: boolean;
  reason?: string;
  suggestions?: string[];
}

export class SaasTFClient {
  private baseURL = 'https://api.saas.tf/api/v1';
  private client: AxiosInstance;
  private tokenManager: TokenManager;

  constructor(tokenManager: TokenManager) {
    this.tokenManager = tokenManager;
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor for authentication
    this.client.interceptors.request.use(async (config) => {
      const token = await this.tokenManager.getValidToken();
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Clear invalid token
          await this.tokenManager.clearToken();
        }
        return Promise.reject(this.transformError(error));
      }
    );
  }

  private transformError(error: AxiosError): SaasTFError {
    if (error.response?.data && typeof error.response.data === 'object') {
      const data = error.response.data as any;
      return {
        code: data.error?.code || 'UNKNOWN_ERROR',
        message: data.error?.message || error.message,
        timestamp: data.error?.timestamp,
        upgradeInfo: data.error?.upgradeInfo,
      };
    }

    if (error.code === 'ECONNABORTED') {
      return {
        code: 'TIMEOUT',
        message: 'Request timed out. Please try again.',
      };
    }

    if (!error.response) {
      return {
        code: 'NETWORK_ERROR',
        message: 'Network error. Please check your connection.',
      };
    }

    return {
      code: 'UNKNOWN_ERROR',
      message: error.message || 'An unexpected error occurred',
    };
  }

  // Authentication methods
  async register(
    email: string,
    password: string,
    firstName?: string,
    lastName?: string
  ): Promise<{ user: User; token: string }> {
    const response = await this.client.post('/auth/register', {
      email,
      password,
      firstName,
      lastName,
    });

    const { user, token } = response.data;
    await this.tokenManager.storeToken(token);

    return { user, token };
  }

  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    const response = await this.client.post('/auth/login', {
      email,
      password,
    });

    const { user, token } = response.data;
    await this.tokenManager.storeToken(token);

    return { user, token };
  }

  async getCurrentUser(): Promise<User> {
    const response = await this.client.get('/auth/me');
    return response.data.user;
  }

  async logout(): Promise<void> {
    try {
      await this.client.post('/auth/logout');
    } finally {
      await this.tokenManager.clearToken();
    }
  }

  // Subdomain methods
  async checkAvailability(name: string): Promise<AvailabilityResponse> {
    const response = await this.client.get(`/subdomains/check/${name}`);
    return response.data;
  }

  async listSubdomains(): Promise<{ subdomains: Subdomain[]; quota: QuotaInfo }> {
    const response = await this.client.get('/subdomains');
    return response.data;
  }

  async createSubdomain(name: string, ipAddress: string): Promise<Subdomain> {
    const response = await this.client.post('/subdomains', {
      name,
      ipAddress,
    });
    return response.data.subdomain;
  }

  async updateSubdomain(id: string, ipAddress: string): Promise<Subdomain> {
    const response = await this.client.patch(`/subdomains/${id}`, {
      ipAddress,
    });
    return response.data.subdomain;
  }

  async deleteSubdomain(id: string): Promise<void> {
    await this.client.delete(`/subdomains/${id}`);
  }

  // Subscription methods
  async getQuota(): Promise<QuotaInfo> {
    const response = await this.client.get('/subscriptions/quota');
    return response.data.quota;
  }

  async getPlans(): Promise<Array<{
    name: string;
    price: string;
    quota: number;
    features: string[];
  }>> {
    const response = await this.client.get('/subscriptions/plans');
    return response.data.plans;
  }

  async createCheckout(plan: 'PACKAGE_5' | 'PACKAGE_50'): Promise<{
    checkoutUrl: string;
    sessionId: string;
  }> {
    const response = await this.client.post('/subscriptions/checkout', {
      plan,
    });
    return response.data;
  }

  async getCurrentSubscription(): Promise<Subscription | null> {
    try {
      const response = await this.client.get('/subscriptions/current');
      return response.data.subscription;
    } catch (error: any) {
      if (error.code === 'NOT_FOUND') {
        return null;
      }
      throw error;
    }
  }
}
