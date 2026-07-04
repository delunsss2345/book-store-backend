
import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Permission', () => {
    let app: INestApplication;
    let jwtService: JwtService;
    beforeAll(async () => {
        const moduleRef = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleRef.createNestApplication();
        await app.init();

        jwtService = moduleRef.get(JwtService);
    });


    function createTokenForUserWithoutPermission(userId: number, role: string[]) {
        return jwtService.sign({
            sub: userId,
            email: 'staff.lan@bookstore.local',
            role
        });
    }

    it(`/GET permission not auth`, () => {
        return request(app.getHttpServer())
            .get('/permission')
            .expect(401)
    });

    it(`/GET permission with staff`, () => {
        const token = createTokenForUserWithoutPermission(2, ['STAFF']);
        return request(app.getHttpServer())
            .get('/permission')
            .set('Authorization', `Bearer ${token}`)
            .expect(403)
    });

    afterAll(async () => {
        await app.close();
    });

});
