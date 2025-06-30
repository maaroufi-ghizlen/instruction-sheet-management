// services/auth-service/test/setup-e2e.ts

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { connect, connection } from 'mongoose';
import { AppModule } from '../src/app.module';

let app: INestApplication;
let mongod: MongoMemoryServer;

export const setupTestApp = async (): Promise<INestApplication> => {
  mongod = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongod.getUri();

  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  app = moduleFixture.createNestApplication();
  await app.init();

  return app;
};

export const teardownTestApp = async (): Promise<void> => {
  if (app) {
    await app.close();
  }
  if (connection.readyState !== 0) {
    await connection.dropDatabase();
    await connection.close();
  }
  if (mongod) {
    await mongod.stop();
  }
};