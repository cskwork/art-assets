# Architecture

**Analysis Date:** 2026-02-15

## Pattern Overview

**Overall:** Three-layer modular system for educational content generation and asset management

**Key Characteristics:**
- **Content Generation Pipeline**: Asynchronous job-based system that converts topic requests into complete 7-scene interactive HTML modules
- **Asset Management System**: Dual-format architecture (compact source → expanded JSON outputs) supporting flexible asset search and gallery presentation
- **LLM Integration**: Z.ai (GLM) API bridge with streaming support, output parsing, and multi-attempt review/fix cycles
- **Module Structure**: Standardized 7-scene HTML pattern with ContentApp singleton for state management and navigation
- **Review & Quality Gate**: Deterministic and LLM-based validation ensuring modules meet educational and technical requirements

## Layers

**Presentation/UI Layer:**
- Purpose: Interactive student-facing content and asset discovery interface
- Location: `edu-content/*/`, `gallery.html`, `admin-ui/`
- Contains: 7-scene HTML modules (index.html), styling (style.css), scene navigation (script.js), gallery interface
- Depends on: Asset index, styling framework, browser DOM APIs
- Used by: Students, educators, admin users viewing content in browsers

**Content Generation & Orchestration Layer:**
- Purpose: Manage job lifecycle, invoke LLM pipeline, handle asynchronous tasks, persist job state
- Location: `api/src/index.ts`, `api/src/job-manager.ts`, `api/src/batch-manager.ts`, `api/src/content-generator.ts`
- Contains: Job creation/tracking, request validation, module ID generation, job persistence, batch operations
- Depends on: LLM providers, prompt loader, file system, Node.js async APIs
- Used by: Admin server endpoints, batch processors, background job workers

**LLM Integration Layer:**
- Purpose: Interface with Z.ai API, stream responses, parse structured outputs, validate and fix content
- Location: `api/src/llm/`
- Contains: Z.ai client (streaming, thinking blocks), output parser (JSON extraction), review validator (deterministic checks), fix messages builder
- Depends on: HTTP/HTTPS clients, JSON utilities, review requirements
- Used by: Content generator for initial generation and multi-attempt fix cycles

**Asset Management Layer:**
- Purpose: Transform compact asset metadata into queryable indexes, build gallery UI, support search
- Location: `scripts/build-assets.js`, `build-gallery.js`, `assets-source.json` → outputs
- Contains: Asset expansion (compact→full format), category mapping, tag-based indexing, HTML gallery generation
- Depends on: File system, JSON parsing, assets-source.json
- Used by: Prompt loader (for asset references), gallery UI, LLM for asset context

**Prompt & Context Layer:**
- Purpose: Load and prepare system prompts, collect relevant assets, build LLM request context
- Location: `api/src/prompt-loader.ts`, `api/system-prompt/system.md`, `prompts/`
- Contains: System prompt loading, asset collection by subject keywords, prompt templating
- Depends on: Asset index, file system, subject keywords
- Used by: Content generator to build LLM messages

**Admin Server & API Layer:**
- Purpose: HTTP endpoints for content generation, review, job status, gallery operations
- Location: `api/src/admin-server.ts`
- Contains: Express routes, WebSocket handlers, Archive/Restore integration, job querying
- Depends on: Content generation layer, job manager, Express, file system
- Used by: Frontend applications, admin UI

## Data Flow

**Content Generation Flow (Happy Path):**

1. **Request Entry** (`POST /api/generate-content`)
   - Receive `GenerateContentRequest` (subject, topic, gradeLevel, contentType?, visualStyle?, etc.)
   - Validate request fields in `index.ts:validateGenerateContentRequest()`

2. **Job Creation** (`job-manager.ts:createJob()`)
   - Generate unique UUID
   - Store in memory Map with status='pending'
   - Persist to `api/data/jobs.json`
   - Return jobId to client

3. **Module ID Generation** (`content-generator.ts:createModuleId()`)
   - Format date: `YYYYMMDD`
   - Slugify topic (normalize, kebab-case)
   - Check for collision in `edu-content/` directory
   - Return formatted ID: `YYYYMMDD-topic-slug` or `YYYYMMDD-topic-slug-vN`
   - Create directory structure

4. **Asset Collection** (`prompt-loader.ts`)
   - Load `assets.json` and `8bit-assets/index.json`
   - Tokenize request (subject, topic, gradeLevel)
   - Score candidates based on path, description, tags
   - Select top K assets (max 10 core + 14 eight-bit)
   - Include with prompt context

