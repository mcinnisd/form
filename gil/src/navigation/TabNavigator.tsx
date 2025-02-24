import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ChatScreen } from '../screens/ChatScreen';
import { MemoryScreen } from '../screens/MemoryScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { Feather } from '@expo/vector-icons';

const Tab = createBottomTabNavigator();

export const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 0,
          elevation: 0,
          height: 85, // Increased height for iOS style
          paddingBottom: 35, // Add padding for iPhone home indicator
          paddingTop: 10,
        },
        tabBarActiveTintColor: '#000',
        tabBarInactiveTintColor: '#8E8E93',
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '400',
        },
        headerStyle: {
          backgroundColor: '#fff',
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 0,
        },
        headerTitleStyle: {
          fontSize: 34,
          fontWeight: 'bold',
        }
      }}
    >
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ focused, color }) => (
            <Feather name="user" size={24} color={color} />
          ),
        }}
      />
      <Tab.Screen 
        name="Chat" 
        component={ChatScreen}
        options={{
          title: 'Coach',
          tabBarIcon: ({ focused, color }) => (
            <Feather name="message-circle" size={24} color={color} />
          ),
        }}
      />
      <Tab.Screen 
        name="Memories" 
        component={MemoryScreen}
        options={{
          tabBarIcon: ({ focused, color }) => (
            <Feather name="umbrella" size={24} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}; 