import React from 'react';
import { View } from 'react-native';

export const SafeAreaView = ({ children, style, ...props }: any) => {
  return <View style={[{ paddingTop: 40 }, style]} {...props}>{children}</View>;
};

export const SafeAreaProvider = ({ children }: any) => <>{children}</>;

export const useSafeAreaInsets = () => ({ top: 40, right: 0, bottom: 0, left: 0 });

export const initialWindowMetrics = { frame: { x: 0, y: 0, width: 0, height: 0 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } };

export const SafeAreaInsetsContext = React.createContext({ top: 40, right: 0, bottom: 0, left: 0 });
