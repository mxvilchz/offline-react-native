import { appSchema, tableSchema } from '@nozbe/watermelondb'

export default appSchema({
  version: 13,
  tables: [
    tableSchema({
      name: 'todos',
      columns: [
        { name: 'uuid', type: 'string' },
        { name: 'todo_id', type: 'number', isOptional: true },
        { name: 'title', type: 'string' },
        { name: 'description', type: 'string' },
        { name: 'state', type: 'number' },
        { name: 'meta', type: 'string' },
        { name: 'sync', type: 'boolean' },
        { name: 'status', type: 'number' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' }
      ]
    }),
    tableSchema({
      name: 'logs',
      columns: [
        { name: 'task_id', type: 'string' },
        { name: 'timestamp', type: 'string' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' }
      ]
    }),
    tableSchema({
      name: 'timestamps',
      columns: [
        { name: 'timestamp', type: 'number' }
      ]
    })
  ]
})
