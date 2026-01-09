# PlateMate Microfrontend Architecture with Module Federation

## Executive Summary

Transform PlateMate from a minimal Tauri + React app into a **desktop application with true runtime Module Federation**. This plan implements industry-standard microfrontend architecture where each feature (Welcome, Auth, Meals) runs as an independent application that can be deployed and loaded dynamically at runtime.

**Key Change from Previous Plan:** Using **Webpack Module Federation** (runtime loading) instead of Vite with lazy imports (build-time composition). This gives you true independent deployment and the full benefits of microfrontends.

---

## What Are Microfrontends? (Beginner Explanation)

### The Restaurant Analogy

**Traditional Monolith:**
Imagine a single restaurant with one kitchen. Everything is prepared in one place:
- If the dessert chef makes a mistake, the whole kitchen might be affected
- To change the menu, you need to coordinate with everyone
- Everyone has to work on the same schedule
- The restaurant grows harder to manage as it gets bigger

**Microfrontends (Module Federation):**
Now imagine a food court with separate restaurants (Pizza Place, Sushi Bar, Burger Joint):
- **Each restaurant is independent:**
  - Has its own kitchen (codebase)
  - Has its own team (developers)
  - Opens and closes independently (deployed separately)
  - Can update their menu without affecting others (independent releases)

- **But they share some resources:**
  - Same seating area (shared UI shell)
  - Same payment system (shared authentication)
  - Same plates and utensils (shared React library)

- **Customers can visit any restaurant:**
  - Walk to Pizza Place → loads only pizza-related code
  - Walk to Sushi Bar → loads only sushi-related code
  - Share a table → both restaurants serve you simultaneously

**In PlateMate:**
- **Host App** = The food court building (shell with navigation)
- **Welcome Remote** = Entrance/info desk (onboarding)
- **Auth Remote** = Security/membership desk (login, registration)
- **Meals Remote** = Main restaurant (meal tracking features)

### Module Federation Magic

**Traditional Web Apps:**
```
User visits app → Downloads EVERYTHING → Uses 10% of features
```

**Module Federation:**
```
User visits app → Downloads shell + shared libraries
User clicks "Login" → Downloads auth module ONLY (runtime)
User clicks "Meals" → Downloads meals module ONLY (runtime)
```

**The Key Difference:**
- **Vite/Webpack Code Splitting:** All code bundles together at build time, splits into chunks
- **Module Federation:** Each microfrontend is a separate app that loads others at runtime

---

## Architecture Overview

### High-Level Structure

```
plate-mate/
├── apps/
│   ├── host/              # Host application (shell)
│   │   ├── src/
│   │   ├── webpack.config.js
│   │   └── package.json
│   │
│   ├── welcome/           # Welcome remote
│   │   ├── src/
│   │   ├── webpack.config.js
│   │   └── package.json
│   │
│   ├── auth/              # Auth remote
│   │   ├── src/
│   │   ├── webpack.config.js
│   │   └── package.json
│   │
│   └── meals/             # Meals remote
│       ├── src/
│       ├── webpack.config.js
│       └── package.json
│
├── packages/
│   └── shared/            # Shared library
│       ├── src/
│       └── package.json
│
├── src-tauri/             # Rust backend (unchanged concept)
│
├── backend-api/           # Sync API server
│
├── package.json           # Root with workspaces
└── pnpm-workspace.yaml    # Workspace configuration
```

### Module Federation Flow

```
┌─────────────────────────────────────────────────────┐
│  Host App (Port 3000)                               │
│  - Navigation shell                                 │
│  - AuthProvider wrapper                             │
│  - Module Federation configuration                  │
│                                                      │
│  ModuleFederationPlugin({                           │
│    name: 'host',                                    │
│    remotes: {                                       │
│      welcome: 'welcome@http://localhost:3001/...'  │
│      auth: 'auth@http://localhost:3002/...'        │
│      meals: 'meals@http://localhost:3003/...'      │
│    },                                               │
│    shared: ['react', 'react-dom', ...]             │
│  })                                                 │
└──────────────┬──────────────────────────────────────┘
               │
               ├─── Runtime Import ──► http://localhost:3001 (Welcome Remote)
               ├─── Runtime Import ──► http://localhost:3002 (Auth Remote)
               └─── Runtime Import ──► http://localhost:3003 (Meals Remote)
```

