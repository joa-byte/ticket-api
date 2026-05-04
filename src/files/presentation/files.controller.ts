import {
  BadRequestException,
  Controller,
  Param,
  ParseIntPipe,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadTicketImageCommand } from '../application/commands/upload-ticket-image.command';

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

@Controller('tickets')
export class FilesController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post(':ticketId/images')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: MAX_IMAGE_SIZE_BYTES,
      },
      fileFilter: (_request, file, callback) => {
        if (!file.mimetype?.startsWith('image/')) {
          callback(new BadRequestException('Only image files are allowed'), false);
          return;
        }

        callback(null, true);
      },
    }),
  )
  uploadTicketImage(
    @Param('ticketId', ParseIntPipe) ticketId: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.commandBus.execute(
      new UploadTicketImageCommand(ticketId, file),
    );
  }
}
