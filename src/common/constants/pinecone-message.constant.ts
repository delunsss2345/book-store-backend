export const PineconeMessage = {
  MISSING_PINECONE_API_KEY: 'Thiếu PINECONE_API_KEY',
  MISSING_PINECONE_INDEX: 'Thiếu PINECONE_INDEX',
  QUERY_REQUIRED: 'Từ khóa tìm kiếm là bắt buộc',
  GEMINI_EMBEDDING_RETURNED_EMPTY_VECTOR: 'Gemini trả về vector rỗng',
  QUERY_BOOKS_FAILED: 'Truy vấn sách từ Pinecone thất bại',
  REINDEX_BOOKS_FAILED: 'Đồng bộ lại sách lên Pinecone thất bại',
} as const;
