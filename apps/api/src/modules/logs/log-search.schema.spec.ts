import { Test, TestingModule } from '@nestjs/testing';
import { GraphQLSchemaBuilderModule, GraphQLSchemaFactory } from '@nestjs/graphql';
import { printSchema } from 'graphql';
import { LogSearchResolver } from './log-search.resolver';

describe('Log search GraphQL schema', () => {
  it('exposes the secured log connection query and filters', async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [GraphQLSchemaBuilderModule],
    }).compile();
    const schemaFactory = module.get(GraphQLSchemaFactory);
    const schema = await schemaFactory.create([LogSearchResolver]);
    const schemaDefinition = printSchema(schema);

    expect(schemaDefinition).toContain('logs(filter: LogFilterInput!): LogConnection!');
    expect(schemaDefinition).toContain('projectId: ID!');
    expect(schemaDefinition).toContain('from: DateTime!');
    expect(schemaDefinition).toContain('to: DateTime!');
    expect(schemaDefinition).toContain('limit: Int! = 50');
    expect(schemaDefinition).toContain('nextCursor: String');
  });
});
