import { useAppSettings } from '../appSettings';
import { Loader2 } from 'lucide-react';

interface Props {
  mockMode: boolean;
  switching: boolean;
  onToggle: () => void;
  compact?: boolean;
}

export default function ModeToggle({ mockMode, switching, onToggle, compact }: Props) {
  const { t } = useAppSettings();
  return (
    <div className={compact ? 'flex items-center gap-2' : 'flex flex-col gap-2'}>
      {/* Label — only in full mode */}
      {!compact && (
        <span
          className="text-xs font-medium"
          style={{ color: "var(--text-muted)", letterSpacing: '0.02em' }}
        >
          {t("RAG 模式")}</span>
      )}

      {/* Toggle row */}
      <div className="flex items-center gap-2">
        {/* Mock label */}
        <span
          className="text-xs font-medium select-none transition-colors duration-200"
          style={{
            color: mockMode ? "var(--text-primary)" : "var(--text-muted)",
            fontSize: compact ? '0.6875rem' : undefined,
          }}
        >
          Mock
        </span>

        {/* Switch */}
        <button
          onClick={onToggle}
          disabled={switching}
          className="relative flex-shrink-0 rounded-full transition-all duration-200 ease-out focus:outline-none"
          style={{
            width: compact ? '36px' : '44px',
            height: compact ? '20px' : '24px',
            backgroundColor: mockMode
              ? 'var(--border)'
              : 'oklch(0.35 0 0 / 0.12)',
            border: mockMode
              ? '1px solid var(--border-strong)'
              : '1px solid oklch(0.35 0 0 / 0.18)',
          }}
          role="switch"
          aria-checked={!mockMode}
          aria-label={mockMode ? t("切换到 AI 检索模式") : t("切换到 Mock 本地模式")}
        >
          <span
            className="absolute top-1/2 -translate-y-1/2 rounded-full transition-all duration-200 ease-out"
            style={{
              width: compact ? '14px' : '18px',
              height: compact ? '14px' : '18px',
              left: mockMode ? '2px' : (compact ? '20px' : '23px'),
              backgroundColor: mockMode
                ? 'oklch(0.48 0 0)'
                : 'oklch(0.35 0 0)',
              boxShadow: mockMode
                ? '0 1px 2px oklch(0 0 0 / 0.3)'
                : '0 1px 3px oklch(0.52 0.24 255 / 0.25)',
            }}
          />
        </button>

        {/* AI label */}
        <span
          className="text-xs font-medium select-none transition-colors duration-200"
          style={{
            color: !mockMode ? "var(--text-primary)" : "var(--text-muted)",
            fontSize: compact ? '0.6875rem' : undefined,
          }}
        >
          {t("AI 检索")}</span>

        {switching && (
          <Loader2
            className="w-3 h-3 animate-spin"
            style={{ color: "var(--text-strong)" }}
          />
        )}
      </div>
    </div>
  );
}
