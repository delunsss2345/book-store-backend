import { PrismaService } from "@/database";
import { CreateVerifyCodeRequestDto } from "@/modules/verification-code/dto/request/create-verify-code.request.dto";
import { Injectable } from "@nestjs/common";
import { VerificationType } from "@prisma/client";

@Injectable()
export class VerificationRepository {
    constructor(private readonly prisma: PrismaService) { }

    async createVerifyCationCode(params: CreateVerifyCodeRequestDto) {
        const { userId, email, codeHash, expiresAt } = params;
        const record = await this.prisma.verificationCode.create({
            data: {
                userId,
                email,
                type: VerificationType.REGISTER,
                codeHash,
                expiresAt,
            },
        });

        return { record };
    }
}
