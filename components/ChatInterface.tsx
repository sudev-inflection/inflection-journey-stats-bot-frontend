import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { ScrollArea } from "./ui/scroll-area";
import { Send, Bot, User, AlertCircle } from "lucide-react";
import { useChat } from "../hooks/useChat";
import { LoadingDots } from "./ui/loading-dots";
import { validateConfig } from "../config/api-config";
import ReactMarkdown from "react-markdown";

export function ChatInterface() {
  const { messages, sendMessage, isLoading } = useChat();
  const [inputValue, setInputValue] = useState('');
  const [configErrors, setConfigErrors] = useState<string[]>([]);

  // Check configuration on component mount
  useEffect(() => {
    const errors = validateConfig();
    setConfigErrors(errors);
  }, []);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    await sendMessage(inputValue);
    setInputValue('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Show configuration errors if any
  if (configErrors.length > 0) {
    return (
      <div className="flex flex-col h-screen max-w-4xl mx-auto bg-white">
        <div className="bg-[var(--color-inflection-primary)] text-white px-6 py-4 flex items-center gap-3">
          <div className="w-8 h-8 bg-[var(--color-inflection-accent)] rounded-lg flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-white">Inflection Journey Reports Bot</h1>
            <p className="text-[var(--color-inflection-light)] opacity-90 text-sm">AI-powered journey analytics assistant</p>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="w-6 h-6 text-red-600" />
              <h2 className="text-lg font-semibold text-red-800">Configuration Error</h2>
            </div>
            <div className="space-y-2">
              {configErrors.map((error, index) => (
                <p key={index} className="text-sm text-red-700">{error}</p>
              ))}
            </div>
            <p className="text-sm text-red-600 mt-4">
              Please check your environment variables and restart the application.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto bg-white">
      {/* Header */}
      <div className="bg-[var(--color-inflection-primary)] text-white px-6 py-4 flex items-center gap-3">
        <div className="w-8 h-8 bg-[var(--color-inflection-accent)] rounded-lg flex items-center justify-center">
          <Bot className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-white">Inflection Journey Reports Bot</h1>
          <p className="text-[var(--color-inflection-light)] opacity-90 text-sm">AI-powered journey analytics assistant</p>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex gap-3 max-w-[80%] ${message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${message.sender === 'user'
                  ? 'bg-[var(--color-inflection-secondary)]'
                  : 'bg-[var(--color-inflection-accent)]'
                  }`}>
                  {message.sender === 'user' ? (
                    <User className="w-4 h-4 text-white" />
                  ) : (
                    <Bot className="w-4 h-4 text-white" />
                  )}
                </div>
                <div className={`rounded-lg px-4 py-3 ${message.sender === 'user'
                  ? 'bg-[var(--color-inflection-primary)] text-white'
                  : message.error
                    ? 'bg-red-50 border border-red-200 text-red-800'
                    : 'bg-[var(--color-inflection-light)] text-gray-800'
                  }`}>
                  <div className="flex items-center gap-2">
                    {message.isLoading && (
                      <LoadingDots className="text-gray-500" size="sm" />
                    )}
                    {message.sender === 'user' ? (
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    ) : (
                      <div className="prose prose-sm max-w-none">
                        <ReactMarkdown>{message.content}</ReactMarkdown>
                      </div>
                    )}
                  </div>
                  <p className={`text-xs mt-1 ${message.sender === 'user'
                    ? 'text-[var(--color-inflection-light)]'
                    : message.error
                      ? 'text-red-600'
                      : 'text-gray-500'
                    }`}>
                    {formatTime(message.timestamp)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="border-t bg-white p-4">
        <div className="flex gap-3 max-w-4xl mx-auto">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about journey reports, analytics, or insights..."
            className="flex-1 border-[var(--color-inflection-primary)]/20 focus:border-[var(--color-inflection-primary)] focus:ring-[var(--color-inflection-primary)]/20"
            disabled={isLoading}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            className="bg-[var(--color-inflection-primary)] hover:bg-[var(--color-inflection-secondary)] text-white"
          >
            {isLoading ? (
              <LoadingDots className="text-white" size="sm" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}