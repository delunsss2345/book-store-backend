import { Injectable } from '@nestjs/common';
import { R2ServiceService } from '../r2-service/r2-service.service';
import { AppModule } from '@/app.module';

@Injectable()
export class UploadsService {
  constructor(private readonly r2Service: R2ServiceService) {}
  async uploadFile(file: Express.Multer.File) {
    const key = `${AppModule.CONFIGURATION.R2_CONFIG.FOLDER_PRODUCT}/${Date.now()}-${file.originalname}`;
    await this.r2Service.putObject({
      key,
      body: file.buffer,
      contentType: file.mimetype,
    });
    return {
      key,
      cdnUrl: `${AppModule.CONFIGURATION.R2_CONFIG.CDN_URL}/${key}`,
    };
  }
}
