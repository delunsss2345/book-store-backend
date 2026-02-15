import { EventType, scoreEvent } from '@/common/constants/event-type.constant';
import { BookSnapshotRepository } from '@/modules/book-snapshot/book-snapshot.repository';
import { OrderItemRepository } from '@/modules/order-item/order-item.repository';
import { OrderRepository } from '@/modules/order/order.repository';
import { Injectable } from '@nestjs/common';
import { EventType as PrismaEventType } from '@prisma/client';
import { CatalogRepository } from '../catalog/catalog.repository';
import { CreateUserEventRequestDto } from './dto/request/create-user-event.request.dto';
import { UserEventRepository } from './user-event.repository';
type ScoredObj = {
    objectId: string;
    objectType: string;
    createdAt: Date;
    score: number;
};

const VARIANT_EVENT_TYPES: EventType[] = [
    EventType.VIEW_BOOK,
    EventType.ADD_TO_CART,
    EventType.REMOVE_FROM_CART,
];

const ORDER_EVENT_TYPES: EventType[] = [
    EventType.CHECKOUT_START,
    EventType.PLACE_ORDER,
    EventType.PAYMENT_SUCCESS,
    EventType.PAYMENT_FAILED,
];

@Injectable()
export class UserEventService {
    constructor(
        private readonly userEventRepository: UserEventRepository,
        private readonly orderItemRepository: OrderItemRepository,
        private readonly orderRepository: OrderRepository,
        private readonly bookSnapshotRepository: BookSnapshotRepository,
        private readonly catalogRepository: CatalogRepository
    ) { }

    findEventTypeByUser(userId: bigint) {
        return this.userEventRepository.findEventTypeByUserAll(userId);
    }

    findOrderItemsByUserId(userId: bigint) {
        return this.orderItemRepository.findByUserId(userId);
    }

    createViewBookEvent(userId: bigint, body: CreateUserEventRequestDto) {
        return this.userEventRepository.createUserEvent(
            userId,
            PrismaEventType.VIEW_BOOK,
            body,
        );
    }

    createAddToCartEvent(userId: bigint, body: CreateUserEventRequestDto) {
        return this.userEventRepository.createUserEvent(
            userId,
            PrismaEventType.ADD_TO_CART,
            body,
        );
    }

    createRemoveFromCartEvent(userId: bigint, body: CreateUserEventRequestDto) {
        return this.userEventRepository.createUserEvent(
            userId,
            PrismaEventType.REMOVE_FROM_CART,
            body,
        );
    }

    // Merge 2 luong: event tuong tac variant + event theo don hang.
    async getRecommend(userId: bigint) {
        const [scoreVariant, scoreOrder] = await Promise.all([
            this.buildScoreWithRecommendVariant(userId),
            this.buildScoreWithRecommendOrder(userId),
        ]);
        // Merger tính hiệu variant và tính hiệu order 
        const mergedVariantScores = await this.mergerRecommendVariantAndOrder(
            scoreVariant,
            scoreOrder,
        );

        // Lấy ra keys sau đó map  lại
        const variantIdsBigint = [...mergedVariantScores.keys()].map((k) =>
            BigInt(k),
        );

        if (!variantIdsBigint.length) return [];

        // Tìm snapshot với variantId
        const seedSnapshotIds =
            await this.bookSnapshotRepository.findSnapshotIdsByVariantIds(
                variantIdsBigint,
            );

        if (seedSnapshotIds.length === 0) return [];

        // Tìm đơn hàng ids bởi snapshot id của tất cả mọi người xem (liệu mua snapshot họ có mua gì nữa không)
        const orderIds =
            await this.orderItemRepository.findOrderIdsBySnapshotIds(
                seedSnapshotIds,
            );

        const orderIdsMap = orderIds.map(
            BigInt,
        );

        if (orderIdsMap.length === 0) return [];
        // tìm các ứng viên có số lần mua cao, đã có sort theo count
        const candidates =
            await this.orderItemRepository.groupAlsoBoughtSnapshotCandidates(
                orderIdsMap,
                seedSnapshotIds,
                200,
            );

        if (!candidates.length) return [];

        // Lọc ra nhưng ông không có dữ liệu 
        const snapShotIds = candidates
            .map((ca) => ca.bookVariantSnapshotId)
            .filter((id): id is bigint => !!id)
            .map((id) => BigInt(id));
        if (!snapShotIds.length) return [];

        // Kết quá đã có, tìm ra variants gốc 
        const recommendVariantIdsAndId =
            await this.bookSnapshotRepository.findVariantIdsBySnapshotIds(
                snapShotIds,
            );

        // Lọc ra các variant gốc trùng 
        const mapToRecommend = [
            ...new Set(
                recommendVariantIdsAndId.map((v) => v.bookVariantId.toString()),
            ),
        ].map((id) => BigInt(id));
        if (!mapToRecommend.length) return [];

        // Variant đề xuất (tìm ra books gốc)
        const variantRecommend = await this.catalogRepository.findBooksVariantByIds(mapToRecommend, 3);
        const mapped = variantRecommend.map((vr) => {
            return {
                ...vr.book,
                ...vr.translations,
                ...vr.categories,
            };
        });
        return mapped;
    }

