export class TicketItemUserResponseDto {
  id: number;
  email: string;
  username: string;
  name: string;
}

export class TicketItemResponseDto {
  id: number;
  price: number;
  users: TicketItemUserResponseDto[];
}

export class TicketPayerResponseDto {
  id: number;
  amount: number;
  user: TicketItemUserResponseDto;
}

export class TicketResponseDto {
  id: number;
  state: string;
  items: TicketItemResponseDto[] | null;
  payers: TicketPayerResponseDto[] | null;
}
