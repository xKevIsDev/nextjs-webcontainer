'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, CheckCircle2, XCircle, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Message, ToolCall, FileOperation } from '@/types/chat';
import { WebContainer } from '@webcontainer/api';

interface AIChatProps {
  webcontainerInstance: WebContainer | null;
}

export function AIChat({ webcontainerInstance }: AIChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [messages]);

  // System prompt for the AI
  const SYSTEM_PROMPT = `You are an expert Next.js developer assistant. You can help build and modify Next.js applications by creating, reading, updating, and deleting files in a Next.js project.

When the user asks you to build something:
1. Use the available tools to explore the existing file structure
2. Create or modify files as needed
3. **CRITICAL**: After ANY file changes, ALWAYS call check_terminal to verify the build is successful
4. If check_terminal shows errors, analyze them and fix the issues
5. Repeat steps 3-4 until check_terminal shows "SUCCESS"
6. Only when the build is successful, inform the user that the task is complete
7. Follow Next.js best practices (App Router, TypeScript, Tailwind CSS)
8. Explain what you're doing as you work

Available tools:
- read_file: Read file contents
- write_file: Create or update files
- delete_file: Remove files or directories
- list_files: List directory contents
- create_directory: Create new directories
- check_terminal: Check terminal for errors and build status (ALWAYS use after file changes!)

**IMPORTANT**: Never consider a task complete until check_terminal returns "SUCCESS" status. If there are errors:
1. Read the error messages from check_terminal
2. Identify the problematic file(s)
3. Fix the issues
4. Check terminal again
5. Repeat until successful

Always use relative paths from the project root (e.g., "app/page.tsx" or "src/app/page.tsx", not "/app/page.tsx").`;

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading || !webcontainerInstance) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      await processAIResponse([...messages, userMessage]);
    } catch (error) {
      console.error('Error processing message:', error);
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `Sorry, I encountered an unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again or check your API configuration.`,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const processAIResponse = async (messageHistory: Message[]) => {
    let conversationMessages = messageHistory;
    let continueLoop = true;
    let iterations = 0;
    const MAX_ITERATIONS = 10; // Prevent infinite loops

    while (continueLoop && iterations < MAX_ITERATIONS) {
      iterations++;

      // Convert messages to API format
      const apiMessages = [
        { role: 'system', content: SYSTEM_PROMPT },
        ...conversationMessages.map((msg) => {
          if (msg.role === 'tool') {
            return {
              role: 'tool',
              content: msg.content,
              tool_call_id: msg.toolCallId,
            };
          }
          return {
            role: msg.role,
            content: msg.content,
            ...(msg.toolCalls && { tool_calls: msg.toolCalls }),
          };
        }),
      ];

      // Call API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages }),
      });

      if (!response.ok) {
        // Handle error gracefully and continue conversation
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        const errorMessage: Message = {
          id: Date.now().toString(),
          role: 'assistant',
          content: `I encountered an error (${response.status}): ${errorData.error || 'Failed to get AI response'}. Please check your OpenRouter API key configuration or try again.`,
          timestamp: Date.now(),
        };
        conversationMessages = [...conversationMessages, errorMessage];
        setMessages(conversationMessages);
        continueLoop = false;
        continue;
      }

      const data = await response.json();
      const assistantMessage = data.choices?.[0]?.message;

      // Handle missing response data
      if (!assistantMessage) {
        const errorMessage: Message = {
          id: Date.now().toString(),
          role: 'assistant',
          content: 'I received an invalid response from the API. Please try again.',
          timestamp: Date.now(),
        };
        conversationMessages = [...conversationMessages, errorMessage];
        setMessages(conversationMessages);
        continueLoop = false;
        continue;
      }

      // Create assistant message
      const newMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: assistantMessage.content || '',
        toolCalls: assistantMessage.tool_calls,
        timestamp: Date.now(),
      };

      conversationMessages = [...conversationMessages, newMessage];
      setMessages(conversationMessages);

      // Check if there are tool calls to execute
      if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
        // Execute all tool calls
        for (const toolCall of assistantMessage.tool_calls) {
          const result = await executeToolCall(toolCall);

          const toolMessage: Message = {
            id: Date.now().toString(),
            role: 'tool',
            content: JSON.stringify(result),
            toolCallId: toolCall.id,
            timestamp: Date.now(),
          };

          conversationMessages = [...conversationMessages, toolMessage];
          setMessages(conversationMessages);
        }

        // Continue the loop to get AI response after tool execution
        continueLoop = true;
      } else {
        // No more tool calls, we're done
        continueLoop = false;
      }
    }
  };

  const executeToolCall = async (toolCall: ToolCall): Promise<FileOperation> => {
    const functionName = toolCall.function.name;
    const args = JSON.parse(toolCall.function.arguments);

    if (!webcontainerInstance && functionName !== 'check_terminal') {
      return {
        type: functionName as any,
        path: args.path,
        error: 'WebContainer not initialized',
      };
    }

    try {
      switch (functionName) {
        case 'read_file': {
          const content = await webcontainerInstance!.fs.readFile(args.path, 'utf-8');
          return {
            type: 'read_file',
            path: args.path,
            result: content,
          };
        }

        case 'write_file': {
          // Ensure directory exists
          const pathParts = args.path.split('/');
          if (pathParts.length > 1) {
            const dirPath = pathParts.slice(0, -1).join('/');
            try {
              await webcontainerInstance!.fs.mkdir(dirPath, { recursive: true });
            } catch (e) {
              // Directory might already exist
            }
          }

          await webcontainerInstance!.fs.writeFile(args.path, args.content);

          // Wait a bit for the dev server to recompile
          await new Promise(resolve => setTimeout(resolve, 2000));

          return {
            type: 'write_file',
            path: args.path,
            result: 'File written successfully',
          };
        }

        case 'delete_file': {
          await webcontainerInstance!.fs.rm(args.path, { recursive: true });
          return {
            type: 'delete_file',
            path: args.path,
            result: 'File deleted successfully',
          };
        }

        case 'list_files': {
          const files = await webcontainerInstance!.fs.readdir(args.path, {
            withFileTypes: true,
          });
          const fileList = files.map((file) =>
            file.isDirectory() ? `${file.name}/` : file.name
          );
          return {
            type: 'list_files',
            path: args.path,
            result: fileList,
          };
        }

        case 'create_directory': {
          await webcontainerInstance!.fs.mkdir(args.path, { recursive: true });
          return {
            type: 'create_directory',
            path: args.path,
            result: 'Directory created successfully',
          };
        }

        case 'check_terminal': {
          const terminalMonitor = (window as any).terminalMonitor;
          if (!terminalMonitor) {
            return {
              type: 'check_terminal',
              path: 'terminal',
              error: 'Terminal monitor not available',
            };
          }

          const lines = args.lines || 50;
          const recentOutput = terminalMonitor.getRecentOutput(lines);
          const hasErrors = terminalMonitor.hasErrors();
          const errors = terminalMonitor.getErrors();
          const isBuildSuccessful = terminalMonitor.isBuildSuccessful();

          return {
            type: 'check_terminal',
            path: 'terminal',
            result: JSON.stringify({
              recentOutput,
              hasErrors,
              errors: errors.slice(-10), // Last 10 error lines
              isBuildSuccessful,
              status: isBuildSuccessful ? 'SUCCESS' : hasErrors ? 'ERROR' : 'COMPILING',
            }),
          };
        }

        default:
          return {
            type: functionName as any,
            path: args.path || 'unknown',
            error: `Unknown function: ${functionName}`,
          };
      }
    } catch (error: any) {
      return {
        type: functionName as any,
        path: args.path || 'unknown',
        error: error.message || 'Unknown error',
      };
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full bg-background border-r">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-lg font-semibold">AI Assistant</h2>
      </div>

      {/* Messages */}
      <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
        <div className="space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-muted-foreground text-sm py-8">
              <p>Hi! I'm your Next.js AI assistant.</p>
              <p className="mt-2">Ask me to build components, pages, or features!</p>
            </div>
          )}

          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}

          {isLoading && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Thinking...</span>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me to build something..."
            className="min-h-[60px] max-h-[200px] resize-none"
            disabled={isLoading || !webcontainerInstance}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!input.trim() || isLoading || !webcontainerInstance}
            size="icon"
            className="h-[60px] w-[60px]"
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user';
  const isTool = message.role === 'tool';

  if (isTool) {
    const operation = JSON.parse(message.content) as FileOperation;
    return (
      <div className="flex items-start gap-2 text-sm">
        <div className="flex-shrink-0 mt-1">
          {operation.error ? (
            <XCircle className="h-4 w-4 text-destructive" />
          ) : (
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <FileText className="h-3 w-3" />
            <span className="font-medium">{operation.type}</span>
            <span className="text-muted-foreground">→ {operation.path}</span>
          </div>
          {operation.error && (
            <p className="text-destructive text-xs mt-1">{operation.error}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex flex-col gap-1',
        isUser ? 'items-end' : 'items-start'
      )}
    >
      <div
        className={cn(
          'rounded-lg px-4 py-2 max-w-[85%] break-words',
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-foreground'
        )}
      >
        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
      </div>

      {message.toolCalls && message.toolCalls.length > 0 && (
        <div className="text-xs text-muted-foreground space-y-1 ml-2">
          {message.toolCalls.map((toolCall) => {
            const args = JSON.parse(toolCall.function.arguments);
            return (
              <div key={toolCall.id} className="flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>
                  {toolCall.function.name} → {args.path}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
