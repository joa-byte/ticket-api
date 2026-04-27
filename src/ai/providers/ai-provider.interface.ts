import { ExtractTicketResponseDto } from '../dto/extract-ticket-response.dto';

export const AI_PROVIDER = Symbol('AI_PROVIDER');

export interface AiProvider {
  extractTicketFromImage(
    imageBase64: string,
    mimeType: string,
  ): Promise<ExtractTicketResponseDto>;
}
