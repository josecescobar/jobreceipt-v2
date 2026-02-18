export interface Message {
  id: string;
  organizationId: string;
  jobId: string;
  senderId: string;
  body: string;
  readBy: string[];
  createdAt: string;
  updatedAt: string;
  sender?: { id: string; name: string | null };
  job?: { id: string; name: string };
}

export interface JobThread {
  jobId: string;
  jobName: string;
  lastMessage: Message;
  unreadCount: number;
}
