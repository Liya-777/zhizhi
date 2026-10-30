import { useState, useCallback, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, Loader2, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import type { UploadFileItem } from '../types';
import { useAppSettings } from '../appSettings';

interface Props {
  onUploadComplete: (results: any[]) => void;
  uploading: boolean;
}

const STAGE_LABELS: Record<string, string> = {
  queued: '等待中',
  parsing: '解析中',
  chunking: '切分中',
  embedding: '向量化',
  storing: '存储中',
  done: '已完成',
  error: '失败',
};

const STAGE_COLORS: Record<string, string> = {
  queued: 'oklch(0.60 0 0)',
  parsing: 'oklch(0.35 0 0)',
  chunking: 'oklch(0.35 0 0)',
  embedding: 'oklch(0.35 0 0)',
  storing: 'oklch(0.35 0 0)',
  done: 'oklch(0.65 0.16 160)',
  error: 'oklch(0.58 0.22 25)',
};

const formatSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
};

export default function UploadZone({ onUploadComplete, uploading: externalUploading }: Props) {
  const { lang, t } = useAppSettings();
  const api = useApi();
  const [fileItems, setFileItems] = useState<UploadFileItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback(
    async (accepted: File[]) => {
      if (accepted.length === 0) return;

      const items: UploadFileItem[] = accepted.map(f => ({
        name: f.name,
        size: f.size,
        stage: 'queued' as const,
        progress: 0,
      }));
      setFileItems(items);
      setIsUploading(true);

      api.uploadDocumentsBatch(accepted, (event) => {
        switch (event.type) {
          case 'progress':
            setFileItems((prev) => {
              const updated = [...prev];
              const idx = updated.findIndex(f => f.name === event.filename);
              if (idx !== -1) {
                updated[idx] = {
                  ...updated[idx],
                  stage: event.stage as UploadFileItem['stage'],
                  progress: event.progress_pct || 0,
                  error: event.error,
                };
              }
              return updated;
            });
            break;
          case 'complete':
            setIsUploading(false);
            if (event.results?.length > 0) {
              onUploadComplete(event.results);
            }
            setTimeout(() => setFileItems([]), 2500);
            break;
          case 'error':
            setIsUploading(false);
            break;
        }
      });
    },
    [onUploadComplete]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
    // Don't filter by MIME — macOS/browsers inconsistently report PDF/DOCX types.
    // Backend validate_file() will reject unsupported formats server-side.
    maxSize: 20 * 1024 * 1024,
  });

  const hasFiles = fileItems.length > 0;
  const allDone = hasFiles && fileItems.every(f => f.stage === 'done' || f.stage === 'error');

  return (
    <div>
      {/* Drop zone */}
      <div
        {...getRootProps()}
        className="relative overflow-hidden rounded-2xl border-2 border-dashed transition-all duration-300 cursor-pointer"
        style={{
          borderColor: isDragActive
            ? 'oklch(0.35 0 0)'
            : allDone
              ? 'oklch(0.65 0.16 160 / 0.4)'
              : 'var(--border)',
          backgroundColor: isDragActive
            ? 'var(--surface-active)'
            : 'var(--surface-muted)',
          transform: isDragActive ? 'scale(1.01)' : 'scale(1)',
          padding: hasFiles ? '12px 16px' : undefined,
        }}
      >
        <input {...getInputProps()} />
        {isDragActive && (
          <div
            className="absolute inset-0 rounded-2xl  pointer-events-none"
            style={{
              boxShadow: '0 0 0 1px oklch(0.52 0.24 255 / 0.15), 0 0 30px oklch(0.52 0.24 255 / 0.10)',
            }}
          />
        )}

        <div
          className="flex flex-col items-center justify-center transition-all duration-300"
          style={{ padding: hasFiles ? '4px 0' : '32px 16px' }}
        >
          <div
            className={`rounded-2xl flex items-center justify-center mb-3 transition-all duration-300 ${hasFiles ? 'w-8 h-8' : 'w-14 h-14'}`}
            style={{
              backgroundColor: isDragActive
                ? 'oklch(0.52 0.24 255 / 0.10)'
                : allDone
                  ? 'oklch(0.65 0.16 160 / 0.10)'
                  : 'var(--surface-muted)',
              transform: isDragActive ? 'scale(1.08)' : 'scale(1)',
            }}
          >
            {isUploading ? (
              <Loader2 className="animate-spin" style={{ width: '20px', height: '20px', color: "var(--text-strong)" }} />
            ) : allDone ? (
              <CheckCircle2 style={{ width: '20px', height: '20px', color: 'oklch(0.65 0.16 160)' }} />
            ) : (
              <Upload style={{ width: '20px', height: '20px', color: isDragActive ? "var(--text-strong)" : "var(--text-muted)", transition: 'color 0.3s' }} />
            )}
          </div>
          {isUploading ? (
            <div className="text-center animate-fade-in">
              <p className="text-sm font-medium" style={{ color: "var(--text-body)" }}>{lang === 'zh' ? `正在处理 ${fileItems.length} 个文件…` : `Processing ${fileItems.length} file${fileItems.length === 1 ? '' : 's'}…`}</p>
            </div>
          ) : allDone ? (
            <div className="text-center animate-fade-in-up">
              <p className="text-sm font-medium" style={{ color: 'oklch(0.65 0.16 160)' }}>{lang === 'zh' ? '全部上传完成' : 'All uploads complete'}</p>
            </div>
          ) : isDragActive ? (
            <div className="text-center animate-scale-in">
              <p className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>{lang === 'zh' ? '释放以上传文件' : 'Drop files to upload'}</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>PDF · DOCX · TXT · MD</p>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-sm font-medium" style={{ color: "var(--text-body)" }}>
                <span style={{ color: "var(--text-strong)", fontWeight: 600 }}>{t('doc.upload')}</span>{lang === 'zh' ? ' 或拖拽文件到此处' : ' or drag files here'}
              </p>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{lang === 'zh' ? '采访稿 · 公开报告 · 背景资料 · 最大 20MB/文件' : 'Interview notes · reports · background sources · 20MB per file'}</p>
            </div>
          )}
        </div>
      </div>

      {/* File queue */}
      {hasFiles && (
        <div className="mt-3 space-y-1.5">
          {fileItems.map((item, i) => {
            const stageColor = STAGE_COLORS[item.stage] || 'oklch(0.60 0 0)';
            return (
              <div
                key={i}
                className="flex items-center gap-3 px-3 py-2 rounded-lg animate-spring-pop transition-all duration-200"
                style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', animationDelay: `${i * 40}ms` }}
              >
                <FileText className="w-4 h-4 flex-shrink-0" style={{ color: "var(--text-muted)" }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-medium truncate" style={{ color: "var(--text-primary)" }}>{item.name}</p>
                    <span className="text-[10px] flex-shrink-0" style={{ color: stageColor }}>
                      {t(STAGE_LABELS[item.stage] || item.stage)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>{formatSize(item.size)}</span>
                    <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ backgroundColor: 'oklch(0 0 0)' }}>
                      <div
                        className="h-full rounded-full transition-all duration-300 ease-out"
                        style={{
                          width: `${item.progress}%`,
                          backgroundColor: item.stage === 'error' ? 'oklch(0.58 0.22 25)' : 'oklch(0.35 0 0)',
                        }}
                      />
                    </div>
                  </div>
                  {item.error && (
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <p className="text-[10px] flex-1 truncate" style={{ color: "var(--text-danger)" }}>{item.error}</p>
                      {item.stage === 'error' && (
                        <button
                          className="text-[10px] px-1.5 py-0.5 rounded font-medium transition-colors flex-shrink-0"
                          style={{ color: "var(--text-danger)", backgroundColor: 'oklch(0.58 0.22 25 / 0.1)', border: '1px solid oklch(0.58 0.22 25 / 0.2)' }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'oklch(0.58 0.22 25 / 0.2)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'oklch(0.58 0.22 25 / 0.1)';
                          }}
                          onClick={() => {
                            // Reset this file and trigger re-upload
                            setFileItems((prev) => {
                              const updated = [...prev];
                              if (updated[i]) {
                                updated[i] = { ...updated[i], stage: 'queued', progress: 0, error: undefined };
                              }
                              return updated;
                            });
                          }}
                          aria-label={t('重试上传 {filename}', { filename: item.name })}
                        >
                          {t("重试")}</button>
                      )}
                    </div>
                  )}
                </div>
                {item.stage !== 'done' && item.stage !== 'error' ? (
                  <Loader2 className="w-4 h-4 flex-shrink-0 animate-spin" style={{ color: stageColor }} />
                ) : item.stage === 'done' ? (
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: stageColor }} />
                ) : (
                  <XCircle className="w-4 h-4 flex-shrink-0" style={{ color: stageColor }} />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
