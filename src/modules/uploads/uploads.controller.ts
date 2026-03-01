import { Public } from '@/common/security/decorators/public.decorator';
import { PresignResponseDto } from '@/modules/r2-service/dto/response/create-persign-url.dto';
import { PresignRequestDto } from '@/modules/uploads/dto/request/get-single-url.dto';
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
  ApiConsumes,
  ApiOperation,
  ApiResponse
} from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import { UploadFileDto } from './dto/request/upload-file-single.dto';
import { UploadsService } from './uploads.service';

@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) { }

  @Post('/')
  @Public()
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


  @Post("presigned-url")
  @Public()
  @ApiBody({ type: PresignRequestDto })
  @ApiResponse({ type: PresignResponseDto })
  getPresignedUrl(@Body() body: PresignRequestDto) {
    return this.uploadsService.getPresignedUrl(body.fileName, body.fileType);
  }
}

