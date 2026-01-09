import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { invoke } from '@tauri-apps/api/core';
import { MealSchema, MealsArraySchema } from '../schemas';
import type { Meal, CreateMealInput, UpdateMealInput } from '../types';

/**
 * Meals State Interface
 */
interface MealsState {
  meals: Meal[];
  isLoading: boolean;
  error: string | null;
  lastFetch: number | null;
}

/**
 * Initial State
 */
const initialState: MealsState = {
  meals: [],
  isLoading: false,
  error: null,
  lastFetch: null,
};

/**
 * Async Thunk: Fetch all meals
 */
export const fetchMeals = createAsyncThunk('meals/fetchAll', async (_, { rejectWithValue }) => {
  try {
    const response = await invoke('get_meals');

    // Validate with Zod
    const meals = MealsArraySchema.parse(response);

    return meals;
  } catch (error: any) {
    return rejectWithValue(error?.message || 'Failed to fetch meals');
  }
});

/**
 * Async Thunk: Create meal
 */
export const createMeal = createAsyncThunk(
  'meals/create',
  async (mealData: CreateMealInput, { rejectWithValue }) => {
    try {
      const response = await invoke('create_meal', { meal: mealData });

      // Validate with Zod
      const meal = MealSchema.parse(response);

      return meal;
    } catch (error: any) {
      return rejectWithValue(error?.message || 'Failed to create meal');
    }
  }
);

/**
 * Async Thunk: Update meal
 */
export const updateMeal = createAsyncThunk(
  'meals/update',
  async ({ id, data }: { id: string; data: UpdateMealInput }, { rejectWithValue }) => {
    try {
      const response = await invoke('update_meal', { id, meal: data });

      // Validate with Zod
      const meal = MealSchema.parse(response);

      return meal;
    } catch (error: any) {
      return rejectWithValue(error?.message || 'Failed to update meal');
    }
  }
);

/**
 * Async Thunk: Delete meal
 */
export const deleteMeal = createAsyncThunk(
  'meals/delete',
  async (id: string, { rejectWithValue }) => {
    try {
      await invoke('delete_meal', { id });
      return id;
    } catch (error: any) {
      return rejectWithValue(error?.message || 'Failed to delete meal');
    }
  }
);

/**
 * Meals Slice
 */
const mealsSlice = createSlice({
  name: 'meals',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearMeals: (state) => {
      state.meals = [];
      state.lastFetch = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch Meals
    builder
      .addCase(fetchMeals.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchMeals.fulfilled, (state, action: PayloadAction<Meal[]>) => {
        state.meals = action.payload;
        state.isLoading = false;
        state.error = null;
        state.lastFetch = Date.now();
      })
      .addCase(fetchMeals.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Create Meal
    builder
      .addCase(createMeal.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createMeal.fulfilled, (state, action: PayloadAction<Meal>) => {
        state.meals.push(action.payload);
        state.isLoading = false;
        state.error = null;
      })
      .addCase(createMeal.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Update Meal
    builder
      .addCase(updateMeal.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateMeal.fulfilled, (state, action: PayloadAction<Meal>) => {
        const index = state.meals.findIndex((meal) => meal.id === action.payload.id);
        if (index !== -1) {
          state.meals[index] = action.payload;
        }
        state.isLoading = false;
        state.error = null;
      })
      .addCase(updateMeal.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Delete Meal
    builder
      .addCase(deleteMeal.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteMeal.fulfilled, (state, action: PayloadAction<string>) => {
        state.meals = state.meals.filter((meal) => meal.id !== action.payload);
        state.isLoading = false;
        state.error = null;
      })
      .addCase(deleteMeal.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, clearMeals } = mealsSlice.actions;
export default mealsSlice.reducer;
