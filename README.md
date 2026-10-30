# ZhiZhi

**Traceable Research Q&A for Student Journalists**  
Author: Liu Yan  
Portfolio package prepared: October 26, 2026  
English documentation updated: October 27, 2026

ZhiZhi helps student journalists find information in interview transcripts, public reports, and background materials. Users import sources, ask a question, read an answer with citations, and open the original passages to check the context.

The project connects retrieval-augmented generation with a reporting workflow: find a lead, inspect its source, compare accounts, and decide what needs further reporting. Retrieved material is a starting point for verification.

## Start here

| File or directory | Contents |
| --- | --- |
| [Local Setup Guide](docs/LOCAL_SETUP.md) | Install dependencies, download the embedding model, start the app, and import sample sources. |
| [Technical Reference](docs/TECHNICAL_REFERENCE.md) | Technology stack, reference code, and package version information. |
| [Product Overview](PRODUCT.md) | Intended users, reporting workflow, product goals, and design principles. |
| [Design System](DESIGN.md) | Visual direction, color tokens, typography, components, and accessibility targets. |
| [Authentication Specification](SPEC.md) | The earlier authentication and role-access specification, retained as development context. |
| [Archived Project Overview](docs/PROJECT_OVERVIEW_ARCHIVE.md) | An English rendering of the earlier README. Follow the Local Setup Guide for current installation instructions. |
| `frontend/src/` | React and TypeScript interface, including language and theme settings. |
| `backend/app/` | FastAPI routes, parsing, retrieval, streaming answers, citations, and user data management. |
| `backend/tests/` | Existing backend tests and fixtures. |
| `backend/app/static/` | Included frontend build. Rebuild after editing the interface. |
| `demo/` | Three clearly marked fictional campus-reporting sources. |
| `CHECKSUMS_SHA256.txt` | File-by-file checksums for verifying package integrity. |

## Features

- Import PDF, DOCX, TXT, and Markdown sources, with batch upload and progress feedback.
- Search source passages using local embeddings and ChromaDB.
- Choose between a local Mock answer mode and API-generated answers.
- Read streamed answers and expand citations to inspect the original passages.
- Browse source previews, revisit chat history, and save answers as bookmarks.
- Manage documents through an administrator account.
- Switch the interface between Chinese and English immediately.
- Use light or dark mode across the login page, workspace, source views, and dialogs. Preferences persist after refresh and synchronize across tabs.

## Local demonstration

Follow [docs/LOCAL_SETUP.md](docs/LOCAL_SETUP.md), then open `http://localhost:8000/`.

| Demo role | Username | Password |
| --- | --- | --- |
| Administrator | `admin` | `666666` |
| User | `user` | `123456` |

A fresh installation starts with an empty knowledge base. Upload the three Markdown files in `demo/校园新闻资料样例/` to try the reporting scenario. The documents describe a fictional campus discussion about late-night study spaces.

The sample sources remain in Chinese. Changing the interface language does not translate document text or generated answers. For the included Chinese-language scenario, try: “What does the public report recommend about extending library opening hours?” Then expand the citations and compare the original passages.

Mock mode requires no API key. Initial setup still requires internet access to install dependencies and download the embedding model. After setup, local Mock retrieval can run without an external generation API.

## Package contents

This package contains the current source files, frontend dependency lockfile, configuration examples, scripts, sample materials, and a frontend build. Git history, installed dependencies, virtual environments, model weights, caches, API keys, and local account or chat databases are excluded.

See [Technical Reference](docs/TECHNICAL_REFERENCE.md) for reference code and version details. Earlier planning documents describe design intent; the application source is the reference for implemented behavior.
