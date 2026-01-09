# Prettier Reference

**Source:** Context7 - prettier/prettier
**Last Updated:** 2026-01-09

## Overview

Prettier is an opinionated code formatter that enforces consistent style across your codebase. It supports TypeScript, JavaScript, JSX, CSS, JSON, Markdown, and more.

---

## Configuration Formats

### 1. JSON Format (.prettierrc)

**Most Common:**
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "arrowParens": "always",
  "endOfLine": "lf"
}
```

### 2. TypeScript Format (prettier.config.ts) - ES Modules

**Recommended for TypeScript projects:**
```typescript
// prettier.config.ts, .prettierrc.ts, prettier.config.mts, or .prettierrc.mts

import { type Config } from "prettier";

const config: Config = {
  semi: true,
  trailingComma: "es5",
  singleQuote: true,
  printWidth: 100,
  tabWidth: 2,
};

export default config;
```

### 3. TypeScript Format (prettier.config.cts) - CommonJS

```typescript
// prettier.config.cts or .prettierrc.cts

import { type Config } from "prettier";

const config: Config = {
  trailingComma: "none",
};

module.exports = config;
```

---

## Configuration Options

### Common Options

| Option | Default | Description |
|--------|---------|-------------|
| `printWidth` | 80 | Max line length before wrapping |
| `tabWidth` | 2 | Spaces per indentation level |
| `useTabs` | false | Use tabs instead of spaces |
| `semi` | true | Add semicolons at end of statements |
| `singleQuote` | false | Use single quotes instead of double |
| `quoteProps` | "as-needed" | When to quote object properties |
| `jsxSingleQuote` | false | Use single quotes in JSX |
| `trailingComma` | "all" | Where to add trailing commas |
| `bracketSpacing` | true | Space inside object brackets |
| `arrowParens` | "always" | Parentheses around arrow function args |
| `endOfLine` | "lf" | Line ending style |

### Recommended Settings for React/TypeScript

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "arrowParens": "always",
  "bracketSpacing": true,
  "jsxSingleQuote": false,
  "endOfLine": "lf"
}
```

---

## Ignore Files (.prettierignore)

```
# Dependencies
node_modules
pnpm-lock.yaml
package-lock.json

# Build outputs
dist
build
.tauri
target
coverage

# Logs
*.log

# Environment
.env
.env.local

# IDE
.vscode
.idea

# OS
.DS_Store
```

---

## Integration with Git Hooks

### Using lint-staged + husky

**1. Install Dependencies:**
```bash
pnpm add -D lint-staged husky
```

**2. Configure in package.json:**
```json
{
  "scripts": {
    "prepare": "husky install"
  },
  "lint-staged": {
    "*.{js,ts,tsx,css,md,json}": "prettier --write"
  }
}
```

**3. Create pre-commit hook:**
```bash
npx husky add .husky/pre-commit "npx lint-staged"
```

---

## Integration with ESLint

### Use eslint-config-prettier

**Purpose:** Disables ESLint rules that conflict with Prettier

**Installation:**
```bash
pnpm add -D eslint-config-prettier
```

**ESLint 9 (Flat Config):**
```javascript
import prettier from "eslint-config-prettier";

export default [
  // ... other configs
  prettier, // Must be last to override rules
];
```

**ESLint 8 (.eslintrc.json):**
```json
{
  "extends": [
    "eslint:recommended",
    "prettier" // Must be last
  ]
}
```

---

## VS Code Integration

### .vscode/settings.json

```json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "editor.formatOnPaste": false,
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[typescriptreact]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[json]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  }
}
```

---

## Monorepo Configuration

### Root .prettierrc (shared config)
```json
{
  "semi": true,
  "singleQuote": true,
  "printWidth": 100
}
```

### Package-specific overrides
```json
// apps/host/.prettierrc
{
  "printWidth": 120
}
```

**Inheritance:** Prettier automatically merges configs from parent directories.

---

## CLI Usage

```bash
# Format all files
prettier --write .

# Check formatting (CI)
prettier --check .

# Format specific files
prettier --write "src/**/*.{ts,tsx}"

# Ignore path
prettier --write . --ignore-path .prettierignore

# Custom config
prettier --write . --config .prettierrc.custom
```

---

## Scripts for package.json

```json
{
  "scripts": {
    "format": "prettier --write \"**/*.{ts,tsx,js,jsx,json,md}\"",
    "format:check": "prettier --check \"**/*.{ts,tsx,js,jsx,json,md}\""
  }
}
```

---

## Best Practices

1. **Use TypeScript Config:** Better type safety with `Config` type
2. **Run in CI:** Use `prettier --check` to fail on unformatted code
3. **Git Hooks:** Auto-format on commit with lint-staged
4. **ESLint Integration:** Use `eslint-config-prettier` to avoid conflicts
5. **Monorepo:** Share config in root, override per package if needed
6. **Ignore Generated Code:** Add to `.prettierignore`
7. **Team Consistency:** Commit `.prettierrc` to version control

---

## Our Implementation Status

**Current Configuration:**
- ✅ Using `.prettierrc` (JSON format)
- ✅ Configured `.prettierignore`
- ✅ Added format scripts to package.json
- ✅ Integrated with ESLint via `eslint-config-prettier`

**Potential Improvements:**
- [ ] Migrate to TypeScript config (`prettier.config.ts`)
- [ ] Add lint-staged for pre-commit hooks
- [ ] Add format:check to CI pipeline

---

## Common Issues

### 1. Prettier vs ESLint Conflicts

**Solution:** Use `eslint-config-prettier` (already included)

### 2. Different Line Endings (Windows vs Unix)

**Solution:** Set `endOfLine: "lf"` and configure Git:
```bash
git config --global core.autocrlf false
```

### 3. Inconsistent Formatting in Team

**Solution:**
- Commit `.prettierrc` to Git
- Add pre-commit hooks
- Run format check in CI
