import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, useWindowDimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts } from '../theme/tokens';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

export interface GlassTabBarProps {
  tabs: { key: string; icon: React.ReactNode; label: string; active?: boolean }[];
  onTabPress?: (key: string) => void;
}

export default function GlassTabBar({ tabs, onTabPress }: GlassTabBarProps) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const indicatorPosition = useSharedValue(0);

  const activeIndex = tabs.findIndex(t => t.active);
  const tabWidth = width / (tabs.length || 1);

  useEffect(() => {
    if (activeIndex !== -1) {
      const targetX = (tabWidth * activeIndex) + (tabWidth / 2) - 2; // -2 for half of 4px indicator width
      indicatorPosition.value = withSpring(targetX, { damping: 15, stiffness: 150 });
    }
  }, [activeIndex, tabWidth]);

  const indicatorStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: indicatorPosition.value }],
      opacity: activeIndex !== -1 ? 1 : 0
    };
  });

  return (
    <BlurView
      intensity={60}
      tint="dark"
      style={{
        backgroundColor: colors.glassBg,
        borderTopWidth: 1,
        borderTopColor: colors.glassBorder,
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingTop: 11,
        paddingBottom: insets.bottom + 16,
      }}
    >
      <Animated.View style={[{
        position: 'absolute',
        top: 3, // 11 padding - 8 margin
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: colors.accent,
      }, indicatorStyle]} />

      {tabs.map((tab) => (
        <Pressable 
          key={tab.key} 
          onPress={() => onTabPress?.(tab.key)}
          style={{ alignItems: 'center', justifyContent: 'center', width: tabWidth }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          {tab.icon}
          <Text style={{
            fontSize: 8,
            color: tab.active ? colors.ink : colors.inkDim,
            fontWeight: tab.active ? '600' : 'normal',
            marginTop: 4,
            fontFamily: fonts.body
          }}>
            {tab.label}
          </Text>
        </Pressable>
      ))}
    </BlurView>
  );
}
