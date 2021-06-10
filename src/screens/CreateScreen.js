/* eslint-disable react/prop-types */
import React from 'react'
import { View, ScrollView, Alert, Image } from 'react-native'
import moment from 'moment'
import { launchCamera, launchImageLibrary } from 'react-native-image-picker'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Button, Dialog, List, Portal, TextInput, Title } from 'react-native-paper'
import RNFetchBlob from 'rn-fetch-blob'
import NetInfo from '@react-native-community/netinfo'
import RnBgTask from 'react-native-bg-thread'

import { database } from '../models'

const CreateScreen = ({ navigation, route }) => {
  const [title, setTitle] = React.useState('')
  const [description, setDescription] = React.useState('')
  const [isVisible, setIsVisible] = React.useState(false)
  const [response, setResponse] = React.useState(null)
  const [disabled, setDisabled] = React.useState(false)

  const [isConnected, setIsConnected] = React.useState(true)

  React.useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected)
    })
    return () => unsubscribe()
  }, [])

  const selectImage = () => {
    setIsVisible(false)
    launchImageLibrary({
      selectionLimit: 0,
      mediaType: 'photo',
      includeBase64: false
    }, setResponse)
  }

  const takeImage = () => {
    setIsVisible(false)
    launchCamera({
      saveToPhotos: true,
      mediaType: 'photo',
      includeBase64: false
    }, setResponse)
  }

  const handleSave = async () => {
    if (title === '') {
      Alert.alert('ToDo', 'Ingrese un titulo')
      return false
    }
    if (description === '') {
      Alert.alert('ToDo', 'Ingrese una descripción')
      return false
    }
    if (response === null) {
      Alert.alert('ToDo', 'Seleccione una imagen')
      return false
    }

    setDisabled(true)
    const resource = response?.assets && response?.assets[0]
    let newTodo

    const todosCollection = database.collections.get('todo')
    await database.action(async () => {
      newTodo = await todosCollection.create(todo => {
        todo.title = title
        todo.meta = resource
        todo.description = description
        todo.sync = false
        todo.releaseDateAt = moment().unix()
      })
    })

    if (isConnected) {
      RnBgTask.runInBackground_withPriority('NORMAL', () => upload(newTodo.id))
    }
    navigation.navigate('Inicio')
  }

  // const onStart = () => {
  //   // Checking if the task i am going to create already exist and running, which means that the foreground is also running.
  //   if (ReactNativeForegroundService.is_task_running('taskid')) {return;}
  //   // Creating a task.
  //   ReactNativeForegroundService.add_task(upload,
  //     {
  //       delay: 100,
  //       onLoop: true,
  //       taskId: 'taskid',
  //       onError: (e) => console.log('Error logging:', e),
  //     },
  //   );
  //   // starting  foreground service.
  //   return ReactNativeForegroundService.start({
  //     id: 144,
  //     title: 'Foreground Service',
  //     message: 'you are online!',
  //   });
  // };

  // const onStop = () => {
  //   // Make always sure to remove the task before stoping the service. and instead of re-adding the task you can always update the task.
  //   if (ReactNativeForegroundService.is_task_running('taskid')) {
  //     ReactNativeForegroundService.remove_task('taskid');
  //   }
  //   // Stoping Foreground service.
  //   return ReactNativeForegroundService.stop();
  // };

  const upload = async (id) => {
    const resource = response?.assets && response?.assets[0]
    if (resource) {
      await RNFetchBlob.fetch('POST', 'http://prueba.navego360.com/index.php/sync/push', {
        otherHeader: 'foo',
        // this is required, otherwise it won't be process as a multipart/form-data request
        'Content-Type': 'multipart/form-data'
      }, [
        // append field data from file path
        {
          name: 'files.file',
          filename: resource?.fileName,
          // Change BASE64 encoded data to a file path with prefix `RNFetchBlob-file://`.
          // Or simply wrap the file path with RNFetchBlob.wrap().
          data: RNFetchBlob.wrap(resource?.uri)
        },
        // elements without property `filename` will be sent as plain text
        {
          name: 'task',
          data: JSON.stringify({
            title: title,
            description: description
          })
        }
      ]).then(async (resp) => {
        // console.log(1, resp);
        const todoUpdate = await database.collections.get('todo').find(id)
        await database.action(async () => {
          await todoUpdate.update(item => {
            item.sync = true
          })
        })
        // navigation.navigate('Inicio')
      }).catch((err) => {
        Alert.alert('ToDo', err)
      })
    }
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView>
        <View style={{ padding: 15 }}>
          <Title>Nueva tarea</Title>
          <View style={{ marginTop: 10 }}>
            <TextInput
              label="Titulo"
              placeholder="Ingrese un titulo"
              value={title}
              onChangeText={text => setTitle(text)}
              dense
              mode="outlined"
              autoCapitalize="none"
            />
          </View>
          <View style={{ marginTop: 10 }}>
            <TextInput
              label="Descripción"
              placeholder="Ingrese una descripción"
              multiline
              value={description}
              onChangeText={text => setDescription(text)}
              dense
              mode="outlined"
              autoCapitalize="none"
            />
          </View>
          <View style={{ marginTop: 10 }}>
            <Button onPress={() => setIsVisible(true)}>
              Agregar foto
            </Button>
          </View>
          {response?.assets &&
            response?.assets.map(({ uri }) => (
              <View key={uri} style={{ alignItems: 'center', marginVertical: 10 }}>
                <Image
                  resizeMode="cover"
                  resizeMethod="scale"
                  style={{ width: 200, height: 200 }}
                  source={{ uri: uri }}
                />
              </View>
            ))}
          <View style={{ marginTop: 10 }}>
            <Button onPress={handleSave} mode="contained" disabled={disabled}>
              Guardar
            </Button>
          </View>
        </View>
        <Portal>
          <Dialog visible={isVisible} onDismiss={() => setIsVisible(false)}>
            <Dialog.Title>Seleccione imagen</Dialog.Title>
            <Dialog.Content>
              <List.Item
                title="Tomar imagen"
                onPress={takeImage}
              />
              <List.Item
                title="Seleccionar imagen"
                onPress={selectImage}
              />
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setIsVisible(false)}>Cancelar</Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
      </ScrollView>
    </SafeAreaView>
  )
}

export default CreateScreen
