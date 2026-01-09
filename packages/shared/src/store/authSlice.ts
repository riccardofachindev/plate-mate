import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { invoke } from '@tauri-apps/api/core';
import { UserSchema } from '../schemas';
import type { User } from '../types';

/**
 * Auth State Interface
 */
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

/**
 * Initial State
 */
const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true, // Start as loading to check existing session
  error: null,
};

/**
 * Async Thunk: Check current auth status
 */
export const checkAuthStatus = createAsyncThunk('auth/checkStatus', async (_, { rejectWithValue }) => {
  try {
    const response = await invoke('get_current_user');

    // Validate with Zod
    const result = UserSchema.safeParse(response);

    if (result.success) {
      return result.data;
    } else {
      console.error('Invalid user data:', result.error);
      return rejectWithValue('Invalid user data from backend');
    }
  } catch (error) {
    // User not logged in
    return rejectWithValue('Not authenticated');
  }
});

/**
 * Async Thunk: Login
 */
export const login = createAsyncThunk(
  'auth/login',
  async ({ email, password }: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const response = await invoke('auth_login', { email, password });

      // Validate with Zod
      const user = UserSchema.parse(response);

      // Trigger initial sync (don't block on failure)
      try {
        await invoke('sync_from_server');
      } catch (syncError) {
        console.error('Initial sync failed:', syncError);
      }

      return user;
    } catch (error: any) {
      return rejectWithValue(error?.message || 'Login failed');
    }
  }
);

/**
 * Async Thunk: Register
 */
export const register = createAsyncThunk(
  'auth/register',
  async (
    { email, password, name }: { email: string; password: string; name: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await invoke('auth_register', { email, password, name });

      // Validate with Zod
      const user = UserSchema.parse(response);

      // Trigger initial sync (don't block on failure)
      try {
        await invoke('sync_from_server');
      } catch (syncError) {
        console.error('Initial sync failed:', syncError);
      }

      return user;
    } catch (error: any) {
      return rejectWithValue(error?.message || 'Registration failed');
    }
  }
);

/**
 * Async Thunk: Logout
 */
export const logout = createAsyncThunk('auth/logout', async (_, { rejectWithValue }) => {
  try {
    await invoke('auth_logout');
    return null;
  } catch (error: any) {
    return rejectWithValue(error?.message || 'Logout failed');
  }
});

/**
 * Auth Slice
 */
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Check Auth Status
    builder
      .addCase(checkAuthStatus.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(checkAuthStatus.fulfilled, (state, action: PayloadAction<User>) => {
        state.user = action.payload;
        state.isAuthenticated = true;
        state.isLoading = false;
        state.error = null;
      })
      .addCase(checkAuthStatus.rejected, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.isLoading = false;
        state.error = null; // Not logged in is not an error
      });

    // Login
    builder
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action: PayloadAction<User>) => {
        state.user = action.payload;
        state.isAuthenticated = true;
        state.isLoading = false;
        state.error = null;
      })
      .addCase(login.rejected, (state, action) => {
        state.user = null;
        state.isAuthenticated = false;
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Register
    builder
      .addCase(register.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action: PayloadAction<User>) => {
        state.user = action.payload;
        state.isAuthenticated = true;
        state.isLoading = false;
        state.error = null;
      })
      .addCase(register.rejected, (state, action) => {
        state.user = null;
        state.isAuthenticated = false;
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Logout
    builder
      .addCase(logout.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.isLoading = false;
        state.error = null;
      })
      .addCase(logout.rejected, (state, action) => {
        // Even if logout fails, clear local state
        state.user = null;
        state.isAuthenticated = false;
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError } = authSlice.actions;
export default authSlice.reducer;
