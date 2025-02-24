import { Router } from 'express';
import { supabase } from '../services/supabase';
import { Memory } from '../types';

const router = Router();

// Get all memories for a user
router.get('/:userId', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('memories')
      .select('*')
      .eq('user_id', req.params.userId)
      .order('created_at', { ascending: false });

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

// Add a new memory
router.post('/', async (req, res) => {
  try {
    const { user_id, category, content, importance = 1 } = req.body;
    
    console.log('Creating memory:', { user_id, category, content });

    const { data, error } = await supabase
      .from('memories')
      .insert([
        { 
          user_id, 
          category, 
          content,
          importance 
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }

    res.json(data);
  } catch (error: unknown) {
    console.error('Server error:', error);
    if (error instanceof Error) {
      res.status(500).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'An unknown error occurred' });
    }
  }
});

// Update a memory
router.patch('/:id', async (req, res) => {
  try {
    const { content, category } = req.body;
    
    const { data, error } = await supabase
      .from('memories')
      .update({ content, category })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error: unknown) {
    console.error('Server error:', error);
    if (error instanceof Error) {
      res.status(500).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'An unknown error occurred' });
    }
  }
});

// Delete a memory
router.delete('/:id', async (req, res) => {
  try {
    const { error } = await supabase
      .from('memories')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ success: true });
  } catch (error: unknown) {
    console.error('Server error:', error);
    if (error instanceof Error) {
      res.status(500).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'An unknown error occurred' });
    }
  }
});

// Add memory from agent
router.post('/agent', async (req, res) => {
  try {
    const { user_id, category, content, importance = 1 } = req.body;
    
    console.log('Agent creating memory:', { user_id, category, content });

    // Validate inputs
    if (!user_id || !category || !content) {
      throw new Error('Missing required fields');
    }

    const validCategories = ['Allergy', 'Preference', 'Diet', 'Exercise', 'Goal', 'Grocery'];
    if (!validCategories.includes(category)) {
      throw new Error(`Invalid category. Must be one of: ${validCategories.join(', ')}`);
    }

    const { data: memory, error } = await supabase
      .from('memories')
      .insert([
        { 
          user_id, 
          category, 
          content,
          importance,
          created_by: 'agent'
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }

    console.log('Memory created successfully:', memory);
    res.json({ success: true, memory });
  } catch (error) {
    console.error('Agent memory creation error:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// Important: Change the export
export const memoriesRouter = router; 