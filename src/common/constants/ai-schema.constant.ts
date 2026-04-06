export const CREATE_BOOK_SPEC_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    widthCm: { type: 'number', minimum: 0, multipleOf: 0.01 },
    heightCm: { type: 'number', minimum: 0, multipleOf: 0.01 },
    thicknessCm: { type: 'number', minimum: 0, multipleOf: 0.01 },
    packaging: { type: 'string', maxLength: 200 },
  },
} as const;

export const CREATE_BOOK_TRANSLATION_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['languageId', 'title'],
  properties: {
    languageId: { type: 'integer', minimum: 1 },
    title: { type: 'string', minLength: 1, maxLength: 500 },
    description: { type: 'string' },
    slug: { type: 'string', maxLength: 500 },
  },
} as const;

export const CREATE_BOOK_AUTHOR_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['authorId'],
  properties: {
    authorId: { type: 'string', minLength: 1 },
    isPrimary: { type: 'boolean' },
  },
} as const;

// Prisma enum: BookFormat
// Nếu bạn muốn strict đúng enum values, thay `type: "string"` bằng `enum: [...]` từ codegen.
export const CREATE_BOOK_VARIANT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['format', 'costPrice', 'price'],
  properties: {
    format: { type: 'string' }, // enum BookFormat
    edition: { type: 'integer', minimum: 1 },
    isbn: { type: 'string', maxLength: 20 },
    costPrice: { type: 'number', minimum: 0 },
    price: { type: 'number', minimum: 0 },
    currencyCode: { type: 'string', maxLength: 3 },
    stock: { type: 'integer', minimum: 0 },
    isActive: { type: 'boolean' },
  },
} as const;

// Prisma enum: Badge
export const CREATE_ADMIN_BOOK_ALL_REQUEST_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['translations', 'variants'],
  properties: {
    publisherId: { type: 'string', minLength: 1 },
    publicationYear: { type: 'integer', minimum: 0, maximum: 9999 },
    pageCount: { type: 'integer', minimum: 1 },
    weightGrams: { type: 'integer', minimum: 0 },
    coverImageUrl: {
      type: 'string',
      maxLength: 500,
      format: 'uri',
      pattern: '^https?://',
    },

    badgeCode: { type: 'string' },
    spec: CREATE_BOOK_SPEC_SCHEMA,
    translations: {
      type: 'array',
      minItems: 1,
      items: CREATE_BOOK_TRANSLATION_SCHEMA,
    },
    authors: {
      type: 'array',
      items: CREATE_BOOK_AUTHOR_SCHEMA,
    },
    variants: {
      type: 'array',
      minItems: 1,
      items: CREATE_BOOK_VARIANT_SCHEMA,
    },
  },
} as const;

export const QUICK_BOOK_FILL_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['title', 'description'],
  properties: {
    title: { type: 'string', minLength: 1, maxLength: 500 },
    description: { type: 'string' },
    authorName: { type: 'string', minLength: 1, maxLength: 200 },
    publisherName: { type: 'string', minLength: 1, maxLength: 200 },

    publicationYear: { type: 'integer', minimum: 0, maximum: 9999 },
    pageCount: { type: 'integer', minimum: 1 },
    weightGrams: { type: 'integer', minimum: 0 },

    coverImageUrl: {
      type: 'string',
      maxLength: 500,
      format: 'uri',
      pattern: '^https?://',
    },

    spec: {
      type: 'object',
      additionalProperties: false,
      properties: {
        widthCm: { type: 'number', minimum: 0, multipleOf: 0.01 },
        heightCm: { type: 'number', minimum: 0, multipleOf: 0.01 },
        thicknessCm: { type: 'number', minimum: 0, multipleOf: 0.01 },
        packaging: { type: 'string', maxLength: 200 },
      },
    },
  },
} as const;
