import { EmailOutboxService } from '@/modules/email-outbox/service/email-outbox.service';
import { VerificationRepository } from '@/modules/verification-code/repository/verification-code.repository';
import { VerificationCodeService } from '@/modules/verification-code/service/verification-code.service';
import { Test, TestingModule } from '@nestjs/testing';
import { VerificationType } from '@prisma/client';
describe('VerificationCodeService', () => {
    let service: VerificationCodeService;
    let verificationRepository: jest.Mocked<VerificationRepository>;
    let emailOutboxService: jest.Mocked<EmailOutboxService>;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                VerificationCodeService,
                {
                    provide: VerificationRepository,
                    useValue: {
                        createVerifyCationCode: jest.fn(),
                        updateCodeHash: jest.fn(),
                        findActiveRegisterByCodeHash: jest.fn(),
                        findActiveForgotByCodeHash: jest.fn(),
                        markUsedById: jest.fn(),
                        markAllRegisterUnusedByEmail: jest.fn(),
                    },
                },
                {
                    provide: EmailOutboxService,
                    useValue: {
                        createOutboxRegisterEmail: jest.fn(),
                        createOutboxForgotPasswordEmail: jest.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get(VerificationCodeService);
        verificationRepository = module.get(VerificationRepository);
        emailOutboxService = module.get(EmailOutboxService);
    });

    it('should create register verification and register email outbox', async () => {
        const expiresAt = new Date('2026-01-01T00:00:00.000Z');
        const verification = { id: 1 };
        const outbox = { id: 10 };

        verificationRepository.createVerifyCationCode.mockResolvedValue({
            record: verification,
        } as any);

        emailOutboxService.createOutboxRegisterEmail.mockResolvedValue(
            outbox as any,
        );

        const result = await service.createRegisterVerification({
            userId: 1,
            email: 'test@example.com',
            expiresAt,
        });

        expect(verificationRepository.createVerifyCationCode).toHaveBeenCalledWith({
            userId: 1,
            email: 'test@example.com',
            expiresAt,
            type: VerificationType.REGISTER,
        });

        expect(emailOutboxService.createOutboxRegisterEmail).toHaveBeenCalledWith({
            toEmail: 'test@example.com',
        });

        expect(result).toEqual({
            verification,
            outbox,
        });
    });

    it('should create forgot password verification and forgot password email outbox', async () => {
        const expiresAt = new Date('2026-01-01T00:00:00.000Z');
        const verification = { id: 2 };
        const outbox = { id: 20 };

        verificationRepository.createVerifyCationCode.mockResolvedValue({
            record: verification,
        } as any);

        emailOutboxService.createOutboxForgotPasswordEmail.mockResolvedValue(
            outbox as any,
        );

        const result = await service.createForgotPasswordVerification({
            userId: 1,
            email: 'test@example.com',
            expiresAt,
        });

        expect(verificationRepository.createVerifyCationCode).toHaveBeenCalledWith({
            userId: 1,
            email: 'test@example.com',
            expiresAt,
            type: VerificationType.FORGOT_PASSWORD,
        });

        expect(
            emailOutboxService.createOutboxForgotPasswordEmail,
        ).toHaveBeenCalledWith({
            toEmail: 'test@example.com',
        });

        expect(result).toEqual({
            verification,
            outbox,
        });
    });

    it('should update code hash', async () => {
        verificationRepository.updateCodeHash.mockResolvedValue({
            record: { id: 1, codeHash: 'hash' },
        } as any);

        await service.updateCodeHash(1, 'hash');

        expect(verificationRepository.updateCodeHash).toHaveBeenCalledWith(
            1,
            'hash',
        );
    });
});