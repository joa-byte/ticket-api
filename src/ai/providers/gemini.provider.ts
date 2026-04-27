import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';
import type { Part } from '@google/genai';
import type { Prisma } from '@prisma/client';
import { ExtractTicketResponseDto } from '../dto/extract-ticket-response.dto';
import { EXTRACT_TICKET_PROMPT } from '../prompts/extract-ticket.prompt';
import { AiProvider, AiTicketExtractionResult } from './ai-provider.interface';

@Injectable()
export class GeminiProvider implements AiProvider {
  private ai?: GoogleGenAI;
  private readonly provider = 'gemini';
  private readonly model: string;

  constructor(private readonly configService: ConfigService) {
    this.model =
      this.configService.get<string>('GEMINI_MODEL') ?? 'gemini-2.5-flash';
  }

  getContext() {
    return {
      provider: this.provider,
      model: this.model,
    };
  }

  async extractTicketFromImage(
    imageBase64: string,
    mimeType: string,
  ): Promise<AiTicketExtractionResult> {
    if (!imageBase64 || !mimeType) {
      throw new BadRequestException('Image data and mimeType are required');
    }

    const response = await this.getClient().models.generateContent({
      model: this.model,
      contents: this.buildContents(imageBase64, mimeType),
      config: {
        responseMimeType: 'application/json',
        temperature: 0,
      },
    });

    const text = response.text;

    if (!text) {
      throw new InternalServerErrorException(
        'Gemini returned an empty response',
      );
    }

    const parsed = this.parseTicketResponse(text);

    return {
      ...this.getContext(),
      data: parsed.data,
      rawResponse: parsed.rawResponse,
    };
  }

  private buildContents(imageBase64: string, mimeType: string): Part[] {
    return [
      {
        text: EXTRACT_TICKET_PROMPT,
      },
      {
        inlineData: {
          data: imageBase64,
          mimeType,
        },
      },
    ];
  }

  private getClient(): GoogleGenAI {
    if (this.ai) {
      return this.ai;
    }

    const apiKey = this.configService.get<string>('GEMINI_API_KEY');

    if (!apiKey) {
      throw new InternalServerErrorException(
        'GEMINI_API_KEY is not configured',
      );
    }

    this.ai = new GoogleGenAI({ apiKey });

    return this.ai;
  }

  private parseTicketResponse(text: string): {
    data: ExtractTicketResponseDto;
    rawResponse: Prisma.InputJsonValue;
  } {
    const cleanText = this.cleanJsonText(text);
    let parsed: unknown;

    try {
      parsed = JSON.parse(cleanText);
    } catch {
      throw new InternalServerErrorException(
        'Gemini response could not be parsed as JSON',
      );
    }

    if (!this.isValidTicketResponse(parsed)) {
      throw new InternalServerErrorException(
        'Gemini response does not match the expected ticket shape',
      );
    }

    return {
      data: {
        storeName: parsed.storeName,
        total: parsed.total,
        items: parsed.items.map((item) => ({
          name: item.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
        })),
      },
      rawResponse: parsed as unknown as Prisma.InputJsonValue,
    };
  }

  private cleanJsonText(text: string): string {
    return text
      .trim()
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();
  }

  private isValidTicketResponse(
    value: unknown,
  ): value is ExtractTicketResponseDto {
    if (!value || typeof value !== 'object') {
      return false;
    }

    const ticket = value as Partial<ExtractTicketResponseDto>;

    return (
      typeof ticket.storeName === 'string' &&
      typeof ticket.total === 'number' &&
      Array.isArray(ticket.items) &&
      ticket.items.every((item) => this.isValidTicketItem(item))
    );
  }

  private isValidTicketItem(value: unknown): boolean {
    if (!value || typeof value !== 'object') {
      return false;
    }

    const item = value as Record<string, unknown>;

    return (
      typeof item.name === 'string' &&
      typeof item.quantity === 'number' &&
      item.quantity >= 0 &&
      typeof item.unitPrice === 'number' &&
      typeof item.totalPrice === 'number'
    );
  }
}
