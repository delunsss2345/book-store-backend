import { Injectable, NotImplementedException } from '@nestjs/common';
import { UploadBookAssetRequestDto } from './dto/request/upload-book-asset.request.dto';
import { UploadsService } from '../uploads/uploads.service';
import BookAssetRepository from './book-asset.repository';

@Injectable()
export class BookAssetService {
  constructor(
    private readonly uploadService: UploadsService,
    private readonly bookAssetRepository: BookAssetRepository,
  ) {}
  async uploadBookAsset(body: UploadBookAssetRequestDto) {
    const uploadResult = await this.uploadService.uploadFile(body.file);
    const bookAsset = await this.bookAssetRepository.createBookAsset({
      bookVariantId: BigInt(body.bookVariantId),
      url: uploadResult.cdnUrl,
    });
    return bookAsset;
  }
}
