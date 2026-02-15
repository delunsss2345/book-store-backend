import { PrismaService } from "@/database";
import { Injectable } from '@nestjs/common';

@Injectable()
export class BookSnapshotRepository {
    constructor(private readonly prisma: PrismaService) { }

    async findSnapshotIdsByVariantIds(variantIds: bigint[]) {
        const rows = await this.prisma.bookVariantSnapshot.findMany({
            where: { bookVariantId: { in: variantIds } },
            select: { id: true },
        });
        return rows.map(r => r.id);
    }

    async findVariantIdsBySnapshotIds(snapshotIds: bigint[]) {
        const rows = await this.prisma.bookVariantSnapshot.findMany({
            where: { id: { in: snapshotIds } },
            select: { id: true, bookVariantId: true },
        });
        return rows;
    }

}
