# Technical Reference

## Project information

- Project: ZhiZhi
- Author: Liu Yan
- Purpose: traceable research Q&A for student journalists.
- Package prepared: October 26, 2026.
- English documentation updated: October 27, 2026.

## Technology stack

| Layer | Technologies |
| --- | --- |
| Interface | React 18, TypeScript, Vite, Tailwind CSS |
| Service | Python, FastAPI, Uvicorn |
| Semantic retrieval | sentence-transformers, BAAI/bge-small-zh-v1.5, ChromaDB |
| Answers | Local Mock mode or a DeepSeek API using an OpenAI-compatible protocol |
| Persistence | SQLite, local files, and a vector database |

## Reference code and version

- Reference repository: `https://github.com/akss66/ZhiZhi-RAG`
- Local repository base commit: `ec1ff253710816482fdb0c8710a12e5835cb6633`
- This package captures the working directory at the time of preparation, including uncommitted changes and added files.
- The reference repository provides a foundation for document processing, retrieval Q&A, citations, login, sessions, and bookmarks.

## Current version

- A student-journalism research workflow reflected in product positioning, interface copy, and answer prompts.
- Three clearly labeled fictional campus-reporting sources for demonstrating retrieval, citations, and verification.
- Source import, Q&A, original passages, document previews, chat history, and bookmarks.
- Chinese and English interface text, light and dark themes, saved preferences, and cross-tab synchronization.
- Developer contact information and local demonstration configuration.

## File organization

- Includes frontend and backend source, the frontend dependency lockfile, scripts, configuration examples, design documents, and sample sources.
- Includes the frontend build in `backend/app/static/` for viewing the application after starting the backend.
- Provides a Local Setup Guide, root `.env.example`, and file-by-file SHA-256 checksums.
- Excludes Git history, installed dependencies, virtual environments, model weights, caches, API keys, and local account or chat databases.
- Starts with an empty knowledge base. Upload the three samples in `demo/` to demonstrate the workflow.

## License information

The earlier README states MIT. This package retains that statement and the reference repository address. No separate license text has been added.
