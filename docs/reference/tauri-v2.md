# Tauri v2 Reference

**Source:** Context7 - tauri-apps/tauri
**Last Updated:** 2026-01-09

## Overview

Tauri v2 is a framework for building desktop applications with web technologies (HTML, CSS, JavaScript) and a Rust backend. It provides a secure IPC bridge for frontend-backend communication.

---

## Architecture

### Core Concepts
- **Frontend**: Any web framework (React, Vue, Svelte, etc.)
- **Backend**: Rust with Tauri commands
- **IPC Bridge**: Secure communication via `invoke()`
- **Events**: Bidirectional real-time messaging
- **Configuration**: `tauri.conf.json` for all settings

---

## Creating Custom Commands

### Rust Backend (src-tauri/src/lib.rs)

```rust
// Simple command
#[tauri::command]
fn greet(name: &str) -> String {
  format!("Hello {name}, You have been greeted from Rust!")
}

// Command with error handling
#[tauri::command]
fn process_data(data: String) -> Result<String, String> {
  if data.is_empty() {
    return Err("Data cannot be empty".to_string());
  }
  Ok(format!("Processed: {}", data))
}

// Register commands
fn main() {
  tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![greet, process_data])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
```

### TypeScript Frontend

```typescript
import { invoke } from '@tauri-apps/api/core';

// Simple invocation
async function greetUser() {
  try {
    const response = await invoke<string>('greet', { name: 'World' });
    console.log(response); // "Hello World, You have been greeted from Rust!"
  } catch (error) {
    console.error('Failed to greet:', error);
  }
}

// With complex data structures
interface User {
  id: number;
  name: string;
}

async function getUserData() {
  try {
    const user = await invoke<User>('fetch_user', { userId: 42 });
    console.log(`User: ${user.name} (ID: ${user.id})`);
  } catch (error) {
    console.error('Failed to fetch user:', error);
  }
}

// Multiple sequential commands
async function initializeApp() {
  try {
    const version = await invoke<string>('get_app_version');
    console.log(`App version: ${version}`);

    await invoke('process_data');
    console.log('Data processed successfully');
  } catch (error) {
    console.error('Initialization failed:', error);
  }
}
```

---

## Window Management

### Creating and Controlling Windows

```typescript
import { WebviewWindow } from '@tauri-apps/api/webviewWindow';
import { getCurrentWindow } from '@tauri-apps/api/window';

// Create new window
async function openSettingsWindow() {
  const settingsWindow = new WebviewWindow('settings', {
    url: '/settings.html',
    title: 'Settings',
    width: 800,
    height: 600,
    resizable: true,
    center: true,
  });

  // Wait for window creation
  await settingsWindow.once('tauri://created', () => {
    console.log('Settings window created');
  });

  await settingsWindow.once('tauri://error', (e) => {
    console.error('Failed to create settings window:', e);
  });
}

// Control current window
async function windowOperations() {
  const window = getCurrentWindow();

  // Resize
  await window.setSize({ type: 'Physical', width: 1024, height: 768 });

  // Reposition
  await window.setPosition({ type: 'Logical', x: 100, y: 100 });

  // Window states
  await window.minimize();
  await window.maximize();
  await window.setFullscreen(true);

  // Visibility
  await window.hide();
  await window.show();

  // Set title
  await window.setTitle('My Awesome App');

  // Request attention
  await window.requestUserAttention('Critical');

  // Get properties
  const isMaximized = await window.isMaximized();
  const isVisible = await window.isVisible();
  const scaleFactor = await window.scaleFactor();
}
```

### JavaScript (Vanilla)

```javascript
const { WebviewWindow } = window.__TAURI__.webviewWindow;

// Create new window
const newWindow = new WebviewWindow('label', {
  title: 'Window Title'
});
```

---

## Configuration (tauri.conf.json)

