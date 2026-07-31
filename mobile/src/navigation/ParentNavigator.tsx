import { colors, fonts, radii, spacing } from '../theme/tokens';
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View } from 'react-native';
import { Home, LineChart, CalendarDays, MessageSquare, CircleUser } from 'lucide-react-native';
import ParentHomeScreen from '../screens/Parent/ParentHomeScreen';
import ChildProgressScreen from '../screens/Parent/ChildProgressScreen';
import ChildScheduleScreen from '../screens/Parent/ChildScheduleScreen';
import ParentForumScreen from '../screens/Parent/ParentForumScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();

export default function ParentNavigator() {
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg1 }}>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: 'rgba(2, 6, 23, 0.8)',
            borderTopColor: colors.glassBg,
            borderTopWidth: 1,
            position: 'absolute',
            elevation: 0,
            bottom: 0,
            left: 0,
            right: 0,
            height: 60,
            paddingBottom: 8,
          },
          tabBarActiveTintColor: colors.submitted,
          tabBarInactiveTintColor: 'rgba(255,255,255,0.4)',
        }}
      >
        <Tab.Screen 
          name="Ana Sayfa" 
          component={ParentHomeScreen} 
          options={{ tabBarIcon: ({ color, size }) => <Home color={color} size={size} /> }}
        />
        <Tab.Screen 
          name="Gelişim" 
          component={ChildProgressScreen} 
          options={{ tabBarIcon: ({ color, size }) => <LineChart color={color} size={size} /> }}
        />
        <Tab.Screen 
          name="Program" 
          component={ChildScheduleScreen} 
          options={{ tabBarIcon: ({ color, size }) => <CalendarDays color={color} size={size} /> }}
        />
        <Tab.Screen 
          name="Forum" 
          component={ParentForumScreen} 
          options={{ tabBarIcon: ({ color, size }) => <MessageSquare color={color} size={size} /> }}
        />
        <Tab.Screen 
          name="Profil" 
          component={ProfileScreen} 
          options={{ tabBarIcon: ({ color, size }) => <CircleUser color={color} size={size} /> }}
        />
      </Tab.Navigator>
    </View>
  );
}