**What Happens at Runtime:**

1. **User opens app:**
   - Tauri window opens
   - Loads `http://localhost:3000` (host app)
   - Host app loads: React, React-DOM, navigation shell
   - Remote URLs are configured but NOT loaded yet

2. **User clicks "Get Started":**
   - Router navigates to `/auth/register`
   - Host app sees auth remote is needed
   - **Fetches** `http://localhost:3002/remoteEntry.js` at runtime
   - Auth remote loads and renders in host

3. **User logs in and goes to meals:**
   - Router navigates to `/meals`
   - Host app sees meals remote is needed
   - **Fetches** `http://localhost:3003/remoteEntry.js` at runtime
   - Meals remote loads and renders

**Key Point:** Each remote is a fully functional React app that can run standalone OR be consumed by the host.

---

## Development vs Production

### Development Mode

**Run 4 Servers Simultaneously:**
```bash
# Terminal 1: Host app
cd apps/host && npm run dev        # Port 3000

# Terminal 2: Welcome remote
cd apps/welcome && npm run dev     # Port 3001

# Terminal 3: Auth remote
cd apps/auth && npm run dev        # Port 3002

# Terminal 4: Meals remote
cd apps/meals && npm run dev       # Port 3003

# Terminal 5: Backend API
cd backend-api && npm run dev      # Port 4000
```

**Benefits:**
- Hot Module Replacement (HMR) works independently for each app
- Change code in auth remote → only auth rebuilds
- Full developer experience with fast feedback

### Production Mode

**Option 1: Bundle Everything (Desktop-Only)**
```bash
npm run build:all
# Builds all remotes and host
# Outputs to dist/ folder
# Tauri bundles dist/ into desktop app
```

Result: All microfrontends are bundled with the Tauri app. Module Federation still works, but loads from file:// protocol instead of HTTP.

**Option 2: True Independent Deployment (Future)**
- Deploy each remote to separate servers
- Host app loads from CDN
- Each team can deploy their remote independently

---

## Detailed Architecture

### File Structure

```
plate-mate/
├── apps/
│   ├── host/                      # Host application
│   │   ├── src/
│   │   │   ├── App.tsx            # Root component with providers
│   │   │   ├── Router.tsx         # Routing configuration
│   │   │   ├── components/
│   │   │   │   ├── Layout.tsx     # Shell with navigation
│   │   │   │   ├── Nav.tsx        # Navigation menu
│   │   │   │   └── ProtectedRoute.tsx
│   │   │   ├── bootstrap.tsx      # Async bootstrap for MF
│   │   │   ├── index.ts           # Entry point
│   │   │   └── main.tsx           # React render
│   │   ├── public/
│   │   │   └── index.html
│   │   ├── webpack.config.js      # Module Federation config
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── welcome/                    # Welcome remote
│   │   ├── src/
│   │   │   ├── App.tsx            # Welcome app root
│   │   │   ├── pages/
│   │   │   │   └── HomePage.tsx
│   │   │   ├── bootstrap.tsx
│   │   │   ├── index.ts
│   │   │   └── main.tsx
│   │   ├── webpack.config.js       # Exposes './App'
│   │   └── package.json
│   │
│   ├── auth/                       # Auth remote
│   │   ├── src/
│   │   │   ├── App.tsx             # Auth app root
│   │   │   ├── pages/
│   │   │   │   ├── LoginPage.tsx
│   │   │   │   └── RegisterPage.tsx
│   │   │   ├── bootstrap.tsx
│   │   │   ├── index.ts
│   │   │   └── main.tsx
│   │   ├── webpack.config.js        # Exposes './App'
│   │   └── package.json
│   │
│   └── meals/                       # Meals remote
│       ├── src/
│       │   ├── App.tsx              # Meals app root
│       │   ├── pages/
│       │   │   ├── MealsListPage.tsx
│       │   │   └── CreateMealPage.tsx
│       │   ├── bootstrap.tsx
│       │   ├── index.ts
│       │   └── main.tsx
│       ├── webpack.config.js         # Exposes './App'
│       └── package.json
│
├── packages/
│   └── shared/                       # Shared library
│       ├── src/
│       │   ├── components/           # Button, Input, etc.
│       │   ├── contexts/             # AuthContext
│       │   ├── hooks/                # Custom hooks
│       │   ├── types/                # TypeScript types
│       │   └── index.ts
│       ├── package.json
│       └── tsconfig.json
│
├── src-tauri/                        # Tauri Rust backend
│   ├── src/
│   │   ├── commands/
│   │   │   ├── auth.rs
│   │   │   ├── meals.rs
│   │   │   └── sync.rs
│   │   ├── db/
│   │   │   └── schema.rs
│   │   ├── lib.rs
│   │   └── main.rs
│   ├── Cargo.toml
│   └── tauri.conf.json               # Points to http://localhost:3000
│
├── backend-api/                      # Backend sync API
│   ├── src/
│   │   ├── routes/
│   │   │   ├── auth.ts
│   │   │   ├── meals.ts
│   │   │   └── sync.ts
│   │   └── server.ts
│   └── package.json
│
├── package.json                      # Root workspace config
├── pnpm-workspace.yaml               # pnpm workspaces
└── tsconfig.base.json                # Shared TS config
```

