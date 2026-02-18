export type BookVariantEmbeddingSource = {
    titles: string[];
    descriptions: string[];
    publisherName?: string | null;
    categoryNames: string[];
    price: number;
    currencyCode?: string | null;
};

function uniqueNonEmpty(items: string[]) {
    return Array.from(
        new Set(items.map((item) => item.trim()).filter((item) => item.length > 0)),
    );
}

export function buildBookVariantEmbeddingText(source: BookVariantEmbeddingSource) {
    const titles = uniqueNonEmpty(source.titles);
    const descriptions = uniqueNonEmpty(source.descriptions);
    const categories = uniqueNonEmpty(source.categoryNames);

    return [
        titles.length ? `Titles: ${titles.join(' | ')}` : '',
        descriptions.length ? `Descriptions: ${descriptions.join(' | ')}` : '',
        source.publisherName ? `Publisher: ${source.publisherName}` : '',
        categories.length ? `Categories: ${categories.join(', ')}` : '',
    ]
        .filter(Boolean)
        .join('\n');
}
