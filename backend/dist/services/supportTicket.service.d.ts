export declare class SupportTicketService {
    static createTicket(data: any, userId?: string): Promise<{
        user: {
            email: string;
            firstName: string;
            lastName: string;
        };
        department: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            description: string | null;
            isActive: boolean;
        };
        category: {
            id: string;
            createdAt: Date;
            name: string;
            description: string | null;
            isActive: boolean;
        };
    } & {
        id: string;
        status: import(".prisma/client").$Enums.SupportTicketStatus;
        createdAt: Date;
        updatedAt: Date;
        userId: string | null;
        departmentId: string | null;
        description: string | null;
        subject: string;
        priority: import(".prisma/client").$Enums.TicketPriority;
        ticketNumber: string;
        categoryId: string | null;
        assignedToId: string | null;
        firstResponseTime: Date | null;
        resolvedAt: Date | null;
        closedAt: Date | null;
        slaDeadline: Date | null;
    }>;
    static getTicketById(id: string): Promise<{
        user: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
            kycStatus: import(".prisma/client").$Enums.KYCStatus;
            country: string;
            wallet: {
                balance: import("@prisma/client/runtime/library").Decimal;
            };
            _count: {
                transactions: number;
            };
        };
        department: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            description: string | null;
            isActive: boolean;
        };
        attachments: {
            id: string;
            createdAt: Date;
            messageId: string | null;
            ticketId: string | null;
            fileSize: number;
            fileName: string;
            fileUrl: string;
            fileType: import(".prisma/client").$Enums.AttachmentType;
        }[];
        tags: {
            id: string;
            createdAt: Date;
            name: string;
        }[];
        category: {
            id: string;
            createdAt: Date;
            name: string;
            description: string | null;
            isActive: boolean;
        };
        assignedTo: {
            user: {
                firstName: string;
                lastName: string;
            };
        } & {
            id: string;
            role: import(".prisma/client").$Enums.SupportAgentRole;
            status: import(".prisma/client").$Enums.SupportAgentStatus;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            employeeId: string;
            departmentId: string | null;
            team: string | null;
            designation: string | null;
            workingHours: import("@prisma/client/runtime/library").JsonValue | null;
            timeZone: string;
            languages: string[];
            skills: string[];
            experience: string | null;
            notes: string | null;
        };
        messages: ({
            attachments: {
                id: string;
                createdAt: Date;
                messageId: string | null;
                ticketId: string | null;
                fileSize: number;
                fileName: string;
                fileUrl: string;
                fileType: import(".prisma/client").$Enums.AttachmentType;
            }[];
        } & {
            id: string;
            createdAt: Date;
            ticketId: string;
            message: string;
            readAt: Date | null;
            isInternal: boolean;
            senderId: string;
            senderType: string;
        })[];
    } & {
        id: string;
        status: import(".prisma/client").$Enums.SupportTicketStatus;
        createdAt: Date;
        updatedAt: Date;
        userId: string | null;
        departmentId: string | null;
        description: string | null;
        subject: string;
        priority: import(".prisma/client").$Enums.TicketPriority;
        ticketNumber: string;
        categoryId: string | null;
        assignedToId: string | null;
        firstResponseTime: Date | null;
        resolvedAt: Date | null;
        closedAt: Date | null;
        slaDeadline: Date | null;
    }>;
    static updateTicket(id: string, data: any): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.SupportTicketStatus;
        createdAt: Date;
        updatedAt: Date;
        userId: string | null;
        departmentId: string | null;
        description: string | null;
        subject: string;
        priority: import(".prisma/client").$Enums.TicketPriority;
        ticketNumber: string;
        categoryId: string | null;
        assignedToId: string | null;
        firstResponseTime: Date | null;
        resolvedAt: Date | null;
        closedAt: Date | null;
        slaDeadline: Date | null;
    }>;
    static listTickets(filters?: any): Promise<({
        user: {
            email: string;
            username: string;
            firstName: string;
            lastName: string;
        };
        department: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            description: string | null;
            isActive: boolean;
        };
        category: {
            id: string;
            createdAt: Date;
            name: string;
            description: string | null;
            isActive: boolean;
        };
        assignedTo: {
            user: {
                firstName: string;
                lastName: string;
            };
        } & {
            id: string;
            role: import(".prisma/client").$Enums.SupportAgentRole;
            status: import(".prisma/client").$Enums.SupportAgentStatus;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            employeeId: string;
            departmentId: string | null;
            team: string | null;
            designation: string | null;
            workingHours: import("@prisma/client/runtime/library").JsonValue | null;
            timeZone: string;
            languages: string[];
            skills: string[];
            experience: string | null;
            notes: string | null;
        };
    } & {
        id: string;
        status: import(".prisma/client").$Enums.SupportTicketStatus;
        createdAt: Date;
        updatedAt: Date;
        userId: string | null;
        departmentId: string | null;
        description: string | null;
        subject: string;
        priority: import(".prisma/client").$Enums.TicketPriority;
        ticketNumber: string;
        categoryId: string | null;
        assignedToId: string | null;
        firstResponseTime: Date | null;
        resolvedAt: Date | null;
        closedAt: Date | null;
        slaDeadline: Date | null;
    })[]>;
    static replyToTicket(ticketId: string, senderId: string, senderType: 'USER' | 'AGENT', message: string, isInternal?: boolean): Promise<{
        id: string;
        createdAt: Date;
        ticketId: string;
        message: string;
        readAt: Date | null;
        isInternal: boolean;
        senderId: string;
        senderType: string;
    }>;
    static assignTicket(ticketId: string, agentId: string, assignedBy?: string): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.SupportTicketStatus;
        createdAt: Date;
        updatedAt: Date;
        userId: string | null;
        departmentId: string | null;
        description: string | null;
        subject: string;
        priority: import(".prisma/client").$Enums.TicketPriority;
        ticketNumber: string;
        categoryId: string | null;
        assignedToId: string | null;
        firstResponseTime: Date | null;
        resolvedAt: Date | null;
        closedAt: Date | null;
        slaDeadline: Date | null;
    }>;
}
//# sourceMappingURL=supportTicket.service.d.ts.map