import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Provider } from 'react-redux';
import { store } from './store';

import LoginScreen from './screens/LoginScreen';
import HomeScreen from './screens/HomeScreen';
import ChatScreen from './screens/ChatScreen';
import TransactionsScreen from './screens/TransactionsScreen';
import ProfileScreen from './screens/ProfileScreen';

import { AuthProvider } from './contexts/AuthContext';
import { navigationRef } from './navigation/RootNavigation';

const Stack = createStackNavigator();

const App = () => {
  return (
    <Provider store={store}>
      <AuthProvider>
        <NavigationContainer ref={navigationRef}>
          <Stack.Navigator
            screenOptions={{
              headerStyle: {
                backgroundColor: '#2C3E50',
              },
              headerTintColor: '#fff',
              headerTitleStyle: {
                fontWeight: 'bold',
              },
            }}
          >
            <Stack.Screen
              name="Login"
              component={LoginScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="Home"
              component={HomeScreen}
              options={{ title: 'Dashboard' }}
            />
            <Stack.Screen
              name="Chat"
              component={ChatScreen}
              options={{ title: 'AI Assistant' }}
            />
            <Stack.Screen
              name="Transactions"
              component={TransactionsScreen}
              options={{ title: 'Transactions' }}
            />
            <Stack.Screen
              name="Profile"
              component={ProfileScreen}
              options={{ title: 'Profile' }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </AuthProvider>
    </Provider>
  );
};

export default App;
