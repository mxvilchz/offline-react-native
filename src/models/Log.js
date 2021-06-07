/* eslint-disable prettier/prettier */
import { Model } from '@nozbe/watermelondb';
import { field } from '@nozbe/watermelondb/decorators';

export default class Log extends Model {
  static table = 'log';

  @field('task_id') taskId;
  @field('timestamp') timestamp;
}
