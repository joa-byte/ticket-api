export class ExtractTicketItemDto {
  name!: string;
  quantity!: number;
  unitPrice!: number;
  totalPrice!: number;
}

export class ExtractTicketResponseDto {
  storeName!: string;
  total!: number;
  items!: ExtractTicketItemDto[];
}
