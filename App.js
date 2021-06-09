/* eslint-disable prettier/prettier */
import 'react-native-gesture-handler';
import 'react-native-url-polyfill/auto';

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider as PaperProvider, DefaultTheme } from 'react-native-paper';

import HomeScreen from './src/screens/HomeScreen';
import CreateScreen from './src/screens/CreateScreen';
import LogsScreen from './src/screens/LogsScreen';

const Stack = createStackNavigator();

const App = () => {
  return (
    <PaperProvider theme={DefaultTheme}>
      <SafeAreaProvider>
        <NavigationContainer>
          <Stack.Navigator>
            <Stack.Screen name="Inicio" component={HomeScreen} />
            <Stack.Screen name="Nuevo" component={CreateScreen} />
            <Stack.Screen name="Logs" component={LogsScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </PaperProvider>
  );
};

export default App;
