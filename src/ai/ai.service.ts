import { Inject, Injectable } from '@nestjs/common';
import { ExtractTicketResponseDto } from './dto/extract-ticket-response.dto';
import { AI_PROVIDER } from './providers/ai-provider.interface';
import type { AiProvider } from './providers/ai-provider.interface';

@Injectable()
export class AiService {
  constructor(@Inject(AI_PROVIDER) private readonly aiProvider: AiProvider) {}

  extractTicketFromImage(
    imageBase64: string,
    mimeType: string,
  ): Promise<ExtractTicketResponseDto> {
    return this.aiProvider.extractTicketFromImage(imageBase64, mimeType);
  }
}
