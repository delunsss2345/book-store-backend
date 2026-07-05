import multer from 'multer';
import path from 'path';
import sharp from 'sharp';

export const imageFileFilter: multer.Options['fileFilter'] = (
  req,
  file,
  cb,
) => {
  const allowed = /jpeg|jpg|png|gif|webp/;
  const extOk = allowed.test(path.extname(file.originalname).toLowerCase());
  const mimeOk = allowed.test(file.mimetype);

  if (extOk && mimeOk) return cb(null, true);

  return cb(new Error('Only images are allowed') as any, false);
};

export function optimizeProductImage(buf: Buffer) {
  return sharp(buf, { failOn: 'warning' })
    .rotate()
    .resize({
      width: 1600,
      height: 1600,
      fit: 'inside',
      withoutEnlargement: true,
    })
    .webp({ quality: 80 })
    .toBuffer();
}
