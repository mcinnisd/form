import { ChatMessage, Memory, CreateMemoryInput, UpdateMemoryInput, CreateAgentMemoryInput, AgentMemoryResponse } from '../types';
import { supabase } from './supabase';

const API_URL = 'http://192.168.0.15:3000/api';

export const api = {
  chat: {
    getHistory: async (userId: string): Promise<ChatMessage[]> => {
      const response = await fetch(`${API_URL}/chat/${userId}`);
      return response.json();
    },

    sendMessage: async (userId: string, content: string): Promise<{message: ChatMessage, aiMessage: ChatMessage}> => {
      const response = await fetch(`${API_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          content,
          role: 'user'
        }),
      });
      return response.json();
    }
  },

  memories: {
    getAll: async (userId: string): Promise<Memory[]> => {
      const response = await fetch(`${API_URL}/memories/${userId}`);
      if (!response.ok) throw new Error('Failed to fetch memories');
      return response.json();
    },

    create: async (userId: string, data: CreateMemoryInput): Promise<Memory> => {
      const { data: memory, error } = await supabase
        .from('memories')
        .insert([{ user_id: userId, ...data }])
        .select()
        .single();

      if (error) throw error;
      return memory;
    },

    update: async (id: string, data: UpdateMemoryInput): Promise<Memory> => {
      const { data: memory, error } = await supabase
        .from('memories')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return memory;
    },

    delete: async (id: string): Promise<void> => {
      const { error } = await supabase
        .from('memories')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },

    createFromAgent: async (data: CreateAgentMemoryInput): Promise<AgentMemoryResponse> => {
      try {
        const response = await fetch(`${API_URL}/memories/agent`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });

        const responseData = await response.json();
        
        if (!response.ok) {
          throw new Error(responseData.error || 'Failed to create memory from agent');
        }

        return responseData;
      } catch (error) {
        console.error('Agent memory creation error:', error);
        throw error;
      }
    },
  }
}; 