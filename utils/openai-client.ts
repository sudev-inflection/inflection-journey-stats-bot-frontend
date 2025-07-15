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
     * Get detailed tool descriptions for better GPT understanding
     */
    private getToolDescriptions() {
        return {
            list_journeys: {
                description: "List all marketing journeys from Inflection.io. Use this to discover available journeys and their IDs. Supports pagination and search functionality.",
                when_to_use: "Use when user asks to list journeys, see available campaigns, or browse marketing journeys. Also use to get journey IDs needed for detailed reports.",
                parameters: {
                    page_size: "Number of journeys per page (1-100, default: 30)",
                    page_number: "Which page to retrieve (default: 1)",
                    search_keyword: "Filter journeys by name (optional)"
                }
            },
            get_email_reports: {
                description: "Get comprehensive email performance reports for a specific journey including aggregate stats, engagement metrics, email clients, top links, and bounce analysis.",
                when_to_use: "Use when user asks for email performance data, campaign analytics, engagement metrics, or detailed reports for a specific journey.",
                parameters: {
                    journey_id: "The journey ID (required) - get this from list_journeys first",
                    start_date: "Report start date in YYYY-MM-DD format (optional)",
                    end_date: "Report end date in YYYY-MM-DD format (optional)"
                }
            }
        };
    }

    /**
     * Get the function definitions for MCP tools
     */
    private getMCPFunctions() {
        return [
            {
                name: "list_journeys",
                description: "List all marketing journeys from Inflection.io. Use this to discover available journeys and get their IDs. Supports pagination and search functionality.",
                parameters: {
                    type: "object",
                    properties: {
                        page_size: {
                            type: "integer",
                            description: "Number of journeys to return per page (default: 30, max: 100)",
                            minimum: 1,
                            maximum: 100
                        },
                        page_number: {
                            type: "integer",
                            description: "Page number to retrieve (default: 1)",
                            minimum: 1
                        },
                        search_keyword: {
                            type: "string",
                            description: "Search keyword to filter journeys by name (optional)"
                        }
                    },
                    required: []
                }
            },
            {
                name: "get_email_reports",
                description: "Get comprehensive email performance reports for a specific journey including aggregate stats, engagement metrics, email clients, top links, and bounce analysis.",
                parameters: {
                    type: "object",
                    properties: {
                        journey_id: {
                            type: "string",
                            description: "The ID of the journey to get reports for (required) - get this from list_journeys first"
                        },
                        start_date: {
                            type: "string",
                            description: "Start date for the report period (YYYY-MM-DD format, optional)"
                        },
                        end_date: {
                            type: "string",
                            description: "End date for the report period (YYYY-MM-DD format, optional)"
                        }
                    },
                    required: ["journey_id"]
                }
            }
        ];
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
                    functions: this.getMCPFunctions(),
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
            const toolName = functionCall.name;

            // Validate that this is one of our supported tools
            const supportedTools = ['list_journeys', 'get_email_reports'];
            if (!supportedTools.includes(toolName)) {
                throw new Error(`Unsupported tool: ${toolName}`);
            }

            // Invoke the tool directly
            return await this.mcpClient.fetchSpecAndInvoke(toolName, args);
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