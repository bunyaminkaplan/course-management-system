import { colors, fonts, radii, spacing } from '../theme/tokens';
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, StyleSheet } from 'react-native';
import { Home, CalendarDays, FilePenLine, MessageSquare, TrendingUp, CircleUser } from 'lucide-react-native';

import FeedScreen from '../screens/Student/FeedScreen';
import ScheduleScreen from '../screens/Student/ScheduleScreen';
import MyAssignmentsScreen from '../screens/Student/MyAssignmentsScreen';
import ForumScreen from '../screens/Student/ForumScreen';
import StudentStatusScreen from '../screens/Student/StudentStatusScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();

import { createNativeStackNavigator } from '@react-navigation/native-stack';



const Stack = createNativeStackNavigator();

function StudentTabs() {
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
          name="Akış" 
          component={FeedScreen} 
          options={{
            tabBarIcon: ({ color, size }) => <Home color={color} size={size} />
          }}
        />
        <Tab.Screen 
          name="Programım" 
          component={ScheduleScreen} 
          options={{
            tabBarIcon: ({ color, size }) => <CalendarDays color={color} size={size} />
          }}
        />
        <Tab.Screen 
          name="Ödevlerim" 
          component={MyAssignmentsScreen} 
          options={{
            tabBarIcon: ({ color, size }) => <FilePenLine color={color} size={size} />
          }}
        />
        <Tab.Screen 
          name="Forum" 
          component={ForumScreen} 
          options={{
            tabBarIcon: ({ color, size }) => <MessageSquare color={color} size={size} />
          }}
        />
        <Tab.Screen 
          name="Durum" 
          component={StudentStatusScreen} 
          options={{
            tabBarIcon: ({ color, size }) => <TrendingUp color={color} size={size} />
          }}
        />
      </Tab.Navigator>
    </View>
  );
}

export default function StudentNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="StudentTabs" component={StudentTabs} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
    </Stack.Navigator>
  );
}


const styles = StyleSheet.create({});
