# ZhiZhi — Archived Project Overview

This is an English rendering of the earlier project README, retained for development context. For the current portfolio package, begin with the root [README](../README.md) and [Local Setup Guide](LOCAL_SETUP.md).

ZhiZhi helps student journalists locate leads in interview transcripts, public reports, and background materials:

**Import sources → semantic retrieval → streamed answers with citations → original-source verification.**

It supports source discovery. Cross-checking, further interviews, and independent verification remain part of the reporting process.

## Core capabilities

### Retrieval and verification

- Import PDF, DOCX, TXT, and Markdown documents, individually or in batches.
- Receive upload progress through Server-Sent Events (SSE).
- Create local embeddings with `bge-small-zh-v1.5`, using 512-dimensional vectors and CPU-compatible inference.
- Choose a DeepSeek API answer mode or local Mock mode without an API key.
- Inspect citations identifying source documents and passages.
- Read answers as they stream into the conversation.

### Accounts and permissions

- SQLite user storage with SHA-256 and salted password hashes.
- Administrator and user roles.
- User-specific bookmarks, conversation history, and runtime RAG-mode preferences.
- SQLite-backed session tokens and cleanup of old sessions.

The earlier README described a 24-hour session lifetime. See `backend/app/core/user_store.py` for the actual validation and cleanup behavior.

### Conversations and sources

- Persistent conversation history.
- Saved answers with view and delete actions.
- Upload, preview, replacement, and deletion of sources, with confirmation dialogs.
- Passage previews and keyword highlighting.

### Administration

- Process ID, uptime, model status, and document count.
- Backend restart and shutdown controls with confirmation dialogs.
- A terminal-style log view refreshed periodically.

### Interface

- A restrained neutral palette, Gunmetal actions, and system typography.
- Translucent material layers and backdrop blur.
- Login transitions, message entrances, and press feedback.
- Chinese/English interface settings and light/dark appearance.
- Toast feedback and an error-boundary fallback.

## Views

| View | Main interaction |
| --- | --- |
| Login | Brand mark and centered sign-in form |
| Research Q&A | Streamed answers, citations, and bookmarks |
| Knowledge base | Batch import, preview, and document-management dialogs |
| System | Status, controls, and logs |
| Settings | Interface language and appearance |
| User menu | Account identity, role, and logout |

## Earlier launch options

The earlier README suggested Docker and background-service scripts:

```bash
docker compose up --build
```

```bash
bash scripts/build.sh
bash scripts/server.sh start
```

These commands are retained here as historical reference. The packaged installation workflow also requires backend dependency installation, a root `.env` file, and an explicit embedding-model download. Follow [LOCAL_SETUP.md](LOCAL_SETUP.md) for complete steps. Docker and Windows launch workflows were not revalidated during packaging.

## Local demo accounts

| Role | Username | Password |
| --- | --- | --- |
| Administrator | `admin` | `666666` |
| User | `user` | `123456` |

These are local demonstration credentials. The earlier README cautioned against exposing a service publicly with its default credentials and authentication setup.

## Answer modes

| Mode | Behavior | External generation service | API key |
| --- | --- | --- | --- |
| Mock local | Retrieves source passages and organizes an extractive answer using rules | Not required after local setup | Not required |
| AI search | Requests an answer from DeepSeek using retrieved passages as context | Required | Required |

Mode switching is available in the sidebar. Runtime preferences are stored per user. Initial dependency and model downloads require internet access even when using Mock mode.

## Technology stack

| Layer | Technology |
| --- | --- |
| Web service | FastAPI and Uvicorn |
| Embeddings | sentence-transformers and BAAI/bge-small-zh-v1.5 |
| Vector storage | Persistent ChromaDB |
| Answer generation | DeepSeek API or Mock passage matching |
| User data | SQLite |
| Frontend | React 18, TypeScript, Vite, Tailwind CSS |
| Visual system | Neutral grays, Gunmetal treatments, OKLCH colors, and system fonts |

## Source layout

```text
backend/app/
  api/          Authentication, document, Q&A, configuration, bookmark, and system routes
  core/         Answer generation, embeddings, vector storage, parsing, and chunking
  models/       Pydantic schemas
  utils/        Shared file utilities
frontend/src/
  components/   Application views and reusable controls
  hooks/        API, configuration, and conversation state
  styles/       Global styles, themes, and animations
  appSettings.tsx     Shared language and theme state
  uiTranslations.ts   Additional interface translations
scripts/        Build and service scripts
DESIGN.md       Design-system reference
PRODUCT.md      Product direction
SPEC.md         Earlier authentication specification
```

## License statement

The earlier README states MIT. See [TECHNICAL_REFERENCE.md](TECHNICAL_REFERENCE.md) for the package's reference-code and license notes.
