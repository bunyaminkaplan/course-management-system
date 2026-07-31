import { colors, fonts, radii, spacing } from '../theme/tokens';
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View } from 'react-native';
import { Home, Users, CheckSquare, FileEdit, MessageSquare, GraduationCap } from 'lucide-react-native';

import InstructorHomeScreen from '../screens/Instructor/InstructorHomeScreen';
import ClassroomsStack from './ClassroomsStack';
import AttendanceStack from './AttendanceStack';
import InstructorAssignmentsStack from './InstructorAssignmentsStack';
import InstructorExamsStack from './InstructorExamsStack';
import ForumScreen from '../screens/Student/ForumScreen'; // using the existing one
import ProfileScreen from '../screens/ProfileScreen';
import { ErrorBoundary } from '../components/ErrorBoundary';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function InstructorTabs() {
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
          tabBarActiveTintColor: colors.accentSoft,
          tabBarInactiveTintColor: 'rgba(255,255,255,0.4)',
        }}
      >
        <Tab.Screen
          name="Ana Sayfa"
          component={InstructorHomeScreen}
          options={{ tabBarIcon: ({ color, size }) => <Home color={color} size={size} /> }}
        />
        <Tab.Screen
          name="Sınıflarım"
          component={ClassroomsStack}
          options={{ tabBarIcon: ({ color, size }) => <Users color={color} size={size} /> }}
        />
        <Tab.Screen
          name="Yoklama"
          component={AttendanceStack}
          options={{ tabBarIcon: ({ color, size }) => <CheckSquare color={color} size={size} /> }}
        />
        <Tab.Screen
          name="Ödevler"
          component={InstructorAssignmentsStack}
          options={{ tabBarIcon: ({ color, size }) => <FileEdit color={color} size={size} /> }}
        />
        <Tab.Screen
          name="Forum"
          component={ForumScreen}
          options={{ tabBarIcon: ({ color, size }) => <MessageSquare color={color} size={size} /> }}
        />
        <Tab.Screen
          name="Sınavlar"
          component={InstructorExamsStack}
          options={{ tabBarIcon: ({ color, size }) => <GraduationCap color={color} size={size} /> }}
        />
      </Tab.Navigator>
    </View>
  );
}

export default function InstructorNavigator() {
  return (
    <ErrorBoundary>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="InstructorTabs" component={InstructorTabs} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
      </Stack.Navigator>
    </ErrorBoundary>
  );
}
