# Codebase Concerns

**Analysis Date:** 2026-02-15

## Tech Debt

**Large Monolithic Files (900+ LOC):**
- Files: `build-gallery.js` (1298 LOC), `api/src/content-generator.ts` (766 LOC), `api/src/llm/review.ts` (601 LOC)
- Impact: Hard to test, debug, and modify. Single responsibility principle violated.
- Files: `edu-content/20260209-world-quiz-battle/script.js` (840 LOC), `edu-content/20260127-prepositions-3d/script.js` (791 LOC)
- Fix approach: Break into smaller modules; extract utility functions; use class-based architecture for game/scene management.

**Weak Type Safety in Error Handling:**
- Files: `api/src/admin-server.ts` (multiple catch blocks with `error: any`)
- Impact: Potential for runtime crashes if error structure is unexpected.
- Pattern: `catch (error: any) { ... error.message }` doesn't guarantee error is an Error object.
- Fix approach: Create typed error handlers; use type guards; catch specific error types first.

**Inconsistent JSON Parsing Fallbacks:**
- Files: `api/src/llm/json-utils.ts`, `api/src/llm/review.ts`
- Impact: Multiple "best effort" extraction attempts make debugging failures hard. Silent degradation masks API problems.
- Pattern: `extractBalancedJson()` tries multiple heuristics; if all fail, returns last N characters.
- Fix approach: Log which extraction method succeeded; track failure rates; add observability for parsing failures.

**No Input Validation Framework:**
- Files: `api/src/index.ts`, `api/src/content-generator.ts`
- Impact: Manual type casting `as Record<string, unknown>` throughout; no schema validation.
- Pattern: `validateGenerateContentRequest()` checks properties manually instead of using Zod/joi.
- Fix approach: Implement Zod schema validation at API boundaries; leverage TypeScript for compile-time safety.

## Known Bugs

**Z.ai API Response Parsing Failures:**
- Symptoms: Multiple jobs in `api/data/jobs.json` show `reviewError: "리뷰 응답 JSON 파싱에 실패했습니다"` and `error: "Z.ai API 오류: 500 Internal Server Error"`
- Files: `api/src/llm/review.ts`, `api/src/llm/zai-output.ts`, `api/src/content-generator.ts`
- Trigger: When Z.ai returns malformed JSON, incomplete streams, or thinking blocks; when API returns 500.
- Root cause: `normalizeJsonPayload()` has multiple fallback strategies but still fails on edge cases (truncated JSON, nested structures with escaped quotes).
- Workaround: Manual retry, check raw response logs.
- Fix approach: Add detailed logging for which extraction method is used; add timeout+retry logic with exponential backoff; validate JSON schema before parsing.

**Job Persistence Race Conditions:**
- Symptoms: Job state may be lost if server crashes during `fs.writeFileSync()` in `job-manager.ts`.
- Files: `api/src/job-manager.ts`
- Trigger: Server restart during job write; concurrent writes to `api/data/jobs.json`.
- Impact: Job progress lost; user sees "job not found" or stale status.
- Fix approach: Use atomic file writes (write to temp file, rename); add file locking or use database; implement write queue.

**Missing Environment Variable Validation:**
- Symptoms: Content generation fails silently with message "ZAI_API_KEY 환경변수가 설정되지 않았습니다."
- Files: `api/src/content-generator.ts` (line ~412), `.env.example` exists but not enforced.
- Trigger: Running without proper `.env` setup.
- Impact: Cryptic errors; users must debug env setup manually.
- Fix approach: Early validation in `admin-server.ts` startup; fail fast with helpful error message; document `.env` setup in README.

## Security Considerations

**API Key Exposure Risk:**
- Risk: `ZAI_API_KEY` passed in request headers; if logs are exposed, credentials leak.
- Files: `api/src/llm/zai-client.ts` (line 140: `Authorization: Bearer ${options.apiKey}`)
- Current mitigation: Uses https, `logSize()` truncates payloads.
- Recommendations:
  - Never log full API keys; mask in logs (log only first 4 chars).
  - Rotate API keys periodically.
  - Use separate service account for Z.ai with minimal permissions.
  - Consider using webhook signing instead of bearer tokens.

**Path Traversal in File Write:**
- Risk: `isAllowedWritePath()` checks start with `edu-content/`, but symlinks or `..` could bypass.
- Files: `api/src/content-generator.ts` (lines 103-112)
- Current mitigation: Resolves paths, checks extension whitelist.
- Recommendations:
  - Add test cases for symlink bypass attempts.
  - Use `fs.realpath()` to resolve symlinks before checking.
  - Reject paths containing `..` segments explicitly.

**Unvalidated Job IDs:**
- Risk: Job IDs are UUIDs but endpoint `/api/content/{jobId}` doesn't validate format.
- Files: `api/src/admin-server.ts` (endpoints use `req.params.jobId` directly)
- Current mitigation: Job lookup returns null if ID not found.
- Recommendations: Validate UUID format at route level; add rate limiting to prevent enumeration attacks.

