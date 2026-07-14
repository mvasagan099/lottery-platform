import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rbacService } from '../services/rbac.service';
import type { Role } from '../types/rbac';

export const useRoles = () => {
  return useQuery({
    queryKey: ['rbac', 'roles'],
    queryFn: () => rbacService.getRoles(),
  });
};

export const useRoleDetails = (id: string) => {
  return useQuery({
    queryKey: ['rbac', 'roles', id],
    queryFn: () => rbacService.getRoleDetails(id),
    enabled: !!id,
  });
};

export const usePermissions = () => {
  return useQuery({
    queryKey: ['rbac', 'permissions'],
    queryFn: () => rbacService.getPermissions(),
  });
};

export const useCreateRole = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Role>) => rbacService.createRole(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rbac', 'roles'] });
    },
  });
};

export const useUpdateRole = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Role> }) => rbacService.updateRole(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['rbac', 'roles'] });
      queryClient.invalidateQueries({ queryKey: ['rbac', 'roles', variables.id] });
    },
  });
};

export const useCloneRole = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => rbacService.cloneRole(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rbac', 'roles'] });
    },
  });
};

export const useUpdateRolePermissions = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, permissionIds }: { id: string; permissionIds: string[] }) =>
      rbacService.updateRolePermissions(id, permissionIds),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['rbac', 'roles', variables.id] });
    },
  });
};
