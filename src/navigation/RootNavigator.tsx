import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { colors } from '../theme';

// Screens
import { LoginScreen, RegisterScreen } from '../screens/auth';
import { DashboardScreen } from '../screens/dashboard';
import { DepositScreen, WithdrawScreen, TransferScreen } from '../screens/transactions';
import { CardScreen } from '../screens/card';
import { HistoryScreen } from '../screens/history';

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type AppTabParamList = {
  Dashboard: undefined;
  History: undefined;
  Card: undefined;
};

export type TransactionStackParamList = {
  Deposit: undefined;
  Withdraw: undefined;
  Transfer: undefined;
};

const AuthStack = createStackNavigator<AuthStackParamList>();
const AppTab = createBottomTabNavigator<AppTabParamList>();
const TransactionStack = createStackNavigator<TransactionStackParamList>();

function AuthNavigator() {
  return (
    <AuthStack.Navigator 
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: colors.background },
      }}
    >
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
    </AuthStack.Navigator>
  );
}

function TransactionNavigator() {
  return (
    <TransactionStack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.primary,
        },
        headerTintColor: colors.white,
        headerTitleStyle: {
          fontWeight: '600',
        },
        cardStyle: { backgroundColor: colors.background },
      }}
    >
      <TransactionStack.Screen 
        name="Deposit" 
        component={DepositScreen}
        options={{ title: 'Depósito' }}
      />
      <TransactionStack.Screen 
        name="Withdraw" 
        component={WithdrawScreen}
        options={{ title: 'Saque' }}
      />
      <TransactionStack.Screen 
        name="Transfer" 
        component={TransferScreen}
        options={{ title: 'Transferência' }}
      />
    </TransactionStack.Navigator>
  );
}

function AppNavigator() {
  return (
    <AppTab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'Dashboard') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'History') {
            iconName = focused ? 'list' : 'list-outline';
          } else if (route.name === 'Card') {
            iconName = focused ? 'card' : 'card-outline';
          } else {
            iconName = 'home-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopWidth: 0,
          paddingBottom: 8,
          paddingTop: 8,
          height: 70,
          shadowColor: colors.shadow.medium,
          shadowOffset: {
            width: 0,
            height: -2,
          },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 10,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          position: 'absolute',
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.text.light,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginTop: -4,
        },
        tabBarIconStyle: {
          marginTop: 4,
        },
      })}
    >
      <AppTab.Screen 
        name="Dashboard" 
        component={DashboardScreen}
        options={{
          tabBarLabel: 'Início',
        }}
      />
      <AppTab.Screen 
        name="History" 
        component={HistoryScreen}
        options={{
          tabBarLabel: 'Histórico',
        }}
      />
      <AppTab.Screen 
        name="Card" 
        component={CardScreen}
        options={{
          tabBarLabel: 'Cartão',
        }}
      />
    </AppTab.Navigator>
  );
}

export default function RootNavigator() {
  const { state } = useApp();

  return (
    <NavigationContainer>
      {state.auth.isAuthenticated ? <AppNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}