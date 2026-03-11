import { PrismaService } from '@/database';
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

@Injectable()
export class SupplierRepository {
  constructor(private readonly prisma: PrismaService) { }

  countSuppliers() {
    return this.prisma.supplier.count();
  }

  findSuppliers(page: number, limit: number) {
    return this.prisma.supplier.findMany({
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        name: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  createSupplier(name: string) {
    return this.prisma.supplier.create({
      data: { name },
      select: {
        id: true,
        name: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }


  createSupplierTx(name: string, tx: Prisma.TransactionClient) {
    const db: Prisma.TransactionClient = tx ?? this.prisma;
    return db.supplier.create({
      data: { name },
      select: {
        id: true,
        name: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    },);
  }

  findSupplierById(supplierId: bigint) {
    return this.prisma.supplier.findUnique({
      where: { id: supplierId },
      select: {
        id: true,
        name: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  updateSupplierActive(supplierId: bigint, isActive: boolean) {
    return this.prisma.supplier.update({
      where: { id: supplierId },
      data: { isActive },
      select: {
        id: true,
        name: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }
}
