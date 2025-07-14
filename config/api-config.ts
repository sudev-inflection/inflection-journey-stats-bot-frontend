// Configuration for API keys and MCP server
// In a real application, these would be environment variables

export const API_CONFIG = {
    // OpenAI API key - replace with your actual key
    OPENAI_API_KEY: import.meta.env.VITE_OPENAI_API_KEY || 'your-openai-api-key-here',

    // MCP Server configuration
    MCP_SERVER: {
        baseUrl: import.meta.env.VITE_MCP_SERVER_URL || 'http://localhost:3001',
    },

    // OpenAI model to use
    OPENAI_MODEL: import.meta.env.VITE_OPENAI_MODEL || 'gpt-4',
};

// Validate configuration
export function validateConfig() {
    const errors: string[] = [];

    if (!API_CONFIG.OPENAI_API_KEY || API_CONFIG.OPENAI_API_KEY === 'your-openai-api-key-here') {
        errors.push('OpenAI API key is not configured. Please set VITE_OPENAI_API_KEY environment variable.');
    }

    if (!API_CONFIG.MCP_SERVER.baseUrl) {
        errors.push('MCP Server URL is not configured. Please set VITE_MCP_SERVER_URL environment variable.');
    }

    return errors;
} 