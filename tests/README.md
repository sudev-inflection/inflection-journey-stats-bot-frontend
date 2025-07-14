# Tests

This folder contains test files for the MCP client integration.

## Test Files

- **`test-mcp-integration.js`** - Tests the MCP client functionality and OpenAI integration
- **`run-tests.js`** - Test runner script that executes all tests

## Running Tests

### Using npm scripts (recommended)

```bash
# Run all tests
npm test

# Run only MCP integration tests
npm run test:mcp
```

### Direct execution

```bash
# Run the test runner
node tests/run-tests.js

# Run specific test
node tests/test-mcp-integration.js
```

## Test Requirements

### MCP Server
- The MCP integration tests require an MCP server to be running
- Default expected URL: `http://localhost:3001`
- Tests will show warnings if the server is not available (this is expected)

### Environment Variables
The tests use mock environment variables:
- `VITE_OPENAI_API_KEY` = 'test-key'
- `VITE_MCP_SERVER_URL` = 'http://localhost:3001'
- `VITE_OPENAI_MODEL` = 'gpt-4'

## Test Coverage

### MCP Client Tests
- ✅ Client instantiation
- ✅ Tool spec fetching
- ✅ Error handling for network issues

### OpenAI Client Tests
- ✅ Client instantiation
- ✅ MCP invoke function definition
- ✅ Function call structure validation

## Adding New Tests

1. Create new test files in this folder
2. Follow the naming convention: `test-*.js`
3. Update `run-tests.js` to include the new test
4. Add npm scripts to `package.json` if needed

## Troubleshooting

### "Module not found" errors
- Ensure you're running tests from the project root
- Check that import paths use `../` to reference parent directory

### "process is not defined" errors
- Tests run in Node.js environment, not browser
- Use `process.env` for environment variables in tests

### MCP server connection failures
- This is expected if no MCP server is running
- Tests will show warnings but continue execution 