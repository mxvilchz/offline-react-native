/* eslint-disable react-native/no-inline-styles */
/* eslint-disable prettier/prettier */
import React from 'react';
import { ListItem } from 'react-native-elements';
import withObservables from '@nozbe/with-observables';
import { StyleSheet, View } from 'react-native';

const TodoItem = ({ todo }) => {
  return (
    <ListItem bottomDivider>
      <ListItem.Content>
        <ListItem.Title>{<View style={[styles.icon, { backgroundColor: todo.sync ? 'green' : 'red', borderColor: todo.sync ? 'green' : 'red' }]} />} {todo.title}</ListItem.Title>
        <ListItem.Subtitle style={{ alignItems: 'center' }}>
          {todo.description}
        </ListItem.Subtitle>
      </ListItem.Content>
      <ListItem.Chevron />
    </ListItem>
  );
};

const enhance = withObservables(['todo'], ({ todo }) => ({
  todo: todo.observe(),
}));

export default enhance(TodoItem);

const styles = StyleSheet.create({
  icon: {
    width: 10, height: 10, borderWidth: 1, borderRadius: 10,
  },
});
