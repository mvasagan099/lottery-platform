import { User } from '../types';

export function hasPermission(user: User | null, module: string, action: string = 'View'): boolean {
  if (!user) return false;
  if (user.role === 'SUPER_ADMIN') return true;
  
  if (!user.roles || user.roles.length === 0) {
    // Fallback legacy checks
    if (user.role === 'ADMIN') return true;
    if (user.role === 'SUPPORT' && ['Users', 'KYC', 'Support'].includes(module)) return true;
    if (user.role === 'AFFILIATE_MANAGER' && module === 'Affiliates') return true;
    return false;
  }
  
  for (const userRole of user.roles) {
    const perms = userRole.role?.permissions || [];
    for (const p of perms) {
      if (p.permission?.module === module && p.permission?.action === action) {
        return true;
      }
    }
  }
  return false;
}
