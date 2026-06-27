import { QdrantClient } from '@qdrant/js-client-rest';

export const QDRANT_CLIENT = 'QDRANT_CLIENT';

export const QdrantProvider = {
  provide: QDRANT_CLIENT,
  useFactory: (): QdrantClient => {
    return new QdrantClient({ url: 'http://127.0.0.1:6333' });
  },
};
