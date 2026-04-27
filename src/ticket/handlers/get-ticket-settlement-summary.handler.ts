import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TicketSettlementSummaryResponseDto } from '../dto/ticket-settlement-summary-response.dto';
import {
  SettlementCalculatorInput,
  SettlementCalculatorService,
  SettlementSummary,
  SettlementUser,
} from '../domain/settlement-calculator.service';
import { GetTicketSettlementSummaryQuery } from '../queries/get-ticket-settlement-summary.query';

@Injectable()
export class GetTicketSettlementSummaryHandler {
  constructor(
    private readonly prisma: PrismaService,
    private readonly calculator: SettlementCalculatorService,
  ) {}

  async execute(
    query: GetTicketSettlementSummaryQuery,
  ): Promise<TicketSettlementSummaryResponseDto> {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: query.ticketId },
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
      throw new NotFoundException(`Ticket with id ${query.ticketId} not found`);
    }

    const summary = this.calculator.calculate(this.toCalculatorInput(ticket));

    return this.toResponseDto(summary);
  }

  private toCalculatorInput(
    ticket: TicketWithSettlementData,
  ): SettlementCalculatorInput {
    return {
      items: ticket.items.map((item) => ({
        price: item.price,
        users: item.users.map(({ user }) => this.toSettlementUser(user)),
      })),
      payments: ticket.payments.map((payment) => ({
        amount: payment.amount,
        user: this.toSettlementUser(payment.user),
      })),
    };
  }

  private toResponseDto(
    summary: SettlementSummary,
  ): TicketSettlementSummaryResponseDto {
    return {
      total: summary.total,
      payers: summary.payers.map((payer) => ({
        id: payer.user.id,
        name: payer.user.name,
        username: payer.user.username,
        paidAmount: payer.paidAmount,
      })),
      debts: summary.debts.map((debt) => ({
        from: this.toUserResponseDto(debt.from),
        to: this.toUserResponseDto(debt.to),
        amount: debt.amount,
      })),
    };
  }

  private toUserResponseDto(user: SettlementUser): SettlementUser {
    return {
      id: user.id,
      name: user.name,
      username: user.username,
    };
  }

  private toSettlementUser(user: PrismaUser): SettlementUser {
    return {
      id: user.id,
      name: user.name,
      username: user.username,
    };
  }
}

interface PrismaUser {
  id: number;
  name: string;
  username: string;
}

interface TicketWithSettlementData {
  items: {
    price: number;
    users: {
      user: PrismaUser;
    }[];
  }[];
  payments: {
    amount: number;
    user: PrismaUser;
  }[];
}
