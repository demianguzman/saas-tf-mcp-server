export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export const validators = {
  /**
   * Validate subdomain name format
   * Rules:
   * - 3-63 characters
   * - Lowercase letters, numbers, hyphens only
   * - Must start and end with letter or number
   * - No consecutive hyphens
   */
  subdomainName(name: string): void {
    if (!name || typeof name !== 'string') {
      throw new ValidationError('Subdomain name is required');
    }

    if (name.length < 3 || name.length > 63) {
      throw new ValidationError('Subdomain name must be between 3 and 63 characters');
    }

    if (!/^[a-z0-9-]+$/.test(name)) {
      throw new ValidationError(
        'Subdomain name can only contain lowercase letters, numbers, and hyphens'
      );
    }

    if (!/^[a-z0-9]/.test(name) || !/[a-z0-9]$/.test(name)) {
      throw new ValidationError(
        'Subdomain name must start and end with a letter or number'
      );
    }

    if (name.includes('--')) {
      throw new ValidationError('Subdomain name cannot contain consecutive hyphens');
    }
  },

  /**
   * Validate IPv4 address format
   */
  ipAddress(ip: string): void {
    if (!ip || typeof ip !== 'string') {
      throw new ValidationError('IP address is required');
    }

    const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

    if (!ipv4Regex.test(ip)) {
      throw new ValidationError('Invalid IPv4 address format. Expected format: xxx.xxx.xxx.xxx');
    }
  },

  /**
   * Validate email format
   */
  email(email: string): void {
    if (!email || typeof email !== 'string') {
      throw new ValidationError('Email is required');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      throw new ValidationError('Invalid email format');
    }
  },

  /**
   * Validate password strength
   */
  password(password: string): void {
    if (!password || typeof password !== 'string') {
      throw new ValidationError('Password is required');
    }

    if (password.length < 8) {
      throw new ValidationError('Password must be at least 8 characters long');
    }

    if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
      throw new ValidationError('Password must contain at least one letter and one number');
    }
  },

  /**
   * Validate subscription plan
   */
  subscriptionPlan(plan: string): void {
    const validPlans = ['PACKAGE_5', 'PACKAGE_50'];

    if (!validPlans.includes(plan)) {
      throw new ValidationError(`Invalid plan. Must be one of: ${validPlans.join(', ')}`);
    }
  },
};
