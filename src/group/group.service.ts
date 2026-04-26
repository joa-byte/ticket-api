import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GroupResponseDto } from './dto/group-response.dto';
import { GetGroupByIdQuery } from './queries/get-group-by-id.query';

@Injectable()
export class GroupService {
  constructor(private readonly prisma: PrismaService) {}

  async getById(query: GetGroupByIdQuery): Promise<GroupResponseDto> {
    const group = await this.prisma.group.findUnique({
      where: { id: query.id },
      include: {
        users: {
          include: {
            user: true,
          },
        },
        tickets: true,
      },
    });

    if (!group) {
      throw new NotFoundException(`Group with id ${query.id} not found`);
    }

    return {
      id: group.id,
      name: group.name,
      members: group.users.map(({ user }) => ({
        id: user.id,
        email: user.email,
        username: user.username,
        name: user.name,
      })),
      tickets: group.tickets.map((ticket) => ({
        id: ticket.id,
        state: ticket.state,
      })),
    };
  }
}
