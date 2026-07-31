import React from 'react';
import { View, Text, StyleProp, ViewStyle } from 'react-native';
import { colors, radii, fonts } from '../theme/tokens';

export interface GlassBadgeProps {
  label: string;
  variant: 'pending' | 'submitted' | 'overdue';
  style?: StyleProp<ViewStyle>;
}

const hexToRgba = (hex: string, alpha: number) => {
  const cleanHex = hex.replace('#', '');
  const r = parseInt(cleanHex.slice(0, 2), 16);
  const g = parseInt(cleanHex.slice(2, 4), 16);
  const b = parseInt(cleanHex.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
};

export default function GlassBadge({ label, variant, style }: GlassBadgeProps) {
  const badgeColor = colors[variant];
  const textColor = variant === 'pending' ? colors.bg1 : colors.ink;
  return (
    <View style={[{
      backgroundColor: hexToRgba(badgeColor, 0.16),
      borderWidth: 1,
      borderColor: hexToRgba(badgeColor, 0.45),
      borderRadius: radii.pill,
      paddingHorizontal: 9,
      paddingVertical: 3,
    }, style]}>
      <Text style={{
        color: textColor,
        fontFamily: fonts.bodySemibold,
        fontSize: 9,
      }}>{label}</Text>
    </View>
  );
}
