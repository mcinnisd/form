import { create } from 'zustand'
import { User, ChatMessage, Memory } from '../types'

interface AppState {
  user: User | null
  messages: ChatMessage[]
  memories: Memory[]
  setUser: (user: User | null) => void
  setMessages: (messages: ChatMessage[]) => void
  addMessage: (message: ChatMessage) => void
  setMemories: (memories: Memory[]) => void
  addMemory: (memory: Memory) => void
  updateMemory: (memory: Memory) => void
  deleteMemory: (memoryId: string) => void
}

export const useStore = create<AppState>((set) => ({
  user: null,
  messages: [],
  memories: [],
  setUser: (user) => set({ user }),
  setMessages: (messages) => set({ messages }),
  addMessage: (message) => 
    set((state) => ({ messages: [...state.messages, message] })),
  setMemories: (memories) => set({ memories }),
  addMemory: (memory) =>
    set((state) => ({ memories: [...state.memories, memory] })),
  updateMemory: (memory) =>
    set((state) => ({
      memories: state.memories.map((m) => 
        m.id === memory.id ? memory : m
      ),
    })),
  deleteMemory: (memoryId) =>
    set((state) => ({
      memories: state.memories.filter((m) => m.id !== memoryId),
    })),
})) 