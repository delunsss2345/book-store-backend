import { IsNumber } from 'class-validator';

export class QdrantConfiguration {
    @IsNumber()
    QDRANT__SERVICE__GRPC_PORT: number;

    constructor() {
        this.QDRANT__SERVICE__GRPC_PORT = Number(
            process.env['QDRANT__SERVICE__GRPC_PORT'] ?? 6334,
        );
    }
}
