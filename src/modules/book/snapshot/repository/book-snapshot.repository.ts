import { PrismaClientTransaction, PrismaService } from "@/database";
import { CreateBookSnapshotDto } from "@/modules/book/snapshot/dto/request/create-book-snapshot.dto";
import { Injectable } from '@nestjs/common';

@Injectable()
export class BookSnapshotRepository {
    constructor(private readonly prisma: PrismaService) { }

    async findSnapshotIdsByVariantIds(variantIds: number[]) {
        const rows = await this.prisma.bookVariantSnapshot.findMany({
            where: { bookVariantId: { in: variantIds } },
            select: { id: true },
        });
        return rows.map(r => r.id);
    }

    async findVariantIdsBySnapshotIds(snapshotIds: number[]) {
        const rows = await this.prisma.bookVariantSnapshot.findMany({
            where: { id: { in: snapshotIds } },
            select: { id: true, bookVariantId: true },
        });
        return rows;
    }

    async upsertBookSnapshot(contentHash: string, dto: CreateBookSnapshotDto) {
        return this.prisma.bookVariantSnapshot.upsert({
            where: { contentHash },
            create: {
                bookVariantId: Number(dto.bookVariantId),
                contentHash,
                priceSnapshot: dto.priceSnapshot,
                formatSnapshot: dto.formatSnapshot,
                isbnSnapshot: dto.isbnSnapshot ?? null,
            },
            update: {
            },
        });
    }

    findBookSnapshotByContentHash(contentHash: string) {
        return this.prisma.bookVariantSnapshot.findFirst({
            where: { contentHash },
            select: { id: true, priceSnapshot: true },
        });
    }

    upsertByContentHash(contentHash: string, dto: CreateBookSnapshotDto, tx: PrismaClientTransaction) {
        return tx.bookVariantSnapshot.upsert({
            where: { contentHash },
            update: {},
            create: {
                bookVariantId: Number(dto.bookVariantId),
                contentHash,
                priceSnapshot: dto.priceSnapshot,
                formatSnapshot: dto.formatSnapshot,
                isbnSnapshot: dto.isbnSnapshot ?? null,
            },
        });
    }
}
