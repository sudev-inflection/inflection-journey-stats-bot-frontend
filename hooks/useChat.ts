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

    // Track the full OpenAI conversation history including function results
    const [openaiHistory, setOpenaiHistory] = useState<ChatMessage[]>([
        { role: 'assistant', content: 'Hello! I\'m the Inflection Journey Reports Bot. I can help you with journey analytics, report generation, and insights about your customer journeys. How can I assist you today?' }
    ]);

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
            // Add the new user message to OpenAI history
            const updatedHistory = [...openaiHistory, { role: 'user', content }];
            setOpenaiHistory(updatedHistory);

            // Send to OpenAI with function calling enabled
            const response = await openaiClient.sendMessage(updatedHistory);

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

                    // Get tool name from function call
                    const toolName = functionCall.name;

                    // Extract the actual content from the tool result
                    let functionContent = '';
                    if (toolResult && toolResult.content && Array.isArray(toolResult.content)) {
                        // Extract text from content array
                        functionContent = toolResult.content
                            .filter((item: any) => item.type === 'text')
                            .map((item: any) => item.text)
                            .join('\n');
                    } else {
                        // Fallback to stringifying the entire result
                        functionContent = JSON.stringify(toolResult);
                    }

                    // Update OpenAI history with assistant response and function result
                    const historyWithFunction = [
                        ...updatedHistory,
                        { role: 'assistant', content: response.content || '' },
                        { role: 'function', name: toolName, content: functionContent }
                    ];
                    setOpenaiHistory(historyWithFunction);

                    // Send follow-up to get final response
                    const finalResponse = await openaiClient.sendFollowUpMessage(historyWithFunction);

                    console.log(`🤖 [Chat Debug] Final processed response:`, finalResponse);

                    // Update the assistant message with final response
                    setMessages(prev => prev.map(msg =>
                        msg.id === assistantMessage.id
                            ? { ...msg, content: finalResponse, isLoading: false }
                            : msg
                    ));

                    // Add the final response to OpenAI history
                    setOpenaiHistory(prev => [...prev, { role: 'assistant', content: finalResponse }]);

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

                // Add the response to OpenAI history
                setOpenaiHistory(prev => [...prev, { role: 'assistant', content: response.content || '' }]);
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
    }, [openaiHistory]);

    return {
        messages,
        sendMessage,
        isLoading
    };
} 