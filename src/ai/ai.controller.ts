import {
  BadRequestException,
  Body,
  Controller,
  ParseIntPipe,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AiService } from './ai.service';
import { ExtractTicketResultDto } from './dto/extract-ticket-result.dto';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('extract-ticket')
  @UseInterceptors(FileInterceptor('file'))
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

    const imageBase64 = file.buffer.toString('base64');

    return this.aiService.extractTicketFromImage(
      groupId,
      imageBase64,
      file.mimetype,
    );
  }
}
