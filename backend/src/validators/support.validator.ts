import { z } from 'zod';

export const createAgentSchema = z.object({
  userId: z.string().cuid(),
  employeeId: z.string().min(3),
  departmentId: z.string().cuid().optional(),
  team: z.string().optional(),
  designation: z.string().optional(),
  role: z.enum(['SUPPORT_AGENT', 'SENIOR_AGENT', 'TEAM_LEAD', 'SUPPORT_MANAGER', 'COMPLIANCE_OFFICER', 'SUPER_ADMIN']).optional(),
  timeZone: z.string().optional(),
  languages: z.array(z.string()).optional(),
  skills: z.array(z.string()).optional(),
  experience: z.string().optional(),
  notes: z.string().optional(),
});

export const updateAgentSchema = createAgentSchema.partial().extend({
  status: z.enum(['ONLINE', 'OFFLINE', 'BUSY', 'AWAY', 'ON_BREAK']).optional()
});

export const createTicketSchema = z.object({
  subject: z.string().min(5),
  description: z.string().min(10),
  categoryId: z.string().cuid().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT', 'CRITICAL']).optional(),
  departmentId: z.string().cuid().optional(),
});

export const updateTicketSchema = z.object({
  status: z.enum(['OPEN', 'PENDING', 'WAITING_FOR_CUSTOMER', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'ESCALATED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT', 'CRITICAL']).optional(),
  departmentId: z.string().cuid().optional(),
  categoryId: z.string().cuid().optional(),
});

export const replyTicketSchema = z.object({
  message: z.string().min(1),
  isInternal: z.boolean().optional().default(false),
});

export const assignTicketSchema = z.object({
  agentId: z.string().cuid()
});

export const closeTicketSchema = z.object({
  reason: z.string().optional()
});
