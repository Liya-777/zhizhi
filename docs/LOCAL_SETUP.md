# Local Setup Guide

Run the commands below from the project root: the folder containing `README.md`, `frontend/`, `backend/`, and `scripts/`.

## 1. Prepare your environment

Use Python 3.11 or 3.12, Node.js 20 or 22, and npm. Dependencies and model weights are excluded from this package. The initial installation requires internet access and enough disk space for the Python environment and embedding model.

Open a terminal and change to the source folder. At its current location on this Mac:

```bash
cd "$HOME/Desktop/留学/浸会作品集/致知/致知_ZhiZhi_源代码"
```

If you move or rename the folder after extracting the ZIP, use its new location instead. The Chinese names above are filesystem paths, not interface settings.

## 2. Install backend dependencies and configure the app

Use a `python3` executable corresponding to one of the recommended versions:

```bash
python3 -m venv backend/.venv
source backend/.venv/bin/activate
python -m pip install --upgrade pip
python -m pip install -r backend/requirements.txt
cp .env.example .env
```

On Windows PowerShell, activate the environment with `backend\.venv\Scripts\Activate.ps1` and copy the configuration with `Copy-Item .env.example .env`. Continue running commands from the project root.

If `.env` already exists, retain your existing configuration. The root `.env.example` provides local paths and keeps the student-journalism prompt defined in the source code. `backend/.env.example` is an earlier configuration example with a different prompt; it is retained for reference.

## 3. Download the embedding model

```bash
python backend/scripts/download_model.py --cache-dir backend/models
```

The script downloads `BAAI/bge-small-zh-v1.5` through ModelScope and checks the model files and loading behavior. A successful download should include:

```text
backend/models/BAAI/bge-small-zh-v1.5/config.json
backend/models/BAAI/bge-small-zh-v1.5/model.safetensors
```

Mock mode also uses this model for semantic retrieval, so this step is required.

## 4. Install frontend dependencies and build

```bash
cd frontend
npm ci
cd ..
bash scripts/build.sh
```

The build script copies the web application to `backend/app/static/` and moves image assets under `/assets/`. A frontend build is included in this package. You can skip frontend installation and rebuilding if you only want to view that version with the backend.

## 5. Start the application

With the backend virtual environment active, run this command from the project root:

```bash
python -m uvicorn app.main:app --app-dir backend --host 127.0.0.1 --port 8000
```

Open `http://localhost:8000/`. If port 8000 is in use, choose `--port 8001` and visit `http://localhost:8001/`.

The service runs in the current terminal. Press `Ctrl+C` to stop it. Runtime files are created under `data/`; no data from the original development machine is required.

Check the health endpoint:

```bash
curl http://localhost:8000/api/health
```

After the model loads successfully, expect `status: "ok"`, `embedding_loaded: true`, and `llm_mode: "mock"`. Before importing sources, `documents_count` should be 0.

## 6. Try the reporting scenario

1. Sign in as administrator with `admin / 666666`.
2. Open Settings and select English if needed. In the initial Chinese interface, Settings is the last item in the sidebar.
3. Open Knowledge base and upload the three Markdown files in `demo/校园新闻资料样例/`.
4. Return to Research Q&A and ask: “What does the public report recommend about extending library opening hours?”
5. Expand Cited sources, open a source passage, and check its original context.
6. In Settings, switch between light and dark mode. Refresh the page to confirm that your preferences are retained.

The three sample documents are fictional campus-reporting materials. They demonstrate retrieval and source verification, rather than reporting real events. Documents and answers keep their original language when the interface language changes.

## 7. Enable API-generated answers (optional)

Add your own `DEEPSEEK_API_KEY` to the root `.env`. The model name is configured through `DEEPSEEK_MODEL`; use a model supported by your API service. Restart the backend, then select AI search in the sidebar. Mock local mode is sufficient for a demonstration without an API key.

## 8. Development and validation

Start the frontend development server:

```bash
cd frontend
npm run dev
```

Its `/api` requests proxy to `http://localhost:8000` by default, so run the backend as well. If you change the backend port, update `frontend/vite.config.ts` accordingly.

Build the frontend from the project root:

```bash
npm run build --prefix frontend
```

Run the existing backend unit tests inside the activated Python environment:

```bash
python -m pip install pytest
python -m pytest backend/tests
```

Python dependencies retain the version ranges in `backend/requirements.txt`. Frontend dependencies are installed from `package-lock.json` using `npm ci`. This package does not include a full Python environment lockfile.

Docker configuration, Windows launch scripts, and background-service scripts are retained as source references. Use the virtual-environment workflow above for this package. Docker and Windows launch workflows were not revalidated during packaging.
