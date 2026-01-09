# Zod Reference

**Source:** Context7 - colinhacks/zod
**Last Updated:** 2026-01-09

## Overview

Zod is a TypeScript-first schema validation library with zero dependencies. It provides:
- Runtime data validation
- Static type inference
- Tiny bundle size (2KB core)
- Immutable, chainable API
- Works in all JavaScript environments

---

## Requirements

- **TypeScript:** v5.5 or later
- **Strict Mode:** Must be enabled in tsconfig.json

```json
{
  "compilerOptions": {
    "strict": true
  }
}
```

---

## Basic Usage

### 1. Define Schema

```typescript
import * as z from "zod";

const UserSchema = z.object({
  name: z.string(),
  age: z.number().int().positive(),
  email: z.string().email(),
});
```

### 2. Validate Data

**Using `.parse()` (throws on error):**
```typescript
try {
  const user = UserSchema.parse({
    name: "John",
    age: 30,
    email: "john@example.com"
  });
  console.log(user); // { name: "John", age: 30, email: "john@example.com" }
} catch (error) {
  console.error(error); // ZodError with validation details
}
```

**Using `.safeParse()` (no throw):**
```typescript
const result = UserSchema.safeParse({
  name: "John",
  age: -5,
  email: "invalid-email"
});

if (result.success) {
  console.log(result.data); // Validated data
} else {
  console.error(result.error); // ZodError
}
```

### 3. Type Inference

```typescript
type User = z.infer<typeof UserSchema>;
// Equivalent to:
// type User = { name: string; age: number; email: string; }
```

---

## Schema Types

### Primitives

```typescript
z.string()      // string
z.number()      // number
z.boolean()     // boolean
z.null()        // null
z.undefined()   // undefined
z.any()         // any type (avoid if possible)
z.unknown()     // unknown type
z.never()       // never type
z.void()        // void
z.bigint()      // bigint
z.symbol()      // symbol
z.date()        // Date object
```

### Strings

```typescript
z.string()
  .min(5)                    // Minimum length
  .max(255)                  // Maximum length
  .email()                   // Email validation
  .url()                     // URL validation
  .uuid()                    // UUID validation
  .regex(/^[A-Z]+$/)         // Regex pattern
  .startsWith("https://")    // Must start with
  .endsWith(".com")          // Must end with
  .trim()                    // Trim whitespace
  .toLowerCase()             // Convert to lowercase
  .toUpperCase()             // Convert to uppercase
```

### Numbers

```typescript
z.number()
  .int()                     // Must be integer
  .positive()                // Must be > 0
  .negative()                // Must be < 0
  .nonnegative()             // Must be >= 0
  .min(0)                    // Minimum value
  .max(100)                  // Maximum value
  .multipleOf(5)             // Must be multiple of
  .finite()                  // No Infinity/-Infinity
  .safe()                    // Within safe integer range
```

### Objects

```typescript
const PersonSchema = z.object({
  name: z.string(),
  age: z.number(),
  email: z.string().email().optional(),
  address: z.object({
    street: z.string(),
    city: z.string(),
    zipCode: z.string().regex(/^\d{5}$/)
  }),
});

type Person = z.infer<typeof PersonSchema>;
```

### Arrays

```typescript
z.array(z.string())           // string[]
z.array(z.number()).min(1)    // At least 1 item
z.array(z.number()).max(10)   // At most 10 items
z.array(z.number()).length(5) // Exactly 5 items
z.array(z.string()).nonempty() // Must have at least 1 item
```

### Tuples

```typescript
const CoordinateSchema = z.tuple([
  z.number(),  // latitude
  z.number(),  // longitude
]);

type Coordinate = z.infer<typeof CoordinateSchema>; // [number, number]
```

### Unions

```typescript
const StringOrNumberSchema = z.union([z.string(), z.number()]);

// Shorthand:
const StringOrNumberSchema = z.string().or(z.number());

type StringOrNumber = z.infer<typeof StringOrNumberSchema>; // string | number
```

### Enums

```typescript
const RoleSchema = z.enum(["admin", "user", "guest"]);

type Role = z.infer<typeof RoleSchema>; // "admin" | "user" | "guest"

// Native TypeScript enum
enum UserRole {
  Admin = "admin",
  User = "user"
}
const RoleSchema = z.nativeEnum(UserRole);
```

---

## Advanced Patterns

### Optional and Nullable

```typescript
z.string().optional()      // string | undefined
z.string().nullable()      // string | null
z.string().nullish()       // string | null | undefined
```

### Default Values

```typescript
const SettingsSchema = z.object({
  theme: z.enum(["light", "dark"]).default("light"),
  fontSize: z.number().default(16),
});

const settings = SettingsSchema.parse({});
// { theme: "light", fontSize: 16 }
```

### Transformations

```typescript
const DateFromStringSchema = z.string().transform((str) => new Date(str));

const result = DateFromStringSchema.parse("2024-01-01");
// result is Date object
```