    async mergerRecommendVariantAndOrder(variants: Map<string, ScoredObj>, orders: Map<string, ScoredObj>) {
        // Lấy danh sách ids  của order
        const orderIds = [...orders.keys()].map((x) => BigInt(x));
        if (orderIds.length === 0) return variants;

        // Dữ liệu trả ra sẽ gồm id, và danh sách items của order này 
        const ordersWithItems =
            await this.orderRepository.findOrderItemsByOrderId(orderIds);

        // Dữ liệu ko có trả về variants map 
        if (ordersWithItems.length === 0) return variants;

        // Nếu có flatMap [items, items  , items ]
        // Nếu không có flatmap dữ liệu sẽ là [ { [] }] .items => [ [] , [] , [] ]
        const orderSignals = ordersWithItems.flatMap((orderRow) => {
            // Lấy map điểm của order theo order id 
            const orderScore = orders.get(orderRow.id.toString());
            if (!orderScore) return []; // không có trả 


            // Nếu có lọc ra item không có
            // Map nó từ item thành snapshotId trong orderItems
            // Ngày tạo nào lớn hơn thì lấy ngày tạo đó 
            return orderRow.items
                .filter((item) => !!item.bookVariantSnapshotId)
                .map((item) => ({
                    snapshotId: item.bookVariantSnapshotId as bigint,
                    createdAt:
                        orderScore.createdAt > item.createdAt
                            ? orderScore.createdAt
                            : item.createdAt,
                    score: orderScore.score * Math.max(1, item.quantity ?? 1), // map số lượng
                }));
        });
        // Nếu orderSignal ko có trả về variants
        if (!orderSignals.length) return variants;

        // Lọc ra id của snapshot 
        const snapshotIds = [...new Set(orderSignals.map((x) => x.snapshotId.toString()))]
            .map((id) => BigInt(id));
        if (!snapshotIds.length) return variants;

        // Tìm variant với snapshot id 
        const variantBySnapshotRows =
            await this.bookSnapshotRepository.findVariantIdsBySnapshotIds(
                snapshotIds,
            );
        if (!variantBySnapshotRows.length) return variants;

        // Tạo ra map dùng id, phần tử còn lại là bookVariant
        const variantBySnapshot = new Map(
            variantBySnapshotRows.map((row) => [
                row.id.toString(),
                row.bookVariantId.toString(),
            ] as const),
        );

        // Khởi tạo variants
        const mergedMap = new Map<string, ScoredObj>(variants);

        // Lọc ra tín hiệu của order
        for (const signal of orderSignals) {
            // Get bookVariantId 
            const variantId = variantBySnapshot.get(signal.snapshotId.toString());
            if (!variantId) continue; // ko có bỏ qua 

            // Tính điểm lại, truyền map mới vô  (điểm 100% sẽ luôn có)
            this.upsertScore(
                mergedMap,
                variantId,
                'bookVariant', // Type là book Variant
                signal.createdAt,
                signal.score, // Điểm của orders Map cũ 
            );
        }

        return this.getTopKMap(mergedMap, 20);
    }

    async buildScoreWithRecommendVariant(userId: bigint) {
        const events = await this.userEventRepository.findEventTypeByUser(userId, 'bookVariant');
        const map = new Map<string, ScoredObj>();
        const allowedTypes = new Set<EventType>(VARIANT_EVENT_TYPES);

        events.forEach((ev) => {
            const type = ev?.eventType as EventType;
            if (!ev?.objectId) return;
            if (ev.objectType !== 'bookVariant') return;
            if (!allowedTypes.has(type)) return;

            this.upsertScore(
                map,
                ev.objectId,
                'bookVariant',
                ev.createdAt,
                scoreEvent({ type, createdAt: ev.createdAt }),
            );
        });

        return this.getTopKMap(map, 20);
    }

    async buildScoreWithRecommendOrder(userId: bigint) {
        const events = await this.userEventRepository.findEventTypeByUser(userId, 'order');
        const map = new Map<string, ScoredObj>();
        const allowedTypes = new Set<EventType>(ORDER_EVENT_TYPES);

        events.forEach((ev) => {
            const type = ev?.eventType as EventType;
            if (!ev?.objectId) return;
            if (ev.objectType !== 'order') return;
            if (!allowedTypes.has(type)) return;

            this.upsertScore(
                map,
                ev.objectId,
                'order',
                ev.createdAt,
                scoreEvent({ type, createdAt: ev.createdAt }),
            );
        });

        return this.getTopKMap(map, 20);
    }
    private upsertScore(
        map: Map<string, ScoredObj>,
        objectId: string,
        objectType: string,
        createdAt: Date,
        scoreDelta: number,
    ) {
        const prev = map.get(objectId); // Lấy id của dữ liệu event (có thể là orderId , hoặc bookVariantId)
        if (prev) {
            // Đã có thì + điểm mới 
            map.set(objectId, {
                objectId,
                objectType,
                createdAt: prev.createdAt > createdAt ? prev.createdAt : createdAt,
                score: prev.score + scoreDelta,
            });
            return;
        }
        // Chưa có thì tạo điểm mới 
        map.set(objectId, {
            objectId,
            objectType,
            createdAt,
            score: scoreDelta,
        });
    }

    // Lọc ra điếm > - 
    // Nếu điểm khác nhau sắp xếp từ lớn đến bé
    // Nếu = check thời gian tạo 
    // Cắt dữ liệu từ 0 tới K
    getTopKFromMap(map: Map<string, ScoredObj>, k = 10) {
        return [...map.values()]
            .filter((x) => x.score > 0)
            .sort((a, b) => {
                if (b.score !== a.score) return b.score - a.score;
                return b.createdAt.getTime() - a.createdAt.getTime();
            })
            .slice(0, Math.max(1, k));
    }
    // Tạo lại map mới, vì đã get hết values sắp xếp 
    getTopKMap(map: Map<string, ScoredObj>, k = 10) {
        const topArr = this.getTopKFromMap(map, k);
        return new Map(topArr.map((x) => [x.objectId, x] as const));
    }
}
