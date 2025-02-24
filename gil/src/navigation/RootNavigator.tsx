import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { AuthStack } from './AuthStack';
import { TabNavigator } from './TabNavigator';
import { useAuthStore } from '../stores/authStore';

export const RootNavigator = () => {
  // Get authentication state from our store
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return (
    <NavigationContainer>
      {/* Show AuthStack when not authenticated, TabNavigator when authenticated */}
      {isAuthenticated ? <TabNavigator /> : <AuthStack />}
    </NavigationContainer>
  );
}; 