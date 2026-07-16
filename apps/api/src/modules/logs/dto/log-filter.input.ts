import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsDate,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { Field, GraphQLISODateTime, ID, InputType, Int, registerEnumType } from '@nestjs/graphql';

export enum GraphQLLogLevel {
  DEBUG = 'debug',
  ERROR = 'error',
  FATAL = 'fatal',
  INFO = 'info',
  WARN = 'warn',
}

registerEnumType(GraphQLLogLevel, {
  name: 'LogLevel',
});

@InputType()
export class LogFilterInput {
  @Field(() => ID)
  @IsUUID()
  projectId!: string;

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  @IsString({ each: true })
  @MinLength(1, { each: true })
  @MaxLength(100, { each: true })
  services?: string[];

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @IsString({ each: true })
  @MinLength(1, { each: true })
  @MaxLength(50, { each: true })
  environments?: string[];

  @Field(() => [GraphQLLogLevel], { nullable: true })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(5)
  @IsEnum(GraphQLLogLevel, { each: true })
  levels?: GraphQLLogLevel[];

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(1_000)
  search?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(256)
  traceId?: string;

  @Field(() => GraphQLISODateTime)
  @Type(() => Date)
  @IsDate()
  from!: Date;

  @Field(() => GraphQLISODateTime)
  @Type(() => Date)
  @IsDate()
  to!: Date;

  @Field(() => Int, { defaultValue: 50 })
  @IsInt()
  @Min(1)
  @Max(200)
  limit = 50;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(2_048)
  cursor?: string;
}
