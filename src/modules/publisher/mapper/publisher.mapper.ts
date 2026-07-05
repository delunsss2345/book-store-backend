import { PublisherBookItemResponseDto } from '../dto/response/publisher-book-item.response.dto';
import { PublisherItemResponseDto } from '../dto/response/publisher-item.response.dto';
import { PublisherRepository } from '../repository/publisher.repository';

type PublisherRow = Awaited<
  ReturnType<PublisherRepository['findPublishers']>
>[number];

type PublisherBookRow = Awaited<
  ReturnType<PublisherRepository['findBooksByPublisher']>
>[number];

export const PublisherMapper = {
  toItem(publisher: PublisherRow): PublisherItemResponseDto {
    return {
      id: publisher.id.toString(),
      name: publisher.defaultName,
    };
  },

  toBookItem(book: PublisherBookRow): PublisherBookItemResponseDto {
    const translation = book.translations[0];
    const cheapest = book.variants[0];

    return {
      bookId: book.id.toString(),
      title: translation?.title ?? `Book ${book.id.toString()}`,
      slug: translation?.slug ?? null,
      minPrice: cheapest ? Number(cheapest.price).toFixed(2) : null,
      coverImageUrl: book.coverImageUrl ?? null,
    };
  },
};
