import { SaasTFError } from '../api/client.js';
import { generateSubdomainSuggestions, formatSuggestions } from './suggestions.js';

/**
 * Format saas.tf API errors into user-friendly messages
 */
export function formatError(error: SaasTFError, context?: { subdomainName?: string }): string {
  switch (error.code) {
    case 'QUOTA_EXCEEDED':
      return formatQuotaExceededError(error);

    case 'SUBDOMAIN_TAKEN':
      return formatSubdomainTakenError(error, context?.subdomainName);

    case 'INVALID_SUBDOMAIN_NAME':
      return formatInvalidSubdomainError(error);

    case 'INVALID_IP_ADDRESS':
      return `Invalid IP address: ${error.message}\n\nExpected format: xxx.xxx.xxx.xxx (e.g., 192.168.1.1)`;

    case 'RESERVED_SUBDOMAIN':
      return `This subdomain name is reserved and cannot be used.\n\n${error.message}`;

    case 'UNAUTHORIZED':
      return 'Authentication required. Please login with your saas.tf credentials.';

    case 'FORBIDDEN':
      return `Access denied: ${error.message}`;

    case 'NOT_FOUND':
      return `Resource not found: ${error.message}`;

    case 'VALIDATION_ERROR':
      return `Validation error: ${error.message}`;

    case 'CONFLICT':
      return `Conflict: ${error.message}`;

    case 'DNS_CREATE_FAILED':
    case 'DNS_UPDATE_FAILED':
    case 'DNS_DELETE_FAILED':
      return `DNS operation failed: ${error.message}\n\nPlease try again. If the problem persists, contact support.`;

    case 'NETWORK_ERROR':
      return 'Network error. Please check your internet connection and try again.';

    case 'TIMEOUT':
      return 'Request timed out. Please try again.';

    case 'RATE_LIMIT_EXCEEDED':
      return 'Rate limit exceeded. Please wait a moment and try again.';

    default:
      return error.message || 'An unexpected error occurred. Please try again.';
  }
}

function formatQuotaExceededError(error: SaasTFError): string {
  let message = `You've reached your subdomain limit.`;

  if (error.upgradeInfo) {
    const { currentPlan, currentQuota, suggestedPlans } = error.upgradeInfo;

    message += `\n\nCurrent plan: ${currentPlan} (${currentQuota} subdomains)`;

    if (suggestedPlans && suggestedPlans.length > 0) {
      message += '\n\nUpgrade options:';
      for (const plan of suggestedPlans) {
        message += `\n  • ${plan.name}: ${plan.quota} subdomains for ${plan.price}`;
      }
      message += '\n\nUse saastf_create_checkout to upgrade, or delete an existing subdomain to free up space.';
    }
  } else {
    message += '\n\nOptions:\n  • Delete an existing subdomain to free up space\n  • Upgrade your plan for more subdomains (use saastf_get_plans to see options)';
  }

  return message;
}

function formatSubdomainTakenError(_error: SaasTFError, attemptedName?: string): string {
  let message = `This subdomain is already taken.`;

  if (attemptedName) {
    const suggestions = generateSubdomainSuggestions(attemptedName, 5);
    message += `\n\n${formatSuggestions(suggestions)}`;
  }

  return message;
}

function formatInvalidSubdomainError(error: SaasTFError): string {
  return `Invalid subdomain name: ${error.message}

Subdomain rules:
  • 3-63 characters
  • Lowercase letters, numbers, and hyphens only
  • Must start and end with a letter or number
  • No consecutive hyphens

Examples: myapp, demo-project, staging-api`;
}

/**
 * Check if an error requires re-authentication
 */
export function isAuthError(error: SaasTFError): boolean {
  return error.code === 'UNAUTHORIZED' || error.code === 'FORBIDDEN';
}

/**
 * Check if an error is recoverable by the user
 */
export function isRecoverableError(error: SaasTFError): boolean {
  const unrecoverableErrors = [
    'NETWORK_ERROR',
    'TIMEOUT',
    'DNS_CREATE_FAILED',
    'DNS_UPDATE_FAILED',
    'DNS_DELETE_FAILED',
  ];

  return !unrecoverableErrors.includes(error.code);
}