5. **LLM Content Generation** (`content-generator.ts:generateContentForJob()`)
   - Build system prompt from `api/system-prompt/system.md`
   - Combine with subject-specific template from `prompts/{subject}.md`
   - Append asset context and request parameters
   - Stream request to Z.ai API via `llm/zai-client.ts`
   - Parse response with `llm/zai-output.ts` (extract JSON code blocks)
   - Extract files: `index.html`, `script.js`, `style.css`
   - Write to `edu-content/{moduleId}/`

6. **Job Status Update**
   - Update `status='completed'` in job store
   - Record file list: `['index.html', 'script.js', 'style.css']`
   - Broadcast via WebSocket to admin UI

**Review & Fix Flow (Optional Multi-attempt):**

1. **Review Request** (`POST /api/review-content`)
   - Receive `ReviewContentRequest` (moduleId, autoFix?, maxAttempts?)
   - Verify module exists in `edu-content/{moduleId}/`

2. **Deterministic Checks** (`llm/review.ts:evaluateDeterministicReview()`)
   - Parse HTML/CSS/JS files
   - Run checks: scene count (must = 7), references, language, responsive design, quiz, accessibility
   - Collect issues in `ReviewIssue[]`
   - Return early pass/fail (no LLM cost if deterministic checks fail)

3. **LLM Review** (if deterministic pass or autoFix requested)
   - Send files to Z.ai with review prompt
   - Parse review result: `ReviewResult` (pass, score, requirements, issues, summary)
   - If `autoFix=true` and score < threshold:
     - Build fix prompt with specific issues
     - Stream LLM fix attempt (up to maxAttempts)
     - Overwrite files with fixed versions
     - Re-run review loop

4. **Review Persistence**
   - Store result in job.review and job.reviewStatus
   - Persist to job store
   - Return to client with detailed feedback

**Asset Build & Gallery Flow:**

1. **Compact Source Load** (`scripts/build-assets.js`)
   - Read `assets-source.json` (compact format)

2. **Expansion**
   - For each asset in `source.assets[]`:
     - Extract format (explicit or default by category)
     - Generate path: `{category}/{id}.{format}`
     - Extract date from ID (YYYYMMDD)
     - Build full asset object

3. **Archive Merging**
   - Load `source.archived[]` (archived assets)
   - Expand with `isArchived: true`, `archivedDate`
   - Mark with archive path: `archive/{category}/{id}.{format}`

4. **Output Generation**
   - Write `assets.json` (full format for external reference)
   - Write `assets-index.json` (lightweight for LLM search)

5. **Gallery HTML Build** (`build-gallery.js`)
   - Load expanded `assets.json` + `source.archived[]`
   - Generate category tabs + grid layout
   - Include Archive/Restore buttons
   - Output `gallery.html`

**State Management:**

- **In-Memory**: Job Map in `job-manager.ts` (per-process state)
- **Persisted**: `api/data/jobs.json` (survives restarts)
- **Per-Module**: `ContentApp` singleton in generated modules (scene index, quiz state)
- **Cleanup**: Auto-expire jobs older than 7 days (configurable via `JOB_TTL_MS`)

## Key Abstractions

**Job (Polymorphic):**
- Purpose: Represents a long-running background task (generation or review)
- Files: `api/src/types.ts` (Job interface), `api/src/job-manager.ts` (store + lifecycle)
- Pattern: Type discriminator `jobType` ('generate' | 'review'), status progression: pending → processing → completed/failed
- Usage: Track async operations, enable async UI polling without blocking

**GenerateContentRequest / ReviewContentRequest:**
- Purpose: Type-safe input contracts for API endpoints
- Files: `api/src/types.ts`
- Pattern: Enums for allowed values (subjects, content types, visual styles, themes, difficulties)
- Validation: `validateGenerateContentRequest()` / `validateReviewContentRequest()` in `api/src/index.ts`

**ReviewResult / ReviewIssue:**
- Purpose: Structured quality feedback with severity levels and categorization
- Files: `api/src/types.ts`
- Pattern: Issues categorized (structure, content, visual, accessibility, interaction, accuracy), severity (high/medium/low)
- Severity used for prioritization; category used for grouping UI display

**ContentApp Singleton (Generated):**
- Purpose: State manager and scene navigator for interactive modules
- Pattern: Global object with properties (`currentScene`, `scenes[]`) and methods (`nextScene()`, `checkAnswer()`, `init()`)
- Location: Instantiated in `script.js` of generated modules
- Coupling: Tightly bound to 7-scene structure; decouples scene logic from HTML navigation