**CORS Misconfiguration:**
- Risk: `app.use(cors())` in `api/src/admin-server.ts` allows any origin.
- Files: `api/src/admin-server.ts` (line 83), `server.js` (line 85: `'Access-Control-Allow-Origin': '*'`)
- Current mitigation: None for public deployments.
- Recommendations:
  - Restrict CORS to known origins (whitelist in `.env`).
  - Remove `*` in production; use environment-specific config.

## Performance Bottlenecks

**Synchronous File Operations in Hot Paths:**
- Problem: `build-gallery.js` reads/writes large JSON files (72KB assets.json) synchronously.
- Files: `build-gallery.js` (line 24: `fs.readFileSync(assetsPath, 'utf8')`), `server.js` (line 72: `execSync('node build-gallery.js')`)
- Cause: Blocks event loop during gallery rebuild; 1.2 second rebuild time noticeable in Archive API.
- Impact: Slow archive/restore operations; users see lag.
- Improvement path:
  - Use `fs.promises` for async I/O.
  - Cache parsed assets in memory.
  - Defer gallery rebuild to background job (async queue).
  - Implement incremental updates instead of full rebuild.

**Full HTML Gallery Rebuild on Each Asset Change:**
- Problem: Every archive/restore triggers full rebuild of 215KB gallery.html.
- Files: `build-gallery.js`, `api/src/admin-server.ts` (line 98-99)
- Cause: Gallery.html includes all asset metadata; no selective update.
- Impact: 5-10 second rebuild time for single asset change; inefficient bandwidth.
- Improvement path:
  - Split gallery into separate data JSON + minimal HTML.
  - Load asset list dynamically via fetch instead of embedding.
  - Use service worker to cache static assets.

**No Database for Job/Batch Storage:**
- Problem: Jobs stored in JSON file; no indexing, filtering, pagination support.
- Files: `api/data/jobs.json` (persistent), `api/src/job-manager.ts` (in-memory cache)
- Cause: File-based storage scales poorly; queries require full file read.
- Impact: Slow batch queries; hard to implement analytics; no concurrency control.
- Improvement path:
  - Migrate to SQLite for local dev; PostgreSQL for production.
  - Add indices on `status`, `createdAt`, `jobType`.
  - Implement TTL-based cleanup automatically.

**No Caching for LLM Review Results:**
- Problem: Same prompt/content reviewed multiple times generates separate API calls.
- Files: `api/src/content-generator.ts`
- Cause: No deduplication; auto-fix retries don't check previous failures.
- Impact: Wasted API quota; slower user experience.
- Improvement path:
  - Hash content (SHA256) and cache review results.
  - Implement per-module cache with TTL.
  - Skip review if score > 90 on previous run.

## Fragile Areas

**Scene Content Detection (Regex-Based):**
- Files: `api/src/llm/review.ts` (lines 54-56, 112-121)
- Why fragile: Uses regex `class=["'][^"']*\bscene\b[^"']*["']` to count scenes; breaks with:
  - CSS-in-JS styles (scene class in style attribute).
  - Custom `data-scene` attributes instead of `class`.
  - Minified HTML.
- Safe modification: Parse HTML as DOM tree (cheerio/jsdom); check for `id="*-scene"` pattern instead.
- Test coverage: Only tests with standard 7 `<section class="scene">` pattern.

**JSON Extraction Heuristics (Multiple Fallback Chains):**
- Files: `api/src/llm/json-utils.ts` (lines 52-118)
- Why fragile: `normalizeJsonPayload()` tries:
  1. Direct JSON parse
  2. Code fence extraction
  3. `{"files"` search
  4. `{"pass"` search
  5. First `{` to last `}`
- Safe modification: Add unit tests for each extraction path; document order and reasoning; add metrics for which path succeeds.
- Test coverage: `tests/api-review-output.test.js` only tests happy paths.

**Deterministic Review Rules (Hardcoded Thresholds):**
- Files: `api/src/llm/review.ts` (lines 138-181)
- Why fragile: Thresholds are magic numbers:
  - `uniqueWidths.size <= 3` for max-width consistency
  - `absoluteCount > 3` for absolute positioning warning
  - `z-index > 500` for sanity check
- Safe modification: Extract to configurable constants; document rationale for each threshold.
- Test coverage: Limited edge case testing for boundary conditions.

**Edu-Content Module Auto-Versioning:**
- Files: `api/src/content-generator.ts` (lines 59-88)
- Why fragile: `createModuleId()` increments `-v1`, `-v2` versions by parsing directory names. If naming convention breaks (spaces, special chars), versioning fails.
- Safe modification: Use advisory lock to prevent race conditions; validate version numbering in unit tests.
- Test coverage: No tests for concurrent module creation.

**Archive Path Construction (Manual String Building):**
- Files: `build-gallery.js` (line 44: `assetPath = "archive/${category}/${id}.${assetFormat}"`)
- Why fragile: String interpolation; assumes `category` and `id` are safe. No path normalization.
- Safe modification: Use `path.join()` for construction; validate category/id format before use.
- Test coverage: No tests for malicious category/id values.

