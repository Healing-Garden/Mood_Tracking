import type { User } from './user';

export interface AdminUser extends User {
  role: 'admin' | 'superadmin';
  permissions: string[];
}

export interface SystemStats {
  totalUsers: number;
  totalCheckIns: number;
  averageSystemMood: number;
  activeUsers: number;
}