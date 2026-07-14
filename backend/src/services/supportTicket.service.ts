import { PrismaClient } from '@prisma/client';
import { supportQueue } from '../jobs/supportQueue';

const prisma = new PrismaClient();

export class SupportTicketService {
  static async createTicket(data: any, userId?: string) {
    const ticket = await prisma.supportTicket.create({
      data: {
        userId,
        subject: data.subject,
        description: data.description,
        categoryId: data.categoryId,
        priority: data.priority || 'MEDIUM',
        departmentId: data.departmentId
      },
      include: {
        category: true,
        department: true,
        user: { select: { firstName: true, lastName: true, email: true } }
      }
    });

    if (ticket.departmentId) {
      await supportQueue.add({
        type: 'AUTO_ASSIGN',
        data: { ticketId: ticket.id, departmentId: ticket.departmentId }
      });
    }

    return ticket;
  }

  static async getTicketById(id: string) {
    return prisma.supportTicket.findUnique({
      where: { id },
      include: {
        user: { 
          select: { 
            id: true, 
            firstName: true, 
            lastName: true, 
            email: true,
            kycStatus: true,
            country: true,
            wallet: { select: { balance: true } },
            _count: { select: { transactions: true } }
          } 
        },
        category: true,
        department: true,
        assignedTo: {
          include: { user: { select: { firstName: true, lastName: true } } }
        },
        messages: {
          orderBy: { createdAt: 'asc' },
          include: { attachments: true }
        },
        attachments: true,
        tags: true
      }
    });
  }

  static async updateTicket(id: string, data: any) {
    return prisma.supportTicket.update({
      where: { id },
      data
    });
  }

  static async listTickets(filters: any = {}) {
    const where: any = {};
    if (filters.status) where.status = filters.status;
    if (filters.priority) where.priority = filters.priority;
    if (filters.departmentId) where.departmentId = filters.departmentId;
    if (filters.assignedToId) where.assignedToId = filters.assignedToId;
    if (filters.userId) where.userId = filters.userId;

    return prisma.supportTicket.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        category: true,
        department: true,
        user: { select: { firstName: true, lastName: true, email: true, username: true } },
        assignedTo: {
          include: { user: { select: { firstName: true, lastName: true } } }
        }
      }
    });
  }

  static async replyToTicket(ticketId: string, senderId: string, senderType: 'USER' | 'AGENT', message: string, isInternal = false) {
    const reply = await prisma.supportMessage.create({
      data: {
        ticketId,
        senderId,
        senderType,
        message,
        isInternal
      }
    });

    if (senderType === 'AGENT') {
      await prisma.supportTicket.update({
        where: { id: ticketId },
        data: { status: 'WAITING_FOR_CUSTOMER' }
      });
    } else {
      await prisma.supportTicket.update({
        where: { id: ticketId },
        data: { status: 'OPEN' }
      });
    }

    return reply;
  }

  static async assignTicket(ticketId: string, agentId: string, assignedBy?: string) {
    await prisma.ticketAssignment.create({
      data: {
        ticketId,
        agentId,
        assignedBy
      }
    });

    return prisma.supportTicket.update({
      where: { id: ticketId },
      data: { 
        assignedToId: agentId,
        status: 'ASSIGNED'
      }
    });
  }
}
