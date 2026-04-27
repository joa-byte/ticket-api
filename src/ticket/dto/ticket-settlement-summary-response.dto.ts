export class TicketSettlementUserResponseDto {
  id!: number;
  name!: string;
  username!: string;
}

export class TicketSettlementPayerResponseDto extends TicketSettlementUserResponseDto {
  paidAmount!: number;
}

export class TicketSettlementDebtResponseDto {
  from!: TicketSettlementUserResponseDto;
  to!: TicketSettlementUserResponseDto;
  amount!: number;
}

export class TicketSettlementSummaryResponseDto {
  total!: number;
  payers!: TicketSettlementPayerResponseDto[];
  debts!: TicketSettlementDebtResponseDto[];
}
