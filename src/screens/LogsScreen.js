import React from 'react'
import PropTypes from 'prop-types'
import { StyleSheet, View, SafeAreaView, FlatList } from 'react-native'
import withObservables from '@nozbe/with-observables'
import { database } from '../models'
import { Q } from '@nozbe/watermelondb'
import { Title, List } from 'react-native-paper'

const LogsScreen = ({ logs }) => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <FlatList
          data={logs}
          keyExtractor={item => item.id}
          renderItem={({ item: log }) => {
            return (
              <List.Item
                title={log.timestamp}
                description={log.taskId}
              />
            )
          }}
          ListHeaderComponent={
            <View style={{ padding: 15 }}>
              <Title>Logs</Title>
            </View>
          }
      />
      </View>
    </SafeAreaView>
  )
}

LogsScreen.propTypes = {
  logs: PropTypes.array.isRequired
}

const enhance = withObservables([], () => ({
  logs: database.collections.get('logs').query(Q.experimentalSortBy('created_at', Q.desc)).observe()
}))

export default enhance(LogsScreen)

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  content: {
    flex: 1
  }
})
