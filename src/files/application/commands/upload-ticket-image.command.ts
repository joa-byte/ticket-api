export class UploadTicketImageCommand {
  constructor(
    public readonly ticketId: number,
    public readonly file: Express.Multer.File,
  ) {}
}
