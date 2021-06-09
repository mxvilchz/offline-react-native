/* eslint-disable react-native/no-inline-styles */
/* eslint-disable prettier/prettier */
import React from 'react';
import { FlatList, TouchableOpacity, View } from 'react-native';
import withObservables from '@nozbe/with-observables';
import { database } from '../models';
import { SafeAreaView } from 'react-native-safe-area-context';
import BackgroundFetch from 'react-native-background-fetch';
import { Q } from '@nozbe/watermelondb';
// import Upload from 'react-native-background-upload';
import TodoItem from '../components/TodoItem';
import { IconButton, Title, Text } from 'react-native-paper';
import RNFetchBlob from 'rn-fetch-blob';

const HomeScreen = ({ navigation, todos }) => {

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <IconButton
          onPress={() => navigation.navigate('Nuevo')}
          icon="plus"
        />
      ),
    });
  }, [navigation]);

  React.useEffect(() => {
    const initBackgroundFetch = async () => {
      // BackgroundFetch event handler.
      const onEvent = async (taskId) => {
        console.log('[BackgroundFetch] task: ', taskId);
        // Do your background work...
        const logCollection = database.collections.get('log');

        await database.action(async () => {
          await logCollection.create(log => {
            log.taskId = taskId;
            log.timestamp = (new Date()).toString();
          });
        });

        await addEvent(taskId);
        // IMPORTANT:  You must signal to the OS that your task is complete.
        BackgroundFetch.finish(taskId);
      };

      // Timeout callback is executed when your Task has exceeded its allowed running-time.
      // You must stop what you're doing immediately BackgorundFetch.finish(taskId)
      const onTimeout = async (taskId) => {
        console.warn('[BackgroundFetch] TIMEOUT task: ', taskId);
        BackgroundFetch.finish(taskId);
      };

      // Initialize BackgroundFetch only once when component mounts.
      let status = await BackgroundFetch.configure({
        minimumFetchInterval: 15,
        startOnBoot: true,
        stopOnTerminate: false,
        enableHeadless: true,
      }, onEvent, onTimeout);

      console.log('[BackgroundFetch] configure status: ', status);
    };
    initBackgroundFetch();
  }, []);

  // Add a BackgroundFetch event to <FlatList>
  const addEvent = (taskId) => {
    // Simulate a possibly long-running asynchronous task with a Promise.
    return new Promise((resolve, reject) => {
      // syncData();
      resolve();
    });
  };

  const syncData = async () => {
    const todo = await database.collections.get('todo').query(
      Q.where('sync', false),
      Q.experimentalTake(1)
    );

    if (todo.length > 0) {

      await RNFetchBlob.fetch('POST', 'http://prueba.navego360.com/index.php/sync/push', {
        otherHeader : 'foo',
        // this is required, otherwise it won't be process as a multipart/form-data request
        'Content-Type' : 'multipart/form-data',
      }, [
        // append field data from file path
        {
          name : 'files.file',
          filename : todo[0].meta?.fileName,
          // Change BASE64 encoded data to a file path with prefix `RNFetchBlob-file://`.
          // Or simply wrap the file path with RNFetchBlob.wrap().
          data: RNFetchBlob.wrap(todo[0].meta?.uri),
        },
        // elements without property `filename` will be sent as plain text
        {
          name : 'task',
          data : JSON.stringify({
            title : todo[0].title,
            description : todo[0].description,
          }),
        },
      ]).then((resp) => {
        console.log(1, resp);
      }).catch((err) => {
        console.log(2, err);
      });

      // const uri = Platform.OS === 'ios' ? image.uri : image.uri.replace('file://', '');
      // if (uri){

      //     const options = {
      //       url: 'http://96.126.110.93:8081/upload_multipart',
      //       path: uri,
      //       method: 'POST',
      //       field: 'uploaded_media',
      //       type: 'multipart',
      //       notification: {
      //         enabled: true,
      //         autoclear: true,
      //         onProgressTitle: 'Cargando...',
      //         onProgressMessage: 'Cargando ' + todo[0].title,
      //         onCompleteTitle: 'Carga finalizado',
      //         onCompleteMessage: 'Tu imagen ha sido subido',
      //         onErrorTitle: 'Error en la carga',
      //         onErrorMessage: 'Ocurrió un error al cargar la imagen',
      //       },
      //     };

      //     Upload.startUpload(options).then((uploadId) => {
      //       Upload.addListener('completed', uploadId, async (data) => {
      //         // data includes responseCode: number and responseBody: Object
      //         const todoUpdate = await database.collections.get('todo').find(todo[0].id);
      //         await database.action(async () => {
      //           await todoUpdate.update(item => {
      //             item.sync = true;
      //           });
      //         });
      //         console.log('Completed!');
      //       });
      //     }).catch((err) => {
      //       console.log('Upload error!', err);
      //     });

      // }
    }

  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
     <FlatList
        data={todos}
        keyExtractor={item => item.id}
        renderItem={({item: todo}) => {
          return (
            <TodoItem todo={todo} />
          );
        }}
        ListHeaderComponent={
          <View style={{ paddingHorizontal: 15, paddingVertical: 10 }}>
            <Title>Lista de tareas ({todos.length})</Title>
            <View style={{ display: 'flex', flexDirection: 'row' }}>
              <TouchableOpacity onPress={syncData} style={{ borderWidth: 1, paddingVertical: 6, width: 100, borderRadius: 20, alignItems: 'center' }}>
                <Text>Sync Manual</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.navigate('Logs')} style={{ borderWidth: 1, paddingVertical: 6, width: 100, borderRadius: 20, alignItems: 'center', marginLeft: 10 }}>
                <Text>Logs</Text>
              </TouchableOpacity>
            </View>
          </View>
        }
     />
    </SafeAreaView>
  );
};

const enhance = withObservables([], () => ({
  todos: database.collections.get('todo').query().observe(),
}));

export default enhance(HomeScreen);
