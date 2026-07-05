import dayjs from 'dayjs';
import { randomInt } from 'node:crypto';

const ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

function generateRandomCode(length = 6) {
    let code = '';

    for (let i = 0; i < length; i++) {
        code += ALPHABET[randomInt(0, ALPHABET.length)];
    }

    return code;
}

export const generateOrderCode = () => {
    return `VLR${dayjs().format('YYMMDD')}${generateRandomCode(6)}`;
};