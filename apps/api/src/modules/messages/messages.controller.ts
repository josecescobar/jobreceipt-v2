import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ClerkAuthGuard } from '../../common/guards/clerk-auth.guard';
import { OrgMemberGuard } from '../../common/guards/org-member.guard';
import { CurrentOrg } from '../../common/decorators/current-org.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { QueryMessageDto } from './dto/query-message.dto';

@ApiTags('Messages')
@Controller('messages')
@UseGuards(ClerkAuthGuard, OrgMemberGuard)
@ApiBearerAuth()
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post()
  @ApiOperation({ summary: 'Send a message in a job thread' })
  create(
    @CurrentOrg() orgId: string,
    @CurrentUser('id') userId: string,
    @Body() body: CreateMessageDto,
  ) {
    return this.messagesService.create(orgId, userId, body);
  }

  @Get()
  @ApiOperation({ summary: 'Get messages for a job thread' })
  findByJob(
    @CurrentOrg() orgId: string,
    @Query() query: QueryMessageDto,
  ) {
    return this.messagesService.findByJob(orgId, query.jobId, {
      before: query.before,
      limit: query.limit ?? 50,
    });
  }

  @Get('threads')
  @ApiOperation({ summary: 'Get all message threads with last message and unread counts' })
  getThreads(
    @CurrentOrg() orgId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.messagesService.getThreads(orgId, userId);
  }

  @Post('mark-read')
  @ApiOperation({ summary: 'Mark all messages in a job thread as read' })
  markRead(
    @CurrentOrg() orgId: string,
    @CurrentUser('id') userId: string,
    @Body() body: { jobId: string },
  ) {
    return this.messagesService.markRead(orgId, body.jobId, userId);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get total unread message count for the current user' })
  getUnreadCount(
    @CurrentOrg() orgId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.messagesService.getUnreadCount(orgId, userId);
  }
}
