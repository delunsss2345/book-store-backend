# Load Testing — Checkout Flow

## Environment

|                    |                                                   |
| ------------------ | ------------------------------------------------- |
| Tool               | k6                                                |
| OS                 | Windows, local machine                            |
| Database           | MySQL (Docker)                                    |
| Cache              | Redis (Docker)                                    |
| App                | NestJS HTTP app + BullMQ worker (2 process riêng) |
| connection_limit   | 50                                                |
| BullMQ concurrency | 5                                                 |

## Test Scenario

```typescript
stages: [
  { duration: '30s', target: 100 },
  { duration: '1m',  target: 200 },
  { duration: '30s', target: 0 },
]

thresholds: {
  http_req_duration: ['p(95)<500'],
  http_req_failed:   ['rate<0.01'],
}
```

- **200 VUs** concurrent tối đa
- **Endpoint:** `POST /api/v1/orders/checkout` (guest checkout)
- **Payload:** 1 variant, quantity 1
- VU bấm liên tục không nghỉ — worst case, không có `sleep()`

---

## Kết quả

| #      | Thay đổi                                                                                                                                      | Error Rate | p(95)     | Iterations | Ghi chú                 |
| ------ | --------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | --------- | ---------- | ----------------------- |
| v1     | Baseline — Prisma interactive transaction bao toàn bộ flow (snapshot + order + items + address) trong job, `doInTransaction` trong HTTP layer | **27.30%** | 7.05s     | 3,400      | P2028 timeout           |
| v2     | Xóa `doInTransaction` khỏi HTTP layer, giữ transaction trong job                                                                              | 0.00%      | 7.23s     | 3,413      | P2028 biến mất          |
| v3     | Tách snapshot ra ngoài transaction, chỉ order + items + address trong tx                                                                      | 0.00%      | 5.49s     | 6,499      | Throughput tăng gấp đôi |
| v4     | Tăng `connection_limit` 20 → 50, thêm index trên `book_variants`                                                                              | 0.00%      | 3.85s     | 6,175      |                         |
| v5     | MySQL buffer pool warm up sau nhiều lần test                                                                                                  | 0.00%      | 2.44s     | 8,634      |                         |
| **v6** | **Thay DB write bằng Redis atomic `DECRBY`**                                                                                                  | **0.00%**  | **1.76s** | **12,564** | **Final**               |

> p(95) cải thiện **75%** so với baseline (7.05s → 1.76s). Error rate từ **27.3% → 0%**.

---

## Root Cause

Prisma interactive transaction (`$transaction(async tx => ...)`) giữ nguyên 1 DB connection từ lúc mở đến lúc commit/rollback. Với 200 VUs và `connection_limit = 20`:

```
200 VUs cần connection đồng thời
Pool chỉ có 20 slot
→ 180 VUs xếp hàng chờ
→ Transaction giữ connection ~4-5s (5 operations tuần tự)
→ Prisma timeout 5s → P2028 "Unable to start transaction"
```

---

## Fix

**1. Xóa `doInTransaction` khỏi HTTP layer**

HTTP request không cần giữ DB connection. `updateReservedByIds` là 1 raw SQL CASE WHEN batch — atomic tự nhiên, không cần wrap thêm transaction.

**2. Thay DB write bằng Redis atomic `DECRBY`**

```typescript
const remaining = await this.redis.decrby(`available:${variantId}`, quantity);
if (remaining < 0) {
  await this.redis.incrby(`available:${variantId}`, quantity); // rollback
  throw new BadRequestException('Hết hàng');
}
```

Redis single-threaded → `DECRBY` atomic tự nhiên, không race condition, không lock row. Latency ~0.1ms thay vì ~50ms của DB write.

**3. Tăng `connection_limit` 20 → 50**

```
MySQL max_connections = 151
2 services (HTTP app + BullMQ worker)
→ connection_limit = 151 × 0.8 / 2 ≈ 60
→ Chọn 50 để còn buffer cho admin/debug
```

---

## Minh chứng

### v1 — Baseline (27.30% fail, p95 = 7.05s)

```
checks_failed......: 27.30%  1628 out of 6800
http_req_duration..: avg=4.08s  med=4.38s  p(95)=7.05s
http_req_failed....: 23.94%  814 out of 3400
iterations.........: 3400    28.33/s
```

### v2 — Bỏ transaction HTTP layer (0% fail, p95 = 7.23s)

```
checks_succeeded...: 100.00%  6826 out of 6826
http_req_duration..: avg=4.06s  med=4.08s  p(95)=7.23s
http_req_failed....: 0.00%   0 out of 3413
iterations.........: 3413    28.43/s
```

### v3 — Tách snapshot ra ngoài tx (0% fail, p95 = 5.49s)

```
checks_succeeded...: 100.00%  12998 out of 12998
http_req_duration..: avg=2.1s   med=952ms   p(95)=5.49s
http_req_failed....: 0.00%   0 out of 6499
iterations.........: 6499    54.15/s
```

### v4 — connection_limit 50 + index (0% fail, p95 = 3.85s)

```
checks_succeeded...: 100.00%  12350 out of 12350
http_req_duration..: avg=2.21s  med=2.3s    p(95)=3.85s
http_req_failed....: 0.00%   0 out of 6175
iterations.........: 6175    51.45/s
```

### v6 — Redis DECRBY — Final (0% fail, p95 = 1.76s)

```
checks_succeeded...: 100.00%  25128 out of 25128
http_req_duration..: avg=1.08s  med=1.15s   p(95)=1.76s
http_req_failed....: 0.00%   0 out of 12564
iterations.........: 12564   104.69/s
```

![Final result](test/performance/results/final.png)
