// @Deprecated: This function is deprecated and will be removed in future versions. Please use the new SKU generation logic in the catalog service instead.
// export const generateSKU = (variant: {
//     id: number;
//     bookId: number;
//     format: BookFormat;
// }): string => {
//     const mainTitle = "BOOK";

//     const titlePart = mainTitle
//         .normalize("NFD")
//         .replace(/[\u0300-\u036f]/g, "")
//         .replace(/[^a-zA-Z0-9]/g, "")
//         .substring(0, 3)
//         .toUpperCase();

//     const formatMap: Record<BookFormat, string> = {
//         'HARDCOVER': 'HC',
//         'PAPERBACK': 'PB',
//         'EBOOK': 'EB',
//         'AUDIOBOOK': 'AU'
//     };
//     const formatPart = formatMap[variant.format] || 'GEN';

//     const idPart = variant.id.toString().slice(-4);
//     return `${titlePart}-${formatPart}-${idPart}-VN`;
// };