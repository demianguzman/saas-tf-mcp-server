import { SaasTFClient, SaasTFError } from '../api/client.js';
import { validators, ValidationError } from '../utils/validators.js';
import { formatError } from '../utils/errors.js';

export interface AuthToolResult {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

export class AuthTools {
  constructor(private client: SaasTFClient) {}

  /**
   * Check authentication status and get current user info
   */
  async status(): Promise<AuthToolResult> {
    try {
      const user = await this.client.getCurrentUser();
      const quota = await this.client.getQuota();

      return {
        success: true,
        message: `Authenticated as ${user.email}`,
        data: {
          authenticated: true,
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
          },
          quota: {
            used: quota.used,
            total: quota.total,
            remaining: quota.remaining,
            plan: quota.plan,
          },
        },
      };
    } catch (error) {
      const saasError = error as SaasTFError;
      if (saasError.code === 'UNAUTHORIZED' || saasError.code === 'NETWORK_ERROR') {
        return {
          success: true,
          message: 'Not authenticated',
          data: {
            authenticated: false,
            message: 'Please login or register to use saas.tf',
          },
        };
      }

      return {
        success: false,
        message: 'Failed to check authentication status',
        error: formatError(saasError),
      };
    }
  }

  /**
   * Register a new user account
   */
  async register(
    email: string,
    password: string,
    firstName?: string,
    lastName?: string
  ): Promise<AuthToolResult> {
    try {
      // Validate inputs
      validators.email(email);
      validators.password(password);

      const { user } = await this.client.register(email, password, firstName, lastName);

      return {
        success: true,
        message: `✓ Account created successfully! Welcome to saas.tf, ${user.firstName || user.email}!\n\nYou now have 2 FREE subdomains available. Use saastf_create_subdomain to get started.`,
        data: {
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
          },
        },
      };
    } catch (error) {
      if (error instanceof ValidationError) {
        return {
          success: false,
          message: 'Registration failed',
          error: error.message,
        };
      }

      const saasError = error as SaasTFError;
      return {
        success: false,
        message: 'Registration failed',
        error: formatError(saasError),
      };
    }
  }

  /**
   * Login with email and password
   */
  async login(email: string, password: string): Promise<AuthToolResult> {
    try {
      // Validate inputs
      validators.email(email);

      if (!password) {
        throw new ValidationError('Password is required');
      }

      const { user } = await this.client.login(email, password);
      const quota = await this.client.getQuota();

      return {
        success: true,
        message: `✓ Successfully logged in as ${user.email}\n\nYou have ${quota.remaining} of ${quota.total} subdomains available.`,
        data: {
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
          },
          quota: {
            used: quota.used,
            total: quota.total,
            remaining: quota.remaining,
            plan: quota.plan,
          },
        },
      };
    } catch (error) {
      if (error instanceof ValidationError) {
        return {
          success: false,
          message: 'Login failed',
          error: error.message,
        };
      }

      const saasError = error as SaasTFError;

      if (saasError.code === 'UNAUTHORIZED') {
        return {
          success: false,
          message: 'Login failed',
          error: 'Invalid email or password. Please check your credentials and try again.',
        };
      }

      return {
        success: false,
        message: 'Login failed',
        error: formatError(saasError),
      };
    }
  }

  /**
   * Logout and clear stored credentials
   */
  async logout(): Promise<AuthToolResult> {
    try {
      await this.client.logout();

      return {
        success: true,
        message: '✓ Successfully logged out. Your credentials have been cleared.',
      };
    } catch {
      // Even if API call fails, we should clear local credentials
      return {
        success: true,
        message: '✓ Logged out locally. Your credentials have been cleared.',
        data: {
          note: 'API logout may have failed, but local credentials were cleared successfully.',
        },
      };
    }
  }
}
