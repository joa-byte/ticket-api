import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { GroupResponseDto } from './dto/group-response.dto';
import { GroupService } from './group.service';
import { GetGroupByIdQuery } from './queries/get-group-by-id.query';

@Controller('groups')
export class GroupController {
  constructor(private readonly groupService: GroupService) {}

  @Get(':id')
  getById(@Param('id', ParseIntPipe) id: number): Promise<GroupResponseDto> {
    return this.groupService.getById(new GetGroupByIdQuery(id));
  }
}