### Refinements (Custom Validation)

```typescript
const PasswordSchema = z.string()
  .min(8)
  .refine((pwd) => /[A-Z]/.test(pwd), {
    message: "Password must contain at least one uppercase letter"
  })
  .refine((pwd) => /[0-9]/.test(pwd), {
    message: "Password must contain at least one number"
  });
```

### Recursive Schemas

```typescript
type Category = {
  name: string;
  subcategories: Category[];
};

const CategorySchema: z.ZodType<Category> = z.lazy(() =>
  z.object({
    name: z.string(),
    subcategories: z.array(CategorySchema),
  })
);
```

---

## Integration with Tauri

### Validating Tauri Command Responses

```typescript
import { invoke } from '@tauri-apps/api/core';
import { z } from 'zod';

const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string(),
  created_at: z.string(),
});

async function getCurrentUser() {
  const response = await invoke('get_current_user');

  // Validate runtime data
  const user = UserSchema.parse(response);

  return user; // Fully typed and validated
}
```

### Safe Parsing for Error Handling

```typescript
async function login(email: string, password: string) {
  try {
    const response = await invoke('auth_login', { email, password });
    const result = UserSchema.safeParse(response);

    if (!result.success) {
      console.error('Invalid user data from backend:', result.error);
      throw new Error('Invalid response from server');
    }

    return result.data;
  } catch (error) {
    console.error('Login failed:', error);
    throw error;
  }
}
```

### Validating API Responses

```typescript
const MealSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  ingredients: z.array(z.string()).min(1),
  rating: z.number().int().min(1).max(5).optional(),
  created_at: z.string(),
  updated_at: z.string(),
  synced: z.boolean(),
});

const MealsArraySchema = z.array(MealSchema);

async function getMeals() {
  const response = await invoke('get_meals');
  return MealsArraySchema.parse(response);
}
```

---

## Best Practices

### 1. Define Schemas Once, Reuse Everywhere

```typescript
// packages/shared/src/schemas/user.ts
export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string(),
});

export type User = z.infer<typeof UserSchema>;

// Use in multiple places
import { UserSchema } from '@plate-mate/shared/schemas';
```

### 2. Use safeParse for User Input

```typescript
function handleFormSubmit(data: unknown) {
  const result = FormSchema.safeParse(data);

  if (!result.success) {
    // Show validation errors to user
    return { errors: result.error.format() };
  }

  // Proceed with valid data
  await saveData(result.data);
}
```

### 3. Transform Data During Validation

```typescript
const CreateMealSchema = z.object({
  title: z.string().trim().min(1),
  ingredients: z.string()
    .transform((str) => str.split('\n').map(i => i.trim()).filter(Boolean)),
  rating: z.string()
    .transform((str) => str ? parseInt(str) : undefined)
    .pipe(z.number().int().min(1).max(5).optional()),
});
```

### 4. Type-Safe Partial Updates

```typescript
const UpdateMealSchema = MealSchema.partial();

type UpdateMeal = z.infer<typeof UpdateMealSchema>;
// All fields optional: { title?: string; description?: string; ... }
```

### 5. Error Handling

```typescript
try {
  UserSchema.parse(data);
} catch (error) {
  if (error instanceof z.ZodError) {
    console.log(error.errors);
    // [{ path: ["email"], message: "Invalid email" }]
  }
}
```

---

## Common Patterns for PlateMate

### Meal Validation

```typescript
export const CreateMealInputSchema = z.object({
  title: z.string().trim().min(1).max(255),
  description: z.string().trim().optional(),
  ingredients: z.array(z.string().trim().min(1)).min(1),
  rating: z.number().int().min(1).max(5).optional(),
  notes: z.string().trim().optional(),
});

export const MealSchema = CreateMealInputSchema.extend({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  created_at: z.string(),
  updated_at: z.string(),
  synced: z.boolean(),
});

export type CreateMealInput = z.infer<typeof CreateMealInputSchema>;
export type Meal = z.infer<typeof MealSchema>;
```

### Auth Validation

```typescript
export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const RegisterSchema = LoginSchema.extend({
  name: z.string().min(2).max(100),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});
```

---

## Performance Tips

1. **Cache Schemas:** Don't recreate schemas on every validation
2. **Use .parse() Sparingly:** Prefer .safeParse() for user input
3. **Partial Parsing:** Use .pick() or .omit() for large objects
4. **Lazy Schemas:** Use z.lazy() for recursive types

---

## Our Implementation Plan

**Where to Add Zod:**
1. `packages/shared/src/schemas/` - All validation schemas
2. `packages/shared/src/types/` - TypeScript types (inferred from schemas)
3. Use in all Tauri command responses
4. Use in all API response validation
5. Use in all form validation

**Benefits:**
- Runtime safety for data from Rust backend
- Type-safe API responses
- Better error messages
- Catch bugs early
