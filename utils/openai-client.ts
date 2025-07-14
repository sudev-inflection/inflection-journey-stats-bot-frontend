import { MCPClient } from './mcp-client';

export interface ChatMessage {
    role: 'user' | 'assistant' | 'function';
    content: string;
    name?: string; // For function messages
}

export interface OpenAIConfig {
    apiKey: string;
    model?: string;
    mcpClient: MCPClient;
}

export interface FunctionCall {
    name: string;
    arguments: string;
}

export interface OpenAIResponse {
    content: string | null;
    function_call?: FunctionCall;
}

export class OpenAIClient {
    private apiKey: string;
    private model: string;
    private mcpClient: MCPClient;

    constructor(config: OpenAIConfig) {
        this.apiKey = config.apiKey;
        this.model = config.model || 'gpt-4';
        this.mcpClient = config.mcpClient;
    }

    /**
     * The single catch-all function for MCP tool invocation
     */
    private getMCPInvokeFunction() {
        return {
            name: "mcp_invoke",
            description: "Invoke an MCP server tool by name; client will fetch the tool spec and perform the call.",
            parameters: {
                type: "object",
                properties: {
                    tool: {
                        type: "string",
                        enum: ["list_journeys", "get_email_reports"]
                    },
                    arguments: {
                        type: "object",
                        description: "Key/value args for the given tool"
                    }
                },
                required: ["tool"]
            }
        };
    }

    /**
     * Send a message to OpenAI and handle function calls
     */
    async sendMessage(messages: ChatMessage[]): Promise<OpenAIResponse> {
        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: this.model,
                    messages: messages.map(msg => ({
                        role: msg.role,
                        content: msg.content,
                        ...(msg.name && { name: msg.name })
                    })),
                    functions: [this.getMCPInvokeFunction()],
                    function_call: "auto",
                    temperature: 0.7,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`OpenAI API error: ${response.status} ${response.statusText} - ${errorData.error?.message || 'Unknown error'}`);
            }

            const data = await response.json();
            const choice = data.choices[0];

            if (!choice) {
                throw new Error('No response from OpenAI');
            }

            return {
                content: choice.message.content,
                function_call: choice.message.function_call ? {
                    name: choice.message.function_call.name,
                    arguments: choice.message.function_call.arguments
                } : undefined
            };
        } catch (error) {
            throw new Error(`Error communicating with OpenAI: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Handle function call by invoking the MCP tool
     */
    async handleFunctionCall(functionCall: FunctionCall): Promise<any> {
        try {
            const args = JSON.parse(functionCall.arguments);
            const { tool, arguments: toolArgs } = args;

            if (functionCall.name !== 'mcp_invoke') {
                throw new Error(`Unknown function: ${functionCall.name}`);
            }

            // Fetch spec and invoke the tool
            return await this.mcpClient.fetchSpecAndInvoke(tool, toolArgs || {});
        } catch (error) {
            throw new Error(`Error handling function call: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Send a follow-up message without function calling to get the final response
     */
    async sendFollowUpMessage(messages: ChatMessage[]): Promise<string> {
        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: this.model,
                    messages: messages.map(msg => ({
                        role: msg.role,
                        content: msg.content,
                        ...(msg.name && { name: msg.name })
                    })),
                    temperature: 0.7,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`OpenAI API error: ${response.status} ${response.statusText} - ${errorData.error?.message || 'Unknown error'}`);
            }

            const data = await response.json();
            const choice = data.choices[0];

            if (!choice || !choice.message.content) {
                throw new Error('No content in OpenAI response');
            }

            return choice.message.content;
        } catch (error) {
            throw new Error(`Error sending follow-up message: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
} 