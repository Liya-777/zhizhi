import { useState, useEffect, useCallback } from 'react';
import { FileText, BookOpen, Loader2 } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import type { DocumentInfo, DocumentPreview } from '../types';
import { useAppSettings } from '../appSettings';

interface Props {
  documents: DocumentInfo[];
  onRefresh: () => void;
}

const FILE_ICONS: Record<string, string> = { pdf: '🔴', markdown: '🟣', docx: '🔵', txt: '⚪' };
const formatSize = (bytes: number) => bytes < 1024 ? `${bytes}B` : bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(1)}KB` : `${(bytes / (1024 * 1024)).toFixed(1)}MB`;

export default function DocumentBrowsePanel({ documents, onRefresh }: Props) {
  const { t } = useAppSettings();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [preview, setPreview] = useState<DocumentPreview | null>(null);
  const [loading, setLoading] = useState(false);
  const api = useApi();

  useEffect(() => { onRefresh(); }, []);

  const handleToggle = useCallback(async (docId: string) => {
    if (expandedId === docId) { setExpandedId(null); setPreview(null); return; }
    setExpandedId(docId);
    setLoading(true);
    const data = await api.getDocumentPreview(docId, 10);
    if (data) setPreview(data);
    setLoading(false);
  }, [expandedId]);

  return (
    <div className="flex-1 flex flex-col min-h-0 animate-fade-in">
      <div className="flex items-center gap-2 mb-4 px-1">
        <BookOpen className="w-4 h-4" style={{ color: "var(--text-strong)" }} />
        <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: "var(--text-secondary)", letterSpacing: '0.05em' }}>{t('doc.browse')}</h2>
        <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ backgroundColor: 'var(--surface-muted)', color: "var(--text-secondary)" }}>{documents.length} {t('common.sources')}</span>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0 space-y-1">
        {documents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <BookOpen className="w-10 h-10 mb-4" style={{ color: "var(--text-muted)" }} />
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{t('doc.empty')}</p>
            <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>{t('doc.emptyBody')}</p>
          </div>
        ) : (
          documents.map((d, idx) => {
            const isExpanded = expandedId === d.id;
            const isCurrentPreview = isExpanded && preview;
            return (
              <div key={d.id} className="animate-fade-in-up" style={{ animationDelay: `${idx * 50}ms`, animationFillMode: 'both' }}>
                <button onClick={() => handleToggle(d.id)} aria-expanded={isExpanded} aria-label={isExpanded ? t('doc.previewClose') : t('doc.previewOpen')}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200"
                  style={{ backgroundColor: isExpanded ? 'var(--surface-muted)' : 'var(--surface)', border: `0.5px solid ${isExpanded ? 'var(--border-strong)' : 'var(--border)'}` }}
                  onMouseEnter={e => { if (!isExpanded) e.currentTarget.style.backgroundColor = 'var(--bg)'; }}
                  onMouseLeave={e => { if (!isExpanded) e.currentTarget.style.backgroundColor = 'var(--surface)'; }}
                >
                  <span className="text-sm flex-shrink-0">{FILE_ICONS[d.file_type] || '📄'}</span>
                  <FileText className="w-4 h-4 flex-shrink-0" style={{ color: "var(--text-muted)" }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>{d.filename}</p>
                    <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>{formatSize(d.file_size_bytes)} · {d.chunk_count} {t('common.paragraph')} · {d.uploaded_at?.slice(5)}</p>
                  </div>
                </button>

                {isExpanded && (
                  <div className="ml-12 mr-2 mt-1 mb-2 space-y-2 animate-spring-pop">
                    {loading ? (
                      <div className="flex items-center justify-center py-6">
                        <Loader2 className="w-5 h-5 animate-spin" style={{ color: "var(--text-muted)" }} />
                      </div>
                    ) : isCurrentPreview ? (
                      <>
                        <p className="text-[11px] font-medium" style={{ color: "var(--text-primary)" }}>
                          {preview.filename} · {t('共 {count} 个段落', { count: preview.total_chunks })}
                        </p>
                        {preview.preview_chunks.map((c, i) => (
                          <div key={i} className="p-3 rounded-lg" style={{ backgroundColor: 'var(--bg)', border: '0.5px solid var(--border)' }}>
                            <span className="inline-block text-[10px] px-1.5 py-0.5 rounded font-bold mb-1.5" style={{ backgroundColor: 'var(--surface-active)', color: "var(--text-strong)" }}>{t('doc.section')} {c.index + 1}</span>
                            <p className="text-xs leading-relaxed" style={{ color: "var(--text-body)" }}>{c.content}</p>
                          </div>
                        ))}
                      </>
                    ) : null}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
