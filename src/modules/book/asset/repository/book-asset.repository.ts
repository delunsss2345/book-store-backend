import { PrismaService } from '@/database';
import { Injectable } from '@nestjs/common';

type CreateBookAssetParams = {
  bookId: number;
  url: string;
  assetType?: string;
  sortOrder?: number;
};

@Injectable()
class BookAssetRepository {
  constructor(private readonly prisma: PrismaService) {}

  findBookById(bookId: number) {
    return this.prisma.book.findFirst({
      where: {
        id: bookId,
        deletedAt: null,
      },
      select: {
        id: true,
      },
    });
  }

  countByBookId(bookId: number) {
    return this.prisma.bookVariantAsset.count({
      where: {
        bookId,
      },
    });
  }

  async createBookAsset(data: CreateBookAssetParams) {
    return this.prisma.bookVariantAsset.create({
      data: {
        bookId: data.bookId,
        url: data.url,
        assetType: data.assetType ?? null,
        sortOrder: data.sortOrder,
      },
    });
  }
}

export default BookAssetRepository;
