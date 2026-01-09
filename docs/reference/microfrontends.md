# Microfrontends Architecture Reference

**Source:** Context7 - module-federation/module-federation-examples
**Last Updated:** 2026-01-09

## Overview

Microfrontends are an architectural pattern where a frontend application is composed of semi-independent fragments (micro-apps) that can be developed, tested, and deployed independently. Module Federation is a Webpack feature that enables this pattern.

---

## Module Federation Basics

### Core Concepts

- **Host Application**: Main app that loads and integrates remote modules
- **Remote Application**: Standalone app that exposes modules for consumption
- **Shared Dependencies**: Libraries shared between host and remotes (React, etc.)
- **Dynamic Imports**: Lazy loading of remote modules at runtime

---

## Dependency Version Management

### Best Practices

**✅ Good: Consistent version ranges**
```json
{
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  }
}
```

**❌ Bad: Exact versions that might conflict**
```json
{
  "dependencies": {
    "react": "18.3.1",
    "react-dom": "18.3.0"
  }
}
```

**Why:**
- Version ranges allow Module Federation to resolve compatible versions
- Exact versions can cause multiple instances of libraries
- Use semver ranges (`^`, `~`) for flexibility

---

## Lazy Loading Remote Components

### React Portal Pattern

```javascript
import React, { lazy, Suspense } from 'react';

// Lazy load dialog from remote app
const Dialog = lazy(() => import('app2/Dialog'));

function App() {
  const [showDialog, setShowDialog] = React.useState(false);

  return (
    <div>
      <h1>App 1</h1>
      <button onClick={() => setShowDialog(true)}>Show Dialog</button>

      {showDialog && (
        <Suspense fallback={<div>Loading...</div>}>
          <Dialog />
        </Suspense>
      )}
    </div>
  );
}
```

**Key Points:**
- Use React `lazy()` for code splitting
- Wrap in `Suspense` for loading states
- Portal pattern works across app boundaries

---

## Runtime Plugins

### Custom Runtime Plugin

Runtime plugins allow you to customize Module Federation behavior at runtime:

```javascript
const runtimePlugin = {
  name: 'runtimePlugin',

  // Handle errors when loading remote microfrontends
  errorLoadRemote({ id, error, from, origin }) {
    console.error(`Error loading remote: ${id}`, error);

    // Return fallback module
    return {
      [id]: () => {
        return async () => {
          return {
            default: () => {
              return {
                __esModule: true,
                default: () => 'Error loading module'
              };
            }
          };
        };
      }
    };
  },

  // Called when plugin is initialized
  init(args) {
    return args;
  },

  // Called before request to load remote microfrontend
  beforeRequest(args) {
    // Modify remote entry URLs
    // Example: args.remotes.remoteEntry = 'http://localhost:3001/remoteEntry.js';
    return args;
  }
};

export default runtimePlugin;
```

**Use Cases:**
- Error handling and fallbacks
- URL modification for different environments
- Authentication and authorization
- Logging and monitoring

---

## Enhanced Runtime Configuration

### Webpack Configuration

```javascript
module.exports = {
  experiments: {
    federationRuntime: 'hoisted',
  },
  plugins: [
    new ModuleFederationPlugin({
      name: 'host',
      remotes: {
        app2: 'app2@http://localhost:3001/remoteEntry.js',
      },
      shared: {
        react: { singleton: true, requiredVersion: '^18.0.0' },
        'react-dom': { singleton: true, requiredVersion: '^18.0.0' },
      },
      runtimePlugins: [require.resolve('./src/runtimePlugin')],
    }),
  ],
};
```

**Configuration Options:**
- `federationRuntime: 'hoisted'` - Optimizes runtime performance
- `singleton: true` - Ensures single instance of library
- `requiredVersion` - Specifies compatible version range

---

## Frontend Discovery Service

### Consumer Response Middleware

Middleware pattern for tracking and customizing consumer responses:

```javascript
// Custom middleware for user tracking
// Reference: module-federation-examples/infrastructure/lambda/consumerApi/userTrackingHandler.js

import middy from '@middy/core';

const userTrackingMiddleware = () => ({
  before: async (request) => {
    // Track user request
    console.log('User requesting:', request.event.path);
  },
  after: async (request) => {
    // Track response
    console.log('Response sent:', request.response.statusCode);
  },
  onError: async (request) => {
    // Track errors
    console.error('Error occurred:', request.error);
  }
});

export const handler = middy()
  .use(userTrackingMiddleware())
  .handler(async (event) => {
    // Your handler logic
  });
```

