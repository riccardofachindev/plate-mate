import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import mealsReducer from './mealsSlice';

/**
 * Redux Store Configuration
 */
export const store = configureStore({
  reducer: {
    auth: authReducer,
    meals: mealsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types for serializable check
        ignoredActions: ['auth/login/fulfilled', 'auth/register/fulfilled'],
      },
    }),
  devTools: process.env.NODE_ENV !== 'production',
});

// Infer types from store
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Export actions
export { login, register, logout, checkAuthStatus, clearError as clearAuthError } from './authSlice';
export {
  fetchMeals,
  createMeal,
  updateMeal,
  deleteMeal,
  clearError as clearMealsError,
  clearMeals,
} from './mealsSlice';
