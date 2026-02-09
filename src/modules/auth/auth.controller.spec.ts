import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { RefreshGuard } from '../../common/guard/refresh.guard';

jest.mock('uuid', () => ({ v4: jest.fn(() => 'mock-device-fingerprint') }));

describe('AuthController', () => {
    let controller: AuthController;

    beforeEach(async () => {
        const authServiceMock = {
            register: jest.fn(),
            login: jest.fn(),
            verifyEmail: jest.fn(),
            resendEmail: jest.fn(),
        };
        const moduleRef = Test.createTestingModule({
            controllers: [AuthController],
            providers: [
                { provide: AuthService, useValue: authServiceMock },
                { provide: ConfigService, useValue: { get: jest.fn() } },
            ],
        });
        moduleRef.overrideGuard(RefreshGuard).useValue({ canActivate: jest.fn(() => true) });
        const module: TestingModule = await moduleRef.compile();

        controller = module.get<AuthController>(AuthController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });
});
