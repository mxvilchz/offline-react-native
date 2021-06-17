/* eslint-disable prettier/prettier */
import { Model } from '@nozbe/watermelondb';
import { field } from '@nozbe/watermelondb/decorators';
export default class Timestamps extends Model {
  static table = 'timestamps';

  @field('timestamp') timestamp;
}
