import { useAppSettings } from '../appSettings';
import { useState, useCallback, useRef } from 'react';
import { FileText, File, FileType, Trash2, Loader2, ChevronDown, Search, RefreshCw, AlertTriangle } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { toast } from './Toast';
import type { DocumentInfo, DocumentPreview } from '../types';

interface Props {
  doc: DocumentInfo;
  onDelete: (id: string) => Promise<any>;
  onReplace?: (id: string, doc: DocumentInfo) => void;
}

const ICON_MAP: Record<string, React.ElementType> = {
  pdf: FileText,
  markdown: FileType,
  docx: File,
  txt: File,
};

const FILE_COLORS: Record<string, { bg: string; ink: string; glow: string }> = {
  pdf: {
    bg: 'oklch(0.58 0.22 25 / 0.18)',
    ink: 'oklch(0.65 0.22 25)',
    glow: 'oklch(0.58 0.22 25 / 0.12)',
  },
  markdown: {
    bg: 'oklch(0.50 0.15 255 / 0.12)',
    ink: "var(--text-secondary)",
    glow: 'oklch(0.50 0.15 255 / 0.10)',
  },
  docx: {
    bg: 'oklch(0.50 0.15 255 / 0.12)',
    ink: "var(--text-secondary)",
    glow: 'oklch(0.50 0.15 255 / 0.10)',
  },
  txt: {
    bg: 'var(--border)',
    ink: "var(--text-secondary)",
    glow: 'oklch(0 0 0)',
  },
};

const formatSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
};

/** Highlight keyword matches in text */
function highlightText(text: string, keyword: string): React.ReactNode {
  if (!keyword.trim()) return text;
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = text.split(new RegExp(`(${escaped})`, 'gi'));
  return parts.map((part, i) =>
    part.toLowerCase() === keyword.toLowerCase()
      ? <mark key={i} style={{ backgroundColor: 'oklch(0.52 0.24 255 / 0.15)', color: "var(--text-primary)", borderRadius: '2px', padding: '0 2px' }}>{part}</mark>
      : part
  );
}

