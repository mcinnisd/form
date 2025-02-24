import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useAuthStore } from '../stores/authStore';

export const ProfileScreen = () => {
  const signOut = useAuthStore(state => state.signOut);
  const user = useAuthStore(state => state.user);

  return (
    <View style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.label}>Name</Text>
        <Text style={styles.value}>{user?.user_metadata?.name || 'User'}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Email</Text>
        <Text style={styles.value}>{user?.email}</Text>
      </View>

      <TouchableOpacity 
        style={styles.logoutButton}
        onPress={signOut}
      >
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  section: {
    backgroundColor: '#F2F2F7',
    padding: 16,
    borderRadius: 10,
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 4,
  },
  value: {
    fontSize: 17,
    color: '#000',
  },
  logoutButton: {
    backgroundColor: '#F2F2F7',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 'auto',
  },
  logoutText: {
    fontSize: 17,
    color: '#000',
  },
}); 