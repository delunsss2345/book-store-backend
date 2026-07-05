export function mapGoogleBookToEntity(volume: any) {
    const info = volume.volumeInfo ?? {};
    const isbn13 = info.industryIdentifiers?.find(
        (x: any) => x.type === "ISBN_13",
    )?.identifier;
    const isbn10 = info.industryIdentifiers?.find(
        (x: any) => x.type === "ISBN_10",
    )?.identifier;

    return {
        title: [info.title, info.subtitle].filter(Boolean).join(" - "),
        authors: info.authors ?? [],
        description: info.description ?? "",
        publisher: info.publisher ?? null,
        publishedDate: info.publishedDate ?? null,
        pageCount: info.pageCount ?? null,
        categories: info.categories ?? [],
        isbn: isbn13 ?? isbn10 ?? null,
        thumbnail: info.imageLinks?.thumbnail ?? info.imageLinks?.smallThumbnail ?? null,
        language: info.language ?? null,
    };
}