import React from 'react';
import { View } from 'react-native';

export const LinearGradient = ({ colors, style, children, start, end, ...props }: any) => {
  // A simple approximation for web linear-gradient based on start/end
  // React Native Web doesn't support linear-gradient via style natively without custom plugins,
  // but we can pass it as a raw DOM style if needed, or just use a fallback solid color.
  // For standard React Native Web, we can cast style to any to pass standard CSS.
  let background = `linear-gradient(135deg, ${colors.join(', ')})`;
  if (start && end) {
      // Basic approximation
      background = `linear-gradient(to bottom right, ${colors.join(', ')})`;
  }
  
  return (
    <View style={[style, { backgroundImage: background } as any]} {...props}>
      {children}
    </View>
  );
};
