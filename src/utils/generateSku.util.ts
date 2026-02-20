import { BookFormat } from "@prisma/client";

export const generateSKU = (variant: {
    id: bigint;
    bookId: bigint;
    format: BookFormat;
    book: {
        id: bigint;
        translations: {
            title: string;
            slug: string | null;
        }[];
    };
}): string => {
    const mainTitle = variant.book.translations[0]?.title || "BOOK";

    const titlePart = mainTitle
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9]/g, "")
        .substring(0, 3)
        .toUpperCase();

    const formatMap: Record<BookFormat, string> = {
        'HARDCOVER': 'HC',
        'PAPERBACK': 'PB',
        'EBOOK': 'EB',
        'AUDIOBOOK': 'AU'
    };
    const formatPart = formatMap[variant.format] || 'GEN';

    const idPart = variant.id.toString().slice(-4);
    return `${titlePart}-${formatPart}-${idPart}-VN`;
};