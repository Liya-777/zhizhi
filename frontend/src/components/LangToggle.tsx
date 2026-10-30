import { Globe } from 'lucide-react';
import { useAppSettings } from '../appSettings';

interface Props {
  lang: 'zh' | 'en';
  onToggle: (next: 'zh' | 'en') => void;
}

export default function LangToggle({ lang, onToggle }: Props) {
  const { t } = useAppSettings();
  const isZh = lang === 'zh';

  return (
    <div className="flex flex-col gap-2">
      <span
        className="text-xs font-medium"
        style={{ color: "var(--text-muted)", letterSpacing: '0.02em' }}
      >
        <Globe className="w-3.5 h-3.5 inline mr-1.5" style={{ color: "var(--text-muted)" }} />
        {t('settings.language')}
      </span>

      <div className="flex items-center gap-2">
        {/* Left label — fixed width keeps switches aligned */}
        <span
          className="text-xs font-medium select-none transition-colors duration-200 inline-block text-right"
          style={{ width: '52px', color: isZh ? "var(--text-primary)" : "var(--text-muted)" }}
        >
          {t("中文")}</span>

        {/* Switch */}
        <button
          onClick={() => onToggle(isZh ? 'en' : 'zh')}
          className="relative flex-shrink-0 rounded-full transition-all duration-200 ease-out focus:outline-none"
          style={{
            width: '44px',
            height: '24px',
            backgroundColor: isZh
              ? 'var(--border)'
              : 'oklch(0.35 0 0 / 0.12)',
            border: isZh
              ? '1px solid var(--border-strong)'
              : '1px solid oklch(0.35 0 0 / 0.18)',
            cursor: 'pointer',
          }}
          role="switch"
          aria-checked={!isZh}
          aria-label={isZh ? 'Switch to English' : t("切换到简体中文")}
        >
          <span
            className="absolute top-1/2 -translate-y-1/2 rounded-full transition-all duration-200 ease-out"
            style={{
              width: '18px',
              height: '18px',
              left: isZh ? '2px' : '23px',
              backgroundColor: isZh
                ? 'oklch(0.48 0 0)'
                : 'oklch(0.35 0 0)',
              boxShadow: isZh
                ? '0 1px 2px oklch(0 0 0 / 0.3)'
                : '0 1px 3px oklch(0.35 0 0 / 0.25)',
            }}
          />
        </button>

        {/* Right label — fixed width keeps switches aligned */}
        <span
          className="text-xs font-medium select-none transition-colors duration-200 inline-block"
          style={{ width: '52px', color: !isZh ? "var(--text-primary)" : "var(--text-muted)" }}
        >
          English
        </span>
      </div>
    </div>
  );
}
