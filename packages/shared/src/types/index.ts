// Re-export types from schemas
export type { User, LoginInput, RegisterInput } from '../schemas/user';
export type { Meal, CreateMealInput, UpdateMealInput } from '../schemas/meal';

/**
 * Auth Context Type
 */
export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
}

import type { User } from '../schemas/user';
