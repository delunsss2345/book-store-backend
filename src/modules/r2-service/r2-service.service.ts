import { AppModule } from '@/app.module';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Injectable } from '@nestjs/common';

@Injectable()
export class R2ServiceService {
  private s3 = new S3Client({
    region: 'auto',
    endpoint: AppModule.CONFIGURATION.R2_CONFIG.R2_ENDPOINT,
    credentials: {
      accessKeyId: AppModule.CONFIGURATION.R2_CONFIG.R2_ACCESS_KEY_ID,
      secretAccessKey: AppModule.CONFIGURATION.R2_CONFIG.R2_SECRET_ACCESS_KEY,
    },
  });
  async putObject(params: { key: string; body: Buffer; contentType: string }) {
    await this.s3.send(
      new PutObjectCommand({
        Bucket: AppModule.CONFIGURATION.R2_CONFIG.R2_BUCKET,
        Key: params.key,
        Body: params.body,
        ContentType: params.contentType,
      }),
    );
    return { key: params.key };
  }

  async createPresignedUrl(key: string, contentType: string) {
    const command = new PutObjectCommand({
      Bucket: AppModule.CONFIGURATION.R2_CONFIG.R2_BUCKET,
      Key: key,
      ContentType: contentType,
    })
    const url = await getSignedUrl(this.s3, command, { expiresIn: 60 }); // 5 phút
    return {
      url,
      key,
      public_url: `${AppModule.CONFIGURATION.R2_CONFIG.CDN_URL}/${key}`
    }
  }
}
