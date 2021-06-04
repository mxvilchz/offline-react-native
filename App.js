/* eslint-disable prettier/prettier */
import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import HomeScreen from './src/screens/HomeScreen';
import CreateScreen from './src/screens/CreateScreen';

const Stack = createStackNavigator();

const App = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Inicio" component={HomeScreen} />
        <Stack.Screen name="Nuevo" component={CreateScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;
