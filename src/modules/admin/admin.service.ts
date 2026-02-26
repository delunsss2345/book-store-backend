import { PrismaService } from '@/database';
import { CreateAdminBookAllRequestDto } from '@/modules/admin/dto/request/create-admin-book-all.request.dto';
import { AuditLogService } from '@/modules/audit-log/audit-log.service';
import { AuthorService } from '@/modules/author/author.service';
import { LanguageService } from '@/modules/language/language.service';
import { PublisherService } from '@/modules/publisher/publisher.service';
import { generateSlug } from '@/utils/generateSlug.util';
import { parseBigIntRequired } from '@/utils/parseBigInt.util';
import {
    BadRequestException,
    ConflictException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AdminRepository, CreateBookAuthorLinkInput } from './admin.repository';
import {
    AdminBookListQueryDto,
    AdminBookSnapshotListQueryDto,
    AdminOrderListQueryDto,
    AdminUserListQueryDto,
    CreateAdminBookRequestDto,
    CreateAdminBookTranslationRequestDto,
    UpdateAdminBookRequestDto,
} from './dto/request';
import {
    AdminBookItemResponseDto,
    AdminBookListResponseDto,
    AdminBookSnapshotItemResponseDto,
    AdminBookSnapshotListResponseDto,
    AdminBookTranslationResponseDto,
    AdminOrderDetailResponseDto,
    AdminOrderItemResponseDto,
    AdminOrderListResponseDto,
    AdminUserItemResponseDto,
    AdminUserListResponseDto,
    AdminUserRoleItemResponseDto,
} from './dto/response';

type BookRow = Awaited<ReturnType<AdminRepository['findBookById']>>;
type BookListRow = Awaited<ReturnType<AdminRepository['findBooks']>>[number];
type SnapshotRow = Awaited<ReturnType<AdminRepository['findBookSnapshots']>>[number];
type UserRow = Awaited<ReturnType<AdminRepository['findUsers']>>[number];
type NonCustomerUserRow = Awaited<ReturnType<AdminRepository['findNonCustomerUsers']>>[number];
type OrderRow = Awaited<ReturnType<AdminRepository['findOrders']>>[number];

@Injectable()
export class AdminService {
    constructor(
        private readonly adminRepository: AdminRepository,
        private readonly languageService: LanguageService,
        private readonly auditLogService: AuditLogService,
        private readonly publisherService: PublisherService,
        private readonly authorService: AuthorService,
        private readonly prisma: PrismaService,
    ) { }

    async createBook(
        body: CreateAdminBookRequestDto,
        actorUserId: bigint,
        ip?: string,
    ): Promise<AdminBookItemResponseDto> {
        const publisherId = this.parsePublisherId(body.publisherId);

        if (publisherId !== undefined) {
            const publisher = await this.adminRepository.findPublisherById(publisherId);
            if (!publisher) {
                throw new NotFoundException('Publisher not found');
            }
        }

        return this.prisma.$transaction(async (tx) => {
            const created = await this.adminRepository.createBook(
                {
                    publisherId,
                    publicationYear: body.publicationYear,
                    pageCount: body.pageCount,
                    weightGrams: body.weightGrams,
                    coverImageUrl: body.coverImageUrl,
                    actorUserId,
                },
                tx,
            );

            const response = this.toAdminBookItem(created);

            await this.auditLogService.createAuditLog(
                {
                    actorUserId,
                    action: 'ADMIN_BOOK_CREATE',
                    entityType: 'BOOK',
                    entityId: response.id,
                    before: null,
                    after: response as unknown as Prisma.InputJsonValue,
                    ip,
                },
                tx,
            );

            return response;
        });
    }

