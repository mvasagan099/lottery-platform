export interface Permission {
  id: string;
  module: string;
  action: string;
  description?: string;
  createdAt: string;
}

export interface RolePermission {
  id: string;
  roleId: string;
  permissionId: string;
  permission: Permission;
}

export interface Role {
  id: string;
  name: string;
  description?: string;
  department?: string;
  priority: number;
  isSystem: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    users: number;
    permissions: number;
  };
  permissions?: RolePermission[];
}
