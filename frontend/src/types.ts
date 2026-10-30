export interface DocumentInfo {
  id: string;
  filename: string;
  file_type: string;
  file_size_bytes: number;
  chunk_count: number;
  uploaded_at: string;
}

export interface SourceCitation {
  document_name: string;
  content: string;
  chunk_index: number;
  relevance_score: number;
}

export interface AnswerResponse {
  answer: string;
  mode: 'llm' | 'mock';
  sources: SourceCitation[];
  processing_time_ms: number;
}

export interface HealthResponse {
  status: string;
  embedding_model: string;
  embedding_loaded: boolean;
  embedding_error?: string | null;
  llm_mode: string;
  llm_model: string;
  documents_count: number;
}

export interface ConfigState {
  mock_llm: boolean;
  embedding_model: string;
  embedding_loaded: boolean;
  embedding_error?: string | null;
  documents_count: number;
}

/** A single message in a multi-turn conversation */
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  sources?: SourceCitation[];
  mode?: 'llm' | 'mock';
  processingTimeMs?: number;
  /** True while this assistant message is still streaming */
  isStreaming?: boolean;
}

/** Session metadata from the server */
export interface SessionInfo {
  session_id: string;
  message_count: number;
  created_at: string;
  last_active: string;
}

/** A chunk of document text returned by the preview API */
export interface ChunkPreview {
  index: number;
  content: string;
  char_start: number;
  char_end: number;
}

/** Document preview response */
export interface DocumentPreview {
  doc_id: string;
  filename: string;
  total_chunks: number;
  preview_chunks: ChunkPreview[];
}

/** A file in the batch upload queue */
export interface UploadFileItem {
  name: string;
  size: number;
  stage: 'queued' | 'parsing' | 'chunking' | 'embedding' | 'storing' | 'done' | 'error';
  progress: number;
  error?: string;
}

/** A saved Q&A bookmark */
export interface Bookmark {
  id: string;
  question: string;
  answer: string;
  doc_names?: string[];
  created_at: string;
}

export interface AuthState {
  token: string;
  username: string;
  role: 'admin' | 'user';
}
