/* eslint-disable array-callback-return */
/* eslint-disable no-useless-return */
/* eslint-disable react/display-name */
/* eslint-disable react/prop-types */
import React from 'react'
import { FlatList, TouchableOpacity, View, ToastAndroid } from 'react-native'
import withObservables from '@nozbe/with-observables'
import { SafeAreaView } from 'react-native-safe-area-context'
// import BackgroundFetch from 'react-native-background-fetch'
import { Q } from '@nozbe/watermelondb'
import { IconButton, Title, Text, Portal, Dialog, Paragraph, Button } from 'react-native-paper'
import RNFetchBlob from 'rn-fetch-blob'
import NetInfo from '@react-native-community/netinfo'
import RnBgTask from 'react-native-bg-thread'
import BackgroundFetch from 'react-native-background-fetch'
import ReactNativeForegroundService from '@supersami/rn-foreground-service'
import { useIsFocused } from '@react-navigation/native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import messaging from '@react-native-firebase/messaging'

import TodoItem from '../components/TodoItem'

import { database } from '../models'
import { pull, push } from '../utils/sync'
import { showNotification } from '../utils/notifService'

const HomeScreen = ({ navigation, todos }) => {
  const [isConnected, setIsConnected] = React.useState(true)
  const [showDialogDelete, setShowDialogDelete] = React.useState(false)
  const [deleteId, setDeleteId] = React.useState(null)
  const [serviceType, setServiceType] = React.useState([])
  const [subscribedTopic, setSubscribedTopic] = React.useState('')

  const isFocused = useIsFocused()

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <>
          <IconButton
            onPress={() => navigation.navigate('Nuevo', { id: null })}
            icon="plus"
          />
        </>
      )
    })
  }, [navigation])

  React.useEffect(() => {
    const unsubscribeNetInfo = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected)
    })
    const unsubscribeMessaging = messaging().onMessage(async remoteMessage => {
      console.log('A new FCM message arrived!', JSON.stringify(remoteMessage))
      if (remoteMessage) {
        const { data } = remoteMessage
        syncData()
        showNotification(data.title, data.body)
      }
    })
    messaging()
      .subscribeToTopic('todo-all')
      .then(() => setSubscribedTopic('Suscrito a topic!'))
      .catch(error => {
        console.log(error)
      })
    return () => {
      unsubscribeNetInfo()
      unsubscribeMessaging()
    }
  }, [])

  React.useEffect(() => {
    if (isFocused) {
      verifyServiceForegroundFetch()
    }
  }, [isFocused])

  React.useEffect(() => {
    checkPermission()
    initiBackgroundFetch()
    verifyServiceForegroundFetch()
  }, [])

  // revisar el permiso para las notificaciones
  const checkPermission = () => {
    messaging().hasPermission()
      .then(enabled => {
        if (!enabled) {
          requestPermission()
        }
      })
      .catch(error => {
        console.log('[FCMServices] permiso denegado.', error)
      })
  }

  // solicitar el permiso para mostrar las notificaciones
  const requestPermission = () => {
    messaging().requestPermission()
      .then(() => {
        console.log('[FCMServices] permiso otorgado.')
      })
      .catch(error => {
        console.log('[FCMServices] solicitud de permiso denegado.', error)
      })
  }

  const verifyServiceForegroundFetch = () => {
    if (ReactNativeForegroundService.is_task_running('taskid')) {
      setServiceType(['ForegroundFetch'])
    } else {
      setServiceType([])
    }
  }

  const onBackgroundFetchEvent = async (taskId) => {
    if (isConnected) {
      await pull()
      await push()
    }

    const jsonValue = JSON.stringify({ status: true })
    await AsyncStorage.setItem('@backgroundFetch', jsonValue)

    const logCollection = await database.collections.get('logs')
    await database.action(async () => {
      await logCollection.create(item => {
        item.taskId = '[BackgroundFetch] Event taskId ' + taskId
        item.timestamp = (new Date()).toString()
      })
    })

    BackgroundFetch.finish(taskId)
  }

  const onBackgroundFetchTimeout = async (taskId) => {
    const logCollection = await database.collections.get('logs')
    await database.action(async () => {
      await logCollection.create(log => {
        log.taskId = '[BackgroundFetch] TIMEOUT taskId ' + taskId
        log.timestamp = (new Date()).toString()
      })
    })
    BackgroundFetch.finish(taskId)
  }

  const initiBackgroundFetch = async () => {
    const status = await BackgroundFetch.configure({
      minimumFetchInterval: 15, // <-- minutes (15 is minimum allowed)
      // Android options
      forceAlarmManager: false, // <-- Set true to bypass JobScheduler.
      stopOnTerminate: false,
      enableHeadless: true,
      startOnBoot: true,
      requiredNetworkType: BackgroundFetch.NETWORK_TYPE_NONE, // Default
      requiresCharging: false, // Default
      requiresDeviceIdle: false, // Default
      requiresBatteryNotLow: false, // Default
      requiresStorageNotLow: false // Default
    }, onBackgroundFetchEvent, onBackgroundFetchTimeout)

    const logCollection = await database.collections.get('logs')
    await database.action(async () => {
      await logCollection.create(log => {
        log.taskId = '[BackgroundFetch] configure status ' + status
        log.timestamp = (new Date()).toString()
      })
    })
  }

  const handleEdit = (id) => {
    navigation.navigate('Nuevo', { id })
  }

  const handleDelte = (id) => {
    setShowDialogDelete(true)
    setDeleteId(id)
  }

  const handleConfirmDelete = async () => {
    const someTodo = await database.collections.get('todos').find(deleteId)
    await database.action(async (action) => {
      await someTodo.update(item => {
        item.status = 0
        item.sync = false
      })
    })

    if (isConnected) {
      RnBgTask.runInBackground_withPriority('NORMAL', async () => {
        const uuids = [someTodo.uuid]
        await RNFetchBlob.fetch('POST', 'http://prueba.navego360.com/index.php/sync/delete', {
          'Content-Type': 'multipart/form-data'
        }, [
          {
            name: 'delete',
            data: JSON.stringify({
              delete: uuids
            })
          }
        ]).then(async response => {
          const status = response.info().status
          if (status === 200) {
            const data = await response.json()

            for (let i = 0; i < data.delete.length; i++) {
              const uuid = data.delete[i]
              const findTodo = await database.collections.get('todos').query(Q.where('uuid', uuid)).fetch()
              if (findTodo.length > 0) {
                const todo = await database.collections.get('todos').find(findTodo[0].id)
                await database.action(async () => {
                  await todo.markAsDeleted()
                  await todo.destroyPermanently()
                })
              } else {
                console.log('not found for delete')
              }
            }

            ToastAndroid.showWithGravity(data.message, ToastAndroid.SHORT, ToastAndroid.BOTTOM)
          }
        }).catch((error) => {
          console.log(error)
        })
      })
    }

    setShowDialogDelete(false)
  }

  const goToSettings = () => {
    navigation.navigate('Settings')
  }

  const syncData = async () => {
    if (isConnected) {
      await pull()
      await push()
    }
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <FlatList
        data={todos}
        keyExtractor={item => item.id}
        renderItem={({ item: todo }) => {
          return (
            <TodoItem todo={todo} handleEdit={() => handleEdit(todo.id)} handleDelte={() => handleDelte(todo.id)} />
          )
        }}
        ListHeaderComponent={
          <View style={{ paddingHorizontal: 15, paddingVertical: 10 }}>
            <Text>Service: {serviceType.join(', ')}</Text>
            <Text>Topic: {subscribedTopic}</Text>
            <Title>Lista de tareas ({todos.length})</Title>
            <TouchableOpacity onPress={goToSettings} style={{ borderWidth: 1, paddingVertical: 6, width: 120, borderRadius: 20, alignItems: 'center' }}>
              <Text>Configuraciones</Text>
            </TouchableOpacity>
          </View>
        }
      />
      <Portal>
        <Dialog visible={showDialogDelete} onDismiss={() => setShowDialogDelete(false)}>
          <Dialog.Title>ToDo</Dialog.Title>
          <Dialog.Content>
            <Paragraph>¿Seguro que quiere eliminar el registro?</Paragraph>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowDialogDelete(false)}>Cancelar</Button>
            <Button onPress={handleConfirmDelete}>Si</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </SafeAreaView>
  )
}

const enhance = withObservables([], () => ({
  todos: database.collections.get('todos').query(Q.where('status', 1)).observe()
}))

export default enhance(HomeScreen)
