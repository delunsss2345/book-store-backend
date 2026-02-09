import { EmailOutboxService } from '../email-outbox/email-outbox.service';
import { EmailProducer } from '../jobs/producers/email.producer';
import { JwtService } from '@nestjs/jwt';
import { BadRequestException, HttpException, HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { LoginAttemptService } from '../login-attempt/login-attempt.service';
import { UserSessionService } from '../user-session/user-session.service';
import { VerificationCodeService } from '../verification-code/verification-code.service';
import { RevokedTokenService } from '../revoked-token/revoked-token.service';
import { UserDeviceService } from '../user-device/user-device.service';
import { AuthRepository } from './auth.repository';
import { AuthService } from './auth.service';
import { hashToken } from '../../utils/hashToken.utils';

jest.mock('uuid', () => ({ v4: jest.fn(() => 'mock-device-fingerprint') }));

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
        findActiveRegisterByCodeHash: jest.fn(),
        markUsedById: jest.fn(),
        markAllRegisterUnusedByEmail: jest.fn(),
    };
    const emailOutboxServiceMock = {
        countOtpRegisterByEmailSince: jest.fn(),
        findLatestOtpRegisterByEmailSince: jest.fn(),
        cancelOtpRegisterInProgressByEmail: jest.fn(),
    };
    const emailProducerMock = {
        enqueueOutboxEmail: jest.fn(),
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
        jest.clearAllMocks();
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuthService,
                { provide: AuthRepository, useValue: authRepositoryMock },
                { provide: JwtService, useValue: jwtServiceMock },
                { provide: VerificationCodeService, useValue: verificationCodeServiceMock },
                { provide: EmailOutboxService, useValue: emailOutboxServiceMock },
                { provide: LoginAttemptService, useValue: loginAttemptServiceMock },
                { provide: UserSessionService, useValue: userSessionServiceMock },
                { provide: RevokedTokenService, useValue: revokedTokenServiceMock },
                { provide: UserDeviceService, useValue: userDeviceServiceMock },
                { provide: EmailProducer, useValue: emailProducerMock },
            ],
        }).compile();

        service = module.get<AuthService>(AuthService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('verifyEmail', () => {
        it('marks code used and marks user verified when token is valid', async () => {
            const token = 'valid-token';
            const now = Date.now();
            const tokenHashed = await hashToken(token);
            verificationCodeServiceMock.findActiveRegisterByCodeHash.mockResolvedValue({
                id: 100n,
                userId: 7n,
                expiresAt: new Date(now + 60_000),
            });

            const result = await service.verifyEmail({ token });

            expect(result).toEqual({ success: true });
            expect(verificationCodeServiceMock.findActiveRegisterByCodeHash).toHaveBeenCalledWith(tokenHashed);
            expect(verificationCodeServiceMock.markUsedById).toHaveBeenCalledWith(100n, expect.any(Date));
            expect(authRepositoryMock.markEmailVerified).toHaveBeenCalledWith(7n);
        });

        it('throws bad request when token is not found', async () => {
            verificationCodeServiceMock.findActiveRegisterByCodeHash.mockResolvedValue(null);

            await expect(service.verifyEmail({ token: 'missing-token' })).rejects.toBeInstanceOf(BadRequestException);
            expect(verificationCodeServiceMock.markUsedById).not.toHaveBeenCalled();
        });

        it('marks code as used then throws bad request when token is expired', async () => {
            verificationCodeServiceMock.findActiveRegisterByCodeHash.mockResolvedValue({
                id: 101n,
                userId: 8n,
                expiresAt: new Date(Date.now() - 1000),
            });

            await expect(service.verifyEmail({ token: 'expired-token' })).rejects.toBeInstanceOf(BadRequestException);
            expect(verificationCodeServiceMock.markUsedById).toHaveBeenCalledWith(101n, expect.any(Date));
            expect(authRepositoryMock.markEmailVerified).not.toHaveBeenCalled();
        });
    });

    describe('resendEmail', () => {
        it('returns success when user is not found to prevent email enumeration', async () => {
            authRepositoryMock.findUserByEmail.mockResolvedValue(null);

            const result = await service.resendEmail({ email: 'not-found@example.com' });

            expect(result).toEqual({ success: true });
            expect(emailProducerMock.enqueueOutboxEmail).not.toHaveBeenCalled();
        });

        it('returns success when user is already verified', async () => {
            authRepositoryMock.findUserByEmail.mockResolvedValue({
                id: 1n,
                email: 'verified@example.com',
                isEmailVerified: true,
            });

            const result = await service.resendEmail({ email: 'verified@example.com' });

            expect(result).toEqual({ success: true });
            expect(emailProducerMock.enqueueOutboxEmail).not.toHaveBeenCalled();
        });

        it('throws too many requests when quota is exceeded', async () => {
            authRepositoryMock.findUserByEmail.mockResolvedValue({
                id: 2n,
                email: 'quota@example.com',
                isEmailVerified: false,
            });
            emailOutboxServiceMock.countOtpRegisterByEmailSince.mockResolvedValue(5);
            emailOutboxServiceMock.findLatestOtpRegisterByEmailSince.mockResolvedValue({
                createdAt: new Date(Date.now() - 1000),
            });

            try {
                await service.resendEmail({ email: 'quota@example.com' });
                fail('Expected resendEmail to throw HttpException');
            } catch (error) {
                expect(error).toBeInstanceOf(HttpException);
                expect((error as HttpException).getStatus()).toBe(HttpStatus.TOO_MANY_REQUESTS);
            }
            expect(emailProducerMock.enqueueOutboxEmail).not.toHaveBeenCalled();
        });

        it('invalidates old records, creates new verification and enqueues email when user is unverified', async () => {
            authRepositoryMock.findUserByEmail.mockResolvedValue({
                id: 3n,
                email: 'active@example.com',
                isEmailVerified: false,
            });
            emailOutboxServiceMock.countOtpRegisterByEmailSince.mockResolvedValue(1);
            emailOutboxServiceMock.findLatestOtpRegisterByEmailSince.mockResolvedValue({
                createdAt: new Date(Date.now() - 10 * 60 * 60 * 1000),
            });
            verificationCodeServiceMock.createRegisterVerification.mockResolvedValue({
                verification: { id: 33n },
                outbox: { id: 44n },
            });

            const result = await service.resendEmail({ email: 'active@example.com' });

            expect(result).toEqual({ success: true });
            expect(verificationCodeServiceMock.markAllRegisterUnusedByEmail).toHaveBeenCalledWith('active@example.com', expect.any(Date));
            expect(emailOutboxServiceMock.cancelOtpRegisterInProgressByEmail).toHaveBeenCalledWith('active@example.com');
            expect(verificationCodeServiceMock.createRegisterVerification).toHaveBeenCalledWith({
                email: 'active@example.com',
                userId: 3n,
                expiresAt: expect.any(Date),
            });
            expect(emailProducerMock.enqueueOutboxEmail).toHaveBeenCalledWith(44n, 33n);
        });
    });
});
