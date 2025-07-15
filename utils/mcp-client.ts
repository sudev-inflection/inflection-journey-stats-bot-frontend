export interface MCPServerConfig {
    baseUrl: string;
}

export interface MCPToolSpec {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: Record<string, any>;
        required?: string[];
    };
}

export interface MCPInvokeRequest {
    tool: string;
    arguments: Record<string, any>;
}

export class MCPClient {
    private baseUrl: string;

    constructor(config: MCPServerConfig) {
        this.baseUrl = config.baseUrl.replace(/\/$/, ''); // Remove trailing slash
    }

    /**
     * Make a JSON-RPC 2.0 request to the MCP server
     */
    private async makeRPCRequest(method: string, params: any = {}): Promise<any> {
        try {
            const response = await fetch(`${this.baseUrl}/mcp`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    jsonrpc: '2.0',
                    id: Date.now().toString(),
                    method,
                    params
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();

            if (data.error) {
                throw new Error(`RPC error: ${data.error.code} - ${data.error.message}`);
            }

            return data.result;
        } catch (error) {
            throw new Error(`RPC request failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Process arguments and set default values based on tool schema
     */
    private processArguments(arguments_: Record<string, any>, schema: any): Record<string, any> {
        const processed = { ...arguments_ };

        if (schema.properties) {
            for (const [fieldName, fieldSchema] of Object.entries(schema.properties)) {
                // Set default values if not provided
                if (!(fieldName in processed) && 'default' in fieldSchema) {
                    processed[fieldName] = fieldSchema.default;
                }
            }
        }

        return processed;
    }

    /**
     * Validate arguments against tool schema and provide helpful error messages
     */
    private validateArguments(toolName: string, arguments_: Record<string, any>, schema: any): void {
        const errors: string[] = [];

        // Check required fields
        if (schema.required) {
            for (const requiredField of schema.required) {
                if (!(requiredField in arguments_)) {
                    errors.push(`Missing required field: ${requiredField}`);
                }
            }
        }

        // Check field types and constraints
        if (schema.properties) {
            for (const [fieldName, fieldValue] of Object.entries(arguments_)) {
                const fieldSchema = schema.properties[fieldName];
                if (!fieldSchema) {
                    errors.push(`Unknown field: ${fieldName}`);
                    continue;
                }

                // Type validation
                if (fieldSchema.type === 'integer' && typeof fieldValue !== 'number') {
                    errors.push(`Field ${fieldName} must be a number`);
                } else if (fieldSchema.type === 'string' && typeof fieldValue !== 'string') {
                    errors.push(`Field ${fieldName} must be a string`);
                }

                // Range validation for integers
                if (fieldSchema.type === 'integer' && typeof fieldValue === 'number') {
                    if (fieldSchema.minimum !== undefined && fieldValue < fieldSchema.minimum) {
                        errors.push(`Field ${fieldName} must be at least ${fieldSchema.minimum}`);
                    }
                    if (fieldSchema.maximum !== undefined && fieldValue > fieldSchema.maximum) {
                        errors.push(`Field ${fieldName} must be at most ${fieldSchema.maximum}`);
                    }
                }
            }
        }

        if (errors.length > 0) {
            throw new Error(`Invalid arguments for ${toolName}: ${errors.join(', ')}`);
        }
    }

    /**
     * Fetch the JSON schema for a specific tool
     */
    async getToolSpec(toolName: string): Promise<MCPToolSpec> {
        try {
            // Get all tools and find the specific one
            const result = await this.makeRPCRequest('tools/list');
            const tool = result.tools?.find((t: any) => t.name === toolName);

            if (!tool) {
                throw new Error(`Tool '${toolName}' not found`);
            }

            return {
                name: tool.name,
                description: tool.description,
                inputSchema: tool.inputSchema
            };
        } catch (error) {
            throw new Error(`Error fetching tool spec for ${toolName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Invoke a tool with the given arguments
     */
    async invokeTool(toolName: string, arguments_: Record<string, any>): Promise<any> {
        try {
            console.log(`🔧 [MCP Debug] Invoking tool: ${toolName}`);
            console.log(`🔧 [MCP Debug] Arguments:`, JSON.stringify(arguments_, null, 2));

            const result = await this.makeRPCRequest('tools/call', {
                name: toolName,
                arguments: arguments_
            });

            console.log(`🔧 [MCP Debug] Raw tool result for ${toolName}:`, JSON.stringify(result, null, 2));

            return result;
        } catch (error) {
            console.error(`🔧 [MCP Debug] Error invoking tool ${toolName}:`, error);
            throw new Error(`Error invoking tool ${toolName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Fetch tool spec and invoke the tool in one operation
     */
    async fetchSpecAndInvoke(toolName: string, arguments_: Record<string, any>): Promise<any> {
        // First fetch the spec for validation
        const toolSpec = await this.getToolSpec(toolName);

        // Process arguments and set defaults
        const processedArgs = this.processArguments(arguments_, toolSpec.inputSchema);

        // Validate arguments against the schema
        this.validateArguments(toolName, processedArgs, toolSpec.inputSchema);

        // Then invoke the tool
        return await this.invokeTool(toolName, processedArgs);
    }
} 