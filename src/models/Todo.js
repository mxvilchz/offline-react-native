/* eslint-disable no-shadow */
/* eslint-disable prettier/prettier */
import { Model } from '@nozbe/watermelondb';
import { field, date, json, readonly } from '@nozbe/watermelondb/decorators';

const sanitizeReactions = json => json;
export default class Todo extends Model {
  static table = 'todos';

  @field('uuid') uuid;
  @field('todo_id') todoId;
  @field('title') title;
  @field('description') description;
  @field('state') state;
  @json('meta', sanitizeReactions) meta;
  @field('sync') sync;
  @field('status') status;
  
  @field('is_create') isCreate;
  @field('is_update') isUpdate;
  @field('is_delete') isDelete;

  @readonly @date('created_at') createdAt
  @readonly @date('updated_at') updatedAt

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
