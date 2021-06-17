/* eslint-disable no-undef */
import { Database } from '@nozbe/watermelondb'
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite'
import Log from './Log'

import schema from './schema'
import Timestamps from './Timestamps'
import Todo from './Todo'

// First, create the adapter to the underlying database:
const adapter = new SQLiteAdapter({
  schema
})

// Then, make a Watermelon database from it!
export const database = new Database({
  adapter,
  modelClasses: [Todo, Log, Timestamps],
  actionsEnabled: true
})

if (__DEV__) {
  // Import connectDatabases function
  const connectDatabases = require('react-native-flipper-databases').default

  // Import required DBDrivers
  const WatermelonDBDriver = require('react-native-flipper-databases/src/drivers/watermelondb').default

  connectDatabases([
    new WatermelonDBDriver(database) // Pass in database definition
  ])
}
