import {
  Body,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { imageFileFilter } from '@/utils/upload.util';
import { UploadBookAssetRequestDto } from './dto/request/upload-book-asset.request.dto';
import { BookAssetService } from './book-asset.service';
import { Public } from '@/common/security/decorators/public.decorator';

@ApiTags('admin')
@Controller('admin/book-assets')
export class BookAssetController {
  constructor(private readonly bookAssetService: BookAssetService) {}

  @Public()
  @Post('upload')
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UploadBookAssetRequestDto })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      fileFilter: imageFileFilter,
      limits: { fileSize: 10 * 1024 * 1024, files: 1 },
    }),
  )
  uploadBookAsset(
    @Body() body: UploadBookAssetRequestDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.bookAssetService.uploadBookAsset({ ...body, file });
  }
}
