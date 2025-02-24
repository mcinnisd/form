import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Memory, MemoryCategory } from '../types';

const CATEGORIES: MemoryCategory[] = [
  'Allergy',
  'Preference',
  'Diet',
  'Exercise',
  'Goal',
  'Grocery'
];

interface MemoryCardModalProps {
  memory: Memory | null;
  visible: boolean;
  onClose: () => void;
  onUpdate: (memory: Memory) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export const MemoryCardModal = ({
  memory,
  visible,
  onClose,
  onUpdate,
  onDelete,
}: MemoryCardModalProps) => {
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<MemoryCategory>('Preference');

  useEffect(() => {
    if (memory) {
      setContent(memory.content);
      setCategory(memory.category);
    }
  }, [memory]);

  const handleUpdate = async () => {
    if (!memory || !content.trim()) return;
    setLoading(true);
    try {
      await onUpdate({
        ...memory,
        content,
        category,
      });
      setEditing(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to update memory');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!memory) return;
    Alert.alert(
      'Delete Memory',
      'Are you sure you want to delete this memory?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await onDelete(memory.id);
              onClose();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete memory');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.header}>
              <Text style={styles.headerText}>
                {editing ? 'Edit Memory' : 'Memory Details'}
              </Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Feather name="x" size={24} color="#000" />
              </TouchableOpacity>
            </View>

            {loading ? (
              <ActivityIndicator size="large" color="#007AFF" />
            ) : (
              <>
                {editing ? (
                  <>
                    <Text style={styles.sectionTitle}>Category</Text>
                    <View style={styles.categoryGrid}>
                      {CATEGORIES.map((cat) => (
                        <TouchableOpacity
                          key={cat}
                          style={[
                            styles.categoryButton,
                            category === cat && styles.categoryButtonSelected,
                          ]}
                          onPress={() => setCategory(cat)}
                        >
                          <Text
                            style={[
                              styles.categoryButtonText,
                              category === cat && styles.categoryButtonTextSelected,
                            ]}
                          >
                            {cat}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                    <TextInput
                      style={[styles.input, styles.contentInput]}
                      value={content}
                      onChangeText={setContent}
                      placeholder="Memory content"
                      placeholderTextColor="#666"
                      multiline
                      textAlignVertical="top"
                    />
                  </>
                ) : (
                  <>
                    <Text style={styles.categoryLabel}>{memory?.category}</Text>
                    <Text style={styles.contentText}>{memory?.content}</Text>
                  </>
                )}

                <View style={styles.buttonContainer}>
                  <TouchableOpacity
                    style={[styles.button, styles.deleteButton]}
                    onPress={handleDelete}
                  >
                    <Text style={styles.buttonText}>Delete</Text>
                  </TouchableOpacity>
                  {editing ? (
                    <TouchableOpacity
                      style={[styles.button, styles.saveButton]}
                      onPress={handleUpdate}
                    >
                      <Text style={styles.buttonText}>Save</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={[styles.button, styles.editButton]}
                      onPress={() => setEditing(true)}
                    >
                      <Text style={styles.buttonText}>Edit</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </>
            )}
          </View>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 5,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 10,
    color: '#666',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
    gap: 8,
  },
  categoryButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: '#F2F2F7',
    marginRight: 8,
    marginBottom: 8,
  },
  categoryButtonSelected: {
    backgroundColor: '#007AFF',
  },
  categoryButtonText: {
    fontSize: 15,
    color: '#666',
  },
  categoryButtonTextSelected: {
    color: '#FFF',
    fontWeight: '500',
  },
  categoryLabel: {
    fontSize: 16,
    color: '#666',
    marginBottom: 10,
  },
  contentText: {
    fontSize: 18,
    color: '#000',
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 15,
  },
  contentInput: {
    minHeight: 100,
    maxHeight: 200,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 'auto',
    marginBottom: Platform.OS === 'ios' ? 20 : 0,
  },
  button: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  editButton: {
    backgroundColor: '#007AFF',
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
  },
  saveButton: {
    backgroundColor: '#34C759',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
}); 