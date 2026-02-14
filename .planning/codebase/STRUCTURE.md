# Codebase Structure

**Analysis Date:** 2026-02-15

## Directory Layout

```
art-assets/
├── api/                           # Content generation API (Express server + LLM integration)
│   ├── src/                       # TypeScript source (builds to dist/)
│   │   ├── admin-server.ts        # Express HTTP + WebSocket server
│   │   ├── index.ts               # Public API (generate/review job creation)
│   │   ├── types.ts               # TypeScript interfaces (Request/Response/Job)
│   │   ├── content-generator.ts   # LLM pipeline orchestrator
│   │   ├── job-manager.ts         # In-memory + persisted job store
│   │   ├── batch-manager.ts       # Batch generation orchestrator
│   │   ├── prompt-loader.ts       # Asset search + prompt building
│   │   ├── logger.ts              # Logging utilities
│   │   ├── default-topics.ts      # Predefined topic suggestions
│   │   ├── llm/                   # Z.ai API integration
│   │   │   ├── zai-client.ts      # Z.ai HTTP client (streaming, thinking blocks)
│   │   │   ├── zai-output.ts      # JSON/file extraction from LLM response
│   │   │   ├── json-utils.ts      # JSON parsing robustness helpers
│   │   │   ├── review.ts          # Deterministic + LLM review validators
│   │   │   └── provider.ts        # LLM provider interface (extensible)
│   │   └── system-prompt/
│   │       └── system.md          # Master system prompt for content generation
│   ├── dist/                      # Compiled JavaScript (output of tsc)
│   ├── data/                      # Runtime data
│   │   └── jobs.json              # Persisted job store (auto-created)
│   ├── node_modules/              # npm dependencies
│   ├── package.json               # API dependencies (Express, dotenv, TypeScript)
│   ├── tsconfig.json              # TypeScript compiler config
│   └── test-zai.js                # Manual Z.ai integration test script
│
├── edu-content/                   # Generated interactive content modules (7-scene structure)
│   ├── 20260126-box-volume/       # Example: 직육면체 부피 (Elementary 6th grade)
│   │   ├── index.html             # 7 scene sections + HTML structure
│   │   ├── script.js              # ContentApp singleton, scene logic, interactions
│   │   └── style.css              # Responsive layout, 7-scene styles, animations
│   ├── 20260126-comparative-adjectives/
│   ├── 20260127-pythagorean-3d/   # Three.js 3D module
│   ├── 20260128-multiplication-racing/ # Phaser 2D game module
│   ├── 20260209-world-quiz-battle/    # Canvas-based game module
│   └── [YYYYMMDD-topic]*/         # Pattern: YYYYMMDD-{slugified-topic}(-vN)?
│
├── admin-ui/                      # Admin interface (content generation form + gallery)
│   ├── index.html                 # Admin form for batch/single content generation
│   ├── app.js                     # Admin UI logic (form handling, WebSocket subscription)
│   └── [styles]                   # Inline or linked styles
│
├── assets-source.json             # Compact source format (MANUAL EDIT HERE)
│   # Format: {v, updated, categories, assets[], archived[]}
│   # assets: [id, category, tags[], description, format?, dimensions?]
│   # archived: [..., archivedDate]
│
├── assets.json                    # Full asset index (auto-generated from source)
│   # Used by: external references, gallery builder, LLM prompt context
│   # DO NOT EDIT - rebuilt by scripts/build-assets.js
│
├── assets-index.json              # Lightweight LLM search index (auto-generated)
│   # Format: {v, stats, assets[{id, c, t, d}]}
│   # Used by: prompt-loader for token-based asset matching
│   # DO NOT EDIT - rebuilt by scripts/build-assets.js
│
├── icons/                         # SVG icons
│   ├── icon-*.svg                 # Naming: icon-{name}-{color?}-{date}.svg
│   └── [archive/icons/]           # Archived icons (moved via scripts/archive.js)
│
├── illustrations/                 # SVG illustrations
│   ├── illust-*.svg
│   └── [archive/illustrations/]
│
├── diagrams/                      # SVG diagrams and charts
│   ├── diagram-*.svg
│   └── [archive/diagrams/]
│
├── backgrounds/                   # PNG/JPG backgrounds
│   ├── bg-*.png
│   └── [archive/backgrounds/]
│
├── photos/                        # JPG photos
│   ├── photo-*.jpg
│   └── [archive/photos/]
│
├── 3d/                            # 3D models (GLB/GLTF)
│   ├── 3d-*.glb
│   ├── elementary-volume/         # Pre-built 3D scenes (legacy)
│   └── [archive/3d/]
│
├── archive/                       # Archived assets (by category)
│   ├── icons/                     # Old/unused icons
│   ├── illustrations/
│   ├── diagrams/
│   ├── backgrounds/
│   ├── photos/
│   └── 3d/
│
├── content/                       # Legacy science content (pre-edu-content)
│   └── science/
│       └── 2026-01-27/
│           ├── moon-phases/
│           ├── newtons-laws/
│           └── [other topics]/
│
├── prompts/                       # Subject-specific generation prompts
│   ├── math.md                    # Math content guidelines + examples
│   ├── english.md                 # English content guidelines + examples
│   ├── science.md                 # Science content guidelines + examples
│   ├── 3d-content.md              # Three.js 3D module templates
│   ├── math-8bit-quest.md         # 8-bit asset themed content
│   └── [other subjects]/
│
├── scripts/                       # Build and CLI utilities
│   ├── build-assets.js            # Compact → assets.json + assets-index.json
│   ├── archive.js                 # CLI: archive/restore assets, module file
│   ├── backfill-jobs.js           # Utility: migrate old job data
│   ├── import-8bit-assets.js      # Utility: import 8bit-assets directory index
│   └── migrate-to-compact.js      # 1-time migration (source only format)
│
├── build-gallery.js               # Gallery builder (runs build-assets then gen HTML)
│   # Outputs: gallery.html
│
├── gallery.html                   # Asset gallery UI (auto-generated, ~214KB)
│   # Static HTML with inline JS for filtering, Archive/Restore UI
│
├── server.js                      # Legacy gallery server (HTTP + Archive/Restore API)
│   # Being migrated into api/src/admin-server.ts
│
├── package.json                   # Root monorepo package.json
│   # scripts: dev, build, start, test
│   # Main entry: build-gallery.js
│
├── .env                           # Runtime configuration (NOT committed, .env.example provided)
│   # Keys: Z_AI_API_KEY, PROJECT_ROOT, ADMIN_PORT, ASYNC_JOBS_ENABLED, etc.
│
├── .env.example                   # Template for required env vars
│
├── CLAUDE.md                      # LLM instruction guide (Korean, comprehensive)
│
├── AGENTS.md                      # Agent definitions (legacy reference)
│
├── .git/                          # Git repository
│
├── .omc/                          # GSD state (OpenMC sessions, checkpoints)
│
├── .planning/
│   └── codebase/                  # Analysis documents (you are here)
│       ├── ARCHITECTURE.md
│       ├── STRUCTURE.md
│       ├── [CONVENTIONS.md]
│       ├── [TESTING.md]
│       └── [CONCERNS.md]
│
└── 8bit-assets/                   # Pre-built pixel art asset packs (external library)
    ├── Assets/                    # Organized by pack name
    │   ├── Packs/Gothicvania Cemetery/
    │   │   └── Phaser Demo/        # Example Phaser game integration
    │   └── [other packs]
    └── index.json                 # Asset catalog (indexed by import script)
```

