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
  ApiOperation,
  ApiResponse
} from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import { UploadFileDto } from './dto/request/upload-file-single.dto';
import { UploadsService } from './uploads.service';

@Controller('uploads')
@RequirePermissions(PermissionCode.UPLOAD_MANAGE)
@ApiBearerAuth('access-token')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) { }

  @Post('/')
  @ApiOperation({ summary: 'Upload product image' })
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
  @ApiBody({ type: PresignRequestDto })
  @ApiResponse({ type: PresignResponseDto })
  getPresignedUrl(@Body() body: PresignRequestDto) {
    return this.uploadsService.getPresignedUrl(body.fileName, body.fileType);
  }


  @Post("presigned-url/multipart-books")
  @ApiBody({ type: PresignMultipleRequestDto })
  @ApiResponse({ type: PresignMultipleResponseDto })
  getPresignedUrlMultipart(@Body() body: PresignMultipleRequestDto) {
    return this.uploadsService.getPresignedUrlMultipart(body.files);
  }
}

