import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    await app.init();
  });

  it('/health (GET)', () => {
    return request(app.getHttpServer())
      .get('/health')
      .expect(200)
      .expect((response) => {
        expect(response.body.status).toBe('ok');
      });
  });

  it('/webhooks/transactions (POST)', () => {
    return request(app.getHttpServer())
      .post('/webhooks/transactions')
      .send({
        cardNumber: '4111111111111111',
        amount: 10,
        occurredAt: '2026-01-15T10:00:00.000Z',
        stationId: 'station_123',
        stationName: 'Shell Downtown',
      })
      .expect(200)
      .expect((response) => {
        expect(response.body.status).toBe('approved');
        expect(response.body.code).toBe('APPROVED');
      });
  });
});
