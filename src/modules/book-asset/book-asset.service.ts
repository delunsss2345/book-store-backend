import { Injectable, NotImplementedException } from '@nestjs/common';
import { UploadBookAssetRequestDto } from './dto/request/upload-book-asset.request.dto';

@Injectable()
export class BookAssetService {
    uploadBookAsset(_body: UploadBookAssetRequestDto) {
        throw new NotImplementedException(
            'Book asset upload logic is not implemented in this phase',
        );
    }
}
