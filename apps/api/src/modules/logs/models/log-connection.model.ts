import { Field, ObjectType } from '@nestjs/graphql';
import { LogEventModel } from './log-event.model';

@ObjectType('LogConnection')
export class LogConnectionModel {
  @Field(() => [LogEventModel])
  items!: LogEventModel[];

  @Field({ nullable: true })
  nextCursor?: string;
}
