# @saastf/mcp-server

> **Get 2 FREE subdomains forever** with automatic DNS provisioning for your projects!

MCP (Model Context Protocol) server for [saas.tf](https://saas.tf) - the easiest way to get free subdomains for your demos, side projects, and development environments directly through Claude Code and other LLM-powered development tools.

[![npm version](https://badge.fury.io/js/%40saastf%2Fmcp-server.svg)](https://www.npmjs.com/package/@saastf/mcp-server)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## ✨ Features

- **2 FREE Subdomains Forever** - No credit card required
- **Automatic DNS** - Google Cloud DNS provisioning (~60 seconds)
- **Zero Configuration** - Works out of the box with Claude Code
- **Secure Authentication** - OS keychain storage for credentials
- **Smart Suggestions** - Get alternatives when names are taken
- **Quota Management** - Easy upgrade path to paid plans

## 🚀 Quick Start

### Installation for Claude Code

```bash
npm install -g @saastf/mcp-server
```

Then add to your Claude Code MCP settings:

```json
{
  "mcpServers": {
    "saastf": {
      "command": "saastf-mcp"
    }
  }
}
```

Restart Claude Code, and you're ready to go!

### First Subdomain in 60 Seconds

Once installed, just ask Claude:

```
"I need a subdomain for my demo app"
```

Claude will:
1. Check if you're authenticated (or help you register/login)
2. Check subdomain availability
3. Create your subdomain with DNS automatically configured
4. Give you your full domain (e.g., `myapp.saas.tf`)

## 📖 Available Tools

The MCP server provides 12 tools for complete subdomain management:

### Authentication (4 tools)

- `saastf_auth_status` - Check if you're logged in and see your quota
- `saastf_register` - Create a new account (2 FREE subdomains included!)
- `saastf_login` - Login with your credentials
- `saastf_logout` - Logout and clear stored credentials

### Subdomain Management (5 tools)

- `saastf_check_availability` - Check if a subdomain name is available
- `saastf_list_subdomains` - View all your subdomains
- `saastf_create_subdomain` - Create a new subdomain with automatic DNS
- `saastf_update_subdomain` - Update the IP address for a subdomain
- `saastf_delete_subdomain` - Delete a subdomain (frees up quota)

### Subscription Management (3 tools)

- `saastf_get_quota` - Check your current usage and remaining quota
- `saastf_get_plans` - View available subscription plans
- `saastf_create_checkout` - Get Stripe checkout URL to upgrade

## 📚 Resources

The server also provides 3 resources:

- `saastf://documentation` - Complete guide (markdown)
- `saastf://user/profile` - Your profile and subscription details (JSON)
- `saastf://user/subdomains` - All your subdomains (JSON)

## 💡 Example Conversations

### Create Your First Subdomain

```
You: "Create a subdomain myapp pointing to 192.168.1.100"

Claude: Let me check your authentication status...
        ✓ Not authenticated yet. Let me help you register!

        To get started with your 2 FREE subdomains, I'll need:
        - Email address
        - Password (min 8 characters)

        What email would you like to use?

You: "user@example.com and password MyPass123"

Claude: ✓ Account created successfully! Welcome to saas.tf!
        You now have 2 FREE subdomains available.

        Now creating myapp.saas.tf...
        ✓ Successfully created myapp.saas.tf → 192.168.1.100

        DNS will be active in ~60 seconds. You have 1 of 2 subdomains remaining.
```

### Check What Subdomains You Have

```
You: "List my subdomains"

Claude: Your subdomains (2/2 used):

        • myapp.saas.tf → 192.168.1.100
        • staging.saas.tf → 192.168.1.200

        Remaining: 0 subdomains

        💡 You've used all your free subdomains. Use saastf_get_plans
        to see upgrade options, or delete one to free up space.
```

### Update IP Address

```
You: "Update myapp to point to 10.0.0.5"

Claude: ✓ Updated myapp.saas.tf → 10.0.0.5
        DNS changes will propagate in ~60 seconds.
```

### Check Available Plans

```
You: "What plans are available?"

Claude: Available Subscription Plans:

        📦 Free
           Price: $0
           Quota: 2 subdomains

        📦 5 Subdomains Package
           Price: $10/year
           Quota: 7 subdomains
           Features:
             • All free tier features
             • Priority support

        📦 50 Subdomains Package
           Price: $50/year
           Quota: 52 subdomains
           Features:
             • All free tier features
             • Priority support

        Use saastf_create_checkout to upgrade your plan.
```

## 🔧 Technical Details

### Subdomain Rules

**Valid Format:**
- 3-63 characters
- Lowercase letters (a-z), numbers (0-9), hyphens (-)
- Must start and end with letter or number
- No consecutive hyphens

**Examples:**
- ✅ Valid: `myapp`, `demo-project`, `staging-api`, `test123`
- ❌ Invalid: `my` (too short), `MyApp` (uppercase), `demo--project` (consecutive hyphens)

### Reserved Names

150+ subdomains are reserved including:
- System: admin, root, system, support, help
- Technical: api, www, mail, ftp, ssh, cdn
- DNS: ns, ns1-4, dns, mx, mx1-2

### DNS Configuration

- **Provider**: Google Cloud DNS
- **Record Type**: A records (IPv4 only currently)
- **TTL**: 300 seconds (5 minutes)
- **Propagation**: ~60 seconds typically
- **Reliability**: 99.99% uptime SLA

### Security

- **JWT Authentication**: Secure token-based auth
- **OS Keychain Storage**: Uses macOS Keychain, Windows Credential Manager, Linux Secret Service
- **Encrypted Fallback**: Encrypted file storage if keychain unavailable
- **HTTPS Only**: All API communications encrypted
- **No Password Storage**: Only secure tokens stored locally

## 🎯 Common Use Cases

- **Development**: `dev.myapp.saas.tf`, `staging.myapp.saas.tf`
- **Demos**: `demo.myproject.saas.tf`
- **Side Projects**: `myblog.saas.tf`, `myapi.saas.tf`
- **Testing**: `test.myapp.saas.tf`
- **Webhooks**: `webhooks.myapp.saas.tf`
- **APIs**: `api.myservice.saas.tf`

## 📦 Pricing

### FREE Plan
- **2 subdomains** forever
- Perfect for hobbyists and side projects
- No credit card required
- All core features included

### PACKAGE_5 ($10/year)
- **7 total subdomains** (2 free + 5 additional)
- Great for multiple projects
- Priority support

### PACKAGE_50 ($50/year)
- **52 total subdomains** (2 free + 50 additional)
- Perfect for agencies and teams
- Priority support

## 🛠️ Advanced Configuration

### Custom MCP Settings

You can configure the MCP server with environment variables:

```json
{
  "mcpServers": {
    "saastf": {
      "command": "saastf-mcp",
      "env": {
        "SAASTF_API_URL": "https://api.saas.tf/api/v1"
      }
    }
  }
}
```

### Using with Other MCP Clients

The server works with any MCP-compatible client:

```bash
# Run the server directly
npx @saastf/mcp-server

# Or install globally
npm install -g @saastf/mcp-server
saastf-mcp
```

## 🐛 Troubleshooting

### Authentication Issues

```bash
# Clear stored credentials
# macOS
security delete-generic-password -s "saastf-mcp"

# Or delete the fallback file
rm -rf ~/.saastf-mcp
```

### Keychain Access Denied (macOS)

If you see keychain permission errors:
1. Open Keychain Access app
2. Find "saastf-mcp" in System or Login keychain
3. Right-click → Get Info → Access Control
4. Add Claude Code / your terminal to allowed applications

### Connection Issues

- Check your internet connection
- Verify `https://api.saas.tf` is accessible
- Check for firewall/proxy settings blocking the API

## 🤝 Contributing

Contributions are welcome! This is a fully open-source project.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details

## 🔗 Links

- **Website**: [https://saas.tf](https://saas.tf)
- **GitHub**: [https://github.com/saas-tf/mcp-server](https://github.com/saas-tf/mcp-server)
- **npm**: [https://www.npmjs.com/package/@saastf/mcp-server](https://www.npmjs.com/package/@saastf/mcp-server)
- **Issues**: [https://github.com/saas-tf/mcp-server/issues](https://github.com/saas-tf/mcp-server/issues)
- **Support**: support@saas.tf

## 🌟 Show Your Support

Give a ⭐️ if this project helped you!

---

**Made with ❤️ by the saas.tf team**

*Get your 2 FREE subdomains today at [saas.tf](https://saas.tf)!*
