import { Sun, Moon } from 'lucide-react';
import { useAppSettings } from '../appSettings';

interface Props {
  theme: 'light' | 'dark';
  onToggle: (next: 'light' | 'dark') => void;
}

export default function ThemeToggle({ theme, onToggle }: Props) {
  const { t } = useAppSettings();
  const isLight = theme === 'light';

  return (
    <div className="flex flex-col gap-2">
      <span
        className="text-xs font-medium"
        style={{ color: "var(--text-muted)", letterSpacing: '0.02em' }}
      >
        <Sun className="w-3.5 h-3.5 inline mr-1.5" style={{ color: "var(--text-muted)" }} />
        {t('settings.appearanceMode')}
      </span>

      <div className="flex items-center gap-2">
        {/* Left label — fixed width matches LangToggle for visual alignment */}
        <span
          className="text-xs font-medium select-none transition-colors duration-200 inline-block text-right"
          style={{ width: '52px', color: isLight ? "var(--text-primary)" : "var(--text-muted)" }}
        >
          <Sun className="w-3.5 h-3.5 inline mr-1" />
          {t('settings.light')}
        </span>

        {/* Switch */}
        <button
          onClick={() => onToggle(isLight ? 'dark' : 'light')}
          className="relative flex-shrink-0 rounded-full transition-all duration-200 ease-out focus:outline-none"
          style={{
            width: '44px',
            height: '24px',
            backgroundColor: isLight
              ? 'var(--border)'
              : 'oklch(0.35 0 0 / 0.12)',
            border: isLight
              ? '1px solid var(--border-strong)'
              : '1px solid oklch(0.35 0 0 / 0.18)',
            cursor: 'pointer',
          }}
          role="switch"
          aria-checked={!isLight}
          aria-label={isLight ? t('settings.darkAria') : t('settings.lightAria')}
        >
          <span
            className="absolute top-1/2 -translate-y-1/2 rounded-full transition-all duration-200 ease-out shadow-md"
            style={{
              width: '18px',
              height: '18px',
              left: isLight ? '2px' : '23px',
              backgroundColor: isLight
                ? 'oklch(0.48 0 0)'
                : 'oklch(0.55 0.18 65)',
              boxShadow: isLight
                ? '0 1px 2px oklch(0 0 0 / 0.3)'
                : '0 0 8px oklch(0.55 0.18 65 / 0.4)',
            }}
          />
        </button>

        {/* Right label — fixed width matches LangToggle for visual alignment */}
        <span
          className="text-xs font-medium select-none transition-colors duration-200 inline-block"
          style={{ width: '52px', color: !isLight ? "var(--text-primary)" : "var(--text-muted)" }}
        >
          <Moon className="w-3.5 h-3.5 inline mr-1" />
          {t('settings.dark')}
        </span>
      </div>
    </div>
  );
}
