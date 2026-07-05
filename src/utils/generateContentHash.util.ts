import * as crypto from 'crypto';

export const generateContentHash = (data: {
    id: number,
    price: number,
    format: string,
    isbn: string
}) => {
    if (!data) return "";
    const content = `${data.isbn}-${data.id}-${data.format}-${String(data.price)}`
    return crypto.createHash('sha256').update(content).digest('hex');
}