## Directory Purposes

**api/src/**
- Purpose: Content generation backend in TypeScript
- Contains: All API logic, LLM integration, job management, prompt loading
- Key files: `admin-server.ts` (HTTP entry), `content-generator.ts` (pipeline), `llm/zai-client.ts` (LLM bridge)
- Compiles to: `api/dist/` (JavaScript)

**api/system-prompt/**
- Purpose: Master system prompt for LLM content generation
- Contains: Single file `system.md` with role definition, content philosophy, 7-scene structure, guidelines
- Usage: Loaded by `prompt-loader.ts`, combined with subject-specific prompts and request context
- Language: English (system instructions), but output is Korean educational content

**api/data/**
- Purpose: Runtime data storage (jobs.json created on first run)
- Contains: Job store with all metadata, status, review results, errors
- Cleanup: Auto-expiry jobs older than 7 days (configurable)
- Persistence: File-based JSON (survives server restarts)

**edu-content/**
- Purpose: Generated interactive content (7-scene modules)
- Contains: Subdirectories following pattern `YYYYMMDD-{topic}(-vN)?`
- Each module has: `index.html` (structure), `script.js` (logic), `style.css` (styling)
- 7 Scenes: Hook → Anchor → Story → Core → Visualize → Quiz → Wrap
- ContentApp singleton manages navigation and state

**admin-ui/**
- Purpose: Web interface for content generation and batch operations
- Contains: HTML form, WebSocket subscription logic
- Entry point: Served by `api/src/admin-server.ts:GET /`
- Features: Topic input, subject/grade/content-type selectors, batch generation, job status polling, WebSocket real-time updates

**assets-source.json**
- Purpose: Single source of truth for assets (compact, human-editable format)
- Format:
  ```json
  {
    "v": "2.0.0",
    "updated": "2026-02-15",
    "categories": { "icons": { "d": "...", "f": "svg" }, ... },
    "assets": [
      ["id", "category", ["tag1", "tag2"], "description", "format?", [width, height]?],
      ...
    ],
    "archived": [
      ["id", "category", ["tags"], "description", "format?", [dims]?, "2026-01-26"]
    ]
  }
  ```
- Editing: Direct JSON edit, then run `npm run build`
- Output: Generates `assets.json` (full) and `assets-index.json` (lightweight)

**assets.json & assets-index.json**
- Purpose: Built artifacts (DO NOT EDIT directly)
- assets.json: Full format with paths, all metadata (for external tools)
- assets-index.json: Lightweight search index (compact keys: c=category, t=tags, d=description)
- Rebuilt by: `scripts/build-assets.js` (invoked by `build-gallery.js` and npm build scripts)

**icons/, illustrations/, diagrams/, backgrounds/, photos/, 3d/**
- Purpose: Art asset storage by category
- Naming: `{category}-{name}(-{variant})?-{YYYYMMDD}.{ext}`
- Example: `icon-checkmark-green-20260124.svg`, `photo-classroom-wide-20260126.jpg`
- Archived versions: Moved to `archive/{category}/` via `scripts/archive.js`
- Paths: Referenced in `assets-source.json` or as relative paths in modules

**prompts/**
- Purpose: Subject-specific generation templates and guidelines
- Contains: `math.md`, `english.md`, `science.md`, etc.
- Format: Markdown with example scenarios, educational objectives, content patterns
- Usage: Loaded by `prompt-loader.ts`, appended to LLM request for domain-specific guidance

**scripts/**
- build-assets.js: Expand compact source → full format + lightweight index
- archive.js: CLI tool to archive/restore assets (moves files, updates source.json)
- backfill-jobs.js: Data migration for old job formats
- import-8bit-assets.js: Index 8bit-assets directory (legacy support)
- migrate-to-compact.js: 1-time conversion of old assets.json to compact format

**build-gallery.js & gallery.html**
- build-gallery.js: Orchestrator script that runs build-assets.js then generates gallery.html
- gallery.html: Static HTML gallery UI (~214KB inline) with tabs (by category), Archive/Restore buttons
- Output: Self-contained, requires no build step to serve
- Integration: Served by `api/src/admin-server.ts` or legacy `server.js`

## Key File Locations

**Entry Points:**

| File | Purpose | Port/URL |
|------|---------|----------|
| `api/src/admin-server.ts` | Main Express server (HTTP + WS) | Port 3000 (configurable) |
| `api/src/index.ts` | Core API exports (generation/review functions) | - (imported by admin-server.ts) |
| `build-gallery.js` | Gallery build orchestrator | CLI (npm run build) |
| `server.js` | Legacy gallery server | Port 3000 (old approach) |

**Configuration:**

| File | Purpose |
|------|---------|
| `.env` | Runtime env vars (Z_AI_API_KEY, PROJECT_ROOT, ADMIN_PORT, JOB_TTL_MS, etc.) |
| `.env.example` | Template with required keys |
| `api/tsconfig.json` | TypeScript compiler options |
| `package.json` | Root monorepo scripts |
| `api/package.json` | API-specific dependencies |
| `api/system-prompt/system.md` | Master LLM system prompt |

**Core Logic:**

| File | Purpose | Key Exports |
|------|---------|-------------|
| `api/src/content-generator.ts` | LLM pipeline, file writing | `generateContentForJob()`, `createModuleId()` |
| `api/src/job-manager.ts` | Job store lifecycle | `createJob()`, `getJob()`, `updateJob()` |
| `api/src/prompt-loader.ts` | Asset search + prompt building | `buildPrompt()` |
| `api/src/llm/zai-client.ts` | Z.ai HTTP streaming | `streamZaiChat()` |
| `api/src/llm/review.ts` | Content validation | `evaluateDeterministicReview()`, `buildReviewMessages()` |

**Testing:**

| File | Purpose |
|------|---------|
| `api/test-zai.js` | Manual Z.ai integration test (run with `node test-zai.js`) |
| (No unit test files currently) | Future: add Jest/Vitest config |

## Naming Conventions

**Files:**

| Pattern | Example | Context |
|---------|---------|---------|
| `{category}-{name}-{date}.{ext}` | `icon-checkmark-green-20260124.svg` | Assets in categories |
| `YYYYMMDD-{topic}(-vN)?` | `20260126-box-volume`, `20260126-box-volume-v2` | edu-content module directories |
| `{subject}.md` | `math.md`, `english.md` | Prompt templates in prompts/ |
| `admin-server.ts` | Main Express app | PascalCase for class-like modules |
| `content-generator.ts` | Orchestrator module | kebab-case for utility modules |

**Directories:**

| Pattern | Example | Context |
|---------|---------|---------|
| `api/src/llm/` | LLM integration layer | Functional grouping |
| `edu-content/` | Generated modules | YYYYMMDD-topic structure |
| `archive/{category}/` | Archived assets | Matches active category folders |
| `content/` | Legacy pre-dated content | Deprecation marker |

## Where to Add New Code

**New Content Generation Feature:**
- **Logic**: `api/src/content-generator.ts` (modify `generateContentForJob()`)
- **Types**: `api/src/types.ts` (add new enum or interface)
- **Validation**: `api/src/index.ts` (update validateGenerateContentRequest())
- **Prompt context**: `api/src/prompt-loader.ts` (extend asset selection)
- **System guidance**: `api/system-prompt/system.md` (add role/guidelines)

**New Subject-Specific Content:**
- **Templates**: Create `prompts/{subject}.md` following `prompts/math.md` pattern
- **Assets**: Add to categories (icons/, diagrams/, etc.), then update `assets-source.json`
- **Subjects enum**: Update `Subject` type in `api/src/types.ts`
- **Keywords**: Update `SUBJECT_KEYWORDS` in `api/src/prompt-loader.ts`

**New Educational Module (Manually):**
- **Directory**: Create `edu-content/YYYYMMDD-{topic}/`
- **Files**: Add `index.html`, `script.js`, `style.css`
- **Structure**: Follow 7-scene pattern from `edu-content/20260126-box-volume/`
- **ContentApp**: Instantiate singleton in `script.js`, implement scene navigation

**Admin UI Enhancement:**
- **HTML**: `admin-ui/index.html` (add form fields)
- **Logic**: `admin-ui/app.js` (handle form submission, WebSocket events)
- **API**: Extend endpoints in `api/src/admin-server.ts`

**New Validation Rule (Review):**
- **Check logic**: `api/src/llm/review.ts` (add function checkXxx())
- **Integration**: Add key to `REVIEW_REQUIREMENT_KEYS` constant
- **Types**: Update `DeterministicReviewResult` interface in `api/src/types.ts`

**Asset Category Extension:**
- **Add category**: `assets-source.json:categories[newCategory]`
- **Create folder**: `{newCategory}/`
- **Update build**: `scripts/build-assets.js:categoryFolders` mapping
- **Update archive**: Create `archive/{newCategory}/`

**New LLM Provider (if replacing Z.ai):**
- **Interface**: Create `api/src/llm/{provider}-client.ts`
- **Export**: `getLlmProvider()` in `api/src/llm/provider.ts`
- **Usage**: Content generator calls generic provider interface (Future: if abstracted)

## Special Directories

**api/dist/**
- Purpose: Compiled JavaScript output from TypeScript
- Generated: `npm run build` or `npm run build:watch`
- Committed: No (in .gitignore)
- Usage: Executed by Node.js runtime (admin-server.js entry point)

**api/data/**
- Purpose: Runtime job store persistence
- Generated: Automatically on first job creation
- Committed: No (runtime data)
- Contains: jobs.json (JSON array of job records)

**api/node_modules/**
- Purpose: npm dependencies
- Generated: `npm install` in api/ directory
- Committed: No (in .gitignore)
- Key packages: express, cors, express-ws, dotenv, @anthropic-ai/claude-agent-sdk

**.planning/codebase/**
- Purpose: Analysis documents (auto-generated by GSD /gsd:map-codebase)
- Committed: Yes (reference for developers)
- Contents: ARCHITECTURE.md, STRUCTURE.md, CONVENTIONS.md, TESTING.md, CONCERNS.md

**.omc/ & .claude/**
- Purpose: GSD orchestration state
- Committed: Yes (workflow tracking)
- Files: Session logs, checkpoints, memory state

**8bit-assets/**
- Purpose: External pre-built pixel art assets (imported library)
- Source: External repository or asset pack
- Usage: Referenced as fallback assets in prompts, indexed by `import-8bit-assets.js`

---

*Structure analysis: 2026-02-15*
