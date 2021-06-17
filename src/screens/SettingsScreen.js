/* eslint-disable array-callback-return */
/* eslint-disable react/prop-types */
import React from 'react'
import { View, SafeAreaView, ToastAndroid } from 'react-native'
import { Title, List, Switch } from 'react-native-paper'
import ReactNativeForegroundService from '@supersami/rn-foreground-service'
import NetInfo from '@react-native-community/netinfo'
import BackgroundFetch from 'react-native-background-fetch'
import AsyncStorage from '@react-native-async-storage/async-storage'

import { database } from '../models'
import { pull, push } from '../utils/sync'

const SettingsScreen = ({ navigation }) => {
  const [toggleServiceOne, setToggleServiceOne] = React.useState(false)
  const [toggleServiceTwo, setToggleServiceTwo] = React.useState(false)

  const [isConnected, setIsConnected] = React.useState(true)

  React.useEffect(() => {
    getStatusBackgroundFetch()
    getStatusForegroundFetch()
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected)
    })
    return () => unsubscribe()
  }, [])

  const getStatusBackgroundFetch = async () => {
    try {
      const value = await AsyncStorage.getItem('@backgroundFetch')
      if (value !== null) {
        const data = JSON.parse(value)
        setToggleServiceOne(data.status)
      }
    } catch (e) {
      console.log(e)
    }
  }

  const getStatusForegroundFetch = async () => {
    try {
      const value = await AsyncStorage.getItem('@foregroundFetch')
      if (value !== null) {
        const data = JSON.parse(value)
        setToggleServiceTwo(data.status)
      }
    } catch (e) {
      console.log(e)
    }
  }

  const onStopForegroundService = () => {
    // Make always sure to remove the task before stoping the service. and instead of re-adding the task you can always update the task.
    if (ReactNativeForegroundService.is_task_running('taskid')) {
      ReactNativeForegroundService.remove_task('taskid')
    }
    // Stoping Foreground service.
    return ReactNativeForegroundService.stop()
  }

  const onStartForegroundService = () => {
    // Checking if the task i am going to create already exist and running, which means that the foreground is also running.
    if (ReactNativeForegroundService.is_task_running('taskid')) return
    // Creating a task.
    ReactNativeForegroundService.add_task(
      syncData,
      {
        delay: 60000,
        onLoop: true,
        taskId: 'taskid',
        onSuccess: async () => {
          const logCollection = await database.collections.get('logs')
          await database.action(async () => {
            await logCollection.create(log => {
              log.taskId = 'foreground-services-task'
              log.timestamp = (new Date()).toString()
            })
          })
        },
        onError: (e) => console.log('Error logging:', e)
      }
    )
    // starting  foreground service.
    return ReactNativeForegroundService.start({
      id: 144,
      title: 'Servicio de primer plano',
      message: 'Estás en línea!'
    })
  }

  const syncData = async () => {
    if (isConnected) {
      await pull()
      await push()
    }
  }

  const toggleBackgroundFetch = async (value) => {
    try {
      setToggleServiceOne(value)
      if (value) {
        await BackgroundFetch.start()
        ToastAndroid.showWithGravity('[BackgroundFetch] START', ToastAndroid.SHORT, ToastAndroid.BOTTOM)
      } else {
        await BackgroundFetch.stop('react-native-background-fetch')
        ToastAndroid.showWithGravity('[BackgroundFetch] STOP', ToastAndroid.SHORT, ToastAndroid.BOTTOM)
      }
      const jsonValue = JSON.stringify({ status: value })
      await AsyncStorage.setItem('@backgroundFetch', jsonValue)
    } catch (error) {
      ToastAndroid.showWithGravity(`[BackgroundFetch] ${toggleServiceOne ? 'START' : 'STOP'} falied`, ToastAndroid.SHORT, ToastAndroid.BOTTOM)
    }
  }

  const toggleForegroundFetch = async (value) => {
    try {
      setToggleServiceTwo(value)
      if (value) {
        await onStartForegroundService()
        ToastAndroid.showWithGravity('[ForegroundFetch] START', ToastAndroid.SHORT, ToastAndroid.BOTTOM)
      } else {
        await onStopForegroundService()
        ToastAndroid.showWithGravity('[ForegroundFetch] STOP', ToastAndroid.SHORT, ToastAndroid.BOTTOM)
      }
      const jsonValue = JSON.stringify({ status: value })
      await AsyncStorage.setItem('@foregroundFetch', jsonValue)
    } catch (error) {
      ToastAndroid.showWithGravity(`[ForegroundFetch] ${toggleServiceTwo ? 'START' : 'STOP'} falied`, ToastAndroid.SHORT, ToastAndroid.BOTTOM)
    }
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={{ }}>
        <View style={{ padding: 15 }}>
          <Title>Configuraciones:</Title>
        </View>
        <List.Item
          title="Servicio de fondo 1"
          description="BackgroundFetch"
          right={props => <Switch value={toggleServiceOne} onValueChange={(value) => toggleBackgroundFetch(value)} />}
        />
        <List.Item
          title="Servicio de fondo 1"
          description="ForegroundFetch"
          right={props => <Switch value={toggleServiceTwo} onValueChange={(value) => toggleForegroundFetch(value)} />}
        />
         <List.Item
          title="Logs"
          onPress={() => navigation.navigate('Logs')}
        />
        <List.Item
          title="Sync Manual"
          onPress={syncData}
        />
      </View>
    </SafeAreaView>
  )
}

export default SettingsScreen
