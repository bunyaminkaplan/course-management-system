import { View } from 'react-native';
import React from 'react';

const AnimatedView = React.forwardRef((props, ref) => <View ref={ref} {...props} />);

export default {
  View: AnimatedView,
  Text: View,
  Image: View,
  ScrollView: View,
  createAnimatedComponent: (comp) => comp,
};

export const useSharedValue = (v) => ({ value: v });
export const useAnimatedStyle = (fn) => fn();
export const withTiming = (v) => v;
export const withSpring = (v) => v;
export const withRepeat = (v) => v;
export const interpolate = () => 0;
export const Easing = { inOut: () => {}, sin: () => {} };
export const FadeInDown = { duration: () => ({ delay: () => ({}) }) };

export const Animated = {
  View: AnimatedView,
  Text: View,
  Image: View,
  ScrollView: View,
  createAnimatedComponent: (comp) => comp,
};
