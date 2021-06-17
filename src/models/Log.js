/* eslint-disable prettier/prettier */
import { Model } from '@nozbe/watermelondb';
import { field, readonly, date } from '@nozbe/watermelondb/decorators';
export default class Log extends Model {
  static table = 'logs';

  @field('task_id') taskId;
  @field('timestamp') timestamp;
  @readonly @date('created_at') createdAt
  @readonly @date('updated_at') updatedAt
}
