import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAuth } from '../contexts/AuthContext';

// Auth Screens
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';

// Main Screens
import HomeScreen from '../screens/HomeScreen';
import ChatScreen from '../screens/ChatScreen';
import TransactionsScreen from '../screens/TransactionsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import AccountDetailsScreen from '../screens/AccountDetailsScreen';
import TransferScreen from '../screens/TransferScreen';
import AssistantScreen from '../screens/AssistantScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const TabNavigator = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ focused, color, size }) => {
        let iconName;

        switch (route.name) {
          case 'Home':
            iconName = 'home';
            break;
          case 'Transactions':
            iconName = 'receipt-long';
            break;
          case 'Chat':
            iconName = 'chat';
            break;
          case 'Profile':
            iconName = 'person';
            break;
          case 'Assistant':
            iconName = 'chat';
            break;
          default:
            iconName = 'circle';
        }

        return <Icon name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: '#2C3E50',
      tabBarInactiveTintColor: '#95A5A6',
      headerStyle: {
        backgroundColor: '#2C3E50',
      },
      headerTintColor: '#fff',
    })}
  >
    <Tab.Screen name="Home" component={HomeScreen} />
    <Tab.Screen name="Transactions" component={TransactionsScreen} />
    <Tab.Screen name="Chat" component={ChatScreen} />
    <Tab.Screen name="Profile" component={ProfileScreen} />
    <Tab.Screen name="Assistant" component={AssistantScreen} />
  </Tab.Navigator>
);

const AppNavigator = () => {
  const { user, loading } = useAuth();

  if (loading) {
    // You might want to show a splash screen here
    return null;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        {!user ? (
          // Auth Stack
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        ) : (
          // Main Stack
          <>
            <Stack.Screen name="MainTabs" component={TabNavigator} />
            <Stack.Screen
              name="AccountDetails"
              component={AccountDetailsScreen}
              options={{
                headerShown: true,
                headerStyle: {
                  backgroundColor: '#2C3E50',
                },
                headerTintColor: '#fff',
              }}
            />
            <Stack.Screen
              name="Transfer"
              component={TransferScreen}
              options={{
                headerShown: true,
                headerStyle: {
                  backgroundColor: '#2C3E50',
                },
                headerTintColor: '#fff',
              }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