### Module Federation Configuration

#### Host App Configuration

```javascript
// apps/host/webpack.config.js
const ModuleFederationPlugin = require('webpack/lib/container/ModuleFederationPlugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { dependencies } = require('./package.json');

module.exports = {
  entry: './src/index.ts',
  mode: 'development',
  devServer: {
    port: 3000,
    historyApiFallback: true,
    headers: {
      "Access-Control-Allow-Origin": "*",
    },
  },
  output: {
    publicPath: 'http://localhost:3000/',
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader', 'postcss-loader'],
      },
    ],
  },
  plugins: [
    new ModuleFederationPlugin({
      name: 'host',
      remotes: {
        welcome: 'welcome@http://localhost:3001/remoteEntry.js',
        auth: 'auth@http://localhost:3002/remoteEntry.js',
        meals: 'meals@http://localhost:3003/remoteEntry.js',
      },
      shared: {
        react: {
          singleton: true,
          requiredVersion: dependencies.react,
          eager: true,
        },
        'react-dom': {
          singleton: true,
          requiredVersion: dependencies['react-dom'],
          eager: true,
        },
        'react-router-dom': {
          singleton: true,
          requiredVersion: dependencies['react-router-dom'],
        },
        '@tauri-apps/api': {
          singleton: true,
          requiredVersion: dependencies['@tauri-apps/api'],
        },
        '@plate-mate/shared': {
          singleton: true,
          eager: true,
        },
      },
    }),
    new HtmlWebpackPlugin({
      template: './public/index.html',
    }),
  ],
};
```

#### Remote App Configuration (Example: Auth)

```javascript
// apps/auth/webpack.config.js
const ModuleFederationPlugin = require('webpack/lib/container/ModuleFederationPlugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { dependencies } = require('./package.json');

module.exports = {
  entry: './src/index.ts',
  mode: 'development',
  devServer: {
    port: 3002,
    historyApiFallback: true,
    headers: {
      "Access-Control-Allow-Origin": "*",
    },
  },
  output: {
    publicPath: 'http://localhost:3002/',
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader', 'postcss-loader'],
      },
    ],
  },
  plugins: [
    new ModuleFederationPlugin({
      name: 'auth',
      filename: 'remoteEntry.js',
      exposes: {
        './App': './src/App',
      },
      shared: {
        react: {
          singleton: true,
          requiredVersion: dependencies.react,
        },
        'react-dom': {
          singleton: true,
          requiredVersion: dependencies['react-dom'],
        },
        'react-router-dom': {
          singleton: true,
        },
        '@tauri-apps/api': {
          singleton: true,
        },
        '@plate-mate/shared': {
          singleton: true,
        },
      },
    }),
    new HtmlWebpackPlugin({
      template: './public/index.html',
    }),
  ],
};
```

