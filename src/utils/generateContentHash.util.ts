import { CatalogRepository } from '@/modules/catalog/catalog.repository';
import * as crypto from 'crypto';

export const generateContentHash = (data: Awaited<ReturnType<CatalogRepository['findBookVariantById']>>) => {
    if (!data) return "";
    const content = `${data.bookId}-${data.id}-${data.format}-${String(data.price)}`
    return crypto.createHash('sha256').update(content).digest('hex');
}