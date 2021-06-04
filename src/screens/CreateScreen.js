/* eslint-disable react-native/no-inline-styles */
/* eslint-disable prettier/prettier */
import React from 'react';
import { View, ScrollView, Alert } from 'react-native';
import { Text, Input, Button, BottomSheet, ListItem, Image } from 'react-native-elements';
import moment from 'moment';
import {launchCamera, launchImageLibrary} from 'react-native-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';

import { database } from '../models';

const CreateScreen = ({ navigation, route }) => {
  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [isVisible, setIsVisible] = React.useState(false);
  const [response, setResponse] = React.useState(null);

  const selectImage = () => {
    launchImageLibrary({
      maxHeight: 500,
      maxWidth: 500,
      selectionLimit: 0,
      mediaType: 'photo',
      includeBase64: false,
    }, setResponse);
    setIsVisible(false);
  };

  const takeImage = () => {
    launchCamera({
      saveToPhotos: true,
      mediaType: 'photo',
      includeBase64: true,
    }, setResponse);
    setIsVisible(false);
  };

  const list = [
    {
      title: 'Tomar imagen',
      onPress: () => takeImage(),
    },
    {
      title: 'Seleccionar imagen',
      onPress: () => selectImage(),
    },
    {
      title: 'Cancelar',
      titleStyle: { color: 'red' },
      onPress: () => setIsVisible(false),
    },
  ];

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

    // const uri = Platform.OS === 'ios' ? resource.uri : resource.uri.replace('file://', '');
    const todosCollection = database.collections.get('todo');
    await database.action(async () => {
      await todosCollection.create(todo => {
        todo.title = title;
        todo.posterImage = resource;
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
          <Text h3>Nuevo</Text>
          <View style={{ marginTop: 10 }}>
            <Input
              label="Titulo"
              placeholder="Ingrese un titulo"
              value={title}
              onChangeText={text => setTitle(text)}
            />
          </View>
          <View style={{ marginTop: 10 }}>
            <Input
              label="Descripción"
              placeholder="Ingrese una descripción"
              multiline
              value={description}
              onChangeText={text => setDescription(text)}
            />
          </View>
          <View style={{ marginTop: 10 }}>
            <Button title="Agregar foto" type="outline" onPress={() => setIsVisible(true)} />
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
            <Button title="Guardar" onPress={handleSave} raised />
          </View>
        </View>
        <BottomSheet
          isVisible={isVisible}
          containerStyle={{ backgroundColor: 'rgba(0.5, 0.25, 0, 0.2)' }}
        >
          {list.map((l, i) => (
            <ListItem key={i} containerStyle={l.containerStyle} onPress={l.onPress}>
              <ListItem.Content>
                <ListItem.Title style={l.titleStyle}>{l.title}</ListItem.Title>
              </ListItem.Content>
            </ListItem>
          ))}
        </BottomSheet>
      </ScrollView>
    </SafeAreaView>
  );
};

export default CreateScreen;
