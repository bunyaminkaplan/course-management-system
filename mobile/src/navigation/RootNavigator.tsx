import { colors, fonts, radii, spacing } from '../theme/tokens';
import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useAuth } from '../context/AuthContext';
import LoginScreen from '../screens/LoginScreen';
import StudentNavigator from './StudentNavigator';
import InstructorNavigator from './InstructorNavigator';
import ParentNavigator from './ParentNavigator';
import AdminPlaceholderScreen from '../screens/AdminPlaceholderScreen';
import { ChildSwitcherProvider } from '../context/ChildSwitcherContext';

export default function RootNavigator() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg1 }}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  if (user.role === 'STUDENT') {
    return <StudentNavigator />;
  }

  if (user.role === 'INSTRUCTOR') {
    return <InstructorNavigator />;
  }

  if (user.role === 'PARENT') {
    return (
      <ChildSwitcherProvider>
        <ParentNavigator />
      </ChildSwitcherProvider>
    );
  }

  // Admin
  return <AdminPlaceholderScreen />;
}
