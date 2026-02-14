# Testing Patterns

**Analysis Date:** 2026-02-15

## Test Framework

**Runner:**
- Node.js built-in test runner (`--test` flag)
- Configured in root `package.json`: `"test": "node --test"`
- Version: Node.js 20+ (built-in test runner available)

**Assertion Library:**
- Node.js built-in assertions (`node:assert` module, implied usage)
- No external assertion library (Jest, Vitest, Mocha) configured
- No test files found in project (`*.test.ts`, `*.test.js`, `*.spec.ts`, `*.spec.js`)

**Test Framework Details:**
- Config file: None (uses Node.js defaults)
- Test discovery: Files matching `**/*.test.js`, `**/*_test.js`, `**/*.test.ts`, `**/*_test.ts`
- Run command: `npm test` or `node --test`

## Test File Organization

**Location:**
- Not established in codebase (no test files present)
- Recommended pattern: Co-located with source
- For API: `api/src/{module}.test.ts` alongside `api/src/{module}.ts`
- For scripts: `scripts/{script}.test.js` alongside `scripts/{script}.js`

**Naming:**
- Recommended: `{name}.test.ts` or `{name}.test.js` suffix
- Pattern not yet standardized in codebase

**Structure:**
- No existing test directories
- `api/` has source code but no `test/` or `__tests__/` directory
- Root `package.json` declares `"test"` script but no tests present

## Test Structure (Inferred Pattern)

Based on Node.js test runner patterns and project structure, tests should follow:

```typescript
import test from 'node:test';
import assert from 'node:assert/strict';
import { createJob, getJob } from './job-manager';

test('job-manager', async (t) => {
  await t.test('createJob returns a valid UUID', () => {
    const jobId = createJob({
      subject: 'math',
      topic: 'addition',
      gradeLevel: 'grade-1'
    });
    assert(typeof jobId === 'string');
    assert(jobId.length > 0);
  });

  await t.test('getJob returns null for non-existent job', () => {
    const job = getJob('nonexistent-id');
    assert.strictEqual(job, undefined);
  });
});
```

**Test Suite Organization:**
- Top-level `test()` call for module or feature
- Nested `t.test()` for individual test cases
- Async test functions for I/O operations
- Use `await` for nested tests to run sequentially

**Patterns:**
- Setup/teardown: Would use test context hooks (not yet implemented)
- Assertion style: `assert.strictEqual()`, `assert(condition)`, `assert.throws()`
- Test isolation: Job store currently global; tests would need cleanup between runs

## Mocking (Not Yet Implemented)

**Framework:**
- No mocking library configured
- Manual mocking approach recommended for Node.js test runner

**Patterns (Recommended for Future):**
```typescript
// Manual mock of file system
import * as fs from 'node:fs/promises';
const originalReaddir = fs.readdir;

test('getExistingModuleNames', async (t) => {
  await t.test('returns empty array when directory empty', async () => {
    fs.readdir = async () => [];
    const result = await getExistingModuleNames('/fake/path');
    assert.deepStrictEqual(result, []);
  });

  // Restore original
  fs.readdir = originalReaddir;
});
```

**What to Mock:**
- File system operations (`fs.readdir`, `fs.readFile`, `fs.writeFile`)
- External API calls (`streamZaiChat`, LLM providers)
- Date/time (`Date.now()` for job TTL testing)
- Environment variables (`process.env`)

**What NOT to Mock:**
- Type definitions and interfaces
- Internal module logic (job validation, slug generation)
- Standard library functions (path joining, crypto)
- Logger in tests that verify logging behavior

## Fixtures and Factories

**Test Data (Recommended Pattern):**

```typescript
// Test fixtures for content requests
const testFixtures = {
  validRequest: {
    subject: 'math' as const,
    topic: 'addition fundamentals',
    gradeLevel: 'grade-1'
  },
  withOptions: {
    subject: 'math' as const,
    topic: 'fractions',
    gradeLevel: 'grade-5',
    contentType: 'phaser' as const,
    visualStyle: 'pixel-art' as const
  },
  invalidRequest: {
    subject: 'invalid',
    topic: '',
    gradeLevel: null
  }
};

// Factory for creating test jobs
function createTestJob(overrides?: Partial<GenerateContentRequest>) {
  return {
    ...testFixtures.validRequest,
    ...overrides
  };
}
```

