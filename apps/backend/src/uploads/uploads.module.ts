import { Module } from '@nestjs/common';
import { UploadsController } from './uploads.controller';

// Local file upload for product images. Multer writes to ./uploads and the
// files are served statically (see main.ts). Swap for object storage in prod.
@Module({
  controllers: [UploadsController],
})
export class UploadsModule {}
