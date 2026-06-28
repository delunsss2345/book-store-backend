import { uuidv4 } from 'https://jslib.k6.io/k6-utils/1.4.0/index.js';
import { check } from 'k6';
import http from 'k6/http';
import { Options } from 'k6/options';

// export const options: Options = {
//     stages: [
//         { duration: '30s', target: 100 }, // 30 giây đầu: tăng dần từ 0 lên 100 VU
//         { duration: '1m', target: 500 },  // 1 phút tiếp theo: tăng mạnh lên 500 VU và giữ tải
//         { duration: '30s', target: 0 },   // 30 giây cuối: giảm dần về 0 VU để hệ thống hồi phục
//     ],
//     thresholds: {
//         http_req_failed: ['rate<0.05'],    // Tỷ lệ lỗi phải dưới 5%
//         http_req_duration: ['p(95)<3000'], // 95% request phải phản hồi dưới 3 giây
//     },
// };

export const options: Options = {
    stages: [
        { duration: '30s', target: 100 },  // ramp up
        { duration: '1m', target: 200 },  // sustained load
        { duration: '30s', target: 0 },    // ramp down
    ],
    thresholds: {
        http_req_duration: ['p(95)<500'],  // ← đây là số đẹp
        http_req_failed: ['rate<0.01'],  // ← 99% success
    },
}
const BASE_URL = 'http://localhost:3301/api/v1';

const CITIES = ['Hà Nội', 'TP. Hồ Chí Minh', 'Đà Nẵng', 'Cần Thơ', 'Hải Phòng'];
const DISTRICTS = ['Quận 1', 'Quận Tân Bình', 'Hoàn Kiếm', 'Hải Châu', 'Ninh Kiều'];
const WARDS = ['Phường 1', 'Phường 4', 'Phường 7', 'Phường Bến Nghé', 'Phường An Hòa'];
const STREETS = [
    '123 Đường Nguyễn Trãi',
    '45 Lê Lợi',
    '88 Trần Hưng Đạo',
    '200 Võ Thị Sáu',
    '17 Hai Bà Trưng',
];

function randomItem<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

function randomPhone(): string {
    const prefixes = ['090', '091', '093', '094', '096', '097', '098', '032', '033', '034'];
    const prefix = randomItem(prefixes);
    const suffix = Math.floor(Math.random() * 9_000_000 + 1_000_000).toString();
    return prefix + suffix;
}

export default function () {
    const guestSessionId = uuidv4();

    const payload = JSON.stringify({
        isGuest: true,
        guestEmail: `guest_${guestSessionId.slice(0, 8)}@example.com`,
        paymentGateway: 'COD',
        items: [
            {
                bookVariantId: 2,
                quantity: 1,
            },
        ],
        guestAddress: {
            name: `Khách ${Math.floor(Math.random() * 9000 + 1000)}`,
            phoneNumber: randomPhone(),
            addressLine: randomItem(STREETS),
            ward: randomItem(WARDS),
            district: randomItem(DISTRICTS),
            city: randomItem(CITIES),
            note: '',
        },
    });

    const res = http.post(`${BASE_URL}/orders/checkout`, payload, {
        headers: {
            'Content-Type': 'application/json',
            'x-guest-session-id': guestSessionId,
        },
    });

    check(res, {
        'status 200 or 201': (r) => r.status === 200 || r.status === 201,
        'has orderCode': (r) => {
            if (res.status !== 200 && res.status !== 201) {
                console.log(`FAIL - status=${res.status} body=${res.body}`)
            }
            try {
                const body = JSON.parse(r.body as string);
                return typeof body?.orderCode === 'string' || typeof body?.data?.orderCode === 'string';
            } catch {
                return false;
            }
        },
    });
}
