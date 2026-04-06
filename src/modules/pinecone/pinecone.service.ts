import { PineconeMessage } from '@/common';
import { CatalogRepository } from '@/modules/catalog/catalog.repository';
import { GeminiService } from '@/modules/gemini/gemini.service';
import {
  BookVariantEmbeddingSource,
  buildBookVariantEmbeddingText,
} from '@/utils/generateVector.util';
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { Index, Pinecone, PineconeRecord } from '@pinecone-database/pinecone';

const BOOKS_NAMESPACE = 'book-store';
const DEFAULT_BATCH_SIZE = 200;

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

export type QueryBookVariantsParams = {
  query: string;
  topK: number;
  format?: string;
  maxPrice?: number;
  categoryId?: string;
};

export type QueryBookVariantResult = {
  bookId: string;
  score: number;
  metadata?: BookVariantPineconeMetadata;
};

type SearchIndexVariantRow = Awaited<
  ReturnType<CatalogRepository['findActiveBookFirstVariant']>
>[number];

@Injectable()
export class PineconeService {
  private readonly logger = new Logger(PineconeService.name);
  private readonly index: Index<BookVariantPineconeMetadata>;

  constructor(
    private readonly geminiService: GeminiService,
    private readonly catalogRepository: CatalogRepository,
  ) {
    const apiKey = process.env.PINECONE_API_KEY;
    const indexName = process.env.PINECONE_INDEX;

    if (!apiKey) throw new Error(PineconeMessage.MISSING_PINECONE_API_KEY);
    if (!indexName) throw new Error(PineconeMessage.MISSING_PINECONE_INDEX);

    const pinecone = new Pinecone({ apiKey });
    this.index = pinecone.index<BookVariantPineconeMetadata>(indexName);
  }

  async queryBooks(
    params: QueryBookVariantsParams,
  ): Promise<QueryBookVariantResult[]> {
    // Dùng trim để chặn query chỉ có khoảng trắng, tránh gọi embedding vô ích.
    const query = params.query?.trim();
    if (!query) {
      throw new BadRequestException(PineconeMessage.QUERY_REQUIRED);
    }

    const vector = await this.geminiService.embedText(query); // tính rac vector
    if (!vector?.length) {
      throw new InternalServerErrorException(
        PineconeMessage.GEMINI_EMBEDDING_RETURNED_EMPTY_VECTOR,
      );
    }

    const topK = params.topK > 0 ? params.topK : 10;

    try {
      const response = await this.index.query({
        namespace: BOOKS_NAMESPACE,
        vector,
        topK,
        includeMetadata: true,
      });

      return (response.matches ?? []).map((match) => ({
        bookId: match.metadata?.bookId ?? match.id,
        score: match.score ?? 0,
        metadata: match.metadata,
      }));
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException(
        PineconeMessage.QUERY_BOOKS_FAILED,
      );
    }
  }

  async fullReindexBooks(batchSize = DEFAULT_BATCH_SIZE) {
    const startedAt = Date.now();
    const safeBatchSize = this.normalizeBatchSize(batchSize);
    // Lấy tất cả variant của sách đang active để đồng bộ lên Pinecone. Cần có dữ liệu đầy đủ để đảm bảo embedding chính xác.
    const rows = await this.catalogRepository.findActiveBookFirstVariant();

    let indexed = 0;
    let skipped = 0;

    try {
      // Xóa trước để đồng bộ full sync, tránh giữ record cũ không còn trong DB.
      // await this.index.deleteMany({
      //     namespace: BOOKS_NAMESPACE,
      //     filter: {
      //         type: 'book'
      //     }
      // });

      // Dùng batch để tránh payload quá lớn và giảm nguy cơ timeout.
      // ví dụ 1 row có thể có 1.000.000  cái dùng chunk để tránh xử lí 1 lần 1.000.000 cái gây lỗi
      for (let i = 0; i < rows.length; i += safeBatchSize) {
        const chunk = rows.slice(i, i + safeBatchSize);

        const texts = chunk.map((row) =>
          buildBookVariantEmbeddingText(this.toEmbeddingSource(row)),
        );

        // số text theo số chunk cắt
        const embeddings = await this.geminiService.getEmbedding(texts); // trả 1 mảng
        const records: PineconeRecord<BookVariantPineconeMetadata>[] = [];

        // Xử lí trước 1 phần theo chunk tránh crash
        for (let j = 0; j < chunk.length; j += 1) {
          const row = chunk[j]; // lấy ra hàng data sách đầu tiên
          const values = embeddings[j]; // lấy ra data vector đầu tiên theo chunk

          // Skip vì Pinecone bắt buộc record phải có vector hợp lệ.
          if (!values?.length) {
            skipped += 1;
            continue;
          }

          // Ép về number để filter số trong Pinecone chạy chính xác.
          // Số lỗi thì bỏ qua +1 skipped
          const numericPrice = Number(row.variants[0].price);

          if (!Number.isFinite(numericPrice)) {
            skipped += 1;
            continue;
          }
          // Thêm dữ liệu
          records.push({
            id: row.id.toString(),
            values,
            metadata: this.toMetadata(row, numericPrice), // chuyển meta
          });
        }

        if (!records.length) {
          continue;
        }

        await this.index.upsert({
          namespace: BOOKS_NAMESPACE,
          records,
        });

        indexed += records.length;
      }
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException(
        PineconeMessage.REINDEX_BOOKS_FAILED,
      );
    }

    return {
      namespace: BOOKS_NAMESPACE,
      totalSource: rows.length,
      indexed,
      skipped,
      durationMs: Date.now() - startedAt,
    };
  }

  private normalizeBatchSize(batchSize: number): number {
    if (Number.isFinite(batchSize) && batchSize > 0) {
      return Math.floor(batchSize);
    }
    return DEFAULT_BATCH_SIZE;
  }
  //
  private toMetadata(
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
      categoryIds: Array.from(categoryIdSet), ///???
      langHints: Array.from(langHintSet), //???
      title,
      type: 'book',
    };

    if (row.variants[0].currencyCode) {
      metadata.currencyCode = row.variants[0].currencyCode;
    }

    return metadata;
  }

  private toEmbeddingSource(
    row: SearchIndexVariantRow,
  ): BookVariantEmbeddingSource {
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
  }
}
