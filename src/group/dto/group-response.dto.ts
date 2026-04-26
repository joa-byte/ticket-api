export class GroupMemberResponseDto {
  id: number;
  email: string;
  username: string;
  name: string;
}

export class GroupTicketResponseDto {
  id: number;
  state: string;
}

export class GroupResponseDto {
  id: number;
  name: string;
  members: GroupMemberResponseDto[];
  tickets: GroupTicketResponseDto[];
}
