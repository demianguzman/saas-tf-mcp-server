import { SaasTFClient, SaasTFError } from '../api/client.js';
import { validators, ValidationError } from '../utils/validators.js';
import { formatError } from '../utils/errors.js';
import { generateSubdomainSuggestions, formatSuggestions } from '../utils/suggestions.js';

export interface SubdomainToolResult {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

export class SubdomainTools {
  constructor(private client: SaasTFClient) {}

  /**
   * Check if a subdomain name is available
   */
  async checkAvailability(name: string): Promise<SubdomainToolResult> {
    try {
      // Validate format client-side first
      validators.subdomainName(name);

      const result = await this.client.checkAvailability(name);

      if (result.available) {
        return {
          success: true,
          message: `✓ "${name}.saas.tf" is available!`,
          data: {
            available: true,
            name,
            fullDomain: `${name}.saas.tf`,
          },
        };
      } else {
        const suggestions = result.suggestions || generateSubdomainSuggestions(name, 5);

        return {
          success: true,
          message: `"${name}.saas.tf" is already taken.\n\n${formatSuggestions(suggestions)}`,
          data: {
            available: false,
            name,
            suggestions,
          },
        };
      }
    } catch (error) {
      if (error instanceof ValidationError) {
        return {
          success: false,
          message: 'Invalid subdomain name',
          error: error.message,
        };
      }

      const saasError = error as SaasTFError;
      return {
        success: false,
        message: 'Failed to check availability',
        error: formatError(saasError, { subdomainName: name }),
      };
    }
  }

  /**
   * List all user's subdomains with quota info
   */
  async list(): Promise<SubdomainToolResult> {
    try {
      const { subdomains, quota } = await this.client.listSubdomains();

      if (subdomains.length === 0) {
        return {
          success: true,
          message: `You have no subdomains yet.\n\nYou can create ${quota.total} FREE subdomains. Use saastf_create_subdomain to get started!`,
          data: {
            subdomains: [],
            quota: {
              used: quota.used,
              total: quota.total,
              remaining: quota.remaining,
              plan: quota.plan,
            },
          },
        };
      }

      const subdomainList = subdomains
        .map((s) => `  • ${s.fullDomain} → ${s.ipAddress}${s.isActive ? '' : ' (inactive)'}`)
        .join('\n');

      return {
        success: true,
        message: `Your subdomains (${quota.used}/${quota.total} used):\n\n${subdomainList}\n\nRemaining: ${quota.remaining} subdomains`,
        data: {
          subdomains: subdomains.map((s) => ({
            id: s.id,
            name: s.name,
            fullDomain: s.fullDomain,
            ipAddress: s.ipAddress,
            isActive: s.isActive,
            createdAt: s.createdAt,
          })),
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
      return {
        success: false,
        message: 'Failed to list subdomains',
        error: formatError(saasError),
      };
    }
  }

  /**
   * Create a new subdomain
   */
  async create(name: string, ipAddress: string): Promise<SubdomainToolResult> {
    try {
      // Validate inputs
      validators.subdomainName(name);
      validators.ipAddress(ipAddress);

      const subdomain = await this.client.createSubdomain(name, ipAddress);

      // Get updated quota
      const quota = await this.client.getQuota();

      return {
        success: true,
        message: `✓ Successfully created ${subdomain.fullDomain} → ${subdomain.ipAddress}\n\nDNS will be active in ~60 seconds. You have ${quota.remaining} of ${quota.total} subdomains remaining.`,
        data: {
          subdomain: {
            id: subdomain.id,
            name: subdomain.name,
            fullDomain: subdomain.fullDomain,
            ipAddress: subdomain.ipAddress,
            isActive: subdomain.isActive,
            createdAt: subdomain.createdAt,
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
          message: 'Failed to create subdomain',
          error: error.message,
        };
      }

      const saasError = error as SaasTFError;
      return {
        success: false,
        message: 'Failed to create subdomain',
        error: formatError(saasError, { subdomainName: name }),
      };
    }
  }

  /**
   * Update subdomain IP address
   */
  async update(id: string, ipAddress: string): Promise<SubdomainToolResult> {
    try {
      // Validate IP
      validators.ipAddress(ipAddress);

      if (!id) {
        throw new ValidationError('Subdomain ID is required');
      }

      const subdomain = await this.client.updateSubdomain(id, ipAddress);

      return {
        success: true,
        message: `✓ Updated ${subdomain.fullDomain} → ${subdomain.ipAddress}\n\nDNS changes will propagate in ~60 seconds.`,
        data: {
          subdomain: {
            id: subdomain.id,
            name: subdomain.name,
            fullDomain: subdomain.fullDomain,
            ipAddress: subdomain.ipAddress,
            isActive: subdomain.isActive,
          },
        },
      };
    } catch (error) {
      if (error instanceof ValidationError) {
        return {
          success: false,
          message: 'Failed to update subdomain',
          error: error.message,
        };
      }

      const saasError = error as SaasTFError;
      return {
        success: false,
        message: 'Failed to update subdomain',
        error: formatError(saasError),
      };
    }
  }

  /**
   * Delete a subdomain
   */
  async delete(id: string): Promise<SubdomainToolResult> {
    try {
      if (!id) {
        throw new ValidationError('Subdomain ID is required');
      }

      // Get subdomain info before deleting (for confirmation message)
      const { subdomains } = await this.client.listSubdomains();
      const subdomain = subdomains.find((s) => s.id === id);

      await this.client.deleteSubdomain(id);

      // Get updated quota
      const quota = await this.client.getQuota();

      const domainName = subdomain ? subdomain.fullDomain : 'subdomain';

      return {
        success: true,
        message: `✓ Deleted ${domainName}\n\nDNS records removed. You now have ${quota.remaining} of ${quota.total} subdomains available.`,
        data: {
          deletedId: id,
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
          message: 'Failed to delete subdomain',
          error: error.message,
        };
      }

      const saasError = error as SaasTFError;
      return {
        success: false,
        message: 'Failed to delete subdomain',
        error: formatError(saasError),
      };
    }
  }
}
