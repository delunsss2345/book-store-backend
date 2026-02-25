export const BOOK_TRANSLATION_SCHEMA = {
    type: "object",
    additionalProperties: false,
    required: ["title", "description"],
    properties: {
        title: { type: "string" },
        description: { type: "string" },
    },
} as const;