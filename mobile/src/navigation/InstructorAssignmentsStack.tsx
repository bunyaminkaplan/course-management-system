import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AssignmentsListScreen from '../screens/Instructor/AssignmentsListScreen';
import CreateAssignmentScreen from '../screens/Instructor/CreateAssignmentScreen';
import AssignmentSubmissionsScreen from '../screens/Instructor/AssignmentSubmissionsScreen';

const Stack = createNativeStackNavigator();

export default function InstructorAssignmentsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AssignmentsList" component={AssignmentsListScreen} />
      <Stack.Screen name="CreateAssignment" component={CreateAssignmentScreen} />
      <Stack.Screen name="AssignmentSubmissions" component={AssignmentSubmissionsScreen} />
    </Stack.Navigator>
  );
}