**Asset Candidate / Scoring:**
- Purpose: Search and rank assets for relevance to content request
- Files: `api/src/prompt-loader.ts`
- Pattern: Token-based keyword matching with weighted scoring (tags=4pts, path=3pts, description=2pts)
- Usage: Automatically inject relevant art assets into LLM prompt context

**Module ID (Semantic):**
- Purpose: Timestamped slug identifying unique content module
- Format: `YYYYMMDD-{slugified-topic}` or `YYYYMMDD-{slugified-topic}-vN`
- Generation: `content-generator.ts:createModuleId()` (collision detection)
- Usage: Maps to `edu-content/{moduleId}/` directory, enables reproducible output

## Entry Points

**Content Generation Endpoint:**
- Location: `api/src/admin-server.ts:POST /api/generate-content`
- Triggers: Admin UI form submission or REST API call
- Responsibilities: Validate input, create job, enqueue async generation, return jobId

**Review Endpoint:**
- Location: `api/src/admin-server.ts:POST /api/review-content`
- Triggers: After generation completes or manual review request
- Responsibilities: Validate module existence, run deterministic checks, optionally invoke LLM review, handle auto-fix

**Job Status Polling:**
- Location: `api/src/admin-server.ts:GET /api/status/{jobId}`
- Triggers: Admin UI polling on interval
- Responsibilities: Return current job state, review results, error details

**WebSocket Stream:**
- Location: `api/src/admin-server.ts:WS /ws`
- Triggers: Admin UI connects on load
- Responsibilities: Broadcast job updates in real-time (on-progress, on-complete, on-error)

**Gallery Server:**
- Location: `server.js` (legacy) or `api/src/admin-server.ts` (new)
- Serves: `gallery.html` at `/` or `/gallery`
- Triggers: User navigates to gallery URL
- Responsibilities: Serve static gallery UI, handle Archive/Restore POST requests with build trigger

**Asset Build CLI:**
- Location: `scripts/build-assets.js`
- Trigger: `npm run build` or `node build-gallery.js`
- Responsibilities: Expand compact asset source, generate indexes, persist outputs

## Error Handling

**Strategy:** Fail-safe with detailed error codes and multi-attempt recovery

**Patterns:**

- **Input Validation**: Early rejection with specific error codes (INVALID_SUBJECT, INVALID_REQUEST) before job creation
- **LLM Output Parsing**: Retry extraction logic; if multiple attempts fail, fallback to deterministic defaults or reject with clear message
- **Generation Failure**: Catch errors in `generateContentForJob()`, update job status to 'failed', log error message
- **Review Failure**: Deterministic checks execute first (no LLM cost); if LLM review errors, treat as soft failure and surface to UI with partial feedback
- **Job Persistence**: Errors during file write caught and logged; job still marked as completed (with error field)
- **Asset Loading**: Graceful degradation if asset files missing; generation continues without specific assets, LLM adapts

**Error Response Structure** (from `types.ts`):
```typescript
interface ErrorResponse {
  success: false;
  error: string;      // User-friendly message
  code: ErrorCode;    // Machine-readable: INVALID_REQUEST, JOB_NOT_FOUND, etc.
}
```

## Cross-Cutting Concerns

**Logging:**
- Framework: Custom `logger.ts` with tags (LogTag enum)
- Pattern: `log(message, tag)` with optional data payload
- Output: Console + optional file appending
- Levels: INFO (default), DEBUG (on env flag), ERROR (always)
- Usage: Content generation progress, LLM request/response, asset scoring

**Validation:**
- Location: `api/src/index.ts` (validateGenerateContentRequest, validateReviewContentRequest)
- Pattern: Sync validation with early return `{ ok: false, code }` or `{ ok: true, value: normalized }`
- Length checks: topic ≤ 200 chars, gradeLevel ≤ 100 chars
- Enum validation: subject ∈ predefined list, contentType ∈ predefined list, etc.
- Coercion: Trim strings, default optional booleans to false

**Authentication:**
- Current: None (assuming trusted admin context)
- Future: Would layer JWT/basic auth in `admin-server.ts` middleware

**Concurrency:**
- Job store: In-memory Map (not thread-safe in true multiprocessing, but safe in Node.js single-threaded event loop)
- File writes: Use `fs.promises` (async, no blocking)
- LLM requests: Streamed via HTTP (non-blocking)
- Cleanup: Periodic timer runs job expiry scan

**Asset Path Normalization:**
- Pattern: Convert backslashes to forward slashes (Windows compatibility)
- Applied in: `prompt-loader.ts`, gallery builder
- Reason: Asset references in prompts and links must be URL-safe

---

*Architecture analysis: 2026-02-15*
