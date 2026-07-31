import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SessionsListScreen from '../screens/Instructor/SessionsListScreen';
import AttendanceTakingScreen from '../screens/Instructor/AttendanceTakingScreen';

const Stack = createNativeStackNavigator();

export default function AttendanceStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SessionsList" component={SessionsListScreen} />
      <Stack.Screen name="AttendanceTaking" component={AttendanceTakingScreen} />
    </Stack.Navigator>
  );
}