**Key Concepts:**

1. **`name`**: Unique identifier for this app
2. **`remotes`**: (Host only) URLs to load remote apps from
3. **`exposes`**: (Remotes only) What components/modules to expose
4. **`shared`**: Libraries shared across all apps (must be singletons)
5. **`singleton: true`**: Ensures only ONE instance of React/React-DOM
6. **`eager: true`**: Load immediately instead of lazy (for critical deps)

### Bootstrap Pattern (Required for Module Federation)

Module Federation requires async loading, so we use a bootstrap pattern:

```typescript
// apps/host/src/index.ts
import('./bootstrap');

// apps/host/src/bootstrap.tsx
import('./main');

// apps/host/src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

**Why?**
- `index.ts` → Triggers async import
- `bootstrap.tsx` → Waits for shared dependencies
- `main.tsx` → Renders React app

This ensures all shared dependencies (React, React-DOM) are loaded before the app renders.

### Host App Router

```typescript
// apps/host/src/Router.tsx
import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoadingSpinner } from '@plate-mate/shared';

// Dynamically import remote apps via Module Federation
const WelcomeApp = lazy(() => import('welcome/App'));
const AuthApp = lazy(() => import('auth/App'));
const MealsApp = lazy(() => import('meals/App'));

export function Router() {
  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          {/* Welcome remote */}
          <Route path="/" element={<WelcomeApp />} />

          {/* Auth remote */}
          <Route path="/auth/*" element={<Layout><AuthApp /></Layout>} />

          {/* Meals remote - protected */}
          <Route
            path="/meals/*"
            element={
              <Layout>
                <ProtectedRoute>
                  <MealsApp />
                </ProtectedRoute>
              </Layout>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
```

**Important TypeScript Configuration:**

```typescript
// apps/host/src/types/remotes.d.ts
declare module 'welcome/App' {
  const App: React.ComponentType;
  export default App;
}

declare module 'auth/App' {
  const App: React.ComponentType;
  export default App;
}

declare module 'meals/App' {
  const App: React.ComponentType;
  export default App;
}
```

This tells TypeScript that these modules exist (they're provided by Module Federation at runtime).

---

## Tauri Integration

### Tauri Configuration for Module Federation

```json
// src-tauri/tauri.conf.json
{
  "productName": "PlateMate",
  "version": "0.1.0",
  "identifier": "com.riccardofachin.plate-mate",
  "build": {
    "beforeDevCommand": "npm run dev:all",
    "devUrl": "http://localhost:3000",
    "beforeBuildCommand": "npm run build:all",
    "frontendDist": "../apps/host/dist"
  },
  "app": {
    "windows": [{
      "title": "PlateMate",
      "width": 1200,
      "height": 800
    }],
    "security": {
      "csp": {
        "default-src": "'self'",
        "script-src": [
          "'self'",
          "'unsafe-inline'",
          "http://localhost:3000",
          "http://localhost:3001",
          "http://localhost:3002",
          "http://localhost:3003"
        ],
        "connect-src": [
          "'self'",
          "http://localhost:3000",
          "http://localhost:3001",
          "http://localhost:3002",
          "http://localhost:3003",
          "http://localhost:4000"
        ]
      }
    }
  }
}
```

**Critical Security Note:**
- **Development:** CSP allows connections to all localhost ports (3000-3003 for remotes, 4000 for API)
- **Production:** CSP should only allow `'self'` and specific domains

### Development Script

```json
// Root package.json
{
  "scripts": {
    "dev:host": "cd apps/host && npm run dev",
    "dev:welcome": "cd apps/welcome && npm run dev",
    "dev:auth": "cd apps/auth && npm run dev",
    "dev:meals": "cd apps/meals && npm run dev",
    "dev:backend": "cd backend-api && npm run dev",
    "dev:all": "concurrently -n host,welcome,auth,meals,api \"npm run dev:host\" \"npm run dev:welcome\" \"npm run dev:auth\" \"npm run dev:meals\" \"npm run dev:backend\"",
    "dev:tauri": "npm run dev:all && cd src-tauri && cargo tauri dev"
  }
}
```

---

## Implementation Plan

### Phase 1: Setup Workspace & Module Federation Foundation

**Goal:** Set up monorepo with Webpack Module Federation configuration.

**Steps:**

1. **Initialize Monorepo:**
   ```bash
   # Root package.json
   npm init -y

   # Install pnpm (better for workspaces)
   npm install -g pnpm

   # Create workspace config
   ```

   ```yaml
   # pnpm-workspace.yaml
   packages:
     - 'apps/*'
     - 'packages/*'
     - 'backend-api'
   ```

2. **Create Host App:**
   ```bash
   mkdir -p apps/host/src/components
   cd apps/host
   npm init -y
   ```

   **Install Dependencies:**
   ```bash
   pnpm add react react-dom react-router-dom @tauri-apps/api @plate-mate/shared
   pnpm add -D webpack webpack-cli webpack-dev-server ts-loader typescript
   pnpm add -D html-webpack-plugin style-loader css-loader postcss-loader
   pnpm add -D @types/react @types/react-dom tailwindcss
   ```

3. **Create Webpack Config for Host:**
   Create `apps/host/webpack.config.js` with the configuration shown above.

4. **Create TypeScript Config:**
   ```json
   // apps/host/tsconfig.json
   {
     "extends": "../../tsconfig.base.json",
     "compilerOptions": {
       "outDir": "./dist"
     },
     "include": ["src"]
   }
   ```

5. **Create Bootstrap Pattern:**
   - `apps/host/src/index.ts` → `import('./bootstrap')`
   - `apps/host/src/bootstrap.tsx` → `import('./main')`
   - `apps/host/src/main.tsx` → React render logic

6. **Repeat for Remote Apps:**
   Create `apps/welcome`, `apps/auth`, `apps/meals` with similar structure.

**Files Created:**
- `pnpm-workspace.yaml`
- `apps/host/webpack.config.js`
- `apps/host/package.json`
- `apps/host/tsconfig.json`
- `apps/host/src/index.ts`
- `apps/host/src/bootstrap.tsx`
- `apps/host/src/main.tsx`
- (Repeat for remotes)

---

### Phase 2: Shared Package

**Goal:** Create shared library with components, contexts, and types.

**Implementation:**

```typescript
// packages/shared/src/contexts/AuthContext.tsx
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { invoke } from '@tauri-apps/api/core';

interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const currentUser = await invoke<User | null>('get_current_user');
      setUser(currentUser);
    } catch (error) {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }

  async function login(email: string, password: string) {
    const user = await invoke<User>('auth_login', { email, password });
    setUser(user);
    await invoke('sync_from_server');
  }

  async function logout() {
    await invoke('auth_logout');
    setUser(null);
  }

  async function register(email: string, password: string, name: string) {
    const user = await invoke<User>('auth_register', { email, password, name });
    setUser(user);
    await invoke('sync_from_server');
  }

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
```

**Files Created:**
- `packages/shared/src/contexts/AuthContext.tsx`
- `packages/shared/src/components/Button.tsx`
- `packages/shared/src/components/Input.tsx`
- `packages/shared/src/types/index.ts`
- `packages/shared/src/index.ts`

---

### Phase 3: Host Application

**Goal:** Create host shell with navigation and AuthProvider.

```typescript
// apps/host/src/App.tsx
import { AuthProvider } from '@plate-mate/shared';
import { Router } from './Router';

function App() {
  return (
    <AuthProvider>
      <Router />
    </AuthProvider>
  );
}

export default App;
```

```typescript
// apps/host/src/components/Layout.tsx
import { useAuth } from '@plate-mate/shared';
import { Nav } from './Nav';

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Nav />
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}
```

```typescript
// apps/host/src/components/Nav.tsx
import { useAuth } from '@plate-mate/shared';
import { useNavigate } from 'react-router-dom';

