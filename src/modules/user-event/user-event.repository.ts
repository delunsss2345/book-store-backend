import { PrismaService } from '@/database';
import { Injectable } from '@nestjs/common';

@Injectable()
export class UserEventRepository {
    constructor(private readonly prisma: PrismaService) { }

    findEventTypeByUser(userId: bigint) {
        return this.prisma.userEvent.findMany({
            where: { userId },
            select: {
                eventType: true,
                objectId: true,
                objectType: true,
            },
        });
    }
}
