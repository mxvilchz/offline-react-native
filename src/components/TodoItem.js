/* eslint-disable react-native/no-inline-styles */
/* eslint-disable prettier/prettier */
import React from 'react';
import withObservables from '@nozbe/with-observables';
import { StyleSheet, View } from 'react-native';
import { List } from 'react-native-paper';

const TodoItem = ({ todo }) => {
  return (
    <List.Item
      title={todo.title}
      description={todo.description}
      left={() => <View style={[styles.icon, { backgroundColor: todo.sync ? 'green' : 'red', borderColor: todo.sync ? 'green' : 'red' }]} />}
    />
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
