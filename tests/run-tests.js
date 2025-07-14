/**
 * Test Runner for MCP Integration
 * 
 * This script runs all tests in the tests folder.
 * Usage: node tests/run-tests.js
 */

const { execSync } = require('child_process');
const path = require('path');

console.log('🧪 Running MCP Integration Tests...\n');

try {
    // Run the MCP integration test
    console.log('📋 Running MCP Integration Test...');
    execSync('node tests/test-mcp-integration.js', {
        stdio: 'inherit',
        cwd: path.resolve(__dirname, '..')
    });

    console.log('\n✅ All tests completed successfully!');
} catch (error) {
    console.error('\n❌ Test execution failed:', error.message);
    process.exit(1);
} 