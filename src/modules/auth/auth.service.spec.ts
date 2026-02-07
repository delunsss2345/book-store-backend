import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { LoginAttemptService } from '../login-attempt/login-attempt.service';
import { UserSessionService } from '../user-session/user-session.service';
import { VerificationCodeService } from '../verification-code/verification-code.service';
import { RevokedTokenService } from '../revoked-token/revoked-token.service';
import { UserDeviceService } from '../user-device/user-device.service';
import { AuthRepository } from './auth.repository';
import { AuthService } from './auth.service';

describe('AuthService', () => {
    let service: AuthService;
    const authRepositoryMock = {
        createUser: jest.fn(),
        existsEmail: jest.fn(),
        findAuthByEmailPassword: jest.fn(),
        findUserByEmail: jest.fn(),
        updateLastLogin: jest.fn(),
        markEmailVerified: jest.fn(),
        updatePassword: jest.fn(),
        updateProfile: jest.fn(),
    };
    const jwtServiceMock = {
        sign: jest.fn(),
    };
    const verificationCodeServiceMock = {
        createRegisterVerification: jest.fn(),
    };
    const loginAttemptServiceMock = {
        createLoginAttempt: jest.fn(),
    };
    const userSessionServiceMock = {
        createSession: jest.fn(),
        revokeSessionByRefreshToken: jest.fn(),
    };
    const revokedTokenServiceMock = {
        revokeToken: jest.fn(),
        isRevoked: jest.fn(),
    };
    const userDeviceServiceMock = {
        upsertDeviceOnLogin: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuthService,
                { provide: AuthRepository, useValue: authRepositoryMock },
                { provide: JwtService, useValue: jwtServiceMock },
                { provide: VerificationCodeService, useValue: verificationCodeServiceMock },
                { provide: LoginAttemptService, useValue: loginAttemptServiceMock },
                { provide: UserSessionService, useValue: userSessionServiceMock },
                { provide: RevokedTokenService, useValue: revokedTokenServiceMock },
                { provide: UserDeviceService, useValue: userDeviceServiceMock },
            ],
        }).compile();

        service = module.get<AuthService>(AuthService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });
});
