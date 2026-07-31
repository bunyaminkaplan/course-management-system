import React from 'react';
import { View, Animated } from 'react-native';

export const enableScreens = () => {};
export const enableFreeze = () => {};
export const ScreenContainer = View;
export const Screen = React.forwardRef((props: any, ref) => <View ref={ref as any} {...props} />);
export const NativeScreen = View;
export const NativeScreenContainer = View;
export const ScreenStack = View;
export const ScreenStackHeaderConfig = View;
export const ScreenStackHeaderSubview = View;
export const ScreenStackHeaderRightView = View;
export const ScreenStackHeaderLeftView = View;
export const ScreenStackHeaderTitleView = View;
export const ScreenStackHeaderCenterView = View;
export const ScreenStackHeaderSearchBarView = View;
export const SearchBar = View;
export const FullWindowOverlay = View;
export const NativeScreenNavigationContainer = View;
export const ScreenContext = React.createContext(View);
export const TabsScreen = View;
export const TabsHost = View;
export const useHeaderMeasurements = () => ({ top: 0, right: 0, bottom: 0, left: 0 });

const InnerScreen = View;
export const AnimatedScreen = Animated.createAnimatedComponent(InnerScreen);

export default {
  enableScreens,
  enableFreeze,
  ScreenContainer,
  Screen,
  NativeScreen,
  NativeScreenContainer,
  ScreenStack,
  ScreenStackHeaderConfig,
  ScreenStackHeaderSubview,
  ScreenStackHeaderRightView,
  ScreenStackHeaderLeftView,
  ScreenStackHeaderTitleView,
  ScreenStackHeaderCenterView,
  ScreenStackHeaderSearchBarView,
  SearchBar,
  FullWindowOverlay,
  NativeScreenNavigationContainer,
  ScreenContext,
  AnimatedScreen,
  TabsScreen,
  TabsHost,
  useHeaderMeasurements
};
