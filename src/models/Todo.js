/* eslint-disable prettier/prettier */
import { Model } from '@nozbe/watermelondb';
import { field, date } from '@nozbe/watermelondb/decorators';

export default class Todo extends Model {
  static table = 'todo';

  @field('title') title;
  @field('poster_image') posterImage;
  @field('description') description;
  @date('release_date_at') releaseDateAt;
}
