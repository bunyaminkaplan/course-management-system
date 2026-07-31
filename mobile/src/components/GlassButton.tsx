import React from 'react';
import { Pressable, Text, ActivityIndicator, StyleProp, ViewStyle, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radii, fonts } from '../theme/tokens';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

export interface GlassButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
}

export default function GlassButton({ label, onPress, disabled = false, loading = false, style }: GlassButtonProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }]
    };
  });

  const handlePressIn = () => {
    if (!disabled && !loading) {
      scale.value = withSpring(0.96);
    }
  };

  const handlePressOut = () => {
    if (!disabled && !loading) {
      scale.value = withSpring(1);
    }
  };

  return (
    <Pressable 
      onPress={onPress} 
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      style={[{
          borderRadius: radii.md,
          minHeight: 46,
          opacity: (disabled || loading) ? 0.5 : 1,
          ...Platform.select({
            ios: { shadowColor: colors.accent, shadowOpacity: 0.35, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
            android: { elevation: 6 },
          })
        },
        style
      ]}
    >
      <Animated.View style={[{ flex: 1, borderRadius: radii.md, overflow: 'hidden' }, animatedStyle]}>
        <LinearGradient
          colors={[colors.accent, colors.accentSoft]}
          start={{x:0, y:0}}
          end={{x:1, y:1}}
          style={{ flex: 1, paddingVertical: 12, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 }}
        >
          {loading ? (
            <ActivityIndicator color={colors.bg3} />
          ) : (
            <Text style={{
              color: colors.bg3,
              fontFamily: fonts.headingSemibold,
              fontSize: 12.5,
              letterSpacing: -0.3,
            }}>
              {label}
            </Text>
          )}
        </LinearGradient>
      </Animated.View>
    </Pressable>
  );
}
