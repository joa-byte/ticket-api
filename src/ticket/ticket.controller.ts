import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { TicketSettlementSummaryResponseDto } from './dto/ticket-settlement-summary-response.dto';
import { TicketResponseDto } from './dto/ticket-response.dto';
import { TicketService } from './ticket.service';
import { GetTicketByIdQuery } from './queries/get-ticket-by-id.query';
import { GetTicketSettlementSummaryQuery } from './queries/get-ticket-settlement-summary.query';

@Controller('tickets')
export class TicketController {
  constructor(private readonly ticketService: TicketService) {}

  @Get(':id')
  getById(@Param('id', ParseIntPipe) id: number): Promise<TicketResponseDto> {
    return this.ticketService.getById(new GetTicketByIdQuery(id));
  }

  @Get([':id/debts', ':id/settlement-summary'])
  getSettlementSummary(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<TicketSettlementSummaryResponseDto> {
    return this.ticketService.getSettlementSummary(
      new GetTicketSettlementSummaryQuery(id),
    );
  }
}
