import React from 'react';
import { View, Text } from 'react-native';

export class ErrorBoundary extends React.Component<any, any> {
  state = { hasError: false, error: null as any, info: null as any };

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, info: any) {
    console.error("ErrorBoundary caught:", error, info.componentStack);
    this.setState({ info });
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Text style={{ color: 'red', fontWeight: 'bold' }}>ErrorBoundary Caught an Error:</Text>
          <Text>{String(this.state.error?.message || this.state.error)}</Text>
          <Text style={{ fontSize: 10, marginTop: 10 }}>{this.state.info?.componentStack}</Text>
        </View>
      );
    }
    return this.props.children;
  }
}
