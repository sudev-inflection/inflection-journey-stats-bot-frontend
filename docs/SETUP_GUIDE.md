# Inflection Journey Reports Bot - MCP Client Setup Guide

A React + TypeScript chat application that integrates with OpenAI's function calling and MCP (Model Context Protocol) server tools for journey analytics and reporting.

## Features

- **OpenAI Integration**: Uses GPT-4 with function calling capabilities
- **MCP Server Integration**: Lazy-loads tool specifications and invokes MCP server tools
- **Real-time Chat Interface**: Modern UI with loading states and error handling
- **Function Calling Flow**: 
  - Single `mcp_invoke` function registration
  - Automatic tool spec fetching
  - Tool invocation with result handling
  - Follow-up completion for final responses

## Supported MCP Tools

The application is configured to work with these MCP server tools:
- `list_journeys` - List available customer journeys
- `get_journey_report` - Generate reports for specific journeys

## Setup

### 1. Environment Variables

Create a `.env` file in the root directory:

```env
VITE_OPENAI_API_KEY=your_openai_api_key_here
VITE_MCP_SERVER_URL=http://localhost:3001
VITE_OPENAI_MODEL=gpt-4
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
```

### 3. Start Development Server

```bash
npm run dev
# or
yarn dev
```

## Architecture

### Core Components

1. **MCP Client** (`utils/mcp-client.ts`)
   - Handles communication with MCP server
   - Fetches tool specifications
   - Invokes tools with arguments

2. **OpenAI Client** (`utils/openai-client.ts`)
   - Manages OpenAI API communication
   - Implements function calling with `mcp_invoke`
   - Handles follow-up messages

3. **Chat Hook** (`hooks/useChat.ts`)
   - Manages chat state and message flow
   - Coordinates between OpenAI and MCP clients
   - Handles loading states and errors

4. **Chat Interface** (`components/ChatInterface.tsx`)
   - Main UI component
   - Displays messages with loading indicators
   - Shows configuration errors

### Function Calling Flow

1. **User sends message** → Chat interface
2. **OpenAI processes** → May return function call for `mcp_invoke`
3. **If function call**:
   - Fetch tool spec from MCP server
   - Invoke tool with arguments
   - Add function result to chat history
   - Send follow-up to OpenAI for final response
4. **Display final response** → User sees complete answer

## API Configuration

### MCP Server Endpoints

The application expects these endpoints on your MCP server:

- `GET /tools/{tool}/spec` - Fetch tool specification
- `POST /tools/{tool}` - Invoke tool with arguments

### OpenAI Configuration

- Uses GPT-4 by default (configurable)
- Implements single `mcp_invoke` function
- Automatic function calling enabled

## Error Handling

The application includes comprehensive error handling:

- **Configuration Errors**: Shows setup issues on startup
- **API Errors**: Displays user-friendly error messages
- **Network Errors**: Handles connection issues gracefully
- **Loading States**: Visual feedback during operations

## Development

### Project Structure

```
src/
├── components/
│   ├── ChatInterface.tsx      # Main chat UI
│   └── ui/                    # Reusable UI components
├── hooks/
│   └── useChat.ts            # Chat state management
├── utils/
│   ├── mcp-client.ts         # MCP server communication
│   └── openai-client.ts      # OpenAI API client
├── config/
│   └── api-config.ts         # Configuration management
└── lib/
    └── utils.ts              # Utility functions
```

### Adding New MCP Tools

1. Update the `enum` in `openai-client.ts`:
   ```typescript
   tool: {
     type: "string",
     enum: ["list_journeys", "get_journey_report", "your_new_tool"]
   }
   ```

2. Ensure your MCP server implements the tool endpoints

3. The application will automatically handle the new tool

## CORS Configuration

Ensure your MCP server allows requests from the frontend:

```javascript
// Example CORS configuration for MCP server
app.use(cors({
  origin: 'http://localhost:5173', // Vite dev server
  credentials: true
}));
```

## Production Deployment

1. Set production environment variables
2. Build the application: `npm run build`
3. Deploy the `dist` folder
4. Configure CORS for your production domain

## Troubleshooting

### Common Issues

1. **"OpenAI API key is not configured"**
   - Check your `.env` file
   - Ensure `VITE_OPENAI_API_KEY` is set

2. **"MCP Server URL is not configured"**
   - Verify `VITE_MCP_SERVER_URL` in `.env`
   - Ensure MCP server is running

3. **CORS errors**
   - Check MCP server CORS configuration
   - Verify server is accessible from frontend

4. **Function call failures**
   - Check MCP server logs
   - Verify tool endpoints are working
   - Check tool specification format

## License

This project is part of the Inflection Journey Reports Bot system. 