export function Nav() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <nav className="bg-white shadow">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold">PlateMate</h1>

        <div className="space-x-4">
          {isAuthenticated ? (
            <>
              <button onClick={() => navigate('/meals')}>
                Meals
              </button>
              <span>Hello, {user?.name}</span>
              <button onClick={logout}>Logout</button>
            </>
          ) : (
            <button onClick={() => navigate('/auth/login')}>
              Login
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
```

**Files Created:**
- `apps/host/src/App.tsx`
- `apps/host/src/Router.tsx`
- `apps/host/src/components/Layout.tsx`
- `apps/host/src/components/Nav.tsx`
- `apps/host/src/components/ProtectedRoute.tsx`
- `apps/host/src/types/remotes.d.ts`

---

### Phase 4: Remote Applications

**Goal:** Create standalone remote apps that expose components.

#### Welcome Remote

```typescript
// apps/welcome/src/App.tsx
import { useNavigate } from 'react-router-dom';

function App() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 text-white">
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-5xl font-bold mb-4">Welcome to PlateMate</h1>
        <p className="text-xl mb-8">Your personal meal tracking companion</p>

        <div className="space-x-4">
          <button
            onClick={() => navigate('/auth/login')}
            className="bg-white text-blue-600 px-6 py-3 rounded"
          >
            Sign In
          </button>
          <button
            onClick={() => navigate('/auth/register')}
            className="bg-transparent border-2 border-white px-6 py-3 rounded"
          >
            Get Started
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
```

#### Auth Remote

```typescript
// apps/auth/src/App.tsx
import { Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="*" element={<Navigate to="/auth/login" replace />} />
    </Routes>
  );
}

export default App;
```

```typescript
// apps/auth/src/pages/LoginPage.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, Button, Input } from '@plate-mate/shared';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email, password);
      navigate('/meals');
    } catch (err) {
      setError('Invalid credentials');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <h2 className="text-center text-3xl font-bold">Sign in to PlateMate</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {error && <p className="text-red-600">{error}</p>}

          <Button type="submit" isLoading={isLoading} className="w-full">
            Sign In
          </Button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => navigate('/auth/register')}
              className="text-blue-600"
            >
              Don't have an account? Register
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

