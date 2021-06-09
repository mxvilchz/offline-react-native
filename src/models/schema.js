/* eslint-disable prettier/prettier */
import { appSchema, tableSchema } from '@nozbe/watermelondb';

export default appSchema({
  version: 5,
  tables: [
    tableSchema({
      name: 'todo',
      columns: [
        { name: 'title', type: 'string' },
        { name: 'meta', type: 'string' },
        { name: 'description', type: 'string' },
        { name: 'sync', type: 'boolean' },
        { name: 'release_date_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'log',
      columns: [
        { name: 'task_id', type: 'string' },
        { name: 'timestamp', type: 'string' },
      ],
    }),
  ],
});
