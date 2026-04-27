import type { Prisma } from '@prisma/client';
import { ExtractTicketResponseDto } from '../dto/extract-ticket-response.dto';

export const AI_PROVIDER = Symbol('AI_PROVIDER');

export interface AiProviderContext {
  provider: string;
  model?: string;
}

export interface AiTicketExtractionResult extends AiProviderContext {
  data: ExtractTicketResponseDto;
  rawResponse: Prisma.InputJsonValue;
}

export interface AiProvider {
  getContext(): AiProviderContext;

  extractTicketFromImage(
    imageBase64: string,
    mimeType: string,
  ): Promise<AiTicketExtractionResult>;
}
