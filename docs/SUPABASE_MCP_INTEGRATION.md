# Supabase MCP Server Integration

This project includes integration with the official Supabase MCP (Model Context Protocol) server, which provides programmatic access to your Supabase database and services.

## 🚀 Quick Start

1. **Setup the MCP server:**

   ```bash
   npm run supabase:mcp:setup
   ```

2. **Start the MCP server:**
   ```bash
   npm run supabase:mcp
   ```

## 🔧 Configuration

The MCP server uses your existing `.env` file configuration:

```env
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key  # Optional, for admin operations
```

## 🛠️ Available Capabilities

The Supabase MCP server provides tools for:

- **Database Schema Management**
  - Create, modify, and delete tables
  - Manage indexes and constraints
  - Schema introspection

- **Data Operations**
  - Query data with natural language
  - Insert, update, and delete records
  - Bulk operations

- **Edge Functions**
  - Deploy and manage Edge Functions
  - Test function execution
  - Monitor function logs

- **Real-time Features**
  - Set up real-time subscriptions
  - Manage channel configurations

## 💡 Development Workflow Integration

### With GitHub Copilot + VS Code

Since you're using GitHub Copilot, you can leverage the MCP server in several ways:

1. **Database Operations Scripts**: Use the MCP server to build database management scripts
2. **Testing Utilities**: Create test data setup and teardown scripts
3. **Migration Tools**: Build custom migration utilities
4. **Development Automation**: Automate common database tasks

### Example Usage Patterns

```bash
# Start the MCP server in the background
npm run supabase:mcp &

# Your development workflow can now interact with the MCP server
# through HTTP requests or direct MCP protocol communication
```

## 🔗 Integration Options

### 1. Standalone Development Server

Run the MCP server as a development utility:

```bash
npm run supabase:mcp
```

### 2. VS Code Extensions

Several VS Code extensions support MCP:

- Look for MCP-compatible database extensions
- Use with AI coding assistants that support MCP

### 3. Custom Tooling

Build your own tools that communicate with the MCP server:

- Database admin panels
- Custom migration tools
- Testing utilities

## 📋 Scripts Reference

| Script                        | Description                                   |
| ----------------------------- | --------------------------------------------- |
| `npm run supabase:mcp:setup`  | Install and configure the Supabase MCP server |
| `npm run supabase:mcp`        | Start the Supabase MCP server                 |
| `npm run supabase:generate`   | Generate Effect schemas (existing)            |
| `npm run supabase:keep-alive` | Keep Supabase connection alive (existing)     |
| `npm run supabase:export`     | Export database schema (existing)             |

## 🚀 Benefits for Your Project

1. **Enhanced Database Management**: Direct programmatic access to your songshare-effect database
2. **AI-Powered Development**: Use AI tools to help manage your Supabase resources
3. **Automated Workflows**: Build scripts that can interact with your database intelligently
4. **Better Testing**: Create more sophisticated database testing and setup scripts
5. **Schema Evolution**: Manage database schema changes more effectively

## 🔍 Troubleshooting

### Common Issues

1. **Environment Variables Not Found**
   - Ensure your `.env` file is in the project root
   - Check that `SUPABASE_URL` and `SUPABASE_ANON_KEY` are set

2. **Connection Issues**
   - Verify your Supabase project is active
   - Check network connectivity
   - Ensure your API keys are valid

3. **Permission Errors**
   - For admin operations, ensure `SUPABASE_SERVICE_ROLE_KEY` is provided
   - Check RLS (Row Level Security) policies if queries fail

### Getting Help

- Check the [Supabase MCP Server repository](https://github.com/supabase-community/supabase-mcp)
- Review Supabase documentation for API usage
- Use GitHub Copilot to help troubleshoot MCP integration issues

## 🎯 Next Steps

1. Run the setup: `npm run supabase:mcp:setup`
2. Start the server: `npm run supabase:mcp`
3. Experiment with database operations through the MCP interface
4. Build custom tooling that leverages the MCP server capabilities
5. Integrate with your existing development workflow
