import { ChatOpenAI } from "@langchain/openai";
import { RunnableSequence } from "@langchain/core/runnables";
import { 
  BaseMessage, 
  HumanMessage, 
  SystemMessage,
  AIMessage 
} from "@langchain/core/messages";
import { Tool } from '@langchain/core/tools';
import { supabase } from './supabase';

interface Memory {
  category: 'Allergy' | 'Preference' | 'Diet' | 'Exercise' | 'Goal' | 'Grocery';
  content: string;
}

class CreateMemoryTool extends Tool {
  name = 'create_memory';
  description = `Create a new memory for the user. Use this when you learn important information about the user that should be remembered.
    The category must be one of: Allergy, Preference, Diet, Exercise, Goal, or Grocery.
    
    You must respond with a JSON object containing:
    - category: one of the valid categories
    - content: a clear, concise description
    
    Examples:
    For "I love walnuts":
    {
      "category": "Preference",
      "content": "Loves walnuts"
    }
    
    For "I run every morning":
    {
      "category": "Exercise",
      "content": "Runs every morning"
    }`;

  constructor(private userId: string) {
    super();
  }

  async _call(input: string): Promise<string> {
    try {
      console.log('CreateMemoryTool called with input:', input);
      const inputData = JSON.parse(input);
      console.log('Parsed input data:', inputData);

      const { category, content, user_id } = inputData;

      if (!category || !content || !user_id) {
        throw new Error('Missing required fields: category, content, and user_id are required');
      }

      console.log('Inserting memory into Supabase:', { user_id, category, content });
      const { data: memory, error } = await supabase
        .from('memories')
        .insert([
          {
            user_id,
            category,
            content,
            importance: 1,
            created_by: 'agent'
          }
        ])
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Successfully created memory:', memory);
      return `Successfully created memory: ${content} (Category: ${category})`;
    } catch (error: unknown) {
      console.error('CreateMemoryTool error:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to create memory: ${error.message}`);
      }
      throw new Error('Failed to create memory: Unknown error');
    }
  }
}

export class LangGraphService {
  private model: ChatOpenAI;
  private createMemoryTool: CreateMemoryTool;

  constructor(userId: string) {
    this.model = new ChatOpenAI({
      modelName: "gpt-4",
      temperature: 0.7,
    });
    this.createMemoryTool = new CreateMemoryTool(userId);
  }

  async processMessage(message: string, userId: string, memories: Memory[] = []) {
    try {
      console.log('Processing message:', { message, userId });
      console.log('Existing memories:', memories);

      // Construct system message with memory context and tool instructions
      const memoryContext = memories
        .map((m: Memory) => `${m.category}: ${m.content}`)
        .join('\n');

      const systemMessage = `You are a helpful health coach assistant. 
        Consider these relevant details about the user:
        ${memoryContext}

        IMPORTANT: When users share personal information, preferences, or goals, you should store them as memories.
        Use the create_memory tool to save important information.
        
        Examples of when to create memories:
        - User mentions food preferences or restrictions
        - User shares exercise habits or preferences
        - User discusses health goals
        - User mentions allergies or dietary restrictions

        After creating a memory, acknowledge it in your response to the user.`;

      // Create message array
      const messages = [
        new SystemMessage(systemMessage),
        new HumanMessage(message)
      ];

      // Get initial response from model
      const response = await this.model.invoke(messages);
      console.log('Initial AI response:', response.content);

      // Make the memory creation prompt more explicit
      const shouldCreateMemoryPrompt = new SystemMessage(`
        Your task is to decide if a memory should be created from the user's message.
        
        If a memory should be created, you MUST respond with ONLY a JSON object in this format:
        {
          "category": "one_of_valid_categories",
          "content": "clear_description"
        }

        If no memory is needed, respond with exactly: "no_memory_needed"

        Valid categories are: ["Allergy", "Preference", "Diet", "Exercise", "Goal", "Grocery"]
        
        DO NOT include any other text or explanation in your response.
        DO NOT use markdown formatting.
        ONLY return either the JSON object or "no_memory_needed".
      `);

      const memoryDecision = await this.model.invoke([
        shouldCreateMemoryPrompt,
        new HumanMessage(message)
      ]);

      console.log('Raw memory decision:', memoryDecision.content);
      // Try to parse the response if it looks like JSON
      if (typeof memoryDecision.content === 'string' && memoryDecision.content.includes('{')) {
        try {
          const memoryData = JSON.parse((memoryDecision.content as string).trim());
          console.log('Parsed memory data:', memoryData);

          if (memoryData.category && memoryData.content) {
            const toolInput = JSON.stringify({
              user_id: userId,
              category: memoryData.category,
              content: memoryData.content,
              importance: 1
            });

            console.log('Calling tool with:', toolInput);
            
            const toolResponse = await this.createMemoryTool._call(toolInput);
            console.log('Tool response:', toolResponse);

            // Modify response to acknowledge memory creation
            return `${response.content}\n\nI've saved that you ${memoryData.content}.`;
          }
        } catch (error) {
          console.error('Memory creation failed:', error);
        }
      }

      return response.content;
    } catch (error) {
      console.error('Error in processMessage:', error);
      throw error;
    }
  }
}

// Update your agent configuration to include the new tool
export const createAgent = (userId: string) => {
  const llm = new ChatOpenAI({
    modelName: 'gpt-4',
    temperature: 0.7,
  });

  const tools = [
    new CreateMemoryTool(userId),
    // ... other existing tools
  ];

  // ... rest of your agent configuration
}; 