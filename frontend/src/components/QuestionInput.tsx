import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { Send, Loader2, Square } from 'lucide-react';
import { useAppSettings } from '../appSettings';

interface Props {
  onSubmit: (question: string) => void;
  loading: boolean;
  hasDocuments: boolean;
  mockMode?: boolean;
  isStreaming?: boolean;
  onCancelStream?: () => void;
}

export default function QuestionInput({ onSubmit, loading, hasDocuments, mockMode, isStreaming, onCancelStream }: Props) {
  const { t } = useAppSettings();
  const [value, setValue] = useState('');
  const [squish, setSquish] = useState(false);
  const [focused, setFocused] = useState(false);

  const getPlaceholder = () => {
    if (!hasDocuments) return t('input.noDocs');
    if (mockMode === undefined) return t('input.example');
    return mockMode ? t('input.mock') : t('input.ask');
  };

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = Math.min(el.scrollHeight, 150) + 'px';
    }
  }, [value]);

  const handleSubmit = () => {
    if (isStreaming) {
      onCancelStream?.();
      return;
    }
    const trimmed = value.trim();
    if (!trimmed || loading || !hasDocuments) return;
    setSquish(true);
    setTimeout(() => setSquish(false), 250);
    onSubmit(trimmed);
    setValue('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === 'Escape' && isStreaming) {
      e.preventDefault();
      onCancelStream?.();
    }
  };

  const canSubmit = value.trim() && hasDocuments && !loading;
  const isStop = isStreaming;

  return (
    <div className="relative">
      <div
        className="relative flex items-end gap-2 p-2 rounded-2xl transition-all duration-300"
        style={{
          backgroundColor: hasDocuments ? 'var(--surface)' : 'var(--surface-muted)',
          border: `1.5px solid ${focused ? 'oklch(0.35 0 0)' : 'var(--border)'}`,
          animation: !focused && hasDocuments ? 'borderFlow 4s ease-in-out infinite' : 'none',
          boxShadow: focused ? '0 2px 16px oklch(0 0 0 / 0.06)' : 'none',
        }}
      >
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isStreaming ? t('input.answering') : getPlaceholder()}
          disabled={!hasDocuments || loading}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          aria-label={isStreaming ? t('input.stop') : t('input.ask')}
          rows={1}
          className="flex-1 resize-none bg-transparent px-2 py-2 text-sm focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed self-center"
          style={{ color: "var(--text-primary)" }}
        />

        <button
          onClick={handleSubmit}
          disabled={!canSubmit && !isStop}
          className={`flex-shrink-0 p-2.5 rounded-xl transition-all duration-300 ${squish ? 'animate-squish' : ''}`}
          style={{
            backgroundColor: isStop
              ? 'oklch(0.52 0.22 21 / 0.12)'
              : canSubmit
                ? 'oklch(0.35 0 0)'
                : 'var(--surface-muted)',
            color: isStop
              ? "var(--text-danger)"
              : canSubmit
                ? 'white'
                : "var(--text-muted)",
          }}
          aria-label={isStop ? t('input.stop') : t('input.send')}
        >
          {loading && !isStop ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : isStop ? (
            <Square className="w-4 h-4" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </button>
      </div>

      {value.length > 0 && (
        <div
          className="absolute -bottom-5 right-2 text-[10px] animate-fade-in"
          style={{ color: "var(--text-secondary)" }}
        >
          {value.length}/2000
        </div>
      )}
    </div>
  );
}