export default function DocumentCard({ doc, onDelete, onReplace }: Props) {
  const { t } = useAppSettings();
  const [deleting, setDeleting] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [replacing, setReplacing] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [preview, setPreview] = useState<DocumentPreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const api = useApi();

  // Confirmation dialogs
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showReplaceConfirm, setShowReplaceConfirm] = useState(false);
  const [pendingReplaceFile, setPendingReplaceFile] = useState<File | null>(null);

  const Icon = ICON_MAP[doc.file_type] || File;
  const colors = FILE_COLORS[doc.file_type] || FILE_COLORS.txt;

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    setShowDeleteConfirm(false);
    setDeleting(true);
    try {
      await onDelete(doc.id);
      setRemoving(true);
      setTimeout(() => setDeleting(false), 300);
    } catch {
      setDeleting(false);
    }
  };

  const handleReplaceClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingReplaceFile(file);
    setShowReplaceConfirm(true);
    // Reset input so the same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleReplaceConfirm = async () => {
    const file = pendingReplaceFile;
    if (!file) { setShowReplaceConfirm(false); return; }
    setShowReplaceConfirm(false);
    setPendingReplaceFile(null);
    setReplacing(true);
    try {
      const result = await api.replaceDocument(doc.id, file);
      if (result) { onReplace?.(doc.id, result); toast('success', t("文档已替换")); }
    } catch { }
    setReplacing(false);
  };

  const handleToggle = useCallback(async () => {
    const next = !expanded;
    setExpanded(next);
    if (next && !preview) {
      setPreviewLoading(true);
      const data = await api.getDocumentPreview(doc.id, 3);
      if (data) setPreview(data);
      setPreviewLoading(false);
    }
  }, [expanded, preview, doc.id]);

  // Filter preview chunks by keyword
  const filteredChunks = preview?.preview_chunks.filter(
    c => !searchKeyword.trim() || c.content.includes(searchKeyword)
  ) || [];

  return (
    <>
      <div
        className={`group transition-all duration-300 rounded-xl overflow-hidden
          ${removing ? 'opacity-0 scale-95 translate-x-4 pointer-events-none' : 'animate-fade-in-up'}`}
        style={{
          backgroundColor: expanded ? 'var(--surface-muted)' : 'var(--surface)',
          border: `1px solid ${expanded ? 'var(--border-strong)' : 'var(--border)'}`,
          boxShadow: expanded ? '0 4px 16px oklch(0 0 0 / 0.3)' : 'none',
        }}
      >
        {/* Main row — clickable to toggle preview */}
        <div
          onClick={handleToggle}
          role="button" tabIndex={0} aria-expanded={expanded} aria-label={`${expanded ? t("收起 ") : t("展开 ")}${doc.filename}`}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleToggle(); } }}
          className="flex items-center gap-3 p-3 cursor-pointer transition-colors duration-200"
          onMouseEnter={(e) => {
            if (!expanded) {
              e.currentTarget.parentElement!.style.borderColor = 'var(--border-strong)';
              e.currentTarget.parentElement!.style.backgroundColor = 'var(--surface-muted)';
              e.currentTarget.parentElement!.style.boxShadow = '0 4px 16px oklch(0 0 0 / 0.3)';
            }
          }}
          onMouseLeave={(e) => {
            if (!expanded) {
              e.currentTarget.parentElement!.style.borderColor = 'var(--border)';
              e.currentTarget.parentElement!.style.backgroundColor = 'var(--surface)';
              e.currentTarget.parentElement!.style.boxShadow = 'none';
            }
          }}
        >
          {/* File icon */}
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              backgroundColor: colors.bg,
              boxShadow: `0 0 8px ${colors.glow}`,
            }}
          >
            <Icon className="w-4 h-4" style={{ color: colors.ink }} />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
              {doc.filename}
            </p>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
              {formatSize(doc.file_size_bytes)} · {doc.chunk_count} {t('common.paragraph')} · {doc.uploaded_at.slice(5)}
            </p>
          </div>

          {/* Expand indicator */}
          <ChevronDown
            className={`w-4 h-4 flex-shrink-0 transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`}
            style={{ color: "var(--text-muted)" }}
          />

          {/* Hidden file input for replace */}
          <input ref={fileInputRef} type="file" className="hidden" aria-label={t("选择替换文件")}
            accept=".pdf,.docx,.doc,.txt,.md,.markdown"
            onChange={handleFileChange}
          />

          {/* Replace */}
          <button
            onClick={handleReplaceClick}
            disabled={replacing || deleting}
            aria-label={t('替换 {filename}', { filename: doc.filename })}
            className="p-2 rounded-lg transition-all duration-200 opacity-100"
            style={{ color: "var(--text-secondary)" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'oklch(0.50 0.15 255)';
              e.currentTarget.style.backgroundColor = 'oklch(0.50 0.15 255 / 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "var(--text-secondary)";
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
            title={t("替换文件")}
          >
            {replacing ? (
              <Loader2 className="w-4 h-4 animate-spin" style={{ color: 'oklch(0.50 0.15 255)' }} />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
          </button>

          {/* Delete */}
          <button
            onClick={handleDeleteClick}
            disabled={deleting}
            aria-label={t('删除 {filename}', { filename: doc.filename })}
            className="p-2 rounded-lg transition-all duration-200 opacity-100"
            style={{ color: "var(--text-secondary)" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'oklch(0.65 0.22 25)';
              e.currentTarget.style.backgroundColor = 'oklch(0.58 0.22 25 / 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "var(--text-secondary)";
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
            title={t("删除")}
          >
            {deleting ? (
              <Loader2 className="w-4 h-4 animate-spin" style={{ color: "var(--text-danger)" }} />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Preview section — expandable */}
        <div
          className={`overflow-hidden transition-all duration-300 ease-out ${
            expanded ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'
          }`}
          style={{ borderTop: expanded ? '1px solid var(--border)' : '1px solid transparent' }}
        >
          <div className="px-4 pb-4 pt-3 space-y-3">
            {previewLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-5 h-5 animate-spin" style={{ color: "var(--text-strong)" }} />
              </div>
            ) : preview ? (
              <>
                {/* Search */}
                <div className="relative">
                  <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
                  <input
                    type="text"
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    placeholder={t("搜索预览内容…")}
                    aria-label={t("搜索文档片段")}
                    className="w-full pl-7 pr-2 py-1.5 rounded-lg text-xs focus:outline-none"
                    style={{
                      backgroundColor: 'var(--surface-muted)',
                      color: "var(--text-primary)",
                      border: '1px solid var(--border)',
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>

                {/* Chunk list */}
                {filteredChunks.length === 0 ? (
                  <p className="text-xs py-2" style={{ color: "var(--text-muted)" }}>
                    {searchKeyword ? t("无匹配结果") : t("暂无内容")}
                  </p>
                ) : (
                  filteredChunks.map((chunk) => (
                    <div
                      key={chunk.index}
                      className="rounded-lg p-3 text-xs leading-relaxed"
                      style={{
                        backgroundColor: 'var(--surface-muted)',
                        border: '1px solid var(--border)',
                        color: "var(--text-body)",
                      }}
                    >
                      <span
                        className="inline-block text-[10px] px-1.5 py-0.5 rounded font-bold mr-2 mb-1"
                        style={{
                          backgroundColor: 'oklch(0.52 0.24 255 / 0.12)',
                          color: "var(--text-secondary)",
                        }}
                      >
                        #{chunk.index + 1}
                      </span>
                      {highlightText(chunk.content.length > 300 ? chunk.content.slice(0, 300) + '…' : chunk.content, searchKeyword)}
                    </div>
                  ))
                )}

                {/* Footer */}
                <p className="text-[10px] text-center" style={{ color: "var(--text-secondary)" }}>
                  {t('共 {count} 个段落', { count: preview.total_chunks })}</p>
              </>
            ) : null}
          </div>
        </div>
      </div>

      {/* ── Delete Confirmation Modal ── */}
      {showDeleteConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in"
          style={{ backgroundColor: 'oklch(0 0 0 / 0.2)' }}
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div
            className="rounded-2xl p-6 animate-scale-in"
            style={{
              backgroundColor: 'var(--surface)',
              boxShadow: '0 20px 60px oklch(0 0 0 / 0.12)',
              border: '0.5px solid var(--border)',
              maxWidth: '400px',
              width: '90%',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Icon */}
            <div
              className="w-11 h-11 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: 'oklch(0.52 0.22 21 / 0.10)' }}
            >
              <AlertTriangle className="w-5 h-5" style={{ color: "var(--text-danger)" }} />
            </div>
            <h2 className="text-base font-semibold text-center mb-2" style={{ color: "var(--text-primary)" }}>
              {t("确认删除文档？")}</h2>
            <p className="text-sm text-center mb-1" style={{ color: "var(--text-secondary)", lineHeight: '1.5' }}>
              {t("将永久删除")} <strong style={{ color: "var(--text-primary)", fontWeight: 600 }}>{doc.filename}</strong>
            </p>
            <div className="rounded-lg p-3 mb-4 mx-auto" style={{ backgroundColor: 'var(--surface-muted)', border: '0.5px solid var(--border)', maxWidth: '90%' }}>
              <p className="text-[11px] leading-relaxed" style={{ color: "var(--text-body)" }}>
                {t("⚠ 此操作")}<strong style={{ color: "var(--text-danger)" }}>{t("不可撤销")}</strong>：
              </p>
              <ul className="text-[11px] mt-1.5 space-y-0.5 list-disc list-inside" style={{ color: "var(--text-secondary)", lineHeight: '1.5' }}>
                <li>{t("文件将从服务器中移除")}</li>
                <li>{t('所有向量化段落将被清除（{count} 个段落）', { count: doc.chunk_count })}</li>
                <li>{t("后续 AI 回答将无法引用此文档内容")}</li>
              </ul>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                aria-label={t("取消删除")}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                style={{ backgroundColor: 'var(--surface-muted)', color: "var(--text-primary)", border: 'none', cursor: 'pointer' }}
              >
                {t("取消")}</button>
              <button
                onClick={handleDeleteConfirm}
                aria-label={t("确认删除 ") + doc.filename}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                style={{ backgroundColor: 'oklch(0.52 0.22 21)', color: 'white', border: 'none', cursor: 'pointer' }}
              >
                {t("确认删除")}</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Replace Confirmation Modal ── */}
      {showReplaceConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in"
          style={{ backgroundColor: 'oklch(0 0 0 / 0.2)' }}
          onClick={() => { setShowReplaceConfirm(false); setPendingReplaceFile(null); }}
        >
          <div
            className="rounded-2xl p-6 animate-scale-in"
            style={{
              backgroundColor: 'var(--surface)',
              boxShadow: '0 20px 60px oklch(0 0 0 / 0.12)',
              border: '0.5px solid var(--border)',
              maxWidth: '400px',
              width: '90%',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Icon */}
            <div
              className="w-11 h-11 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: 'oklch(0.62 0.18 65 / 0.10)' }}
            >
              <RefreshCw className="w-5 h-5" style={{ color: 'oklch(0.62 0.18 65)' }} />
            </div>
            <h2 className="text-base font-semibold text-center mb-2" style={{ color: "var(--text-primary)" }}>
              {t("确认替换文档？")}</h2>
            <p className="text-sm text-center mb-4" style={{ color: "var(--text-secondary)", lineHeight: '1.5' }}>
              {t("将用")}<strong style={{ color: "var(--text-primary)", fontWeight: 600 }}>{pendingReplaceFile?.name}</strong> {t("替换")}<br />
              <strong style={{ color: "var(--text-primary)", fontWeight: 600 }}>{doc.filename}</strong>
            </p>
            <div className="rounded-lg p-3 mb-4 mx-auto" style={{ backgroundColor: 'var(--surface-muted)', border: '0.5px solid var(--border)', maxWidth: '90%' }}>
              <p className="text-[11px] leading-relaxed" style={{ color: "var(--text-body)" }}>
                {t("⚠ 此操作")}<strong style={{ color: 'oklch(0.62 0.18 65)' }}>{t("不可撤销")}</strong>：
              </p>
              <ul className="text-[11px] mt-1.5 space-y-0.5 list-disc list-inside" style={{ color: "var(--text-secondary)", lineHeight: '1.5' }}>
                <li>{t("旧文件「")}{doc.filename}{t("」将被覆盖")}</li>
                <li>{t('旧文件的 {count} 个向量化段落将被新内容替换', { count: doc.chunk_count })}</li>
                <li>{t("基于旧文件的 AI 回答来源引用将失效")}</li>
              </ul>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => { setShowReplaceConfirm(false); setPendingReplaceFile(null); }}
                aria-label={t("取消替换")}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                style={{ backgroundColor: 'var(--surface-muted)', color: "var(--text-primary)", border: 'none', cursor: 'pointer' }}
              >
                {t("取消")}</button>
              <button
                onClick={handleReplaceConfirm}
                aria-label={t("确认替换 ") + doc.filename}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                style={{ backgroundColor: 'oklch(0.35 0 0)', color: 'white', border: 'none', cursor: 'pointer' }}
              >
                {t("确认替换")}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
