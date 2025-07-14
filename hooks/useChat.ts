import { useState, useCallback } from 'react';
import { OpenAIClient, ChatMessage } from '../utils/openai-client';
import { MCPClient } from '../utils/mcp-client';
import { API_CONFIG } from '../config/api-config';

export interface Message {
    id: string;
    content: string;
    sender: 'user' | 'bot';
    timestamp: Date;
    isLoading?: boolean;
    error?: string;
}

export function useChat() {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            content: 'Hello! I\'m the Inflection Journey Reports Bot. I can help you with journey analytics, report generation, and insights about your customer journeys. How can I assist you today?',
            sender: 'bot',
            timestamp: new Date(Date.now() - 30000)
        }
    ]);
    const [isLoading, setIsLoading] = useState(false);

    // Initialize API clients
    const mcpClient = new MCPClient({ baseUrl: API_CONFIG.MCP_SERVER.baseUrl });
    const openaiClient = new OpenAIClient({
        apiKey: API_CONFIG.OPENAI_API_KEY,
        model: API_CONFIG.OPENAI_MODEL,
        mcpClient
    });

    const sendMessage = useCallback(async (content: string) => {
        if (!content.trim()) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            content,
            sender: 'user',
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setIsLoading(true);

        try {
            // Convert messages to OpenAI format
            const openaiMessages: ChatMessage[] = messages
                .filter(msg => msg.sender === 'user' || msg.sender === 'bot')
                .map(msg => ({
                    role: msg.sender === 'user' ? 'user' : 'assistant',
                    content: msg.content
                }));

            // Add the new user message
            openaiMessages.push({ role: 'user', content });

            // Send to OpenAI with function calling enabled
            const response = await openaiClient.sendMessage(openaiMessages);

            if (response.function_call) {
                // Handle function call
                const functionCall = response.function_call;

                console.log(`🤖 [Chat Debug] Function call detected:`, functionCall.name);
                console.log(`🤖 [Chat Debug] Function arguments:`, functionCall.arguments);

                // Add assistant message with loading state
                const assistantMessage: Message = {
                    id: (Date.now() + 1).toString(),
                    content: response.content || 'I\'m processing your request...',
                    sender: 'bot',
                    timestamp: new Date(),
                    isLoading: true
                };
                setMessages(prev => [...prev, assistantMessage]);

                try {
                    // Handle the function call
                    const toolResult = await openaiClient.handleFunctionCall(functionCall);

                    console.log(`🤖 [Chat Debug] Tool result received:`, JSON.stringify(toolResult, null, 2));

                    // Parse function call arguments to get tool name
                    const args = JSON.parse(functionCall.arguments);
                    const toolName = args.tool;

                    // Prepare messages for follow-up (including function result)
                    const followUpMessages: ChatMessage[] = [
                        ...openaiMessages,
                        { role: 'assistant', content: response.content || '' },
                        { role: 'function', name: toolName, content: JSON.stringify(toolResult) }
                    ];

                    // Send follow-up to get final response
                    const finalResponse = await openaiClient.sendFollowUpMessage(followUpMessages);

                    console.log(`🤖 [Chat Debug] Final processed response:`, finalResponse);

                    // Update the assistant message with final response
                    setMessages(prev => prev.map(msg =>
                        msg.id === assistantMessage.id
                            ? { ...msg, content: finalResponse, isLoading: false }
                            : msg
                    ));

                } catch (error) {
                    console.error(`🤖 [Chat Debug] Function call error:`, error);
                    // Handle function call error
                    const errorMessage: Message = {
                        id: (Date.now() + 2).toString(),
                        content: `Sorry, I encountered an error while processing your request: ${error instanceof Error ? error.message : 'Unknown error'}`,
                        sender: 'bot',
                        timestamp: new Date(),
                        error: error instanceof Error ? error.message : 'Unknown error'
                    };
                    setMessages(prev => [...prev, errorMessage]);
                }
            } else {
                // Direct response without function call
                const botMessage: Message = {
                    id: (Date.now() + 1).toString(),
                    content: response.content || 'I apologize, but I couldn\'t generate a response.',
                    sender: 'bot',
                    timestamp: new Date()
                };
                setMessages(prev => [...prev, botMessage]);
            }
        } catch (error) {
            // Handle general error
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}`,
                sender: 'bot',
                timestamp: new Date(),
                error: error instanceof Error ? error.message : 'Unknown error'
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    }, [messages]);

    return {
        messages,
        sendMessage,
        isLoading
    };
} 