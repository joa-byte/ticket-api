import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TicketSettlementSummaryResponseDto } from './dto/ticket-settlement-summary-response.dto';
import { GetTicketSettlementSummaryHandler } from './handlers/get-ticket-settlement-summary.handler';
import { TicketResponseDto } from './dto/ticket-response.dto';
import { GetTicketByIdQuery } from './queries/get-ticket-by-id.query';
import { GetTicketSettlementSummaryQuery } from './queries/get-ticket-settlement-summary.query';

@Injectable()
export class TicketService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly getTicketSettlementSummaryHandler: GetTicketSettlementSummaryHandler,
  ) {}

  async getById(query: GetTicketByIdQuery): Promise<TicketResponseDto> {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: query.id },
      include: {
        items: {
          include: {
            users: {
              include: {
                user: true,
              },
            },
          },
        },
        payments: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!ticket) {
      throw new NotFoundException(`Ticket with id ${query.id} not found`);
    }

    return {
      id: ticket.id,
      state: ticket.state,
      items:
        ticket.items.length > 0
          ? ticket.items.map((item) => ({
              id: item.id,
              price: item.price,
              users: item.users.map(({ user }) => ({
                id: user.id,
                email: user.email,
                username: user.username,
                name: user.name,
              })),
            }))
          : null,
      payers:
        ticket.payments.length > 0
          ? ticket.payments.map((payment) => ({
              id: payment.id,
              amount: payment.amount,
              user: {
                id: payment.user.id,
                email: payment.user.email,
                username: payment.user.username,
                name: payment.user.name,
              },
            }))
          : null,
    };
  }

  getSettlementSummary(
    query: GetTicketSettlementSummaryQuery,
  ): Promise<TicketSettlementSummaryResponseDto> {
    return this.getTicketSettlementSummaryHandler.execute(query);
  }
}
