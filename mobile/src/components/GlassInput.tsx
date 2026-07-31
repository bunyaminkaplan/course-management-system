import { colors, fonts, radii, spacing } from '../theme/tokens';
import React from 'react';
import { TextInput, TextInputProps, StyleSheet, StyleProp, TextStyle } from 'react-native';

export interface GlassInputProps extends TextInputProps {
  style?: StyleProp<TextStyle>;
}

export default function GlassInput(props: GlassInputProps) {
  const { style, multiline, ...rest } = props;
  return (
    <TextInput
      style={[{ outlineStyle: 'none' } as any, styles.input, multiline && styles.multilineInput, style]}
      {...rest}
      multiline={multiline}
      placeholderTextColor="rgba(255,255,255,0.4)"
    />
  );
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: colors.glassBg,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.ink,
    fontSize: 14,
  },
  multilineInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  }
});
