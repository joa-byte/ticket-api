import { ExtractTicketResponseDto } from './extract-ticket-response.dto';

export class ExtractTicketResultDto extends ExtractTicketResponseDto {
  ticketId!: number;
}
