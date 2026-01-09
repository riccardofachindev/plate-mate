import { useAppSelector, useAppDispatch } from './redux';
import { fetchMeals, createMeal, updateMeal, deleteMeal, clearMealsError } from '../store';
import type { CreateMealInput, UpdateMealInput } from '../types';

/**
 * Custom hook for meals operations
 * Provides easy access to meals state and actions
 */
export function useMeals() {
  const dispatch = useAppDispatch();
  const { meals, isLoading, error, lastFetch } = useAppSelector((state) => state.meals);

  return {
    // State
    meals,
    isLoading,
    error,
    lastFetch,

    // Actions
    fetchMeals: () => dispatch(fetchMeals()),
    createMeal: (meal: CreateMealInput) => dispatch(createMeal(meal)),
    updateMeal: (id: string, data: UpdateMealInput) => dispatch(updateMeal({ id, data })),
    deleteMeal: (id: string) => dispatch(deleteMeal(id)),
    clearError: () => dispatch(clearMealsError()),
  };
}