**Location (Recommended):**
- `api/test/fixtures/` directory for shared test data
- Inline factories in individual test files for simple cases
- Example: `api/test/fixtures/requests.ts` for content request fixtures

## Coverage

**Requirements:** None enforced (no coverage configuration found)

**View Coverage (Recommended):**
```bash
node --test --coverage
# Output: coverage/ directory with HTML report
```

**Coverage Command (Typical Node.js 20+):**
```bash
node --test --coverage --coverage-provider=v8
```

## Test Types

**Unit Tests:**
- Scope: Individual functions and modules
- Approach: Test validation, error handling, transformations
- Example targets:
  - `validateGenerateContentRequest()` - input validation
  - `createModuleId()` - slug generation and versioning
  - `normalizeJsonPayload()` - JSON extraction and parsing
  - `stripThinkingBlocks()` - content cleaning

**Integration Tests:**
- Scope: Job creation → status retrieval flow
- Approach: Full request cycle without external API calls
- Example:
  - Create job, update status, retrieve status
  - Persist jobs, load from disk, verify data
  - Review job creation with module ID lookup

**E2E Tests:**
- Not implemented
- Would require: Express server startup, real HTTP requests, file system
- Candidate: `api/src/admin-server.ts` endpoints (generate, review, status)

## Common Patterns (Recommended for Implementation)

**Async Testing:**
```typescript
test('async operation', async (t) => {
  await t.test('async function resolves', async () => {
    const result = await createModuleId('sample topic');
    assert(typeof result === 'string');
    assert(result.startsWith(new Date().getFullYear().toString()));
  });
});
```

**Error Testing:**
```typescript
test('validation errors', (t) => {
  t.test('rejects invalid subject', () => {
    const result = validateGenerateContentRequest({
      subject: 'invalid',
      topic: 'test',
      gradeLevel: 'grade-1'
    });
    assert.strictEqual(result.ok, false);
    assert.strictEqual(result.code, 'INVALID_SUBJECT');
  });

  t.test('throws on malformed JSON', () => {
    assert.throws(() => {
      normalizeJsonPayload('{ broken json');
    });
  });
});
```

## Testing Strategy for Key Modules

### job-manager.ts
- Test job creation, retrieval, updates
- Verify persistence to disk (`jobs.json`)
- Test job expiration (TTL) logic
- Verify type normalization for backward compatibility

### content-generator.ts
- Test `createModuleId()` with various topics
- Test slug generation (special characters, Unicode normalization)
- Verify module naming versioning (v1, v2, etc.)
- Test validation functions with valid/invalid inputs

### llm/json-utils.ts
- Test JSON extraction from markdown code fences
- Test handling of `<think>` blocks
- Test balanced brace tracking
- Test edge cases (empty strings, no braces, malformed JSON)

### llm/review.ts
- Test scene counting regex
- Test accessibility checks (alt text, ARIA labels)
- Test interactive element detection
- Test review result aggregation

### index.ts (API main)
- Test request validation paths
- Test error response formatting
- Test job creation and status endpoints
- Test edge cases (missing fields, invalid types)

## Test Infrastructure

**Setup (Recommended):**
```bash
mkdir -p api/test
touch api/test/setup.ts    # Common test utilities
touch api/test/fixtures.ts # Shared test data
```

**Test utilities (api/test/setup.ts):**
```typescript
import { initializeJobStore, getAllJobs } from '../src/job-manager';

export function setupTest() {
  initializeJobStore();
}

export function cleanupTest() {
  // Clear job store between tests
  // Would require exposing a reset function
}

export function assertValidUUID(value: unknown) {
  if (typeof value !== 'string') throw new Error('Not a string');
  if (!/^[0-9a-f-]{36}$/.test(value)) throw new Error('Not a valid UUID');
}
```

## Notes on Current Testing State

- **No tests currently in codebase**
- **Test infrastructure not established**
- **Test framework (Node.js built-in) available but not utilized**
- **Manual testing likely via `api/test-zai.js` (integration test script)**

### Manual Test File: `api/test-zai.js`
- Tests Z.ai API integration
- Loads environment variables
- Calls `streamZaiChat()` and `parseZaiOutput()`
- Logs results to console
- Purpose: Verify LLM client works with actual API

**To run manual tests:**
```bash
cd api
node test-zai.js
```

---

*Testing analysis: 2026-02-15*
