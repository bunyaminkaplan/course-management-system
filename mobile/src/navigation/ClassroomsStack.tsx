import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ClassroomsListScreen from '../screens/Instructor/ClassroomsListScreen';
import ClassroomDetailScreen from '../screens/Instructor/ClassroomDetailScreen';
import StudentDetailScreen from '../screens/Instructor/StudentDetailScreen';
import GradeEntryScreen from '../screens/Instructor/GradeEntryScreen';

const Stack = createNativeStackNavigator();

export default function ClassroomsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ClassroomsList" component={ClassroomsListScreen} />
      <Stack.Screen name="ClassroomDetail" component={ClassroomDetailScreen} />
      <Stack.Screen name="StudentDetail" component={StudentDetailScreen} />
      <Stack.Screen name="GradeEntry" component={GradeEntryScreen} />
    </Stack.Navigator>
  );
}
