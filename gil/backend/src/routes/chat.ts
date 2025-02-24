import { Router } from 'express';
import { supabase } from '../services/supabase';
import { ChatMessage } from '../types';
import { LangGraphService } from '../services/langGraph';

const router = Router();

// Get chat history for a user
router.get('/:userId', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('user_id', req.params.userId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    res.json(data);
  } catch (error: unknown) {
    if (error instanceof Error) {
      res.status(500).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'An unknown error occurred' });
    }
  }
});

// Add a new message
router.post('/', async (req, res) => {
  try {
    const { user_id, content } = req.body;

    // Save user message
    const { data: message, error: messageError } = await supabase
      .from('chat_messages')
      .insert([
        { user_id, content, role: 'user' }
      ])
      .select()
      .single();

    if (messageError) throw messageError;

    // Get user's memories
    const { data: memories } = await supabase
      .from('memories')
      .select('*')
      .eq('user_id', user_id);

    // Process with LangGraph
    const langGraph = new LangGraphService(user_id);
    const aiResponse = await langGraph.processMessage(content, user_id, memories || []);

    // Save AI response
    const { data: aiMessage, error: aiError } = await supabase
      .from('chat_messages')
      .insert([
        { user_id, content: aiResponse, role: 'assistant' }
      ])
      .select()
      .single();

    if (aiError) throw aiError;

    res.json({
      message,
      aiMessage
    });
  } catch (error: unknown) {
    console.error('Chat error:', error);
    if (error instanceof Error) {
      res.status(500).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'An unknown error occurred' });
    }
  }
});

export const chatRouter = router;