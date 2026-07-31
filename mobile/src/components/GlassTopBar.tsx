import React from 'react';
import { View, Text } from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts } from '../theme/tokens';

export interface GlassTopBarProps {
  title: string;
  leftElement?: React.ReactNode;
  rightElement?: React.ReactNode;
}

export default function GlassTopBar({ title, leftElement, rightElement }: GlassTopBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <BlurView
      intensity={60}
      tint="dark"
      style={{
        paddingTop: insets.top + 8,
        paddingBottom: 12,
        paddingHorizontal: 16,
        backgroundColor: colors.glassBg,
        borderBottomWidth: 1,
        borderBottomColor: colors.glassBorder,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 50,
      }}
    >
      <View style={{ width: 40, alignItems: 'flex-start' }}>
        {leftElement || <View />}
      </View>
      <Text style={{
        fontFamily: fonts.headingBold,
        fontSize: 15,
        color: colors.ink,
        textAlign: 'center',
        flex: 1,
        letterSpacing: -0.3
      }}>
        {title}
      </Text>
      <View style={{ width: 40, alignItems: 'flex-end' }}>
        {rightElement || <View />}
      </View>
    </BlurView>
  );
}
