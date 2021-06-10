/* eslint-disable no-useless-return */
/* eslint-disable react/display-name */
/* eslint-disable react/prop-types */
import React from 'react'
import { Alert, FlatList, TouchableOpacity, View } from 'react-native'
import withObservables from '@nozbe/with-observables'
import { database } from '../models'
import { SafeAreaView } from 'react-native-safe-area-context'
// import BackgroundFetch from 'react-native-background-fetch'
import { Q } from '@nozbe/watermelondb'
import TodoItem from '../components/TodoItem'
import { IconButton, Title, Text } from 'react-native-paper'
import RNFetchBlob from 'rn-fetch-blob'
import ReactNativeForegroundService from '@supersami/rn-foreground-service'
import NetInfo from '@react-native-community/netinfo'

const HomeScreen = ({ navigation, todos }) => {
  const [isConnected, setIsConnected] = React.useState(true)

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <>
          <IconButton
            onPress={() => navigation.navigate('Nuevo')}
            icon="plus"
          />
        </>
      )
    })
  }, [navigation])

  React.useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected)
    })
    return () => unsubscribe()
  }, [])

  const onStop = () => {
    // Make always sure to remove the task before stoping the service. and instead of re-adding the task you can always update the task.
    if (ReactNativeForegroundService.is_task_running('taskid')) {
      ReactNativeForegroundService.remove_task('taskid')
    }
    // Stoping Foreground service.
    return ReactNativeForegroundService.stop()
  }

  const onStart = () => {
    // Checking if the task i am going to create already exist and running, which means that the foreground is also running.
    if (ReactNativeForegroundService.is_task_running('taskid')) return
    // Creating a task.
    ReactNativeForegroundService.add_task(
      syncData,
      {
        delay: 60000,
        onLoop: true,
        taskId: 'taskid',
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

  // React.useEffect(() => {
  //   const initBackgroundFetch = async () => {
  //     // BackgroundFetch event handler.
  //     const onEvent = async (taskId) => {
  //       console.log('[BackgroundFetch] task: ', taskId)
  //       // Do your background work...

  //       const logCollection = await database.collections.get('log')
  //       await database.action(async () => {
  //         await logCollection.create(log => {
  //           log.taskId = taskId
  //           log.timestamp = (new Date()).toString()
  //         })
  //       })

  //       await addEvent(taskId)

  //       // IMPORTANT:  You must signal to the OS that your task is complete.
  //       BackgroundFetch.finish(taskId)
  //     }

  //     // Timeout callback is executed when your Task has exceeded its allowed running-time.
  //     // You must stop what you're doing immediately BackgorundFetch.finish(taskId)
  //     const onTimeout = async (taskId) => {
  //       console.warn('[BackgroundFetch] TIMEOUT task: ', taskId)
  //       BackgroundFetch.finish(taskId)
  //     }

  //     // Initialize BackgroundFetch only once when component mounts.
  //     const status = await BackgroundFetch.configure({
  //       minimumFetchInterval: 15,
  //       startOnBoot: true,
  //       stopOnTerminate: false,
  //       enableHeadless: true
  //     }, onEvent, onTimeout)

  //     console.log('[BackgroundFetch] configure status: ', status)
  //   }
  //   initBackgroundFetch()
  // }, [])

  // const addEvent = (taskId) => {
  //   // Simulate a possibly long-running asynchronous task with a Promise.
  //   return new Promise((resolve, reject) => {
  //     syncData()
  //     resolve()
  //   })
  // }

  const syncData = async () => {
    console.log('I am Being Tested')

    const logCollection = await database.collections.get('log')
    await database.action(async () => {
      await logCollection.create(log => {
        log.taskId = 'foreground-services-task'
        log.timestamp = (new Date()).toString()
      })
    })

    if (isConnected) {
      const todo = await database.collections.get('todo').query(
        Q.where('sync', false),
        Q.experimentalTake(1)
      )

      if (todo.length > 0) {
        await RNFetchBlob.fetch('POST', 'http://prueba.navego360.com/index.php/sync/push', {
          otherHeader: 'foo',
          'Content-Type': 'multipart/form-data'
        }, [
          {
            name: 'files.file',
            filename: todo[0].meta?.fileName,
            data: RNFetchBlob.wrap(todo[0].meta?.uri)
          },
          {
            name: 'task',
            data: JSON.stringify({
              title: todo[0].title,
              description: todo[0].description
            })
          }
        ]).then(async () => {
          const todoUpdate = await database.collections.get('todo').find(todo[0].id)
          await database.action(async () => {
            await todoUpdate.update(item => {
              item.sync = true
            })
          })
        }).catch((err) => {
          Alert.alert('Error', err)
        })
      }
    }
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
     <FlatList
        data={todos}
        keyExtractor={item => item.id}
        renderItem={({ item: todo }) => {
          return (
            <TodoItem todo={todo} />
          )
        }}
        ListHeaderComponent={
          <View style={{ paddingHorizontal: 15, paddingVertical: 10 }}>
            <Title>Lista de tareas ({todos.length})</Title>
            <View style={{ display: 'flex', flexDirection: 'row', width: '100%', flexWrap: 'wrap' }}>
              <TouchableOpacity onPress={syncData} style={{ borderWidth: 1, paddingVertical: 6, width: 100, borderRadius: 20, alignItems: 'center', marginRight: 5 }}>
                <Text>Sync Manual</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.navigate('Logs')} style={{ borderWidth: 1, paddingVertical: 6, width: 100, borderRadius: 20, alignItems: 'center', marginRight: 5 }}>
                <Text>Logs</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={onStart} style={{ borderWidth: 1, paddingVertical: 6, width: 100, borderRadius: 20, alignItems: 'center', marginRight: 5 }}>
                <Text>Start service</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={onStop} style={{ borderWidth: 1, paddingVertical: 6, width: 100, borderRadius: 20, alignItems: 'center', marginRight: 5, marginTop: 5 }}>
                <Text>Stop service</Text>
              </TouchableOpacity>
            </View>
          </View>
        }
     />
    </SafeAreaView>
  )
}

const enhance = withObservables([], () => ({
  todos: database.collections.get('todo').query().observe()
}))

export default enhance(HomeScreen)
