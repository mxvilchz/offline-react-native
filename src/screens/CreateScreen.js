/* eslint-disable react/prop-types */
import React from 'react'
import { View, Image, TouchableOpacity, ToastAndroid } from 'react-native'
// import moment from 'moment'
import { launchCamera, launchImageLibrary } from 'react-native-image-picker'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Button, Dialog, List, Portal, TextInput, Title, Text, RadioButton } from 'react-native-paper'
import RNFetchBlob from 'rn-fetch-blob'
import NetInfo from '@react-native-community/netinfo'
import RnBgTask from 'react-native-bg-thread'
import Icon from 'react-native-vector-icons/dist/MaterialCommunityIcons'
import { v4 as uuidv4 } from 'uuid'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'

import { database } from '../models'

const states = [
  {
    id: 0,
    name: 'PENDIENTE',
    value: 1
  },
  {
    id: 1,
    name: 'INICIADO',
    value: 2
  },
  {
    id: 2,
    name: 'TERMINADO',
    value: 3
  }
]

const CreateScreen = ({ navigation, route }) => {
  const [title, setTitle] = React.useState('')
  const [description, setDescription] = React.useState('')
  const [isVisible, setIsVisible] = React.useState(false)
  const [response, setResponse] = React.useState(null)
  const [disabled, setDisabled] = React.useState(false)
  const [id, setId] = React.useState(null)
  const [path, setPath] = React.useState('')

  const [showStates, setShowStates] = React.useState(false)
  const [state, setState] = React.useState(1)

  const [isConnected, setIsConnected] = React.useState(true)

  React.useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected)
    })
    return () => unsubscribe()
  }, [])

  React.useEffect(() => {
    const getParamId = async () => {
      const { id } = route.params
      if (id) {
        const todo = await database.collections.get('todos').find(id)
        setTitle(todo.title)
        setDescription(todo.description)
        setState(todo.state)
        setResponse({ assets: [todo.meta] })
        setPath(JSON.stringify(todo.meta))
      }
      setId(id)
    }
    getParamId()
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
    setDisabled(true)
    let todo; let uuid; let resource = null
    if (response) {
      resource = response?.assets && response?.assets[0]
    }

    if (id) {
      const someTodo = await database.collections.get('todos').find(id)
      uuid = someTodo.uuid
      await database.action(async () => {
        await someTodo.update(item => {
          item.title = title.trim()
          item.description = description.trim()
          item.state = state
          item.meta = resource
          item.sync = false
          item._raw._status = 'updated'
        })
      })
    } else {
      const todosCollection = database.collections.get('todos')
      uuid = uuidv4()
      await database.action(async () => {
        todo = await todosCollection.create(item => {
          item.uuid = uuid
          item.title = title.trim()
          item.description = description.trim()
          item.state = state
          item.meta = resource
          item.sync = false
          item.status = 1
        })
      })
    }

    if (isConnected) {
      RnBgTask.runInBackground_withPriority('NORMAL', () => upload(id || todo.id, uuid))
    }

    navigation.navigate('ToDo')
  }

  const upload = async (id, uuid) => {
    const resource = response?.assets && response?.assets[0]
    if (resource) {
      await RNFetchBlob.fetch('POST', 'http://prueba.navego360.com/index.php/sync/save', {
        'Content-Type': 'multipart/form-data'
      }, [
        // append field data from file path
        {
          name: 'files.file',
          filename: resource?.fileName,
          data: RNFetchBlob.wrap(resource?.uri)
        },
        {
          name: 'task',
          data: JSON.stringify({
            title: title,
            description: description,
            state: state
          })
        },
        {
          name: 'uid', data: uuid
        }
      ]).then(async response => {
        const status = response.info().status
        if (status === 200) {
          const findTodo = await database.collections.get('todos').find(id)
          await database.action(async () => {
            await findTodo.update(item => {
              item.sync = true
              item._raw._status = 'synced'
            })
          })
          const data = await response.json()
          ToastAndroid.showWithGravity(data.message, ToastAndroid.LONG, ToastAndroid.BOTTOM)
        }
      }).catch((error) => {
        console.log(error)
      })
    }
  }

  const getStateName = () => {
    const obj = states.find(item => item.value === state)
    return obj.name
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <KeyboardAwareScrollView>
        <View style={{ padding: 15, paddingBottom: !isConnected ? 60 : 15 }}>
          <Title>{id ? 'Editar tarea' : 'Crear tarea'}</Title>
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
              value={description}
              onChangeText={text => setDescription(text)}
              dense
              mode="outlined"
              autoCapitalize="none"
            />
          </View>
          <Text style={{ fontWeight: 'bold', fontSize: 16, marginVertical: 10 }}>Estado</Text>
          <View style={{ marginTop: 10 }}>
            <TouchableOpacity onPress={() => setShowStates(true)}>
              <View style={{
                borderWidth: 1,
                display: 'flex',
                flexDirection: 'row',
                paddingVertical: 10,
                borderRadius: 4,
                justifyContent: 'space-between',
                paddingHorizontal: 15,
                borderColor: '#707070'
              }}>
                <Text>{ getStateName() }</Text>
                <Icon name="chevron-down" size={20} />
              </View>
            </TouchableOpacity>
          </View>
          <View style={{ marginTop: 10 }}>
            <Button onPress={() => setIsVisible(true)}>
              {id ? 'Actualizar foto' : 'Agregar foto'}
            </Button>
          </View>
          {response?.assets &&
            response?.assets.map(({ uri }) => (
              <View key={uri} style={{ alignItems: 'center', marginVertical: 10 }}>
                <Image
                  resizeMode="center"
                  resizeMethod="auto"
                  style={{ width: 200, height: 200 }}
                  source={{ uri: uri }}
                />
              </View>
            ))}
          <Text>{ path }</Text>
          <View style={{ marginTop: 10 }}>
            <Button onPress={handleSave} mode="contained" disabled={disabled}>
              Guardar
            </Button>
          </View>
        </View>
      </KeyboardAwareScrollView>
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
            <Button onPress={() => setIsVisible(false)}>Cerrar</Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog visible={showStates} onDismiss={() => setShowStates(false)}>
          <Dialog.Title>Seleccione un estado</Dialog.Title>
          <Dialog.Content>
            <RadioButton.Group onValueChange={value => setState(value)} value={state}>
            {
              states.map(item => (
                <RadioButton.Item key={item.id} label={item.name} value={item.value} />
              ))
            }
            </RadioButton.Group>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowStates(false)}>Cerrar</Button>
          </Dialog.Actions>
        </Dialog>

      </Portal>
    </SafeAreaView>
  )
}

export default CreateScreen
