import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { AiExtractionStatus, Prisma, TicketState } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ExtractTicketResultDto } from './dto/extract-ticket-result.dto';
import { AI_PROVIDER } from './providers/ai-provider.interface';
import type {
  AiProvider,
  AiTicketExtractionResult,
} from './providers/ai-provider.interface';

@Injectable()
export class AiService {
  constructor(
    @Inject(AI_PROVIDER) private readonly aiProvider: AiProvider,
    private readonly prisma: PrismaService,
  ) {}

  async extractTicketFromImage(
    groupId: number,
    imageBase64: string,
    mimeType: string,
  ): Promise<ExtractTicketResultDto> {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
      select: { id: true },
    });

    if (!group) {
      throw new NotFoundException(`Group with id ${groupId} not found`);
    }

    const ticket = await this.prisma.ticket.create({
      data: {
        groupId,
        state: TicketState.UPLOADED,
      },
      select: { id: true },
    });

    const extraction = await this.extractWithFailureLog(
      ticket.id,
      imageBase64,
      mimeType,
    );

    await this.prisma.$transaction([
      this.prisma.ticketAiExtraction.create({
        data: {
          ticketId: ticket.id,
          provider: extraction.provider,
          model: extraction.model,
          rawResponse: extraction.rawResponse,
          status: AiExtractionStatus.SUCCESS,
        },
      }),
      this.prisma.ticket.update({
        where: { id: ticket.id },
        data: { state: TicketState.AI_PROCESSED },
      }),
    ]);

    return {
      ticketId: ticket.id,
      ...extraction.data,
    };
  }

  private async extractWithFailureLog(
    ticketId: number,
    imageBase64: string,
    mimeType: string,
  ): Promise<AiTicketExtractionResult> {
    try {
      return await this.aiProvider.extractTicketFromImage(
        imageBase64,
        mimeType,
      );
    } catch (error) {
      const context = this.aiProvider.getContext();

      await this.prisma.ticketAiExtraction.create({
        data: {
          ticketId,
          provider: context.provider,
          model: context.model,
          rawResponse: Prisma.JsonNull,
          status: AiExtractionStatus.FAILED,
          error: this.getErrorMessage(error),
        },
      });

      throw error;
    }
  }

  private getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }

    return 'Unknown AI extraction error';
  }
}
