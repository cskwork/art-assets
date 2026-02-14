# External Integrations

**Analysis Date:** 2026-02-15

## APIs & External Services

**LLM Providers (for content generation):**
- Z.ai (GLM) API - Primary LLM for generating educational content
  - SDK/Client: Custom HTTP client in `api/src/llm/zai-client.ts`
  - Endpoint: `https://api.z.ai/api/paas/v4/chat/completions`
  - Auth: `ZAI_API_KEY` environment variable (Bearer token)
  - Models supported: glm-4.7 (default), glm-5 (with thinking blocks)
  - Timeout: 600 seconds (10 minutes)
  - Max tokens: 65536

- Anthropic Claude API - Alternative LLM provider
  - SDK: @anthropic-ai/claude-agent-sdk 0.2.19
  - Auth: `ANTHROPIC_API_KEY` or `ANTHROPIC_AUTH_TOKEN` environment variables
  - Model: claude-sonnet-4-5 (default, configurable)
  - Provider selection: `LLM_PROVIDER` env var ('claude' or 'zai')
  - Use case: Agentic content generation with file operations (Read, Write, Glob tools)

## Data Storage

**Databases:**
- File-based JSON storage (no external database)
  - Job store: `api/data/jobs.json` (in-memory with persistence)
    - Connection: Local file system
    - Format: JSON array with job records
    - TTL: 7 days (configurable via `JOB_TTL_MS`)
  - Batch store: `api/data/batches.json` (batch generation tracking)
  - Assets metadata: `assets.json` (built from `assets-source.json`)
  - Assets index: `assets-index.json` (LLM-friendly search index)

**File Storage:**
- Local filesystem only
  - Generated modules: `edu-content/{YYYYMMDD}-{module-id}/`
  - Assets: `icons/`, `illustrations/`, `backgrounds/`, `diagrams/`, `photos/`, `3d/`, `archive/`
  - Snapshots: Stored as archive entries with dated snapshots

**Caching:**
- None (in-memory job map with periodic cleanup)

## Authentication & Identity

**Auth Provider:**
- Custom (API key-based)
  - Implementation: Bearer token in Authorization header
  - Providers:
    - Z.ai: `ZAI_API_KEY` as Bearer token
    - Claude: `ANTHROPIC_API_KEY` or `ANTHROPIC_AUTH_TOKEN`
  - No user authentication system (server-to-server only)

## Monitoring & Observability

**Error Tracking:**
- None (custom logging only)

**Logs:**
- Console logging (stdout/stderr)
- Optional structured logging for LLM calls via `LLM_LOGGING_ENABLED`
- Log tags: 'GEN', 'REVIEW', 'FIX', 'ERROR', 'WRITE', 'INIT', 'ISSUE', 'DONE'
- Location: `api/src/logger.ts` (enableLogging function)

## CI/CD & Deployment

**Hosting:**
- Self-hosted Node.js server
- Port: Configurable (default 3000)
- Entry point: `api/dist/admin-server.js` (compiled TypeScript)

**CI Pipeline:**
- None detected (no GitHub Actions, Jenkins, etc.)
- Manual build: `npm run build`

## Environment Configuration

**Required env vars for production:**
- `ZAI_API_KEY` or `ANTHROPIC_API_KEY` / `ANTHROPIC_AUTH_TOKEN` (one of these)
- `LLM_PROVIDER` (optional, default: 'zai')
- `PROJECT_ROOT` (optional, defaults to cwd)
- `ADMIN_PORT` (optional, default: 3000)

**Optional env vars:**
- `LLM_LOGGING_ENABLED` (false by default)
- `LLM_REVIEW_ENABLED` (false by default - explicit opt-in)
- `LLM_REVIEW_PROVIDER` (zai only, required if review enabled)
- `LLM_REVIEW_AUTO_FIX_ENABLED` (false by default)
- `LLM_REVIEW_AUTO_FIX_MAX_ATTEMPTS` (1-3, default 1)
- `LLM_REVIEW_BLOCK_ON_FAIL` (true by default)
- `WS_ENABLED` (true by default)
- `JOB_TTL_MS` (default 7 days = 604800000ms, set to 0 to disable expiration)
- `JOB_STORE_PATH` (defaults to `api/data/jobs.json`)
- `CLAUDE_MODEL` (if using Claude, default: 'claude-sonnet-4-5')
- `CLAUDE_MAX_TURNS` (default: 10)
- `CLAUDE_PERMISSION_MODE` ('default', 'acceptEdits', 'bypassPermissions')

**Secrets location:**
- `.env` file (git-ignored)
- Reference template: `.env.example`

## Webhooks & Callbacks

**Incoming:**
- None (all APIs are request-response)

**Outgoing:**
- WebSocket broadcasts for job status updates (real-time)
  - Endpoint: `ws://localhost:{PORT}/ws`
  - Messages: Job creation, status changes
  - Clients: Admin UI, connected browsers

## API Endpoints (Internal)

**Content Generation:**
- `POST /api/generate-content` - Create content generation job
- `GET /api/generate-content/status/:jobId` - Check job status
- `POST /api/review-content` - Create review job for module
- `GET /api/review-content/status/:jobId` - Check review status

**Admin APIs:**
- `GET /api/admin/config` - Configuration options (subjects, content types, grades, etc.)
- `GET /api/admin/jobs` - List all jobs with status
- `POST /api/admin/batch-generate` - Batch create multiple content modules
- `GET /api/admin/batch/:batchId` - Check batch status
- `GET /api/admin/assets` - Asset index (assets-index.json)
- `GET /api/admin/prompts` - Available prompt templates

**Asset Management:**
- `POST /api/archive/:assetId` - Archive an asset
- `POST /api/restore/:assetId` - Restore archived asset

## Integration Points in Codebase

**LLM Client:**
- Location: `api/src/llm/zai-client.ts`
- Handles: HTTP streaming, SSE parsing, timeout management, response validation
- Models: Supports GLM-4.7, GLM-5 (with thinking blocks), extensible

**Prompt Management:**
- Location: `api/src/prompt-loader.ts`
- Loads: Markdown prompt templates from `prompts/` directory
- Formats: Dynamic prompt building with context variables

**Content Parser:**
- Location: `api/src/llm/zai-output.ts`
- Parses: JSON or Markdown code blocks from LLM responses
- Validates: File structure, allowed extensions (html, css, js, svg, png, jpg)

**Review System:**
- Location: `api/src/llm/review.ts`
- Deterministic checks: Scene count, responsive design, interactive elements, accessibility
- LLM review: Quality scoring, issue detection, auto-fix suggestions
- Flow: Generate → Review → Auto-fix (optional) → Validate

---

*Integration audit: 2026-02-15*
