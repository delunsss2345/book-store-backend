import { Injectable } from '@nestjs/common';
import { R2ServiceService } from '../r2-service/r2-service.service';
import { AppModule } from '@/app.module';
import { optimizeProductImage } from '@/utils/upload.util';

@Injectable()
export class UploadsService {
  constructor(private readonly r2Service: R2ServiceService) {}
  async uploadFile(file: Express.Multer.File) {
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
}