```json
{
  "$schema": "https://schema.tauri.app/config/2.0.0",
  "productName": "My App",
  "version": "1.0.0",
  "identifier": "com.mycompany.myapp",
  "build": {
    "frontendDist": "../dist",
    "devUrl": "http://localhost:1420",
    "beforeDevCommand": "npm run dev",
    "beforeBuildCommand": "npm run build"
  },
  "app": {
    "withGlobalTauri": true,
    "security": {
      "csp": {
        "default-src": "'self'",
        "img-src": "'self' https: data:",
        "script-src": "'self' 'unsafe-inline'"
      },
      "assetProtocol": {
        "enable": true,
        "scope": {
          "allow": ["$APPDATA/**", "$RESOURCE/**"]
        }
      }
    }
  },
  "bundle": {
    "active": true,
    "icon": [
      "icons/32x32.png",
      "icons/128x128.png",
      "icons/icon.icns",
      "icons/icon.ico"
    ],
    "targets": "all"
  },
  "plugins": {
    "cli": {
      "description": "My application",
      "args": [
        {
          "short": "v",
          "name": "verbose",
          "description": "Enable verbose logging"
        }
      ]
    }
  }
}
```

---

## CLI Commands

```bash
# Initialize Tauri in existing project
npm install --save-dev @tauri-apps/cli
npm run tauri init

# Development with hot reload
npm run tauri dev

# Build for production
npm run tauri build

# Build for specific targets
npm run tauri build -- --target x86_64-apple-darwin
npm run tauri build -- --target x86_64-pc-windows-msvc

# System information
npm run tauri info

# Generate icons from source image
npm run tauri icon path/to/icon.png

# Plugin management
npm run tauri plugin add sql
npm run tauri plugin init

# Mobile development
npm run tauri android init
npm run tauri android dev
npm run tauri ios init
npm run tauri ios dev
```

---

## Custom Plugins

### Rust Plugin Definition

```rust
use tauri::{
    plugin::{Builder, TauriPlugin},
    Runtime, Manager,
};

#[tauri::command]
fn my_plugin_command(message: String) -> Result<String, String> {
    Ok(format!("Plugin received: {}", message))
}

pub fn init<R: Runtime>() -> TauriPlugin<R> {
    Builder::new("my-plugin")
        .invoke_handler(tauri::generate_handler![my_plugin_command])
        .setup(|app, api| {
            println!("My plugin initialized");
            Ok(())
        })
        .build()
}

// Register in main.rs
fn main() {
    tauri::Builder::default()
        .plugin(my_plugin::init())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

### Frontend Usage

```typescript
import { invoke } from '@tauri-apps/api/core';

async function useCustomPlugin() {
    try {
        const result = await invoke<string>('plugin:my-plugin|my_plugin_command', {
            message: 'Hello from frontend!'
        });
        console.log(result); // "Plugin received: Hello from frontend!"
    } catch (error) {
        console.error('Plugin command failed:', error);
    }
}
```

---

## Best Practices

1. **Security First**: Configure CSP properly in `tauri.conf.json`
2. **Error Handling**: Always use `Result<T, E>` for commands that can fail
3. **Type Safety**: Use TypeScript generics with `invoke<T>()`
4. **State Management**: Use Tauri's state for shared backend state
5. **Incremental Adoption**: Start simple, add complexity as needed
6. **Window Lifecycle**: Handle creation/error events properly
7. **Asset Protocol**: Use `$APPDATA` and `$RESOURCE` for file access

---

## Quick Reference

| Feature | Frontend | Backend |
|---------|----------|---------|
| Commands | `invoke('cmd', {args})` | `#[tauri::command]` |
| Window | `WebviewWindow` | Managed in config |
| Events | `emit()` / `listen()` | `app.emit()` |
| State | Access via invoke | `State<T>` |
| Plugins | Import and use | `Builder::new()` |

---

## Communication Pattern

```
┌─────────────┐         invoke()         ┌──────────────┐
│   Frontend  │ ─────────────────────────>│   Backend    │
│  (Web Tech) │                           │    (Rust)    │
│             │<─────────────────────────│              │
└─────────────┘        Response          └──────────────┘
                     (JSON/Result)
```
