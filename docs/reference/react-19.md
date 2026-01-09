# React 19 Reference

**Source:** Context7 - facebook/react
**Last Updated:** 2026-01-09

## Overview

React 19 is a major release (December 2024, latest 19.2 in October 2025) with significant new features and breaking changes. Key additions include stable React Server Components, new hooks, Actions for async operations, and the `<Activity>` component.

---

## New Features in React 19

### Actions
- Handle async operations in forms and data mutations
- Built-in pending states and error handling
- Automatic form submissions

### New Hooks

#### `useActionState`
Manages form submission state with pending and error handling.

```javascript
import { useActionState } from 'react';

async function createUser(previousState, formData) {
  const username = formData.get('username');
  const email = formData.get('email');

  if (!email.includes('@')) {
    return { error: 'Invalid email address' };
  }

  return { success: true, message: `User ${username} created!` };
}

function SignupForm() {
  const [state, formAction, isPending] = useActionState(createUser, null);

  return (
    <form action={formAction}>
      <input name="username" required disabled={isPending} />
      <input name="email" type="email" required disabled={isPending} />
      <button type="submit" disabled={isPending}>
        {isPending ? 'Creating...' : 'Create Account'}
      </button>
      {state?.error && <p style={{ color: 'red' }}>{state.error}</p>}
      {state?.success && <p style={{ color: 'green' }}>{state.message}</p>}
    </form>
  );
}
```

#### `useOptimistic`
Updates UI optimistically before server response.

#### `useEffectEvent`
Creates stable event handlers that don't trigger effects.

#### `use()`
Reads promises and context during render.

---

## Core Hooks (Stable)

### `useState`
Manages reactive component state.

```javascript
import { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0);
  const [name, setName] = useState('');

  return (
    <div>
      <h2>Count: {count}</h2>
      <button onClick={() => setCount(count + 1)}>Increment</button>
      <button onClick={() => setCount(prev => prev - 1)}>Decrement</button>

      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Enter name"
      />
      <p>Hello, {name}</p>
    </div>
  );
}
```

### `useMemo` and `useCallback`
Optimize performance by memoizing values and functions.

```javascript
import { useState, useMemo, useCallback } from 'react';

function ExpensiveList({ items, onItemClick }) {
  // Memoize expensive computation
  const sortedItems = useMemo(() => {
    console.log('Sorting items...');
    return [...items].sort((a, b) => a.value - b.value);
  }, [items]);

  // Memoize total calculation
  const total = useMemo(() => {
    return items.reduce((sum, item) => sum + item.value, 0);
  }, [items]);

  return (
    <div>
      <p>Total: {total}</p>
      <ul>
        {sortedItems.map(item => (
          <li key={item.id} onClick={() => onItemClick(item.id)}>
            {item.name}: {item.value}
          </li>
        ))}
      </ul>
    </div>
  );
}

function App() {
  const [items, setItems] = useState([
    { id: 1, name: 'Item 1', value: 50 },
    { id: 2, name: 'Item 2', value: 30 }
  ]);

  // Stable callback reference
  const handleItemClick = useCallback((id) => {
    console.log('Clicked item:', id);
  }, []);

  return <ExpensiveList items={items} onItemClick={handleItemClick} />;
}
```

---

## Breaking Changes

### Context Providers
Use `<Context>` directly instead of `<Context.Provider>`:
```javascript
// React 19
<MyContext value={value}>
  {children}
</MyContext>

// Old way
<MyContext.Provider value={value}>
  {children}
</MyContext.Provider>
```

### Refs with Cleanup
Refs now support cleanup functions:
```javascript
const ref = useRef(null);
ref.current = value;
// Cleanup automatically handled
```

### `useId` Format
IDs now use underscores instead of colons for better CSS compatibility:
```javascript
// React 19: id_123
// React 18: id:123
```

---

## Concurrent Features

- **`useTransition`** - Mark state updates as non-urgent
- **`useDeferredValue`** - Defer re-rendering for non-critical updates
- **Suspense** - Code splitting and data fetching boundaries
- **React Server Components** - Server-side rendering (stable)

---

## Rendering

### Client-Side
```javascript
import { createRoot } from 'react-dom/client';

const root = createRoot(document.getElementById('root'));
root.render(<App />);
```

### Server-Side
React Server Components now stable with partial pre-rendering APIs.

---

## Best Practices

1. **Use `useMemo` and `useCallback` sparingly** - Only for expensive operations
2. **Prefer `useActionState` for forms** - Built-in pending/error handling
3. **Use `useOptimistic` for responsive UIs** - Better user experience
4. **Leverage Server Components** - Reduce client bundle size
5. **Use `useTransition` for non-urgent updates** - Maintain responsiveness

---

## Quick Reference

| Hook | Purpose |
|------|---------|
| `useState` | Manage component state |
| `useEffect` | Side effects and lifecycle |
| `useContext` | Access context values |
| `useReducer` | Complex state logic |
| `useMemo` | Memoize expensive computations |
| `useCallback` | Memoize callback functions |
| `useRef` | Persist values, DOM references |
| `useId` | Generate unique IDs |
| `useActionState` | Form submissions (React 19) |
| `useOptimistic` | Optimistic updates (React 19) |
| `use()` | Read promises/context (React 19) |
| `useTransition` | Non-urgent state updates |
| `useDeferredValue` | Defer rendering |
