// services/auth-service/test/auth.e2e-spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { setupTestApp, teardownTestApp } from './setup-e2e';
import { UserRole } from '@shared/common/types';

describe('AuthController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await setupTestApp();
  });

  afterAll(async () => {
    await teardownTestApp();
  });

  describe('/auth/register (POST)', () => {
    it('should register a new user', () => {
      const registerDto = {
        email: 'test@example.com',
        password: 'SecurePassword123!',
        firstName: 'John',
        lastName: 'Doe',
        role: UserRole.PREPARATEUR,
        departmentId: '507f1f77bcf86cd799439011',
      };

      return request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(registerDto)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('message', 'User registered successfully');
          expect(res.body).toHaveProperty('userId');
        });
    });

    it('should fail with invalid email', () => {
      const registerDto = {
        email: 'invalid-email',
        password: 'SecurePassword123!',
        firstName: 'John',
        lastName: 'Doe',
        role: UserRole.PREPARATEUR,
        departmentId: '507f1f77bcf86cd799439011',
      };

      return request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(registerDto)
        .expect(400);
    });
  });

  describe('/auth/login (POST)', () => {
    beforeEach(async () => {
      // Register a test user
      const registerDto = {
        email: 'logintest@example.com',
        password: 'SecurePassword123!',
        firstName: 'Login',
        lastName: 'Test',
        role: UserRole.PREPARATEUR,
        departmentId: '507f1f77bcf86cd799439011',
      };

      await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(registerDto);
    });

    it('should login with valid credentials', () => {
      const loginDto = {
        email: 'logintest@example.com',
        password: 'SecurePassword123!',
      };

      return request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send(loginDto)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('accessToken');
          expect(res.body).toHaveProperty('refreshToken');
          expect(res.body).toHaveProperty('user');
          expect(res.body).toHaveProperty('expiresIn');
        });
    });

    it('should fail with invalid credentials', () => {
      const loginDto = {
        email: 'logintest@example.com',
        password: 'WrongPassword123!',
      };

      return request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send(loginDto)
        .expect(401);
    });
  });

  describe('/auth/profile (GET)', () => {
    let accessToken: string;

    beforeEach(async () => {
      // Register and login to get access token
      const registerDto = {
        email: 'profiletest@example.com',
        password: 'SecurePassword123!',
        firstName: 'Profile',
        lastName: 'Test',
        role: UserRole.PREPARATEUR,
        departmentId: '507f1f77bcf86cd799439011',
      };

      await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(registerDto);

      const loginDto = {
        email: 'profiletest@example.com',
        password: 'SecurePassword123!',
      };

      const loginResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send(loginDto);

      accessToken = loginResponse.body.accessToken;
    });

    it('should get user profile with valid token', () => {
      return request(app.getHttpServer())
        .get('/api/v1/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('email', 'profiletest@example.com');
          expect(res.body).toHaveProperty('firstName', 'Profile');
          expect(res.body).toHaveProperty('lastName', 'Test');
        });
    });

    it('should fail without token', () => {
      return request(app.getHttpServer())
        .get('/api/v1/auth/profile')
        .expect(401);
    });
  });
});