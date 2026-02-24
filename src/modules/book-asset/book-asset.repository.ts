import { PrismaService } from '@/database';
import { Injectable } from '@nestjs/common';

@Injectable()
class BookAssetRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createBookAsset(data: { bookVariantId: bigint; url: string }) {
    return this.prisma.bookVariantAsset.create({
      data: {
        bookVariantId: data.bookVariantId,
        url: data.url,
      },
    });
  }
}

export default BookAssetRepository;
