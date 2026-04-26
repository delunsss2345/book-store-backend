import { PermissionCode } from '@/common/constants/permission-pattern.constant';
import { RequirePermissions } from '@/common/security/decorators/requirePermission.decorator';
import { parseBigIntRequired } from '@/utils/parseBigInt.util';
import { imageFileFilter } from '@/utils/upload.util';
import {
  Body,
  Controller,
  Param,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import { BookAssetService } from './book-asset.service';
import { ConfirmBookAssetRequestDto } from './dto/request/confirm-book-asset.request.dto';
import { UploadBookAssetRequestDto } from './dto/request/upload-book-asset.request.dto';
import { ConfirmBookAssetResponseDto } from './dto/response/confirm-book-asset.response.dto';

@ApiTags('admin')
@Controller(['admin/book-assets', 'upload/book-asset'])
@RequirePermissions(PermissionCode.UPLOAD_MANAGE)
@ApiBearerAuth('access-token')
export class BookAssetController {
  constructor(private readonly bookAssetService: BookAssetService) { }

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

  @Post([':bookId/confirm'])  
  @ApiOkResponse({ type: ConfirmBookAssetResponseDto })
  confirmBookAsset(
    @Param('bookId') bookId: string,
    @Body() body: ConfirmBookAssetRequestDto,
  ) {
    return this.bookAssetService.confirmBookAsset(
      parseBigIntRequired(bookId, 'bookId'),
      body,
    );
  }
}
