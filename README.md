# Inflection Journey Reports Bot - MCP Client

A React + TypeScript chat application that integrates with OpenAI's function calling and MCP (Model Context Protocol) server tools for journey analytics and reporting.

## Quick Start

1. **Set up environment variables** in a `.env` file:
   ```env
   VITE_OPENAI_API_KEY=your_openai_api_key_here
   VITE_MCP_SERVER_URL=http://localhost:3001
   VITE_OPENAI_MODEL=gpt-4
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start development server**:
   ```bash
   npm run dev
   ```

4. **Open the application** at `http://localhost:5173`

## Documentation

- **[Setup & Usage Guide](docs/SETUP_GUIDE.md)** - Complete setup instructions and usage guide
- **[MCP Integration Summary](docs/MCP_INTEGRATION_SUMMARY.md)** - Technical implementation details

## Testing

- **[MCP Integration Tests](tests/test-mcp-integration.js)** - Test script for validating MCP functionality
- **Run tests**: `npm test` or `npm run test:mcp`

## Features

- **OpenAI Integration**: Uses GPT-4 with function calling capabilities
- **MCP Server Integration**: Lazy-loads tool specifications and invokes MCP server tools
- **Real-time Chat Interface**: Modern UI with loading states and error handling
- **Function Calling Flow**: Single `mcp_invoke` function with automatic tool spec fetching

## Supported MCP Tools

- `list_journeys` - List available customer journeys
- `get_journey_report` - Generate reports for specific journeys

## Project Structure

```
├── docs/                           # Documentation
│   ├── README.md                   # Documentation index
│   ├── SETUP_GUIDE.md              # Complete setup guide
│   └── MCP_INTEGRATION_SUMMARY.md  # Technical implementation
├── tests/                          # Test files
│   ├── README.md                   # Testing documentation
│   ├── test-mcp-integration.js     # MCP integration tests
│   └── run-tests.js                # Test runner
├── src/
│   ├── components/                 # React components
│   ├── hooks/                      # Custom React hooks
│   ├── utils/                      # Utility functions
│   ├── config/                     # Configuration
│   └── lib/                        # Library utilities
└── README.md                       # This file
```

## License

This project is part of the Inflection Journey Reports Bot system. 