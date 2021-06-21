import ReactNativeForegroundService from '@supersami/rn-foreground-service'

import { AppRegistry } from 'react-native'
import App from './App'
import './src/models/index'
import messaging from '@react-native-firebase/messaging'

import './src/utils/notificationHandler'

import { name as appName } from './app.json'
import { showNotification, syncData } from './src/utils/notifService'

messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log('Message handled in the background!', remoteMessage)
  if (remoteMessage) {
    const { data } = remoteMessage
    syncData()
    showNotification(data.title, data.body)
  }
})

ReactNativeForegroundService.register()
AppRegistry.registerComponent(appName, () => App)
