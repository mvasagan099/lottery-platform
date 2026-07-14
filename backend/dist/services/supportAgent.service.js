"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupportAgentService = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
class SupportAgentService {
    static async createAgent(data) {
        return prisma.supportAgent.create({
            data: {
                userId: data.userId,
                employeeId: data.employeeId,
                departmentId: data.departmentId,
                team: data.team,
                designation: data.designation,
                role: data.role || 'SUPPORT_AGENT',
                timeZone: data.timeZone || 'UTC',
                languages: data.languages || [],
                skills: data.skills || [],
                experience: data.experience,
                notes: data.notes
            },
            include: {
                user: { select: { firstName: true, lastName: true, email: true } },
                department: true
            }
        });
    }
    static async updateAgent(id, data) {
        return prisma.supportAgent.update({
            where: { id },
            data,
            include: {
                user: { select: { firstName: true, lastName: true, email: true } },
                department: true
            }
        });
    }
    static async getAgentById(id) {
        return prisma.supportAgent.findUnique({
            where: { id },
            include: {
                user: { select: { firstName: true, lastName: true, email: true } },
                department: true,
                performance: true
            }
        });
    }
    static async listAgents(filters = {}) {
        const where = {};
        if (filters.status)
            where.status = filters.status;
        if (filters.departmentId)
            where.departmentId = filters.departmentId;
        if (filters.role)
            where.role = filters.role;
        return prisma.supportAgent.findMany({
            where,
            include: {
                user: { select: { firstName: true, lastName: true, email: true } },
                department: true
            }
        });
    }
    static async deleteAgent(id) {
        return prisma.supportAgent.delete({
            where: { id }
        });
    }
}
exports.SupportAgentService = SupportAgentService;
//# sourceMappingURL=supportAgent.service.js.map