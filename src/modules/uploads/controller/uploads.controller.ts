import { PermissionCode } from '@/common/constants/permission-pattern.constant';
import { RequirePermissions } from '@/common/security/decorators/requirePermission.decorator';
import { PresignMultipleRequestDto } from '@/modules/uploads/dto/request/get-presign-multi-url.dto';
import { PresignRequestDto } from '@/modules/uploads/dto/request/get-single-url.dto';
import { PresignMultipleResponseDto } from '@/modules/uploads/dto/response/persign-multi.response.dto';
import { PresignResponseDto } from '@/modules/uploads/dto/response/persign-single.response.dto';
import { imageFileFilter } from '@/utils/upload.util';
import {
  Body,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBody,
  ApiBearerAuth,
  ApiConsumes,
  ApiCreatedResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import { UploadFileDto } from '../dto/request/upload-file-single.dto';
import { UploadsService } from '../service/uploads.service';

@ApiTags('uploads')
@Controller('uploads')
@RequirePermissions(PermissionCode.UPLOAD_MANAGE)
@ApiBearerAuth('access-token')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) { }

  @Post('/')
  @ApiOperation({ summary: 'Upload product image' })
  @ApiCreatedResponse({ description: 'Returns the storage key and CDN URL of the uploaded image', type: Object })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UploadFileDto })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      fileFilter: imageFileFilter,
      limits: { fileSize: 10 * 1024 * 1024, files: 1 },
    }),
  )
  uploadFile(@UploadedFile() file: Express.Multer.File) {
    return this.uploadsService.uploadFile(file);
  }


  @Post("presigned-url/book")
  @ApiOperation({ summary: 'Get a presigned URL for uploading a single book image directly to R2' })
  @ApiBody({ type: PresignRequestDto })
  @ApiResponse({ type: PresignResponseDto })
  getPresignedUrl(@Body() body: PresignRequestDto) {
    return this.uploadsService.getPresignedUrl(body.fileName, body.fileType);
  }


  @Post("presigned-url/multipart-books")
  @ApiOperation({ summary: 'Get presigned URLs for uploading multiple book images directly to R2' })
  @ApiBody({ type: PresignMultipleRequestDto })
  @ApiResponse({ type: PresignMultipleResponseDto })
  getPresignedUrlMultipart(@Body() body: PresignMultipleRequestDto) {
    return this.uploadsService.getPresignedUrlMultipart(body.files);
  }
}

