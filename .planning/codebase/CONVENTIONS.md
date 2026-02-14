# Coding Conventions

**Analysis Date:** 2026-02-15

## Naming Patterns

**Files:**
- TypeScript sources: camelCase with descriptive names (`content-generator.ts`, `zai-client.ts`, `job-manager.ts`)
- Vanilla JS modules: camelCase with `script.js` and `style.css` for interactive content
- Build scripts: kebab-case or camelCase (`build-gallery.js`, `build-assets.js`)
- Data modules: kebab-case (`assets-source.json`, `assets-index.json`)

**Functions:**
- camelCase for all functions (exported and internal)
- Prefix private helper functions with underscore convention not used; rely on file scope instead
- Factory functions: `create*` prefix (`createJob`, `createConsoleLogger`, `createModuleId`)
- Predicate functions: `check*` or `is*` prefix (`checkResponsiveDesign`, `checkQuizPresent`, `isAsyncJobsEnabled`)
- Getter functions: `get*` prefix (`getLogger`, `getJob`, `getProjectRoot`)

**Variables:**
- camelCase for local and module-scoped variables
- UPPER_SNAKE_CASE for constants (`DEFAULT_JOB_TTL_MS`, `DEFAULT_MAX_TOKENS`, `DEFAULT_MODEL`)
- Abbreviations acceptable in constants (`JOB_TTL_MS`, `DEFAULT_TIMEOUT_MS`)
- Single-letter variables only in tight loops or callbacks (`for (const [id, job] of jobs.entries())`)

**Types:**
- PascalCase for all types (`GenerateContentRequest`, `Job`, `ZaiChatMessage`, `ReviewResult`)
- Suffix interfaces with descriptive nouns, no `I` prefix (`Logger`, `ZaiClientOptions`)
- Discriminated unions with `type` field for variant detection (`jobType: 'generate' | 'review'`)
- Type aliases for unions and primitives: `export type Subject = 'math' | 'english' | ...`

## Code Style

**Formatting:**
- No linting/formatting tool configured (ESLint, Prettier not installed)
- Manual consistency observed:
  - 2-space indentation in JS/JSON files
  - 4-space indentation in some HTML files (e.g., gallery.html)
  - Semicolons required
  - Single quotes preferred in JS (`'utf8'`, `'pending'`)
  - Template literals for multi-line strings

**Linting:**
- No ESLint configuration found
- TypeScript strict mode enabled (`"strict": true` in `tsconfig.json`)
- Type checking enforced at compile time via TypeScript

**TypeScript Configuration:**
- Target: ES2020
- Module: CommonJS
- `strict: true` for all null/undefined checks
- `esModuleInterop: true` for default imports
- `forceConsistentCasingInFileNames: true`
- `skipLibCheck: true` to avoid node_modules type errors

## Import Organization

**Order:**
1. Node.js built-in imports (`import fs from 'node:fs'`, `import path from 'node:path'`)
2. Third-party imports (`import express from 'express'`, `import dotenv from 'dotenv'`)
3. Local imports from project (`import { log } from './logger'`)
4. Type imports kept inline with regular imports (no separate `type` imports observed)

**Path Aliases:**
- No path aliases configured (`baseUrl` or `paths` not in tsconfig)
- All imports use relative paths (`./`, `../`)
- Node modules referenced by package name (`node:fs`, `express`, `dotenv`)

**CommonJS vs ES Modules:**
- API code: ES modules with TypeScript (`import`/`export`)
- Build scripts and test files: CommonJS (`require`, `module.exports`)
- Compiled TypeScript outputs CommonJS (`"module": "CommonJS"` in tsconfig)

## Error Handling

**Patterns:**
- Explicit error checking with `instanceof Error` guard (`error instanceof Error ? error.message : error`)
- Try-catch blocks for async operations and file I/O
- Optional chaining for safe property access (`value?.trim()`, `job?.status`)
- Nullish coalescing for defaults (`value ?? defaultValue`)
- Validation before processing (type guards with `typeof` checks)

**Validation Approach:**
- Inline type guards in exported functions: `if (!input || typeof input !== 'object')`
- Record type casting for unknown objects: `const record = input as Record<string, unknown>`
- Property existence checks before casting: `const subject = record.subject; if (typeof subject !== 'string')`
- Return discriminated unions for validation: `{ ok: false, code: 'INVALID_REQUEST' }` vs `{ ok: true, value: {...} }`

**Error Responses:**
- Consistent error shape: `{ success: false, error: string, code: ErrorCode }`
- Error codes are string literals (typed union): `type ErrorCode = 'INVALID_SUBJECT' | 'JOB_NOT_FOUND' | ...`
- Error messages are user-facing in Korean
- File path validation prevents directory traversal attacks (checks `ROOT_DIR` boundary)

