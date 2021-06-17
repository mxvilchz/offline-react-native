import 'react-native-gesture-handler'
import 'react-native-url-polyfill/auto'

import React from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createStackNavigator } from '@react-navigation/stack'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { Provider as PaperProvider, DefaultTheme } from 'react-native-paper'
import NetInfo from '@react-native-community/netinfo'
import FlashMessage, { showMessage, hideMessage } from 'react-native-flash-message'

import HomeScreen from './src/screens/HomeScreen'
import CreateScreen from './src/screens/CreateScreen'
import LogsScreen from './src/screens/LogsScreen'
import SettingsScreen from './src/screens/SettingsScreen'

const Stack = createStackNavigator()

const App = () => {
  const [isConnected, setIsConnected] = React.useState(true)

  React.useEffect(() => {
    NetInfo.fetch().then(state => {
      console.log(state.isConnected)
      setIsConnected(state.isConnected)
    })
  }, [])

  React.useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected)
    })
    return () => unsubscribe()
  }, [])

  React.useEffect(() => {
    if (!isConnected) {
      showMessage({ message: 'Modo offline', type: 'danger', autoHide: false, style: { height: 50 } })
    } else {
      hideMessage()
    }
  }, [isConnected])

  return (
    <PaperProvider theme={DefaultTheme}>
      <SafeAreaProvider>
        <NavigationContainer>
          <Stack.Navigator>
            <Stack.Screen name="ToDo" component={HomeScreen} />
            <Stack.Screen name="Nuevo" component={CreateScreen} />
            <Stack.Screen name="Logs" component={LogsScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
          </Stack.Navigator>
        </NavigationContainer>
        <FlashMessage position="bottom" />
      </SafeAreaProvider>
    </PaperProvider>
  )
}

export default App
