import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  PayloadTooLargeException,
} from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PrismaService } from '../../../prisma/prisma.service';
import { FILE_STORAGE } from '../ports/file-storage.port';
import type { FileStoragePort } from '../ports/file-storage.port';
import { PrismaFileRepository } from '../../infrastructure/prisma-file.repository';
import { UploadTicketImageCommand } from './upload-ticket-image.command';

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const STORAGE_PROVIDER = 'cloudflare-r2';

@Injectable()
@CommandHandler(UploadTicketImageCommand)
export class UploadTicketImageHandler implements ICommandHandler<UploadTicketImageCommand> {
  private readonly logger = new Logger(UploadTicketImageHandler.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly fileRepository: PrismaFileRepository,
    @Inject(FILE_STORAGE)
    private readonly storage: FileStoragePort,
  ) {}

  async execute(command: UploadTicketImageCommand) {
    this.validateImage(command.file);

    this.logger.log(
      `Starting ticket image upload ticketId=${command.ticketId} originalName=${command.file.originalname} mimetype=${command.file.mimetype} size=${command.file.size}`,
    );

    const ticket = await this.prisma.ticket.findUnique({
      where: { id: command.ticketId },
      select: { id: true },
    });

    if (!ticket) {
      throw new NotFoundException(
        `Ticket with id ${command.ticketId} not found`,
      );
    }

    this.logger.log(
      `Ticket found for image upload ticketId=${command.ticketId}`,
    );

    const uploadedFile = await this.storage.upload({
      buffer: command.file.buffer,
      contentType: command.file.mimetype,
      originalName: command.file.originalname,
      folder: `tickets/${command.ticketId}`,
    });

    this.logger.log(
      `Ticket image uploaded to storage ticketId=${command.ticketId} key=${uploadedFile.key}`,
    );

    try {
      const fileRecord = await this.fileRepository.create({
        key: uploadedFile.key,
        url: uploadedFile.url,
        mimeType: command.file.mimetype,
        size: command.file.size,
        provider: STORAGE_PROVIDER,
        ticketId: command.ticketId,
      });

      this.logger.log(
        `Ticket file record created ticketId=${command.ticketId} key=${uploadedFile.key}`,
      );

      return fileRecord;
    } catch (error) {
      this.logger.error(
        `Failed to create ticket file record, deleting uploaded object ticketId=${command.ticketId} key=${uploadedFile.key} error=${this.getErrorMessage(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      await this.deleteUploadedFile(uploadedFile.key);
      throw error;
    }
  }

  private validateImage(
    file?: Express.Multer.File,
  ): asserts file is Express.Multer.File {
    if (!file) {
      throw new BadRequestException('Image file is required');
    }

    if (!file.mimetype?.startsWith('image/')) {
      throw new BadRequestException('Only image files are allowed');
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      throw new PayloadTooLargeException('Image must be 5MB or smaller');
    }
  }

  private async deleteUploadedFile(key: string): Promise<void> {
    try {
      await this.storage.delete(key);
    } catch (error) {
      this.logger.error(
        `Failed to delete uploaded object after database error key=${key} error=${this.getErrorMessage(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      // The original database error is more useful for the request caller.
    }
  }

  private getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }

    return 'Unknown upload error';
  }
}
