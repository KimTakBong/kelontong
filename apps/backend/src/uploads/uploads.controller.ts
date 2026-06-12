import { randomBytes } from 'crypto';
import { existsSync, mkdirSync } from 'fs';
import { extname } from 'path';
import {
  BadRequestException,
  Controller,
  Post,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { Request } from 'express';
import {
  ALLOWED_IMAGE_MIME,
  MAX_IMAGE_BYTES,
  UPLOAD_DIR,
  UPLOAD_ROUTE,
} from './uploads.constants';

// Builds an absolute URL for the stored file so the value saved on a product's
// `image` field passes the @IsUrl validation and works directly in <img src>.
// Honours APP_URL (set behind a proxy / in prod) and falls back to the request.
function buildPublicUrl(req: Request, filename: string): string {
  const base = (process.env.APP_URL ?? `${req.protocol}://${req.get('host')}`)
    .replace(/\/$/, '');
  return `${base}${UPLOAD_ROUTE}/${filename}`;
}

@ApiTags('uploads')
@Controller('uploads')
export class UploadsController {
  @Post('image')
  @ApiOperation({ summary: 'Upload gambar produk (disimpan lokal)' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          // Ensure the target dir exists (first upload after a clean checkout).
          if (!existsSync(UPLOAD_DIR)) {
            mkdirSync(UPLOAD_DIR, { recursive: true });
          }
          cb(null, UPLOAD_DIR);
        },
        filename: (_req, file, cb) => {
          // Random, collision-resistant name; keep the original extension.
          const name = `${Date.now()}-${randomBytes(8).toString('hex')}`;
          cb(null, `${name}${extname(file.originalname).toLowerCase()}`);
        },
      }),
      limits: { fileSize: MAX_IMAGE_BYTES },
      fileFilter: (_req, file, cb) => {
        if (!ALLOWED_IMAGE_MIME.includes(file.mimetype)) {
          cb(
            new BadRequestException(
              'Format gambar harus JPG, PNG, WEBP, atau GIF',
            ),
            false,
          );
          return;
        }
        cb(null, true);
      },
    }),
  )
  uploadImage(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: Request,
  ): { url: string; filename: string } {
    if (!file) {
      throw new BadRequestException('File gambar wajib diunggah');
    }
    return { url: buildPublicUrl(req, file.filename), filename: file.filename };
  }
}
