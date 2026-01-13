import { SaasTFClient } from '../api/client.js';

export class UserDataResources {
  constructor(private client: SaasTFClient) {}

  /**
   * Get user profile with subscription information
   */
  async getUserProfile(): Promise<string> {
    try {
      const user = await this.client.getCurrentUser();
      const subscription = await this.client.getCurrentSubscription();
      const quota = await this.client.getQuota();

      const profile = {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName || null,
          lastName: user.lastName || null,
          createdAt: user.createdAt,
        },
        subscription: subscription
          ? {
              id: subscription.id,
              plan: subscription.plan,
              status: subscription.status,
              quota: subscription.quota,
              currentPeriodStart: subscription.currentPeriodStart,
              currentPeriodEnd: subscription.currentPeriodEnd,
            }
          : {
              plan: 'FREE',
              status: 'ACTIVE',
              quota: 2,
            },
        quota: {
          used: quota.used,
          total: quota.total,
          remaining: quota.remaining,
          canCreate: quota.canCreate,
        },
      };

      return JSON.stringify(profile, null, 2);
    } catch (error: any) {
      if (error.code === 'UNAUTHORIZED') {
        return JSON.stringify({
          error: 'Not authenticated',
          message: 'Please login to view your profile',
        }, null, 2);
      }

      return JSON.stringify({
        error: 'Failed to load profile',
        message: error.message || 'An error occurred',
      }, null, 2);
    }
  }

  /**
   * Get list of user's subdomains
   */
  async getUserSubdomains(): Promise<string> {
    try {
      const { subdomains, quota } = await this.client.listSubdomains();

      const data = {
        subdomains: subdomains.map((s) => ({
          id: s.id,
          name: s.name,
          fullDomain: s.fullDomain,
          ipAddress: s.ipAddress,
          isActive: s.isActive,
          createdAt: s.createdAt,
          expiresAt: s.expiresAt || null,
        })),
        quota: {
          used: quota.used,
          total: quota.total,
          remaining: quota.remaining,
          plan: quota.plan,
          canCreate: quota.canCreate,
        },
        summary: {
          totalSubdomains: subdomains.length,
          activeSubdomains: subdomains.filter((s) => s.isActive).length,
          inactiveSubdomains: subdomains.filter((s) => !s.isActive).length,
        },
      };

      return JSON.stringify(data, null, 2);
    } catch (error: any) {
      if (error.code === 'UNAUTHORIZED') {
        return JSON.stringify({
          error: 'Not authenticated',
          message: 'Please login to view your subdomains',
        }, null, 2);
      }

      return JSON.stringify({
        error: 'Failed to load subdomains',
        message: error.message || 'An error occurred',
      }, null, 2);
    }
  }
}
