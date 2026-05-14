import type { Types } from 'mongoose';

export type UserRole = 'super_admin' | 'admin' | 'editor';

export interface IUser {
  _id: Types.ObjectId | string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  avatar?: string;
  isActive: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}
