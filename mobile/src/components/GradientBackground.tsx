import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme/tokens';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing, interpolate } from 'react-native-reanimated';

const hexToRgba = (hex: string, alpha: number) => {
  const cleanHex = hex.replace('#', '');
  const r = parseInt(cleanHex.slice(0, 2), 16);
  const g = parseInt(cleanHex.slice(2, 4), 16);
  const b = parseInt(cleanHex.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
};

export default function GradientBackground({ children }: { children: React.ReactNode }) {
  const float1 = useSharedValue(0);
  const float2 = useSharedValue(0);
  const float3 = useSharedValue(0);

  useEffect(() => {
    float1.value = withRepeat(withTiming(1, { duration: 6000, easing: Easing.inOut(Easing.sin) }), -1, true);
    float2.value = withRepeat(withTiming(1, { duration: 7500, easing: Easing.inOut(Easing.sin) }), -1, true);
    float3.value = withRepeat(withTiming(1, { duration: 9000, easing: Easing.inOut(Easing.sin) }), -1, true);
  }, []);

  const style1 = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(float1.value, [0,1], [-10, 10]) }],
  }));
  const style2 = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(float2.value, [0,1], [-15, 15]) }],
  }));
  const style3 = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(float3.value, [0,1], [-12, 12]) }],
  }));

  return (
    <View style={{ flex: 1, overflow: 'hidden' }}>
      <LinearGradient 
        colors={[colors.bg1, colors.bg2, colors.bg3]}
        style={StyleSheet.absoluteFill} 
        start={{x:0,y:0}} 
        end={{x:0.35,y:1}} 
      />
      
      <View style={{ position:'absolute', width:'140%', height:'70%',
        borderRadius:9999, backgroundColor:'rgba(255,255,255,0.06)', top:'-20%',
        left:'-20%' }} />

      <Animated.View style={[{ position:'absolute', width:280, height:280, borderRadius:140,
        backgroundColor:hexToRgba(colors.accent, 0.16), top:'8%', left:'-12%' }, style1]} />
      <Animated.View style={[{ position:'absolute', width:260, height:260, borderRadius:130,
        backgroundColor:hexToRgba(colors.submitted, 0.14), top:'2%', right:'-15%' }, style2]} />
      <Animated.View style={[{ position:'absolute', width:300, height:300, borderRadius:150,
        backgroundColor:hexToRgba(colors.overdue, 0.12), bottom:'-8%', left:'22%' }, style3]} />
        
      <View style={{ flex: 1 }}>{children}</View>
      
      <LinearGradient pointerEvents="none" colors={['transparent','transparent',
        'rgba(0,0,0,0.18)']} locations={[0,0.75,1]} style={StyleSheet.absoluteFill} />
    </View>
  );
}
