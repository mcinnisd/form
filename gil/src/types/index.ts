export interface User {
  id: string
  email: string
  created_at: string
}

export interface ChatMessage {
  id: string
  user_id: string
  content: string
  role: 'user' | 'assistant'
  created_at: string
}

export type MemoryCategory = 'Allergy' | 'Preference' | 'Diet' | 'Exercise' | 'Goal' | 'Grocery';

export interface Memory {
  id: string
  user_id: string
  category: MemoryCategory
  content: string
  importance: number
  created_at: string
  updated_at: string
}

export interface CreateMemoryInput {
  category: MemoryCategory
  content: string
  importance?: number
}

export interface UpdateMemoryInput {
  category?: string
  content?: string
  importance?: number
}

export interface CreateAgentMemoryInput {
  user_id: string;
  category: MemoryCategory;
  content: string;
  importance?: number;
}

export interface AgentMemoryResponse {
  success: boolean;
  memory?: Memory;
  error?: string;
} 