export function getPaginationParams(page: number, limit: number) {
    return {
        page: page > 0 ? page : 1,
        limit: limit > 0 ? limit : 20,
        offset: page > 0 && limit > 0 ? (page - 1) * limit : 0,
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