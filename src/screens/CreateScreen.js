/* eslint-disable react-native/no-inline-styles */
/* eslint-disable prettier/prettier */
import React from 'react';
import { View, ScrollView, Alert, Image } from 'react-native';
import moment from 'moment';
import {launchCamera, launchImageLibrary} from 'react-native-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Dialog, List, Portal, TextInput, Title } from 'react-native-paper';

import { database } from '../models';

const CreateScreen = ({ navigation, route }) => {
  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [isVisible, setIsVisible] = React.useState(false);
  const [response, setResponse] = React.useState(null);

  const selectImage = () => {
    setIsVisible(false);
    launchImageLibrary({
      selectionLimit: 0,
      mediaType: 'photo',
      includeBase64: false,
    }, setResponse);
  };

  const takeImage = () => {
    setIsVisible(false);
    launchCamera({
      saveToPhotos: true,
      mediaType: 'photo',
      includeBase64: false,
    }, setResponse);
  };

  const handleSave = async () => {
    if (title === '') {
      Alert.alert('ToDo', 'Ingrese un titulo');
      return false;
    }
    if (description === '') {
      Alert.alert('ToDo', 'Ingrese una descripción');
      return false;
    }
    if (response === null) {
      Alert.alert('ToDo', 'Seleccione una imagen');
      return false;
    }

    const resource = response?.assets && response?.assets[0];
    // console.log(resource)

    // const uri = resource.uri.replace('file:///', 'file://');

    const todosCollection = database.collections.get('todo');
    await database.action(async () => {
      await todosCollection.create(todo => {
        todo.title = title;
        todo.meta = resource;
        todo.description = description;
        todo.sync = false;
        todo.releaseDateAt = moment().unix();
      });
    });

    navigation.navigate('Inicio');
  };

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
            />
          </View>
          <View style={{ marginTop: 10 }}>
            <Button onPress={() => setIsVisible(true)}>
              Agregar foto
            </Button>
          </View>
          {response?.assets &&
            response?.assets.map(({uri}) => (
              <View key={uri} style={{ alignItems: 'center', marginVertical: 10 }}>
                <Image
                  resizeMode="cover"
                  resizeMethod="scale"
                  style={{width: 200, height: 200}}
                  source={{uri: uri}}
                />
              </View>
          ))}
          <View style={{ marginTop: 10 }}>
            <Button onPress={handleSave} mode="contained">
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
  );
};

export default CreateScreen;
