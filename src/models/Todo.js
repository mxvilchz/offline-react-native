/* eslint-disable prettier/prettier */
import { Model } from '@nozbe/watermelondb';
import { field, date } from '@nozbe/watermelondb/decorators';

export default class Todo extends Model {
  static table = 'todo';

  @field('title') title;
  @field('poster_image') posterImage;
  @field('description') description;
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
