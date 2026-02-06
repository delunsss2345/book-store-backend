import { PrismaService } from "@/database";
import { VerificationCodeDto } from "@/modules/verification-code/dto/create-verify-code.dto";
import { OTP_TIME_SECONDS } from "@/modules/verification-code/verification-code.constants";
import { randomKey } from "@/utils/randomKey.utils";
import { Injectable } from "@nestjs/common";
import { VerificationType } from "@prisma/client";
import bcrypt from "bcrypt";

@Injectable()
export class VerificationRepository {
    constructor(private readonly prisma: PrismaService) { }

    async createVerifyCationCode(params: VerificationCodeDto) {
        const { userId, email } = params;
        const token = randomKey();
        const codeHash = await bcrypt.hash(token, 10);
        const expiresAt = new Date(Date.now() + OTP_TIME_SECONDS * 1000);

        const record = await this.prisma.verificationCode.create({
            data: {
                userId,
                email,
                type: VerificationType.REGISTER,
                codeHash,
                expiresAt,
            },
        });

        return { token, record };
    }
}
