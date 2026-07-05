
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { NextFunction, Request, Response } from 'express';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Test x-origin-url', () => {
    let app: INestApplication;
    let receivedOriginUrl: string | string[] | undefined;

    beforeAll(async () => {
        const moduleRef = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleRef.createNestApplication();

        app.use((req: Request, res: Response, next: NextFunction) => {
            receivedOriginUrl = req.headers['x-origin-url'];
            next();
        });

        await app.init();
    });

    it('should receive x-origin-url header', async () => {
        const originUrl = 'http://localhost:3201';

        await request(app.getHttpServer())
            .get('/catalog/home')
            .set('x-origin-url', originUrl)
            .expect(200);

        expect(receivedOriginUrl).toBe(originUrl);
    });

    afterAll(async () => {
        await app.close();
    });
});