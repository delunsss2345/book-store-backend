import { cacheKey } from '@/common/constants/cache-key.constant';
import { buildPaginatedResult } from '@/common/pagination/base-pagination.util';
import { AdminUpdatePriceVariant } from '@/modules/admin/book-variant/dto/resquest/update-price-variant.resquest';
import { AdminBookListQueryDto } from '@/modules/admin/book/dto/request';
import { PurchaseOrderItemService } from '@/modules/admin/purchase-order/service/purchase-order-item.service';
import { CacheVersionService } from '@/modules/cache-version/service/cache-version.service';
import { LanguageService } from '@/modules/language/service/language.service';
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  AdminBookVariantsRepository,
  CreateBookVariantInput,
} from '../repository/admin-book-variant.repository';

@Injectable()
export class AdminBookVariantsService {
  constructor(
    private readonly adminBookVariantsRepository: AdminBookVariantsRepository,
    private readonly purchaseOrderItemService: PurchaseOrderItemService,
    private readonly languageService: LanguageService,
    private readonly cacheVersionService: CacheVersionService,
  ) {}

  createVariants(
    bookId: number,
    items: CreateBookVariantInput[],
    tx?: Prisma.TransactionClient,
  ) {
    return this.adminBookVariantsRepository.createVariants(bookId, items, tx);
  }

  async getBookVariants(query: AdminBookListQueryDto, langId: number) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const searchPhrase = undefined;

    const [total, rows] = await Promise.all([
      this.adminBookVariantsRepository.countBookVariants(langId, searchPhrase),
      this.adminBookVariantsRepository.findBookVariants(
        page,
        limit,
        langId,
        searchPhrase,
      ),
    ]);

    return buildPaginatedResult(
      rows.map((row) => row),
      total,
      page,
      limit,
    );
  }

  incrementStockById(
    items: { bookVariantId: number; realQuantity: number }[],
    tx?: Prisma.TransactionClient,
  ) {
    return this.adminBookVariantsRepository.incrementStockById(items, tx);
  }

  async updatePriceVariant(
    variantId: number,
    payload: AdminUpdatePriceVariant,
  ) {
    const purchaseOrderId =
      await this.purchaseOrderItemService.findPurchaseOrderItem(
        variantId,
        payload.purchaseOrderItemId,
      );
    const updated = await this.adminBookVariantsRepository.updatePriceVariant(
      variantId,
      Number(purchaseOrderId?.unitPrice),
    );

    await this.bumpCatalogBookDetailCache(updated.bookId);
    return updated;
  }

  private async bumpCatalogBookDetailCache(bookId: number) {
    const languages = await this.languageService.getLanguage();

    await Promise.all(
      languages.map((language) =>
        this.cacheVersionService.bumpVersion(
          cacheKey.catalog.bookDetail(bookId, Number(language.id)),
        ),
      ),
    );
  }
}
