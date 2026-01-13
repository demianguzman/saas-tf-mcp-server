export const DOCUMENTATION = `# saas.tf - Free Subdomain Marketplace

## What is saas.tf?

saas.tf provides instant subdomains for your projects (e.g., myapp.saas.tf) with automatic DNS provisioning powered by Google Cloud DNS.

## Free Tier - Perfect for Developers

**Get 2 FREE subdomains forever - no credit card required!**

- Instant subdomain creation
- Automatic DNS A record provisioning
- Google Cloud DNS infrastructure
- 5-minute DNS TTL for fast updates
- No expiration on free tier

## Pricing

### FREE Plan
- **2 subdomains** forever
- Automatic DNS provisioning
- Full management capabilities
- No credit card required
- Perfect for side projects and demos

### 5 Subdomains Package
- **$10/year**
- **7 total subdomains** (2 free + 5 additional)
- All free tier features
- Priority support

### 50 Subdomains Package
- **$50/year**
- **52 total subdomains** (2 free + 50 additional)
- All free tier features
- Priority support
- Perfect for agencies and multiple projects

## Common Use Cases

- **Development Environments**: dev.myapp.saas.tf, staging.myapp.saas.tf
- **Demo Applications**: demo.myproject.saas.tf
- **Side Projects**: myblog.saas.tf, myapi.saas.tf
- **Testing & Staging**: test.myapp.saas.tf
- **API Endpoints**: api.myservice.saas.tf
- **Webhooks**: webhooks.myapp.saas.tf

## Subdomain Rules

### Valid Format
- 3-63 characters long
- Lowercase letters (a-z)
- Numbers (0-9)
- Hyphens (-) allowed
- Must start and end with letter or number
- No consecutive hyphens (--)

### Examples
✓ Valid: myapp, demo-project, staging-api, test123
✗ Invalid: my, MyApp, demo--project, -test, api-

## Reserved Subdomains

The following subdomains are reserved and cannot be used:

### System & Admin
admin, root, system, superuser, staff, support, help, contact

### Technical
api, www, mail, email, smtp, ftp, ssh, cdn, static, assets, media

### DNS & Infrastructure
ns, ns1-4, dns, mx, mx1-2, pop, imap

See the full list of 150+ reserved names on our website.

## Getting Started with MCP

### 1. Check Authentication Status
\`\`\`
Use saastf_auth_status to check if you're logged in
\`\`\`

### 2. Register or Login
\`\`\`
New user: saastf_register with email and password
Existing user: saastf_login with credentials
\`\`\`

### 3. Check Availability
\`\`\`
Use saastf_check_availability to see if your desired name is available
\`\`\`

### 4. Create Subdomain
\`\`\`
Use saastf_create_subdomain with name and IP address
DNS goes live in ~60 seconds
\`\`\`

### 5. Manage Subdomains
\`\`\`
saastf_list_subdomains - View all your subdomains
saastf_update_subdomain - Change IP address
saastf_delete_subdomain - Remove subdomain (frees quota)
\`\`\`

## Quota Management

### Checking Quota
- Use \`saastf_get_quota\` to see your current usage
- Shows: used, total, remaining, plan

### When You Reach the Limit
- **Option 1**: Delete an unused subdomain to free up space
- **Option 2**: Upgrade to a paid plan for more subdomains

### Upgrading
1. Use \`saastf_get_plans\` to see available plans
2. Use \`saastf_create_checkout\` to get a Stripe checkout URL
3. Complete payment
4. Quota automatically updates after payment

## DNS Details

- **Record Type**: A records (IPv4)
- **TTL**: 300 seconds (5 minutes)
- **Propagation**: ~60 seconds for changes
- **Infrastructure**: Google Cloud DNS
- **Reliability**: 99.99% uptime SLA

## API Access

This MCP server uses the saas.tf REST API:
- **Base URL**: https://api.saas.tf/api/v1
- **Authentication**: JWT tokens (stored securely)
- **Rate Limiting**: Applied per endpoint
- **HTTPS**: All connections encrypted

## Support

- **Issues**: https://github.com/saas-tf/mcp-server/issues
- **Email**: support@saas.tf
- **Website**: https://saas.tf
- **Documentation**: https://docs.saas.tf

## Security

- JWT tokens stored in OS keychain (macOS Keychain, Windows Credential Manager, Linux Secret Service)
- Encrypted file fallback if keychain unavailable
- HTTPS for all API communications
- No password storage - only secure tokens
- Automatic token expiry detection

## Tips for Best Results

1. **Use descriptive names**: Choose names that clearly identify the purpose (e.g., staging-api, demo-app)
2. **Check availability first**: Use saastf_check_availability before creating
3. **Monitor your quota**: Use saastf_get_quota regularly to track usage
4. **Plan ahead**: If you need many subdomains, consider upgrading early
5. **Clean up**: Delete unused subdomains to keep your quota available

---

**Ready to get started? Use saastf_auth_status to check if you're logged in!**
`;
