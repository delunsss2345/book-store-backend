import { BookVariantEmbeddingSource } from '@/utils/generateVector.util';
import type { CatalogService } from '@/modules/book/catalog/service/catalog.service';

export type BookVariantPineconeMetadata = {
  bookId: string;
  variantId: string;
  price: number;
  categoryIds: string[];
  langHints: string[];
  title: string;
  currencyCode?: string;
  type: 'book';
};

type SearchIndexVariantRow = Awaited<
  ReturnType<CatalogService['findActiveBookFirstVariant']>
>[number];

export const PineconeMapper = {
  toMetadata(
    row: SearchIndexVariantRow,
    numericPrice: number,
  ): BookVariantPineconeMetadata {
    const langHintSet = new Set<string>();

    for (const translation of row.translations) {
      const code = translation.language.code?.trim().toLowerCase();
      if (code) langHintSet.add(code);
    }

    const categoryIdSet = new Set<string>();
    for (const category of row.categories) {
      categoryIdSet.add(category.category.id.toString());
    }

    let title = `Book ${row.id.toString()}`;
    for (const translation of row.translations) {
      if (translation.title?.trim()) {
        title = translation.title;
        break;
      }
    }

    const metadata: BookVariantPineconeMetadata = {
      bookId: row.id.toString(),
      variantId: row.id.toString(),
      price: numericPrice,
      categoryIds: Array.from(categoryIdSet),
      langHints: Array.from(langHintSet),
      title,
      type: 'book',
    };

    if (row.variants[0].currencyCode) {
      metadata.currencyCode = row.variants[0].currencyCode;
    }

    return metadata;
  },

  toEmbeddingSource(row: SearchIndexVariantRow): BookVariantEmbeddingSource {
    const titleSet = new Set<string>();
    const descriptionSet = new Set<string>();

    for (const translation of row.translations) {
      if (translation.title?.trim()) titleSet.add(translation.title.trim());
      if (translation.description?.trim()) {
        descriptionSet.add(translation.description.trim());
      }
    }

    const categoryNameSet = new Set<string>();
    for (const bookCategory of row.categories) {
      for (const translation of bookCategory.category.categoryTranslation) {
        if (translation.name?.trim()) {
          categoryNameSet.add(translation.name.trim());
        }
      }
    }

    return {
      titles: Array.from(titleSet),
      descriptions: Array.from(descriptionSet),
      categoryNames: Array.from(categoryNameSet),
      price: Number(row.variants[0].price),
      currencyCode: row.variants[0].currencyCode,
    };
  },
};
