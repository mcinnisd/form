import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useAuthStore } from '../stores/authStore';
import { api } from '../services/api';
import { Memory } from '../types';
import { MemoryCardModal } from '../components/MemoryCardModal';
import { CreateMemoryModal } from '../components/CreateMemoryModal';
import { subscribeToMemories } from '../services/supabase';
import { supabase } from '../services/supabase';

export const MemoryScreen = () => {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const user = useAuthStore(state => state.user);
  const [refreshing, setRefreshing] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);

  useEffect(() => {
    if (!user?.id) return;

    // Initial fetch
    const fetchMemories = async () => {
      try {
        const data = await api.memories.getAll(user.id);
        setMemories(data);
      } catch (error) {
        console.error('Failed to fetch memories:', error);
      }
    };

    fetchMemories();

    // Subscribe to real-time updates
    const subscription = supabase
      .channel('memories_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'memories',
          filter: `user_id=eq.${user.id}`,
        },
        async (payload) => {
          console.log('Memory change received:', payload);
          // Refresh memories when changes occur
          fetchMemories();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user?.id]);

  const handleMemoryPress = (memory: Memory) => {
    setSelectedMemory(memory);
    setModalVisible(true);
  };

  const handleUpdate = async (updatedMemory: Memory) => {
    try {
      const updated = await api.memories.update(updatedMemory.id, {
        category: updatedMemory.category,
        content: updatedMemory.content,
      });
      setMemories(prev => 
        prev.map(m => m.id === updated.id ? updated : m)
      );
      setModalVisible(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to update memory');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.memories.delete(id);
      setMemories(prev => prev.filter(m => m.id !== id));
      setModalVisible(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to delete memory');
    }
  };

  const onRefresh = React.useCallback(async () => {
    if (!user?.id) return;
    setRefreshing(true);
    try {
      const { data } = await supabase
        .from('memories')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (data) setMemories(data);
    } catch (error) {
      Alert.alert('Error', 'Failed to refresh memories');
    } finally {
      setRefreshing(false);
    }
  }, [user?.id]);

  const handleCreate = async (category: string, content: string) => {
    if (!user?.id) return;
    try {
      console.log('Creating memory:', { category, content });
      const newMemory = await api.memories.create(user.id, {
        category,
        content,
        importance: 1,
      });
      console.log('Memory created:', newMemory);
      setMemories(prev => [newMemory, ...prev]);
    } catch (error) {
      console.error('Memory creation error:', error);
      Alert.alert('Error', 'Failed to create memory');
    }
  };

  const renderMemoryItem = ({ item }: { item: Memory }) => (
    <TouchableOpacity
      style={styles.memoryCard}
      onPress={() => handleMemoryPress(item)}
    >
      <Text style={styles.categoryLabel}>{item.category}</Text>
      <Text style={styles.contentText} numberOfLines={2}>
        {item.content}
      </Text>
    </TouchableOpacity>
  );

  if (loading && !memories.length) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={memories}
        renderItem={renderMemoryItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
        refreshing={refreshing}
        onRefresh={onRefresh}
      />
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setCreateModalVisible(true)}
      >
        <Feather name="plus" size={24} color="#fff" />
      </TouchableOpacity>
      <MemoryCardModal
        memory={selectedMemory}
        visible={modalVisible}
        onClose={() => {
          setModalVisible(false);
          setSelectedMemory(null);
        }}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
      />
      <CreateMemoryModal
        visible={createModalVisible}
        onClose={() => setCreateModalVisible(false)}
        onCreate={handleCreate}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    padding: 15,
  },
  memoryCard: {
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
  },
  categoryLabel: {
    fontSize: 16,
    color: '#666',
    marginBottom: 5,
  },
  contentText: {
    fontSize: 18,
    color: '#000',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    backgroundColor: '#007AFF',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
}); 