    // Tạo sách cùng 1 lúc nhiều phần variant, translation, author
    async createBookAll(body: CreateAdminBookAllRequestDto, actorUserId: bigint, ip?: string) {
        const normalizedPublisherName = body.publisherName?.trim();
        if (!normalizedPublisherName) {
            throw new BadRequestException('publisherName is required');
        }

        const publisher = await this.publisherService.createPublisher({
            defaultName: normalizedPublisherName,
        });

        const publisherId = this.parsePublisherId(publisher.id);
        if (!publisherId) {
            throw new BadRequestException('Invalid publisher id');
        }

        const normalizedAuthorMap = new Map<string, { name: string; isPrimary: boolean }>();
        for (const author of body.authors ?? []) {
            const normalizedAuthorName = author.authorName?.trim();
            if (!normalizedAuthorName) {
                continue;
            }

            const key = normalizedAuthorName.toLowerCase();
            const existed = normalizedAuthorMap.get(key);
            if (existed) {
                existed.isPrimary = existed.isPrimary || Boolean(author.isPrimary);
                continue;
            }

            normalizedAuthorMap.set(key, {
                name: normalizedAuthorName,
                isPrimary: Boolean(author.isPrimary),
            });
        }

        const normalizedAuthors = Array.from(normalizedAuthorMap.values());
        let bookAuthorsPayload: CreateBookAuthorLinkInput[] = [];

        if (normalizedAuthors.length > 0) {
            const createdAuthors = await this.authorService.createAuthorMany(
                normalizedAuthors.map((author) => author.name),
            );

            const authorIdByName = new Map<string, bigint>(
                createdAuthors.map((author) => [
                    author.name.trim().toLowerCase(),
                    parseBigIntRequired(author.id, 'author.id'),
                ]),
            );

            bookAuthorsPayload = normalizedAuthors.reduce<CreateBookAuthorLinkInput[]>(
                (acc, author) => {
                    const authorId = authorIdByName.get(author.name.toLowerCase());
                    if (!authorId) {
                        return acc;
                    }

                    acc.push({
                        authorId,
                        isPrimary: author.isPrimary,
                    });
                    return acc;
                },
                [],
            );
        }

        const language = await this.languageService.resolveLanguage(body.translations[0].languageCode);

        return this.prisma.$transaction(async (tx) => {
            const createBook = await this.adminRepository.createBook({
                publisherId,
                publicationYear: body.publicationYear,
                pageCount: body.pageCount,
                weightGrams: body.weightGrams,
                coverImageUrl: body.coverImageUrl,
                actorUserId,
            }, tx);

            const createTasks: Promise<unknown>[] = [
                this.adminRepository.createBookTranslation(
                    {
                        bookId: createBook.id,
                        languageId: language.id,
                        title: body.translations[0].title,
                        description: body.translations[0].description,
                        slug: body.translations[0].slug ?? generateSlug(body.translations[0].title)
                    }, tx
                ),
                this.adminRepository.createVariantsByBookId(
                    createBook.id,
                    body.variants.map((v) => ({
                        format: v.format,
                        edition: v.edition,
                        isbn: v.isbn,
                        costPrice: v.costPrice,
                        price: v.price,
                        currencyCode: v.currencyCode,
                        stock: v.stock,
                        isActive: false,
                    })),
                    tx
                ),
            ];

            if (bookAuthorsPayload.length > 0) {
                createTasks.push(this.adminRepository.createBookAuthors(
                    createBook.id,
                    bookAuthorsPayload,
                    tx
                ));
            }

            await Promise.all(createTasks);

            if (body.spec) {
                await this.adminRepository.createBookSpecById(createBook.id, body.spec, tx);
            }
            const newBook = await this.adminRepository.findBookById(createBook.id, tx);
            return this.toAdminBookItem(newBook!);
        });
    }
    async createBookTranslation(
        bookId: bigint,
        body: CreateAdminBookTranslationRequestDto,
        actorUserId: bigint,
        ip?: string,
    ): Promise<AdminBookTranslationResponseDto> {
        const language = await this.languageService.resolveLanguage(body.lang);

        return this.prisma.$transaction(async (tx) => {
            const book = await this.adminRepository.findBookById(bookId, tx);
            if (!book || book.deletedAt) {
                throw new NotFoundException('Book not found');
            }

            const existed = await this.adminRepository.findBookTranslationByBookIdAndLanguage(
                bookId,
                language.id,
                tx,
            );

            if (existed) {
                throw new ConflictException('Book translation already exists in this language');
            }

            const baseSlug = generateSlug(body.title) || `book-${bookId.toString()}`;
            const slug = await this.buildUniqueSlug(language.id, baseSlug, tx);

            const created = await this.adminRepository.createBookTranslation(
                {
                    bookId,
                    languageId: language.id,
                    title: body.title,
                    description: body.description,
                    slug,
                },
                tx,
            );

            const response: AdminBookTranslationResponseDto = {
                id: created.id.toString(),
                languageId: created.languageId,
                title: created.title,
                description: created.description ?? null,
                slug: created.slug ?? slug,
            };

            await this.auditLogService.createAuditLog(
                {
                    actorUserId,
                    action: 'ADMIN_BOOK_TRANSLATION_CREATE',
                    entityType: 'BOOK_TRANSLATION',
                    entityId: response.id,
                    before: null,
                    after: response as unknown as Prisma.InputJsonValue,
                    ip,
                },
                tx,
            );

            return response;
        });
    }

