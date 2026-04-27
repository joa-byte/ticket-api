import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TicketResponseDto } from './dto/ticket-response.dto';
import { GetTicketByIdQuery } from './queries/get-ticket-by-id.query';

@Injectable()
export class TicketService {
  constructor(private readonly prisma: PrismaService) {}

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
}
