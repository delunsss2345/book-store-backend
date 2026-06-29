import { check } from 'k6';
import http from 'k6/http';

export const options = {
    vus: 10,
    iterations: 10,
};

export default function () {
    const payload = JSON.stringify({
        id: 13656,
        code: '',
        content: 'VLR260629TAAN3Q',
        gateway: 'MBBank',
        subAccount: 'VQRQAHCEN2724',
        accumulated: 0,
        description: 'VLR260629TAAN3Q',
        transferType: 'in',
        accountNumber: '17979220797979',
        referenceCode: 'SBE59377466657',
        transferAmount: 370000,
        transactionDate: '2026-06-29 21:44:16',
    });

    const res = http.post(
        'http://localhost:3301/api/v1/hooks/sepay-payment',
        payload,
        {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Apikey spsk_live_H9kJ1V9wcXNaBMbvveCFPZnKgYekGFb8'
            }
        },
    );

    check(res, {
        'status 200 or 201': (r) => r.status === 200 || r.status === 201,
    });

    console.log(`status=${res.status} body=${res.body}`);
}