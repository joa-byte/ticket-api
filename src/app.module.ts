import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { GroupModule } from './group/group.module';
import { PrismaModule } from './prisma/prisma.module';
import { TicketModule } from './ticket/ticket.module';

@Module({
  imports: [PrismaModule, GroupModule, TicketModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
