import { colors, fonts, radii, spacing } from '../theme/tokens';
import React from 'react';
import { View } from 'react-native';

export const BlurView = ({ intensity = 50, tint = 'default', style, children, ...props }: any) => {
  let backgroundColor = 'transparent';
  if (tint === 'dark') {
    backgroundColor = 'rgba(0,0,0,0.5)';
  } else if (tint === 'light') {
    backgroundColor = colors.glassBorder;
  }
  
  return (
    <View style={[style, { 
      backgroundColor, 
      backdropFilter: `blur(${intensity / 5}px)`, 
      WebkitBackdropFilter: `blur(${intensity / 5}px)`
    } as any]} {...props}>
      {children}
    </View>
  );
};
