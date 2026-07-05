import { PrismaService } from '@/database';
import { Injectable } from '@nestjs/common';
import { Prisma, EventType as PrismaEventType } from '@prisma/client';
import { CreateUserEventRequestDto } from '../dto/request/create-user-event.request.dto';

@Injectable()
export class UserEventRepository {
    constructor(private readonly prisma: PrismaService) { }

    createUserEvent(
        userId: number,
        eventType: PrismaEventType,
        body: CreateUserEventRequestDto,
    ) {
        return this.prisma.userEvent.create({
            data: {
                userId,
                eventType,
                objectType: body.objectType?.trim() ?? null,
                objectId: body.objectId?.trim() ?? null,
                amount:
                    body.amount === undefined
                        ? null
                        : new Prisma.Decimal(body.amount),
                metadata: body.metadata as Prisma.InputJsonValue | undefined,
            },
            select: {
                id: true,
                userId: true,
                eventType: true,
                objectType: true,
                objectId: true,
                amount: true,
                currencyCode: true,
                metadata: true,
                createdAt: true,
            },
        });
    }
    async findEventTypeByUserAll(userId: number): Promise<{
        eventType: string;
        objectId: string | null;
        objectType: string | null;
        createdAt: Date;
    }[]> {
        return this.prisma.userEvent.findMany({
            where: {
                userId: {
                    equals: userId,
                }

            },
            select: {
                eventType: true,
                objectId: true,
                objectType: true,
                createdAt: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
    }
    async findEventTypeByUser(userId: number, objectType: string): Promise<{
        eventType: string;
        objectId: string | null;
        objectType: string | null;
        createdAt: Date;
    }[]> {
        return this.prisma.userEvent.findMany({
            where: {
                userId: {
                    equals: userId,
                },
                objectType: {
                    equals: objectType
                }
            },
            select: {
                eventType: true,
                objectId: true,
                objectType: true,
                createdAt: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
    }
}
