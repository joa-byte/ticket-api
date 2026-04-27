import { Module } from '@nestjs/common';
import { SettlementCalculatorService } from './domain/settlement-calculator.service';
import { GetTicketSettlementSummaryHandler } from './handlers/get-ticket-settlement-summary.handler';
import { TicketController } from './ticket.controller';
import { TicketService } from './ticket.service';

@Module({
  controllers: [TicketController],
  providers: [
    TicketService,
    GetTicketSettlementSummaryHandler,
    SettlementCalculatorService,
  ],
})
export class TicketModule {}
