import { NotFoundException } from '@nestjs/common';
import { CatalogBookSort } from './dto/request';
import { CatalogRepository } from './catalog.repository';
import { CatalogService } from './catalog.service';

describe('CatalogService', () => {
    let service: CatalogService;
    let repository: jest.Mocked<CatalogRepository>;
    let cacheManager: { get: jest.Mock; set: jest.Mock };

    beforeEach(() => {
        repository = {
            findLanguageByCode: jest.fn(),
            findDefaultLanguage: jest.fn(),
            findActiveCategoriesByLanguage: jest.fn(),
            findActiveBookRows: jest.fn(),
            findNewestActiveBookIds: jest.fn(),
            findBooksByIds: jest.fn(),
            findBookDetailById: jest.fn(),
            groupBookRatings: jest.fn(),
            groupBookSales: jest.fn(),
        } as unknown as jest.Mocked<CatalogRepository>;

        cacheManager = {
            get: jest.fn().mockResolvedValue(null),
            set: jest.fn().mockResolvedValue(undefined),
        };

        service = new CatalogService(repository, cacheManager as any);
    });

    it('returns home payload and falls back recommend to newest when no rating/sales', async () => {
        repository.findLanguageByCode.mockResolvedValue({ id: 2, code: 'vi' });
        repository.findActiveCategoriesByLanguage.mockResolvedValue([
            {
                id: 1n,
                parentId: null,
                sortOrder: 1,
                categoryTranslation: [{ name: 'Lap trinh', slug: 'programming' }],
            } as any,
        ]);
        repository.findNewestActiveBookIds.mockResolvedValue([{ id: 1n }, { id: 2n }]);
        repository.groupBookRatings.mockResolvedValue([] as any);
        repository.groupBookSales.mockResolvedValue([] as any);
        repository.findBooksByIds.mockResolvedValue([
            {
                id: 1n,
                coverImageUrl: null,
                publicationYear: 2020,
                pageCount: 100,
                weightGrams: 300,
                createdAt: new Date('2025-01-01T00:00:00.000Z'),
                publisher: null,
                translations: [{ title: 'Book A', slug: 'book-a', description: 'A' }],
                categories: [],
                variants: [{ id: 11n, format: 'PAPERBACK', edition: 1, isbn: '111', price: 10, currencyCode: 'USD', stock: 10 }],
            } as any,
            {
                id: 2n,
                coverImageUrl: null,
                publicationYear: 2020,
                pageCount: 100,
                weightGrams: 300,
                createdAt: new Date('2025-01-02T00:00:00.000Z'),
                publisher: null,
                translations: [{ title: 'Book B', slug: 'book-b', description: 'B' }],
                categories: [],
                variants: [{ id: 22n, format: 'PAPERBACK', edition: 1, isbn: '222', price: 12, currencyCode: 'USD', stock: 10 }],
            } as any,
        ]);

        const result = await service.getCatalogHome({ lang: 'vi', limit: 2 });

        expect(result.categories).toHaveLength(1);
        expect(result.newArrivals.map((item) => item.id)).toEqual(['1', '2']);
        expect(result.recommend.map((item) => item.id)).toEqual(['1', '2']);
    });

    it('sorts book list by best_seller', async () => {
        repository.findLanguageByCode.mockResolvedValue({ id: 2, code: 'vi' });
        repository.findActiveBookRows.mockResolvedValue([
            { id: 1n, createdAt: new Date('2025-01-01T00:00:00.000Z') },
            { id: 2n, createdAt: new Date('2025-01-02T00:00:00.000Z') },
            { id: 3n, createdAt: new Date('2025-01-03T00:00:00.000Z') },
        ]);
        repository.groupBookSales
            .mockResolvedValueOnce([
                { quantity: 9, variant: { bookId: 2n } },
                { quantity: 3, variant: { bookId: 1n } },
            ] as any)
            .mockResolvedValueOnce([
                { quantity: 9, variant: { bookId: 2n } },
                { quantity: 3, variant: { bookId: 1n } },
            ] as any);
        repository.groupBookRatings.mockResolvedValue([] as any);
        repository.findBooksByIds.mockResolvedValue([
            {
                id: 2n,
                coverImageUrl: null,
                publicationYear: 2020,
                pageCount: 100,
                weightGrams: 300,
                createdAt: new Date('2025-01-02T00:00:00.000Z'),
                publisher: null,
                translations: [{ title: 'Book B', slug: 'book-b', description: 'B' }],
                categories: [],
                variants: [{ id: 22n, format: 'PAPERBACK', edition: 1, isbn: '222', price: 12, currencyCode: 'USD', stock: 10 }],
            } as any,
            {
                id: 1n,
                coverImageUrl: null,
                publicationYear: 2020,
                pageCount: 100,
                weightGrams: 300,
                createdAt: new Date('2025-01-01T00:00:00.000Z'),
                publisher: null,
                translations: [{ title: 'Book A', slug: 'book-a', description: 'A' }],
                categories: [],
                variants: [{ id: 11n, format: 'PAPERBACK', edition: 1, isbn: '111', price: 10, currencyCode: 'USD', stock: 10 }],
            } as any,
        ]);

        const result = await service.listBooks({
            lang: 'vi',
            page: 1,
            limit: 2,
            sort: CatalogBookSort.BEST_SELLER,
        });

        expect(result.total).toBe(3);
        expect(result.items.map((item) => item.id)).toEqual(['2', '1']);
    });

    it('throws NotFoundException for missing book detail', async () => {
        repository.findLanguageByCode.mockResolvedValue({ id: 2, code: 'vi' });
        repository.findBookDetailById.mockResolvedValue(null);

        await expect(service.getBookDetail(999n, 'vi')).rejects.toBeInstanceOf(NotFoundException);
    });
});
