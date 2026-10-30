import { useRef, useEffect, useState, useCallback } from 'react';
import { MessageSquareText } from 'lucide-react';
import QuestionInput from './QuestionInput';
import AnswerCard from './AnswerCard';
import { EmptyStateQA } from './EmptyState';
import type { ChatMessage } from '../types';
import { useAppSettings } from '../appSettings';

interface Props {
  messages: ChatMessage[];
  isStreaming: boolean;
  hasDocuments: boolean;
  docCount: number;
  onAsk: (q: string) => void;
  onCancelStream?: () => void;
  mockMode: boolean;
  lastFailedQuestion?: string;
}

export default function QAPanel({
  messages, isStreaming, hasDocuments, docCount, onAsk, onCancelStream, mockMode, lastFailedQuestion,
}: Props) {
  const { t } = useAppSettings();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [highlightedCitation, setHighlightedCitation] = useState<number | null>(null);

  // Auto-scroll to bottom when messages or streaming content changes
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Handle citation click: scroll to source and highlight it
  const handleCitationClick = useCallback((index: number) => {
    setHighlightedCitation(index);
    const el = document.querySelector(`[data-source-index="${index}"]`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(() => setHighlightedCitation(null), 1500);
  }, []);

  return (
    <div className="relative flex flex-col flex-1 min-h-0">
      {/* Chat messages area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto min-h-0 pr-3 space-y-4"
      >
        {messages.length === 0 ? (
          <EmptyStateQA hasDocuments={hasDocuments} onSampleClick={onAsk} docCount={docCount} />
        ) : (
          messages.map((msg, i) => {
            const isUser = msg.role === 'user';
            const isLastAI = !isUser && i === messages.length - 1;

            if (isUser) {
              return (
                <div key={i} className="flex justify-end animate-spring-pop">
                  <div
                    className="max-w-[80%] px-4 py-2.5 rounded-2xl rounded-br-md"
                    style={{
                      backgroundColor: 'oklch(0.35 0 0)',
                      color: 'white',
                    }}
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              );
            }

            // Assistant message
            const isStreamingThis = isLastAI && msg.isStreaming;
            const prevMsg = i > 0 ? messages[i - 1] : null;
            const questionForThis = prevMsg?.role === 'user' ? prevMsg.content : undefined;

            return (
              <div key={i} className="flex gap-3 animate-spring-pop">
                <div
                  className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: 'linear-gradient(160deg, oklch(0.48 0 0) 0%, oklch(0.35 0 0) 40%, oklch(0.22 0 0) 100%)' }}
                >
                  <MessageSquareText className="w-3.5 h-3.5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <AnswerCard
                    result={isStreamingThis ? null : {
                      answer: msg.content,
                      mode: msg.mode || (mockMode ? 'mock' : 'llm'),
                      sources: msg.sources || [],
                      processing_time_ms: msg.processingTimeMs || 0,
                    }}
                    loading={false}
                    streaming={isStreamingThis}
                    streamingText={isStreamingThis ? msg.content : undefined}
                    streamSources={msg.sources}
                    streamMode={msg.mode || (mockMode ? 'mock' : 'llm')}
                    streamProcessingTimeMs={msg.processingTimeMs}
                    onCitationClick={handleCitationClick}
                    highlightedCitation={highlightedCitation}
                    questionText={questionForThis}
                    compact
                  />
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Retry banner for failed answers */}
      {lastFailedQuestion && !isStreaming && (
        <div className="flex-shrink-0 flex items-center justify-center gap-2 py-2">
          <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>{t('qa.answerFailed')}</span>
          <button onClick={() => onAsk(lastFailedQuestion)}
          aria-label={t('qa.retry')}
          className="text-[11px] px-2.5 py-1 rounded-full font-medium transition-colors"
            style={{ backgroundColor: 'var(--surface-muted)', color: "var(--text-primary)", border: 'none', cursor: 'pointer' }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--border)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'var(--surface-muted)'}
          >{t('qa.retry')}</button>
        </div>
      )}

      {/* Input pinned at bottom */}
      <div className="flex-shrink-0 pt-1">
        <QuestionInput
          onSubmit={onAsk}
          loading={isStreaming}
          hasDocuments={hasDocuments}
          mockMode={mockMode}
          isStreaming={isStreaming}
          onCancelStream={onCancelStream}
        />
      </div>
    </div>
  );
}