#### Meals Remote

```typescript
// apps/meals/src/App.tsx
import { Routes, Route, Navigate } from 'react-router-dom';
import { MealsListPage } from './pages/MealsListPage';
import { CreateMealPage } from './pages/CreateMealPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<MealsListPage />} />
      <Route path="/create" element={<CreateMealPage />} />
      <Route path="*" element={<Navigate to="/meals" replace />} />
    </Routes>
  );
}

export default App;
```

**Files Created:**
- `apps/welcome/src/App.tsx`
- `apps/auth/src/App.tsx`
- `apps/auth/src/pages/LoginPage.tsx`
- `apps/auth/src/pages/RegisterPage.tsx`
- `apps/meals/src/App.tsx`
- `apps/meals/src/pages/MealsListPage.tsx`
- `apps/meals/src/pages/CreateMealPage.tsx`

---

### Phase 5: Rust Backend (Same as Before)

Tauri commands, SQLite database, and sync logic remain the same as the previous plan.

---

### Phase 6: Backend API Server (Same as Before)

Node.js Express API for cross-device sync remains unchanged.

---

## Development Workflow

### Starting Development

```bash
# Install all dependencies
pnpm install

# Start all dev servers
pnpm dev:all

# In separate terminal, start Tauri
cd src-tauri
cargo tauri dev
```

**What Happens:**
1. Host app starts on port 3000
2. Welcome remote starts on port 3001
3. Auth remote starts on port 3002
4. Meals remote starts on port 3003
5. Backend API starts on port 4000
6. Tauri window opens loading http://localhost:3000

### Development Benefits