---

## Architecture Patterns

### 1. Shell Application Pattern

```
┌─────────────────────────────────────┐
│         Shell (Host App)            │
│  ┌─────────┐  ┌─────────┐          │
│  │ Header  │  │  Nav    │          │
│  └─────────┘  └─────────┘          │
│  ┌───────────────────────────────┐ │
│  │   Remote Microfrontend        │ │
│  │   (Loaded Dynamically)        │ │
│  └───────────────────────────────┘ │
└─────────────────────────────────────┘
```

### 2. Multi-Remote Pattern

```
        Host App
         /  |  \
        /   |   \
    App1  App2  App3
  (Remote) (Remote) (Remote)
```

### 3. Bidirectional Sharing

```
App1 ←──→ App2
 ↑          ↑
 └──→ App3 ←┘
```

---

## Best Practices

### 1. Version Management
- Use semver ranges for shared dependencies
- Avoid exact version pinning
- Test with different version combinations

### 2. Error Handling
- Implement fallback UI for failed loads
- Use runtime plugins for error boundaries
- Log failures for monitoring

### 3. Performance
- Lazy load remote modules
- Use Suspense for loading states
- Minimize shared dependency size
- Enable hoisted federation runtime

### 4. Development
- Run remotes on different ports
- Use CORS headers appropriately
- Mock remotes during development

### 5. Deployment
- Deploy remotes independently
- Version remote entry files
- Use CDN for static assets
- Implement health checks

---

## Common Patterns

### Shared State Management

```javascript
// Shared store exposed from host
import { createStore } from './store';
export const store = createStore();

// Remote consumes shared store
import { store } from 'host/store';
```

### Shared UI Components

```javascript
// Host exposes design system
export { Button, Input, Card } from './components';

// Remote uses shared components
import { Button } from 'host/components';
```

### Routing Integration

```javascript
import { BrowserRouter, Route } from 'react-router-dom';
import RemoteApp from 'remote/App';

function Host() {
  return (
    <BrowserRouter>
      <Route path="/remote/*" component={RemoteApp} />
    </BrowserRouter>
  );
}
```

---

## Troubleshooting

### Common Issues

**Issue: Multiple React instances**
- **Solution**: Ensure `singleton: true` in shared config

**Issue: Version conflicts**
- **Solution**: Use compatible version ranges, not exact versions

**Issue: Remote fails to load**
- **Solution**: Implement error boundaries and runtime plugins

**Issue: CORS errors**
- **Solution**: Configure proper CORS headers on remote servers

**Issue: Slow initial load**
- **Solution**: Implement progressive loading and code splitting

---

## Module Federation Config Example

### Host Application

```javascript
new ModuleFederationPlugin({
  name: 'host',
  remotes: {
    remote1: 'remote1@http://localhost:3001/remoteEntry.js',
    remote2: 'remote2@http://localhost:3002/remoteEntry.js',
  },
  shared: {
    react: { singleton: true, eager: true },
    'react-dom': { singleton: true, eager: true },
  },
})
```

### Remote Application

```javascript
new ModuleFederationPlugin({
  name: 'remote1',
  filename: 'remoteEntry.js',
  exposes: {
    './App': './src/App',
    './Button': './src/components/Button',
  },
  shared: {
    react: { singleton: true },
    'react-dom': { singleton: true },
  },
})
```

---

## Testing Strategies

### 1. Integration Tests
- Test host-remote communication
- Verify shared dependency resolution
- Check error handling

### 2. Contract Tests
- Define interface contracts between apps
- Validate exposed modules
- Test with version ranges

### 3. E2E Tests
- Test full user flows across microfrontends
- Verify navigation and state sharing
- Test deployment scenarios

---

## Quick Reference

| Concept | Purpose |
|---------|---------|
| Host | Main app that loads remotes |
| Remote | App that exposes modules |
| Shared | Dependencies shared between apps |
| Singleton | Single instance of library |
| Runtime Plugin | Customize loading behavior |
| Federation Runtime | Core Module Federation logic |
| Remote Entry | Manifest of exposed modules |

---

## Resources

- **Module Federation Examples**: https://github.com/module-federation/module-federation-examples
- **Webpack Module Federation**: https://webpack.js.org/concepts/module-federation/
- **Micro Frontends**: https://micro-frontends.org/
