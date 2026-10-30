import { useAppSettings } from '../appSettings';
import { useState, useEffect } from 'react';
import { ChevronDown, Quote, FileText } from 'lucide-react';
import type { SourceCitation } from '../types';

interface Props {
  source: SourceCitation;
  index: number;
  highlighted?: boolean;
  chunkCount?: number;
}

export default function SourceBadge({ source, index, highlighted, chunkCount }: Props) {
  const { t } = useAppSettings();
  const [expanded, setExpanded] = useState(false);

  // Auto-expand when highlighted
  useEffect(() => {
    if (highlighted) {
      setExpanded(true);
      // Reset after animation
      const timer = setTimeout(() => setExpanded(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [highlighted]);

  const isHighlighted = highlighted;
  const isExpanded = expanded || isHighlighted;

  return (
    <div
      className="border rounded-xl overflow-hidden transition-all duration-300"
      style={{
        borderColor: isHighlighted
          ? 'oklch(0.52 0.24 255 / 0.5)'
          : isExpanded
            ? 'oklch(0.52 0.24 255 / 0.15)'
            : 'var(--border)',
        backgroundColor: isHighlighted
          ? 'var(--surface-active)'
          : isExpanded
            ? 'var(--surface-active)'
            : 'var(--surface-muted)',
        boxShadow: isHighlighted
          ? '0 0 0 2px oklch(0.52 0.24 255 / 0.15), 0 2px 8px oklch(0 0 0 / 0.2)'
          : isExpanded
            ? '0 0 0 1px oklch(0.52 0.24 255 / 0.08), 0 2px 8px oklch(0 0 0 / 0.2)'
            : 'none',
        animation: isHighlighted ? 'citation-pulse 0.8s ease-out' : 'none',
      }}
    >
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
        aria-label={expanded ? t("收起来源详情") : t("展开来源详情")}
        className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-colors duration-200"
        onMouseEnter={(e) => {
          if (!expanded) e.currentTarget.style.backgroundColor = 'var(--surface-muted)';
        }}
        onMouseLeave={(e) => {
          if (!expanded) e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        <span
          className="flex-shrink-0 w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold"
          style={{
            backgroundColor: 'oklch(0.52 0.24 255 / 0.12)',
            color: "var(--text-secondary)",
          }}
        >
          {index}
        </span>
        <FileText className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "var(--text-muted)" }} />
        <span
          className="flex-1 text-xs font-medium truncate"
          style={{ color: "var(--text-primary)" }}
        >
          {source.document_name}
        </span>
        <span
          className="flex-shrink-0 text-[10px] px-1.5 py-0.5 rounded-full font-mono font-medium"
          style={{
            backgroundColor: 'var(--surface-muted)',
            color: "var(--text-secondary)",
          }}
        >
          {chunkCount && chunkCount > 1 ? `${chunkCount} ${t('处引用')}` : null}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 flex-shrink-0 transition-transform duration-300 ${
            expanded ? 'rotate-180' : ''
          }`}
          style={{ color: "var(--text-muted)", transitionTimingFunction: 'cubic-bezier(0.17, 0.17, 0, 1.0)' }}
        />
      </button>

      {/* Expanded content — smooth reveal */}
      <div
        className="overflow-hidden"
        style={{
          maxHeight: expanded ? '48rem' : '0',
          opacity: expanded ? 1 : 0,
          transition: 'max-height 0.35s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.25s cubic-bezier(0.17, 0.17, 0, 1.0)',
        }}
      >
        <div
          className="px-3 pb-3 pt-1"
          style={{ borderTop: '1px solid oklch(0.52 0.24 255 / 0.10)' }}
        >
          <div className="flex items-start gap-1.5">
            <Quote
              className="w-3 h-3 flex-shrink-0 mt-0.5"
              style={{ color: 'oklch(0.52 0.24 255 / 0.3)' }}
            />
            <p
              className="text-xs leading-relaxed"
              style={{ color: "var(--text-body)" }}
            >
              {source.content}
              {source.content.length >= 500 && '...'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
