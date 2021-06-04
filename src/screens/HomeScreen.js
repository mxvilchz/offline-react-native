/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-native/no-inline-styles */
/* eslint-disable prettier/prettier */
import React from 'react';
import { FlatList, Platform, TouchableOpacity, View } from 'react-native';
import { Icon, ListItem, Text } from 'react-native-elements';
import withObservables from '@nozbe/with-observables';
import { database } from '../models';
import { SafeAreaView } from 'react-native-safe-area-context';
import BackgroundFetch from 'react-native-background-fetch';
import { Q } from '@nozbe/watermelondb';
import Upload from 'react-native-background-upload';

const HomeScreen = ({ navigation, todos }) => {

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Icon name="plus" type="material-community" onPress={() => navigation.navigate('Nuevo')} />
      ),
      headerRightContainerStyle: {
        paddingRight: 15,
      },
    });
  }, [navigation]);

  React.useEffect(() => {
    const initBackgroundFetch = async () => {
      // BackgroundFetch event handler.
      const onEvent = async (taskId) => {
        console.log('[BackgroundFetch] task: ', taskId);
        // Do your background work...
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
      let status = await BackgroundFetch.configure({minimumFetchInterval: 15}, onEvent, onTimeout);

      console.log('[BackgroundFetch] configure status: ', status);
    };
    initBackgroundFetch();
  }, []);

  // Add a BackgroundFetch event to <FlatList>
  const addEvent = (taskId) => {
    // Simulate a possibly long-running asynchronous task with a Promise.
    return new Promise((resolve, reject) => {
      syncData();
      resolve();
    });
  };

  const syncData = async () => {
    const todo = await database.collections.get('todo').query(
      Q.where('sync', false),
      Q.experimentalTake(1)
    );

    if (todo.length > 0) {
      const image = todo[0].posterImage;
      const uri = Platform.OS === 'ios' ? image.uri : image.uri.replace('file://', '');
      if (uri){
        Upload.getFileInfo(uri).then(metadata => {
          const uploadOpts = Object.assign(
            {
              path: uri,
              method: 'POST',
              headers: {
                'content-type': metadata.mimeType, // server requires a content-type header,
                'todo-header': JSON.stringify({
                  title : todo[0].title,
                  description : todo[0].description,
                  releaseDateAt: todo[0].releaseDateAt,
                }),
              },
            },
            {
              url: 'http://96.126.110.93:8081/upload_raw',
              // field: 'uploaded_media',
              type: 'raw',
            },
            {
              notification: {
                enabled: true,
              },
              useUtf8Charset: true,
            }
          );

          Upload.startUpload(uploadOpts).then((uploadId) => {
            console.log('Upload started');
            Upload.addListener('progress', uploadId, (data) => {
              console.log(`Progress: ${data.progress}%`);
            });
            Upload.addListener('error', uploadId, (data) => {
              console.log(`Error: ${data.error}%`);
            });
            Upload.addListener('cancelled', uploadId, (data) => {
              console.log('Cancelled!');
            });
            Upload.addListener('completed', uploadId, async (data) => {
              // data includes responseCode: number and responseBody: Object
              const todoUpdate = await database.collections.get('todo').find(todo[0].id);
              await database.action(async () => {
                await todoUpdate.update(item => {
                  item.sync = true;
                });
              });
              console.log('Completed!');
            });
          }).catch((err) => {
            console.log('Upload error!', err);
          });


        });
      }
    }

  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
     <FlatList
        data={todos}
        keyExtractor={item => item.id}
        renderItem={({item: todo}) => {
          return (
            <ListItem bottomDivider>
              <ListItem.Content>
                <ListItem.Title>{todo.title}</ListItem.Title>
                <ListItem.Subtitle>{todo.description}</ListItem.Subtitle>
              </ListItem.Content>
              <ListItem.Chevron />
            </ListItem>
          );
        }}
        ListHeaderComponent={
          <View style={{ paddingHorizontal: 15, paddingVertical: 10 }}>
            <Text h3>Lista de tareas {todos.length}</Text>
            <TouchableOpacity onPress={syncData}>
              <Text>Press</Text>
            </TouchableOpacity>
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
