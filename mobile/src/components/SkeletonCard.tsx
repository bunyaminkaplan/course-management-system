import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing } from 'react-native-reanimated';
import GlassSurface from './GlassSurface';
import { colors } from '../theme/tokens';

export default function SkeletonCard() {
  const translateX = useSharedValue(-300);

  useEffect(() => {
    translateX.value = withRepeat(
      withTiming(300, { duration: 1500, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  return (
    <GlassSurface style={styles.container}>
      <Animated.View style={[StyleSheet.absoluteFill, animatedStyle]}>
        <LinearGradient
          colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.05)', 'rgba(255,255,255,0)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
      <View style={styles.row}>
        <View style={styles.pill} />
        <View style={styles.textSmall} />
      </View>
      <View style={styles.textLarge} />
      <View style={styles.textMedium} />
    </GlassSurface>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 100,
    marginBottom: 8,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  pill: {
    width: 80,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.glassBorder,
  },
  textSmall: {
    width: 60,
    height: 14,
    borderRadius: 4,
    backgroundColor: colors.glassBorder,
  },
  textLarge: {
    width: '70%',
    height: 18,
    borderRadius: 4,
    backgroundColor: colors.glassBorder,
    marginBottom: 8,
  },
  textMedium: {
    width: '90%',
    height: 14,
    borderRadius: 4,
    backgroundColor: colors.glassBorder,
  },
});
