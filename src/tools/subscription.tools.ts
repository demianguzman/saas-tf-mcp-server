import { SaasTFClient, SaasTFError } from '../api/client.js';
import { validators, ValidationError } from '../utils/validators.js';
import { formatError } from '../utils/errors.js';

export interface SubscriptionToolResult {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

export class SubscriptionTools {
  constructor(private client: SaasTFClient) {}

  /**
   * Get current quota usage and details
   */
  async getQuota(): Promise<SubscriptionToolResult> {
    try {
      const quota = await this.client.getQuota();

      let message = `Current Plan: ${quota.plan}\n\n`;
      message += `Subdomains: ${quota.used}/${quota.total} used\n`;
      message += `Remaining: ${quota.remaining} available\n`;

      if (quota.remaining === 0) {
        message += `\n⚠️ You've reached your limit. Use saastf_get_plans to see upgrade options, or delete an existing subdomain.`;
      } else if (quota.remaining <= 2 && quota.total > 2) {
        message += `\n💡 Running low on subdomains. Use saastf_get_plans to see upgrade options.`;
      }

      return {
        success: true,
        message,
        data: {
          quota: {
            used: quota.used,
            total: quota.total,
            remaining: quota.remaining,
            plan: quota.plan,
            canCreate: quota.canCreate,
          },
        },
      };
    } catch (error) {
      const saasError = error as SaasTFError;
      return {
        success: false,
        message: 'Failed to get quota information',
        error: formatError(saasError),
      };
    }
  }

  /**
   * Get available subscription plans
   */
  async getPlans(): Promise<SubscriptionToolResult> {
    try {
      const plans = await this.client.getPlans();

      let message = 'Available Subscription Plans:\n\n';

      for (const plan of plans) {
        message += `📦 ${plan.name}\n`;
        message += `   Price: ${plan.price}\n`;
        message += `   Quota: ${plan.quota} subdomains\n`;

        if (plan.features && plan.features.length > 0) {
          message += `   Features:\n`;
          for (const feature of plan.features) {
            message += `     • ${feature}\n`;
          }
        }
        message += '\n';
      }

      message += 'Use saastf_create_checkout to upgrade your plan.';

      return {
        success: true,
        message,
        data: {
          plans: plans.map((p) => ({
            name: p.name,
            price: p.price,
            quota: p.quota,
            features: p.features,
          })),
        },
      };
    } catch (error) {
      const saasError = error as SaasTFError;
      return {
        success: false,
        message: 'Failed to get subscription plans',
        error: formatError(saasError),
      };
    }
  }

  /**
   * Create Stripe checkout session for plan upgrade
   */
  async createCheckout(plan: string): Promise<SubscriptionToolResult> {
    try {
      // Validate plan
      validators.subscriptionPlan(plan);

      const { checkoutUrl, sessionId } = await this.client.createCheckout(
        plan as 'PACKAGE_5' | 'PACKAGE_50'
      );

      const planNames: Record<string, string> = {
        PACKAGE_5: '5 Subdomains Package ($10/year)',
        PACKAGE_50: '50 Subdomains Package ($50/year)',
      };

      return {
        success: true,
        message: `✓ Checkout session created for ${planNames[plan]}!\n\nComplete your purchase here:\n${checkoutUrl}\n\nAfter payment, your quota will be automatically updated.`,
        data: {
          checkoutUrl,
          sessionId,
          plan,
        },
      };
    } catch (error) {
      if (error instanceof ValidationError) {
        return {
          success: false,
          message: 'Invalid plan',
          error: error.message + '\n\nValid plans: PACKAGE_5, PACKAGE_50',
        };
      }

      const saasError = error as SaasTFError;
      return {
        success: false,
        message: 'Failed to create checkout session',
        error: formatError(saasError),
      };
    }
  }

  /**
   * Get current subscription details
   */
  async getCurrentSubscription(): Promise<SubscriptionToolResult> {
    try {
      const subscription = await this.client.getCurrentSubscription();

      if (!subscription) {
        return {
          success: true,
          message: 'You are on the FREE plan (2 subdomains).\n\nUse saastf_get_plans to see upgrade options.',
          data: {
            subscription: null,
            plan: 'FREE',
            quota: 2,
          },
        };
      }

      let message = `Current Subscription:\n\n`;
      message += `Plan: ${subscription.plan}\n`;
      message += `Status: ${subscription.status}\n`;
      message += `Quota: ${subscription.quota} subdomains\n`;

      if (subscription.currentPeriodEnd) {
        const endDate = new Date(subscription.currentPeriodEnd);
        message += `Renews: ${endDate.toLocaleDateString()}\n`;
      }

      return {
        success: true,
        message,
        data: {
          subscription: {
            id: subscription.id,
            plan: subscription.plan,
            status: subscription.status,
            quota: subscription.quota,
            currentPeriodStart: subscription.currentPeriodStart,
            currentPeriodEnd: subscription.currentPeriodEnd,
          },
        },
      };
    } catch (error) {
      const saasError = error as SaasTFError;
      return {
        success: false,
        message: 'Failed to get subscription details',
        error: formatError(saasError),
      };
    }
  }
}
