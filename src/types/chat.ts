export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'tool';
  content: string;
  toolCalls?: ToolCall[];
  toolCallId?: string;
  timestamp: number;
}

export interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
}

export interface FileOperation {
  type: 'read_file' | 'write_file' | 'delete_file' | 'list_files' | 'create_directory' | 'check_terminal';
  path: string;
  content?: string;
  result?: string | string[];
  error?: string;
}
