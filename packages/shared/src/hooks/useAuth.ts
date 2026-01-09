import { useAppSelector, useAppDispatch } from './redux';
import { login, register, logout, clearAuthError } from '../store';

/**
 * Custom hook for auth operations
 * Provides easy access to auth state and actions
 */
export function useAuth() {
  const dispatch = useAppDispatch();
  const { user, isAuthenticated, isLoading, error } = useAppSelector((state) => state.auth);

  return {
    // State
    user,
    isAuthenticated,
    isLoading,
    error,

    // Actions
    login: (email: string, password: string) => dispatch(login({ email, password })),
    register: (email: string, password: string, name: string) =>
      dispatch(register({ email, password, name })),
    logout: () => dispatch(logout()),
    clearError: () => dispatch(clearAuthError()),
  };
}
