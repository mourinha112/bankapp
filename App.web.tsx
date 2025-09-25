import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { View } from 'react-native';
import { AppProvider } from './src/context/AppContext';
import RootNavigator from './src/navigation/RootNavigator';
import { colors } from './src/theme';

// Web-only entrypoint. This file will be used by the web bundler instead of App.tsx
// It wraps the existing app in a centered container with a sensible maxWidth
// so the layout looks good on desktop browsers without changing the mobile app.
export default function AppWeb() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppProvider>
        <StatusBar style="light" backgroundColor={colors.primary} />
        {/* Outer wrapper centers the app horizontally on wide screens */}
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-start' }}>
          {/* Inner container limits width for better web appearance */}
          <View style={{ width: '100%', maxWidth: 430, flex: 1 }}>
            <RootNavigator />
          </View>
        </View>
      </AppProvider>
    </GestureHandlerRootView>
  );
}
