import React from 'react';
import { StyleProp, ViewStyle, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { colors, radii, spacing } from '../theme/tokens';

export interface GlassSurfaceProps {
  children: React.ReactNode;
  intensity?: number;
  tint?: 'dark' | 'light';
  radius?: number;
  padding?: number;
  elevation?: 'low' | 'medium' | 'high';
  style?: StyleProp<ViewStyle>;
}

export default function GlassSurface({ 
  children, 
  intensity = 40, 
  tint = 'dark', 
  radius = radii.xl, 
  padding = spacing.md, 
  elevation = 'medium',
  style 
}: GlassSurfaceProps) {
  
  let backgroundColor = colors.glassBg; // 'rgba(255,255,255,0.08)'
  let borderColor = colors.glassBorder; // 'rgba(255,255,255,0.14)'
  let extraStyle: ViewStyle = {};

  if (elevation === 'low') {
    backgroundColor = colors.glassBg;
    borderColor = colors.glassBorder;
  } else if (elevation === 'high') {
    backgroundColor = colors.glassBg;
    borderColor = colors.glassBorder;
    extraStyle = {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 12,
      elevation: 8,
    };
  }

  return (
    <BlurView 
      intensity={intensity} 
      tint={tint} 
      style={[{ 
        borderRadius: radius, 
        overflow: 'hidden', 
        backgroundColor, 
        borderWidth: 1, 
        borderColor, 
        padding 
      }, extraStyle, style]}
    >
      {children}
    </BlurView>
  );
}
