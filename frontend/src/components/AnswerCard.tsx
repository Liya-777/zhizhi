import { useAppSettings } from '../appSettings';
import { useState, useRef, useEffect, useCallback, useMemo, createElement } from 'react';
import { Bot, Zap, Clock, ChevronDown, Bookmark, Copy, Check } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import SourceBadge from './SourceBadge';
import { useApi } from '../hooks/useApi';
import { toast } from './Toast';
import type { AnswerResponse, SourceCitation } from '../types';

interface Props {
  result: AnswerResponse | null;
  loading: boolean;
  streaming?: boolean;
  streamingText?: string;
  streamSources?: SourceCitation[];
  streamMode?: string;
  streamProcessingTimeMs?: number;
  onCitationClick?: (index: number) => void;
  highlightedCitation?: number | null;
  compact?: boolean;
  faded?: boolean;
  /** The user's actual question — for bookmark save */
  questionText?: string;
}

function SkeletonAnswer() {
  return (
    <div className="animate-fade-in space-y-3 p-4">
      <div className="flex items-center gap-2 mb-4">
        <div className="skeleton w-6 h-6 rounded-lg" />
        <div className="skeleton h-3 w-20 rounded" />
      </div>
      <div className="skeleton h-3 w-full rounded" />
      <div className="skeleton h-3 w-11/12 rounded" />
      <div className="skeleton h-3 w-4/5 rounded" />
      <div className="skeleton h-3 w-full rounded" />
      <div className="skeleton h-3 w-2/3 rounded" />
    </div>
  );
}

