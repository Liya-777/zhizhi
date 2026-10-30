import { useState, useEffect, useCallback } from 'react';
import { Bookmark, Trash2, Loader2, ChevronDown } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { toast } from './Toast';
import type { Bookmark as BookmarkType } from '../types';
import { useAppSettings } from '../appSettings';

interface Props {}

export default function BookmarkPanel({}: Props) {
  const { t } = useAppSettings();
  const [bookmarks, setBookmarks] = useState<BookmarkType[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const api = useApi();

  const load = useCallback(async () => {
    const b = await api.getBookmarks();
    if (b) setBookmarks(b);
  }, []);

  useEffect(() => { load(); }, []);

  const handleToggle = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDeleting(id);
    await api.deleteBookmark(id);
    setBookmarks(prev => prev.filter(b => b.id !== id));
    toast('info', t('bookmarks.deleted'));
    if (expandedId === id) setExpandedId(null);
    setDeleting(null);
  };

  const selected = bookmarks.find(b => b.id === expandedId);

  return (
    <div className="flex-1 flex flex-col min-h-0 animate-fade-in">
      <div className="flex items-center gap-2 mb-4 px-1">
        <Bookmark className="w-4 h-4" style={{ color: "var(--text-strong)" }} />
        <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: "var(--text-secondary)", letterSpacing: '0.05em' }}>{t('nav.bookmarks')}</h2>
        <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ backgroundColor: 'var(--surface-muted)', color: "var(--text-secondary)" }}>{bookmarks.length}</span>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0 space-y-1">
        {bookmarks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Bookmark className="w-10 h-10 mb-4" style={{ color: "var(--text-muted)" }} />
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{t('bookmarks.empty')}</p>
            <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>{t('bookmarks.hint')}</p>
          </div>
        ) : (
          <div className="animate-fade-in" key={bookmarks.length}>
            {bookmarks.map((b, idx) => {
          const isExpanded = expandedId === b.id;
          return (
            <div key={b.id} className="animate-fade-in-up" style={{ animationDelay: `${idx * 50}ms`, animationFillMode: 'both' }}>
              <button onClick={() => handleToggle(b.id)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200"
                style={{ backgroundColor: isExpanded ? 'var(--surface-muted)' : 'var(--surface)', border: `0.5px solid ${isExpanded ? 'var(--border-strong)' : 'var(--border)'}` }}
                onMouseEnter={e => { if (!isExpanded) e.currentTarget.style.backgroundColor = 'var(--bg)'; }}
                onMouseLeave={e => { if (!isExpanded) e.currentTarget.style.backgroundColor = 'var(--surface)'; }}
              >
                <Bookmark className="w-4 h-4 flex-shrink-0" style={{ color: "var(--text-strong)" }} fill="currentColor" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>{b.question.slice(0, 50)}</p>
                  <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>{b.created_at?.slice(5)}</p>
                </div>
                <ChevronDown className="w-4 h-4 flex-shrink-0 transition-transform duration-200" style={{ transform: isExpanded ? 'rotate(180deg)' : 'none', color: "var(--text-muted)" }} />
                <button onClick={e => handleDelete(e, b.id)}
                  className="p-1 rounded flex-shrink-0 transition-colors"
                  style={{ color: "var(--text-muted)" }}
                  onMouseEnter={e => e.currentTarget.style.color = "var(--text-danger)"}
                  onMouseLeave={e => e.currentTarget.style.color = "var(--text-muted)"}
                >
                  {deleting === b.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                </button>
              </button>

              {isExpanded && (
                <div className="ml-12 mr-2 mt-1 mb-2 space-y-3 animate-spring-pop">
                  {/* Question */}
                  <div>
                    <p className="text-[10px] font-medium mb-1" style={{ color: "var(--text-strong)" }}>{t('bookmarks.question')}</p>
                    <p className="text-sm" style={{ color: "var(--text-primary)", lineHeight: '1.6' }}>{b.question}</p>
                  </div>

                  {/* Answer */}
                  <div>
                    <p className="text-[10px] font-medium mb-1" style={{ color: "var(--text-muted)" }}>{t('bookmarks.answer')}</p>
                    <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--bg)', border: '0.5px solid var(--border)' }}>
                      <p className="text-xs whitespace-pre-wrap leading-relaxed" style={{ color: "var(--text-body)" }}>{b.answer}</p>
                    </div>
                  </div>

                  {/* Meta */}
                  <div className="flex gap-4 text-[10px]" style={{ color: "var(--text-muted)" }}>
                    <span>{b.created_at}</span>
                    {b.doc_names && b.doc_names.length > 0 && <span>{t('bookmarks.source')}{b.doc_names.join(', ')}</span>}
                  </div>

                </div>
              )}
            </div>
          );
        })}
          </div>
        )}
      </div>
    </div>
  );
}
