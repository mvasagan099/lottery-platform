import { api } from './api';
import type { Role, Permission } from '../types/rbac';

export const rbacService = {
  getRoles: async () => {
    const response = await api.get<{ success: boolean; data: Role[] }>('/rbac');
    return response.data.data;
  },

  getRoleDetails: async (id: string) => {
    const response = await api.get<{ success: boolean; data: Role }>(`/rbac/${id}`);
    return response.data.data;
  },

  createRole: async (payload: Partial<Role>) => {
    const response = await api.post<{ success: boolean; data: Role }>('/rbac', payload);
    return response.data.data;
  },

  updateRole: async (id: string, payload: Partial<Role>) => {
    const response = await api.patch<{ success: boolean; data: Role }>(`/rbac/${id}`, payload);
    return response.data.data;
  },

  cloneRole: async (id: string) => {
    const response = await api.post<{ success: boolean; data: Role }>(`/rbac/${id}/clone`);
    return response.data.data;
  },

  getPermissions: async () => {
    const response = await api.get<{ success: boolean; data: Permission[] }>('/rbac/permissions');
    return response.data.data;
  },

  updateRolePermissions: async (id: string, permissionIds: string[]) => {
    const response = await api.post<{ success: boolean }>(`/rbac/${id}/permissions`, { permissionIds });
    return response.data;
  },
};
