import { PrismaService } from "@/database";
import { CreateVerifyCodeRequestDto } from "@/modules/verification-code/dto/request/create-verify-code.request.dto";
import { Injectable } from "@nestjs/common";
import { VerificationType } from "@prisma/client";

@Injectable()
export class VerificationRepository {
    constructor(private readonly prisma: PrismaService) { }

    async createVerifyCationCode(params: CreateVerifyCodeRequestDto) {
        const { userId, email, expiresAt } = params;
        const record = await this.prisma.verificationCode.create({
            data: {
                userId,
                email,
                type: VerificationType.REGISTER,
                expiresAt,
            },
        });

        return { record };
    }

    async updateCodeHash(id: bigint, codeHash: string) {
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

    markUsedById(id: bigint, usedAt: Date) {
        return this.prisma.verificationCode.update({
            where: { id },
            data: { usedAt },
        });
    }

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
