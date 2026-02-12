## Pagination (page/limit)

Query params:
- page: number, default 1, min 1
- limit: number, default 20, min 1, max 100
- sortBy: string, default createdAt (whitelist theo resource)
- sortOrder: asc|desc, default desc

Prisma mapping:
- skip = (page - 1) * limit
- take = limit
- orderBy = { [sortBy]: sortOrder }

Response:
{   
  "statusCode" : ""
  "data": [...],
  "page": 1,
  "limit": 20,
  "total": 123, 
  "totalPages": 7
}

Soft delete default:
- If model has deletedAt: where.deletedAt = null
