import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { UploadTicketImageHandler } from './application/commands/upload-ticket-image.handler';
import { FILE_STORAGE } from './application/ports/file-storage.port';
import { CloudflareR2StorageService } from './infrastructure/cloudflare-r2-storage.service';
import { PrismaFileRepository } from './infrastructure/prisma-file.repository';
import { FilesController } from './presentation/files.controller';

@Module({
  imports: [CqrsModule],
  controllers: [FilesController],
  providers: [
    UploadTicketImageHandler,
    PrismaFileRepository,
    {
      provide: FILE_STORAGE,
      useClass: CloudflareR2StorageService,
    },
  ],
  exports: [UploadTicketImageHandler],
})
export class FilesModule {}
