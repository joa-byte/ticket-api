import {
  BadRequestException,
  Body,
  Controller,
  Logger,
  ParseIntPipe,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AiService } from './ai.service';
import { ExtractTicketResultDto } from './dto/extract-ticket-result.dto';

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

@Controller()
export class AiController {
  private readonly logger = new Logger(AiController.name);

  constructor(private readonly aiService: AiService) {}

  @Post('ai/extract-ticket')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: MAX_IMAGE_SIZE_BYTES,
      },
      fileFilter: (_request, file, callback) => {
        if (!file.mimetype?.startsWith('image/')) {
          callback(new BadRequestException('File must be an image'), false);
          return;
        }

        callback(null, true);
      },
    }),
  )
  extractTicket(
    @Body('groupId', ParseIntPipe) groupId: number,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<ExtractTicketResultDto> {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException('File must be an image');
    }

    this.logger.log(
      `Received AI extract-ticket request groupId=${groupId} originalName=${file.originalname} mimetype=${file.mimetype} size=${file.size}`,
    );

    return this.aiService.extractTicketFromImage(groupId, file);
  }
}
