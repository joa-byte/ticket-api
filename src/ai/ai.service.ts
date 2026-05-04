import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { AiExtractionStatus, Prisma, TicketState } from '@prisma/client';
import { UploadTicketImageCommand } from '../files/application/commands/upload-ticket-image.command';
import { UploadTicketImageHandler } from '../files/application/commands/upload-ticket-image.handler';
import { PrismaService } from '../prisma/prisma.service';
import { ExtractTicketResultDto } from './dto/extract-ticket-result.dto';
import { AI_PROVIDER } from './providers/ai-provider.interface';
import type {
  AiProvider,
  AiTicketExtractionResult,
} from './providers/ai-provider.interface';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(
    @Inject(AI_PROVIDER) private readonly aiProvider: AiProvider,
    private readonly prisma: PrismaService,
    private readonly uploadTicketImageHandler: UploadTicketImageHandler,
  ) {}

  async extractTicketFromImage(
    groupId: number,
    file: Express.Multer.File,
  ): Promise<ExtractTicketResultDto> {
    this.logger.log(
      `Starting AI ticket extraction groupId=${groupId} originalName=${file.originalname} mimetype=${file.mimetype} size=${file.size}`,
    );

    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
      select: { id: true },
    });

    if (!group) {
      throw new NotFoundException(`Group with id ${groupId} not found`);
    }

    this.logger.log(`Group found for AI ticket extraction groupId=${groupId}`);

    const ticket = await this.prisma.ticket.create({
      data: {
        groupId,
        state: TicketState.UPLOADED,
      },
      select: { id: true },
    });

    this.logger.log(
      `Created uploaded ticket before image storage ticketId=${ticket.id} groupId=${groupId}`,
    );

    this.startLegacyImageUpload(ticket.id, file);

    const extraction = await this.extractWithFailureLog(
      ticket.id,
      file.buffer.toString('base64'),
      file.mimetype,
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

    this.logger.log(
      `AI ticket extraction completed ticketId=${ticket.id} provider=${extraction.provider} model=${extraction.model}`,
    );

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
      const context = this.aiProvider.getContext();

      this.logger.log(
        `Calling AI provider for ticket extraction ticketId=${ticketId} provider=${context.provider} model=${context.model} mimeType=${mimeType} imageBase64Length=${imageBase64.length}`,
      );

      return await this.aiProvider.extractTicketFromImage(
        imageBase64,
        mimeType,
      );
    } catch (error) {
      const context = this.aiProvider.getContext();

      this.logger.error(
        `AI provider extraction failed ticketId=${ticketId} provider=${context.provider} model=${context.model} error=${this.getErrorMessage(error)}`,
        error instanceof Error ? error.stack : undefined,
      );

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

  private startLegacyImageUpload(
    ticketId: number,
    file: Express.Multer.File,
  ): void {
    this.logger.log(
      `Starting legacy image upload in background ticketId=${ticketId}`,
    );

    void this.uploadTicketImageHandler
      .execute(new UploadTicketImageCommand(ticketId, file))
      .then(() => {
        this.logger.log(`Legacy image upload completed ticketId=${ticketId}`);
      })
      .catch((error: unknown) => {
        this.logger.error(
          `Legacy image upload failed ticketId=${ticketId} error=${this.getErrorMessage(error)}`,
          error instanceof Error ? error.stack : undefined,
        );
      });
  }
}
