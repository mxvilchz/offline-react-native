/* eslint-disable prettier/prettier */
import { appSchema, tableSchema } from '@nozbe/watermelondb';

export default appSchema({
  version: 1,
  tables: [
    tableSchema({
      name: 'todo',
      columns: [
        { name: 'title', type: 'string' },
        { name: 'poster_image', type: 'string' },
        { name: 'description', type: 'string' },
        { name: 'release_date_at', type: 'number' },
      ],
    }),
  ],
});
