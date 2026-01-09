import { z } from 'zod';

/**
 * Create Meal Input Schema - Validates meal creation form
 */
export const CreateMealInputSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(255),
  description: z.string().trim().optional(),
  ingredients: z
    .array(z.string().trim().min(1))
    .min(1, 'At least one ingredient is required'),
  image_url: z.string().url().optional().or(z.literal('')),
  rating: z.number().int().min(1).max(5).optional(),
  notes: z.string().trim().optional(),
});

/**
 * Meal Schema - Validates meal data from Tauri backend
 */
export const MealSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  title: z.string(),
  description: z.string().nullable(),
  ingredients: z.array(z.string()),
  image_url: z.string().nullable(),
  rating: z.number().int().min(1).max(5).nullable(),
  notes: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
  synced: z.boolean(),
});

/**
 * Update Meal Schema - Partial meal update
 */
export const UpdateMealInputSchema = CreateMealInputSchema.partial();

/**
 * Meals Array Schema - Validates array of meals
 */
export const MealsArraySchema = z.array(MealSchema);

// Inferred TypeScript types
export type CreateMealInput = z.infer<typeof CreateMealInputSchema>;
export type Meal = z.infer<typeof MealSchema>;
export type UpdateMealInput = z.infer<typeof UpdateMealInputSchema>;
