/* eslint-disable no-shadow */
/* eslint-disable prettier/prettier */
import { Model } from '@nozbe/watermelondb';
import { field, date, json } from '@nozbe/watermelondb/decorators';

const sanitizeReactions = json => json;
export default class Todo extends Model {
  static table = 'todo';

  @field('title') title;
  @json('meta', sanitizeReactions) meta;
  @field('description') description;
  @field('sync') sync;
  @date('release_date_at') releaseDateAt;

  // getTodo() {
  //   return {
  //     title: this.title,
  //     posterImage: this.posterImage,
  //     description: this.description,
  //     releaseDateAt: this.releaseDateAt,
  //   };
  // }

  // updateTodo = async (data) => {
  //   await this.update(todo => {
  //     todo.title = data.title;
  //     todo.posterImage = data.posterImage;
  //     todo.description = data.title;
  //     todo.releaseDateAt = data.releaseDateAt;
  //   });
  // }

  // async deleteTodo() {
  //   await this.markAsDeleted();
  //   await this.destroyPermanently();
  // }
}