1. **Independent Hot Reload:**
   - Change code in auth remote → Only auth rebuilds
   - Change code in host → Only host rebuilds
   - Fast feedback loop

2. **Standalone Testing:**
   - Test auth remote at http://localhost:3002
   - Test meals remote at http://localhost:3003
   - Each remote is a fully functional app

3. **Parallel Development:**
   - Multiple developers can work on different remotes
   - No merge conflicts in unrelated code

### Building for Production

```bash
# Build all apps
pnpm build:all

# Build Tauri app
cd src-tauri
cargo tauri build
```

**Production Strategy:**
- All remotes bundle into `dist/` folders
- Host app references remotes via relative paths (file://)
- Tauri bundles everything into desktop app
- Single executable, but code is still modularly organized

---

## Key Concepts Explained

### 1. Module Federation vs Code Splitting

**Vite/Webpack Code Splitting:**
```typescript
const AuthApp = lazy(() => import('./auth/App'));
// Loads from same origin, bundled together
```

**Module Federation:**
```typescript
const AuthApp = lazy(() => import('auth/App'));
// Loads from http://localhost:3002 at RUNTIME
// Could be a completely separate deployment
```

### 2. Shared Dependencies

**Problem:** Without sharing, each remote bundles React independently.

**Solution: Singleton Shared:**
```javascript
shared: {
  react: { singleton: true },
  'react-dom': { singleton: true },
}
```

**Result:** Only ONE instance of React loads, all remotes share it.

### 3. Eager vs Lazy Shared

**Eager (Host):**
```javascript
react: { singleton: true, eager: true }
```
Loads React immediately with host app.

**Lazy (Remotes):**
```javascript
react: { singleton: true }
```
Waits for host to provide React.

### 4. How Runtime Loading Works

1. User navigates to `/auth/login`
2. Host detects auth remote is needed
3. Browser fetches `http://localhost:3002/remoteEntry.js`
4. Remote entry provides module manifest
5. Host loads required chunks
6. Auth app renders

**Network Tab Shows:**
```
http://localhost:3002/remoteEntry.js  (manifest)
http://localhost:3002/src_App_tsx.js  (auth code)
```

### 5. Production Bundling

**Development:** HTTP URLs (localhost:3001, 3002, etc.)
**Production:** Relative paths or CDN URLs

```javascript
// Production webpack config
remotes: {
  auth: 'auth@/remotes/auth/remoteEntry.js',
  meals: 'meals@/remotes/meals/remoteEntry.js',
}
```

---

## Verification & Testing

### 1. Verify Module Federation Works

**Test: Network Tab**
1. Open DevTools → Network tab
2. Navigate to /auth/login
3. Should see: `remoteEntry.js` load from port 3002
4. Should see: Auth module chunks load

**Test: Standalone Remotes**
1. Open http://localhost:3002 in browser
2. Auth remote should work independently
3. Same for 3001 (welcome) and 3003 (meals)

### 2. Verify Shared Dependencies

**Test: React DevTools**
1. Install React DevTools
2. Check that only ONE React root exists
3. Verify all components are in same React tree

**Test: Bundle Size**
```bash
pnpm build:all
cd apps/host/dist
ls -lh
# React should only be in host bundle, not remotes
```

### 3. Test Cross-Device Sync

(Same as previous plan)

---

## Summary

This architecture provides:

1. **True Runtime Module Federation:**
   - Each microfrontend is an independent app
   - Loads at runtime from separate origin
   - Can be deployed independently (future)

2. **Desktop-First:**
   - Works seamlessly in Tauri desktop app
   - All remotes bundled for offline use
   - Fast native performance

3. **Developer Experience:**
   - Independent hot reload for each app
   - Standalone testing of remotes
   - Parallel development support
   - Webpack ecosystem and tooling

4. **Cross-Device Sync:**
   - SQLite for local storage
   - Backend API for synchronization
   - Offline-first architecture

5. **Scalability:**
   - Add new remotes without touching existing code
   - Independent versioning and deployment
   - Team can work in parallel

This is the industry-standard approach to microfrontends, now adapted for desktop applications with Tauri!