export default function AnswerCard({
  result, loading, streaming, streamingText, streamSources, streamMode, streamProcessingTimeMs,
  onCitationClick, highlightedCitation, compact, faded, questionText,
}: Props) {
  const { t } = useAppSettings();
  const [showSources, setShowSources] = useState(false);
  const [cursorFading, setCursorFading] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showSheen, setShowSheen] = useState(false);
  const answerEndRef = useRef<HTMLDivElement>(null);
  const sourcesContainerRef = useRef<HTMLDivElement>(null);
  const bookmarkApi = useApi();

  // Auto-scroll to bottom while streaming
  useEffect(() => {
    if (streaming && answerEndRef.current) {
      answerEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [streamingText, streaming]);

  // Cursor dissolve: when streaming stops, sparkle the cursor
  useEffect(() => {
    if (!streaming && streamingText !== undefined) {
      setCursorFading(true);
      setShowSheen(true);
      const t1 = setTimeout(() => setCursorFading(false), 500);
      const t2 = setTimeout(() => setShowSheen(false), 800);
      return () => { clearTimeout(t1); clearTimeout(t2); };
    }
  }, [streaming]);

  // Custom paragraph renderer for citation markers [1], [2], etc.
  const CitationParagraph = useCallback(
    ({ children, ...props }: any) => {
      // Process text nodes to find and replace [N] patterns (max depth 10)
      const processNode = (node: any, depth = 0): any => {
        if (depth > 10) return node;
        if (typeof node === 'string') {
          const parts = node.split(/(\[来源\d+\]|\[\d+\])/g);
          if (parts.length === 1) return node;
          return parts.map((part, i) => {
            const match = part.match(/^\[(?:来源)?(\d+)\]$/);
            if (match) {
              const num = parseInt(match[1], 10);
              return createElement('span', {
                key: i,
                className: 'citation-marker',
                'data-citation-index': num,
                onClick: (e: React.MouseEvent) => {
                  e.stopPropagation();
                  onCitationClick?.(num);
                },
              }, part);
            }
            return part;
          });
        }
        if (Array.isArray(node)) {
          return node.map((n: any) => processNode(n, depth + 1));
        }
        if (node && typeof node === 'object' && node.props?.children) {
          return {
            ...node,
            props: {
              ...node.props,
              children: Array.isArray(node.props.children)
                ? node.props.children.map((n: any) => processNode(n, depth + 1))
                : processNode(node.props.children, depth + 1),
            },
          };
        }
        return node;
      };

      const processed = Array.isArray(children) ? children.map(processNode) : processNode(children);
      return createElement('p', props, processed);
    },
    [onCitationClick]
  );

  // Determine what to display
  const isStreaming = streaming && streamingText !== undefined;
  const displayAnswer = isStreaming ? streamingText : result?.answer || '';
  const displayMode = isStreaming ? (streamMode || 'mock') : result?.mode || 'mock';
  const displaySources = isStreaming ? (streamSources || []) : result?.sources || [];
  const displayTime = isStreaming ? (streamProcessingTimeMs || 0) : result?.processing_time_ms || 0;

  if (loading && !isStreaming) {
    return (
      <div className="card rounded-2xl overflow-hidden animate-scale-in">
        <SkeletonAnswer />
      </div>
    );
  }

  // Only show sources that were actually cited via [1][2]... markers when they exist
  const citedSources = useMemo(() => {
    if (!displayAnswer || displaySources.length === 0) return displaySources;
    const citedNums = new Set<number>();
    for (const re of [/\[(\d+)\]/g, /\[来源(\d+)\]/g]) {
      const matches = displayAnswer.matchAll(re);
      for (const m of matches) { citedNums.add(parseInt(m[1], 10)); }
    }
    if (citedNums.size === 0) return [];
    // Keep each cited chunk individually so [1] [2] each have a visible row
    return displaySources.filter((_, i) => citedNums.has(i + 1));
  }, [displayAnswer, displaySources]);

  // Each cited chunk shown independently — 1:1 mapping to answer markers [1][2]…
  const mergedSources = useMemo(() => {
    if (citedSources.length === 0) return [];
    return citedSources.map(s => ({
      document_name: s.document_name,
      chunks: [s],
      relevance_score: s.relevance_score,
      count: 1,
    }));
  }, [citedSources]);

  if (!result && !isStreaming) return null;

  const cardStyle = faded ? { opacity: 0.5, transition: 'opacity 0.3s ease-out' } : undefined;
  const headerBorder = compact ? undefined : { borderBottom: '1px solid var(--border)' };

  return (
    <div className={`card rounded-2xl overflow-hidden ${showSheen ? 'breath-sheen' : 'animate-fade-in-up'}`} style={cardStyle}>
      {/* Header — only shown when NOT compact */}
      {!compact && (
        <div className="flex items-center justify-between px-4 py-3" style={headerBorder}>
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(160deg, oklch(0.48 0 0) 0%, oklch(0.35 0 0) 40%, oklch(0.22 0 0) 100%)' }}
            >
              <Bot className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              {isStreaming ? t("正在生成…") : displayMode === 'mock' ? t("Mock 回答") : t("AI 回答")}
            </span>
            {!isStreaming && displayMode === 'mock' && (
              <span
                className="text-[10px] px-1.5 py-0.5 rounded-full font-medium flex items-center gap-1"
                style={{
                  backgroundColor: 'oklch(0.60 0.18 85 / 0.12)',
                  color: 'oklch(0.65 0.18 85)',
                }}
              >
                <Zap className="w-2.5 h-2.5" />
                {t("本地模式")}</span>
            )}
          </div>
          {!isStreaming && (
            <div className="flex items-center gap-2 text-xs" style={{ color: "var(--text-muted)" }}>
              <Clock className="w-3 h-3" />
              {(displayTime / 1000).toFixed(1)}s
            </div>
          )}
        </div>
      )}

      {/* Answer body */}
      <div className={`px-4 ${compact ? 'pt-3 pb-1' : 'py-4'} answer-prose text-sm`}>
        {/* Thinking indicator — shown when streaming and no text yet */}
        {isStreaming && !displayAnswer && (
          <div className="flex items-center gap-3 mb-2 animate-fade-in">
            <div className="flex items-center gap-1">
              {[0, 1, 2].map(i => (
                <div key={i} className="w-1.5 h-1.5 rounded-full"
                  style={{
                    background: 'linear-gradient(160deg, oklch(0.48 0 0) 0%, oklch(0.35 0 0) 40%, oklch(0.22 0 0) 100%)',
                    animation: `thinkingDot 1.2s ease-in-out infinite ${i * 0.15}s`,
                  }}
                />
              ))}
            </div>
            <span className="text-xs" style={{ color: "var(--text-secondary)", fontStyle: 'italic' }}>
              {t("正在思考…")}</span>
          </div>
        )}
        <ReactMarkdown components={{ p: CitationParagraph as any }}>
          {displayAnswer}
        </ReactMarkdown>
        {((isStreaming && displayAnswer) || cursorFading) && (
          <span
            className="streaming-cursor"
            style={{
              display: 'inline-block',
              width: '2px',
              height: '1em',
              backgroundColor: 'oklch(0.35 0 0)',
              marginLeft: '2px',
              verticalAlign: 'text-bottom',
              animation: cursorFading
                ? 'cursorSparkle 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards'
                : 'blink 0.6s step-end infinite',
            }}
          />
        )}
        <div ref={answerEndRef} />
      </div>

      {/* Compact meta footer */}
      {compact && !isStreaming && (
        <div className="px-4 pb-1 flex items-center justify-between text-[10px]">
          <div className="flex items-center gap-2" style={{ color: "var(--text-secondary)" }}>
            <span>{displayMode === 'mock' ? t("Mock 本地") : t("AI 检索")}</span>
            <span>·</span>
            <span>{(displayTime / 1000).toFixed(1)}s</span>
            {displaySources.length > 0 && (
              <>
                <span>·</span>
                <span>📎 {mergedSources.length}</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
            onClick={async () => { try { await navigator.clipboard.writeText(displayAnswer); setCopied(true); toast('success', t("已复制到剪贴板")); setTimeout(() => setCopied(false), 2000); } catch { toast('error', t("复制失败")); } }}
            aria-label={copied ? t("已复制到剪贴板") : t("复制回答")}
            className="flex items-center gap-1 p-1 rounded transition-colors"
            style={{ color: copied ? "var(--text-strong)" : "var(--text-muted)", cursor: 'pointer' }}
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              <span className="text-[10px]">{copied ? t("已复制") : t("复制")}</span>
            </button>
            {displayAnswer && (
              <button
                aria-label={bookmarked ? t("已收藏") : t("收藏此回答")}
                onClick={() => {
                  if (bookmarked) return;
                  setBookmarked(true);
                  const docNames = displaySources.length > 0
                    ? [...new Set(displaySources.map((s: SourceCitation) => s.document_name))]
                    : [];
                  bookmarkApi.saveBookmark(
                    questionText || displayAnswer.slice(0, 40),
                    displayAnswer,
                    displaySources,
                    docNames
                  ).then(() => toast('success', t("已收藏到资料夹")));
                }}
                className="flex items-center gap-1 p-1 rounded transition-colors"
                style={{ color: bookmarked ? "var(--text-strong)" : "var(--text-muted)", cursor: bookmarked ? 'default' : 'pointer' }}
              >
                <Bookmark className="w-3 h-3" fill={bookmarked ? 'currentColor' : 'none'} />
                <span className="text-[10px]">{bookmarked ? t("已收藏") : t("收藏")}</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Sources — only shown after streaming completes */}
      {!isStreaming && displaySources.length > 0 && (
        <div style={{ borderTop: '1px solid var(--border)' }}>
          <button
            onClick={() => setShowSources(!showSources)}
            aria-expanded={showSources}
            aria-label={showSources ? t("收起引用来源") : t("展开引用来源")}
            className="w-full flex items-center justify-between px-4 py-2.5 text-xs transition-colors"
            style={{ color: "var(--text-secondary)" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--surface-muted)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <span className="font-medium">
              {t('📎 引用来源')} ({mergedSources.length})
            </span>
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform duration-300 ${showSources ? 'rotate-180' : ''}`}
            />
          </button>

          <div
            className={`overflow-hidden transition-all duration-300 ease-out ${
              showSources ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'
            }`}
          >
            <div className="px-3 pb-3 space-y-1.5" ref={sourcesContainerRef}>
              {mergedSources.map((group, gi) => (
                <div key={gi} data-source-index={gi + 1}>
                  <SourceBadge
                    source={{
                      document_name: group.document_name,
                      content: group.chunks.map(c => c.content).join('\n\n'),
                      chunk_index: gi,
                      relevance_score: group.relevance_score,
                    }}
                    index={gi + 1}
                    highlighted={highlightedCitation === gi + 1}
                    chunkCount={group.count}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