    async updateBook(
        bookId: bigint,
        body: UpdateAdminBookRequestDto,
        actorUserId: bigint,
        ip?: string,
    ): Promise<AdminBookItemResponseDto> {
        const hasPayload = [
            body.publisherId,
            body.publicationYear,
            body.pageCount,
            body.weightGrams,
            body.coverImageUrl,
            body.isActive,
        ].some((item) => item !== undefined);

        if (!hasPayload) {
            throw new BadRequestException('At least one field is required to update');
        }

        const publisherId = this.parsePublisherId(body.publisherId);

        if (publisherId !== undefined) {
            const publisher = await this.adminRepository.findPublisherById(publisherId);
            if (!publisher) {
                throw new NotFoundException('Publisher not found');
            }
        }

        return this.prisma.$transaction(async (tx) => {
            const before = await this.adminRepository.findBookById(bookId, tx);
            if (!before || before.deletedAt) {
                throw new NotFoundException('Book not found');
            }

            let updated: Awaited<ReturnType<AdminRepository['updateBook']>>;
            try {
                updated = await this.adminRepository.updateBook(
                    bookId,
                    {
                        publisherId,
                        publicationYear: body.publicationYear,
                        pageCount: body.pageCount,
                        weightGrams: body.weightGrams,
                        coverImageUrl: body.coverImageUrl,
                        isActive: body.isActive,
                    },
                    actorUserId,
                    tx,
                );
            } catch (error) {
                if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
                    throw new NotFoundException('Book not found');
                }

                throw error;
            }

            const beforeMapped = this.toAdminBookItem(before);
            const afterMapped = this.toAdminBookItem(updated);

            await this.auditLogService.createAuditLog(
                {
                    actorUserId,
                    action: 'ADMIN_BOOK_UPDATE',
                    entityType: 'BOOK',
                    entityId: afterMapped.id,
                    before: beforeMapped as unknown as Prisma.InputJsonValue,
                    after: afterMapped as unknown as Prisma.InputJsonValue,
                    ip,
                },
                tx,
            );

            return afterMapped;
        });
    }

    async deleteBook(bookId: bigint, actorUserId: bigint, ip?: string): Promise<AdminBookItemResponseDto> {
        return this.prisma.$transaction(async (tx) => {
            const before = await this.adminRepository.findBookById(bookId, tx);
            if (!before || before.deletedAt) {
                throw new NotFoundException('Book not found');
            }

            let updated: Awaited<ReturnType<AdminRepository['softDeleteBook']>>;
            try {
                updated = await this.adminRepository.softDeleteBook(bookId, actorUserId, tx);
            } catch (error) {
                if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
                    throw new NotFoundException('Book not found');
                }

                throw error;
            }

            const beforeMapped = this.toAdminBookItem(before);
            const afterMapped = this.toAdminBookItem(updated);

            await this.auditLogService.createAuditLog(
                {
                    actorUserId,
                    action: 'ADMIN_BOOK_DELETE',
                    entityType: 'BOOK',
                    entityId: afterMapped.id,
                    before: beforeMapped as unknown as Prisma.InputJsonValue,
                    after: afterMapped as unknown as Prisma.InputJsonValue,
                    ip,
                },
                tx,
            );

            return afterMapped;
        });
    }

    async getBooks(query: AdminBookListQueryDto): Promise<AdminBookListResponseDto> {
        const page = query.page ?? 1;
        const limit = query.limit ?? 20;
        const language = await this.languageService.resolveLanguage(query.lang);

        const [total, rows] = await Promise.all([
            this.adminRepository.countBooks(),
            this.adminRepository.findBooks(page, limit, language.id),
        ]);

        return {
            page,
            limit,
            total,
            totalPages: total ? Math.ceil(total / limit) : 0,
            items: rows.map((row) => this.toAdminBookListItem(row)),
        };
    }

    async getBookSnapshots(query: AdminBookSnapshotListQueryDto): Promise<AdminBookSnapshotListResponseDto> {
        const page = query.page ?? 1;
        const limit = query.limit ?? 20;

        const [total, rows] = await Promise.all([
            this.adminRepository.countBookSnapshots(),
            this.adminRepository.findBookSnapshots(page, limit),
        ]);

        return {
            page,
            limit,
            total,
            totalPages: total ? Math.ceil(total / limit) : 0,
            items: rows.map((row) => this.toSnapshotItem(row)),
        };
    }

    async getUsers(query: AdminUserListQueryDto): Promise<AdminUserListResponseDto> {
        const page = query.page ?? 1;
        const limit = query.limit ?? 20;

        const [total, rows] = await Promise.all([
            this.adminRepository.countUsers(),
            this.adminRepository.findUsers(page, limit),
        ]);

        return {
            page,
            limit,
            total,
            totalPages: total ? Math.ceil(total / limit) : 0,
            items: rows.map((row) => this.toUserItem(row)),
        };
    }

    async getNonCustomerUsers(query: AdminUserListQueryDto): Promise<AdminUserListResponseDto> {
        const page = query.page ?? 1;
        const limit = query.limit ?? 20;

        const [total, rows] = await Promise.all([
            this.adminRepository.countNonCustomerUsers(),
            this.adminRepository.findNonCustomerUsers(page, limit),
        ]);

        return {
            page,
            limit,
            total,
            totalPages: total ? Math.ceil(total / limit) : 0,
            items: rows.map((row) => this.toUserItem(row)),
        };
    }

    async getOrders(query: AdminOrderListQueryDto): Promise<AdminOrderListResponseDto> {
        const page = query.page ?? 1;
        const limit = query.limit ?? 20;

        const [total, rows] = await Promise.all([
            this.adminRepository.countOrders(),
            this.adminRepository.findOrders(page, limit),
        ]);

        return {
            page,
            limit,
            total,
            totalPages: total ? Math.ceil(total / limit) : 0,
            items: rows.map((row) => this.toOrderItem(row)),
        };
    }

    async getOrderDetail(orderId: bigint): Promise<AdminOrderDetailResponseDto> {
        const row = await this.adminRepository.findOrderDetailById(orderId);
        if (!row) {
            throw new NotFoundException('Order not found');
        }

        return {
            ...this.toOrderItem(row),
            items: row.items.map((item) => ({
                id: item.id.toString(),
                bookVariantSnapshotId: item.bookVariantSnapshotId.toString(),
                quantity: item.quantity,
                unitPrice: this.toDecimalText(item.unitPrice) as string,
                lineTotal: this.toDecimalText(item.lineTotal) as string,
                createdAt: item.createdAt,
                titleSnapshot: item.bookVariantSnapshot.titleSnapshot ?? null,
                coverImageUrlSnapshot: item.bookVariantSnapshot.coverImageUrlSnapshot ?? null,
                skuSnapshot: item.bookVariantSnapshot.skuSnapshot,
                priceSnapshot: this.toDecimalText(item.bookVariantSnapshot.priceSnapshot) as string,
                currencyCodeSnapshot: item.bookVariantSnapshot.currencyCodeSnapshot ?? null,
                formatSnapshot: String(item.bookVariantSnapshot.formatSnapshot),
                editionSnapshot: item.bookVariantSnapshot.editionSnapshot ?? null,
                isbnSnapshot: item.bookVariantSnapshot.isbnSnapshot ?? null,
            })),
        };
    }

    private parsePublisherId(value?: string): bigint | undefined {
        if (value === undefined) {
            return undefined;
        }

        return parseBigIntRequired(value, 'publisherId');
    }

    private async buildUniqueSlug(
        languageId: number,
        baseSlug: string,
        tx: Prisma.TransactionClient,
    ): Promise<string> {
        let candidate = baseSlug;
        let index = 2;

        while (true) {
            const existed = await this.adminRepository.findBookTranslationByLanguageAndSlug(
                languageId,
                candidate,
                tx,
            );

            if (!existed) {
                return candidate;
            }

            candidate = `${baseSlug}-${index}`;
            index += 1;
        }
    }

    private toAdminBookItem(row: NonNullable<BookRow>): AdminBookItemResponseDto {
        const translation = row.translations[0] ?? null;

        return {
            id: row.id.toString(),
            publisherId: row.publisherId ? row.publisherId.toString() : null,
            publicationYear: row.publicationYear ?? null,
            pageCount: row.pageCount ?? null,
            weightGrams: row.weightGrams ?? null,
            coverImageUrl: row.coverImageUrl ?? null,
            isActive: row.isActive,
            deletedAt: row.deletedAt ?? null,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
            translation: translation
                ? {
                    id: translation.id.toString(),
                    languageId: translation.languageId,
                    title: translation.title,
                    description: translation.description ?? null,
                    slug: translation.slug ?? '',
                }
                : null,
            variants: row.variants.map((variant) => ({
                id: variant.id.toString(),
                format: String(variant.format),
                edition: variant.edition ?? null,
                isbn: variant.isbn ?? null,
                costPrice: this.toDecimalText(variant.costPrice) as string,
                price: this.toDecimalText(variant.price) as string,
                currencyCode: variant.currencyCode ?? null,
                stock: variant.stock ?? null,
                isActive: variant.isActive,
            })),
        };
    }

    private toAdminBookListItem(row: BookListRow): AdminBookItemResponseDto {
        const translation = row.translations[0] ?? null;

        return {
            id: row.id.toString(),
            publisherId: row.publisherId ? row.publisherId.toString() : null,
            publicationYear: row.publicationYear ?? null,
            pageCount: row.pageCount ?? null,
            weightGrams: row.weightGrams ?? null,
            coverImageUrl: row.coverImageUrl ?? null,
            isActive: row.isActive,
            deletedAt: row.deletedAt ?? null,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
            translation: translation
                ? {
                    id: translation.id.toString(),
                    languageId: translation.languageId,
                    title: translation.title,
                    description: translation.description ?? null,
                    slug: translation.slug ?? '',
                }
                : null,
            variants: row.variants.map((variant) => ({
                id: variant.id.toString(),
                format: String(variant.format),
                edition: variant.edition ?? null,
                isbn: variant.isbn ?? null,
                costPrice: this.toDecimalText(variant.costPrice) as string,
                price: this.toDecimalText(variant.price) as string,
                currencyCode: variant.currencyCode ?? null,
                stock: variant.stock ?? null,
                isActive: variant.isActive,
            })),
        };
    }

    private toSnapshotItem(row: SnapshotRow): AdminBookSnapshotItemResponseDto {
        return {
            id: row.id.toString(),
            bookVariantId: row.bookVariantId.toString(),
            bookId: row.bookVariant.bookId.toString(),
            titleSnapshot: row.titleSnapshot ?? null,
            coverImageUrlSnapshot: row.coverImageUrlSnapshot ?? null,
            skuSnapshot: row.skuSnapshot,
            priceSnapshot: this.toDecimalText(row.priceSnapshot) as string,
            currencyCodeSnapshot: row.currencyCodeSnapshot ?? null,
            formatSnapshot: String(row.formatSnapshot),
            editionSnapshot: row.editionSnapshot ?? null,
            isbnSnapshot: row.isbnSnapshot ?? null,
            createdAt: row.createdAt,
        };
    }

    private toUserItem(row: UserRow | NonCustomerUserRow): AdminUserItemResponseDto {
        const roles: AdminUserRoleItemResponseDto[] = row.userRoles.map((item) => ({
            id: item.role.id.toString(),
            code: String(item.role.code),
            name: item.role.name,
        }));

        return {
            id: row.id.toString(),
            email: row.email,
            firstName: row.firstName ?? null,
            lastName: row.lastName ?? null,
            status: String(row.status),
            isEmailVerified: row.isEmailVerified,
            lastLoginAt: row.lastLoginAt ?? null,
            createdAt: row.createdAt,
            roles,
        };
    }

    private toOrderItem(row: OrderRow): AdminOrderItemResponseDto {
        return {
            id: row.id.toString(),
            orderCode: row.orderCode,
            userId: row.userId ? row.userId.toString() : null,
            guestSessionId: row.guestSessionId ?? null,
            guestEmail: row.guestEmail ?? null,
            status: row.status ? String(row.status) : null,
            paymentStatus: row.paymentStatus ? String(row.paymentStatus) : null,
            subtotal: this.toDecimalText(row.subtotal),
            discountAmount: this.toDecimalText(row.discountAmount),
            shippingFee: this.toDecimalText(row.shippingFee),
            totalAmount: this.toDecimalText(row.totalAmount),
            currencyCode: row.currencyCode ?? null,
            placedAt: row.placedAt ?? null,
            createdAt: row.createdAt,
            expiredAt: row.expiredAt,
            updatedAt: row.updatedAt,
        };
    }

    private toDecimalText(value: Prisma.Decimal | number | null | undefined): string | null {
        if (value === null || value === undefined) {
            return null;
        }

        return Number(value).toFixed(2);
    }
}
