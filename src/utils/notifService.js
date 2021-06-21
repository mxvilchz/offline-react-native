import PushNotification from 'react-native-push-notification'
import NetInfo from '@react-native-community/netinfo'
import { pull, push } from './sync'

export const showNotification = (title, body) => {
  PushNotification.localNotification({
    id: 0,
    channelId: 'default-channel-id',
    title: title,
    message: body,
    autoCancel: true,
    playSound: false,
    soundName: 'default'
  })
}

export const syncData = async () => {
  NetInfo.fetch().then(async state => {
    if (state.isConnected) {
      await pull()
      await push()
    }
  })
}
