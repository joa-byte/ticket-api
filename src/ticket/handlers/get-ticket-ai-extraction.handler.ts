import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ExtractTicketResponseDto } from '../../ai/dto/extract-ticket-response.dto';
import { GetTicketAiExtractionQuery } from '../queries/get-ticket-ai-extraction.query';

@Injectable()
export class GetTicketAiExtractionHandler {
  constructor(private readonly prisma: PrismaService) {}

  async execute(
    query: GetTicketAiExtractionQuery,
  ): Promise<ExtractTicketResponseDto> {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: query.ticketId },
      include: {
        aiExtractions: {
          orderBy: {
            id: 'desc',
          },
          take: 1,
        },
      },
    });

    if (!ticket) {
      throw new NotFoundException(`Ticket with id ${query.ticketId} not found`);
    }

    if (ticket.state !== 'AI_PROCESSED') {
      throw new BadRequestException(
        `Ticket must be in AI_PROCESSED state. Current state: ${ticket.state}`,
      );
    }

    if (!ticket.aiExtractions || ticket.aiExtractions.length === 0) {
      throw new NotFoundException(
        `No AI extraction found for ticket ${query.ticketId}`,
      );
    }

    return ticket.aiExtractions[0].rawResponse as unknown as ExtractTicketResponseDto;
  }
}
