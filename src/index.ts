#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { AuthManager } from './auth/manager.js';
import { TokenManager } from './auth/token.js';
import { SaasTFClient } from './api/client.js';
import { AuthTools } from './tools/auth.tools.js';
import { SubdomainTools } from './tools/subdomain.tools.js';
import { SubscriptionTools } from './tools/subscription.tools.js';
import { UserDataResources } from './resources/user-data.js';
import { DOCUMENTATION } from './resources/documentation.js';

// Initialize components
const authManager = new AuthManager();
const tokenManager = new TokenManager(authManager);
const client = new SaasTFClient(tokenManager);

const authTools = new AuthTools(client);
const subdomainTools = new SubdomainTools(client);
const subscriptionTools = new SubscriptionTools(client);
const userDataResources = new UserDataResources(client);

// Create MCP server
const server = new Server(
  {
    name: '@saastf/mcp-server',
    version: '0.1.0',
  },
  {
    capabilities: {
      tools: {},
      resources: {},
    },
  }
);

// Register tool handlers
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      // Authentication Tools
      {
        name: 'saastf_auth_status',
        description:
          'Check authentication status with saas.tf. Returns user info and quota if authenticated, or indicates authentication needed.',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'saastf_register',
        description:
          'Register a new saas.tf account. Get 2 FREE subdomains immediately! Only email and password required. Optional: firstName, lastName.',
        inputSchema: {
          type: 'object',
          properties: {
            email: {
              type: 'string',
              description: 'Email address for the account',
            },
            password: {
              type: 'string',
              description: 'Password (min 8 characters, must include letter and number)',
            },
            firstName: {
              type: 'string',
              description: 'First name (optional)',
            },
            lastName: {
              type: 'string',
              description: 'Last name (optional)',
            },
          },
          required: ['email', 'password'],
        },
      },
      {
        name: 'saastf_login',
        description: 'Login to your saas.tf account with email and password.',
        inputSchema: {
          type: 'object',
          properties: {
            email: {
              type: 'string',
              description: 'Email address',
            },
            password: {
              type: 'string',
              description: 'Password',
            },
          },
          required: ['email', 'password'],
        },
      },
      {
        name: 'saastf_logout',
        description: 'Logout from saas.tf and clear stored credentials.',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },

      // Subdomain Tools
      {
        name: 'saastf_check_availability',
        description:
          'Check if a subdomain name is available on saas.tf (e.g., myapp.saas.tf). Returns availability status and helpful suggestions if taken.',
        inputSchema: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Subdomain name to check (without .saas.tf suffix)',
            },
          },
          required: ['name'],
        },
      },
      {
        name: 'saastf_list_subdomains',
        description:
          'List all your subdomains on saas.tf with usage quota and statistics.',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'saastf_create_subdomain',
        description:
          'Create a new subdomain on saas.tf. Automatically provisions DNS A record pointing to your IP. DNS goes live in ~60 seconds.',
        inputSchema: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description:
                'Subdomain name (3-63 chars, lowercase, alphanumeric + hyphens, must start/end with letter or number)',
            },
            ipAddress: {
              type: 'string',
              description: 'IPv4 address to point the subdomain to (e.g., 192.168.1.1)',
            },
          },
          required: ['name', 'ipAddress'],
        },
      },
      {
        name: 'saastf_update_subdomain',
        description:
          'Update the IP address for an existing subdomain. DNS changes propagate automatically in ~60 seconds.',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Subdomain ID (from saastf_list_subdomains)',
            },
            ipAddress: {
              type: 'string',
              description: 'New IPv4 address',
            },
          },
          required: ['id', 'ipAddress'],
        },
      },
      {
        name: 'saastf_delete_subdomain',
        description:
          'Delete a subdomain. DNS records are removed automatically. This frees up quota for new subdomains.',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Subdomain ID to delete (from saastf_list_subdomains)',
            },
          },
          required: ['id'],
        },
      },

      // Subscription Tools
      {
        name: 'saastf_get_quota',
        description:
          'Get your current subdomain quota, usage, and plan details. Shows how many subdomains you have available.',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'saastf_get_plans',
        description:
          'Get available subscription plans and pricing. Upgrade to get more subdomains! Plans: FREE (2), PACKAGE_5 ($10/year for 7), PACKAGE_50 ($50/year for 52).',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'saastf_create_checkout',
        description:
          'Create a Stripe checkout session to upgrade your plan. Returns a checkout URL to complete payment. After payment, quota updates automatically.',
        inputSchema: {
          type: 'object',
          properties: {
            plan: {
              type: 'string',
              enum: ['PACKAGE_5', 'PACKAGE_50'],
              description: 'Plan to upgrade to: PACKAGE_5 (7 subdomains, $10/year) or PACKAGE_50 (52 subdomains, $50/year)',
            },
          },
          required: ['plan'],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      // Authentication Tools
      case 'saastf_auth_status': {
        const result = await authTools.status();
        return {
          content: [
            {
              type: 'text',
              text: result.success ? result.message : `Error: ${result.error}`,
            },
          ],
          isError: !result.success,
        };
      }

      case 'saastf_register': {
        const { email, password, firstName, lastName } = args as {
          email: string;
          password: string;
          firstName?: string;
          lastName?: string;
        };
        const result = await authTools.register(email, password, firstName, lastName);
        return {
          content: [
            {
              type: 'text',
              text: result.success ? result.message : `Error: ${result.error}`,
            },
          ],
          isError: !result.success,
        };
      }

      case 'saastf_login': {
        const { email, password } = args as { email: string; password: string };
        const result = await authTools.login(email, password);
        return {
          content: [
            {
              type: 'text',
              text: result.success ? result.message : `Error: ${result.error}`,
            },
          ],
          isError: !result.success,
        };
      }

      case 'saastf_logout': {
        const result = await authTools.logout();
        return {
          content: [
            {
              type: 'text',
              text: result.success ? result.message : `Error: ${result.error}`,
            },
          ],
          isError: !result.success,
        };
      }

      // Subdomain Tools
      case 'saastf_check_availability': {
        const { name: subdomainName } = args as { name: string };
        const result = await subdomainTools.checkAvailability(subdomainName);
        return {
          content: [
            {
              type: 'text',
              text: result.success ? result.message : `Error: ${result.error}`,
            },
          ],
          isError: !result.success,
        };
      }

      case 'saastf_list_subdomains': {
        const result = await subdomainTools.list();
        return {
          content: [
            {
              type: 'text',
              text: result.success ? result.message : `Error: ${result.error}`,
            },
          ],
          isError: !result.success,
        };
      }

      case 'saastf_create_subdomain': {
        const { name: subdomainName, ipAddress } = args as {
          name: string;
          ipAddress: string;
        };
        const result = await subdomainTools.create(subdomainName, ipAddress);
        return {
          content: [
            {
              type: 'text',
              text: result.success ? result.message : `Error: ${result.error}`,
            },
          ],
          isError: !result.success,
        };
      }

      case 'saastf_update_subdomain': {
        const { id, ipAddress } = args as { id: string; ipAddress: string };
        const result = await subdomainTools.update(id, ipAddress);
        return {
          content: [
            {
              type: 'text',
              text: result.success ? result.message : `Error: ${result.error}`,
            },
          ],
          isError: !result.success,
        };
      }

      case 'saastf_delete_subdomain': {
        const { id } = args as { id: string };
        const result = await subdomainTools.delete(id);
        return {
          content: [
            {
              type: 'text',
              text: result.success ? result.message : `Error: ${result.error}`,
            },
          ],
          isError: !result.success,
        };
      }

      // Subscription Tools
      case 'saastf_get_quota': {
        const result = await subscriptionTools.getQuota();
        return {
          content: [
            {
              type: 'text',
              text: result.success ? result.message : `Error: ${result.error}`,
            },
          ],
          isError: !result.success,
        };
      }

      case 'saastf_get_plans': {
        const result = await subscriptionTools.getPlans();
        return {
          content: [
            {
              type: 'text',
              text: result.success ? result.message : `Error: ${result.error}`,
            },
          ],
          isError: !result.success,
        };
      }

      case 'saastf_create_checkout': {
        const { plan } = args as { plan: string };
        const result = await subscriptionTools.createCheckout(plan);
        return {
          content: [
            {
              type: 'text',
              text: result.success ? result.message : `Error: ${result.error}`,
            },
          ],
          isError: !result.success,
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error: any) {
    return {
      content: [
        {
          type: 'text',
          text: `Error executing tool: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

// Register resource handlers
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: [
      {
        uri: 'saastf://documentation',
        name: 'saas.tf Documentation',
        description: 'Complete guide to using saas.tf subdomain marketplace',
        mimeType: 'text/markdown',
      },
      {
        uri: 'saastf://user/profile',
        name: 'Your saas.tf Profile',
        description: 'Your account details, quota, and active subscriptions',
        mimeType: 'application/json',
      },
      {
        uri: 'saastf://user/subdomains',
        name: 'Your Subdomains',
        description: 'All your active subdomains with DNS details',
        mimeType: 'application/json',
      },
    ],
  };
});

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;

  try {
    switch (uri) {
      case 'saastf://documentation':
        return {
          contents: [
            {
              uri,
              mimeType: 'text/markdown',
              text: DOCUMENTATION,
            },
          ],
        };

      case 'saastf://user/profile': {
        const profileJson = await userDataResources.getUserProfile();
        return {
          contents: [
            {
              uri,
              mimeType: 'application/json',
              text: profileJson,
            },
          ],
        };
      }

      case 'saastf://user/subdomains': {
        const subdomainsJson = await userDataResources.getUserSubdomains();
        return {
          contents: [
            {
              uri,
              mimeType: 'application/json',
              text: subdomainsJson,
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown resource: ${uri}`);
    }
  } catch (error: any) {
    throw new Error(`Failed to read resource ${uri}: ${error.message}`);
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error('saas.tf MCP server running on stdio');
  console.error('Get 2 FREE subdomains at https://saas.tf');
}

main().catch((error) => {
  console.error('Fatal error in main():', error);
  process.exit(1);
});
