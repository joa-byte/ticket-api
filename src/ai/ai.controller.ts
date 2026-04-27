import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AiService } from './ai.service';
import { ExtractTicketResponseDto } from './dto/extract-ticket-response.dto';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('extract-ticket')
  @UseInterceptors(FileInterceptor('file'))
  extractTicket(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<ExtractTicketResponseDto> {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException('File must be an image');
    }

    const imageBase64 = file.buffer.toString('base64');

    return this.aiService.extractTicketFromImage(imageBase64, file.mimetype);
  }
}
