import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PrismaFileRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(params: {
    key: string;
    url: string;
    mimeType: string;
    size: number;
    provider: string;
    ticketId: number;
  }) {
    return this.prisma.file.create({
      data: params,
      select: {
        id: true,
        key: true,
        url: true,
        mimeType: true,
        size: true,
        provider: true,
      },
    });
  }
}
