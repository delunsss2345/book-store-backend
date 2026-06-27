export const cacheKey = {
  admin: {
    bookStats: () => 'admin:stats',
    userStats: () => 'admin:users:stats',
    categoryStats: () => 'admin:categories:stats',
  },

  catalog: {
    home: (langId: number, limit: number) => `catalog:home:${langId}:${limit}`,
    categories: (langId: number) => `catalog:categories:${langId}`,
    bookList: (langId: number, page: number, limit: number) =>
      `catalog:books:langId=${langId}:p${page}:l${limit}`,
    bookListByCategory: (langId: number, page: number, limit: number, slug: string) =>
      `catalog:books:langId=${langId}:p${page}:l${limit}:cat=${slug}`,
    bookDetail: (bookId: number, langId: number) =>
      `catalog:detail:${bookId}:${langId}`,
    bookDetailBySlug: (slug: string, langId: number) =>
      `catalog:detail:slug:${slug}:${langId}`,
  },

  language: {
    resolve: (code: string) => `lang:${code}`,
  },

  search: {
    semantic: (q: string, langId: number, page: number, limit: number) =>
      `query:books-sematic:${q}:${langId}:${page}:${limit}`,
    isbn: (isbn: string, langId: number) => `isbn:${isbn}:langId:${langId}`,
  },

  role: {
    all: () => 'roles:all',
    byName: (name: string) => `roles:name:${name}`,
    permissions: (roleId: number) => `role_user:${roleId}:perms`,
  },

  order: {
    status: (orderCode: string) => `order:status:${orderCode}`,
  },
};
