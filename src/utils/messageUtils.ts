
import { Json } from "@/integrations/supabase/types";

export interface Message {
  userId: string;
  userName?: string;
  message: string;
  timestamp: string;
  read: boolean;
}

export interface MessageItem {
  itemId: string;
  itemTitle: string;
  lastMessage: string;
  timestamp: string;
  unread: boolean;
}

// Type guard to check if a JSON object is a valid Message
export function isMessage(obj: any): obj is Message {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'userId' in obj &&
    'message' in obj &&
    'timestamp' in obj &&
    'read' in obj
  );
}

// Helper function to safely extract messages from JSON data
export function extractMessages(data: Json | null): Message[] {
  if (!data) return [];
  
  if (Array.isArray(data)) {
    return data.filter(item => isMessage(item)) as Message[];
  }
  
  return [];
}

// Helper function to safely convert Message[] to Json
export function messagesToJson(messages: Message[]): Json {
  return messages as unknown as Json;
}
