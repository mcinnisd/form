import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ChatScreen } from '../screens/ChatScreen';
import { MemoryScreen } from '../screens/MemoryScreen';

const Stack = createNativeStackNavigator();

export const MainStack = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="Chat" 
        component={ChatScreen}
        options={{ title: 'Health Coach AI' }}
      />
      <Stack.Screen 
        name="Memory" 
        component={MemoryScreen}
        options={{ title: 'Memories' }}
      />
    </Stack.Navigator>
  );
}; 