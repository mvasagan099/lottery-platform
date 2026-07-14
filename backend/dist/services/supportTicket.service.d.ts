export declare class SupportTicketService {
    static createTicket(data: any, userId?: string): Promise<{
        user: {
            email: string;
            firstName: string;
            lastName: string;
        } | null;
        department: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            description: string | null;
            isActive: boolean;
        } | null;
        category: {
            id: string;
            createdAt: Date;
            name: string;
            description: string | null;
            isActive: boolean;
        } | null;
    } & {
        id: string;
        status: import(".prisma/client").$Enums.SupportTicketStatus;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        userId: string | null;
        subject: string;
        priority: import(".prisma/client").$Enums.TicketPriority;
        ticketNumber: string;
        departmentId: string | null;
        categoryId: string | null;
        assignedToId: string | null;
        firstResponseTime: Date | null;
        resolvedAt: Date | null;
        closedAt: Date | null;
        slaDeadline: Date | null;
    }>;
    static getTicketById(id: string): Promise<({
        user: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
        } | null;
        attachments: {
            id: string;
            createdAt: Date;
            messageId: string | null;
            ticketId: string | null;
            fileName: string;
            fileUrl: string;
            fileType: import(".prisma/client").$Enums.AttachmentType;
            fileSize: number;
        }[];
        tags: {
            id: string;
            createdAt: Date;
            name: string;
        }[];
        department: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            description: string | null;
            isActive: boolean;
        } | null;
        category: {
            id: string;
            createdAt: Date;
            name: string;
            description: string | null;
            isActive: boolean;
        } | null;
        assignedTo: ({
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
            notes: string | null;
            userId: string;
            employeeId: string;
            team: string | null;
            designation: string | null;
            workingHours: import("@prisma/client/runtime/library").JsonValue | null;
            timeZone: string;
            languages: string[];
            skills: string[];
            experience: string | null;
            departmentId: string | null;
        }) | null;
        messages: ({
            attachments: {
                id: string;
                createdAt: Date;
                messageId: string | null;
                ticketId: string | null;
                fileName: string;
                fileUrl: string;
                fileType: import(".prisma/client").$Enums.AttachmentType;
                fileSize: number;
            }[];
        } & {
            id: string;
            createdAt: Date;
            message: string;
            ticketId: string;
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
        description: string | null;
        userId: string | null;
        subject: string;
        priority: import(".prisma/client").$Enums.TicketPriority;
        ticketNumber: string;
        departmentId: string | null;
        categoryId: string | null;
        assignedToId: string | null;
        firstResponseTime: Date | null;
        resolvedAt: Date | null;
        closedAt: Date | null;
        slaDeadline: Date | null;
    }) | null>;
    static updateTicket(id: string, data: any): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.SupportTicketStatus;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        userId: string | null;
        subject: string;
        priority: import(".prisma/client").$Enums.TicketPriority;
        ticketNumber: string;
        departmentId: string | null;
        categoryId: string | null;
        assignedToId: string | null;
        firstResponseTime: Date | null;
        resolvedAt: Date | null;
        closedAt: Date | null;
        slaDeadline: Date | null;
    }>;
    static listTickets(filters?: any): Promise<({
        user: {
            firstName: string;
            lastName: string;
        } | null;
        department: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            description: string | null;
            isActive: boolean;
        } | null;
        category: {
            id: string;
            createdAt: Date;
            name: string;
            description: string | null;
            isActive: boolean;
        } | null;
        assignedTo: ({
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
            notes: string | null;
            userId: string;
            employeeId: string;
            team: string | null;
            designation: string | null;
            workingHours: import("@prisma/client/runtime/library").JsonValue | null;
            timeZone: string;
            languages: string[];
            skills: string[];
            experience: string | null;
            departmentId: string | null;
        }) | null;
    } & {
        id: string;
        status: import(".prisma/client").$Enums.SupportTicketStatus;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        userId: string | null;
        subject: string;
        priority: import(".prisma/client").$Enums.TicketPriority;
        ticketNumber: string;
        departmentId: string | null;
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
        message: string;
        ticketId: string;
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
        description: string | null;
        userId: string | null;
        subject: string;
        priority: import(".prisma/client").$Enums.TicketPriority;
        ticketNumber: string;
        departmentId: string | null;
        categoryId: string | null;
        assignedToId: string | null;
        firstResponseTime: Date | null;
        resolvedAt: Date | null;
        closedAt: Date | null;
        slaDeadline: Date | null;
    }>;
}
//# sourceMappingURL=supportTicket.service.d.ts.map