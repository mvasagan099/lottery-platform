"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.closeTicketSchema = exports.assignTicketSchema = exports.replyTicketSchema = exports.updateTicketSchema = exports.createTicketSchema = exports.updateAgentSchema = exports.createAgentSchema = void 0;
const zod_1 = require("zod");
exports.createAgentSchema = zod_1.z.object({
    userId: zod_1.z.string().cuid(),
    employeeId: zod_1.z.string().min(3),
    departmentId: zod_1.z.string().cuid().optional(),
    team: zod_1.z.string().optional(),
    designation: zod_1.z.string().optional(),
    role: zod_1.z.enum(['SUPPORT_AGENT', 'SENIOR_AGENT', 'TEAM_LEAD', 'SUPPORT_MANAGER', 'COMPLIANCE_OFFICER', 'SUPER_ADMIN']).optional(),
    timeZone: zod_1.z.string().optional(),
    languages: zod_1.z.array(zod_1.z.string()).optional(),
    skills: zod_1.z.array(zod_1.z.string()).optional(),
    experience: zod_1.z.string().optional(),
    notes: zod_1.z.string().optional(),
});
exports.updateAgentSchema = exports.createAgentSchema.partial().extend({
    status: zod_1.z.enum(['ONLINE', 'OFFLINE', 'BUSY', 'AWAY', 'ON_BREAK']).optional()
});
exports.createTicketSchema = zod_1.z.object({
    subject: zod_1.z.string().min(5),
    description: zod_1.z.string().min(10),
    categoryId: zod_1.z.string().cuid().optional(),
    priority: zod_1.z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT', 'CRITICAL']).optional(),
    departmentId: zod_1.z.string().cuid().optional(),
});
exports.updateTicketSchema = zod_1.z.object({
    status: zod_1.z.enum(['OPEN', 'PENDING', 'WAITING_FOR_CUSTOMER', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'ESCALATED']).optional(),
    priority: zod_1.z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT', 'CRITICAL']).optional(),
    departmentId: zod_1.z.string().cuid().optional(),
    categoryId: zod_1.z.string().cuid().optional(),
});
exports.replyTicketSchema = zod_1.z.object({
    message: zod_1.z.string().min(1),
    isInternal: zod_1.z.boolean().optional().default(false),
});
exports.assignTicketSchema = zod_1.z.object({
    agentId: zod_1.z.string().cuid()
});
exports.closeTicketSchema = zod_1.z.object({
    reason: zod_1.z.string().optional()
});
//# sourceMappingURL=support.validator.js.map