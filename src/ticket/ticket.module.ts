import { Module } from '@nestjs/common';
import { SettlementCalculatorService } from './domain/settlement-calculator.service';
import { GetTicketSettlementSummaryHandler } from './handlers/get-ticket-settlement-summary.handler';
import { GetTicketAiExtractionHandler } from './handlers/get-ticket-ai-extraction.handler';
import { TicketController } from './ticket.controller';
import { TicketService } from './ticket.service';

@Module({
  controllers: [TicketController],
  providers: [
    TicketService,
    GetTicketSettlementSummaryHandler,
    GetTicketAiExtractionHandler,
    SettlementCalculatorService,
  ],
})
export class TicketModule {}
