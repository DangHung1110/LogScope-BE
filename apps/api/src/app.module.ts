import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { validateEnvironment } from '@logscope/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ApiKeysModule } from './modules/api-keys/api-keys.module';
import { AuthModule } from './modules/auth/auth.module';
import { DatabaseModule } from './modules/database/database.module';
import { HealthModule } from './modules/health/health.module';
import { LogsModule } from './modules/logs/logs.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { createGraphQLContext } from './graphql/graphql-context';

@Module({
  imports: [
    ConfigModule.forRoot({
      cache: true,
      expandVariables: true,
      isGlobal: true,
      validate: validateEnvironment,
    }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      autoSchemaFile: true,
      context: createGraphQLContext,
      driver: ApolloDriver,
      graphiql: process.env.NODE_ENV !== 'production',
      path: '/graphql',
      sortSchema: true,
      subscriptions: {
        'graphql-ws': {},
      },
      useGlobalPrefix: true,
    }),
    ApiKeysModule,
    AuthModule,
    DatabaseModule,
    HealthModule,
    LogsModule,
    ProjectsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