## Logging

**Framework:** `console` module (custom logger wrapper in `api/src/logger.ts`)

**Implementation:**
- Custom `Logger` interface with methods: `log(tag, message)`, `logSize(label, text)`, `logProgress(tag, elapsed, chars)`
- `LogTag` type: string literal union (`'INIT'`, `'GEN'`, `'REVIEW'`, `'FIX'`, `'API'`, `'ISSUE'`, `'SAVE'`, `'WRITE'`, `'DONE'`, `'ERROR'`, `'SIZE'`)
- Dual logger modes: `createConsoleLogger()` and `createNoopLogger()` for testing
- Toggle logging via `enableLogging(true|false)`

**Patterns:**
- Timestamp prefix: `[HH:MM:SS]`
- Tag prefix: `[TAG]`
- Token estimation: chars ÷ 4 ≈ tokens
- Progress output via `process.stdout.write()` with carriage return (`\r`) for live updates
- Example: `[2026-02-15 14:30:45] [GEN] Content generated: 1,234 characters (~308 tokens)`

## Comments

**When to Comment:**
- JSDoc blocks for exported functions and types
- Inline comments for non-obvious logic or workarounds
- Section headers for major code blocks (e.g., `// ============================================ // Scene Logic`)

**JSDoc/TSDoc:**
- JSDoc blocks used sparingly (mostly in logger and JSON utility functions)
- Single-line comments preferred over multi-line for simple explanations
- Comments in Korean for educational content, English for API code

**Examples from codebase:**
```typescript
/**
 * Strip <think>...</think> blocks that some models include in content.
 * These thinking blocks pollute the JSON/markdown output.
 */
function stripThinkingBlocks(content: string): string { ... }
```

```javascript
/**
 * extract a balanced JSON object from text starting at a given position.
 * Tracks brace depth and string escaping to find the matching closing brace.
 */
function extractBalancedJson(text: string, start: number): string | null { ... }
```

## Function Design

**Size:**
- Functions range from 2 lines (simple getters) to 50+ lines (complex logic)
- Most functions stay under 20 lines
- Longer functions (`createModuleId`, `normalizeJsonPayload`) decompose logic but stay readable

**Parameters:**
- Single object parameter for functions with multiple options: `buildRequestBody(messages, options: ZaiClientOptions, stream)`
- Spread parameters avoided; use objects instead
- Optional parameters via `?:` in interfaces: `temperature?: number`, `maxTokens?: number`
- Callbacks as last parameter: `onProgress?: (elapsed: number, chars: number) => void`

**Return Values:**
- Early returns for validation/error cases
- Explicit return types on exported functions
- Discriminated unions for success/failure: `{ ok: true, value: T } | { ok: false, code: ErrorCode }`
- `null` or `undefined` for "not found" cases (not throwing exceptions)

## Module Design

**Exports:**
- Named exports for individual functions
- Default exports not used
- Type exports use `export type` or `export interface`
- Example: `export function log(tag: LogTag, message: string)`, `export type JobStatus = 'pending' | ...`

**Barrel Files:**
- `api/src/index.ts` exports all public functions from submodules
- Main entry point: re-exports validation, job creation, status retrieval functions
- No barrel files in edu-content (each module is self-contained)

**Module Organization:**
- `api/src/` organized by concern: `logger.ts`, `job-manager.ts`, `content-generator.ts`, `llm/` subdir
- `llm/` subdir contains LLM client logic (`zai-client.ts`, `zai-output.ts`, `review.ts`, `provider.ts`)
- Build scripts in project root and `scripts/` directory
- Edu-content modules self-contained with `index.html`, `script.js`, `style.css` per module

## Code Patterns Observed

**Singleton Pattern:**
- Job store: single global `jobs` Map initialized on module load
- Logger: `let currentLogger` global, set via `enableLogging()`
- ContentApp in vanilla JS modules: global singleton object with methods

**Factory Functions:**
- Job creation: `createJob()` wraps `createJobWithType('generate', ...)`
- Logger creation: `createConsoleLogger()` and `createNoopLogger()` return Logger interface
- Job persistence: save/load cycle via `persistJobs()` and `loadJobsFromDisk()`

**Validation as Early Return:**
```typescript
const validation = validateGenerateContentRequest(request);
if (!validation.ok) {
  return buildErrorResponse(validation.code, message);
}
```

**Type Narrowing:**
- Cast unknown to Record: `const record = input as Record<string, unknown>`
- Check type: `if (typeof subject !== 'string')`
- Type guard result returned: `{ ok: true as const }`

---

*Convention analysis: 2026-02-15*
