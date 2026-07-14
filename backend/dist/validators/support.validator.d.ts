import { z } from 'zod';
export declare const createAgentSchema: z.ZodObject<{
    userId: z.ZodString;
    employeeId: z.ZodString;
    departmentId: z.ZodOptional<z.ZodString>;
    team: z.ZodOptional<z.ZodString>;
    designation: z.ZodOptional<z.ZodString>;
    role: z.ZodOptional<z.ZodEnum<["SUPPORT_AGENT", "SENIOR_AGENT", "TEAM_LEAD", "SUPPORT_MANAGER", "COMPLIANCE_OFFICER", "SUPER_ADMIN"]>>;
    timeZone: z.ZodOptional<z.ZodString>;
    languages: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    skills: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    experience: z.ZodOptional<z.ZodString>;
    notes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    userId: string;
    employeeId: string;
    role?: "SUPER_ADMIN" | "SUPPORT_AGENT" | "SENIOR_AGENT" | "TEAM_LEAD" | "SUPPORT_MANAGER" | "COMPLIANCE_OFFICER" | undefined;
    notes?: string | undefined;
    team?: string | undefined;
    designation?: string | undefined;
    timeZone?: string | undefined;
    languages?: string[] | undefined;
    skills?: string[] | undefined;
    experience?: string | undefined;
    departmentId?: string | undefined;
}, {
    userId: string;
    employeeId: string;
    role?: "SUPER_ADMIN" | "SUPPORT_AGENT" | "SENIOR_AGENT" | "TEAM_LEAD" | "SUPPORT_MANAGER" | "COMPLIANCE_OFFICER" | undefined;
    notes?: string | undefined;
    team?: string | undefined;
    designation?: string | undefined;
    timeZone?: string | undefined;
    languages?: string[] | undefined;
    skills?: string[] | undefined;
    experience?: string | undefined;
    departmentId?: string | undefined;
}>;
export declare const updateAgentSchema: z.ZodObject<{
    userId: z.ZodOptional<z.ZodString>;
    employeeId: z.ZodOptional<z.ZodString>;
    departmentId: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    team: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    designation: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    role: z.ZodOptional<z.ZodOptional<z.ZodEnum<["SUPPORT_AGENT", "SENIOR_AGENT", "TEAM_LEAD", "SUPPORT_MANAGER", "COMPLIANCE_OFFICER", "SUPER_ADMIN"]>>>;
    timeZone: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    languages: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodString, "many">>>;
    skills: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodString, "many">>>;
    experience: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    notes: z.ZodOptional<z.ZodOptional<z.ZodString>>;
} & {
    status: z.ZodOptional<z.ZodEnum<["ONLINE", "OFFLINE", "BUSY", "AWAY", "ON_BREAK"]>>;
}, "strip", z.ZodTypeAny, {
    role?: "SUPER_ADMIN" | "SUPPORT_AGENT" | "SENIOR_AGENT" | "TEAM_LEAD" | "SUPPORT_MANAGER" | "COMPLIANCE_OFFICER" | undefined;
    status?: "ONLINE" | "OFFLINE" | "BUSY" | "AWAY" | "ON_BREAK" | undefined;
    notes?: string | undefined;
    userId?: string | undefined;
    employeeId?: string | undefined;
    team?: string | undefined;
    designation?: string | undefined;
    timeZone?: string | undefined;
    languages?: string[] | undefined;
    skills?: string[] | undefined;
    experience?: string | undefined;
    departmentId?: string | undefined;
}, {
    role?: "SUPER_ADMIN" | "SUPPORT_AGENT" | "SENIOR_AGENT" | "TEAM_LEAD" | "SUPPORT_MANAGER" | "COMPLIANCE_OFFICER" | undefined;
    status?: "ONLINE" | "OFFLINE" | "BUSY" | "AWAY" | "ON_BREAK" | undefined;
    notes?: string | undefined;
    userId?: string | undefined;
    employeeId?: string | undefined;
    team?: string | undefined;
    designation?: string | undefined;
    timeZone?: string | undefined;
    languages?: string[] | undefined;
    skills?: string[] | undefined;
    experience?: string | undefined;
    departmentId?: string | undefined;
}>;
export declare const createTicketSchema: z.ZodObject<{
    subject: z.ZodString;
    description: z.ZodString;
    categoryId: z.ZodOptional<z.ZodString>;
    priority: z.ZodOptional<z.ZodEnum<["LOW", "MEDIUM", "HIGH", "URGENT", "CRITICAL"]>>;
    departmentId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    description: string;
    subject: string;
    priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT" | "CRITICAL" | undefined;
    departmentId?: string | undefined;
    categoryId?: string | undefined;
}, {
    description: string;
    subject: string;
    priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT" | "CRITICAL" | undefined;
    departmentId?: string | undefined;
    categoryId?: string | undefined;
}>;
export declare const updateTicketSchema: z.ZodObject<{
    status: z.ZodOptional<z.ZodEnum<["OPEN", "PENDING", "WAITING_FOR_CUSTOMER", "ASSIGNED", "IN_PROGRESS", "RESOLVED", "CLOSED", "ESCALATED"]>>;
    priority: z.ZodOptional<z.ZodEnum<["LOW", "MEDIUM", "HIGH", "URGENT", "CRITICAL"]>>;
    departmentId: z.ZodOptional<z.ZodString>;
    categoryId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    status?: "PENDING" | "IN_PROGRESS" | "OPEN" | "WAITING_FOR_CUSTOMER" | "ASSIGNED" | "RESOLVED" | "CLOSED" | "ESCALATED" | undefined;
    priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT" | "CRITICAL" | undefined;
    departmentId?: string | undefined;
    categoryId?: string | undefined;
}, {
    status?: "PENDING" | "IN_PROGRESS" | "OPEN" | "WAITING_FOR_CUSTOMER" | "ASSIGNED" | "RESOLVED" | "CLOSED" | "ESCALATED" | undefined;
    priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT" | "CRITICAL" | undefined;
    departmentId?: string | undefined;
    categoryId?: string | undefined;
}>;
export declare const replyTicketSchema: z.ZodObject<{
    message: z.ZodString;
    isInternal: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
}, "strip", z.ZodTypeAny, {
    message: string;
    isInternal: boolean;
}, {
    message: string;
    isInternal?: boolean | undefined;
}>;
export declare const assignTicketSchema: z.ZodObject<{
    agentId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    agentId: string;
}, {
    agentId: string;
}>;
export declare const closeTicketSchema: z.ZodObject<{
    reason: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    reason?: string | undefined;
}, {
    reason?: string | undefined;
}>;
//# sourceMappingURL=support.validator.d.ts.map