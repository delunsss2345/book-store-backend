import { PublisherMessage } from '@/common';
import { buildPaginatedResult } from '@/common/pagination/base-pagination.util';
import { Injectable, NotFoundException } from '@nestjs/common';
import { CreatePublisherRequestDto } from '../dto/request/create-publisher.request.dto';
import { GetPublisherBooksQueryDto } from '../dto/request/get-publisher-books.query.dto';
import { GetPublishersQueryDto } from '../dto/request/get-publishers.query.dto';
import { PublisherBookItemResponseDto } from '../dto/response/publisher-book-item.response.dto';
import { PublisherBookListResponseDto } from '../dto/response/publisher-book-list.response.dto';
import { PublisherItemResponseDto } from '../dto/response/publisher-item.response.dto';
import { PublisherListResponseDto } from '../dto/response/publisher-list.response.dto';
import { PublisherRepository } from '../repository/publisher.repository';

@Injectable()
export class PublisherService {
  constructor(private readonly publisherRepository: PublisherRepository) {}

  async createPublisher(
    body: CreatePublisherRequestDto,
  ): Promise<PublisherItemResponseDto> {
    const created = await this.publisherRepository.createPublisher(
      body.defaultName,
    );
    return {
      id: created.id.toString(),
      name: created.defaultName,
    };
  }

  async getPublishers(
    query: GetPublishersQueryDto,
  ): Promise<PublisherListResponseDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const [total, rows] = await Promise.all([
      this.publisherRepository.countPublishers(),
      this.publisherRepository.findPublishers(page, limit),
    ]);

    const items: PublisherItemResponseDto[] = rows.map((row) => ({
      id: row.id.toString(),
      name: row.defaultName,
    }));

    return buildPaginatedResult(items, total, page, limit);
  }

  async getPublisherBooks(
    publisherId: number,
    query: GetPublisherBooksQueryDto,
    langId: number,
  ): Promise<PublisherBookListResponseDto> {
    const exists = await this.publisherRepository.existsById(publisherId);
    if (!exists) {
      throw new NotFoundException(PublisherMessage.PUBLISHER_NOT_FOUND);
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const [total, rows] = await Promise.all([
      this.publisherRepository.countBooksByPublisher(publisherId, langId),
      this.publisherRepository.findBooksByPublisher(
        publisherId,
        langId,
        page,
        limit,
      ),
    ]);

    const items: PublisherBookItemResponseDto[] = rows.map((book) => {
      const t = book.translations[0];
      const cheapest = book.variants[0];

      return {
        bookId: book.id.toString(),
        title: t?.title ?? `Book ${book.id.toString()}`,
        slug: t?.slug ?? null,
        minPrice: cheapest ? Number(cheapest.price).toFixed(2) : null,
        coverImageUrl: book.coverImageUrl ?? null,
      };
    });

    return buildPaginatedResult(items, total, page, limit);
  }
}
