import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationService } from '../../common/services/notification.service';

@Injectable()
export class MessagesService {
  private readonly logger = new Logger(MessagesService.name);

  constructor(
    private prisma: PrismaService,
    private notificationService: NotificationService,
  ) {}

  async create(orgId: string, userId: string, data: { jobId: string; body: string }) {
    const message = await this.prisma.message.create({
      data: {
        organization: { connect: { id: orgId } },
        job: { connect: { id: data.jobId } },
        sender: { connect: { id: userId } },
        body: data.body,
        readBy: [userId],
      },
      include: {
        sender: { select: { id: true, name: true } },
      },
    });

    // Send push notifications to all other org members
    const members = await this.prisma.organizationMember.findMany({
      where: { organizationId: orgId, userId: { not: userId } },
      select: { userId: true },
    });

    const truncatedBody =
      data.body.length > 100 ? data.body.substring(0, 100) + '...' : data.body;

    const senderName = message.sender?.name || 'Someone';

    for (const member of members) {
      this.notificationService
        .sendPushNotification(
          member.userId,
          `${senderName}: New Message`,
          truncatedBody,
          { screen: 'messages', jobId: data.jobId },
          'new_message',
        )
        .catch((err) =>
          this.logger.error(`Failed to send push to ${member.userId}`, err),
        );
    }

    return message;
  }

  async findByJob(
    orgId: string,
    jobId: string,
    query: { before?: string; limit?: number },
  ) {
    const limit = query.limit ?? 50;

    const where: any = { organizationId: orgId, jobId };
    if (query.before) {
      where.createdAt = { lt: new Date(query.before) };
    }

    const messages = await this.prisma.message.findMany({
      where,
      include: {
        sender: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return messages;
  }

  async getThreads(orgId: string, userId: string) {
    // Get distinct jobs with messages in this org, along with last message
    const lastMessages: Array<{
      jobId: string;
      lastMessageId: string;
      lastMessageBody: string;
      senderId: string;
      createdAt: Date;
      readBy: any;
      jobName: string;
      senderName: string | null;
    }> = await this.prisma.$queryRaw`
      SELECT DISTINCT ON (m."jobId")
        m."jobId",
        m.id as "lastMessageId",
        m.body as "lastMessageBody",
        m."senderId",
        m."createdAt",
        m."readBy",
        j.name as "jobName",
        u.name as "senderName"
      FROM "Message" m
      JOIN "Job" j ON j.id = m."jobId"
      JOIN "User" u ON u.id = m."senderId"
      WHERE m."organizationId" = ${orgId}
      ORDER BY m."jobId", m."createdAt" DESC
    `;

    // Get unread counts per job
    const unreadCounts: Array<{ jobId: string; count: bigint }> =
      await this.prisma.$queryRaw`
        SELECT "jobId", COUNT(*)::bigint as count
        FROM "Message"
        WHERE "organizationId" = ${orgId}
          AND "senderId" != ${userId}
          AND NOT ("readBy"::jsonb @> ${JSON.stringify(userId)}::jsonb)
        GROUP BY "jobId"
      `;

    const unreadMap = new Map(
      unreadCounts.map((r) => [r.jobId, Number(r.count)]),
    );

    const threads = lastMessages.map((msg) => ({
      jobId: msg.jobId,
      jobName: msg.jobName,
      lastMessage: {
        id: msg.lastMessageId,
        organizationId: orgId,
        jobId: msg.jobId,
        senderId: msg.senderId,
        body: msg.lastMessageBody,
        readBy: msg.readBy,
        createdAt: msg.createdAt.toISOString(),
        updatedAt: msg.createdAt.toISOString(),
        sender: { id: msg.senderId, name: msg.senderName },
      },
      unreadCount: unreadMap.get(msg.jobId) ?? 0,
    }));

    // Sort by last message time descending
    threads.sort(
      (a, b) =>
        new Date(b.lastMessage.createdAt).getTime() -
        new Date(a.lastMessage.createdAt).getTime(),
    );

    return threads;
  }

  async markRead(orgId: string, jobId: string, userId: string) {
    await this.prisma.$executeRaw`
      UPDATE "Message"
      SET "readBy" = "readBy"::jsonb || ${JSON.stringify(userId)}::jsonb,
          "updatedAt" = NOW()
      WHERE "organizationId" = ${orgId}
        AND "jobId" = ${jobId}
        AND NOT ("readBy"::jsonb @> ${JSON.stringify(userId)}::jsonb)
    `;

    return { success: true };
  }

  async getUnreadCount(orgId: string, userId: string) {
    const result: Array<{ count: bigint }> = await this.prisma.$queryRaw`
      SELECT COUNT(*)::bigint as count
      FROM "Message"
      WHERE "organizationId" = ${orgId}
        AND "senderId" != ${userId}
        AND NOT ("readBy"::jsonb @> ${JSON.stringify(userId)}::jsonb)
    `;

    return { count: Number(result[0]?.count ?? 0) };
  }
}
