/* eslint-disable react-native/no-inline-styles */
/* eslint-disable prettier/prettier */
import React from 'react';
import { FlatList, View } from 'react-native';
import { Icon, ListItem, Text } from 'react-native-elements';
import withObservables from '@nozbe/with-observables';
import { database } from '../models';
import { SafeAreaView } from 'react-native-safe-area-context';

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
            <Text h3>Lista de tareas</Text>
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
