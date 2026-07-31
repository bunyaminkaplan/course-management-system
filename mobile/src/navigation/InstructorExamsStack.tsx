import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import InstructorExamsListScreen from '../screens/Instructor/InstructorExamsListScreen';
import CreateExamScreen from '../screens/Instructor/CreateExamScreen';
import GradeEntryScreen from '../screens/Instructor/GradeEntryScreen';

const Stack = createNativeStackNavigator();

export default function InstructorExamsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="InstructorExamsList" component={InstructorExamsListScreen} />
      <Stack.Screen name="CreateExam" component={CreateExamScreen} />
      <Stack.Screen name="GradeEntry" component={GradeEntryScreen} />
    </Stack.Navigator>
  );
}
