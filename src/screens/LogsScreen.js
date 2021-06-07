/* eslint-disable prettier/prettier */
import React from 'react';
import { StyleSheet, View, SafeAreaView, FlatList } from 'react-native';
import { Text, ListItem } from 'react-native-elements';
import withObservables from '@nozbe/with-observables';
import { database } from '../models';

const LogsScreen = ({ logs }) => {

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <FlatList
          data={logs}
          keyExtractor={item => item.id}
          renderItem={({item: log}) => {
            return (
              <ListItem bottomDivider>
                <ListItem.Content>
                  <ListItem.Title style={{ fontSize: 14 }}>{log.timestamp}</ListItem.Title>
                  <ListItem.Subtitle>
                    TaskId: {log.taskId}
                  </ListItem.Subtitle>
                </ListItem.Content>
              </ListItem>
            );
          }}
          ListHeaderComponent={
            <View style={{ padding: 15 }}>
              <Text h3>Logs</Text>
            </View>
          }
      />
      </View>
    </SafeAreaView>
  );
};

const enhance = withObservables([], () => ({
  logs: database.collections.get('log').query().observe(),
}));

export default enhance(LogsScreen);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});
