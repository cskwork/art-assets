# Technology Stack

**Analysis Date:** 2026-02-15

## Languages

**Primary:**
- TypeScript 5.6.3 - Backend API services (Node.js) in `api/src/`
- JavaScript - Build scripts, server configuration, frontend module generation
- HTML5 - Educational content modules generated dynamically
- CSS3 - Styling for generated modules and gallery UI

**Secondary:**
- JSON - Asset metadata, configuration files, job persistence

## Runtime

**Environment:**
- Node.js (version unspecified, compatible with ES2020)

**Package Manager:**
- npm (lockfile present: api/package-lock.json)

## Frameworks

**Core:**
- Express.js 4.22.1 - REST API server (backend)
- express-ws 5.0.2 - WebSocket support for real-time job updates
- dotenv 17.2.3 / 16.4.5 - Environment variable loading

**Build/Dev:**
- TypeScript 5.6.3 - Compiler for backend code
- concurrently 9.2.1 - Parallel task runner (build + dev server)

**3D/Graphics Libraries (used in generated content):**
- Three.js 0.182.0 - 3D visualization (installed in root, used by generated modules)
- @gltf-transform/core 4.3.0 - GLB/GLTF model transformation
- @gltf-transform/extensions 4.3.0 - Extended GLTF format support

**Testing:**
- Node.js built-in test runner (test command via "node --test")

## Key Dependencies

**Critical:**
- @anthropic-ai/claude-agent-sdk 0.2.19 - Claude AI integration for content generation (can use Claude Sonnet 4.5 or custom models)
- cors 2.8.6 - Cross-origin request handling

**Infrastructure:**
- @types/node 20.17.5 - Node.js type definitions
- @types/express 5.0.6 - Express framework types
- @types/express-ws 3.0.6 - WebSocket types
- @types/cors 2.8.19 - CORS types

## Configuration

**Environment:**
- Configuration file: `.env` (present, not committed)
- Example reference: `.env.example`
- Key env vars:
  - `LLM_PROVIDER`: 'zai' or 'claude' (default: 'zai')
  - `ZAI_API_KEY`: Z.ai GLM API authentication
  - `ANTHROPIC_API_KEY` / `ANTHROPIC_AUTH_TOKEN`: Claude API credentials (alternative)
  - `PROJECT_ROOT`: Root directory path (defaults to cwd)
  - `JOB_STORE_PATH`: Path to jobs.json persistence file
  - `ADMIN_PORT` / `PORT`: Server port (default: 3000)
  - `LLM_LOGGING_ENABLED`: Debug logging for LLM calls
  - `LLM_REVIEW_ENABLED`: Enable quality review pipeline
  - `LLM_REVIEW_AUTO_FIX_ENABLED`: Auto-fix issues detected in review
  - `LLM_REVIEW_AUTO_FIX_MAX_ATTEMPTS`: Max retries for auto-fix (1-3)
  - `WS_ENABLED`: WebSocket support for real-time updates (default: true)
  - `JOB_TTL_MS`: Job expiration time in milliseconds

**Build:**
- `package.json` scripts:
  - `npm run dev`: Concurrent TypeScript watch + admin-server start
  - `npm run build`: Full build (api + gallery)
  - `npm start`: Run admin server only
  - `npm test`: Node.js test runner

## Platform Requirements

**Development:**
- Node.js with ES2020 support
- npm for dependency management
- Bash/shell for build scripts (cross-platform via scripts)

**Production:**
- Node.js runtime
- Environment variables for API keys and configuration
- File system write access for job persistence and module generation

---

*Stack analysis: 2026-02-15*
