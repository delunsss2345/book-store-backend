import { PrismaService } from '@/database';
import { Injectable } from '@nestjs/common';

@Injectable()
export class AdminCategoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  countCategories() {
    return this.prisma.category.count({
      where: {
        deletedAt: null,
      },
    });
  }

  countActiveCategories() {
    return this.prisma.category.count({
      where: {
        deletedAt: null,
        isActive: true,
      },
    });
  }
}
