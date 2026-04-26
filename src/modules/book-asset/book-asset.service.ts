import { AdminBookMessage } from '@/common';
import { AppModule } from '@/app.module';
import { optimizeProductImage } from '@/utils/upload.util';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { R2ServiceService } from '../r2-service/r2-service.service';
import BookAssetRepository from './book-asset.repository';
import { ConfirmBookAssetRequestDto } from './dto/request/confirm-book-asset.request.dto';
import { UploadBookAssetRequestDto } from './dto/request/upload-book-asset.request.dto';

const MAX_BOOK_ASSET_PER_BOOK = 5;

@Injectable()
export class BookAssetService {
  constructor(
    private readonly r2Service: R2ServiceService,
    private readonly bookAssetRepository: BookAssetRepository,
  ) { }

  private async uploadFile(file: Express.Multer.File) {
    const key = `${AppModule.CONFIGURATION.R2_CONFIG.FOLDER_PRODUCT}/${Date.now()}-${file.originalname}`;
    const optimizedBuffer = await optimizeProductImage(file.buffer);
    await this.r2Service.putObject({
      key,
      body: optimizedBuffer,
      contentType: 'image/webp',
    });
    return {
      key,
      cdnUrl: `${AppModule.CONFIGURATION.R2_CONFIG.CDN_URL}/${key}`,
    };
  }

  async uploadBookAsset(body: UploadBookAssetRequestDto) {
    const uploadResult = await this.uploadFile(body.file);
    const bookAsset = await this.bookAssetRepository.createBookAsset({
      bookId: BigInt(body.bookId),
      url: uploadResult.cdnUrl,
    });
    return bookAsset;
  }

  async confirmBookAsset(bookId: bigint, body: ConfirmBookAssetRequestDto) {
    const book = await this.bookAssetRepository.findBookById(bookId);
    if (!book) {
      throw new NotFoundException(AdminBookMessage.BOOK_NOT_FOUND);
    }

    const assetCount = await this.bookAssetRepository.countByBookId(bookId);
    const nextSortOrder = assetCount + 1;

    if (nextSortOrder > MAX_BOOK_ASSET_PER_BOOK) {
      throw new BadRequestException('Mỗi sách chỉ được tối đa 5 assets');
    }

    if (body.orderBy !== nextSortOrder) {
      throw new BadRequestException(
        `orderBy phải là ${nextSortOrder} theo thứ tự upload`,
      );
    }

    const bookVariantAsset = await this.bookAssetRepository.createBookAsset({
      bookId,
      url: body.image_url,
      assetType: body.assetType,
      sortOrder: nextSortOrder,
    });

    return {
      book: true,
      bookVariantAsset,
    };
  }
}
