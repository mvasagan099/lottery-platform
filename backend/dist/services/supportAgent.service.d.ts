export declare class SupportAgentService {
    static createAgent(data: any): Promise<{
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
        } | null;
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
    }>;
    static updateAgent(id: string, data: any): Promise<{
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
        } | null;
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
    }>;
    static getAgentById(id: string): Promise<({
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
        } | null;
        performance: {
            id: string;
            updatedAt: Date;
            agentId: string;
            openTickets: number;
            ticketsAssigned: number;
            ticketsSolved: number;
            pendingTickets: number;
            avgResponseTime: number;
            avgResolutionTime: number;
            csatScore: import("@prisma/client/runtime/library").Decimal;
            rating: import("@prisma/client/runtime/library").Decimal;
            escalatedTickets: number;
            firstResponseSlaMet: number;
        } | null;
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
    }) | null>;
    static listAgents(filters?: any): Promise<({
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
        } | null;
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
    })[]>;
    static deleteAgent(id: string): Promise<{
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
    }>;
}
//# sourceMappingURL=supportAgent.service.d.ts.map