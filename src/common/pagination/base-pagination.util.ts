export function getPaginationParams(page?: number, limit?: number) {
    const normalizedPage = page && page > 0 ? page : 1;
    const normalizedLimit = limit && limit > 0 ? limit : 20;

    return {
        page: normalizedPage,
        limit: normalizedLimit,
        offset: (normalizedPage - 1) * normalizedLimit,
    };
}

export function buildPaginatedResult<T>(
    items: T[],
    total: number,
    page: number,
    limit: number,
) {
    return {
        page,
        limit,
        total,
        totalPages: total > 0 ? Math.ceil(total / limit) : 0,
        items,
    };
}
