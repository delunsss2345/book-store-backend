import { SearchMessage } from '@/common';
import { AppModule } from '@/app.module';
import { CatalogService } from '@/modules/catalog/service/catalog.service';
import { GeminiService } from '@/modules/gemini/service/gemini.service';
import { PineconeService } from '@/modules/pinecone/service/pinecone.service';
import { SearchBooksQueryDto } from '@/modules/search/dto/request';
import { QuickBookFillResponseDto } from '@/modules/search/dto/response/search-isbn.dto';
import { validateISBN } from '@/utils/parseIsbn.util';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import type { Cache } from 'cache-manager';

@Injectable()
export class SearchService {
  constructor(
    private readonly catalogService: CatalogService,
    private readonly pineconeService: PineconeService,
    private readonly geminiService: GeminiService,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}
  // Search sách theo query , topK format maxPrice categoryId
  async searchBooks(query: SearchBooksQueryDto, langId: number): Promise<any> {
    const q = query.q?.trim();
    if (!q) {
      throw new BadRequestException(SearchMessage.Q_REQUIRED);
    }
    const cacheKey = `query:books-sematic:${q}:${langId}:${query.page ?? 1}:${query.limit ?? 10}`;
    const cached = await this.cache.get<any>(cacheKey);
    if (cached) return cached;

    const limit = query.limit ?? 10;
    const page = query.page ?? 1;

    // truyền query
    const matches = await this.pineconeService.queryBooks({
      query: q,
      topK: limit,
    });

    if (!matches.length) {
      return [];
    }

    const orderedBookIdStrings = Array.from(
      new Set(matches.map((match) => match.bookId)),
    );

    const orderedBookIds = orderedBookIdStrings.map((id) => Number(id));

    const rankByBookId = new Map(
      orderedBookIdStrings.map((id, index) => [id, index]),
    );

    const cartBooks = await this.catalogService.queryListBook(
      {
        page: page ?? 1,
        limit,
      },
      orderedBookIds,
      langId,
    );

    const sortedItems = [...cartBooks.items].sort((a, b) => {
      const rankA = rankByBookId.get(a.id) ?? Number.MAX_SAFE_INTEGER;
      const rankB = rankByBookId.get(b.id) ?? Number.MAX_SAFE_INTEGER;
      return rankA - rankB;
    });

    return {
      ...cartBooks,
      items: sortedItems,
    };
  }

  async reindexBooks() {
    return this.pineconeService.fullReindexBooks();
  }

  async searchISBN(isbn: string, langId: number, langCode: string) {
    if (validateISBN(isbn) === false) {
      throw new BadRequestException(
        SearchMessage.INVALID_ISBN_FORMAT_INPUT_FAILED,
      );
    }
    const key = `isbn:${isbn}:langId:${langId}`;
    const cached = await this.cache.get<QuickBookFillResponseDto>(key);
    if (cached) return cached;
    const response = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}&key=${AppModule.CONFIGURATION.GOOGLE_CONFIG.GOOGLE_API_KEY_BOOK}`,
    );
    const json = await response.json();
    const book = await this.geminiService.generateBookData(json, langCode);
    await this.cache.set(key, book);
    return book;
  }
}
