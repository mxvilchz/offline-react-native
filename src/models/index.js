/* eslint-disable prettier/prettier */
import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';

import schema from './schema';
import Todo from './Todo';

// First, create the adapter to the underlying database:
const adapter = new SQLiteAdapter({
  schema,
});

// Then, make a Watermelon database from it!
export const database = new Database({
  adapter,
  modelClasses: [Todo],
  actionsEnabled: true,
});
