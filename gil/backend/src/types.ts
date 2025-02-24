export interface ChatMessage {
  id: string;
  user_id: string;
  content: string;
  role: 'user' | 'assistant';
  created_at: Date;
}

export interface Memory {
  id: string;
  user_id: string;
  category: string;
  content: string;
  created_at: Date;
} 