## Scaling Limits

**Single-Process Job Queue:**
- Current capacity: ~10-20 concurrent jobs (depends on Z.ai API rate limits).
- Limit: Hits when multiple batch requests arrive simultaneously; jobs queue in memory.
- Scaling path:
  - Replace in-memory queue with Redis/RabbitMQ.
  - Implement multiple worker processes.
  - Add job priority system.

**Asset Gallery Size:**
- Current capacity: 160+ assets; gallery.html is 215KB uncompressed.
- Limit: Browser load time > 2s on slow networks; gallery becomes unwieldy at 1000+ assets.
- Scaling path:
  - Implement pagination/virtual scrolling.
  - Move to data JSON + dynamic rendering.
  - Use image lazy loading.

**Edu-Content Directory Flat Structure:**
- Current capacity: 20+ modules; directory listing gets slow.
- Limit: No metadata index; `getExistingModuleNames()` does full `fs.readdir()` on every module creation.
- Scaling path:
  - Create `edu-content/manifest.json` with module registry.
  - Add `created_at` index for sorting.
  - Implement module categories/subfolders.

## Dependencies at Risk

**Z.ai API Integration (Single Point of Failure):**
- Risk: All content generation depends on Z.ai (GLM-4.7/GLM-5); no fallback provider.
- Impact: Content generation unavailable if Z.ai is down; rate limit hits block all users.
- Migration plan:
  - Abstract LLM provider behind interface (done partially in `api/src/llm/provider.ts`).
  - Add fallback to Claude API, Grok, or other providers.
  - Implement retry strategy with provider rotation.

**Express + Express-WS (Outdated Pattern):**
- Risk: `express-ws` adds WebSocket support as middleware; maintained but not widely used.
- Impact: Potential security bugs; limited community support.
- Migration plan:
  - Move to `ws` library (simpler, more maintained).
  - Or migrate to `fastify` + `@fastify/websocket`.

**No TypeScript in Edu-Content Modules:**
- Risk: 800+ LOC JavaScript files in `edu-content/*/script.js` have zero type safety.
- Impact: Hard to refactor; easy to introduce bugs; no IDE support.
- Migration plan:
  - Consider using TypeScript for new modules.
  - Add JSDoc type hints to existing modules.
  - Implement linting rules to catch common mistakes.

## Missing Critical Features

**No Rate Limiting on API Endpoints:**
- Problem: `/api/generate`, `/api/review` have no rate limiting.
- Blocks: Users can spam requests; expensive API quota burnt quickly.
- Fix approach: Implement token bucket rate limiter; use IP-based or API key-based limits.

**No API Key Management UI:**
- Problem: Users must set `ZAI_API_KEY` in `.env` manually; no web UI to add/revoke keys.
- Blocks: Hard for non-technical users; no per-user quota tracking.
- Fix approach: Add admin panel for API key management; store keys hashed in database.

**No Batch Progress WebSocket Events:**
- Problem: Batch generation shows overall progress but not individual job progress.
- Blocks: UI can only poll; users see laggy updates.
- Fix approach: Broadcast individual job status changes via WebSocket to clients.

**No Module Search/Filter:**
- Problem: 20+ edu-content modules; no way to find by topic, grade, subject.
- Blocks: Hard to reuse existing modules; duplicate creation.
- Fix approach: Add metadata to module manifest; implement full-text search endpoint.

## Test Coverage Gaps

**API Error Handling Under Extreme Conditions:**
- What's not tested: Z.ai API returns partial JSON, network timeouts, 5xx errors.
- Files: `api/src/llm/zai-client.ts`, tests are in `tests/api-zai-client.test.js` (minimal).
- Risk: Production failures from edge cases not exercised in tests.
- Priority: High — error handling is critical path.

**Concurrent Module Creation:**
- What's not tested: Multiple requests create module with same name simultaneously.
- Files: `api/src/content-generator.ts` (lines 59-88 `createModuleId()`).
- Risk: Race condition; modules overwrite each other.
- Priority: High — affects data integrity.

**File Write Permission Checks:**
- What's not tested: Attempts to write outside `edu-content/` directory; symlink attacks.
- Files: `api/src/content-generator.ts` (lines 103-127).
- Risk: Security vulnerability; arbitrary file write.
- Priority: High — security issue.

**HTML Deterministic Review Edge Cases:**
- What's not tested: Minified HTML, nested scenes, unconventional scene markup.
- Files: `api/src/llm/review.ts` (lines 183-320 `evaluateDeterministicReview()`).
- Risk: False negatives; broken content passes validation.
- Priority: Medium — affects content quality.

**Build-Gallery Large Asset Lists:**
- What's not tested: Assets with 1000+ items; special characters in filenames.
- Files: `build-gallery.js`.
- Risk: Build time explosion; broken HTML.
- Priority: Medium — not immediate but limits scaling.

---

*Concerns audit: 2026-02-15*
