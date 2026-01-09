# ESLint 9 Reference

**Source:** Context7 - eslint/eslint
**Last Updated:** 2026-01-09

## Overview

ESLint 9 introduces **Flat Config** as the modern configuration system, replacing the old `.eslintrc.json` format. Flat config uses JavaScript/TypeScript files and provides better TypeScript support.

---

## Key Changes in ESLint 9

### 1. Flat Config Format (eslint.config.js)

**Old Way (.eslintrc.json):**
```json
{
  "extends": ["eslint:recommended"],
  "rules": { "no-console": "warn" }
}
```

**New Way (eslint.config.js):**
```javascript
import js from "@eslint/js";

export default [
  js.configs.recommended,
  {
    rules: {
      "no-console": "warn"
    }
  }
];
```

### 2. String-Based Configs Removed

**Breaking Change:**
- `"eslint:recommended"` and `"eslint:all"` strings no longer work
- Must import from `@eslint/js` package

```javascript
// ✅ ESLint 9 (correct)
import js from "@eslint/js";
export default [js.configs.recommended];

// ❌ ESLint 9 (throws error)
export default ["eslint:recommended"];
```

---

## Flat Config Structure

### Basic Setup

```javascript
// eslint.config.js
import { defineConfig } from "eslint/config";
import js from "@eslint/js";

export default defineConfig([
  js.configs.recommended,
  {
    rules: {
      indent: ["error", 2],
      "no-unused-vars": "warn",
    }
  }
]);
```

### TypeScript + React Setup

```javascript
// eslint.config.js
import js from "@eslint/js";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import reactPlugin from "eslint-plugin-react";
import reactHooksPlugin from "eslint-plugin-react-hooks";

export default [
  js.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: "module",
        ecmaFeatures: { jsx: true }
      }
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
      "react": reactPlugin,
      "react-hooks": reactHooksPlugin
    },
    rules: {
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "react/prop-types": "off",
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn"
    }
  }
];
```

### File-Specific Configuration

```javascript
export default defineConfig([
  js.configs.recommended,

  // Global ignores
  {
    ignores: ["dist/**", "build/**", "node_modules/**"]
  },

  // JavaScript files
  {
    name: "app-javascript",
    files: ["src/**/*.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module"
    },
    rules: {
      "no-console": "warn",
      "prefer-const": "error"
    }
  },

  // Test files with relaxed rules
  {
    name: "test-files",
    files: ["test/**/*.js", "**/*.test.js"],
    rules: {
      "no-console": "off"
    }
  }
]);
```

---

## Migration from .eslintrc.json

### Before (ESLint 8)
```json
{
  "root": true,
  "extends": ["eslint:recommended", "plugin:@typescript-eslint/recommended"],
  "parser": "@typescript-eslint/parser",
  "parserOptions": { "project": ["./tsconfig.json"] },
  "plugins": ["@typescript-eslint"],
  "rules": {
    "@typescript-eslint/strict-boolean-expressions": [2, {
      "allowString": false,
      "allowNumber": false
    }]
  },
  "ignorePatterns": ["src/**/*.test.ts"]
}
```

### After (ESLint 9)
```javascript
import js from "@eslint/js";
import ts from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";

export default [
  js.configs.recommended,
  {
    files: ["**/*.ts"],
    languageOptions: {
      parser: tsParser,
      parserOptions: { project: ["./tsconfig.json"] }
    },
    plugins: { "@typescript-eslint": ts },
    rules: {
      "@typescript-eslint/strict-boolean-expressions": [2, {
        allowString: false,
        allowNumber: false
      }]
    }
  },
  {
    ignores: ["src/**/*.test.ts"]
  }
];
```

---

## Best Practices

1. **Use Flat Config:** The future of ESLint
2. **Import from @eslint/js:** Don't use string-based configs
3. **Use defineConfig:** Better TypeScript support
4. **File-Specific Rules:** Configure different rules for different file types
5. **Global Ignores:** Use ignores array instead of .eslintignore
6. **Name Your Configs:** Use `name` property for debugging

---

## Common Patterns

### Monorepo Setup
```javascript
export default [
  js.configs.recommended,
  {
    files: ["packages/*/src/**/*.ts"],
    rules: { "no-console": "warn" }
  },
  {
    files: ["apps/*/src/**/*.tsx"],
    plugins: { react: reactPlugin },
    rules: { "react/prop-types": "off" }
  }
];
```

### With Prettier Integration
```javascript
import prettierConfig from "eslint-config-prettier";

export default [
  js.configs.recommended,
  prettierConfig, // Disables conflicting rules
  {
    rules: { /* your rules */ }
  }
];
```

---

## Quick Reference

| Feature | ESLint 8 | ESLint 9 |
|---------|----------|----------|
| Config File | `.eslintrc.json` | `eslint.config.js` |
| Format | JSON/YAML | JavaScript |
| Recommended | `"eslint:recommended"` | `js.configs.recommended` |
| Parser | `parser` field | `languageOptions.parser` |
| Ignores | `.eslintignore` file | `ignores` array |

---

## Our Implementation Status

**Current:** Using `.eslintrc.json` (ESLint 8 format)
**Recommended:** Migrate to flat config for ESLint 9 compatibility

**Action Required:** Update to flat config format before ESLint 9 becomes default.
