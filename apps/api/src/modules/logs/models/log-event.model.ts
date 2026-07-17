import { Field, GraphQLISODateTime, ID, ObjectType } from '@nestjs/graphql';
import GraphQLJSON from 'graphql-type-json';
import { GraphQLLogLevel } from '../dto/log-filter.input';

@ObjectType('LogEvent')
export class LogEventModel {
  @Field(() => ID)
  eventId!: string;

  @Field()
  service!: string;

  @Field()
  environment!: string;

  @Field(() => GraphQLLogLevel)
  level!: GraphQLLogLevel;

  @Field()
  message!: string;

  @Field(() => GraphQLISODateTime)
  timestamp!: Date;

  @Field({ nullable: true })
  traceId?: string;

  @Field(() => GraphQLJSON, { nullable: true })
  attributes?: Record<string, unknown>;
}
