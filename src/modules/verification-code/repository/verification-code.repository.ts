import { PrismaService } from "@/database";
import { CreateVerifyCodeRequestDto } from "@/modules/verification-code/dto/request/create-verify-code.request.dto";
import { Injectable } from "@nestjs/common";
import { VerificationType } from "@prisma/client";

@Injectable()
export class VerificationRepository {
    constructor(private readonly prisma: PrismaService) { }

    async createVerifyCationCode(params: CreateVerifyCodeRequestDto) {
        const { userId, email, expiresAt, type } = params;
        const record = await this.prisma.verificationCode.create({
            data: {
                userId,
                email,
                type,
                expiresAt,
            },
        });

        return { record };
    }

    async updateCodeHash(id: number, codeHash: string) {
        const record = await this.prisma.verificationCode.update({
            where: { id },
            data: { codeHash },
        });

        return { record };
    }

    findActiveRegisterByCodeHash(codeHash: string) {
        return this.prisma.verificationCode.findFirst({
            where: {
                type: VerificationType.REGISTER,
                codeHash,
                usedAt: null,
            },
        });
    }

    findActiveForgotByCodeHash(codeHash: string, email?: string) {
        return this.prisma.verificationCode.findFirst({
            where: {
                type: VerificationType.FORGOT_PASSWORD,
                codeHash,
                email,
                usedAt: null,
            },
        });
    }

    markUsedById(id: number, usedAt: Date) {
        return this.prisma.verificationCode.update({
            where: { id },
            data: { usedAt },
        });
    }
    // Đánh dấu đã bị dùng
    markAllRegisterUnusedByEmail(email: string, usedAt: Date) {
        return this.prisma.verificationCode.updateMany({
            where: {
                email,
                type: VerificationType.REGISTER,
                usedAt: null,
            },
            data: { usedAt },
        });
    }
}
