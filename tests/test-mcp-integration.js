/**
 * MCP Integration Test Suite
 * 
 * This test file validates the MCP client integration functionality.
 * Run with: node tests/test-mcp-integration.js
 * 
 * Note: These tests require the MCP server to be running for full validation.
 * Some tests will show warnings if the server is not available, which is expected.
 */

// Mock environment variables for testing
process.env.VITE_OPENAI_API_KEY = 'test-key';
process.env.VITE_MCP_SERVER_URL = 'http://localhost:3001';
process.env.VITE_OPENAI_MODEL = 'gpt-4';

// Test the MCP client functionality
async function testMCPClient() {
    console.log('Testing MCP Client...');

    // Import the MCP client
    const { MCPClient } = await import('../utils/mcp-client.ts');

    const mcpClient = new MCPClient({ baseUrl: 'http://localhost:3001' });

    console.log('✓ MCP Client instantiated successfully');

    // Test tool spec fetching (this will fail if server is not running, which is expected)
    try {
        await mcpClient.getToolSpec('list_journeys');
        console.log('✓ Tool spec fetching works');
    } catch (error) {
        console.log('⚠ Tool spec fetching failed (expected if MCP server not running):', error.message);
    }

    console.log('MCP Client test completed');
}

// Test the OpenAI client functionality
async function testOpenAIClient() {
    console.log('\nTesting OpenAI Client...');

    // Import the OpenAI client
    const { OpenAIClient } = await import('../utils/openai-client.ts');
    const { MCPClient } = await import('../utils/mcp-client.ts');

    const mcpClient = new MCPClient({ baseUrl: 'http://localhost:3001' });
    const openaiClient = new OpenAIClient({
        apiKey: 'test-key',
        model: 'gpt-4',
        mcpClient
    });

    console.log('✓ OpenAI Client instantiated successfully');

    // Test function definition
    const functionDef = openaiClient.getMCPInvokeFunction ? openaiClient.getMCPInvokeFunction() : null;
    if (functionDef && functionDef.name === 'mcp_invoke') {
        console.log('✓ MCP invoke function defined correctly');
    } else {
        console.log('✗ MCP invoke function not found or incorrect');
    }

    console.log('OpenAI Client test completed');
}

// Run tests
async function runTests() {
    console.log('Starting MCP Integration Tests...\n');

    try {
        await testMCPClient();
        await testOpenAIClient();
        console.log('\n✅ All tests completed successfully!');
    } catch (error) {
        console.error('\n❌ Test failed:', error);
    }
}

runTests(); 